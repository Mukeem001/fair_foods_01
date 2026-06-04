import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "wouter";
import { useStore } from "@/lib/store";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  MessageCircle,
  HelpCircle,
  CreditCard,
  Package
} from "lucide-react";

export default function Support() {

const { user } = useStore();
const [, setLocation] = useLocation();

const [message,setMessage]=useState("");
const [topic,setTopic]=useState("");

useEffect(()=>{
if(!user){
setLocation("/login");
}
},[user,setLocation]);

if(!user){
return null;
}

const helpOptions=[
{
title:"Order Issue",
icon:<Package size={18}/>,
value:"order"
},
{
title:"Payment Problem",
icon:<CreditCard size={18}/>,
value:"payment"
},
{
title:"Refund Request",
icon:<HelpCircle size={18}/>,
value:"refund"
},
{
title:"Other",
icon:<MessageCircle size={18}/>,
value:"other"
}
];

return(

<>

<div className="min-h-screen bg-[#f4f6fb] pb-28">

<div className="max-w-md mx-auto">

{/* HEADER */}

<div className="bg-white px-4 pt-6 pb-5 rounded-b-3xl shadow-sm flex items-center gap-3">

<Link href="/profile">
<ArrowLeft size={20}/>
</Link>

<div>

<h1 className="text-lg font-bold">
Support Center
</h1>

<p className="text-xs text-gray-500">
Tell us your issue
</p>

</div>

</div>

<div className="px-4 pt-6 space-y-5">

{/* ISSUE SELECT */}

<div className="bg-white rounded-2xl shadow-sm border p-4">

<p className="text-sm font-semibold mb-3">
Select your issue
</p>

<div className="grid grid-cols-2 gap-3">

{helpOptions.map((item)=>(
<button
key={item.value}
onClick={()=>setTopic(item.value)}
className={`flex items-center gap-2 p-3 rounded-xl text-xs border transition ${
topic===item.value
? "bg-green-100 border-green-400"
: "bg-gray-50 hover:bg-gray-100"
}`}
>

{item.icon}

{item.title}

</button>
))}

</div>

</div>

{/* MESSAGE BOX */}

<div className="bg-white rounded-2xl shadow-sm border p-4 space-y-3">

<p className="text-sm font-semibold">
Describe your problem
</p>

<textarea
className="w-full border rounded-xl p-3 min-h-[120px] text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
placeholder="Explain your issue in detail..."
value={message}
onChange={(e)=>setMessage(e.target.value)}
/>

<Button
className="w-full bg-green-500 hover:bg-green-600 flex items-center justify-center gap-2"
onClick={()=>alert("Support request submitted")}
>

<MessageCircle size={18}/>

Submit Request

</Button>

<p className="text-xs text-gray-500 text-center">
Our team usually replies within 10–15 minutes
</p>

</div>

</div>

</div>

</div>

<BottomNav/>

</>

);

}