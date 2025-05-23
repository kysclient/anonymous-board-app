"use client";

import { useState, useTransition, useCallback } from "react";
import { Table } from "@/components/ui/table";
import { UsersTableSkeleton } from "./users-table-skeleton";
import { UserTableHeader } from "./user-table-header";
import { UserTableBody } from "./user-table-body";
import { UserCardList } from "./user-card-list";
import { SearchInput } from "./search-input";
import { CreateUserDialog } from "./create-user-dialog";
import { ResetMeetupCountsButton } from "./reset-meetup-counts-button";
import { searchUsersByName, User } from "../\bactions";

interface UsersSearchTableProps {
  initialUsers: User[];
}

export function UsersSearchTable({ initialUsers }: UsersSearchTableProps) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, startSearchTransition] = useTransition();

  // 사용자 목록 새로고침 함수
  const refreshUsers = useCallback(async () => {
    try {
      // 검색어가 있으면 검색 결과를, 없으면 전체 목록을 가져옴
      const refreshedUsers = searchTerm
        ? await searchUsersByName(searchTerm)
        : await searchUsersByName("");
      setUsers(refreshedUsers);
    } catch (error) {
      console.error("사용자 목록 새로고침 오류:", error);
    }
  }, [searchTerm]);

  // 검색 처리 함수
  const handleSearch = useCallback((term: string) => {
    startSearchTransition(async () => {
      try {
        setSearchTerm(term);
        const searchResults = term
          ? await searchUsersByName(term)
          : await searchUsersByName("");
        setUsers(searchResults);
      } catch (error) {
        console.error("검색 오류:", error);
      }
    });
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput />

        <div className="flex flex-col gap-2 sm:flex-row">
          <ResetMeetupCountsButton />
          <CreateUserDialog />
        </div>
      </div>

      {isSearching ? (
        <UsersTableSkeleton />
      ) : (
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
          <div className="hidden sm:block rounded-md border overflow-x-auto">
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
      )}
    </div>
  );
}
