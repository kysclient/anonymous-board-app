"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SortKey, SortOrder } from "./page";

interface SortUserProps {
  sortKey: SortKey;
  sortOrder: SortOrder;
}

export function SortUser({ sortKey, sortOrder }: SortUserProps) {
  return (
    <Select
      defaultValue={`${sortKey}:${sortOrder}`}
      onValueChange={(value) => {
        const [sort, order] = value.split(":");
        window.location.href = `?sort=${sort}&order=${order}`;
      }}
    >
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="정렬 선택" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="join_date:desc">가입일 최신순</SelectItem>
        <SelectItem value="join_date:asc">가입일 오래된순</SelectItem>
        <SelectItem value="last_meetup_date:desc">
          마지막 모임 최신순
        </SelectItem>
        <SelectItem value="last_meetup_date:asc">
          마지막 모임 오래된순
        </SelectItem>
        <SelectItem value="name:asc">이름순 (가나다)</SelectItem>
        <SelectItem value="name:desc">이름순 (다나가)</SelectItem>
      </SelectContent>
    </Select>
  );
}
