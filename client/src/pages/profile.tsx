import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore } from "@/lib/store";
import logo from "@/assets/logo.png";
import { Pencil, Camera, ChevronRight } from "lucide-react";

export default function Profile() {

const { user, logout, updateProfile } = useStore();
const [, setLocation] = useLocation();

const [editMode,setEditMode] = useState(false);

const [fullName,setFullName] = useState("");
const [email,setEmail] = useState("");
const [phone,setPhone] = useState("");
const [avatar,setAvatar] = useState("");

const [showEmailOtp,setShowEmailOtp] = useState(false);
const [showPhoneOtp,setShowPhoneOtp] = useState(false);

const [emailOtp,setEmailOtp] = useState("");
const [phoneOtp,setPhoneOtp] = useState("");

useEffect(()=>{

if(!user){
setLocation("/login");
return;
}

setFullName(user.fullName);
setEmail(user.email);
setPhone(user.phone ?? "");
setAvatar(user.avatar ?? "");

},[user]);

if(!user) return null;

const uploadImage = (e:any)=>{

const file = e.target.files[0];
if(!file) return;

const reader = new FileReader();

reader.onload = ()=>{
setAvatar(reader.result as string);
};

reader.readAsDataURL(file);

};

const sendEmailOtp = ()=>{
setShowEmailOtp(true);
};

const sendPhoneOtp = ()=>{
setShowPhoneOtp(true);
};

const saveProfile = async ()=>{

if(showEmailOtp && emailOtp.length !== 6){
alert("Enter correct email OTP");
return;
}

if(showPhoneOtp && phoneOtp.length !== 6){
alert("Enter correct phone OTP");
return;
}

await updateProfile({
fullName,
phone,
address: user?.address ?? "",
});

setEditMode(false);

};

return(

<>
<div className="min-h-screen bg-[#f4f6fb] pb-24">

{/* HEADER */}


 <div className="fixed top-0 left-0 right-0 z-50 flex justify-center">
      <nav className="w-full max-w-[420px] bg-white/90 backdrop-blur-lg border-b border-border rounded-b-[21px]">
        <div className="px-5 py-3 flex items-center justify-between">

          {/* Website Name */}
          <div>
            <h1 className="text-lg font-semibold text-gray-800">
              FairFoods
            </h1>

            <p className="text-xs text-gray-500">
              Fresh food delivered fast
            </p>
          </div>

          {/* Logo Right Side */}
          <img
            src={logo}
            className="h-12 w-12 object-contain"
            alt="FairFoods"
          />

        </div>
      </nav>
    </div>
{/* CONTENT */}

<div className="max-w-md mx-auto space-y-4 px-4 pt-24">

{/* Profile Card */}

<div className="bg-white rounded-2xl shadow-sm p-4 relative">

{!editMode && (

<button
className="absolute right-4 top-4"
onClick={()=>setEditMode(true)}
>

<Pencil size={18}/>

</button>

)}

<div className="flex items-center gap-4">

<div className="relative">

<img
src={avatar || "https://i.pravatar.cc/150"}
className="w-16 h-16 rounded-full object-cover border"
/>

{editMode && (

<label className="absolute bottom-0 right-0 bg-black text-white p-1 rounded-full cursor-pointer">

<Camera size={14}/>

<input
type="file"
className="hidden"
onChange={uploadImage}
/>

</label>

)}

</div>

<div>

<h2 className="font-semibold text-lg">
{user.fullName}
</h2>

<p className="text-sm text-gray-500">
{user.email}
</p>

</div>

</div>

</div>

{/* EDIT FORM */}

{editMode && (

<div className="bg-white rounded-2xl shadow-sm p-5 space-y-4">

<div>

<label className="text-sm font-medium">
Full Name
</label>

<Input
value={fullName}
onChange={(e)=>setFullName(e.target.value)}
/>

</div>

{/* Email */}

<div>

<label className="text-sm font-medium">
Email
</label>

<div className="flex gap-2">

<Input
value={email}
onChange={(e)=>setEmail(e.target.value)}
/>

<Button size="sm" onClick={sendEmailOtp}>
Send OTP
</Button>

</div>

{showEmailOtp && (

<Input
className="mt-2"
placeholder="Enter Email OTP"
value={emailOtp}
onChange={(e)=>setEmailOtp(e.target.value)}
/>

)}

</div>

{/* Phone */}

<div>

<label className="text-sm font-medium">
Phone
</label>

<div className="flex gap-2">

<Input
value={phone}
onChange={(e)=>setPhone(e.target.value)}
/>

<Button size="sm" onClick={sendPhoneOtp}>
Send OTP
</Button>

</div>

{showPhoneOtp && (

<Input
className="mt-2"
placeholder="Enter Phone OTP"
value={phoneOtp}
onChange={(e)=>setPhoneOtp(e.target.value)}
/>

)}

</div>

<div className="flex gap-3 pt-2">

<Button className="flex-1" onClick={saveProfile}>
Save
</Button>

<Button
variant="outline"
className="flex-1"
onClick={()=>setEditMode(false)}
>
Cancel
</Button>

</div>

</div>

)}

{/* Stats */}

<div className="grid grid-cols-3 gap-3">

<div className="bg-white rounded-xl shadow-sm p-3 text-center">

<p className="text-xs text-gray-500">
Member
</p>

<p className="text-sm font-semibold">
{new Date(user.createdAt).toLocaleDateString()}
</p>

</div>

<div className="bg-white rounded-xl shadow-sm p-3 text-center">

<p className="text-xs text-gray-500">
Wallet
</p>

<p className="text-sm font-semibold">
₹{user.walletBalance.toFixed(2)}
</p>

</div>

<div className="bg-white rounded-xl shadow-sm p-3 text-center">

<p className="text-xs text-gray-500">
Orders
</p>

<p className="text-sm font-semibold">
{user.orders?.length ?? 0}
</p>

</div>

</div>

{/* MENU */}

<div className="bg-white rounded-2xl shadow-sm divide-y">

<Link href="/orders">
<div className="flex items-center justify-between p-4 cursor-pointer">
<span>My Orders</span>
<ChevronRight size={18}/>
</div>
</Link>

<Link href="/wallet">
<div className="flex items-center justify-between p-4 cursor-pointer">
<span>Wallet</span>
<ChevronRight size={18}/>
</div>
</Link>

<Link href="/addresses">
<div className="flex items-center justify-between p-4 cursor-pointer">
<span>Saved Addresses</span>
<ChevronRight size={18}/>
</div>
</Link>

<Link href="/payments">
<div className="flex items-center justify-between p-4 cursor-pointer">
<span>Payment Methods</span>
<ChevronRight size={18}/>
</div>
</Link>

<Link href="/support">
<div className="flex items-center justify-between p-4 cursor-pointer">
<span>Help Center</span>
<ChevronRight size={18}/>
</div>
</Link>

<div
className="p-4 text-red-500 cursor-pointer"
onClick={()=>{
logout();
setLocation("/login");
}}
>
Logout
</div>

</div>

</div>

<BottomNav/>

</div>
</>
);
}