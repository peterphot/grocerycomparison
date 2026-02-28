import { memo } from 'react';
import { Star } from 'lucide-react';
import { formatPrice } from '../../lib/utils';

interface SavingsTipProps {
  savings: number;
}

export const SavingsTip = memo(function SavingsTip({ savings }: SavingsTipProps) {
  if (savings <= 0) return null;

  return (
    <div className="bg-violet-50 rounded-xl px-3 py-3 flex items-center gap-2 mt-3">
      <Star size={16} className="text-violet-600 flex-shrink-0" />
      <span className="text-sm font-medium text-violet-700">
        Save {formatPrice(savings)} more with Mix & Match
      </span>
    </div>
  );
});
