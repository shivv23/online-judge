import { api } from './client';
import type { PaginatedResponse, Pagination } from '../types/problem';
import type { Language, Submission } from '../types/submission';

interface SuccessData<T> {
  success: true;
  data: T;
}

export interface CreateSubmissionInput {
  problemId: string;
  language: Language;
  code: string;
}

export interface SubmissionListResult {
  submissions: Submission[];
  pagination: Pagination;
}

export const submissionsApi = {
  async create(input: CreateSubmissionInput): Promise<Submission> {
    const res = await api.post<SuccessData<Submission>>('/submissions', input);
    return res.data.data;
  },

  async get(id: string): Promise<Submission> {
    const res = await api.get<SuccessData<Submission>>(`/submissions/${id}`);
    return res.data.data;
  },

  async listUser(
    userId: string,
    filters: { page?: number; limit?: number } = {},
  ): Promise<SubmissionListResult> {
    const res = await api.get<PaginatedResponse<Submission>>(
      `/submissions/user/${encodeURIComponent(userId)}`,
      { params: filters },
    );
    return { submissions: res.data.data, pagination: res.data.pagination };
  },
};

export async function waitForVerdict(
  submissionId: string,
  onUpdate: (submission: Submission) => void,
  intervalMs = 2000,
  timeoutMs = 90000,
): Promise<Submission> {
  const deadline = Date.now() + timeoutMs;
  let last: Submission | null = null;

  while (Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
    last = await submissionsApi.get(submissionId);
    onUpdate(last);
    if (last.verdict !== 'Pending') {
      return last;
    }
  }

  if (last) {
    return last;
  }
  throw new Error('Could not reach the judge service.');
}
