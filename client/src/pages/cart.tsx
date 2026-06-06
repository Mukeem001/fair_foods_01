import { apiFetch } from "@/lib/api";
import { useStore } from "@/lib/store";
import { BottomNav } from "@/components/bottom-nav";
import {
  Trash2,
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  MapPin,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";
import { useEffect, useState } from "react";

type SavedAddress = {
  id: number | string;
  name: string;
  phone: string;
  house: string;
  area: string;
  city: string;
  pincode: string;
  isDefault?: boolean;
  default?: boolean;
};

export default function Cart() {

  const { cart, removeFromCart, clearCart, user } = useStore();

  const [availability, setAvailability] = useState<Record<string, boolean>>({});
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const [showPopup, setShowPopup] = useState(false);
  const [showUpiPopup, setShowUpiPopup] = useState(false);
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);

  // ✅ Address popup states
  const [showAddressPopup, setShowAddressPopup] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addressForm, setAddressForm] = useState({
    name: "",
    phone: "",
    house: "",
    area: "",
    city: "",
    pincode: "",
  });
  const [savingAddress, setSavingAddress] = useState(false);

  // ✅ NEW STATE FOR UTR
  const [utr, setUtr] = useState("");


  /* =============================
     LOAD SAVED ADDRESSES
  ============================== */

  const loadAddresses = async () => {
    if (!user?.id) return;
    try {
      setLoadingAddresses(true);
      const token = localStorage.getItem("fairfoods-token");
      const res = await apiFetch(`/api/profile/addresses`, {
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
      });
      const data = await res.json().catch(() => null);
      const list: SavedAddress[] = Array.isArray(data?.addresses) ? data.addresses : [];
      setSavedAddresses(list);

      // Auto-select default address
      const defaultAddr = list.find((a) => Boolean(a.isDefault ?? a.default));
      if (defaultAddr) {
        setSelectedAddress(
          `${defaultAddr.house}, ${defaultAddr.area}, ${defaultAddr.city} - ${defaultAddr.pincode}`
        );
      } else if (list.length > 0) {
        const first = list[0];
        setSelectedAddress(
          `${first.house}, ${first.area}, ${first.city} - ${first.pincode}`
        );
      }
    } catch {
      setSavedAddresses([]);
    } finally {
      setLoadingAddresses(false);
    }
  };

  useEffect(() => {
    loadAddresses();
    // Also check user.address from profile
    if (user?.address && !selectedAddress) {
      setSelectedAddress(user.address);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);


  /* =============================
     SAVE NEW ADDRESS
  ============================== */

  const saveNewAddress = async () => {
    if (!user?.id) {
      alert("Login required");
      return;
    }

    const { name, phone, house, area, city, pincode } = addressForm;
    if (!name || !phone || !house || !area || !city || !pincode) {
      alert("Please fill all address fields");
      return;
    }

    setSavingAddress(true);
    try {
      const token = localStorage.getItem("fairfoods-token");
      const body = {
        name,
        phone,
        house,
        area,
        city,
        pincode,
        isDefault: savedAddresses.length === 0,
        lat: 0,
        lng: 0,
      };

      const res = await apiFetch("/api/profile/addresses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        alert(data?.message || "Failed to save address");
        return;
      }

      // Reload addresses and auto-select the new one
      await loadAddresses();
      const fullAddress = `${house}, ${area}, ${city} - ${pincode}`;
      setSelectedAddress(fullAddress);
      setShowAddForm(false);
      setAddressForm({ name: "", phone: "", house: "", area: "", city: "", pincode: "" });
    } catch {
      alert("Failed to save address");
    } finally {
      setSavingAddress(false);
    }
  };


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
     CHECK ADDRESS BEFORE ORDER
  ============================== */

  const hasAddress = (): boolean => {
    // Check selected address
    if (selectedAddress && selectedAddress.trim().length > 0) return true;
    // Check user profile address
    if (user?.address && user.address.trim().length > 0) return true;
    return false;
  };


  /* =============================
     ORDER
  ============================== */

  const handleOrder = async () => {

    // ✅ CHECK ADDRESS FIRST
    if (!hasAddress()) {
      // Reload addresses in case they were added elsewhere
      await loadAddresses();
      if (!hasAddress()) {
        setShowAddressPopup(true);
        return;
      }
    }

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
    const u = savedUser ? JSON.parse(savedUser) : null;

    if (!u?.id) {
      alert("Login required to place order");
      return;
    }

    // Use selectedAddress or fallback to user profile address
    const address = selectedAddress || String(u.address ?? "").trim();

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


      {/* DELIVERY ADDRESS DISPLAY */}

      {cart.length > 0 && (
        <div className="bg-white rounded-xl border p-3 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin size={16} className="text-green-600 shrink-0" />
              <div className="min-w-0">
                <p className="text-[11px] text-gray-500 font-medium">Delivery Address</p>
                {hasAddress() ? (
                  <p className="text-sm font-semibold text-gray-800 truncate">
                    {selectedAddress || user?.address || ""}
                  </p>
                ) : (
                  <p className="text-sm text-red-500 font-medium">No address added</p>
                )}
              </div>
            </div>
            <button
              onClick={() => {
                loadAddresses();
                setShowAddressPopup(true);
              }}
              className="text-xs text-green-600 font-semibold bg-green-50 px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors shrink-0"
            >
              {hasAddress() ? "Change" : "Add"}
            </button>
          </div>
        </div>
      )}


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
         ADDRESS POPUP
      ============================== */}

      <AnimatePresence>
        {showAddressPopup && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-end justify-center z-[999]"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowAddressPopup(false);
            }}
          >
            <motion.div
              initial={{ y: 400 }}
              animate={{ y: 0 }}
              exit={{ y: 400 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="bg-white w-full max-w-md rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto"
            >
              {/* Popup Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MapPin size={20} className="text-green-600" />
                  <h2 className="text-lg font-bold text-gray-800">
                    {savedAddresses.length === 0 && !user?.address
                      ? "Add Delivery Address"
                      : "Select Delivery Address"}
                  </h2>
                </div>
                <button
                  onClick={() => setShowAddressPopup(false)}
                  className="h-8 w-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                >
                  <X size={16} className="text-gray-600" />
                </button>
              </div>

              {/* Info text if no address */}
              {savedAddresses.length === 0 && !user?.address && !showAddForm && (
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-4">
                  <p className="text-sm text-orange-700 font-medium">
                    ⚠️ Please add a delivery address before placing your order
                  </p>
                </div>
              )}

              {/* Loading */}
              {loadingAddresses && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  Loading addresses...
                </div>
              )}

              {/* Saved Addresses List */}
              {!loadingAddresses && savedAddresses.length > 0 && !showAddForm && (
                <div className="space-y-2 mb-4">
                  {savedAddresses.map((addr) => {
                    const fullAddr = `${addr.house}, ${addr.area}, ${addr.city} - ${addr.pincode}`;
                    const isSelected = selectedAddress === fullAddr;

                    return (
                      <button
                        key={String(addr.id)}
                        onClick={() => setSelectedAddress(fullAddr)}
                        className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${
                          isSelected
                            ? "border-green-500 bg-green-50 shadow-sm"
                            : "border-gray-200 bg-white hover:border-green-300"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                              isSelected
                                ? "border-green-500 bg-green-500"
                                : "border-gray-300"
                            }`}
                          >
                            {isSelected && (
                              <CheckCircle2 size={14} className="text-white" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-800">
                              {addr.name}
                              {Boolean(addr.isDefault ?? addr.default) && (
                                <span className="ml-2 text-[10px] bg-green-100 text-green-600 px-1.5 py-0.5 rounded">
                                  Default
                                </span>
                              )}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">{addr.phone}</p>
                            <p className="text-xs text-gray-600 mt-0.5">{fullAddr}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Profile address fallback (if no saved addresses but user has profile address) */}
              {!loadingAddresses &&
                savedAddresses.length === 0 &&
                user?.address &&
                !showAddForm && (
                  <div className="mb-4">
                    <button
                      onClick={() => setSelectedAddress(user.address)}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-all duration-200 ${
                        selectedAddress === user.address
                          ? "border-green-500 bg-green-50 shadow-sm"
                          : "border-gray-200 bg-white hover:border-green-300"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                            selectedAddress === user.address
                              ? "border-green-500 bg-green-500"
                              : "border-gray-300"
                          }`}
                        >
                          {selectedAddress === user.address && (
                            <CheckCircle2 size={14} className="text-white" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            Profile Address
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5">
                            {user.address}
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                )}

              {/* Add New Address Form */}
              {showAddForm ? (
                <div className="space-y-3 mb-4">
                  <h3 className="font-semibold text-gray-800 text-sm">New Address</h3>

                  <div className="grid grid-cols-2 gap-2.5">
                    <input
                      placeholder="Full Name *"
                      className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                      value={addressForm.name}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, name: e.target.value })
                      }
                    />
                    <input
                      placeholder="Phone *"
                      className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                      value={addressForm.phone}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, phone: e.target.value })
                      }
                    />
                    <input
                      placeholder="House / Flat *"
                      className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                      value={addressForm.house}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, house: e.target.value })
                      }
                    />
                    <input
                      placeholder="Area / Street *"
                      className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                      value={addressForm.area}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, area: e.target.value })
                      }
                    />
                    <input
                      placeholder="City *"
                      className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                      value={addressForm.city}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, city: e.target.value })
                      }
                    />
                    <input
                      placeholder="Pincode *"
                      className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:border-green-500 focus:ring-1 focus:ring-green-500 outline-none transition-colors"
                      value={addressForm.pincode}
                      onChange={(e) =>
                        setAddressForm({ ...addressForm, pincode: e.target.value })
                      }
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowAddForm(false)}
                      className="flex-1 border border-gray-300 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={savingAddress}
                      onClick={saveNewAddress}
                      className="flex-1 bg-green-500 hover:bg-green-600 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                    >
                      {savingAddress ? "Saving..." : "Save Address"}
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full border-2 border-dashed border-green-400 text-green-600 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold hover:bg-green-50 transition-colors mb-4"
                >
                  <Plus size={16} />
                  Add New Address
                </button>
              )}

              {/* Confirm Button */}
              {(savedAddresses.length > 0 || user?.address) && selectedAddress && (
                <Button
                  onClick={() => {
                    setShowAddressPopup(false);
                  }}
                  className="w-full h-12 bg-green-500 hover:bg-green-600 text-white rounded-xl text-sm font-semibold"
                >
                  Deliver to this address
                </Button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>


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