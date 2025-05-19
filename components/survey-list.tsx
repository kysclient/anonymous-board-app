"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSurveys } from "@/lib/actions";
import { Survey } from "@/lib/types";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { useEffect, useState } from "react";
export function SurveyList() {
  const [surveys, setSurveys] = useState<Survey[]>([]);

  const formatDate = (date: Date) =>
    format(date, "yyyy-MM-dd HH:mm:ss", { locale: ko });

  useEffect(() => {
    async function fetchSurveys() {
      const surveys = await getSurveys();
      setSurveys(surveys);
    }
    fetchSurveys();
  }, []);

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">설문 목록</h1>
      <div className="space-y-4">
        {surveys.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <p>설문이 없습니다.</p>
          </div>
        ) : (
          surveys.map((survey) => (
            <Card key={survey.id} className="relative">
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:justify-between items-start">
                  <CardTitle className="text-xl">
                    {survey.meeting_type}
                  </CardTitle>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div data-time>
                      {formatDate(new Date(survey.created_at))}
                    </div>
                    <div className="sm:text-right" data-ip>
                      IP: {survey.ip}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-line">
                  원하는 모임 날짜:{" "}
                  {format(new Date(survey.meeting_date), "yyyy-MM-dd", {
                    locale: ko,
                  })}
                </p>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
