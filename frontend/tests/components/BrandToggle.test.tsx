import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { BrandToggle } from '../../src/components/shopping-list/BrandToggle';

describe('BrandToggle', () => {
  it('renders two toggle options', () => {
    render(<BrandToggle isBrandSpecific={false} onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /any brand/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /brand only/i })).toBeInTheDocument();
  });

  it('highlights "Any brand" when isBrandSpecific is false', () => {
    render(<BrandToggle isBrandSpecific={false} onChange={vi.fn()} />);
    const anyBrandBtn = screen.getByRole('button', { name: /any brand/i });
    expect(anyBrandBtn.className).toContain('bg-white');
    expect(anyBrandBtn.className).toContain('text-green-600');
  });

  it('highlights "Brand only" when isBrandSpecific is true', () => {
    render(<BrandToggle isBrandSpecific={true} onChange={vi.fn()} />);
    const brandOnlyBtn = screen.getByRole('button', { name: /brand only/i });
    expect(brandOnlyBtn.className).toContain('bg-white');
    expect(brandOnlyBtn.className).toContain('text-green-600');
  });

  it('calls onChange(true) when clicking "Brand only"', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<BrandToggle isBrandSpecific={false} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /brand only/i }));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('calls onChange(false) when clicking "Any brand"', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<BrandToggle isBrandSpecific={true} onChange={onChange} />);
    await user.click(screen.getByRole('button', { name: /any brand/i }));
    expect(onChange).toHaveBeenCalledWith(false);
  });

  it('has accessible group label', () => {
    render(<BrandToggle isBrandSpecific={false} onChange={vi.fn()} />);
    expect(screen.getByRole('group', { name: /brand preference/i })).toBeInTheDocument();
  });
});
