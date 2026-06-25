"use client";

import { memo } from "react";
import { Table } from "@/components/ui/table";
import { UserTableHeader } from "./user-table-header";
import { UserTableBody } from "./user-table-body";
import { UserCardList } from "./user-card-list";
import { UsersTableSkeleton } from "./users-table-skeleton";
import { useUsers } from "./users-context";
import { Search } from "lucide-react";

export const UsersTable = memo(function UsersTable() {
  const { users, searchTerm, isLoading } = useUsers();
  const filteredUsers = users;

  if (isLoading) {
    return <UsersTableSkeleton />;
  }

  if (filteredUsers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-md-outline-variant/65 bg-md-surface-container-lowest py-16">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-md-surface-container-high">
          <Search className="h-5 w-5 text-md-on-surface-variant" />
        </div>
        <div className="space-y-1 text-center">
          <p className="text-[15px] font-semibold text-md-on-surface">
            {searchTerm ? `"${searchTerm}" 검색 결과 없음` : "표시할 멤버가 없어요"}
          </p>
          <p className="text-[13px] text-md-on-surface-variant">
            {searchTerm
              ? "다른 키워드로 다시 시도해보세요"
              : "오른쪽 위의 ‘멤버 추가’로 새 멤버를 등록하세요"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Mobile cards */}
      <div className="block space-y-2.5 sm:hidden">
        <UserCardList users={filteredUsers} />
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-2xl border border-md-outline-variant/65 bg-md-surface-container-lowest sm:block">
        <Table className="border-collapse">
          <UserTableHeader />
          <UserTableBody users={filteredUsers} />
        </Table>
      </div>

      <p className="px-1 text-[12px] tracking-tight text-md-on-surface-variant/70">
        {filteredUsers.length}명 표시중
        {searchTerm ? ` · "${searchTerm}" 검색 결과` : ""}
      </p>
    </>
  );
});
