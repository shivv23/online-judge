import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import VerdictBadge, { verdictClass } from '../components/VerdictBadge';
import type { Verdict } from '../types/submission';

describe('verdictClass', () => {
  it('converts Accepted to verdict-accepted', () => {
    expect(verdictClass('Accepted')).toBe('verdict-accepted');
  });

  it('converts Wrong Answer to verdict-wrong-answer', () => {
    expect(verdictClass('Wrong Answer')).toBe('verdict-wrong-answer');
  });

  it('converts Time Limit Exceeded to verdict-time-limit-exceeded', () => {
    expect(verdictClass('Time Limit Exceeded')).toBe('verdict-time-limit-exceeded');
  });

  it('converts Pending to verdict-pending', () => {
    expect(verdictClass('Pending')).toBe('verdict-pending');
  });

  it('converts Runtime Error to verdict-runtime-error', () => {
    expect(verdictClass('Runtime Error')).toBe('verdict-runtime-error');
  });

  it('converts Compile Error to verdict-compile-error', () => {
    expect(verdictClass('Compile Error')).toBe('verdict-compile-error');
  });
});

describe('VerdictBadge', () => {
  const verdicts: Verdict[] = [
    'Pending',
    'Accepted',
    'Wrong Answer',
    'Time Limit Exceeded',
    'Runtime Error',
    'Compile Error',
  ];

  verdicts.forEach((verdict) => {
    it(`renders "${verdict}" with correct class`, () => {
      render(<VerdictBadge verdict={verdict} />);
      const span = screen.getByText(verdict);
      expect(span).toBeInTheDocument();
      expect(span).toHaveClass('verdict-badge');
      expect(span).toHaveClass(verdictClass(verdict));
    });
  });
});
