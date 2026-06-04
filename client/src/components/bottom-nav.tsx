import { Link, useLocation } from "wouter";
import { Home, Search, ShoppingBag, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";

export function BottomNav() {
  const [location] = useLocation();
  const { cart } = useStore();

  const links = [
    { href: "/", icon: Home, label: "Home" },
    { href: "/search", icon: Search, label: "Explore" },
    { href: "/cart", icon: ShoppingBag, label: "Cart", count: cart.length },
    { href: "/profile", icon: User, label: "Profile" },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
      <nav className="w-full max-w-[420px] bg-white/80 backdrop-blur-lg border-t border-border pb-safe rounded-t-[24px] shadow-lg h-16">
        <div className="h-full flex items-center justify-around">

          {links.map((link) => {


          const isActive = location === link.href;

          return (
            <Link key={link.href} href={link.href}>
              <button
                className="flex flex-col items-center justify-center w-full h-full select-none focus:outline-none focus:ring-0 active:bg-transparent"
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                {/* Icon */}
                <div
                  className={cn(
                    "relative p-2 transition-colors",
                    isActive
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  <link.icon size={22} strokeWidth={isActive ? 2.5 : 2} />

                  {link.count !== undefined && link.count > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                      {link.count}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "text-[10px] font-medium",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  {link.label}
                </span>

              </button>
            </Link>
          );
        })}

        </div>
      </nav>
    </div>
  );
}

