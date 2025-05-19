export interface Post {
  id: number;
  title: string;
  content: string;
  ip: string;
  created_at: string;
}

export interface SearchParams {
  searchType: "title" | "content" | "ip";
  searchQuery: string;
}

export interface PaginationResult<T> {
  data: T[];
  totalPages: number;
  currentPage: number;
  totalCount?: number;
  searchParams?: SearchParams;
}

export interface AdminStatus {
  isAdmin: boolean;
}

export interface Survey {
  id: number;
  meeting_date: string;
  meeting_type: string;
  ip: string;
  created_at: string;
}
