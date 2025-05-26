export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

export enum UserStatus {
  ACTIVE = 'active',
  BANNED = 'banned',
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLogin?: string;
  isEmailVerified: boolean;
}

export interface UserListingParams {
  page?: number;
  pageSize?: number;
  search?: string;
  roles?: string[];
  statuses?: string[];
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: string;
  country?: string;
}

export interface UserListingResponse {
  users: User[];
  pagination: {
    total: number;
    totalPages: number;
    currentPage: number;
    pageSize: number;
    hasMore: boolean;
    hasPrevious: boolean;
  };
}

export interface CreateUserData {
  name: string;
  email: string;
  phoneNumber?: string;
  country?: string;
} 