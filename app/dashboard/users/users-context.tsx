"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { searchUsersByName, User } from "../\bactions";

interface UsersContextType {
  users: User[];
  searchTerm: string;
  isLoading: boolean;
  setSearchTerm: (term: string) => void;
  refreshUsers: () => Promise<void>;
  searchUsers: (term: string) => Promise<void>;
  resetSearch: () => void;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

export function UsersProvider({
  children,
  initialUsers,
}: {
  children: ReactNode;
  initialUsers: User[];
}) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 사용자 목록 새로고침
  const refreshUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      // 검색어가 있으면 검색 결과를, 없으면 전체 목록을 가져옴
      const refreshedUsers = searchTerm
        ? await searchUsersByName(searchTerm)
        : await searchUsersByName("");
      setUsers(refreshedUsers);
    } catch (error) {
      console.error("사용자 목록 새로고침 오류:", error);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm]);

  // 사용자 검색 (검색어를 받아서 처리)
  const searchUsers = useCallback(async (term: string) => {
    setIsLoading(true);
    try {
      setSearchTerm(term);
      const searchResults = await searchUsersByName(term);
      setUsers(searchResults);
    } catch (error) {
      console.error("사용자 검색 오류:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 검색 초기화
  const resetSearch = useCallback(async () => {
    setSearchTerm("");
    setIsLoading(true);
    try {
      const allUsers = await searchUsersByName("");
      setUsers(allUsers);
    } catch (error) {
      console.error("검색 초기화 오류:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <UsersContext.Provider
      value={{
        users,
        searchTerm,
        isLoading,
        setSearchTerm,
        refreshUsers,
        searchUsers,
        resetSearch,
      }}
    >
      {children}
    </UsersContext.Provider>
  );
}

export function useUsers() {
  const context = useContext(UsersContext);
  if (context === undefined) {
    throw new Error("useUsers must be used within a UsersProvider");
  }
  return context;
}
