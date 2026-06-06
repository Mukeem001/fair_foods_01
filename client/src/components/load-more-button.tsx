import { Loader2 } from "lucide-react";

type LoadMoreButtonProps = {
  onClick: () => void;
  remaining: number;
  loading?: boolean;
};

export function LoadMoreButton({ onClick, remaining, loading }: LoadMoreButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="w-full mt-4 py-3 rounded-xl border border-green-500 text-green-600 font-medium text-sm
        hover:bg-green-50 active:bg-green-100 transition disabled:opacity-60
        flex items-center justify-center gap-2"
    >
      {loading ? (
        <>
          <Loader2 size={18} className="animate-spin" />
          Loading…
        </>
      ) : (
        <>Load More ({remaining} left)</>
      )}
    </button>
  );
}
