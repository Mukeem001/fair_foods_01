import { useEffect, useState } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { AddressMapPicker, type MapPosition } from "@/components/address-map-picker";
import { FaArrowLeft, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { useLocation } from "wouter";
import { apiFetch } from "@/lib/api";
import { useStore } from "@/lib/store";

const defaultCenter: MapPosition = {
  lat: 28.6139,
  lng: 77.209,
};

export default function AddressPage() {
  const { user } = useStore();
  const [, setLocation] = useLocation();

  const [showForm, setShowForm] = useState(false);
  const [mapCenter, setMapCenter] = useState<MapPosition>(defaultCenter);
  const [marker, setMarker] = useState<MapPosition>(defaultCenter);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    house: "",
    area: "",
    city: "",
    pincode: "",
    default: false,
  });

  const [addresses, setAddresses] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(false);

  const loadAddresses = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const token = localStorage.getItem("fairfoods-token");
      const res = await apiFetch(`/api/profile/addresses`, {
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
      });
      const data = await res.json().catch(() => null);
      setAddresses(Array.isArray(data?.addresses) ? data.addresses : []);
    } catch {
      setAddresses([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      setLocation("/login");
      return;
    }
    loadAddresses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported on this device");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setMapCenter(location);
        setMarker(location);
      },
      () => alert("Could not get your location. Allow location permission and try again.")
    );
  };

  const saveAddress = async () => {
    if (!user?.id) {
      alert("Login required");
      return;
    }

    const token = localStorage.getItem("fairfoods-token");
    const body = {
      name: form.name,
      phone: form.phone,
      house: form.house,
      area: form.area,
      city: form.city,
      pincode: form.pincode,
      isDefault: Boolean(form.default),
      lat: marker.lat,
      lng: marker.lng,
    };

    const res = await apiFetch("/api/profile/addresses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token || ""}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.message || "Failed to save address");
      return;
    }

    setShowForm(false);
    await loadAddresses();
  };

  const deleteAddress = async (id: number | string) => {
    const token = localStorage.getItem("fairfoods-token");
    const res = await apiFetch(`/api/profile/addresses/${id}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token || ""}`,
      },
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      alert(data?.message || "Failed to delete address");
      return;
    }

    await loadAddresses();
  };

  return (
    <>
      <div className="min-h-screen bg-[#f4f6fb] pb-24">
        <div className="bg-white px-4 py-3 rounded-b-2xl flex items-center gap-3 shadow-sm">
          <button type="button" onClick={() => setLocation("/profile")} aria-label="Back">
            <FaArrowLeft className="text-gray-700" />
          </button>
          <h2 className="font-semibold text-lg text-gray-800">My Addresses</h2>
        </div>

        <div className="p-4 space-y-4">
          {loading && addresses.length === 0 && (
            <p className="text-center text-sm text-gray-500">Loading addresses…</p>
          )}

          {addresses.map((a) => (
            <div
              key={String(a.id)}
              className="bg-white rounded-2xl p-4 shadow-sm flex justify-between"
            >
              <div>
                <p className="font-semibold">
                  {String(a.name)} ({String(a.phone)})
                </p>
                <p className="text-sm text-gray-500">
                  {String(a.house)}, {String(a.area)}, {String(a.city)} - {String(a.pincode)}
                </p>
                {Boolean(a.isDefault ?? a.default) && (
                  <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded mt-1 inline-block">
                    Default
                  </span>
                )}
              </div>
              <div className="flex gap-3 text-gray-600">
                <FaEdit className="cursor-pointer opacity-40" title="Edit coming soon" />
                <FaTrash
                  className="cursor-pointer hover:text-red-500"
                  onClick={() => deleteAddress(a.id as number | string)}
                />
              </div>
            </div>
          ))}

          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <FaPlus /> Add Address
          </button>

          {showForm && (
            <div className="bg-white rounded-2xl p-4 shadow space-y-3">
              <h3 className="font-semibold">Add Address</h3>

              <div className="grid grid-cols-2 gap-3">
                <input
                  placeholder="Full Name"
                  className="border rounded-lg p-2 text-sm"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
                <input
                  placeholder="Phone"
                  className="border rounded-lg p-2 text-sm"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
                <input
                  placeholder="House / Flat"
                  className="border rounded-lg p-2 text-sm"
                  value={form.house}
                  onChange={(e) => setForm({ ...form, house: e.target.value })}
                />
                <input
                  placeholder="Area / Street"
                  className="border rounded-lg p-2 text-sm"
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                />
                <input
                  placeholder="City"
                  className="border rounded-lg p-2 text-sm"
                  value={form.city}
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />
                <input
                  placeholder="Pincode"
                  className="border rounded-lg p-2 text-sm"
                  value={form.pincode}
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                />
              </div>

              <button
                type="button"
                onClick={getCurrentLocation}
                className="w-full border border-green-500 text-green-600 py-2 rounded-lg text-sm"
              >
                📍 Use Current Location
              </button>

              <AddressMapPicker
                center={mapCenter}
                marker={marker}
                onCenterChange={setMapCenter}
                onMarkerChange={setMarker}
              />

              <button
                type="button"
                onClick={saveAddress}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl"
              >
                Save Address
              </button>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </>
  );
}
