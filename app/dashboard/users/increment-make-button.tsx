"use client";

import { useState } from "react";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { increementMeetupMakeCount, incrementMeetupCount } from "../actions";

interface IncrementMakeButtonProps {
    userId: number;
    onSuccess: () => Promise<void>;
}

export function IncreementMakeButton({
    userId,
    onSuccess,
}: IncrementMakeButtonProps) {
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleIncrement = async () => {
        setIsLoading(true);

        try {
            const result = await increementMeetupMakeCount(userId);

            if (result.success) {
                toast({
                    title: "벙주 횟수 추가 성공",
                    description: "벙주 횟수가 증가되었습니다.",
                });
                // 데이터 업데이트 후 목록 새로고침
                await onSuccess();
            } else {
                toast({
                    title: "벙주 횟수 추가 실패",
                    description: result.error || "오류가 발생했습니다.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            toast({
                title: "벙주 횟수 추가 실패",
                description: "오류가 발생했습니다.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={handleIncrement}
            disabled={isLoading}
            title="벙주 횟수 추가"
        >
            <PlusCircle className="h-4 w-4" />
            <span className="sr-only">벙주 횟수 추가</span>
        </Button>
    );
}
