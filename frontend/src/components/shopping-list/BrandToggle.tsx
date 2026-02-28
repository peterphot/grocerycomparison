'use client';

interface BrandToggleProps {
  isBrandSpecific: boolean;
  onChange: (isBrandSpecific: boolean) => void;
}

export function BrandToggle({ isBrandSpecific, onChange }: BrandToggleProps) {
  return (
    <div
      role="group"
      aria-label="Brand preference"
      className="inline-flex bg-zinc-100 rounded-lg p-0.5 gap-0.5"
    >
      <button
        type="button"
        onClick={() => onChange(false)}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          !isBrandSpecific
            ? 'bg-white text-green-600 shadow-sm'
            : 'text-zinc-500 hover:text-zinc-700'
        }`}
      >
        Any brand
      </button>
      <button
        type="button"
        onClick={() => onChange(true)}
        className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
          isBrandSpecific
            ? 'bg-white text-green-600 shadow-sm'
            : 'text-zinc-500 hover:text-zinc-700'
        }`}
      >
        Brand only
      </button>
    </div>
  );
}
