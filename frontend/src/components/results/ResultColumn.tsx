import type { ReactNode } from 'react';
import { formatPrice } from '../../lib/utils';

interface ResultColumnProps {
  header: ReactNode;
  total: number;
  children: ReactNode;
  'data-testid'?: string;
}

export function ResultColumn({ header, total, children, 'data-testid': testId }: ResultColumnProps) {
  return (
    <div className="border border-zinc-200 rounded-xl overflow-hidden" data-testid={testId}>
      {header}
      {children}
      <div className="px-3 py-2 bg-zinc-50 font-semibold text-right text-sm">
        {formatPrice(total)}
      </div>
    </div>
  );
}
