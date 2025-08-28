"use client";

import { Copy } from "lucide-react";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";

const CopyButton = ({ deadlineUsers }: any) => {
  const { toast } = useToast();

  return (
    <Button
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
      onClick={() => {
        "use client";
        const copyText = deadlineUsers
          .map((user: any) => {
            const joinDate = new Date(user.join_date || "");
            const limitDate = new Date(joinDate);

            if (user.is_regular === "신입") {
              limitDate.setMonth(limitDate.getMonth() + 1);
            } else if (user.is_regular === "기존") {
              const lasetMeetupDate = new Date(user.last_meetup_date);
              lasetMeetupDate.setMonth(lasetMeetupDate.getMonth() + 2);
              const year = lasetMeetupDate.getFullYear();
              const month = String(lasetMeetupDate.getMonth() + 1).padStart(
                2,
                "0"
              );
              const day = String(lasetMeetupDate.getDate()).padStart(2, "0");
              return `${user.name} ${year}-${month}-${day}`;
            }

            // YYYY-MM-DD 형식으로 변환
            const year = limitDate.getFullYear();
            const month = String(limitDate.getMonth() + 1).padStart(2, "0");
            const day = String(limitDate.getDate()).padStart(2, "0");

            return `${user.name} ${year}-${month}-${day}`;
          })
          .join("\n");
        navigator.clipboard.writeText(copyText);
        window.alert("복사되었습니다.");
      }}
    >
      <Copy className="w-4 h-4" />
      복사하기
    </Button>
  );
};

export default CopyButton;
