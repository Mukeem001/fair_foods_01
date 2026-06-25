import { useEffect, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { useStore } from "@/lib/store";
import { apiUrl } from "@/lib/api";
import {
  ArrowLeft,
  MapPin,
  Clock,
  CheckCircle,
  Circle,
  Truck,
  Home,
  Package,
} from "lucide-react";

export default function TrackOrder() {
  const { user } = useStore();
  const [, setLocation] = useLocation();
  const [match, params] = useRoute("/track-order/:id");

  const orderId = (params as any)?.id;

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      setLocation("/login");
      return;
    }

    if (!orderId) {
      setLocation("/orders");
      return;
    }

    const token = localStorage.getItem("fairfoods-token") ?? "";
    if (!token) {
      setLocation("/login");
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        const url = apiUrl(`/api/profile/orders/${orderId}`);
        
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          setError("Order not found");
          return;
        }

        const data = await res.json();
        setOrder(data?.order || data);
      } catch (e) {
        console.error("Track: load error", e);
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user, orderId, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f6fb] pb-24">
        <div className="bg-white px-4 py-3 rounded-b-2xl shadow-sm flex items-center gap-3">
          <button
            onClick={() => setLocation("/orders")}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">
            Track Order
          </h1>
        </div>
        <div className="text-center py-20 text-gray-400">
          Loading order details...
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#f4f6fb] pb-24">
        <div className="bg-white px-4 py-3 rounded-b-2xl shadow-sm flex items-center gap-3">
          <button
            onClick={() => setLocation("/orders")}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-lg font-semibold text-gray-800">
            Track Order
          </h1>
        </div>
        <div className="max-w-md mx-auto text-center py-20 text-red-500">
          {error || "Order not found"}
        </div>
      </div>
    );
  }

  const orderDate = new Date(order.createdAt);
  const estimatedDate = new Date(orderDate.getTime() + 3 * 24 * 60 * 60 * 1000);

  const getStatusSteps = () => {
    const steps = [
      { label: "Order Placed", icon: Package, completed: true },
      {
        label: "Being Prepared",
        icon: Clock,
        completed: order.status === "processing" || order.status === "completed",
      },
      {
        label: "Out for Delivery",
        icon: Truck,
        completed: order.status === "completed",
      },
      {
        label: "Delivered",
        icon: Home,
        completed: order.status === "completed",
      },
    ];

    if (order.status === "cancelled") {
      return [
        { label: "Order Placed", icon: Package, completed: true },
        { label: "Cancelled", icon: Circle, completed: true, cancelled: true },
      ];
    }

    return steps;
  };

  const statusSteps = getStatusSteps();

  return (
    <>
      <div className="min-h-screen bg-[#f4f6fb] pb-24">
        {/* HEADER */}
        <div className="bg-white px-4 py-3 rounded-b-2xl shadow-sm flex items-center gap-3">
          <button
            onClick={() => setLocation("/orders")}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-gray-800">
              Track Order
            </h1>
            <p className="text-xs text-gray-500">Order #{order.id}</p>
          </div>
        </div>

        <div className="max-w-md mx-auto space-y-4 p-4">
          {/* ORDER STATUS */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Order Status</h2>
              <span
                className={`text-xs px-3 py-1 rounded-full font-semibold ${
                  order.status === "completed"
                    ? "bg-green-100 text-green-700"
                    : order.status === "cancelled"
                    ? "bg-red-100 text-red-600"
                    : order.status === "processing"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}
              >
                {order.status?.charAt(0).toUpperCase() +
                  order.status?.slice(1)}
              </span>
            </div>

            {/* TIMELINE */}
            <div className="space-y-4">
              {statusSteps.map((step, index) => {
                const Icon = step.icon;
                const isLast = index === statusSteps.length - 1;
                const isCurrent =
                  !step.cancelled &&
                  step.completed &&
                  (index === statusSteps.length - 1 ||
                    !statusSteps[index + 1]?.completed);

                return (
                  <div key={index}>
                    <div className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div
                          className={`p-2 rounded-full ${
                            step.completed
                              ? step.cancelled
                                ? "bg-red-100"
                                : "bg-orange-100"
                              : "bg-gray-100"
                          }`}
                        >
                          {step.completed ? (
                            step.cancelled ? (
                              <Icon
                                size={20}
                                className="text-red-600"
                              />
                            ) : (
                              <CheckCircle
                                size={20}
                                className="text-orange-600"
                              />
                            )
                          ) : (
                            <Icon
                              size={20}
                              className="text-gray-400"
                            />
                          )}
                        </div>
                        {!isLast && (
                          <div
                            className={`w-0.5 h-12 mt-2 ${
                              statusSteps[index + 1]?.completed
                                ? "bg-orange-200"
                                : "bg-gray-200"
                            }`}
                          />
                        )}
                      </div>

                      <div className="pb-4">
                        <p
                          className={`font-semibold ${
                            step.completed
                              ? "text-gray-800"
                              : "text-gray-400"
                          }`}
                        >
                          {step.label}
                        </p>
                        {isCurrent && (
                          <p className="text-xs text-orange-600 mt-1">
                            In Progress
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ORDER DETAILS */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-800 mb-3">
              Order Details
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-sm text-gray-600">Order Date</span>
                <span className="text-sm font-semibold">
                  {orderDate.toLocaleDateString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-sm text-gray-600">
                  Estimated Delivery
                </span>
                <span className="text-sm font-semibold">
                  {estimatedDate.toLocaleDateString("en-IN")}
                </span>
              </div>

              <div className="flex justify-between items-center pb-3 border-b">
                <span className="text-sm text-gray-600">Total Amount</span>
                <span className="text-sm font-semibold text-orange-600">
                  ₹{Number(order.total || 0).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Payment Status</span>
                <span className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-700 font-semibold">
                  Paid
                </span>
              </div>
            </div>
          </div>

          {/* ORDER ITEMS */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-800 mb-3">Items</h3>

            <div className="space-y-3">
              {Array.isArray(order.items) &&
                order.items.map((item: any, index: number) => (
                  <div key={index} className="flex gap-3 pb-3 border-b last:border-b-0">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {item.name}
                      </p>
                      {item.option && (
                        <p className="text-xs text-gray-500">
                          {item.option}
                        </p>
                      )}
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-xs text-gray-600">
                          Qty: {item.qty}
                        </span>
                        <span className="text-xs font-semibold text-gray-800">
                          ₹{Number(item.price || 0).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* DELIVERY ADDRESS */}
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <MapPin size={18} />
              Delivery Address
            </h3>

            <p className="text-sm text-gray-700">
              {order.address?.address ||
                order.shippingAddress ||
                "Address not available"}
            </p>

            {order.address?.phone && (
              <p className="text-xs text-gray-500 mt-2">
                Contact: {order.address.phone}
              </p>
            )}
          </div>

          {/* HELP */}
          <div className="bg-orange-50 rounded-2xl p-4 border border-orange-200">
            <h3 className="font-semibold text-gray-800 mb-2">
              Need Help?
            </h3>
            <p className="text-sm text-gray-700 mb-3">
              If you have any questions about your order, please contact our
              support team.
            </p>
            <button className="w-full bg-orange-600 text-white py-2 rounded-lg font-semibold text-sm hover:bg-orange-700">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
