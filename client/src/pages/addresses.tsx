import React, { useEffect, useState } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { GoogleMap, LoadScript, Marker, Autocomplete } from "@react-google-maps/api";
import { FaArrowLeft, FaPlus, FaEdit, FaTrash } from "react-icons/fa";
import { useLocation } from "wouter";
import { useStore } from "@/lib/store";


const mapStyle = {
  width: "100%",
  height: "200px",
  borderRadius: "14px",
};

const center = {
  lat: 28.6139,
  lng: 77.209,
};

export default function AddressPage() {
  const { user } = useStore();
  const [, setLocation] = useLocation();

  const [showForm, setShowForm] = useState(false);

  const [mapCenter, setMapCenter] = useState(center);
  const [marker, setMarker] = useState(center);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);


  const [form, setForm] = useState({
    name: "",
    phone: "",
    house: "",
    area: "",
    city: "",
    pincode: "",
    default: false,
  });

  const [addresses, setAddresses] = useState<Array<any>>([]);
  const [loading, setLoading] = useState(false);


  const handlePlaceChanged = () => {
    if (!autocomplete) return;

    const place = autocomplete.getPlace();
    const location = place.geometry?.location;
    if (!location) return;


    const pos = {
      lat: location.lat(),
      lng: location.lng(),
    };

    setMapCenter(pos);
    setMarker(pos);
  };

  const loadAddresses = async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const token = localStorage.getItem("fairfoods-token");
      const res = await fetch(`/api/profile/addresses`, {
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

    navigator.geolocation.getCurrentPosition((pos) => {
      const location = {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      };

      setMapCenter(location);
      setMarker(location);
    });
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
    };

    const res = await fetch("/api/profile/addresses", {
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
    const res = await fetch(`/api/profile/addresses/${id}`, {
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

        {/* HEADER */}

        <div className="bg-white px-4 py-3 rounded-b-2xl flex items-center gap-3 shadow-sm">
          <FaArrowLeft className="text-gray-700" />
          <h2 className="font-semibold text-lg text-gray-800">My Addresses</h2>
        </div>

        <div className="p-4 space-y-4">

          {/* ADDRESS LIST */}

          {addresses.map((a) => (
            <div
              key={a.id}
              className="bg-white rounded-2xl p-4 shadow-sm flex justify-between"
            >
              <div>
                <p className="font-semibold">{a.name} ({a.phone})</p>
                <p className="text-sm text-gray-500">
                  {a.house}, {a.area}, {a.city} - {a.pincode}
                </p>

                {a.default && (
                  <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded mt-1 inline-block">
                    Default
                  </span>
                )}
              </div>

              <div className="flex gap-3 text-gray-600">
                <FaEdit className="cursor-pointer" />
                <FaTrash
                  className="cursor-pointer"
                  onClick={() => deleteAddress(a.id)}
                />
              </div>
            </div>
          ))}

          {/* ADD BUTTON */}

          <button
            onClick={() => setShowForm(true)}
            className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <FaPlus /> Add Address
          </button>

          {/* FORM */}

          {showForm && (

            <div className="bg-white rounded-2xl p-4 shadow space-y-3">

              <h3 className="font-semibold">Add Address</h3>

              <div className="grid grid-cols-2 gap-3">

                <input
                  placeholder="Full Name"
                  className="border rounded-lg p-2"
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />

                <input
                  placeholder="Phone"
                  className="border rounded-lg p-2"
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />

                <input
                  placeholder="House / Flat"
                  className="border rounded-lg p-2"
                  onChange={(e) => setForm({ ...form, house: e.target.value })}
                />

                <input
                  placeholder="Area / Street"
                  className="border rounded-lg p-2"
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                />

                <input
                  placeholder="City"
                  className="border rounded-lg p-2"
                  onChange={(e) => setForm({ ...form, city: e.target.value })}
                />

                <input
                  placeholder="Pincode"
                  className="border rounded-lg p-2"
                  onChange={(e) => setForm({ ...form, pincode: e.target.value })}
                />

              </div>

              <button
                onClick={getCurrentLocation}
                className="w-full border border-green-500 text-green-600 py-2 rounded-lg"
              >
                📍 Use Current Location
              </button>

              {/* GOOGLE MAP */}

              <LoadScript
                googleMapsApiKey="YOUR_GOOGLE_MAP_KEY"
                libraries={["places"]}
              >

                <Autocomplete
                  onLoad={(auto) => setAutocomplete(auto as unknown as google.maps.places.Autocomplete)}

                  onPlaceChanged={handlePlaceChanged}
                >
                  <input
                    placeholder="Search address"
                    className="border rounded-lg p-2 w-full"
                  />
                </Autocomplete>

                <GoogleMap
                  mapContainerStyle={mapStyle}
                  center={mapCenter}
                  zoom={15}
                  onClick={(e) => {
                    if (!e.latLng) return;
                    setMarker({
                      lat: e.latLng.lat(),
                      lng: e.latLng.lng(),
                    });
                  }}

                >
                  <Marker
                    position={marker}
                    draggable
                    onDragEnd={(e) => {
                      if (!e.latLng) return;
                      setMarker({
                        lat: e.latLng.lat(),
                        lng: e.latLng.lng(),
                      });
                    }}

                  />
                </GoogleMap>

              </LoadScript>

              <button
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