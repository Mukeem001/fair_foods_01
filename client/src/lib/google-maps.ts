import type { Libraries } from "@react-google-maps/api";

export const GOOGLE_MAP_LIBRARIES: Libraries = ["places"];

export function getGoogleMapsApiKey(): string {
  return String(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "").trim();
}

export function isGoogleMapsConfigured(): boolean {
  const key = getGoogleMapsApiKey();
  return key.length > 0 && key !== "YOUR_GOOGLE_MAP_KEY";
}
