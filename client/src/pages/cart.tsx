import { apiFetch } from "@/lib/api";
import { useStore } from "@/lib/store";
import { BottomNav } from "@/components/bottom-nav";
import {
  Trash2,
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useEffect, useState } from "react";

export default function Cart() {

  const { cart, removeFromCart, clearCart } = useStore();

  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const [showPopup, setShowPopup] = useState(false);
  const [showUpiPopup, setShowUpiPopup] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

  // ✅ NEW STATE FOR UTR
  const [utr, setUtr] = useState("");


  /* =============================
     AVAILABILITY
  ============================== */

  useEffect(() => {

    if (cart.length === 0) {
      setAvailability({});
      return;
    }

    const checkAvailability = async () => {

      try {

        const ids = Array.from(new Set(cart.map((item) => item.id)));

        const res = await apiFetch("/api/foods/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });

        const data = await res.json();

        const result: Record<string, boolean> = {};

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.foods)
          ? data.foods
          : [];

        list.forEach((item: any) => {
          if (item?.id) {
            result[item.id] = Boolean(item.active);
          }
        });

        setAvailability(result);

      } catch {

        const fallback: Record<string, boolean> = {};
        cart.forEach((item) => {
          fallback[item.id] = true;
        });

        setAvailability(fallback);
      }

    };

    checkAvailability();

  }, [cart]);


  /* =============================
     TOTAL
  ============================== */

  const total = cart.reduce((acc, item) => {

    const isAvailable = availability[item.id] !== false;
    if (!isAvailable) return acc;

    return acc + item.selectedOption.price * item.qty;

  }, 0);


  const hasUnavailableItem = cart.some(
    (item) => availability[item.id] === false
  );


  /* =============================
     ORDER
  ============================== */

  const handleOrder = async () => {

    if (paymentMethod === "upi") {
      setShowUpiPopup(true);
      return;
    }

    try {
      await placeOrder();
      clearCart();
      setShowPopup(true);
    } catch {}

  };


  const placeOrder = async () => {

    const savedUser = localStorage.getItem("fairfoods-user");
    const user = savedUser ? JSON.parse(savedUser) : null;

    if (!user?.id) {
      alert("Login required to place order");
      return;
    }

    const address = String(user.address ?? "").trim();

    const res = await apiFetch("/api/orders", {

      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("fairfoods-token") || ""}`,
      },

      body: JSON.stringify({
        items: cart.map((c) => ({
          id: c.id,
          name: c.name,
          option: c.selectedOption.name,
          qty: c.qty,
          price: c.selectedOption.price,
        })),
        total,
        address,
        utr, // ✅ send utr
      }),

    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.message || "Order save failed");
      throw new Error(data?.message || "Order save failed");
    }

  };


  /* =============================
     UPI INTENT
  ============================== */

  const openUpiIntent = () => {

    const upiId = "9811971746@amazonpay";
    const name = "FairFoods";

    const url = `upi://pay?pa=${upiId}&pn=${name}&am=${total}&cu=INR`;

    window.location.href = url;

    setShowUpiPopup(false);

    setTimeout(() => {
      setShowConfirmPopup(true);
    }, 1200);

  };


  return (
    <>
    <div className="min-h-screen bg-[#f4f6fb] pb-36 px-4 pt-6">

      {/* HEADER */}

      <div className="flex items-center gap-3 mb-5">

        <Link href="/">
          <button className="h-9 w-9 flex items-center justify-center bg-white rounded-xl shadow-sm">
            <ArrowLeft size={16} />
          </button>
        </Link>

        <div>
          <h1 className="text-lg font-bold flex items-center gap-2">
            <ShoppingBag size={18} className="text-green-600" />
            Cart
          </h1>
          <p className="text-xs text-gray-500">Review your items</p>
        </div>

      </div>


      {/* CART ITEMS */}

      {cart.length === 0 ? (
        <div className="mt-10 text-center text-gray-500">
          <p className="text-sm">You have not cart order please add more product</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {cart.map((item, i) => {
              const isAvailable = availability[item.id] !== false;

              return (
                <motion.div
                  key={`${item.id}-${i}`}
                  className="bg-white p-3 rounded-xl border flex justify-between"
                >
                  <div className="flex gap-3">
                    <img
                      src={item.img}
                      className="w-12 h-12 rounded-lg object-cover"
                    />

                    <div>
                      <p className="text-sm font-semibold">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.selectedOption.name} × {item.qty}
                      </p>
                      <p className="text-green-600 font-bold text-sm">
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
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* CHECKOUT BAR */}

      {cart.length > 0 && (
        <div className="fixed bottom-20 left-1/2 w-[calc(100%-24px)] max-w-[420px] -translate-x-1/2 bg-white/90 backdrop-blur-md rounded-xl border shadow-sm p-2.5 z-50">

          <div className="flex justify-between items-center mb-2">
            <span className="text-[11px] text-gray-500">Total Amount</span>
            <span className="text-sm font-bold text-green-600">₹{total}</span>
          </div>

          <div className="flex gap-2 items-center">
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-1/2 border rounded-lg px-2 py-1 text-[11px]"
            >
              <option value="cod">COD</option>
              <option value="upi">UPI</option>
            </select>

            <Button
              disabled={hasUnavailableItem}
              onClick={handleOrder}
              className="w-1/2 h-8 text-[11px] bg-green-500 hover:bg-green-600 text-white rounded-lg"
            >
              Place Order
            </Button>
          </div>

      </div>

      )}

      {/* =============================
         UPI POPUP
      ============================== */}

      <AnimatePresence>

        {showUpiPopup && (

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex items-end justify-center z-[999]"
          >

            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              className="bg-white w-full max-w-md rounded-t-3xl p-6"
            >

              <h2 className="text-lg font-bold text-center mb-5">
                Pay with UPI
              </h2>

              <div className="grid grid-cols-3 gap-4 text-center">

                <button onClick={openUpiIntent}>
                  <img src="https://tse3.mm.bing.net/th/id/OIP.IHX-5nNcgMDQI6AmP6nhOAHaE8?pid=Api&P=0&h=180" className="h-12 mx-auto"/>
                  <p className="text-xs mt-2">GPay</p>
                </button>

                <button onClick={openUpiIntent}>
                  <img src="https://tse2.mm.bing.net/th/id/OIP.tuYalZe2SOHuvjtZkDDJ5gHaFf?pid=Api&P=0&h=180" className="h-12 mx-auto"/>
                  <p className="text-xs mt-2">PhonePe</p>
                </button>

                <button onClick={openUpiIntent}>
                  <img src="https://tse4.mm.bing.net/th/id/OIP.Q0OCihOxIc3wVr09KqS9hgHaHa?pid=Api&P=0&h=180" className="h-12 mx-auto"/>
                  <p className="text-xs mt-2">Paytm</p>
                </button>

              </div>

              <Button
                onClick={() => setShowUpiPopup(false)}
                variant="ghost"
                className="w-full mt-6"
              >
                Cancel
              </Button>

            </motion.div>

          </motion.div>

        )}

      </AnimatePresence>


      {/* =============================
         CONFIRM PAYMENT + UTR
      ============================== */}

      <AnimatePresence>

        {showConfirmPopup && (

          <motion.div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]">

            <motion.div className="bg-white w-[85%] max-w-sm p-6 rounded-2xl text-center">

              <h2 className="text-lg font-bold">
                Payment Completed?
              </h2>

              <p className="text-sm text-gray-500 mt-2 mb-3">
                Enter UTR number to confirm payment
              </p>

              <input
                type="text"
                placeholder="Enter UTR Number"
                value={utr}
                onChange={(e) => setUtr(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />

              <Button
                disabled={!utr}
                onClick={async () => {
                  await placeOrder();
                  clearCart();
                  setShowConfirmPopup(false);
                  setShowPopup(true);
                }}
                className="mt-4 w-full bg-green-500 hover:bg-green-600"
              >
                Confirm Payment
              </Button>

            </motion.div>

          </motion.div>

        )}

      </AnimatePresence>


      {/* SUCCESS POPUP */}

      <AnimatePresence>

        {showPopup && (

          <motion.div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]">

            <motion.div className="bg-white w-[85%] max-w-sm p-6 rounded-2xl text-center">

              <CheckCircle2
                className="text-green-500 mx-auto mb-3"
                size={40}
              />

              <h2 className="text-lg font-bold">
                Order Placed Successfully 🎉
              </h2>

              <Link href="/orders">

                <Button
                  onClick={() => setShowPopup(false)}
                  className="mt-4 w-full bg-green-500 hover:bg-green-600"
                >
                  Track Order
                </Button>

              </Link>

            </motion.div>

          </motion.div>

        )}

      </AnimatePresence>


      <BottomNav />

      
      </div>

      </>

  );
}