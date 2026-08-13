import type { Verdict } from '../types/submission';

export function verdictClass(verdict: Verdict): string {
  return 'verdict-' + verdict.toLowerCase().replace(/\s+/g, '-');
}

export default function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return <span className={`verdict-badge ${verdictClass(verdict)}`}>{verdict}</span>;
}
