import { STORE_COLORS, type StoreColorKey } from '../../lib/store-colors';

interface StoreHeaderProps {
  storeName: string;
  store: StoreColorKey;
  isCheapest: boolean;
}

export function StoreHeader({ storeName, store, isCheapest }: StoreHeaderProps) {
  return (
    <div
      className={`px-2 py-2 text-white font-semibold text-center text-sm leading-tight ${isCheapest ? 'ring-2 ring-green-400' : ''}`}
      style={{ backgroundColor: STORE_COLORS[store] }}
    >
      {storeName}
    </div>
  );
}
