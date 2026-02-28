export function ComparisonSkeleton(): React.ReactElement {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} data-testid="skeleton-column" className="space-y-2">
          <div className="h-12 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-8 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-8 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-8 w-full animate-pulse rounded bg-gray-200" />
        </div>
      ))}
    </div>
  );
}
