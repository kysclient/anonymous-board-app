"use client";

import Link from "next/link";
import {
  type CSSProperties,
  type FormEvent,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ChevronDown,
  Coffee,
  DoorOpen,
  Flag,
  MoreHorizontal,
  RotateCcw,
  Send,
  Volume2,
  VolumeX,
  WifiOff,
  X,
} from "lucide-react";
import {
  type SmokingRoomClientEvent,
  type SmokingRoomId,
  type SmokingRoomMessage,
  type SmokingRoomServerEvent,
} from "@/lib/smoking-room/types";
import styles from "./smoking-room.module.css";

type ConnectionStatus = "connecting" | "online" | "offline";

interface SmokeBurst {
  id: number;
  intensity: number;
  particles: number;
}

const SESSION_MS = 2 * 60 * 1000;
const MESSAGE_VISIBLE_MS = 10_000;
const FILTER_HEIGHT = 80;
const PAPER_HEIGHT = 280;

const ROOMS = [
  {
    id: "rooftop",
    icon: "🏢",
    label: "모임 옥상",
    detail: "바람 쐬는 중",
    background: "/images/smoking-room/rooftop.webp",
    backgroundPosition: "50% 50%",
    mobileBackgroundPosition: "48% 50%",
  },
  {
    id: "river",
    icon: "🌉",
    label: "한강 둔치",
    detail: "물멍하는 중",
    background: "/images/smoking-room/river.webp",
    backgroundPosition: "50% 50%",
    mobileBackgroundPosition: "44% 50%",
  },
  {
    id: "alley",
    icon: "🌙",
    label: "새벽 골목",
    detail: "조용히 쉬는 중",
    background: "/images/smoking-room/alley.webp",
    backgroundPosition: "50% 50%",
    mobileBackgroundPosition: "50% 50%",
  },
  {
    id: "space",
    icon: "🪐",
    label: "지구 밖",
    detail: "아무 말 하는 중",
    background: "/images/smoking-room/space.webp",
    backgroundPosition: "50% 50%",
    mobileBackgroundPosition: "72% 50%",
  },
] satisfies Array<{
  id: SmokingRoomId;
  icon: string;
  label: string;
  detail: string;
  background: string;
  backgroundPosition: string;
  mobileBackgroundPosition: string;
}>;

function makeNickname() {
  const adjectives = ["느긋한", "말랑한", "졸린", "수상한", "배고픈", "여유로운"];
  const nouns = ["반달곰", "참새", "고양이", "감자", "수달", "펭귄"];
  return `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${
    nouns[Math.floor(Math.random() * nouns.length)]
  }`;
}

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function smokeStyle(message: SmokingRoomMessage, now: number): CSSProperties {
  const hash = hashString(message.id);
  const direction = hash % 2 ? 1 : -1;
  const drift = direction * (42 + (hash % 84));
  const duration = 8_600 + (hash % 1_500);
  const age = Math.max(0, now - message.createdAt);

  return {
    "--smoke-drift": `${drift}px`,
    "--smoke-drift-mid": `${Math.round(drift * 0.42)}px`,
    "--smoke-duration": `${duration}ms`,
    "--smoke-delay": `${-Math.min(age, duration - 50)}ms`,
    "--smoke-start": `${((hash >>> 8) % 31) - 15}px`,
  } as CSSProperties;
}

function puffStyle(burst: SmokeBurst, index: number): CSSProperties {
  const hash = hashString(`${burst.id}-${index}`);
  const size = Math.round(170 + burst.intensity * 170 + index * 18);
  const height = Math.round(size * (0.8 + ((hash >>> 5) % 7) / 100));
  const direction = hash % 2 === 0 ? 1 : -1;
  const x = direction * Math.round(28 + burst.intensity * 68 + (hash % 38));
  const y = -Math.round(135 + burst.intensity * 135 + (hash % 54));
  const alpha = Math.max(0.22, 0.56 + burst.intensity * 0.22 - index * 0.1);

  return {
    "--puff-x": `${x}px`,
    "--puff-y": `${y}px`,
    "--puff-x-mid": `${Math.round(x * 0.22)}px`,
    "--puff-y-mid": `${Math.round(y * 0.24)}px`,
    "--puff-x-late": `${Math.round(x * 0.68)}px`,
    "--puff-y-late": `${Math.round(y * 0.66)}px`,
    "--puff-size": `${size}px`,
    "--puff-height": `${height}px`,
    "--puff-duration": `${3_800 + Math.round(burst.intensity * 1_700) + index * 300}ms`,
    "--puff-delay": `${index * 140}ms`,
    "--puff-opacity": alpha,
    "--puff-opacity-mid": alpha * 0.76,
    "--puff-opacity-late": alpha * 0.32,
    "--puff-core": `rgba(232, 235, 238, ${alpha})`,
    "--puff-edge": `rgba(184, 190, 197, ${alpha * 0.52})`,
    "--puff-rotate": `${(hash % 12) - 6}deg`,
    "--puff-scale-late": 1.34 + burst.intensity * 0.34 + index * 0.08,
    "--puff-scale": 1.78 + burst.intensity * 0.82 + index * 0.12,
    "--puff-blur": `${5 + Math.round(burst.intensity * 4)}px`,
  } as CSSProperties;
}

function formatTimer(milliseconds: number) {
  const totalSeconds = Math.floor(milliseconds / 1000);
  return `${Math.floor(totalSeconds / 60)}분 ${String(totalSeconds % 60).padStart(2, "0")}초`;
}

export default function SmokingRoomPage() {
  const [clientId, setClientId] = useState("");
  const [name, setName] = useState("");
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<SmokingRoomMessage[]>([]);
  const [online, setOnline] = useState(0);
  const [connection, setConnection] = useState<ConnectionStatus>("connecting");
  const [notice, setNotice] = useState("");
  const [coolingDown, setCoolingDown] = useState(false);
  const [started, setStarted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [burnProgress, setBurnProgress] = useState(0);
  const [holdingFilter, setHoldingFilter] = useState(false);
  const [composerOpen, setComposerOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [roomMenuOpen, setRoomMenuOpen] = useState(false);
  const [roomIndex, setRoomIndex] = useState(0);
  const [asmrOn, setAsmrOn] = useState(false);
  const [volume, setVolume] = useState(35);
  const [reportOpen, setReportOpen] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [smokeBursts, setSmokeBursts] = useState<SmokeBurst[]>([]);

  const socketRef = useRef<WebSocket | null>(null);
  const nameRef = useRef("");
  const noticeTimerRef = useRef<number | null>(null);
  const startedAtRef = useRef(0);
  const holdingRef = useRef(false);
  const roomIdRef = useRef<SmokingRoomId>(ROOMS[0].id);
  const pressStartedAtRef = useRef(0);
  const burstSequenceRef = useRef(0);
  const burstTimersRef = useRef<number[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const showNotice = (message: string) => {
    setNotice(message);
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => setNotice(""), 2_800);
  };

  useEffect(() => {
    const storedId = window.localStorage.getItem("spicy-smoking-room-client") || crypto.randomUUID();
    const storedName = window.localStorage.getItem("spicy-smoking-room-name") || makeNickname();
    window.localStorage.setItem("spicy-smoking-room-client", storedId);
    window.localStorage.setItem("spicy-smoking-room-name", storedName);
    nameRef.current = storedName;
    setClientId(storedId);
    setName(storedName);
  }, []);

  useEffect(() => {
    if (!clientId || !nameRef.current) return;
    let cancelled = false;
    let heartbeat = 0;
    let reconnectTimer = 0;
    let reconnectDelay = 1_000;

    const connect = () => {
      if (cancelled) return;
      setConnection("connecting");
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const socket = new WebSocket(`${protocol}://${window.location.host}/api/smoking-room`);
      socketRef.current = socket;

      socket.addEventListener("open", () => {
        reconnectDelay = 1_000;
        setConnection("online");
        socket.send(JSON.stringify({
          type: "join",
          clientId,
          name: nameRef.current,
          roomId: roomIdRef.current,
        } satisfies SmokingRoomClientEvent));
        heartbeat = window.setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: "ping" } satisfies SmokingRoomClientEvent));
          }
        }, 25_000);
      });

      socket.addEventListener("message", (raw) => {
        try {
          const event = JSON.parse(raw.data) as SmokingRoomServerEvent;
          if (event.type === "snapshot") {
            roomIdRef.current = event.roomId;
            const nextRoomIndex = ROOMS.findIndex((room) => room.id === event.roomId);
            if (nextRoomIndex >= 0) setRoomIndex(nextRoomIndex);
            setMessages(event.messages);
            setOnline(event.online);
          } else if (event.type === "message") {
            if (event.roomId !== roomIdRef.current) return;
            setMessages((current) => {
              if (current.some((item) => item.id === event.message.id)) return current;
              return [...current, event.message].slice(-40);
            });
          } else if (event.type === "presence" || event.type === "pong") {
            if (event.roomId === roomIdRef.current) setOnline(event.online);
          } else if (event.type === "report-received") {
            setReportOpen(false);
            showNotice("신고가 접수됐어요. 운영진이 확인할게요.");
          } else if (event.type === "error") {
            showNotice(event.message);
          }
        } catch {
          // Ignore malformed frames and keep the connection alive.
        }
      });

      socket.addEventListener("close", () => {
        if (heartbeat) window.clearInterval(heartbeat);
        if (cancelled) return;
        setConnection("offline");
        reconnectTimer = window.setTimeout(connect, reconnectDelay);
        reconnectDelay = Math.min(reconnectDelay * 2, 15_000);
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
  }, [clientId]);

  const stopAsmr = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setAsmrOn(false);
  }, []);

  useEffect(() => {
    const audio = new Audio("/audio/cigarette-crackle.mp3");
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = 0.2;
    audioRef.current = audio;
    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => () => {
    burstTimersRef.current.forEach((timer) => window.clearTimeout(timer));
  }, []);

  useEffect(() => {
    if (!started) return;
    const timer = window.setInterval(() => {
      setNow(Date.now());
      setElapsed(Math.min(SESSION_MS, Date.now() - startedAtRef.current));
      setBurnProgress((current) =>
        Math.min(1, current + (100 / SESSION_MS) * (holdingRef.current ? 7 : 1))
      );
    }, 100);
    return () => window.clearInterval(timer);
  }, [started]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!started || burnProgress < 1) return;
    setStarted(false);
    setFinished(true);
    setElapsed(Math.min(SESSION_MS, Date.now() - startedAtRef.current));
    setComposerOpen(false);
    stopAsmr();
  }, [burnProgress, started, stopAsmr]);

  useEffect(() => {
    if (composerOpen) window.setTimeout(() => inputRef.current?.focus(), 80);
  }, [composerOpen]);

  useEffect(() => {
    if (!audioRef.current) return;
    const intensity = holdingFilter ? 0.92 : 0.58;
    audioRef.current.volume = Math.min(1, (volume / 100) * intensity);
  }, [holdingFilter, volume]);

  const send = (event: SmokingRoomClientEvent) => {
    if (socketRef.current?.readyState !== WebSocket.OPEN) return false;
    socketRef.current.send(JSON.stringify(event));
    return true;
  };

  const startExperience = () => {
    if (finished) return;
    startedAtRef.current = Date.now();
    setElapsed(0);
    setBurnProgress(0);
    setStarted(true);
  };

  const resetExperience = () => {
    stopAsmr();
    setStarted(false);
    setFinished(false);
    setElapsed(0);
    setBurnProgress(0);
    setComposerOpen(false);
    setRoomMenuOpen(false);
    setReportOpen(false);
    setHoldingFilter(false);
    setSmokeBursts([]);
    holdingRef.current = false;
    pressStartedAtRef.current = 0;
    startedAtRef.current = 0;
  };

  const releaseSmoke = (pressedFor: number) => {
    const intensity = Math.min(1, Math.max(0.12, pressedFor / 1_800));
    const burst: SmokeBurst = {
      id: ++burstSequenceRef.current,
      intensity,
      particles: 1 + Math.floor(intensity * 2.6),
    };
    setSmokeBursts((current) => [...current.slice(-5), burst]);
    const timer = window.setTimeout(() => {
      setSmokeBursts((current) => current.filter((item) => item.id !== burst.id));
    }, 7_200);
    burstTimersRef.current.push(timer);
  };

  const endFilterPress = (
    event: ReactPointerEvent<HTMLButtonElement>,
    emitSmoke: boolean
  ) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const pressedFor = pressStartedAtRef.current
      ? Date.now() - pressStartedAtRef.current
      : 0;
    const wasHolding = holdingRef.current;
    holdingRef.current = false;
    pressStartedAtRef.current = 0;
    setHoldingFilter(false);
    if (emitSmoke && wasHolding && pressedFor > 0 && startedAtRef.current > 0) {
      releaseSmoke(pressedFor);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const text = draft.trim().slice(0, 80);
    if (!text || coolingDown) return;
    if (!send({ type: "speak", text, mood: "chill" })) {
      showNotice("연결이 돌아오면 다시 말해주세요.");
      return;
    }
    setDraft("");
    setComposerOpen(false);
    setCoolingDown(true);
    window.setTimeout(() => setCoolingDown(false), 1_500);
  };

  const regenerateName = () => {
    const nextName = makeNickname();
    nameRef.current = nextName;
    setName(nextName);
    window.localStorage.setItem("spicy-smoking-room-name", nextName);
    send({ type: "profile", name: nextName });
    showNotice(`${nextName}(으)로 이름이 바뀌었어요.`);
  };

  const toggleAsmr = async () => {
    if (asmrOn) {
      stopAsmr();
      return;
    }

    try {
      const audio = audioRef.current;
      if (!audio) throw new Error("Audio is not ready");
      audio.currentTime = 0;
      audio.volume = Math.min(1, (volume / 100) * 0.58);
      await audio.play();
      setAsmrOn(true);
    } catch {
      showNotice("이 브라우저에서는 ASMR을 재생할 수 없어요.");
    }
  };

  const teleportTo = (index: number) => {
    const room = ROOMS[index];
    roomIdRef.current = room.id;
    setRoomIndex(index);
    setMessages([]);
    setOnline(0);
    setRoomMenuOpen(false);
    setReportOpen(false);
    send({ type: "teleport", roomId: room.id });
    showNotice(`${room.icon} ${room.label}(으)로 이동했어요.`);
  };

  const openReport = () => {
    if (messages.length === 0) {
      showNotice("아직 신고할 한마디가 없어요.");
      return;
    }
    setRoomMenuOpen(false);
    setReportOpen(true);
  };

  const submitReport = (messageId: string) => {
    if (!send({ type: "report", messageId, reason: "불편하거나 부적절한 내용" })) {
      showNotice("연결이 돌아오면 다시 신고해주세요.");
    }
  };

  const handleSceneClick = (event: MouseEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("[data-room-ui]")) return;
    setMenuOpen(false);
    setRoomMenuOpen(false);
    setReportOpen(false);
    if (!started && !finished) {
      startExperience();
      return;
    }
    if (started) setComposerOpen(true);
  };

  const visibleMessages = useMemo(
    () => messages
      .filter((message) => now - message.createdAt < MESSAGE_VISIBLE_MS)
      .slice(-10),
    [messages, now]
  );
  const reportableMessages = useMemo(
    () => [...messages].reverse().slice(0, 5),
    [messages]
  );
  const paperHeight = Math.max(16, Math.round(PAPER_HEIGHT * (1 - burnProgress)));
  const currentRoom = ROOMS[roomIndex];
  const helperText = !started
    ? "화면을 눌러 흡연실을 시작하세요"
    : elapsed < 7_500
      ? "필터를 누르고 있으면 더 빨리 태워져요."
      : elapsed < 15_000
        ? "빈 화면을 누르면 소근소근 말할 수 있어요."
        : "";

  return (
    <div
      className={styles.room}
      onClick={handleSceneClick}
      style={{ "--paper-height": `${paperHeight}px` } as CSSProperties}
    >
      <div className={styles.backgrounds} aria-hidden="true">
        {ROOMS.map((room, index) => (
          <span
            data-active={index === roomIndex}
            style={{
              "--room-background": `url("${room.background}")`,
              "--room-background-position": room.backgroundPosition,
              "--room-background-position-mobile": room.mobileBackgroundPosition,
            } as CSSProperties}
            key={room.id}
          />
        ))}
      </div>

      <header className={styles.topBar} data-room-ui>
        <div className={styles.topActions}>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => setMenuOpen((current) => !current)}
            aria-label="메뉴"
            aria-expanded={menuOpen}
          >
            <MoreHorizontal />
          </button>
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => showNotice("서로 편하게 쉬다 가요. ☕")}
            aria-label="흡연실 안내"
          >
            <Coffee />
          </button>
        </div>

        {menuOpen && (
          <div className={styles.menuPanel}>
            <div className={styles.profileLine}>
              <span>오늘의 이름</span>
              <strong>{name || "이름 짓는 중"}</strong>
            </div>
            <button type="button" onClick={regenerateName}><RotateCcw /> 새 이름 받기</button>
            <button
              type="button"
              onClick={() => showNotice("욕설·도배·개인정보 공유는 쉬어갈 수 없어요.")}
            >
              <Flag /> 이용 안내
            </button>
            <Link href="/dashboard"><DoorOpen /> 대시보드로 나가기</Link>
          </div>
        )}

        {(started || finished) && (
          <div className={styles.timer}>
            <span>{formatTimer(elapsed)}</span>
            <button type="button" onClick={resetExperience} aria-label="흡연실 타이머 리셋">
              <RotateCcw />
            </button>
          </div>
        )}
      </header>

      <div className={styles.brandGhost} aria-hidden="true">SPICY · SMOKING ROOM</div>

      <main className={styles.scene} aria-label="실시간 흡연실">
        {helperText && <p className={styles.helper}>{helperText}</p>}

        {started && (
          <div className={styles.smokeLayer} aria-live="polite">
            {visibleMessages.map((message) => (
              <div
                className={styles.smokeMessage}
                style={smokeStyle(message, now)}
                key={message.id}
              >
                <span>{message.name}</span>
                <strong>{message.text}</strong>
              </div>
            ))}
          </div>
        )}

        {finished ? (
          <div className={styles.finishedPanel} data-room-ui>
            <strong>{formatTimer(elapsed)}</strong>
            <button type="button" onClick={resetExperience} aria-label="다시 시작">
              <RotateCcw />
            </button>
          </div>
        ) : (
          <button
            type="button"
            className={styles.cigarette}
            data-room-ui
            data-testid="smoking-cigarette"
            data-started={started}
            data-holding={holdingFilter}
            onClick={() => {
              if (!started) startExperience();
            }}
            onPointerDown={(event) => {
              if (!started) startExperience();
              event.currentTarget.setPointerCapture(event.pointerId);
              pressStartedAtRef.current = Date.now();
              holdingRef.current = true;
              setHoldingFilter(true);
            }}
            onPointerUp={(event) => endFilterPress(event, true)}
            onPointerCancel={(event) => endFilterPress(event, false)}
            aria-label="담배 필터를 길게 눌러 빠르게 태우기"
          >
            {started && (
              <span className={styles.freeSmoke} aria-hidden="true">
                <i /><i /><i />
              </span>
            )}
            {smokeBursts.map((burst) => (
              <span className={styles.releaseBurst} aria-hidden="true" key={burst.id}>
                {Array.from({ length: burst.particles }, (_, index) => (
                  <i style={puffStyle(burst, index)} key={`${burst.id}-${index}`} />
                ))}
              </span>
            ))}
            <span className={styles.ash} />
            <span className={styles.ember} />
            <span className={styles.paper} style={{ height: paperHeight }} />
            <span className={styles.filter} style={{ height: FILTER_HEIGHT }}>
              <i />
            </span>
          </button>
        )}
      </main>

      <section
        className={styles.controls}
        data-room-ui
        data-testid="smoking-controls"
        data-hidden={composerOpen || finished}
        aria-hidden={composerOpen || finished}
      >
        <label className={styles.volumeControl}>
          {asmrOn ? <Volume2 /> : <VolumeX />}
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            aria-label="ASMR 볼륨"
          />
        </label>
        <div className={styles.roomPicker}>
          <button
            type="button"
            data-testid="teleport-toggle"
            onClick={() => {
              setReportOpen(false);
              setRoomMenuOpen((current) => !current);
            }}
          >
            순간이동 <ChevronDown />
          </button>
          {roomMenuOpen && (
            <div className={styles.roomMenu}>
              {ROOMS.map((room, index) => (
                <button
                  type="button"
                  data-active={index === roomIndex}
                  onClick={() => teleportTo(index)}
                  key={room.label}
                >
                  <span>{room.icon}</span><span><strong>{room.label}</strong><small>{room.detail}</small></span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          type="button"
          data-testid="asmr-toggle"
          data-active={asmrOn}
          onClick={() => void toggleAsmr()}
        >
          {asmrOn ? "ASMR 끄기" : "ASMR 켜기"}
        </button>
        <button type="button" data-testid="report-toggle" onClick={openReport}>신고하기</button>
      </section>

      {reportOpen && (
        <section className={styles.reportPanel} data-room-ui role="dialog" aria-modal="true" aria-label="한마디 신고">
          <div className={styles.reportHeading}>
            <div>
              <strong>신고할 한마디</strong>
              <span>선택하면 운영진에게 익명으로 접수돼요.</span>
            </div>
            <button type="button" onClick={() => setReportOpen(false)} aria-label="신고 창 닫기"><X /></button>
          </div>
          <div className={styles.reportList}>
            {reportableMessages.map((message) => (
              <button type="button" onClick={() => submitReport(message.id)} key={message.id}>
                <span>{message.name}</span>
                <strong>{message.text}</strong>
              </button>
            ))}
          </div>
        </section>
      )}

      {started && composerOpen && (
        <form
          className={styles.composer}
          data-room-ui
          onSubmit={submit}
          onClick={(event) => event.stopPropagation()}
        >
          <input
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, 80))}
            maxLength={80}
            placeholder="소근소근 말하기..."
            aria-label="남길 한마디"
            autoComplete="off"
          />
          <button
            type="button"
            className={styles.closeComposer}
            onClick={() => setComposerOpen(false)}
            aria-label="입력창 닫기"
          >
            <X />
          </button>
          <button
            type="submit"
            className={styles.sendButton}
            disabled={!draft.trim() || connection !== "online" || coolingDown}
            aria-label="한마디 띄우기"
          >
            <Send /><span>💨</span>
          </button>
        </form>
      )}

      <div className={styles.roomStatus} data-room-ui>
        <span>{currentRoom.icon}</span>
        <strong>{currentRoom.label} 흡연 중</strong>
        <span>{connection === "online" ? `${online}명` : <><WifiOff /> 재연결 중</>}</span>
        <i>•</i>
        <span>최근 한마디 {messages.length}개</span>
      </div>

      <div className={styles.noticeBar} data-room-ui>
        <div><b>[공지]</b> 욕설, 도배, 개인정보 공유는 흡연실 영구 출입 금지입니다. · SPICY 운영진</div>
        <div aria-hidden="true"><b>[공지]</b> 욕설, 도배, 개인정보 공유는 흡연실 영구 출입 금지입니다. · SPICY 운영진</div>
      </div>

      {notice && <div className={styles.toast} role="status">{notice}</div>}
    </div>
  );
}
