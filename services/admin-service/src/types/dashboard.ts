import { TimePeriod } from '../services/dashboard.service';

/**
 * Type for time range query parameters
 */
export interface TimeRangeQuery {
  period?: TimePeriod;
}

/**
 * Type for chart data query parameters
 */
export interface ChartDataQuery extends TimeRangeQuery {
  groupBy?: 'day' | 'week' | 'month';
  limit?: number;
} 