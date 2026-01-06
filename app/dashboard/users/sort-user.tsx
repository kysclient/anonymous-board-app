"use client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SortKey, SortOrder } from "./page";
import { useUsers } from "./users-context";

interface SortUserProps {
  sortKey: SortKey;
  sortOrder: SortOrder;
}

export function SortUser({ sortKey, sortOrder }: SortUserProps) {
  const { setSorting } = useUsers();

  const handleSortChange = (value: string) => {
    const [sort, order] = value.split(":") as [SortKey, SortOrder];
    setSorting(sort, order);
  };

  return (
    <Select
      value={`${sortKey}:${sortOrder}`}
      onValueChange={handleSortChange}
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
