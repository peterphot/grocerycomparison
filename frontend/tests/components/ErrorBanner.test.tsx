import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { ErrorBanner } from '../../src/components/common/ErrorBanner';

describe('ErrorBanner', () => {
  it('shows default error message', () => {
    render(<ErrorBanner message="We couldn't reach any stores right now. Try again shortly." onRetry={() => {}} />);
    expect(screen.getByText("We couldn't reach any stores right now. Try again shortly.")).toBeInTheDocument();
  });

  it('shows timeout message for status 408', () => {
    render(<ErrorBanner message="This is taking longer than usual. Try again?" onRetry={() => {}} />);
    expect(screen.getByText('This is taking longer than usual. Try again?')).toBeInTheDocument();
  });

  it('shows rate-limit message for status 429', () => {
    render(<ErrorBanner message="Too many requests. Please wait a moment and try again." onRetry={() => {}} />);
    expect(screen.getByText('Too many requests. Please wait a moment and try again.')).toBeInTheDocument();
  });

  it('renders Try Again button', () => {
    render(<ErrorBanner message="error" onRetry={() => {}} />);
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('Try Again button calls onRetry prop', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    render(<ErrorBanner message="error" onRetry={onRetry} />);
    await user.click(screen.getByRole('button', { name: /try again/i }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });
});
