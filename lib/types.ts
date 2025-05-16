export interface Post {
  id: number
  title: string
  content: string
  ip: string
  created_at: string
}

export interface PaginationResult<T> {
  data: T[]
  totalPages: number
  currentPage: number
}

export interface AdminStatus {
  isAdmin: boolean
}
