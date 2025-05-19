"use client";

import { createSurvey } from "@/lib/actions";
import { useState } from "react";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "./ui/use-toast";
export function SurveyForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [meetingDate, setMeetingDate] = useState("");
  const [meetingType, setMeetingType] = useState("");

  async function handleSubmit(formData: FormData) {
    setIsSubmitting(true);
    const result = await createSurvey(formData);

    if (result.success) {
      setMeetingDate("");
      setMeetingType("");
      toast({
        title: "설문이 등록되었습니다.",
        description: "익명으로 설문이 등록되었습니다.",
      });
    }
    setIsSubmitting(false);
  }

  function handleReset() {
    setMeetingDate("");
    setMeetingType("");
  }

  // Get min date (today) in YYYY-MM-DD format
  const today = format(new Date(), "yyyy-MM-dd");

  return (
    <div className="container mx-auto py-8">
      <Card className="w-full mx-auto">
        <form action={handleSubmit}>
          <CardHeader>
            <CardTitle>모임 설문조사</CardTitle>
          </CardHeader>

          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="meetingDate">원하는 모임 날짜</Label>
              <Input
                id="meetingDate"
                name="meetingDate"
                type="date"
                min={today}
                required
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="meetingType">원하는 모임</Label>
              <Input
                id="meetingType"
                name="meetingType"
                placeholder="원하는 모임을 입력하세요"
                required
                value={meetingType}
                onChange={(e) => setMeetingType(e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </CardContent>

          <CardFooter className="flex justify-end gap-2 border-t pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isSubmitting}
            >
              초기화
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  제출 중...
                </>
              ) : (
                "제출하기"
              )}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
