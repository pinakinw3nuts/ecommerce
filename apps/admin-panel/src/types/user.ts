export type UserRole = 'admin' | 'moderator' | 'user';
export type UserStatus = 'active' | 'banned';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  lastLogin: string | null;
  phoneNumber: string | null;
  isEmailVerified: boolean;
  country: string;
}

export interface UserListingParams {
  page?: number;
  pageSize?: number;
  search?: string;
  roles?: UserRole[];
  statuses?: UserStatus[];
  dateFrom?: string;
  dateTo?: string;
  sortBy?: keyof User;
  sortOrder?: 'asc' | 'desc';
  country?: string;
}

export interface PaginationData {
  total: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
  hasMore: boolean;
  hasPrevious: boolean;
}

export interface UserListingResponse {
  users: User[];
  pagination: PaginationData;
}

export interface CreateUserData {
  name: string;
  email: string;
  phoneNumber?: string;
  country?: string;
} 