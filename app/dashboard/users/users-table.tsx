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
      <div className="m3-card-filled flex flex-col items-center justify-center gap-3 py-16">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-md-primary-container">
          <Search className="h-6 w-6 text-md-on-primary-container" />
        </div>
        <div className="space-y-1 text-center">
          <p className="type-title-medium text-md-on-surface">
            {searchTerm ? `"${searchTerm}" 검색 결과 없음` : "표시할 멤버가 없어요"}
          </p>
          <p className="type-body-medium text-md-on-surface-variant">
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
      <div className="block sm:hidden space-y-3">
        <UserCardList users={filteredUsers} />
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-3xl bg-md-surface-container-low sm:block">
        <Table className="border-collapse">
          <UserTableHeader />
          <UserTableBody users={filteredUsers} />
        </Table>
      </div>

      <p className="type-label-small text-md-on-surface-variant">
        {filteredUsers.length}명 표시중
        {searchTerm ? ` · "${searchTerm}" 검색 결과` : ""}
      </p>
    </>
  );
});
