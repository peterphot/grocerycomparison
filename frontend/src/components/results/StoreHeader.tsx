import { STORE_COLORS } from '../../lib/store-colors';

interface StoreHeaderProps {
  storeName: string;
  store: string;
  isCheapest: boolean;
}

export function StoreHeader({ storeName, store, isCheapest }: StoreHeaderProps) {
  const bgColor = STORE_COLORS[store] || '#6B7280';

  return (
    <div
      className={`px-3 py-2 text-white font-semibold text-center rounded-t-xl ${isCheapest ? 'ring-2 ring-green-400' : ''}`}
      style={{ backgroundColor: bgColor }}
    >
      {storeName}
    </div>
  );
}
