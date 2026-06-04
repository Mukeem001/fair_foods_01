import { useEffect, useMemo, useState, type ComponentType } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Lock, Trash2, Eye, EyeOff, ArrowLeft, Layers, Users, ChartPie, Settings, Box } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { Link } from "wouter";

export interface FoodOption {
  name: string;
  price: number;
}

export interface FoodItem {
  id: string;
  name: string;
  img: string;
  category: string;
  active: boolean;
  options: FoodOption[];
}

interface OrderItem {
  id: string;
  name: string;
  option: string;
  qty: number;
  price: number;
}

interface OrderDocument {
  id: string;
  userId?: string;
  items?: OrderItem[];
  total?: number;
  amount?: number;
  finalAmount?: number;
  address?: string;
  whatsappNumber?: string;
  status: string;
  createdAt: string;
  orderNumber?: string;
  paymentMethod?: string;
  paymentChannel?: string;
  barcode?: string;
  utrNumber?: string;
  adminNotes?: string;
}

type AdminSection = "dashboard" | "products" | "orders" | "customers" | "settings" | "reports";

const SECTION_ITEMS: Array<{ id: AdminSection; title: string; icon: ComponentType<any> }> = [
  { id: "dashboard", title: "Dashboard", icon: Layers },
  { id: "products", title: "Products", icon: Box },
  { id: "orders", title: "Orders", icon: ChartPie },
  { id: "customers", title: "Customers", icon: Users },
  { id: "settings", title: "Settings", icon: Settings },
  { id: "reports", title: "Reports", icon: ChartPie },
];

export default function Admin() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [orders, setOrders] = useState<OrderDocument[]>([]);
  const [section, setSection] = useState<AdminSection>("dashboard");

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [adminKey, setAdminKey] = useState("");

  const [newItem, setNewItem] = useState<Partial<FoodItem>>({
    name: "",
    img: "",
    category: "Main Course",
    options: [],
    active: true,
  });

  const [optName, setOptName] = useState("");
  const [optPrice, setOptPrice] = useState("");

  const getAdminHeaders = () => ({
    "Content-Type": "application/json",
    "x-admin-key": adminKey,
  });

  const fetchFoods = async () => {
    const res = await apiFetch("/api/admin/foods", { headers: getAdminHeaders() });
    if (res.ok) {
      const data = await res.json();
      setFoods(data);
    }
  };

  const fetchSettings = async () => {
    const res = await apiFetch("/api/admin/settings", { headers: getAdminHeaders() });
    if (res.ok) {
      const data = await res.json();
      if (data?.whatsappNumber) setWhatsappNumber(data.whatsappNumber);
    }
  };

  const fetchOrders = async () => {
    const res = await apiFetch("/api/admin/orders", { headers: getAdminHeaders() });
    if (res.ok) {
      const data = await res.json();
      setOrders(data);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("admin-key");
    if (saved) {
      setAdminKey(saved);
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchFoods();
      fetchSettings();
      fetchOrders();
    }
  }, [isAuthenticated, adminKey]);

  const handleLogin = async () => {
    const res = await apiFetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    if (!res.ok) {
      alert("Invalid Password");
      return;
    }

    localStorage.setItem("admin-key", password);
    setAdminKey(password);
    setIsAuthenticated(true);
    setPassword("");
  };

  const handleLogout = () => {
    localStorage.removeItem("admin-key");
    setAdminKey("");
    setIsAuthenticated(false);
    setFoods([]);
    setOrders([]);
  };

  const addOption = () => {
    if (!optName || !optPrice) return;
    setNewItem((prev) => ({
      ...prev,
      options: [...(prev.options || []), { name: optName, price: Number(optPrice) }],
    }));
    setOptName("");
    setOptPrice("");
  };

  const handleSaveItem = async () => {
    if (!newItem.name || !newItem.img || !newItem.options?.length) {
      alert("Please fill all fields and add at least one option");
      return;
    }

    const res = await apiFetch("/api/admin/foods", {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify(newItem),
    });

    if (!res.ok) {
      alert("Failed to add item");
      return;
    }

    setNewItem({ name: "", img: "", category: "Main Course", options: [], active: true });
    await fetchFoods();
    alert("Item added successfully!");
  };

  const toggleFood = async (id: string) => {
    await apiFetch(`/api/admin/foods/${id}/toggle`, {
      method: "PATCH",
      headers: getAdminHeaders(),
    });
    fetchFoods();
  };

  const deleteFood = async (id: string) => {
    await apiFetch(`/api/admin/foods/${id}`, {
      method: "DELETE",
      headers: getAdminHeaders(),
    });
    fetchFoods();
  };

  const saveWhatsapp = async () => {
    const res = await apiFetch("/api/admin/settings", {
      method: "POST",
      headers: getAdminHeaders(),
      body: JSON.stringify({ whatsappNumber }),
    });
    if (!res.ok) {
      alert("Failed to save WhatsApp number");
      return;
    }
    alert("Settings updated");
  };

  const updateOrderStatus = async (id: string, status: string) => {
    const res = await apiFetch(`/api/admin/orders/${id}/status`, {
      method: "PATCH",
      headers: getAdminHeaders(),
      body: JSON.stringify({ status }),
    });
    if (res.ok) fetchOrders();
  };

  const totalRevenue = useMemo(
    () => orders.reduce((sum, order) => sum + (order.total ?? order.amount ?? order.finalAmount ?? 0), 0),
    [orders],
  );

  const orderStatusCounts = useMemo(
    () => ({
      pending: orders.filter((order) => order.status === "pending").length,
      processing: orders.filter((order) => order.status === "processing").length,
      completed: orders.filter((order) => order.status === "completed").length,
      cancelled: orders.filter((order) => order.status === "cancelled").length,
    }),
    [orders],
  );

  const customerSummary = useMemo(() => {
    const map = new Map<string, { userId: string; orders: number; lastOrder: string }>();
    orders.forEach((order) => {
      const id = order.userId ?? order.whatsappNumber ?? order.orderNumber ?? order.id;
      const existing = map.get(id);
      if (existing) {
        existing.orders += 1;
        existing.lastOrder = order.createdAt;
      } else {
        map.set(id, { userId: id, orders: 1, lastOrder: order.createdAt });
      }
    });
    return Array.from(map.values());
  }, [orders]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-secondary/30">
        <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-sm text-center space-y-6">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto text-primary">
            <Lock size={32} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Admin Login</h1>
            <p className="text-muted-foreground mt-2">Use your admin password to access the panel.</p>
          </div>
          <div className="space-y-4">
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-12 text-center text-lg"
            />
            <Button className="w-full h-12 text-lg" onClick={handleLogin}>Login</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/20 p-4 sm:p-6">
      <div className="max-w-[1440px] mx-auto space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <button className="h-10 w-10 flex items-center justify-center bg-white rounded-xl border border-border/50 text-muted-foreground hover:text-foreground transition-colors">
                <ArrowLeft size={20} />
              </button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">E-commerce Admin Panel</h1>
              <p className="text-sm text-muted-foreground">Complete store management for products, orders, customers and reports.</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleLogout}>Logout</Button>
            <Button variant="secondary" onClick={() => { setSection("dashboard"); fetchOrders(); fetchFoods(); }}>Refresh</Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[280px_1fr] items-start">
          <div className="space-y-4">
            <div className="bg-white rounded-3xl border border-border/50 p-4 shadow-sm">
              <h2 className="text-lg font-semibold">Menu</h2>
              <div className="mt-4 space-y-2">
                {SECTION_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = section === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSection(item.id)}
                      className={`w-full rounded-2xl px-4 py-3 text-left transition ${active ? "bg-primary text-white" : "bg-slate-50 text-slate-700 hover:bg-slate-100"}`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5" />
                        <span className="font-medium">{item.title}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-border/50 p-4 shadow-sm">
              <h2 className="text-lg font-semibold">Quick stats</h2>
              <div className="mt-4 grid gap-3">
                <div className="rounded-2xl border border-border/50 bg-slate-50 p-4">
                  <p className="text-sm text-muted-foreground">Products</p>
                  <p className="mt-2 text-2xl font-semibold">{foods.length}</p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-slate-50 p-4">
                  <p className="text-sm text-muted-foreground">Total orders</p>
                  <p className="mt-2 text-2xl font-semibold">{orders.length}</p>
                </div>
                <div className="rounded-2xl border border-border/50 bg-slate-50 p-4">
                  <p className="text-sm text-muted-foreground">Revenue</p>
                  <p className="mt-2 text-2xl font-semibold">₹{totalRevenue.toFixed(0)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {section === "dashboard" && (
              <div className="grid gap-4 xl:grid-cols-3">
                <div className="rounded-3xl bg-white p-6 shadow-sm border border-border/50">
                  <p className="text-sm text-muted-foreground">Daily orders</p>
                  <p className="mt-3 text-3xl font-semibold">{orders.filter((order) => new Date(order.createdAt).toDateString() === new Date().toDateString()).length}</p>
                </div>
                <div className="rounded-3xl bg-white p-6 shadow-sm border border-border/50">
                  <p className="text-sm text-muted-foreground">Pending orders</p>
                  <p className="mt-3 text-3xl font-semibold">{orderStatusCounts.pending}</p>
                </div>
                <div className="rounded-3xl bg-white p-6 shadow-sm border border-border/50">
                  <p className="text-sm text-muted-foreground">Completed</p>
                  <p className="mt-3 text-3xl font-semibold">{orderStatusCounts.completed}</p>
                </div>
              </div>
            )}

            {section === "orders" && (
              <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-6 space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-semibold">Orders</h2>
                    <p className="text-sm text-muted-foreground">Manage every ecommerce order in one place.</p>
                  </div>
                  <Button variant="outline" onClick={fetchOrders}>Reload</Button>
                </div>
                {orders.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No orders are available yet.</p>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="rounded-3xl border border-border/50 bg-slate-50 p-4">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleString()}</p>
                            <h3 className="text-lg font-semibold">{order.orderNumber ?? order.id}</h3>
                            <p className="text-sm text-muted-foreground">{order.address ?? order.paymentChannel ?? "No address"}</p>
                          </div>
                          <div className="flex flex-wrap gap-2 items-center">
                            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{order.status}</span>
                            <span className="text-sm text-muted-foreground">₹{order.total ?? order.amount ?? order.finalAmount ?? 0}</span>
                          </div>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          {(order.items || []).map((item) => (
                            <div key={`${order.id}-${item.id}-${item.option}`} className="rounded-2xl border border-border/50 bg-white p-3">
                              <p className="font-semibold">{item.name}</p>
                              <p className="text-xs text-muted-foreground">{item.option} • x{item.qty}</p>
                              <p className="mt-2 font-semibold">₹{item.price * item.qty}</p>
                            </div>
                          ))}
                          {!order.items?.length && (
                            <div className="rounded-2xl border border-border/50 bg-white p-3 text-sm text-muted-foreground">
                              Order details unavailable for this legacy payload.
                            </div>
                          )}
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <Button size="sm" variant="secondary" onClick={() => updateOrderStatus(order.id, "processing")}>Processing</Button>
                          <Button size="sm" variant="outline" onClick={() => updateOrderStatus(order.id, "completed")}>Completed</Button>
                          <Button size="sm" variant="destructive" onClick={() => updateOrderStatus(order.id, "cancelled")}>Cancelled</Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {section === "products" && (
              <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-6 space-y-6">
                <div>
                  <h2 className="text-xl font-semibold">Products</h2>
                  <p className="text-sm text-muted-foreground">Add, manage and activate items for your store.</p>
                </div>
                <div className="grid gap-4 xl:grid-cols-[1fr_430px]">
                  <div className="space-y-4">
                    {foods.map((food) => (
                      <div key={food.id} className="rounded-3xl border border-border/50 bg-slate-50 p-4 flex items-center gap-4">
                        <img src={food.img} className="h-16 w-16 rounded-xl object-cover" />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold">{food.name}</h3>
                          <p className="text-sm text-muted-foreground">{food.category} • {food.options.length} variants</p>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => toggleFood(food.id)} className={`rounded-2xl px-3 py-2 text-sm ${food.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                            {food.active ? "Active" : "Inactive"}
                          </button>
                          <button onClick={() => deleteFood(food.id)} className="rounded-2xl bg-destructive/10 px-3 py-2 text-sm text-destructive">Delete</button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="rounded-3xl border border-border/50 bg-white p-5 shadow-sm">
                    <h3 className="text-lg font-semibold">Add Product</h3>
                    <div className="mt-4 space-y-3">
                      <Input placeholder="Item name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} />
                      <Input placeholder="Image URL" value={newItem.img} onChange={(e) => setNewItem({ ...newItem, img: e.target.value })} />
                      <Input placeholder="Category" value={newItem.category} onChange={(e) => setNewItem({ ...newItem, category: e.target.value })} />
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Input placeholder="Variant name" value={optName} onChange={(e) => setOptName(e.target.value)} />
                        <Input placeholder="Price" type="number" value={optPrice} onChange={(e) => setOptPrice(e.target.value)} />
                      </div>
                      <Button onClick={addOption} variant="outline" className="w-full">Add Variant</Button>
                      <div className="space-y-2">
                        {(newItem.options || []).map((option, idx) => (
                          <div key={idx} className="rounded-2xl border border-border/50 bg-slate-50 p-3 flex justify-between text-sm">
                            <span>{option.name}</span>
                            <span>₹{option.price}</span>
                          </div>
                        ))}
                      </div>
                      <Button onClick={handleSaveItem} className="w-full">Save Product</Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {section === "customers" && (
              <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-6">
                <h2 className="text-xl font-semibold">Customers</h2>
                <p className="text-sm text-muted-foreground">Track active customers and retention.</p>
                <div className="mt-5 grid gap-3">
                  {customerSummary.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No customer data found.</p>
                  ) : (
                    customerSummary.map((customer) => (
                      <div key={customer.userId} className="rounded-3xl border border-border/50 bg-slate-50 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <div>
                            <p className="text-sm text-muted-foreground">Customer</p>
                            <p className="font-semibold">{customer.userId}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Orders</p>
                            <p className="font-semibold">{customer.orders}</p>
                          </div>
                        </div>
                        <p className="mt-3 text-xs text-muted-foreground">Last order: {new Date(customer.lastOrder).toLocaleDateString()}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {section === "settings" && (
              <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-6 space-y-4">
                <div>
                  <h2 className="text-xl font-semibold">Store settings</h2>
                  <p className="text-sm text-muted-foreground">Update WhatsApp contact and quick store preferences.</p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm text-muted-foreground">WhatsApp number</label>
                    <Input value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} />
                  </div>
                </div>
                <Button onClick={saveWhatsapp}>Save settings</Button>
              </div>
            )}

            {section === "reports" && (
              <div className="bg-white rounded-3xl border border-border/50 shadow-sm p-6 space-y-4">
                <h2 className="text-xl font-semibold">Reports</h2>
                <p className="text-sm text-muted-foreground">Revenue, order trends and category performance.</p>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-3xl border border-border/50 bg-slate-50 p-4">
                    <p className="text-sm text-muted-foreground">Total revenue</p>
                    <p className="mt-2 text-2xl font-semibold">₹{totalRevenue.toFixed(0)}</p>
                  </div>
                  <div className="rounded-3xl border border-border/50 bg-slate-50 p-4">
                    <p className="text-sm text-muted-foreground">Completed orders</p>
                    <p className="mt-2 text-2xl font-semibold">{orderStatusCounts.completed}</p>
                  </div>
                  <div className="rounded-3xl border border-border/50 bg-slate-50 p-4">
                    <p className="text-sm text-muted-foreground">Pending orders</p>
                    <p className="mt-2 text-2xl font-semibold">{orderStatusCounts.pending}</p>
                  </div>
                </div>
                <div className="rounded-3xl border border-border/50 bg-slate-50 p-4">
                  <h3 className="text-base font-semibold">Order breakdown</h3>
                  <div className="mt-3 grid gap-2 sm:grid-cols-4">
                    {Object.entries(orderStatusCounts).map(([key, value]) => (
                      <div key={key} className="rounded-2xl bg-white p-3 text-center text-sm">
                        <p className="text-muted-foreground">{key}</p>
                        <p className="mt-2 font-semibold">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
