/** Country dialing codes offered in phone inputs. Lebanon is the default. */
export const COUNTRY_CODES = [
  { code: "+961", label: "LB" },
  { code: "+1", label: "US" },
  { code: "+44", label: "UK" },
  { code: "+33", label: "FR" },
  { code: "+49", label: "DE" },
  { code: "+39", label: "IT" },
  { code: "+34", label: "ES" },
  { code: "+31", label: "NL" },
  { code: "+41", label: "CH" },
  { code: "+43", label: "AT" },
  { code: "+45", label: "DK" },
  { code: "+46", label: "SE" },
  { code: "+47", label: "NO" },
  { code: "+358", label: "FI" },
  { code: "+30", label: "GR" },
  { code: "+90", label: "TR" },
  { code: "+20", label: "EG" },
  { code: "+212", label: "MA" },
  { code: "+216", label: "TN" },
] as const;

export const DEFAULT_COUNTRY_CODE = "+961";

/** Splits a stored phone like "+96176828401" into its dialing code and local part. */
export function splitPhone(phone: string | null | undefined) {
  const value = (phone ?? "").replace(/\s+/g, "");
  const match = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length).find((c) => value.startsWith(c.code));
  if (match) return { countryCode: match.code, local: value.slice(match.code.length) };
  return { countryCode: DEFAULT_COUNTRY_CODE, local: value.replace(/^\+/, "") };
}
