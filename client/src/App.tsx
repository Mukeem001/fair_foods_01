import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { StoreProvider } from "@/lib/store";
import Home from "@/pages/home";
import Search from "@/pages/search";
import Cart from "@/pages/cart";
import Login from "@/pages/login";
import Signup from "@/pages/signup";
import ForgotPassword from "@/pages/forgot-password";
import Profile from "@/pages/profile";
import Wallet from "@/pages/wallet";
import Orders from "@/pages/orders";
import Addresses from "@/pages/addresses";
import Payments from "@/pages/payments";
import Support from "@/pages/support";
import NotFound from "@/pages/not-found";


function Router() {
  return (
    <div className="min-h-screen w-full flex justify-center bg-background">
      <div className="w-full max-w-[420px]">
        <div className="pb-safe">
          <Switch>
            <Route path="/" component={Home} />
            <Route path="/cart" component={Cart} />
            <Route path="/search" component={Search} />
            <Route path="/login" component={Login} />
            <Route path="/signup" component={Signup} />
            <Route path="/forgot-password" component={ForgotPassword} />
            <Route path="/profile" component={Profile} />
            <Route path="/wallet" component={Wallet} />
            <Route path="/orders" component={Orders} />
            <Route path="/addresses" component={Addresses} />
            <Route path="/payments" component={Payments} />
            <Route path="/support" component={Support} />
            <Route component={NotFound} />
          </Switch>
        </div>
      </div>
    </div>
  );
}


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <Router />
        <Toaster />
      </StoreProvider>
    </QueryClientProvider>
  );
}

export default App;

