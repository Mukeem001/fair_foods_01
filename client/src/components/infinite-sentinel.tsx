import { useEffect, useRef } from "react";

export default function InfiniteSentinel({
  onLoadMore,
  hasMore,
}: {
  onLoadMore: () => void | Promise<void>;
  hasMore: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasMore) return;
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first?.isIntersecting) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    io.observe(el);
    return () => io.disconnect();
  }, [hasMore, onLoadMore]);

  return <div ref={ref} style={{ height: 1 }} />;
}

