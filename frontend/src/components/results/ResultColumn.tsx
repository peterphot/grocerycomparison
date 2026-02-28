import type { ReactNode } from 'react';
import { formatPrice } from '../../lib/utils';

interface ResultColumnProps {
  header: ReactNode;
  total: number;
  children: ReactNode;
  className?: string;
  'data-testid'?: string;
}

export function ResultColumn({ header, total, children, className, 'data-testid': testId }: ResultColumnProps) {
  return (
    <div
      className={`border border-zinc-200 rounded-xl shadow-sm overflow-hidden ${className ?? ''}`}
      data-testid={testId}
    >
      {header}
      {children}
      <div className="px-3 py-2 bg-zinc-50 font-semibold text-right text-sm">
        {formatPrice(total)}
      </div>
    </div>
  );
}
