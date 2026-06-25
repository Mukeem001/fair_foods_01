import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BottomNav } from "@/components/bottom-nav";
import { useStore } from "@/lib/store";
import { 
  ArrowLeft, 
  Wallet as WalletIcon, 
  PlusCircle, 
  CheckCircle2,
  Send,
  TrendingUp,
  History,
  Smartphone,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function WalletPage() {

const { user } = useStore();
const [, setLocation] = useLocation();

const [amount,setAmount]=useState("");
const [message,setMessage]=useState("");

const [showUpiPopup,setShowUpiPopup]=useState(false);
const [showConfirmPopup,setShowConfirmPopup]=useState(false);
const [showSuccess,setShowSuccess]=useState(false);

const [utr,setUtr]=useState("");

const [transactions,setTransactions]=useState<any[]>([
{
id:1,
amount:299,
type:"debit",
title:"Food Order",
description:"Margherita Pizza + Coke",
date:"2026-06-20"
},
{
id:2,
amount:150,
type:"credit",
title:"Refund",
description:"Order Cancelled",
date:"2026-06-19"
},
{
id:3,
amount:599,
type:"debit",
title:"Food Order",
description:"Biryani + Raita",
date:"2026-06-18"
},
{
id:4,
amount:500,
type:"credit",
title:"Wallet Topup",
description:"UPI Payment",
date:"2026-06-17"
}
]);

useEffect(()=>{
if(!user){
setLocation("/login");
}
},[user]);

if(!user){
return null;
}


const openUpiIntent=()=>{

const value=Number(amount);

const upiId="9811971746@amazonpay";
const name="FairFoods";

const url=`upi://pay?pa=${upiId}&pn=${name}&am=${value}&cu=INR`;

window.location.href=url;

setShowUpiPopup(false);

setTimeout(()=>{
setShowConfirmPopup(true);
},1200);

};


const confirmPayment=async()=>{

const value=Number(amount);

try {
  const res = await fetch(`${import.meta.env.VITE_API_URL || 'https://fair-foods-01.onrender.com'}/api/profile/wallet-requests`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("fairfoods-token") || ""}`
    },
    body: JSON.stringify({ amount: value }),
  });

  const data = await res.json();

  if (!res.ok) {
    setMessage(data.message || "Failed to create wallet request");
    setShowConfirmPopup(false);
    return;
  }

  setShowConfirmPopup(false);
  setShowSuccess(true);
  setMessage(`₹${value} request submitted! Waiting for admin approval.`);
  setAmount("");
  setUtr("");
} catch (err) {
  console.error("Error creating wallet request:", err);
  setMessage("Failed to create wallet request");
  setShowConfirmPopup(false);
}

};


const handleAddFunds=()=>{

const value=Number(amount);

if(!value || value<=0){
setMessage("Enter valid amount");
return;
}

if(value < 10){
setMessage("Minimum amount is ₹10");
return;
}

setShowUpiPopup(true);

};

const quickAmounts = [100, 250, 500, 1000];

return(

<>

<div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 pb-28">

<div className="max-w-md mx-auto">

{/* HEADER */}

<div className="bg-white px-4 pt-5 pb-6 rounded-b-3xl shadow-sm flex items-center gap-3 border-b border-gray-100">

<Link href="/profile">
<div className="p-2 rounded-full hover:bg-gray-100 transition">
<ArrowLeft size={20}/>
</div>
</Link>

<div>

<h1 className="text-xl font-bold text-gray-900">
My Wallet
</h1>

<p className="text-xs text-gray-500">
Manage your balance & transactions
</p>

</div>

</div>

<div className="px-4 pt-6 space-y-6">

{/* WALLET BALANCE CARD */}

<div className="rounded-2xl p-6 text-white bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 shadow-lg relative overflow-hidden">

<div className="absolute top-0 right-0 opacity-10">
<WalletIcon size={120}/>
</div>

<div className="relative z-10">

<p className="text-sm font-medium text-orange-100">
Total Balance
</p>

<p className="text-4xl font-bold mt-2">
₹{user.walletBalance.toFixed(2)}
</p>

<p className="text-xs text-orange-100 mt-3">
Account verified ✓
</p>

</div>

</div>


{/* QUICK ACTIONS */}

<div className="space-y-3">

<p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
Quick Actions
</p>

<div className="grid grid-cols-2 gap-3">

<button 
onClick={() => setShowUpiPopup(true)}
className="bg-white rounded-xl p-4 border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all shadow-sm"
>
<div className="flex flex-col items-center">
<div className="p-2 bg-orange-100 rounded-full mb-2">
<PlusCircle size={20} className="text-orange-600"/>
</div>
<p className="text-sm font-semibold text-gray-800">Add Money</p>
<p className="text-xs text-gray-500 mt-1">Quick topup</p>
</div>
</button>

<div className="bg-white rounded-xl p-4 border border-gray-200 opacity-50 cursor-not-allowed shadow-sm">
<div className="flex flex-col items-center">
<div className="p-2 bg-blue-100 rounded-full mb-2">
<Send size={20} className="text-blue-600"/>
</div>
<p className="text-sm font-semibold text-gray-800">Send</p>
<p className="text-xs text-gray-500 mt-1">Coming soon</p>
</div>
</div>

</div>

</div>


{/* ADD MONEY SECTION */}

<div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-4">

<div className="flex items-center justify-between">
<p className="text-sm font-semibold text-gray-900">
Add Money Instantly
</p>
<Zap size={18} className="text-orange-500"/>
</div>

<Input
type="number"
placeholder="Enter amount"
value={amount}
onChange={(e)=>setAmount(e.target.value)}
className="h-11 border-gray-300 focus:border-orange-500 focus:ring-orange-500"
/>

{/* QUICK AMOUNT BUTTONS */}
<div className="grid grid-cols-4 gap-2">
{quickAmounts.map((qa) => (
<button
key={qa}
onClick={() => setAmount(qa.toString())}
className="p-2 text-xs font-medium bg-gray-100 hover:bg-orange-100 text-gray-700 hover:text-orange-700 rounded-lg transition"
>
₹{qa}
</button>
))}
</div>

<Button
onClick={handleAddFunds}
disabled={!amount || Number(amount) <= 0}
className="w-full bg-orange-500 hover:bg-orange-600 text-white h-11 font-semibold"
>

<PlusCircle size={18}/>

Add Money

</Button>

{message && (
<p className={`text-xs text-center ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
{message}
</p>
)}

</div>


{/* BENEFITS SECTION */}

<div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border border-orange-200 p-4">

<p className="text-xs font-semibold text-gray-900 mb-3">
Why use Wallet?
</p>

<div className="space-y-2">

<div className="flex items-start gap-2">
<TrendingUp size={16} className="text-orange-600 mt-0.5 flex-shrink-0"/>
<div>
<p className="text-xs font-medium text-gray-800">Faster Payments</p>
<p className="text-xs text-gray-600">No bank details needed</p>
</div>
</div>

<div className="flex items-start gap-2">
<Smartphone size={16} className="text-orange-600 mt-0.5 flex-shrink-0"/>
<div>
<p className="text-xs font-medium text-gray-800">Secure & Safe</p>
<p className="text-xs text-gray-600">256-bit encryption</p>
</div>
</div>

<div className="flex items-start gap-2">
<Zap size={16} className="text-orange-600 mt-0.5 flex-shrink-0"/>
<div>
<p className="text-xs font-medium text-gray-800">Instant Refunds</p>
<p className="text-xs text-gray-600">Cancelled orders refunded</p>
</div>
</div>

</div>

</div>


{/* TRANSACTION HISTORY */}

<div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">

<div className="flex items-center justify-between mb-4">
<p className="text-sm font-semibold text-gray-900 flex items-center gap-2">
<History size={18} className="text-orange-600"/>
Transaction History
</p>
<Link href="/profile">
<p className="text-xs text-orange-600 font-medium hover:text-orange-700">View All</p>
</Link>
</div>

<div className="space-y-3">

{transactions.slice(0, 3).map((t)=>{

const credit=t.type==="credit";

return(

<div
key={t.id}
className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
>

<div className="flex items-center gap-3">

<div className={`p-2 rounded-full ${credit ? 'bg-green-100' : 'bg-red-100'}`}>
{credit ? (
<TrendingUp size={18} className="text-green-600"/>
) : (
<Send size={18} className="text-red-600" style={{transform: 'rotate(180deg)'}}/>
)}
</div>

<div>

<p className="text-sm font-semibold text-gray-900">
{t.title}
</p>

<p className="text-xs text-gray-500">
{new Date(t.date).toLocaleDateString('en-IN', {month: 'short', day: 'numeric'})} · {t.description}
</p>

</div>

</div>

<p className={`text-sm font-bold ${credit ? "text-green-600":"text-red-600"}`}>

{credit ? "+" : "-"}₹{t.amount}

</p>

</div>

);

})}

</div>

</div>

</div>

</div>

</div>



{/* =============================
   UPI APP SELECT POPUP
============================= */}

<AnimatePresence>

{showUpiPopup && (

<motion.div
className="fixed inset-0 bg-black/50 flex items-end justify-center z-[999]"
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
exit={{ opacity: 0 }}
>

<motion.div
className="bg-white w-full max-w-md rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto"
initial={{ y: 300 }}
animate={{ y: 0 }}
exit={{ y: 300 }}
>

<h2 className="text-lg font-bold text-center mb-6 text-gray-900">
Select Payment Method
</h2>

<div className="grid grid-cols-3 gap-4 text-center mb-6">

<button onClick={openUpiIntent} className="p-4 border border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition">
<img src="https://tse3.mm.bing.net/th/id/OIP.IHX-5nNcgMDQI6AmP6nhOAHaE8?pid=Api&P=0&h=180" className="h-14 mx-auto mb-2"/>
<p className="text-xs font-medium text-gray-800">Google Pay</p>
</button>

<button onClick={openUpiIntent} className="p-4 border border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition">
<img src="https://tse2.mm.bing.net/th/id/OIP.tuYalZe2SOHuvjtZkDDJ5gHaFf?pid=Api&P=0&h=180" className="h-14 mx-auto mb-2"/>
<p className="text-xs font-medium text-gray-800">PhonePe</p>
</button>

<button onClick={openUpiIntent} className="p-4 border border-gray-200 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition">
<img src="https://tse4.mm.bing.net/th/id/OIP.Q0OCihOxIc3wVr09KqS9hgHaHa?pid=Api&P=0&h=180" className="h-14 mx-auto mb-2"/>
<p className="text-xs font-medium text-gray-800">Paytm</p>
</button>

</div>

<Button
onClick={()=>setShowUpiPopup(false)}
variant="outline"
className="w-full"
>
Cancel
</Button>

</motion.div>

</motion.div>

)}

</AnimatePresence>



{/* =============================
   UTR CONFIRM POPUP
============================= */}

<AnimatePresence>

{showConfirmPopup && (

<motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

<motion.div className="bg-white w-[90%] max-w-sm p-6 rounded-2xl text-center" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>

<h2 className="text-lg font-bold text-gray-900">
Payment Completed?
</h2>

<p className="text-sm text-gray-600 mt-2 mb-4">
Enter UPI transaction reference number
</p>

<Input
placeholder="UTR / Reference ID"
value={utr}
onChange={(e)=>setUtr(e.target.value)}
className="h-11"
/>

<div className="grid grid-cols-2 gap-3 mt-4">
<Button
variant="outline"
onClick={()=>setShowConfirmPopup(false)}
className="h-11"
>
Cancel
</Button>

<Button
disabled={!utr}
onClick={confirmPayment}
className="h-11 bg-orange-500 hover:bg-orange-600"
>
Confirm
</Button>
</div>

</motion.div>

</motion.div>

)}

</AnimatePresence>



{/* SUCCESS POPUP */}

<AnimatePresence>

{showSuccess && (

<motion.div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999]" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

<motion.div className="bg-white w-[90%] max-w-sm p-6 rounded-2xl text-center" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}>

<motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}>
<CheckCircle2 className="text-green-500 mx-auto mb-3" size={48}/>
</motion.div>

<h2 className="text-lg font-bold text-gray-900">
Money Added Successfully!
</h2>

<p className="text-sm text-gray-600 mt-2 mb-4">
₹{amount} has been added to your wallet
</p>

<Button
onClick={()=>{
setShowSuccess(false);
setAmount("");
}}
className="w-full h-11 bg-orange-500 hover:bg-orange-600"
>
Done
</Button>

</motion.div>

</motion.div>

)}

</AnimatePresence>


<BottomNav/>

</>

);

}