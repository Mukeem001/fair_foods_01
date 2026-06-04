import React, { createContext, useContext, useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";

export type Option = {
  name: string;
  price: number;
};

export type FoodItem = {
  id: string;
  name: string;
  img: string;
  category: string;
  options: Option[];
  active: boolean;
};

export type CartItem = FoodItem & {
  selectedOption: Option;
  qty: number;
};

export type User = {
  id: string;
  fullName: string;
  email: string;
  password: string;
  walletBalance: number;
  address: string;
  phone: string;
  orders: string[];
  createdAt: string;
  avatar?: string;
};

type StoreContextType = {
  foods: FoodItem[];
  cart: CartItem[];
  user: User | null;
  whatsappNumber: string;
  token: string | null;

  addToCart: (item: FoodItem, option: Option, qty: number) => void;
  removeFromCart: (index: number) => void;
  clearCart: () => void;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  signup: (fullName: string, email: string, password: string) => Promise<boolean>;
  forgotPassword: (email: string) => Promise<string>;
  updateProfile: (data: Partial<Pick<User, "fullName" | "phone" | "address">>) => Promise<void>;
  addFunds: (amount: number) => Promise<void>;
  setAuthSession: (
    token: string,
    authUser: { id: string; fullName: string; email: string; phone?: string; password?: string }
  ) => void;
};

const StoreContext = createContext<StoreContextType | undefined>(undefined);

const USERS_KEY = "fairfoods-users";
const USER_KEY = "fairfoods-user";
const TOKEN_KEY = "fairfoods-token";

function loadUsers(): User[] {
  const users = localStorage.getItem(USERS_KEY);
  return users ? JSON.parse(users) : [];
}

function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const savedCart = localStorage.getItem("fairfoods-cart");
    if (savedCart) {
      setCart(JSON.parse(savedCart));
    }

    const savedUser = localStorage.getItem(USER_KEY);
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const savedToken = localStorage.getItem(TOKEN_KEY);
    if (savedToken) {
      setToken(savedToken);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("fairfoods-cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
    }
  }, [user]);

  useEffect(() => {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  }, [token]);

  const fetchFoods = async () => {
    const res = await apiFetch("/api/foods");
    const data = await res.json();
    setFoods(data.filter((f: FoodItem) => f.active));
  };

  const fetchSettings = async () => {
    const res = await apiFetch("/api/settings");
    const data = await res.json();
    if (data?.whatsappNumber) setWhatsappNumber(data.whatsappNumber);
  };

  useEffect(() => {
    fetchFoods();
    fetchSettings();
  }, []);

  const addToCart = (item: FoodItem, option: Option, qty: number) => {
    setCart((prev) => [...prev, { ...item, selectedOption: option, qty }]);
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
  };

  const login = async (email: string, password: string) => {
    try {
      // Try server login first
      const res = await apiFetch("/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.token && data?.user) {
          const serverUser: User = {
            id: data.user.id,
            fullName: data.user.fullName,
            email: data.user.email,
            password,
            walletBalance: data.user.walletBalance || 0,
            address: data.user.address || "",
            phone: data.user.phone || "",
            orders: data.user.orders || [],
            createdAt: data.user.createdAt || new Date().toISOString(),
          };
          setUser(serverUser);
          setToken(String(data.token));
          // Keep local cache in sync
          const users = loadUsers();
          const filtered = users.filter(u => u.id !== serverUser.id);
          saveUsers([...filtered, serverUser]);
          return true;
        }
      }

      return false;
    } catch (e) {
      // Fallback to local-only login if server unavailable
      const users = loadUsers();
      const found = users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      );
      if (!found) return false;

      setUser(found);

      // token server-side sign endpoint
      const res = await apiFetch("/api/auth/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: found.id }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.token) setToken(String(data.token));
      }

      return true;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  const signup = async (fullName: string, email: string, password: string) => {
    // Try server signup first
    try {
      const res = await apiFetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.token) setToken(String(data.token));
        if (data?.user) {
          const serverUser: User = {
            id: data.user.id,
            fullName: data.user.fullName,
            email: data.user.email,
            password,
            walletBalance: 0,
            address: "",
            phone: "",
            orders: [],
            createdAt: new Date().toISOString(),
          };
          // keep local cache in sync
          const users = loadUsers();
          saveUsers([...users, serverUser]);
          setUser(serverUser);
        }
        return true;
      }

      if (res.status === 409) return false; // user exists
    } catch (e) {
      // fallback to local-only signup if server unavailable
    }

    // Fallback: local signup (offline/demo)
    const users = loadUsers();
    const exists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
    if (exists) return false;

    const newUser: User = {
      id: crypto?.randomUUID?.() ?? `${Math.random().toString(36).slice(2)}-${Date.now()}`,
      fullName,
      email,
      password,
      walletBalance: 0,
      address: "",
      phone: "",
      orders: [],
      createdAt: new Date().toISOString(),
    };

    const nextUsers = [...users, newUser];
    saveUsers(nextUsers);
    setUser(newUser);

    const tokenRes = await apiFetch("/api/auth/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: newUser.id }),
    });

    if (tokenRes.ok) {
      const data = await tokenRes.json();
      if (data?.token) setToken(String(data.token));
    }

    return true;
  };

  const forgotPassword = async (email: string) => {
    const users = loadUsers();
    const found = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
    if (!found) {
      return "No account found with that email.";
    }
    return `Password recovery available. Your password is: ${found.password}`;
  };

  const updateProfile = async (data: Partial<Pick<User, "fullName" | "phone" | "address">>) => {
    if (!user) return;

    // optimistic UI
    const updated = { ...user, ...data };
    setUser(updated);

    try {
const res = await apiFetch(`/api/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token || ""}`,
        },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        // fallback to local storage
        const users = loadUsers().map((u) => (u.id === user.id ? updated : u));
        saveUsers(users);
        return;
      }

      const saved = await res.json();
      if (saved?.user) {
        setUser(saved.user);
      }

      // keep local cache in sync
      const users = loadUsers().map((u) => (u.id === user.id ? (saved?.user ?? updated) : u));
      saveUsers(users);
    } catch {
      const users = loadUsers().map((u) => (u.id === user.id ? updated : u));
      saveUsers(users);
    }
  };

  const addFunds = async (amount: number) => {
    if (!user) return;
    const updated = { ...user, walletBalance: user.walletBalance + amount };
    setUser(updated);
    const users = loadUsers().map((u) => (u.id === user.id ? updated : u));
    saveUsers(users);
  };

  const setAuthSession = (
    authToken: string,
    authUser: { id: string; fullName: string; email: string; phone?: string; password?: string }
  ) => {
    const sessionUser: User = {
      id: authUser.id,
      fullName: authUser.fullName,
      email: authUser.email,
      password: authUser.password ?? "",
      walletBalance: 0,
      address: "",
      phone: authUser.phone ?? "",
      orders: [],
      createdAt: new Date().toISOString(),
    };
    setToken(authToken);
    setUser(sessionUser);
    localStorage.setItem("token", authToken);
    const users = loadUsers();
    const filtered = users.filter((u) => u.id !== sessionUser.id);
    saveUsers([...filtered, sessionUser]);
  };

  return (
    <StoreContext.Provider
      value={{
        foods,
        cart,
        user,
        whatsappNumber,
        token,

        addToCart,
        removeFromCart,
        clearCart,
        login,
        logout,
        signup,
        forgotPassword,
        updateProfile,
        addFunds,
        setAuthSession,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used within StoreProvider");
  return context;
}
