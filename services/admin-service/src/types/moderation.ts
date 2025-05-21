/**
 * Type for user search query parameters
 */
export interface SearchQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Type for ban user parameters
 */
export interface BanUserParams {
  id: string;
}

/**
 * Type for ban user request body
 */
export interface BanUserBody {
  reason: string;
  notes?: string;
  permanent?: boolean;
  expiresAt?: string;
}

/**
 * Type for log query parameters
 */
export interface LogQuery {
  page?: number;
  limit?: number;
  actionType?: string;
  adminId?: string;
  targetId?: string;
  startDate?: string;
  endDate?: string;
} 