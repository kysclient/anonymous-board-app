"use client";

import { memo, useEffect } from "react";
import { Table } from "@/components/ui/table";
import { UserTableHeader } from "./user-table-header";
import { UserTableBody } from "./user-table-body";
import { UserCardList } from "./user-card-list";
import { UsersTableSkeleton } from "./users-table-skeleton";
import { useUsers } from "./users-context";
import { revalidateUsers } from "../actions";

export const UsersTable = memo(function UsersTable() {
  const { users, searchTerm, isLoading, refreshUsers } = useUsers();

  if (isLoading) {
    return <UsersTableSkeleton />;
  }

  return (
    <>
      {/* 모바일 카드 뷰 */}
      <div className="block sm:hidden">
        <UserCardList
          users={users}
          searchTerm={searchTerm}
          onUpdate={refreshUsers}
        />
      </div>

      {/* 데스크톱 테이블 뷰 */}
      <div className="hidden sm:block rounded-xl border overflow-x-auto py-2">
        <Table>
          <UserTableHeader />
          <UserTableBody
            users={users}
            searchTerm={searchTerm}
            onUpdate={refreshUsers}
          />
        </Table>
      </div>
    </>
  );
});
