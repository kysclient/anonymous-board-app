import { randomUUID } from "node:crypto";
import Redis from "ioredis";
import WebSocket from "ws";
import { findWinningLine, isBoardFull } from "./rules";
import {
  BOARD_SIZE,
  createEmptyBoard,
  type OmokChatMessage,
  type OmokClientEvent,
  type OmokRoomState,
  type OmokRoomSummary,
  type OmokServerEvent,
} from "./types";

interface Session {
  roomId: string;
  clientId: string;
  name: string;
  spectator: boolean;
  lastMoveAt: number;
}

const ROOM_TTL_SECONDS = 60 * 60 * 6;
const COUNTDOWN_MS = 3000;
const EVENT_CHANNEL = "spicy:omok:events";
const localRooms = new Map<string, OmokRoomState>();
const sessions = new Map<WebSocket, Session>();

const redisUrl = process.env.REDIS_URL;
const redis = redisUrl
  ? new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 2 })
  : null;
const subscriber = redisUrl
  ? new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: null })
  : null;
let subscriberReady: Promise<void> | null = null;

function sanitizeRoomId(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
}

function sanitizeName(value: string) {
  return value.replace(/[<>]/g, "").trim().slice(0, 12) || "익명 기사";
}

function safeSend(socket: WebSocket, event: OmokServerEvent) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(event));
}

function broadcastLocal(roomId: string, event: OmokServerEvent) {
  for (const [socket, session] of sessions) {
    if (session.roomId === roomId) safeSend(socket, event);
  }
}

async function ensureRedis(client: Redis | null) {
  if (client?.status === "wait") await client.connect();
}

async function ensureSubscriber() {
  if (!subscriber || subscriberReady) return subscriberReady;
  subscriberReady = (async () => {
    await ensureRedis(subscriber);
    subscriber.on("message", (_channel, payload) => {
      try {
        const event = JSON.parse(payload) as OmokServerEvent;
        if (event.type === "state") broadcastLocal(event.state.roomId, event);
      } catch {
        // Ignore malformed pub/sub frames.
      }
    });
    await subscriber.subscribe(EVENT_CHANNEL);
  })();
  return subscriberReady;
}

function createRoom(roomId: string, title: string): OmokRoomState {
  const now = Date.now();
  return {
    roomId,
    title: sanitizeRoomTitle(title),
    createdAt: now,
    hostClientId: "",
    board: createEmptyBoard(),
    players: [],
    spectators: 0,
    status: "waiting",
    countdownEndsAt: 0,
    turn: 1,
    winner: 0,
    winningLine: [],
    moves: [],
    chats: [],
    rematchVotes: [],
    round: 1,
    updatedAt: now,
  };
}

function sanitizeRoomTitle(value: string) {
  return value.replace(/[<>]/g, "").trim().slice(0, 24) || "새로운 대국실";
}

async function loadRoom(roomId: string) {
  if (redis) {
    await ensureRedis(redis);
    const stored = await redis.get(`spicy:omok:room:${roomId}`);
    if (stored) return JSON.parse(stored) as OmokRoomState;
  }
  return localRooms.get(roomId) ?? null;
}

async function saveRoom(room: OmokRoomState) {
  room.updatedAt = Date.now();
  localRooms.set(room.roomId, room);
  if (redis) {
    await ensureRedis(redis);
    await redis.setex(
      `spicy:omok:room:${room.roomId}`,
      ROOM_TTL_SECONDS,
      JSON.stringify(room)
    );
  }
}

async function deleteRoom(roomId: string) {
  localRooms.delete(roomId);
  if (redis) {
    await ensureRedis(redis);
    await redis.del(`spicy:omok:room:${roomId}`);
  }
}

// The host is always the longest-seated remaining player, preferring a connected one.
function reassignHost(room: OmokRoomState) {
  if (room.players.some((player) => player.clientId === room.hostClientId && player.connected)) return;
  room.hostClientId =
    room.players.find((player) => player.connected)?.clientId ??
    room.players[0]?.clientId ??
    "";
}

async function publishState(room: OmokRoomState) {
  await saveRoom(room);
  const event: OmokServerEvent = { type: "state", state: room };
  if (redis) {
    await ensureSubscriber();
    await redis.publish(EVENT_CHANNEL, JSON.stringify(event));
  } else {
    broadcastLocal(room.roomId, event);
  }
}

async function withRoomLock<T>(roomId: string, work: () => Promise<T>) {
  if (!redis) return work();
  await ensureRedis(redis);
  const key = `spicy:omok:lock:${roomId}`;
  const token = randomUUID();
  const acquired = await redis.set(key, token, "PX", 2500, "NX");
  if (!acquired) throw new Error("잠시 후 다시 시도해주세요.");
  try {
    return await work();
  } finally {
    await redis.eval(
      "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
      1,
      key,
      token
    );
  }
}

function systemChat(text: string): OmokChatMessage {
  return {
    id: randomUUID(),
    clientId: "system",
    name: "SYSTEM",
    text,
    createdAt: Date.now(),
    system: true,
  };
}

async function joinRoom(socket: WebSocket, event: Extract<OmokClientEvent, { type: "join" }>) {
  const roomId = sanitizeRoomId(event.roomId);
  const clientId = event.clientId.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
  const name = sanitizeName(event.name);
  if (roomId.length < 4 || clientId.length < 8) {
    safeSend(socket, { type: "error", message: "방 코드 또는 접속 정보가 올바르지 않습니다." });
    return;
  }

  await withRoomLock(roomId, async () => {
    const room = (await loadRoom(roomId)) ?? createRoom(roomId, event.roomTitle || `${name}의 대국실`);
    room.title ||= `${room.players[0]?.name ?? name}의 대국실`;
    room.createdAt ||= room.updatedAt || Date.now();
    room.hostClientId ??= "";
    room.countdownEndsAt ??= 0;
    let player = room.players.find((item) => item.clientId === clientId);
    let spectator = false;

    if (player) {
      player.name = name;
      player.connected = true;
    } else if (room.players.length < 2) {
      const usedColors = new Set(room.players.map((item) => item.color));
      player = {
        clientId,
        name,
        color: usedColors.has(1) ? 2 : 1,
        connected: true,
      };
      room.players.push(player);
      room.chats.push(systemChat(`${name}님이 ${player.color === 1 ? "흑" : "백"}으로 입장했습니다.`));
    } else {
      spectator = true;
      room.spectators += 1;
    }

    reassignHost(room);
    room.chats = room.chats.slice(-40);
    sessions.set(socket, { roomId, clientId, name, spectator, lastMoveAt: 0 });
    await publishState(room);
    safeSend(socket, { type: "state", state: room });
  });
}

function summarizeRoom(room: OmokRoomState): OmokRoomSummary {
  return {
    roomId: room.roomId,
    title: room.title || `${room.players[0]?.name ?? "익명"}의 대국실`,
    status: room.status,
    players: room.players.map(({ name, color, connected }) => ({ name, color, connected })),
    spectators: room.spectators,
    moves: room.moves.length,
    round: room.round,
    updatedAt: room.updatedAt,
  };
}

export async function listOmokRooms(): Promise<OmokRoomSummary[]> {
  const rooms = new Map<string, OmokRoomState>(localRooms);

  if (redis) {
    await ensureRedis(redis);
    let cursor = "0";
    const keys: string[] = [];
    do {
      const [nextCursor, page] = await redis.scan(
        cursor,
        "MATCH",
        "spicy:omok:room:*",
        "COUNT",
        100
      );
      cursor = nextCursor;
      keys.push(...page);
    } while (cursor !== "0" && keys.length < 200);

    if (keys.length) {
      const payloads = await redis.mget(...keys.slice(0, 200));
      for (const payload of payloads) {
        if (!payload) continue;
        try {
          const room = JSON.parse(payload) as OmokRoomState;
          rooms.set(room.roomId, room);
        } catch {
          // Ignore stale or malformed room records.
        }
      }
    }
  }

  return [...rooms.values()]
    .filter((room) => Date.now() - room.updatedAt < ROOM_TTL_SECONDS * 1000)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 30)
    .map(summarizeRoom);
}

async function placeStone(socket: WebSocket, row: number, col: number) {
  const session = sessions.get(socket);
  if (!session || session.spectator) return;
  if (!Number.isInteger(row) || !Number.isInteger(col) || row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return;
  if (Date.now() - session.lastMoveAt < 180) return;
  session.lastMoveAt = Date.now();

  await withRoomLock(session.roomId, async () => {
    const room = await loadRoom(session.roomId);
    if (!room || room.status !== "playing") return;
    const player = room.players.find((item) => item.clientId === session.clientId);
    if (!player || player.color !== room.turn || room.board[row][col] !== 0) return;
    if (room.players.some((item) => !item.connected)) {
      safeSend(socket, { type: "error", message: "상대가 다시 접속할 때까지 기다려주세요." });
      return;
    }

    room.board[row][col] = player.color;
    room.moves.push({ row, col, color: player.color, move: room.moves.length + 1 });
    room.winningLine = findWinningLine(room.board, row, col, player.color);

    if (room.winningLine.length) {
      room.status = "finished";
      room.winner = player.color;
      room.chats.push(systemChat(`${player.name}님이 승리했습니다.`));
    } else if (isBoardFull(room.board)) {
      room.status = "finished";
      room.winner = 0;
      room.chats.push(systemChat("빈자리가 없습니다. 무승부입니다."));
    } else {
      room.turn = player.color === 1 ? 2 : 1;
    }

    await publishState(room);
  });
}

function scheduleCountdown(roomId: string) {
  setTimeout(() => {
    void withRoomLock(roomId, async () => {
      const room = await loadRoom(roomId);
      if (!room || room.status !== "countdown") return;
      if (room.players.filter((player) => player.connected).length < 2) {
        room.status = "waiting";
        room.countdownEndsAt = 0;
        await publishState(room);
        return;
      }
      room.status = "playing";
      room.countdownEndsAt = 0;
      room.chats.push(systemChat("대국을 시작합니다!"));
      await publishState(room);
    }).catch(() => undefined);
  }, COUNTDOWN_MS);
}

async function startGame(socket: WebSocket) {
  const session = sessions.get(socket);
  if (!session || session.spectator) return;

  await withRoomLock(session.roomId, async () => {
    const room = await loadRoom(session.roomId);
    if (!room) return;
    if (room.hostClientId !== session.clientId) {
      safeSend(socket, { type: "error", message: "방장만 대국을 시작할 수 있습니다." });
      return;
    }
    if (room.status !== "waiting") return;
    if (room.players.filter((player) => player.connected).length < 2) {
      safeSend(socket, { type: "error", message: "두 기사가 모두 접속해야 시작할 수 있습니다." });
      return;
    }

    room.board = createEmptyBoard();
    room.moves = [];
    room.turn = 1;
    room.winner = 0;
    room.winningLine = [];
    room.rematchVotes = [];
    room.status = "countdown";
    room.countdownEndsAt = Date.now() + COUNTDOWN_MS;
    room.chats.push(systemChat("잠시 후 대국을 시작합니다."));
    await publishState(room);
    scheduleCountdown(room.roomId);
  });
}

async function postChat(socket: WebSocket, rawText: string) {
  const session = sessions.get(socket);
  const text = rawText.replace(/[<>]/g, "").trim().slice(0, 120);
  if (!session || !text) return;

  await withRoomLock(session.roomId, async () => {
    const room = await loadRoom(session.roomId);
    if (!room) return;
    room.chats.push({
      id: randomUUID(),
      clientId: session.clientId,
      name: session.name,
      text,
      createdAt: Date.now(),
    });
    room.chats = room.chats.slice(-40);
    await publishState(room);
  });
}

async function voteRematch(socket: WebSocket) {
  const session = sessions.get(socket);
  if (!session || session.spectator) return;

  await withRoomLock(session.roomId, async () => {
    const room = await loadRoom(session.roomId);
    if (!room || room.status !== "finished") return;
    if (!room.rematchVotes.includes(session.clientId)) room.rematchVotes.push(session.clientId);

    const playerIds = room.players.map((player) => player.clientId);
    if (playerIds.length === 2 && playerIds.every((id) => room.rematchVotes.includes(id))) {
      room.players = room.players
        .map((player) => ({ ...player, color: (player.color === 1 ? 2 : 1) as 1 | 2 }))
        .sort((a, b) => a.color - b.color);
      room.board = createEmptyBoard();
      room.moves = [];
      room.status = "playing";
      room.turn = 1;
      room.winner = 0;
      room.winningLine = [];
      room.rematchVotes = [];
      room.round += 1;
      room.chats.push(systemChat(`ROUND ${room.round} · 흑백을 바꿔 다시 시작합니다.`));
    }
    await publishState(room);
  });
}

async function disconnect(socket: WebSocket) {
  const session = sessions.get(socket);
  sessions.delete(socket);
  if (!session) return;

  await withRoomLock(session.roomId, async () => {
    const room = await loadRoom(session.roomId);
    if (!room) return;

    if (session.spectator) {
      room.spectators = Math.max(0, room.spectators - 1);
    } else {
      const index = room.players.findIndex((item) => item.clientId === session.clientId);
      if (index !== -1) {
        // Keep a disconnected player seated only during a live game so they can reconnect.
        if (room.status === "playing") {
          room.players[index].connected = false;
        } else {
          const [left] = room.players.splice(index, 1);
          room.chats.push(systemChat(`${left.name}님이 퇴장했습니다.`));
        }
      }
    }

    reassignHost(room);

    // Delete the room once nobody (player or spectator) is connected any more.
    const online = room.players.filter((player) => player.connected).length + room.spectators;
    if (online <= 0) {
      await deleteRoom(room.roomId);
      return;
    }

    // Not enough players to keep counting down or to hold a finished board: reset to waiting.
    if (
      room.players.filter((player) => player.connected).length < 2 &&
      (room.status === "countdown" || room.status === "finished")
    ) {
      room.status = "waiting";
      room.countdownEndsAt = 0;
      room.board = createEmptyBoard();
      room.moves = [];
      room.turn = 1;
      room.winner = 0;
      room.winningLine = [];
      room.rematchVotes = [];
    }

    room.chats = room.chats.slice(-40);
    await publishState(room);
  }).catch(() => undefined);
}

export function registerOmokSocket(socket: WebSocket) {
  socket.on("message", (raw) => {
    void (async () => {
      try {
        if (raw.toString().length > 2048) return;
        const event = JSON.parse(raw.toString()) as OmokClientEvent;
        if (event.type === "join") await joinRoom(socket, event);
        else if (event.type === "place") await placeStone(socket, event.row, event.col);
        else if (event.type === "chat") await postChat(socket, event.text);
        else if (event.type === "start") await startGame(socket);
        else if (event.type === "rematch") await voteRematch(socket);
        else if (event.type === "ping") safeSend(socket, { type: "pong" });
      } catch (error) {
        safeSend(socket, {
          type: "error",
          message: error instanceof Error ? error.message : "요청을 처리하지 못했습니다.",
        });
      }
    })();
  });

  socket.on("close", () => void disconnect(socket));
  socket.on("error", () => void disconnect(socket));
  void ensureSubscriber().catch((error) => {
    console.error("[omok] Redis subscriber connection failed", error);
  });
}
