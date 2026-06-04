  import { useState, useEffect, useMemo } from "react";
  import { useStore } from "@/lib/store";
  import { FoodCard } from "@/components/food-card";
  import { BottomNav } from "@/components/bottom-nav";
  import InfiniteSentinel from "@/components/infinite-sentinel";
  import { Spinner } from "@/components/ui/spinner";
  import { usePaginatedList } from "@/hooks/use-paginated-list";
  import { Search, MapPin } from "lucide-react";
  import { motion, AnimatePresence } from "framer-motion";
  import type { FoodItem } from "@/lib/store";

  import logo from "@/assets/logo.png";
  import heroImg from "@/assets/food-hero.png";
  import food1 from "@/assets/food-1.png";
  import food2 from "@/assets/food-2.png";
  import food3 from "@/assets/food-3.png";
  import food4 from "@/assets/food-4.png";

  const SLIDES = [heroImg, food1, food2, food3, food4];

  export default function Home() {
    const store = useStore();
    const foods = store?.foods ?? [];

    const [search, setSearch] = useState<string>("");
    const [category, setCategory] = useState<string>("All");
    const [currentSlide, setCurrentSlide] = useState<number>(0);

    useEffect(() => {
      const timer = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
      }, 4000);
      return () => clearInterval(timer);
    }, []);

    const categories: string[] = [
      "All",
      ...Array.from(new Set(foods.map((f: any) => f.category))),
    ];

    const filteredFoods = useMemo(
      () =>
        foods.filter((f: FoodItem) => {
          const matchesCategory = category === "All" || f.category === category;
          const matchesSearch = f.name
            ?.toLowerCase()
            .includes(search.toLowerCase());
          return matchesCategory && matchesSearch && f.active;
        }),
      [foods, category, search]
    );

    const { visible, hasMore, loadMore, remaining } = usePaginatedList(
      filteredFoods,
      undefined,
      `${search}-${category}`
    );

    const [loadingMore, setLoadingMore] = useState(false);

    const handleLoadMore = async () => {
      if (loadingMore) return;
      setLoadingMore(true);
      await new Promise((r) => setTimeout(r, 2000));
      loadMore();
      setLoadingMore(false);
    };

    return (
      <>
      <div className="min-h-screen bg-[#f8f9fb] pb-16">


        {/* 🌟 COMPACT NAVBAR */}
        <div className="sticky top-0 z-50 bg-white rounded-b-[24px] shadow-sm">
          <div className="px-5 py-3 flex items-center justify-between">

            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-br from-orange-500 to-rose-500 
                              text-white p-2 rounded-lg shadow-sm">
                <MapPin size={14} />
              </div>
              <div className="leading-tight">
                <p className="text-[10px] text-gray-400">Deliver to</p>
                <p className="text-sm font-semibold text-gray-800">
                  Your Location
                </p>
              </div>
            </div>

            <img
              src={logo}
              alt="Logo"
              className="h-8 w-8 object-contain"
            />
          </div>
        </div>

        {/* 🌟 SMALLER PREMIUM SLIDER */}
        <div className="px-5 mt-3">
          <div className="relative h-36 rounded-[24px] overflow-hidden shadow-lg">

            <AnimatePresence mode="wait">
              <motion.img
                key={currentSlide}
                src={SLIDES[currentSlide]}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.6 }}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </AnimatePresence>

            <div className="absolute inset-0 bg-gradient-to-r 
                            from-black/40 via-black/20 to-transparent" />

            <div className="absolute bottom-4 left-4 text-white">
              <h2 className="text-lg font-semibold">
                Elevate Your Taste
              </h2>
              <p className="text-xs opacity-90">
                Fresh premium meals
              </p>
            </div>
          </div>
        </div>

        {/* 🔍 SEARCH */}
        <div className="px-5 mt-4">
          <div className="bg-white rounded-xl shadow-sm 
                          p-2.5 flex items-center gap-2">
            <Search size={16} className="text-gray-400 ml-1" />
            <input
              type="text"
              placeholder="Search dishes..."
              className="flex-1 outline-none bg-transparent text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* 🍽 CATEGORIES */}
        <div className="px-5 mt-4 flex gap-2 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition
                ${
                  category === cat
                    ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow"
                    : "bg-white border border-gray-200 text-gray-600"
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 🍔 FOOD GRID */}
        <div className="px-5 mt-4">
          <div className="grid grid-cols-2 gap-3">
            {visible.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
              >
                <FoodCard item={item} />
              </motion.div>
            ))}
          </div>

          {filteredFoods.length === 0 && (
            <p className="text-center text-gray-400 mt-10 text-sm">
              No items available
            </p>
          )}

          {hasMore && (
            <>
              <InfiniteSentinel onLoadMore={handleLoadMore} hasMore={hasMore} />
              <div className="mt-3 flex justify-center">
                {loadingMore && <Spinner className="w-6 h-6 text-gray-500" />}
              </div>
            </>
          )}
        </div>
      </div>

      <BottomNav />
    </>
  );
}
