import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BottomNav } from "@/components/bottom-nav";
import { useStore } from "@/lib/store";
import { ArrowLeft, Wallet as WalletIcon, PlusCircle, CheckCircle2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function WalletPage() {

const { user, addFunds } = useStore();
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
date:"2026-04-22"
},
{
id:2,
amount:150,
type:"credit",
title:"Refund (Cancelled Order)",
date:"2026-04-23"
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


/* =============================
   UPI INTENT
============================= */

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


/* =============================
   CONFIRM PAYMENT
============================= */

const confirmPayment=async()=>{

const value=Number(amount);

await addFunds(value);

setTransactions([
{
id:Date.now(),
amount:value,
type:"credit",
title:`Wallet Topup (UPI)`,
date:new Date().toISOString()
},
...transactions
]);

setShowConfirmPopup(false);
setShowSuccess(true);

setMessage(`₹${value} added successfully`);
setAmount("");
setUtr("");

};


/* =============================
   ADD MONEY CLICK
============================= */

const handleAddFunds=()=>{

const value=Number(amount);

if(!value || value<=0){
setMessage("Enter valid amount");
return;
}

setShowUpiPopup(true);

};


return(

<>

<div className="min-h-screen bg-[#f4f6fb] pb-28">

<div className="max-w-md mx-auto">

{/* HEADER */}

<div className="bg-white px-4 pt-6 pb-5 rounded-b-3xl shadow-sm flex items-center gap-3">

<Link href="/profile">
<ArrowLeft size={22}/>
</Link>

<div>

<h1 className="text-lg font-bold">
My Wallet
</h1>

<p className="text-xs text-gray-500">
Fast & secure payments
</p>

</div>

</div>

<div className="px-4 pt-6 space-y-5">

{/* WALLET CARD */}

<div className="rounded-3xl p-6 text-white bg-gradient-to-r from-green-400 to-green-600 shadow-md">

<div className="flex items-center justify-between">

<p className="text-sm opacity-80">
Wallet Balance
</p>

<WalletIcon/>

</div>

<p className="text-3xl font-bold mt-3">
₹{user.walletBalance.toFixed(2)}
</p>

</div>


{/* ADD MONEY */}

<div className="bg-white rounded-2xl shadow-sm border p-4 space-y-4">

<p className="text-sm font-semibold">
Add Money
</p>

<Input
type="number"
placeholder="Enter amount"
value={amount}
onChange={(e)=>setAmount(e.target.value)}
/>

<Button
onClick={handleAddFunds}
className="w-full bg-green-500 hover:bg-green-600 flex items-center justify-center gap-2"
>

<PlusCircle size={18}/>

Add Money

</Button>

{message && (
<p className="text-xs text-green-600 text-center">
{message}
</p>
)}

</div>


{/* TRANSACTION HISTORY */}

<div className="bg-white rounded-2xl shadow-sm border p-4">

<p className="text-sm font-semibold mb-3">
Transaction History
</p>

<div className="space-y-3">

{transactions.map((t)=>{

const credit=t.type==="credit";

return(

<div
key={t.id}
className="flex items-center justify-between text-sm"
>

<div>

<p className="font-medium">
{t.title}
</p>

<p className="text-xs text-gray-400">
{new Date(t.date).toLocaleDateString()}
</p>

</div>

<p className={`font-semibold ${credit ? "text-green-600":"text-red-500"}`}>

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
className="fixed inset-0 bg-black/40 flex items-end justify-center z-[999]"
>

<motion.div
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
onClick={()=>setShowUpiPopup(false)}
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
   UTR CONFIRM POPUP
============================= */}

<AnimatePresence>

{showConfirmPopup && (

<motion.div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]">

<motion.div className="bg-white w-[85%] max-w-sm p-6 rounded-2xl text-center">

<h2 className="text-lg font-bold">
Payment Completed?
</h2>

<p className="text-sm text-gray-500 mt-2 mb-3">
Enter UTR number
</p>

<Input
placeholder="Enter UTR"
value={utr}
onChange={(e)=>setUtr(e.target.value)}
/>

<Button
disabled={!utr}
onClick={confirmPayment}
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

{showSuccess && (

<motion.div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[999]">

<motion.div className="bg-white w-[85%] max-w-sm p-6 rounded-2xl text-center">

<CheckCircle2 className="text-green-500 mx-auto mb-3" size={40}/>

<h2 className="text-lg font-bold">
Money Added Successfully 🎉
</h2>

<Button
onClick={()=>setShowSuccess(false)}
className="mt-4 w-full bg-green-500 hover:bg-green-600"
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