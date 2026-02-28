import { ShoppingCart } from 'lucide-react';

const STORE_BADGES = [
  { name: 'Woolworths', color: '#00A347' },
  { name: 'Coles', color: '#E2001A' },
  { name: 'Aldi', color: '#003087' },
  { name: 'Harris Farm', color: '#2D5E2A' },
];

export function EmptyState(): React.ReactElement {
  return (
    <div className="flex items-center justify-center py-12">
      <div className="w-full max-w-[480px] bg-white rounded-[20px] shadow p-12 flex flex-col items-center text-center">
        {/* Green circle with cart icon */}
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <ShoppingCart size={36} className="text-green-600" />
        </div>

        {/* Heading */}
        <h2 className="text-2xl font-bold text-zinc-900 font-[family-name:var(--font-plus-jakarta)]">
          Start comparing prices
        </h2>

        {/* Description */}
        <p className="text-sm text-zinc-500 mt-3 leading-relaxed max-w-sm">
          Add items to your shopping list and click Compare Prices to see the cheapest options across Woolworths, Coles, Aldi, and Harris Farm.
        </p>

        {/* Store badges */}
        <div className="flex flex-wrap gap-2 mt-6 justify-center">
          {STORE_BADGES.map((store) => (
            <span
              key={store.name}
              className="px-3 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: store.color }}
            >
              {store.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
