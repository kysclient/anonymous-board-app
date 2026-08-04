import { randomUUID } from "node:crypto";
import Redis from "ioredis";
import WebSocket from "ws";
import {
  SMOKING_ROOM_IDS,
  SMOKING_ROOM_MOODS,
  type SmokingRoomClientEvent,
  type SmokingRoomId,
  type SmokingRoomMessage,
  type SmokingRoomMood,
  type SmokingRoomServerEvent,
} from "./types";

interface Session {
  clientId: string;
  name: string;
  roomId: SmokingRoomId;
  presenceId: string;
  lastMessageAt: number;
}

interface SmokingRoomReport {
  id: string;
  reporterClientId: string;
  roomId: SmokingRoomId;
  message: SmokingRoomMessage;
  reason: string;
  createdAt: number;
}

const EVENT_CHANNEL = "spicy:smoking-room:events";
const REPORTS_KEY = "spicy:smoking-room:reports";
const HISTORY_LIMIT = 40;
const HISTORY_TTL_SECONDS = 60 * 60 * 24;
const REPORT_TTL_SECONDS = 60 * 60 * 24 * 7;
const PRESENCE_STALE_MS = 60_000;
const MESSAGE_COOLDOWN_MS = 1_500;

const sessions = new Map<WebSocket, Session>();
const localMessages = new Map<SmokingRoomId, SmokingRoomMessage[]>();
const localReports: SmokingRoomReport[] = [];

const redisUrl = process.env.REDIS_URL;
const redis = redisUrl
  ? new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 2 })
  : null;
const subscriber = redisUrl
  ? new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: null })
  : null;
let subscriberReady: Promise<void> | null = null;

function historyKey(roomId: SmokingRoomId) {
  return `spicy:smoking-room:messages:${roomId}`;
}

function presenceKey(roomId: SmokingRoomId) {
  return `spicy:smoking-room:presence:${roomId}`;
}

function localRoomMessages(roomId: SmokingRoomId) {
  const messages = localMessages.get(roomId) ?? [];
  if (!localMessages.has(roomId)) localMessages.set(roomId, messages);
  return messages;
}

function localOnline(roomId: SmokingRoomId) {
  let online = 0;
  for (const session of sessions.values()) {
    if (session.roomId === roomId) online += 1;
  }
  return online;
}

function sanitizeClientId(value: string) {
  return value.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 64);
}

function sanitizeName(value: string) {
  return value
    .replace(/[<>\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 12) || "익명 손님";
}

function sanitizeText(value: string) {
  return value
    .replace(/[<>\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function sanitizeRoomId(value: SmokingRoomId): SmokingRoomId {
  return SMOKING_ROOM_IDS.includes(value) ? value : "rooftop";
}

function sanitizeMood(value: SmokingRoomMood): SmokingRoomMood {
  return SMOKING_ROOM_MOODS.includes(value) ? value : "chill";
}

function safeSend(socket: WebSocket, event: SmokingRoomServerEvent) {
  if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(event));
}

function broadcastLocal(event: SmokingRoomServerEvent) {
  const roomId = "roomId" in event ? event.roomId : null;
  for (const [socket, session] of sessions) {
    if (!roomId || session.roomId === roomId) safeSend(socket, event);
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
        broadcastLocal(JSON.parse(payload) as SmokingRoomServerEvent);
      } catch {
        // Ignore malformed pub/sub frames.
      }
    });
    await subscriber.subscribe(EVENT_CHANNEL);
  })();
  return subscriberReady;
}

async function publish(event: SmokingRoomServerEvent) {
  if (redis) {
    await ensureRedis(redis);
    await ensureSubscriber();
    await redis.publish(EVENT_CHANNEL, JSON.stringify(event));
    return;
  }
  broadcastLocal(event);
}

async function readMessages(roomId: SmokingRoomId) {
  const cutoff = Date.now() - HISTORY_TTL_SECONDS * 1000;
  if (!redis) {
    return localRoomMessages(roomId).filter((message) => message.createdAt >= cutoff);
  }
  await ensureRedis(redis);
  const payloads = await redis.lrange(historyKey(roomId), 0, HISTORY_LIMIT - 1);
  return payloads
    .map((payload) => {
      try {
        return JSON.parse(payload) as SmokingRoomMessage;
      } catch {
        return null;
      }
    })
    .filter(
      (message): message is SmokingRoomMessage =>
        Boolean(message && message.createdAt >= cutoff && message.roomId === roomId)
    )
    .reverse();
}

async function saveMessage(message: SmokingRoomMessage) {
  if (!redis) {
    const messages = localRoomMessages(message.roomId);
    messages.push(message);
    const cutoff = Date.now() - HISTORY_TTL_SECONDS * 1000;
    while (messages[0]?.createdAt < cutoff) messages.shift();
    if (messages.length > HISTORY_LIMIT) messages.shift();
    return;
  }
  await ensureRedis(redis);
  const key = historyKey(message.roomId);
  await redis
    .multi()
    .lpush(key, JSON.stringify(message))
    .ltrim(key, 0, HISTORY_LIMIT - 1)
    .expire(key, HISTORY_TTL_SECONDS)
    .exec();
}

async function updatePresence(roomId: SmokingRoomId, presenceId: string) {
  if (!redis) return localOnline(roomId);
  await ensureRedis(redis);
  const now = Date.now();
  const key = presenceKey(roomId);
  await redis
    .multi()
    .zremrangebyscore(key, 0, now - PRESENCE_STALE_MS)
    .zadd(key, now, presenceId)
    .expire(key, 120)
    .exec();
  return redis.zcard(key);
}

async function removePresence(roomId: SmokingRoomId, presenceId: string) {
  if (!redis) {
    let online = 0;
    for (const session of sessions.values()) {
      if (session.roomId === roomId && session.presenceId !== presenceId) online += 1;
    }
    return online;
  }
  await ensureRedis(redis);
  const now = Date.now();
  const key = presenceKey(roomId);
  await redis
    .multi()
    .zrem(key, presenceId)
    .zremrangebyscore(key, 0, now - PRESENCE_STALE_MS)
    .exec();
  return redis.zcard(key);
}

async function publishPresence(roomId: SmokingRoomId, online: number) {
  await publish({ type: "presence", roomId, online });
}

async function join(socket: WebSocket, event: Extract<SmokingRoomClientEvent, { type: "join" }>) {
  const clientId = sanitizeClientId(event.clientId);
  if (clientId.length < 8) {
    safeSend(socket, { type: "error", message: "접속 정보를 확인하지 못했어요. 새로고침해주세요." });
    return;
  }

  const previous = sessions.get(socket);
  if (previous) {
    const previousOnline = await removePresence(previous.roomId, previous.presenceId);
    await publishPresence(previous.roomId, previousOnline);
  }

  const roomId = sanitizeRoomId(event.roomId);
  const session: Session = {
    clientId,
    name: sanitizeName(event.name),
    roomId,
    presenceId: randomUUID(),
    lastMessageAt: 0,
  };
  sessions.set(socket, session);
  await ensureSubscriber();
  const [messages, online] = await Promise.all([
    readMessages(roomId),
    updatePresence(roomId, session.presenceId),
  ]);
  safeSend(socket, { type: "snapshot", roomId, messages, online });
  await publishPresence(roomId, online);
}

async function updateProfile(socket: WebSocket, rawName: string) {
  const session = sessions.get(socket);
  if (!session) return;
  session.name = sanitizeName(rawName);
  await updatePresence(session.roomId, session.presenceId);
}

async function teleport(socket: WebSocket, rawRoomId: SmokingRoomId) {
  const session = sessions.get(socket);
  if (!session) return;
  const nextRoomId = sanitizeRoomId(rawRoomId);
  const previousRoomId = session.roomId;

  if (previousRoomId !== nextRoomId) {
    const previousOnline = await removePresence(previousRoomId, session.presenceId);
    await publishPresence(previousRoomId, previousOnline);
    session.roomId = nextRoomId;
  }

  const [messages, online] = await Promise.all([
    readMessages(nextRoomId),
    updatePresence(nextRoomId, session.presenceId),
  ]);
  safeSend(socket, { type: "snapshot", roomId: nextRoomId, messages, online });
  await publishPresence(nextRoomId, online);
}

async function speak(
  socket: WebSocket,
  event: Extract<SmokingRoomClientEvent, { type: "speak" }>
) {
  const session = sessions.get(socket);
  if (!session) return;

  const now = Date.now();
  if (now - session.lastMessageAt < MESSAGE_COOLDOWN_MS) {
    safeSend(socket, { type: "error", message: "한 모금 쉬고 남겨주세요." });
    return;
  }

  const text = sanitizeText(event.text);
  if (!text) return;
  session.lastMessageAt = now;
  await updatePresence(session.roomId, session.presenceId);

  const message: SmokingRoomMessage = {
    id: randomUUID(),
    clientId: session.clientId,
    name: session.name,
    text,
    mood: sanitizeMood(event.mood),
    roomId: session.roomId,
    createdAt: now,
  };
  await saveMessage(message);
  await publish({ type: "message", roomId: session.roomId, message });
}

async function reportMessage(
  socket: WebSocket,
  event: Extract<SmokingRoomClientEvent, { type: "report" }>
) {
  const session = sessions.get(socket);
  if (!session) return;
  const messageId = sanitizeClientId(event.messageId);
  const message = (await readMessages(session.roomId)).find((item) => item.id === messageId);
  if (!message) {
    safeSend(socket, { type: "error", message: "신고할 한마디가 이미 사라졌어요." });
    return;
  }

  const report: SmokingRoomReport = {
    id: randomUUID(),
    reporterClientId: session.clientId,
    roomId: session.roomId,
    message,
    reason: sanitizeText(event.reason) || "불편한 내용",
    createdAt: Date.now(),
  };

  if (redis) {
    await ensureRedis(redis);
    await redis
      .multi()
      .lpush(REPORTS_KEY, JSON.stringify(report))
      .ltrim(REPORTS_KEY, 0, 499)
      .expire(REPORTS_KEY, REPORT_TTL_SECONDS)
      .exec();
  } else {
    localReports.push(report);
    if (localReports.length > 500) localReports.shift();
  }
  safeSend(socket, { type: "report-received", messageId });
}

async function ping(socket: WebSocket) {
  const session = sessions.get(socket);
  if (!session) return;
  const online = await updatePresence(session.roomId, session.presenceId);
  safeSend(socket, { type: "pong", roomId: session.roomId, online });
}

async function disconnect(socket: WebSocket) {
  const session = sessions.get(socket);
  if (!session) return;
  sessions.delete(socket);
  try {
    const online = await removePresence(session.roomId, session.presenceId);
    await publishPresence(session.roomId, online);
  } catch {
    // A stale presence expires automatically even if Redis is briefly unavailable.
  }
}

export function registerSmokingRoomSocket(socket: WebSocket) {
  socket.on("message", (raw) => {
    void (async () => {
      try {
        if (raw.toString().length > 2_048) return;
        const event = JSON.parse(raw.toString()) as SmokingRoomClientEvent;
        if (event.type === "join") await join(socket, event);
        else if (event.type === "profile") await updateProfile(socket, event.name);
        else if (event.type === "speak") await speak(socket, event);
        else if (event.type === "teleport") await teleport(socket, event.roomId);
        else if (event.type === "report") await reportMessage(socket, event);
        else if (event.type === "ping") await ping(socket);
      } catch (error) {
        safeSend(socket, {
          type: "error",
          message: error instanceof Error ? error.message : "요청을 처리하지 못했어요.",
        });
      }
    })();
  });

  socket.on("close", () => void disconnect(socket));
  socket.on("error", () => void disconnect(socket));
  void ensureSubscriber().catch((error) => {
    console.error("[smoking-room] Redis subscriber connection failed", error);
  });
}
