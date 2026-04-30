"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown } from "lucide-react";
import { useUsers } from "./users-context";

export function SortUser() {
  const { sortKey, sortOrder, setSorting } = useUsers();

  const handleSortChange = (value: string) => {
    const [sort, order] = value.split(":") as [
      typeof sortKey,
      typeof sortOrder
    ];
    setSorting(sort, order);
  };

  return (
    <Select value={`${sortKey}:${sortOrder}`} onValueChange={handleSortChange}>
      <SelectTrigger className="h-10 w-auto min-w-[180px] gap-2 rounded-full border-md-outline bg-transparent px-4 type-label-large text-md-on-surface hover:bg-md-surface-container-high">
        <ArrowUpDown className="h-4 w-4 text-md-on-surface-variant" />
        <SelectValue placeholder="정렬 선택" />
      </SelectTrigger>
      <SelectContent className="rounded-2xl">
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
