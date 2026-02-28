import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { SavingsTip } from '../../src/components/results/SavingsTip';

describe('SavingsTip', () => {
  it('renders savings amount', () => {
    render(<SavingsTip savings={2.03} />);
    expect(screen.getByText(/save \$2\.03/i)).toBeInTheDocument();
  });

  it('includes "Mix & Match" text', () => {
    render(<SavingsTip savings={1.63} />);
    expect(screen.getByText(/mix & match/i)).toBeInTheDocument();
  });

  it('renders nothing when savings is zero', () => {
    const { container } = render(<SavingsTip savings={0} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders nothing when savings is negative', () => {
    const { container } = render(<SavingsTip savings={-1} />);
    expect(container.innerHTML).toBe('');
  });

  it('has purple background styling', () => {
    const { container } = render(<SavingsTip savings={2.03} />);
    const tip = container.firstElementChild;
    expect(tip?.className).toContain('bg-violet-50');
  });
});
