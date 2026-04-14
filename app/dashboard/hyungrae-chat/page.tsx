"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { ArrowUp, Loader2, ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const BG_IMAGES = [
  "/hyungrae/1.jpeg",
  "/hyungrae/2.jpeg",
  "/hyungrae/3.jpeg",
  "/hyungrae/4.jpeg",
];

export default function HyungraeChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "어~ 자기야~ 오빠한테 왔구나? ㅎㅎ 오빠 기다렸어~ 뭐든 물어봐 오빠가 다 들어줄게 😘",
    },
  ]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [currentBg, setCurrentBg] = useState(0);
  const [nextBg, setNextBg] = useState(1);
  const [fading, setFading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Preload images
  useEffect(() => {
    BG_IMAGES.forEach((src) => {
      const img = new window.Image();
      img.src = src;
    });
  }, []);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Change background on new message
  const changeBg = useCallback(() => {
    const available = BG_IMAGES.map((_, i) => i).filter((i) => i !== currentBg);
    const next = available[Math.floor(Math.random() * available.length)];
    setNextBg(next);
    setFading(true);
    setTimeout(() => {
      setCurrentBg(next);
      setFading(false);
    }, 800);
  }, [currentBg]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || isStreaming) return;

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setIsStreaming(true);
    changeBg();

    abortRef.current = new AbortController();

    // Add empty assistant message
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/hyungrae-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
        signal: abortRef.current.signal,
      });

      if (!res.ok) {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: "아... 오빠가 지금 좀 바빠서 ㅎㅎ 다시 말해줄래? 😅",
          };
          return updated;
        });
        setIsStreaming(false);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              setMessages((prev) => {
                const updated = [...prev];
                const last = updated[updated.length - 1];
                updated[updated.length - 1] = {
                  ...last,
                  content: last.content + parsed.content,
                };
                return updated;
              });
            }
          } catch {
            // skip
          }
        }
      }
      // If response ended up empty, show fallback
      setMessages((prev) => {
        const updated = [...prev];
        const last = updated[updated.length - 1];
        if (last.role === "assistant" && !last.content.trim()) {
          const fallbacks = [
            "자기야~ 오빠가 잠깐 딴 생각했어 ㅋㅋ 다시 말해줘~ 😘",
            "앗 자기 미안~ 오빠가 너무 설레서 할 말을 잊어버렸어 ㅎㅎ 💕",
            "어 잠깐... 오빠가 자기 생각하느라 멍때렸어 ㅋㅋ 뭐라고 했어? 😎",
            "오빠 폰이 잠깐 이상했나봐~ 다시 한번 말해줄래 자기야? ♥",
          ];
          updated[updated.length - 1] = {
            ...last,
            content: fallbacks[Math.floor(Math.random() * fallbacks.length)],
          };
        }
        return updated;
      });
    } catch (e: any) {
      if (e.name !== "AbortError") {
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            role: "assistant",
            content: "앗 자기야 미안~ 오빠 폰이 좀 이상해ㅠ 다시 말해줘~ 💦",
          };
          return updated;
        });
      }
    } finally {
      setIsStreaming(false);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [input, isStreaming, messages, changeBg]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClear = () => {
    if (abortRef.current) abortRef.current.abort();
    setMessages([
      {
        role: "assistant",
        content:
          "어~ 자기야 다시 왔어?? 오빠 보고싶었지? ㅋㅋ 솔직히 말해~ 😎",
      },
    ]);
    setIsStreaming(false);
    changeBg();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Background images with crossfade */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-[800ms]"
          style={{
            backgroundImage: `url(${BG_IMAGES[currentBg]})`,
            opacity: fading ? 0 : 1,
          }}
        />
        <div
          className="absolute inset-0 bg-cover bg-center transition-opacity duration-[800ms]"
          style={{
            backgroundImage: `url(${BG_IMAGES[nextBg]})`,
            opacity: fading ? 1 : 0,
          }}
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" />
      </div>

      {/* Header */}
      <header className="relative z-10 flex items-center gap-3 border-b border-white/10 bg-black/40 px-4 py-3 backdrop-blur-md">
        <Link
          href="/dashboard/fortune"
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 active:bg-white/20 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 text-white" />
        </Link>
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full border-2 border-white/40">
            <img
              src="/hyungrae/1.jpeg"
              alt="형래"
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-black bg-green-400" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-white">
              김형래 오빠
            </p>
            <p className="text-[10px] text-green-400">접속 중</p>
          </div>
        </div>
        <button
          onClick={handleClear}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 active:bg-white/20 transition-colors"
        >
          <Trash2 className="h-4 w-4 text-white/70" />
        </button>
      </header>

      {/* Messages */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="mr-2 mt-1 h-7 w-7 shrink-0 overflow-hidden rounded-full border border-white/30">
                <img
                  src="/hyungrae/1.jpeg"
                  alt="형래"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-lg ${
                msg.role === "user"
                  ? "rounded-br-md bg-white text-black"
                  : "rounded-bl-md bg-white/90 text-gray-900 backdrop-blur-sm"
              }`}
            >
              {msg.content}
              {isStreaming &&
                i === messages.length - 1 &&
                msg.role === "assistant" && (
                  <span className="ml-0.5 inline-block h-3.5 w-[2px] animate-pulse bg-gray-400 align-middle" />
                )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="relative z-10 border-t border-white/10 bg-black/40 px-3 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="형래오빠에게 메시지 보내기..."
            disabled={isStreaming}
            className="flex-1 rounded-full bg-white/10 px-4 py-2.5 text-sm text-white placeholder-white/40 outline-none ring-1 ring-white/10 focus:ring-white/30 transition-all disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={isStreaming || !input.trim()}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-black shadow-lg transition-all active:scale-95 disabled:opacity-40 disabled:active:scale-100"
          >
            {isStreaming ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ArrowUp className="h-5 w-5" />
            )}
          </button>
        </div>
        {/* Safe area for mobile */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}
