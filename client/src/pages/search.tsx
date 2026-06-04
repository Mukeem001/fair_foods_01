import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { BottomNav } from "@/components/bottom-nav";
import { FoodCard } from "@/components/food-card";

import {
  Search,
  MapPin,
  X,
} from "lucide-react";

import logo from "@/assets/logo.png";

export default function SearchPage() {

  const { foods } = useStore();

  const [query, setQuery] = useState("");

  useEffect(() => {
    // future use
  }, []);

  const filtered = useMemo(() => {

    const q = query.trim().toLowerCase();

    return foods
      .filter((f: any) => f.active)
      .filter((f: any) => {

        if (!q) return true;

        return (
          String(f.name ?? "").toLowerCase().includes(q) ||
          String(f.category ?? "").toLowerCase().includes(q)
        );

      });

  }, [foods, query]);

  return (

    <div className="min-h-screen bg-[#f4f7fb] pb-24">

      {/* =========================
          PREMIUM NAVBAR
      ========================== */}

      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl shadow-sm rounded-b-[30px] border-b border-gray-100">

        <div className="max-w-md mx-auto px-4 py-3">

          <div className="flex items-center justify-between">

            {/* LEFT */}

            <div className="flex items-center gap-2.5">

              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-md">

                <MapPin
                  size={14}
                  className="text-white"
                />

              </div>

              <div className="leading-tight">

                <p className="text-[9px] uppercase tracking-wider text-gray-400 font-semibold">
                  Deliver To
                </p>

                <p className="text-xs font-bold text-gray-800">
                  Your Location
                </p>

              </div>

            </div>

            {/* LOGO */}

            <img
              src={logo}
              alt="Logo"
              className="h-10 object-contain"
            />

          </div>

        </div>

      </div>


      {/* =========================
          SEARCH SECTION
      ========================== */}

      <div className="max-w-md mx-auto px-4 pt-4">

        {/* PREMIUM SEARCH BAR */}

        <div className="relative overflow-hidden rounded-2xl bg-white shadow-[0_8px_30px_rgba(0,0,0,0.06)] border border-white">

          {/* GLOW */}

          <div className="absolute inset-0 bg-gradient-to-r from-orange-50 via-white to-rose-50 opacity-80" />

          <div className="relative flex items-center gap-3 px-4 py-3">

            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center shadow-sm">

              <Search
                size={16}
                className="text-white"
              />

            </div>

            <input
              type="text"
              placeholder="Search food or category..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent outline-none text-[13px] text-gray-700 placeholder:text-gray-400 font-medium"
            />

            {query.trim().length > 0 && (

              <button
                onClick={() => setQuery("")}
                className="h-7 w-7 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
              >

                <X
                  size={14}
                  className="text-gray-500"
                />

              </button>

            )}

          </div>

        </div>


        {/* =========================
            FOOD GRID
        ========================== */}

        <div className="mt-5">

          {filtered.length > 0 ? (

            <div className="grid grid-cols-2 gap-3">

              {filtered.map((item: any) => (

                <div
                  key={item.id}
                  className="space-y-1"
                >

                  {/* CATEGORY */}

                  <div className="flex items-center">

                    <span className="text-[10px] font-semibold px-2 py-1 rounded-full bg-orange-100 text-orange-600 uppercase tracking-wide">

                      {item.category || "Food"}

                    </span>

                  </div>

                  {/* FOOD CARD */}

                  <div className="scale-[0.96] origin-top">

                    <FoodCard item={item} />

                  </div>

                </div>

              ))}

            </div>

          ) : (

            <div className="flex flex-col items-center justify-center py-16 text-center">

              <div className="h-14 w-14 rounded-full bg-white shadow-sm border border-gray-100 flex items-center justify-center mb-4">

                <Search
                  size={24}
                  className="text-gray-400"
                />

              </div>

              <h2 className="text-sm font-semibold text-gray-700">
                No items found
              </h2>

              <p className="text-xs text-gray-400 mt-1">
                Try another search keyword
              </p>

            </div>

          )}

        </div>

      </div>

      {/* =========================
          BOTTOM NAV
      ========================== */}

      <BottomNav />

    </div>

  );

}