/** Normalize email or phone (E.164 for Indian numbers) for API calls. */
export function formatIdentifier(input: string): string {
  const trimmed = input.trim();
  if (trimmed.includes("@")) return trimmed.toLowerCase();

  const cleaned = trimmed.replace(/\D/g, "");
  if (cleaned.length === 10) return `+91${cleaned}`;
  if (cleaned.length === 12 && cleaned.startsWith("91")) return `+${cleaned}`;
  if (trimmed.startsWith("+")) return trimmed;
  if (cleaned.length > 0) return `+91${cleaned}`;
  return trimmed;
}
