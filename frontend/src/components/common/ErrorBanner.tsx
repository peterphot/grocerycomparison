interface ErrorBannerProps {
  message: string;
  onRetry: () => void;
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
      <p className="text-red-700 font-medium">Something went wrong</p>
      <p className="text-red-600 text-sm mt-1">{message}</p>
      <button
        onClick={onRetry}
        className="mt-3 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700"
      >
        Try Again
      </button>
    </div>
  );
}
