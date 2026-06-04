import { useState } from "react";
import { FoodItem, useStore } from "@/lib/store";
import { Plus, Minus, ShoppingBag } from "lucide-react";
import { useLocation } from "wouter";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function FoodCard({ item }: { item: FoodItem }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState(0);
  const [qty, setQty] = useState(1);
  const { addToCart, cart } = useStore();
  const [, setLocation] = useLocation();

  const handleAdd = () => {
    addToCart(item, item.options[selectedOption], qty);
    setIsOpen(false);
    setQty(1);
  };

  const minPrice = Math.min(...item.options.map((o) => o.price));

  return (
    <>
      <div 
        className="group relative bg-white rounded-2xl shadow-sm border border-border/50 overflow-hidden cursor-pointer hover:shadow-md transition-all duration-300"
        onClick={() => setIsOpen(true)}
      >
        <div className="aspect-[4/3] overflow-hidden">
          <img
            src={item.img}
            alt={item.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="p-4">
          <div className="flex justify-between items-start gap-2">
            <div>
              <h3 className="font-bold text-foreground line-clamp-1">{item.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                From <span className="text-primary font-semibold">₹{minPrice}</span>
              </p>
            </div>
            <button className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-colors">
              <Plus size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* {cart.length > 0 && (
        <div
          onClick={() => setLocation("/cart")}
          className="fixed bottom-6 left-1/2 w-[calc(100%-24px)] max-w-[420px] -translate-x-1/2 z-50 bg-primary text-white p-4 rounded-2xl shadow-lg shadow-primary/30 flex justify-between items-center cursor-pointer animate-in fade-in slide-in-from-bottom-4 duration-300"
        >

          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-lg">
              <ShoppingBag size={20} />
            </div>
            <div>
              <p className="text-xs font-medium text-white/80">{cart.length} items added</p>
              <p className="font-bold text-sm">View Cart</p>
            </div>
          </div>
          <p className="font-bold">₹{cart.reduce((acc, c) => acc + (c.selectedOption.price * c.qty), 0)} →</p>
        </div>
      )} */}
<Drawer open={isOpen} onOpenChange={setIsOpen}>
  <DrawerContent className="mx-auto w-full max-w-[400px] rounded-t-3xl">

    <div className="w-full px-4 pt-4 pb-2">

      {/* HEADER */}
      <div className="flex items-center gap-3 mb-3">

        <img
          src={item.img}
          alt={item.name}
          className="w-14 h-14 rounded-full object-cover shadow"
        />

        <div>
          <h2 className="text-lg font-semibold">{item.name}</h2>
          <p className="text-xs text-muted-foreground">
            Select your preference
          </p>
        </div>

      </div>

      {/* OPTIONS */}
      <div className="space-y-2 mb-4">

        <p className="text-xs text-muted-foreground font-medium">
          Options
        </p>

        {item.options.map((opt, idx) => (

          <div
            key={idx}
            onClick={() => setSelectedOption(idx)}
            className={`flex justify-between items-center p-3 rounded-lg border text-sm cursor-pointer transition
              
              ${
                selectedOption === idx
                  ? "border-green-500 bg-green-50"
                  : "border-gray-200 hover:bg-gray-50"
              }
            `}
          >

            <span>{opt.name}</span>

            <span className="font-semibold text-green-600">
              ₹{opt.price}
            </span>

          </div>

        ))}

      </div>

      {/* QUANTITY */}
      <div className="flex justify-between items-center bg-gray-50 p-3 rounded-lg mb-4">

        <span className="text-sm font-medium">
          Quantity
        </span>

        <div className="flex items-center gap-3 bg-white border rounded-md px-2 py-1">

          <button
            onClick={() => setQty(Math.max(1, qty - 1))}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Minus size={14} />
          </button>

          <span className="text-sm font-semibold w-5 text-center">
            {qty}
          </span>

          <button
            onClick={() => setQty(qty + 1)}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <Plus size={14} />
          </button>

        </div>

      </div>

      {/* ADD TO CART */}
      <Button
        onClick={handleAdd}
        className="w-full h-10 rounded-lg bg-green-500 hover:bg-green-600 text-sm font-semibold"
      >
        Add to Cart • ₹{item.options[selectedOption].price * qty}
      </Button>

    </div>

  </DrawerContent>
</Drawer>
    </>
  );
}
