"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import {
  Check,
  CircleDot,
  Crown,
  DoorOpen,
  Eye,
  MessageCircle,
  Plus,
  RefreshCw,
  RotateCcw,
  Send,
  Share2,
  ShieldCheck,
  Swords,
  Users,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from "lucide-react";
import {
  BOARD_SIZE,
  createEmptyBoard,
  type OmokClientEvent,
  type OmokPlayer,
  type OmokRoomSummary,
  type OmokRoomState,
  type OmokServerEvent,
} from "@/lib/omok/types";
import styles from "./omok.module.css";

type ConnectionStatus = "idle" | "connecting" | "online" | "offline";

function makeRoomCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 6 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
}

function makePlayerName() {
  const prefixes = ["번개", "돌격", "무적", "잠꾸러기", "매운맛", "묵직한", "날쌘", "침착한"];
  const animals = ["참새", "호랑이", "수달", "두더지", "여우", "고양이", "판다", "독수리"];
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  return `${prefix}${animal}`;
}

function stoneName(color: 1 | 2) {
  return color === 1 ? "흑" : "백";
}

export default function OnlineOmokPage() {
  const [clientId, setClientId] = useState("");
  const [name, setName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [roomTitle, setRoomTitle] = useState("");
  const [rooms, setRooms] = useState<OmokRoomSummary[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joined, setJoined] = useState(false);
  const [connection, setConnection] = useState<ConnectionStatus>("idle");
  const [state, setState] = useState<OmokRoomState | null>(null);
  const [notice, setNotice] = useState("");
  const [chat, setChat] = useState("");
  const [copied, setCopied] = useState(false);
  const [sound, setSound] = useState(true);
  const socketRef = useRef<WebSocket | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const previousMoveCount = useRef(0);

  useEffect(() => {
    const storedId = window.localStorage.getItem("spicy-omok-client") || crypto.randomUUID();
    const storedName = window.localStorage.getItem("spicy-omok-name") || "";
    const queryRoom = new URLSearchParams(window.location.search).get("room") || "";
    window.localStorage.setItem("spicy-omok-client", storedId);
    setClientId(storedId);
    setName(storedName);
    setRoomId(queryRoom.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8));
  }, []);

  useEffect(() => {
    if (!joined || !clientId) return;
    let cancelled = false;
    let reconnectTimer: number | undefined;
    let heartbeat: number | undefined;
    let reconnectDelay = 1000;

    const connect = () => {
      if (cancelled) return;
      setConnection("connecting");
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const socket = new WebSocket(`${protocol}://${window.location.host}/api/omok`);
      socketRef.current = socket;

      socket.addEventListener("open", () => {
        reconnectDelay = 1000;
        setConnection("online");
        setNotice("");
        socket.send(JSON.stringify({ type: "join", roomId, clientId, name, roomTitle } satisfies OmokClientEvent));
        heartbeat = window.setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: "ping" } satisfies OmokClientEvent));
        }, 25000);
      });

      socket.addEventListener("message", (message) => {
        const event = JSON.parse(message.data) as OmokServerEvent;
        if (event.type === "state") setState(event.state);
        if (event.type === "error") {
          setNotice(event.message);
          window.setTimeout(() => setNotice(""), 3200);
        }
      });

      socket.addEventListener("close", () => {
        if (heartbeat) window.clearInterval(heartbeat);
        if (cancelled) return;
        setConnection("offline");
        reconnectTimer = window.setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 15000);
      });
    };

    connect();
    return () => {
      cancelled = true;
      if (heartbeat) window.clearInterval(heartbeat);
      if (reconnectTimer) window.clearTimeout(reconnectTimer);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [clientId, joined, name, roomId, roomTitle]);

  const refreshRooms = async () => {
    try {
      const response = await fetch("/api/omok/rooms", { cache: "no-store" });
      const data = await response.json() as { rooms?: OmokRoomSummary[] };
      setRooms(data.rooms ?? []);
    } catch {
      setRooms([]);
    } finally {
      setRoomsLoading(false);
    }
  };

  useEffect(() => {
    if (joined) return;
    void refreshRooms();
    const timer = window.setInterval(() => void refreshRooms(), 5000);
    return () => window.clearInterval(timer);
  }, [joined]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [state?.chats.length]);

  useEffect(() => {
    const moveCount = state?.moves.length ?? 0;
    if (sound && moveCount > previousMoveCount.current && previousMoveCount.current > 0) {
      try {
        const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const context = new AudioContextClass();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        oscillator.frequency.value = 180;
        gain.gain.setValueAtTime(0.08, context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.08);
        oscillator.connect(gain).connect(context.destination);
        oscillator.start();
        oscillator.stop(context.currentTime + 0.08);
      } catch {
        // Sound is a progressive enhancement.
      }
    }
    previousMoveCount.current = moveCount;
  }, [sound, state?.moves.length]);

  const board = state?.board ?? createEmptyBoard();
  const myPlayer = state?.players.find((player) => player.clientId === clientId);
  const opponent = state?.players.find((player) => player.clientId !== clientId);
  const isSpectator = Boolean(state && !myPlayer);
  const isMyTurn = Boolean(
    state?.status === "playing" &&
    myPlayer?.color === state.turn &&
    state.players.every((player) => player.connected) &&
    connection === "online"
  );
  const winner = state?.players.find((player) => player.color === state.winner);
  const lastMove = state?.moves[state.moves.length - 1];
  const winningPoints = useMemo(
    () => new Set((state?.winningLine ?? []).map(([row, col]) => `${row}-${col}`)),
    [state?.winningLine]
  );

  const send = (event: OmokClientEvent) => {
    if (socketRef.current?.readyState === WebSocket.OPEN) socketRef.current.send(JSON.stringify(event));
  };

  const enterSelectedRoom = (requestedRoom: string, requestedTitle = "") => {
    const cleanName = (name.trim() || makePlayerName()).slice(0, 12);
    const cleanRoom = (requestedRoom || makeRoomCode()).toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8);
    if (cleanRoom.length < 4) {
      setNotice("방 코드는 4글자 이상이어야 합니다.");
      return;
    }
    window.localStorage.setItem("spicy-omok-name", cleanName);
    window.history.replaceState(null, "", `${window.location.pathname}?room=${cleanRoom}`);
    setName(cleanName);
    setRoomId(cleanRoom);
    setRoomTitle(requestedTitle.trim().slice(0, 24));
    setJoined(true);
  };

  const createRoom = (event: FormEvent) => {
    event.preventDefault();
    enterSelectedRoom(roomId || makeRoomCode(), roomTitle.trim());
  };

  const shareRoom = async (targetRoomId: string, title = "SPICY 온라인 오목") => {
    const url = `${window.location.origin}${window.location.pathname}?room=${targetRoomId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, text: `${title}에 초대합니다.`, url });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const leave = () => {
    setJoined(false);
    setState(null);
    setConnection("idle");
    window.history.replaceState(null, "", window.location.pathname);
  };

  const sendChat = (event: FormEvent) => {
    event.preventDefault();
    const text = chat.trim();
    if (!text) return;
    send({ type: "chat", text });
    setChat("");
  };

  const statusCopy = !state
    ? "대국실 동기화 중"
    : state.status === "waiting"
      ? "상대를 기다리는 중"
      : state.status === "finished"
        ? winner ? `${winner.name} 승리` : "무승부"
        : state.players.some((player) => !player.connected)
          ? "상대 재접속 대기"
          : state.turn === myPlayer?.color ? "당신의 차례" : `${stoneName(state.turn)} 차례`;

  return (
    <div className={styles.shell}>
      <header className={styles.gameHeader}>
        <div className={styles.brand}><span><Swords /></span><div><strong>SPICY OMOK</strong><small>ONLINE ARENA</small></div></div>
        <div className={styles.headerActions}>
          {joined && <button type="button" onClick={() => void shareRoom(roomId, state?.title)}>{copied ? <Check /> : <Share2 />}<span>{copied ? "복사됨" : roomId}</span></button>}
          <button type="button" onClick={() => setSound((current) => !current)} aria-label={sound ? "효과음 끄기" : "효과음 켜기"}>{sound ? <Volume2 /> : <VolumeX />}</button>
        </div>
      </header>

      {!joined ? (
        <main className={styles.lobby}>
          <section className={styles.lobbyIntro}>
            <div className={styles.lobbyKicker}><Wifi /> 지금 접속 가능</div>
            <h1>오목 한 판<br /><em>ㄱ?</em></h1>
            <p>열린 방 골라 들어가도 되고,<br />방 파서 친구 불러도 됨.</p>
            <label className={styles.nicknameField}>
              <span>내 대국명</span>
              <input value={name} onChange={(event) => setName(event.target.value)} maxLength={12} placeholder="비우면 랜덤으로 지어줌" autoComplete="nickname" />
            </label>
            {notice && <div className={styles.formNotice}>{notice}</div>}
            <div className={styles.lobbyStats}>
              <div><strong>{rooms.length}</strong><span>열린 방</span></div>
              <div><strong>{rooms.reduce((count, room) => count + room.players.filter((player) => player.connected).length + room.spectators, 0)}</strong><span>접속 중</span></div>
              <div><strong>15×15</strong><span>자유룰</span></div>
            </div>
            <div className={styles.trustLine}><ShieldCheck /> 끊겨도 다시 붙음 · 구경만 해도 됨</div>
          </section>

          <section className={styles.roomBrowser}>
            <div className={styles.roomBrowserHeader}>
              <div><span>지금 열려 있는 방</span><h2>대국실 찾기</h2></div>
              <div>
                <button type="button" className={styles.refreshButton} onClick={() => void refreshRooms()} aria-label="방 목록 새로고침"><RefreshCw /></button>
                <button type="button" className={styles.createButton} onClick={() => { setCreating(true); setRoomId(makeRoomCode()); }}><Plus /> 방 만들기</button>
              </div>
            </div>

            {creating && (
              <form className={styles.createRoomPanel} onSubmit={createRoom}>
                <div><span>방 하나 파기</span><strong>새 대국실 만들기</strong></div>
                <label><span>방 제목</span><input autoFocus value={roomTitle} onChange={(event) => setRoomTitle(event.target.value)} maxLength={24} placeholder={`${name.trim() || "랜덤 기사"}의 대국실`} /></label>
                <label><span>방 코드</span><div className={styles.roomInput}><input value={roomId} onChange={(event) => setRoomId(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 8))} maxLength={8} /><button type="button" onClick={() => setRoomId(makeRoomCode())}>랜덤</button></div></label>
                <div className={styles.createActions}><button type="button" onClick={() => setCreating(false)}>취소</button><button type="submit">방 생성 <Swords /></button></div>
              </form>
            )}

            <div className={styles.roomList}>
              {roomsLoading ? (
                <div className={styles.roomEmpty}><RefreshCw className={styles.spinner} /><strong>대국실을 불러오는 중</strong></div>
              ) : rooms.length === 0 ? (
                <div className={styles.roomEmpty}><CircleDot /><strong>아직 열린 대국실이 없습니다.</strong><span>첫 번째 방을 만들어 한 판 시작해보세요.</span><button type="button" onClick={() => { setCreating(true); setRoomId(makeRoomCode()); }}>방 만들기</button></div>
              ) : rooms.map((room) => {
                const seated = room.players.filter((player) => player.connected).length;
                const joinLabel = seated < 2 && room.status === "waiting" ? "참가" : "관전";
                return (
                  <article key={room.roomId} className={styles.roomCard}>
                    <div className={`${styles.roomStatus} ${room.status === "playing" ? styles.roomPlaying : room.status === "finished" ? styles.roomFinished : ""}`}><span />{room.status === "waiting" ? "WAITING" : room.status === "playing" ? "PLAYING" : "FINISHED"}</div>
                    <div className={styles.roomInfo}><h3>{room.title}</h3><p>#{room.roomId} · {room.players.map((player) => player.name).join(" vs ") || "대국자 모집 중"}</p></div>
                    <div className={styles.roomMeta}><span><Users /> {seated}/2</span><span><Eye /> {room.spectators}</span><span>{room.moves}수</span></div>
                    <button type="button" className={styles.shareButton} onClick={() => void shareRoom(room.roomId, room.title)} aria-label={`${room.title} 공유`}><Share2 /></button>
                    <button type="button" className={styles.joinButton} onClick={() => enterSelectedRoom(room.roomId)}>{joinLabel}</button>
                  </article>
                );
              })}
            </div>
          </section>
        </main>
      ) : (
        <main className={styles.arena}>
          <section className={styles.boardSection}>
            <div className={styles.matchBar}>
              <div className={`${styles.connection} ${styles[connection]}`}>{connection === "online" ? <Wifi /> : <WifiOff />}<span>{connection === "online" ? "LIVE" : connection === "connecting" ? "CONNECTING" : "RECONNECTING"}</span></div>
              <strong>{statusCopy}</strong>
              <span>ROUND {state?.round ?? 1} · {state?.moves.length ?? 0}수</span>
            </div>

            <div className={styles.boardFrame}>
              <div className={styles.board}>
                <svg className={styles.boardLines} viewBox="-0.4 -0.4 14.8 14.8" aria-hidden="true">
                  {Array.from({ length: BOARD_SIZE }, (_, index) => <line key={`v-${index}`} x1={index} y1={0} x2={index} y2={14} />)}
                  {Array.from({ length: BOARD_SIZE }, (_, index) => <line key={`h-${index}`} x1={0} y1={index} x2={14} y2={index} />)}
                  {[[3, 3], [3, 11], [7, 7], [11, 3], [11, 11]].map(([x, y]) => <circle key={`${x}-${y}`} cx={x} cy={y} r="0.13" />)}
                </svg>
                {board.flatMap((row, rowIndex) => row.map((stone, colIndex) => {
                  const isLast = lastMove?.row === rowIndex && lastMove?.col === colIndex;
                  const isWinning = winningPoints.has(`${rowIndex}-${colIndex}`);
                  return (
                    <button
                      type="button"
                      key={`${rowIndex}-${colIndex}`}
                      aria-label={`${rowIndex + 1}행 ${colIndex + 1}열${stone ? ` ${stoneName(stone)}돌` : ""}`}
                      className={`${styles.intersection} ${isMyTurn && stone === 0 ? styles.playable : ""}`}
                      style={{
                        left: `${4.5 + (colIndex / (BOARD_SIZE - 1)) * 91}%`,
                        top: `${4.5 + (rowIndex / (BOARD_SIZE - 1)) * 91}%`,
                      }}
                      disabled={!isMyTurn || stone !== 0}
                      onClick={() => send({ type: "place", row: rowIndex, col: colIndex })}
                    >
                      {stone !== 0 && <span className={`${styles.stone} ${stone === 1 ? styles.blackStone : styles.whiteStone} ${isWinning ? styles.winningStone : ""}`}>{isLast && <i />}</span>}
                    </button>
                  );
                }))}
                {state?.status === "finished" && (
                  <div className={styles.resultOverlay}>
                    <Crown />
                    <strong>{winner ? `${winner.name} 승리` : "무승부"}</strong>
                    <span>{winner ? `${stoneName(winner.color)} · ${state.moves.length}수 만에 오목 완성` : "치열한 승부였습니다"}</span>
                    {!isSpectator && <button type="button" onClick={() => send({ type: "rematch" })}><RotateCcw />{state.rematchVotes.includes(clientId) ? "상대 응답 대기 중" : "재대국 신청"}</button>}
                  </div>
                )}
              </div>
            </div>
            <div className={styles.boardHint}>{isSpectator ? "관전 중입니다" : isMyTurn ? "빈 교차점을 눌러 착수하세요" : statusCopy}</div>
          </section>

          <aside className={styles.sidePanel}>
            <section className={styles.playersPanel}>
              <div className={styles.panelTitle}><span>MATCH</span><strong>대국자</strong><Users /></div>
              <PlayerCard player={state?.players.find((player) => player.color === 1)} active={state?.status === "playing" && state.turn === 1} mine={myPlayer?.color === 1} />
              <div className={styles.versus}>VS</div>
              <PlayerCard player={state?.players.find((player) => player.color === 2)} active={state?.status === "playing" && state.turn === 2} mine={myPlayer?.color === 2} />
              <div className={styles.spectators}><Users /> 관전자 {state?.spectators ?? 0}명</div>
            </section>

            <section className={styles.chatPanel}>
              <div className={styles.panelTitle}><span>ROOM CHAT</span><strong>대화</strong><MessageCircle /></div>
              <div className={styles.chatList}>
                {(state?.chats ?? []).map((message) => (
                  <div key={message.id} className={message.system ? styles.systemMessage : message.clientId === clientId ? styles.myMessage : ""}>
                    {!message.system && <span>{message.name}</span>}
                    <p>{message.text}</p>
                  </div>
                ))}
                {!state?.chats.length && <div className={styles.emptyChat}>첫 인사를 건네보세요.</div>}
                <div ref={chatEndRef} />
              </div>
              <form className={styles.chatForm} onSubmit={sendChat}><input value={chat} onChange={(event) => setChat(event.target.value)} maxLength={120} placeholder="메시지 입력" /><button type="submit" aria-label="메시지 보내기"><Send /></button></form>
            </section>

            <button type="button" onClick={leave} className={styles.leaveButton}><DoorOpen /> 대국실 나가기</button>
          </aside>
          {notice && <div className={styles.toast}>{notice}</div>}
        </main>
      )}
    </div>
  );
}

function PlayerCard({ player, active, mine }: { player?: OmokPlayer; active: boolean; mine: boolean }) {
  return (
    <div className={`${styles.playerCard} ${active ? styles.activePlayer : ""}`}>
      <span className={`${styles.playerStone} ${player?.color === 2 ? styles.playerWhite : ""}`} />
      <div><strong>{player?.name ?? "상대 기다리는 중"}{mine && <em>ME</em>}</strong><small>{player ? `${stoneName(player.color)} · ${player.connected ? "접속 중" : "재접속 대기"}` : "초대 링크를 공유하세요"}</small></div>
      {active && <i />}
    </div>
  );
}
