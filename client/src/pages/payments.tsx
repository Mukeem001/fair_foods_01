import { useEffect, useState } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useLocation } from "wouter";
import { useStore } from "@/lib/store";
import {
  ArrowLeft,
  CreditCard,
  Wallet,
  Smartphone,
  Plus,
  Trash2
} from "lucide-react";

export default function Payments() {

const { user } = useStore();
const [, setLocation] = useLocation();

const [methods,setMethods] = useState<any[]>([]);
const [showForm,setShowForm] = useState(false);

const [form,setForm] = useState({
type:"upi",
name:"",
upi:"",
card:"",
expiry:""
});

useEffect(()=>{

if(!user){
setLocation("/login");
return;
}

setMethods([
{
id:1,
type:"wallet",
name:"App Wallet",
balance:950
},
{
id:2,
type:"upi",
name:"Google Pay",
upi:"mukeem@upi"
}
]);

},[user]);

const addMethod=()=>{

const newMethod={
id:Date.now(),
...form
};

setMethods([...methods,newMethod]);

setShowForm(false);

setForm({
type:"upi",
name:"",
upi:"",
card:"",
expiry:""
});

};

const deleteMethod=(id:number)=>{
setMethods(methods.filter(m=>m.id!==id));
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
Payment Methods
</h1>

<p className="text-xs text-gray-500">
Manage your payment options
</p>

</div>

</div>

<div className="px-4 pt-6 space-y-4">

{/* PAYMENT METHODS */}

{methods.map((m)=>{

let icon=<CreditCard size={20}/>;
let color="bg-gray-100";

if(m.type==="wallet"){
icon=<Wallet size={20}/>;
color="bg-green-100";
}

if(m.type==="upi"){
icon=<Smartphone size={20}/>;
color="bg-blue-100";
}

return(

<div
key={m.id}
className="bg-white rounded-2xl shadow-sm border p-4 flex items-center justify-between"
>

<div className="flex items-center gap-3">

<div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
{icon}
</div>

<div>

<p className="text-sm font-semibold">
{m.name}
</p>

{m.upi && (
<p className="text-xs text-gray-500">
{m.upi}
</p>
)}

{m.card && (
<p className="text-xs text-gray-500">
{m.card}
</p>
)}

{m.balance && (
<p className="text-xs text-green-600">
₹{m.balance} wallet balance
</p>
)}

</div>

</div>

<button
onClick={()=>deleteMethod(m.id)}
className="text-gray-400 hover:text-red-500"
>

<Trash2 size={18}/>

</button>

</div>

);

})}

{/* ADD BUTTON */}

<Button
onClick={()=>setShowForm(!showForm)}
className="w-full bg-green-500 hover:bg-green-600 flex items-center justify-center gap-2"
>

<Plus size={16}/>

Add Payment Method

</Button>

{/* FORM */}

{showForm && (

<div className="bg-white rounded-2xl shadow-sm border p-4 space-y-4">

<h2 className="text-sm font-semibold">
Add Payment Method
</h2>

<select
className="w-full border rounded-lg p-2 text-sm"
value={form.type}
onChange={(e)=>setForm({...form,type:e.target.value})}
>

<option value="upi">UPI</option>
<option value="card">Card</option>

</select>

<Input
placeholder="Account Name"
value={form.name}
onChange={(e)=>setForm({...form,name:e.target.value})}
/>

{form.type==="upi" && (

<Input
placeholder="UPI ID (example@upi)"
value={form.upi}
onChange={(e)=>setForm({...form,upi:e.target.value})}
/>

)}

{form.type==="card" && (

<>

<Input
placeholder="Card Number"
value={form.card}
onChange={(e)=>setForm({...form,card:e.target.value})}
/>

<Input
placeholder="Expiry (MM/YY)"
value={form.expiry}
onChange={(e)=>setForm({...form,expiry:e.target.value})}
/>

</>

)}

<div className="flex gap-2 pt-2">

<Button
variant="outline"
className="flex-1"
onClick={()=>setShowForm(false)}
>

Cancel

</Button>

<Button
className="flex-1 bg-green-500 hover:bg-green-600"
onClick={addMethod}
>

Save

</Button>

</div>

</div>

)}

</div>

</div>

</div>

<BottomNav/>

</>

);

}