export type Language = 'cpp' | 'c' | 'python' | 'js' | 'java';

export type Verdict =
  | 'Pending'
  | 'Accepted'
  | 'Wrong Answer'
  | 'Time Limit Exceeded'
  | 'Runtime Error'
  | 'Compile Error';

export interface Submission {
  id: string;
  userId: string;
  problemId: string;
  language: Language;
  verdict: Verdict;
  executionTimeMs: number | null;
  memoryUsedKB: number | null;
  testCasesPassed: number;
  totalTestCases: number;
  errorMessage: string;
  createdAt: string;
}
