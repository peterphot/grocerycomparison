import { STORE_COLORS, type StoreColorKey } from '../../lib/store-colors';
import { formatPrice } from '../../lib/utils';

interface StoreHeaderProps {
  storeName: string;
  store: StoreColorKey;
  isCheapest: boolean;
  total?: number;
}

export function StoreHeader({ storeName, store, isCheapest, total }: StoreHeaderProps) {
  return (
    <div
      className="px-3 py-3 text-white text-center rounded-t-xl"
      style={{ backgroundColor: STORE_COLORS[store] }}
    >
      <p className="font-semibold text-sm leading-tight">{storeName}</p>
      {total !== undefined && (
        <>
          <p className="text-white/50 text-xs mt-1">Total</p>
          <p className="text-xl font-bold font-[family-name:var(--font-plus-jakarta)]">
            {formatPrice(total)}
          </p>
        </>
      )}
      {isCheapest && (
        <span className="inline-block mt-1 bg-white/20 text-white text-xs font-medium rounded-full px-2 py-0.5">
          cheapest store
        </span>
      )}
    </div>
  );
}
