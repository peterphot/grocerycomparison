import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';

describe('sample', () => {
  it('should render text content', () => {
    render(<div>Hello World</div>);
    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });
});
