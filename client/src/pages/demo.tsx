import { useStore } from "@/lib/store";
import { BottomNav } from "@/components/bottom-nav";
import {
  Trash2,
  ShoppingBag,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useEffect, useState } from "react";

export default function Cart() {
  const { cart, removeFromCart } = useStore();

  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const total = cart.reduce((acc, item) => {
    if (availability[item.id] === false) return acc;
    return acc + item.selectedOption.price * item.qty;
  }, 0);

  useEffect(() => {
    setAvailability({});
  }, [cart]);

  const hasUnavailableItem = cart.some(
    (item) => availability[item.id] === false
  );

  const handleOrder = () => {
    const orderData = {
      items: cart,
      total,
      paymentMethod,
    };

    console.log("ORDER PLACED:", orderData);
    alert("Order placed successfully (demo)");
  };

  return (
    <div className="min-h-screen bg-[#f4f6fb] pb-40 px-4 pt-6">

      {/* HEADER */}
      <div className="flex items-center gap-3 mb-6">
        <Link href="/">
          <button className="h-10 w-10 flex items-center justify-center bg-white rounded-xl shadow-sm">
            <ArrowLeft size={18} />
          </button>
        </Link>

        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <ShoppingBag className="text-green-600" size={20} />
            Your Cart
          </h1>
          <p className="text-xs text-gray-500">
            Review your items before checkout
          </p>
        </div>
      </div>

      {/* EMPTY STATE */}
      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <ShoppingBag size={60} className="mb-3" />
          <p className="text-sm">Your cart is empty</p>
        </div>
      ) : (
        <>
          {/* ITEMS (NO CHANGE) */}
          <div className="space-y-4">
            <AnimatePresence>
              {cart.map((item, i) => {
                const isAvailable = availability[item.id];

                return (
                  <motion.div
                    key={`${item.id}-${i}`}
                    className="bg-white p-3 rounded-2xl shadow-sm border flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={item.img}
                        className="w-14 h-14 rounded-xl object-cover"
                      />

                      <div>
                        <h3 className="font-semibold text-sm">
                          {item.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {item.selectedOption.name} × {item.qty}
                        </p>
                        <p className="text-green-600 font-bold text-sm mt-1">
                          ₹{item.selectedOption.price * item.qty}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`text-[10px] px-2 py-1 rounded-full font-medium ${
                          isAvailable
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {isAvailable ? "Available" : "Unavailable"}
                      </span>

                      <button
                        onClick={() => removeFromCart(i)}
                        className="text-gray-500 hover:text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* CHECKOUT BAR */}
          <div className="fixed bottom-20 left-4 right-4 bg-white rounded-2xl shadow-xl border p-4 z-50">

            {/* TOTAL */}
            <div className="flex justify-between mb-3">
              <span className="text-sm text-gray-500">Total</span>
              <span className="text-lg font-bold text-green-600">
                ₹{total}
              </span>
            </div>

            {/* PAYMENT + ORDER BUTTON ROW */}
            <div className="flex gap-2">

              {/* PAYMENT SELECT */}
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-1/2 border rounded-xl px-3 py-2 text-sm bg-white"
              >
                <option value="cod">Cash on Delivery</option>
                <option value="upi">UPI Payment</option>
                <option value="card">Card Payment</option>
              </select>

              {/* PLACE ORDER */}
              <Button
                disabled={hasUnavailableItem}
                onClick={handleOrder}
                className="w-1/2 bg-green-500 hover:bg-green-600 text-white"
              >
                Place Order
              </Button>

            </div>
          </div>
        </>
      )}

      {/* FIXED BOTTOM NAV */}
      <div className="relative z-40">
        <BottomNav />
      </div>

    </div>
  );
}