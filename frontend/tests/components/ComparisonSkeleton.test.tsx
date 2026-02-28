import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ComparisonSkeleton } from '../../src/components/common/ComparisonSkeleton';

describe('ComparisonSkeleton', () => {
  it('renders 5 column skeletons (4 stores + mix)', () => {
    const { container } = render(<ComparisonSkeleton />);
    const columns = container.querySelectorAll('[data-testid="skeleton-column"]');
    expect(columns).toHaveLength(5);
  });

  it('each column has multiple skeleton rows', () => {
    const { container } = render(<ComparisonSkeleton />);
    const columns = container.querySelectorAll('[data-testid="skeleton-column"]');
    columns.forEach((column) => {
      const rows = column.querySelectorAll('.animate-pulse');
      expect(rows.length).toBeGreaterThanOrEqual(3);
    });
  });
});
