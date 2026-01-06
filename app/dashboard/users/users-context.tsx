"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  type ReactNode,
} from "react";
import { getUsers, User } from "../actions";
import { SortKey, SortOrder } from "./page";

interface UsersContextType {
  users: User[];
  searchTerm: string;
  isLoading: boolean;
  sortKey: SortKey;
  sortOrder: SortOrder;
  setSearchTerm: (term: string) => void;
  setSorting: (key: SortKey, order: SortOrder) => void;
  refreshUsers: () => Promise<void>;
}

const UsersContext = createContext<UsersContextType | undefined>(undefined);

export function UsersProvider({
  children,
  initialUsers,
  initialSortKey = "join_date",
  initialSortOrder = "desc",
}: {
  children: ReactNode;
  initialUsers: User[];
  initialSortKey?: SortKey;
  initialSortOrder?: SortOrder;
}) {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>(initialSortKey);
  const [sortOrder, setSortOrder] = useState<SortOrder>(initialSortOrder);

  // 정렬 파라미터가 변경되면 데이터 다시 가져오기
  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const newUsers = await getUsers(sortKey, sortOrder);
        setUsers(newUsers);
      } catch (error) {
        console.error("Failed to fetch users:", error);
      } finally {
        setIsLoading(false);
      }
    };

    // 초기 로드가 아닐 때만 다시 fetch
    if (sortKey !== initialSortKey || sortOrder !== initialSortOrder) {
      fetchUsers();
    }
  }, [sortKey, sortOrder, initialSortKey, initialSortOrder]);

  // 사용자 목록 새로고침
  const refreshUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const refreshedUsers = await getUsers(sortKey, sortOrder);
      setUsers(refreshedUsers);
    } catch (error) {
      console.error("Failed to refresh users:", error);
    } finally {
      setIsLoading(false);
    }
  }, [sortKey, sortOrder]);

  // 정렬 변경
  const setSorting = useCallback((key: SortKey, order: SortOrder) => {
    setSortKey(key);
    setSortOrder(order);
  }, []);

  const value = useMemo(
    () => ({
      users,
      searchTerm,
      isLoading,
      sortKey,
      sortOrder,
      setSearchTerm,
      setSorting,
      refreshUsers,
    }),
    [
      users,
      searchTerm,
      isLoading,
      sortKey,
      sortOrder,
      setSorting,
      refreshUsers,
    ]
  );

  return (
    <UsersContext.Provider value={value}>{children}</UsersContext.Provider>
  );
}

export function useUsers() {
  const context = useContext(UsersContext);
  if (context === undefined) {
    throw new Error("useUsers must be used within a UsersProvider");
  }
  return context;
}
