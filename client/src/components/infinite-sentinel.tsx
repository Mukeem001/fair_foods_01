import { useEffect, useRef } from "react";

type Props = {
  onLoadMore: () => void;
  hasMore: boolean;
  root?: Element | null;
  rootMargin?: string;
};

export function InfiniteSentinel({ onLoadMore, hasMore, root, rootMargin = "200px" }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current || !hasMore) return;

    const el = ref.current;
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && hasMore) {
            onLoadMore();
          }
        });
      },
      { root: root || null, rootMargin }
    );

    obs.observe(el);

    return () => obs.disconnect();
  }, [onLoadMore, hasMore, root, rootMargin]);

  return <div ref={ref} style={{ height: 1 }} />;
}

export default InfiniteSentinel;
