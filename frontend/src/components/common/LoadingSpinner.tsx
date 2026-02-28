export function LoadingSpinner(): React.ReactElement {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-spin h-8 w-8 border-4 border-green-600 border-t-transparent rounded-full" />
      <p className="mt-4 text-zinc-500">Comparing prices...</p>
    </div>
  );
}
