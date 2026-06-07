import { useEffect, useState } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { apiUrl } from "@/lib/api";
import { ShoppingBag, PackageCheck, ChevronRight, ArrowLeft } from "lucide-react";

export default function Orders() {

const { user } = useStore();
const [, setLocation] = useLocation();

const [orders,setOrders] = useState<any[]>([]);
const [loading,setLoading] = useState(false);

useEffect(() => {
  if (!user) {
    setLocation("/login");
    return;
  }

  const token = localStorage.getItem("fairfoods-token") ?? "";
  if (!token) {
    console.warn("Orders: missing fairfoods-token in localStorage");
    setLocation("/login");
    return;
  }

  const load = async () => {
    try {
      setLoading(true);

      const url = apiUrl("/api/profile/orders");
      console.log("Orders: fetching from", url);

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Helpful debug: if auth fails you'll see 401/403 in console.
      if (!res.ok) {
        const bodyText = await res.text().catch(() => "");
        console.warn("Orders: fetch failed", {
          status: res.status,
          bodyText,
        });
        setOrders([]);
        return;
      }

      const text = await res.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {
        console.warn("Orders: response is not valid JSON", { first200: text.slice(0, 200) });
        setOrders([]);
        return;
      }

      const realOrders = Array.isArray(data?.orders) ? data.orders : [];
      setOrders(realOrders);
    } catch (e) {
      console.error("Orders: load error", e);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  load();
}, [user, setLocation]);

return(

<>

<div className="min-h-screen bg-[#f4f6fb] pb-24">

{/* HEADER */}

<div className="bg-white px-4 py-3 rounded-b-2xl shadow-sm flex items-center gap-3">

<button
onClick={()=>setLocation("/profile")}
className="p-2 rounded-full hover:bg-gray-100"
>

<ArrowLeft size={20}/>

</button>

<div>

<h1 className="text-lg font-semibold text-gray-800">
My Orders
</h1>

<p className="text-xs text-gray-500">
Track your orders
</p>

</div>

</div>

<div className="max-w-md mx-auto space-y-4 p-4">

{/* Loading */}

{loading && (

<div className="text-center py-20 text-gray-400">
Loading orders...
</div>

)}

{/* Empty */}

{!loading && orders.length === 0 && (

<div className="flex flex-col items-center justify-center py-20 text-gray-400">

<ShoppingBag size={60} className="mb-4"/>

<p className="text-sm">
No orders yet
</p>

</div>

)}

{/* Orders */}

<div className="space-y-4">

{orders.map((o)=>{

const statusStyle =
o.status === "completed"
? "bg-green-100 text-green-700"
: o.status === "cancelled"
? "bg-red-100 text-red-600"
: "bg-yellow-100 text-yellow-700";

/* FIXED IMAGE LOGIC */

const orderImage =
  // backend may return different shapes; try all common fields
  o.image ||
  o.img ||
  (o.items && (
    o.items[0]?.image ||
    o.items[0]?.img ||
    o.items[0]?.imgUrl ||
    o.items[0]?.imgURL
  )) ||
  "https://images.unsplash.com/photo-1504674900247-0877df9cc836";

return(

<div
key={o.id}
className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
>

{/* Top */}

<div className="flex gap-3 p-4">

<img
src={orderImage}
className="w-16 h-16 rounded-xl object-cover"
/>

<div className="flex-1">

<div className="flex items-center justify-between">

<p className="text-sm font-semibold">

{Array.isArray(o.items)
? o.items.map((it: any) => `${it.name} (${it.option}) × ${it.qty}`).join(", ")
: o.items}

</p>

<span className={`text-[10px] px-2 py-1 rounded-full font-medium ${statusStyle}`}>
{o.status}
</span>

</div>

<p className="text-xs text-gray-500 mt-1">
Order #{o.id}
</p>

<p className="text-xs text-gray-400">
{new Date(o.createdAt).toLocaleDateString()}
</p>

<p className="text-sm font-semibold mt-1">
₹{Number(o.total).toFixed(2)}
</p>

</div>

</div>

{/* Bottom */}

<div className="flex items-center justify-between border-t px-4 py-2">

<div className="flex items-center gap-2 text-xs text-gray-500">

<PackageCheck size={16}/>

Track order

</div>

<ChevronRight size={18}/>

</div>

</div>

);

})}

</div>

</div>

</div>

<BottomNav/>

</>

);

}