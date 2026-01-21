"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
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
  
  // 최신 값을 항상 참조할 수 있도록 ref 사용
  const searchTermRef = useRef(searchTerm);
  const sortKeyRef = useRef(sortKey);
  const sortOrderRef = useRef(sortOrder);

  // ref 업데이트
  useEffect(() => {
    searchTermRef.current = searchTerm;
  }, [searchTerm]);

  useEffect(() => {
    sortKeyRef.current = sortKey;
  }, [sortKey]);

  useEffect(() => {
    sortOrderRef.current = sortOrder;
  }, [sortOrder]);

  // 데이터 가져오기 함수
  const fetchUsers = useCallback(async (
    key: SortKey,
    order: SortOrder,
    term: string
  ) => {
    console.log('[fetchUsers] 호출됨:', { key, order, term });
    setIsLoading(true);
    try {
      const newUsers = await getUsers(key, order, term);
      console.log('[fetchUsers] 결과:', newUsers.length, '명');
      setUsers(newUsers);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 정렬 파라미터나 검색어가 변경되면 데이터 다시 가져오기
  useEffect(() => {
    console.log('[useEffect] 트리거됨:', { sortKey, sortOrder, searchTerm });
    fetchUsers(sortKey, sortOrder, searchTerm);
  }, [sortKey, sortOrder, searchTerm, fetchUsers]);

  // 사용자 목록 새로고침 (현재 검색어와 정렬 유지)
  const refreshUsers = useCallback(async () => {
    // ref를 사용하여 항상 최신 검색어, 정렬값 사용
    const currentSearchTerm = searchTermRef.current;
    const currentSortKey = sortKeyRef.current;
    const currentSortOrder = sortOrderRef.current;
    
    console.log('[refreshUsers] 호출됨:', { currentSortKey, currentSortOrder, currentSearchTerm });
    
    setIsLoading(true);
    try {
      const refreshedUsers = await getUsers(
        currentSortKey,
        currentSortOrder,
        currentSearchTerm
      );
      console.log('[refreshUsers] 결과:', refreshedUsers.length, '명');
      setUsers(refreshedUsers);
    } catch (error) {
      console.error("Failed to refresh users:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

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
