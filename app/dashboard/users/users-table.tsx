"use client";

import { memo, useMemo } from "react";
import { Table } from "@/components/ui/table";
import { UserTableHeader } from "./user-table-header";
import { UserTableBody } from "./user-table-body";
import { UserCardList } from "./user-card-list";
import { UsersTableSkeleton } from "./users-table-skeleton";
import { useUsers } from "./users-context";

export const UsersTable = memo(function UsersTable() {
  const { users, searchTerm, isLoading } = useUsers();

  // 검색 필터링
  const filteredUsers = useMemo(() => {
    if (!searchTerm.trim()) {
      return users;
    }
    const lowerSearch = searchTerm.toLowerCase();
    return users.filter((user) =>
      user.name.toLowerCase().includes(lowerSearch)
    );
  }, [users, searchTerm]);

  if (isLoading) {
    return <UsersTableSkeleton />;
  }

  if (filteredUsers.length === 0) {
    return (
      <div className="text-center py-12 border rounded-xl bg-muted/50">
        <p className="text-muted-foreground">
          {searchTerm
            ? `"${searchTerm}"에 대한 검색 결과가 없습니다.`
            : "표시할 사용자가 없습니다."}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* 모바일 카드 뷰 */}
      <div className="block sm:hidden">
        <UserCardList users={filteredUsers} />
      </div>

      {/* 데스크톱 테이블 뷰 */}
      <div className="hidden sm:block rounded-xl border overflow-x-auto py-2">
        <Table>
          <UserTableHeader />
          <UserTableBody users={filteredUsers} />
        </Table>
      </div>
    </>
  );
});
