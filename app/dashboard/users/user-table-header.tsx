import { memo } from "react";
import { TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const UserTableHeader = memo(function UserTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead className="w-[80px]">ID</TableHead>
        <TableHead>이름</TableHead>
        <TableHead className="hidden md:table-cell">가입일</TableHead>
        <TableHead className="hidden lg:table-cell">최근 벙 참석일</TableHead>
        <TableHead>구분</TableHead>
        <TableHead className="text-center">이번 달</TableHead>
        <TableHead className="text-center hidden md:table-cell">누적</TableHead>
        <TableHead className="text-center">벙 추가</TableHead>
        <TableHead className="text-right">관리</TableHead>
      </TableRow>
    </TableHeader>
  );
});
