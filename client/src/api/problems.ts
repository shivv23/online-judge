import { api } from './client';
import type { Difficulty, PaginatedResponse, Pagination, ProblemDetail, ProblemSummary } from '../types/problem';

export interface ProblemFilters {
  page?: number;
  limit?: number;
  difficulty?: Difficulty;
  search?: string;
}

export interface ProblemListResult {
  problems: ProblemSummary[];
  pagination: Pagination;
}

export const problemsApi = {
  async list(filters: ProblemFilters = {}): Promise<ProblemListResult> {
    const res = await api.get<PaginatedResponse<ProblemSummary>>('/problems', { params: filters });
    return { problems: res.data.data, pagination: res.data.pagination };
  },

  async get(slug: string): Promise<ProblemDetail> {
    const res = await api.get<{ success: true; data: ProblemDetail }>(`/problems/${encodeURIComponent(slug)}`);
    return res.data.data;
  },
};
