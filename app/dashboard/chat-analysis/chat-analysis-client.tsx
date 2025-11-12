"use client";

import { useCallback, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Calendar,
  MessageCircle,
  RotateCcw,
  Search,
  Users,
} from "lucide-react";

interface WordCount {
  word: string;
  count: number;
}

interface ConversationMessage {
  timestamp: string;
  text: string;
}

interface ParticipantSummary {
  id: number;
  name: string;
  totalMessages: number;
  topWords: WordCount[];
}

interface SessionMeta {
  id: string;
  startDate: string | null;
  endDate: string | null;
  targetUser: string;
  stopWords: string[];
  createdAt: string | null;
}

interface ChatAnalysisClientProps {
  session: SessionMeta;
  participants: ParticipantSummary[];
}

export default function ChatAnalysisClient({
  session,
  participants,
}: ChatAnalysisClientProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedParticipant, setSelectedParticipant] =
    useState<ParticipantSummary | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  const totalMessages = useMemo(
    () =>
      participants.reduce((sum, participant) => sum + participant.totalMessages, 0),
    [participants]
  );

  const filteredParticipants = useMemo(() => {
    const needle = searchTerm.trim().toLowerCase();
    if (!needle) {
      return participants;
    }
    return participants.filter((participant) =>
      participant.name.toLowerCase().includes(needle)
    );
  }, [participants, searchTerm]);

  const handleDialogChange = useCallback((open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setSelectedParticipant(null);
      setMessages([]);
      setMessagesError(null);
    }
  }, []);

  const handleParticipantClick = useCallback(
    async (participant: ParticipantSummary) => {
      setSelectedParticipant(participant);
      setIsDialogOpen(true);
      setIsLoadingMessages(true);
      setMessagesError(null);
      setMessages([]);

      try {
        const response = await fetch(
          `/api/chat-analysis/messages?participantId=${participant.id}`
        );

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(
            typeof payload?.error === "string"
              ? payload.error
              : "메시지를 불러오지 못했습니다."
          );
        }

        const payload = (await response.json()) as {
          messages: ConversationMessage[];
        };
        setMessages(payload.messages ?? []);
      } catch (error) {
        console.error("Failed to load participant messages:", error);
        setMessagesError("메시지를 불러오지 못했습니다.");
      } finally {
        setIsLoadingMessages(false);
      }
    },
    []
  );

  const formatDateRange = useMemo(() => {
    if (!session.startDate && !session.endDate) {
      return "전체 기간";
    }
    if (session.startDate && session.endDate) {
      return `${session.startDate} ~ ${session.endDate}`;
    }
    if (session.startDate) {
      return `${session.startDate} 이후`;
    }
    return `${session.endDate} 이전`;
  }, [session.endDate, session.startDate]);

  return (
    <div className="p-2 space-y-6">
      <div className="bg-background border border-border rounded-xl p-5 shadow-sm">
        <div className="flex items-center space-x-3 mb-4">
          <Search className="w-5 h-5 text-foreground" />
          <h2 className="text-lg font-semibold text-foreground">참여자 검색</h2>
        </div>
        <Input
          placeholder="참여자 이름 검색"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="max-w-md"
        />
        <p className="text-xs text-muted-foreground mt-2">
          총 {participants.length.toLocaleString()}명 중{" "}
          {filteredParticipants.length.toLocaleString()}명 표시 중
        </p>
      </div>

      {/* <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          제외 단어 목록
        </h2>
        {session.stopWords.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {session.stopWords.map((word) => (
              <span
                key={word}
                className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
              >
                {word}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">저장된 제외 단어가 없습니다.</p>
        )}
      </div> */}

      <div className="bg-background border border-border rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            참여자 목록
          </h2>
        </div>
        <div className="divide-y divide-border">
          {filteredParticipants.map((participant) => (
            <button
              key={participant.id}
              type="button"
              onClick={() => handleParticipantClick(participant)}
              className="w-full text-left px-5 py-4 hover:bg-secondary transition-colors focus:outline-none"
            >
              <div className="flex flex-col gap-3">
                <div className="block">
                  <p className="text-md font-semibold text-foreground">
                    {participant.name}
                  </p>
                  <p className="text-xs text-foreground">
                    총 {participant.totalMessages.toLocaleString()}건
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {participant.topWords.slice(0, 5).map((word) => (
                    <span
                      key={`${participant.id}-${word.word}`}
                      className="bg-secondary border border-border text-foreground px-3 py-1 rounded-full text-xs"
                    >
                      {word.word} · {word.count.toLocaleString()}
                    </span>
                  ))}
                  {participant.topWords.length === 0 && (
                    <span className="text-xs text-gray-400">
                      상위 단어 없음
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
          {filteredParticipants.length === 0 && (
            <div className="px-5 py-8 text-center text-sm text-gray-500">
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedParticipant?.name ?? "참여자 메시지"}
            </DialogTitle>
            <DialogDescription>
              {selectedParticipant
                ? `총 ${selectedParticipant.totalMessages.toLocaleString()}건의 메시지 기록`
                : "선택한 참여자의 메시지를 확인합니다."}
            </DialogDescription>
          </DialogHeader>

          {isLoadingMessages ? (
            <div className="py-12 flex justify-center">
              <RotateCcw className="w-6 h-6 text-muted-foreground animate-spin" />
            </div>
          ) : messagesError ? (
            <p className="text-sm text-red-500">{messagesError}</p>
          ) : (
            <ScrollArea className="max-h-[60vh] pr-2">
              <div className="space-y-3">
                {messages.map((message, index) => (
                  <div
                    key={`${message.timestamp}-${index}`}
                    className="border border-border rounded-lg px-4 py-3 bg-secondary"
                  >
                    <p className="text-xs text-muted-foreground mb-1">
                      {new Date(message.timestamp).toLocaleString()}
                    </p>
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {message.text || "메시지 내용 없음"}
                    </p>
                  </div>
                ))}
                {messages.length === 0 && (
                  <p className="text-sm text-gray-500">
                    표시할 메시지가 없습니다.
                  </p>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
