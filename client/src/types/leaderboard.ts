export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string | null;
  solved: number;
  totalAccepted: number;
}

export interface MyStats {
  totalSubmissions: number;
  acceptedSubmissions: number;
  solvedProblems: number;
  rank: number;
  verdicts: Record<string, number>;
}
