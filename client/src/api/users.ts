import { api } from './client';
import type { LeaderboardEntry, MyStats } from '../types/leaderboard';
import type { PaginatedResponse, Pagination } from '../types/problem';

interface SuccessData<T> {
  success: true;
  data: T;
}

export interface LeaderboardResult {
  entries: LeaderboardEntry[];
  pagination: Pagination;
}

export const usersApi = {
  async myStats(): Promise<MyStats> {
    const res = await api.get<SuccessData<MyStats>>('/users/me/stats');
    return res.data.data;
  },

  async leaderboard(filters: { page?: number; limit?: number } = {}): Promise<LeaderboardResult> {
    const res = await api.get<PaginatedResponse<LeaderboardEntry>>('/leaderboard', {
      params: filters,
    });
    return { entries: res.data.data, pagination: res.data.pagination };
  },
};
