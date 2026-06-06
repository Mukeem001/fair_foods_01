import { useCallback, useState } from "react";
import {
  Autocomplete,
  GoogleMap,
  Marker,
  useJsApiLoader,
} from "@react-google-maps/api";
import {
  getGoogleMapsApiKey,
  GOOGLE_MAP_LIBRARIES,
  isGoogleMapsConfigured,
} from "@/lib/google-maps";

export type MapPosition = { lat: number; lng: number };

const mapContainerStyle = {
  width: "100%",
  height: "220px",
  borderRadius: "14px",
};

type AddressMapPickerProps = {
  center: MapPosition;
  marker: MapPosition;
  onCenterChange: (pos: MapPosition) => void;
  onMarkerChange: (pos: MapPosition) => void;
};

export function AddressMapPicker({
  center,
  marker,
  onCenterChange,
  onMarkerChange,
}: AddressMapPickerProps) {
  const apiKey = getGoogleMapsApiKey();
  const [autocomplete, setAutocomplete] =
    useState<google.maps.places.Autocomplete | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: apiKey,
    libraries: GOOGLE_MAP_LIBRARIES,
    id: "fairfoods-address-map",
  });

  const handlePlaceChanged = useCallback(() => {
    if (!autocomplete) return;
    const place = autocomplete.getPlace();
    const location = place.geometry?.location;
    if (!location) return;

    const pos = {
      lat: location.lat(),
      lng: location.lng(),
    };
    onCenterChange(pos);
    onMarkerChange(pos);
  }, [autocomplete, onCenterChange, onMarkerChange]);

  if (!isGoogleMapsConfigured()) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 space-y-2">
        <p className="font-medium">Google Map is not configured</p>
        <p className="text-xs text-amber-800">
          Add your Maps API key in <code className="bg-amber-100 px-1 rounded">client/.env</code>:
        </p>
        <pre className="text-[11px] bg-white/80 p-2 rounded border border-amber-100 overflow-x-auto">
          VITE_GOOGLE_MAPS_API_KEY=your_key_here
        </pre>
        <p className="text-xs text-amber-700">
          Enable <strong>Maps JavaScript API</strong> and <strong>Places API</strong> in Google Cloud
          Console, then restart <code className="bg-amber-100 px-1 rounded">npm run dev:client</code>.
        </p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Failed to load Google Maps. Check API key, billing, and enabled APIs (Maps JavaScript + Places).
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className="flex items-center justify-center rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500"
        style={{ height: mapContainerStyle.height }}
      >
        Loading map…
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Autocomplete
        onLoad={(auto) => setAutocomplete(auto)}
        onPlaceChanged={handlePlaceChanged}
      >
        <input
          placeholder="Search address on map"
          className="border rounded-lg p-2 w-full text-sm"
        />
      </Autocomplete>

      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={center}
        zoom={15}
        options={{
          streetViewControl: false,
          mapTypeControl: false,
          fullscreenControl: false,
        }}
        onClick={(e) => {
          if (!e.latLng) return;
          const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
          onMarkerChange(pos);
          onCenterChange(pos);
        }}
      >
        <Marker
          position={marker}
          draggable
          onDragEnd={(e) => {
            if (!e.latLng) return;
            const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
            onMarkerChange(pos);
            onCenterChange(pos);
          }}
        />
      </GoogleMap>
    </div>
  );
}
