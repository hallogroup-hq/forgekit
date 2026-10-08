/**
 * WhatsApp Direct Link & Message Engine
 * Clean phone number normalization and wa.me URL builder.
 */

export interface CountryCode {
  country: string;
  code: string;
  flag: string;
  placeholder: string;
}

export const POPULAR_COUNTRIES: CountryCode[] = [
  { country: "Indonesia", code: "62", flag: "🇮🇩", placeholder: "812 3456 7890" },
  { country: "United States", code: "1", flag: "🇺🇸", placeholder: "555 123 4567" },
  { country: "United Kingdom", code: "44", flag: "🇬🇧", placeholder: "7911 123456" },
  { country: "Singapore", code: "65", flag: "🇸🇬", placeholder: "8123 4567" },
  { country: "Malaysia", code: "60", flag: "🇲🇾", placeholder: "12 345 6789" },
  { country: "India", code: "91", flag: "🇮🇳", placeholder: "98765 43210" },
  { country: "Australia", code: "61", flag: "🇦🇺", placeholder: "412 345 678" },
  { country: "Germany", code: "49", flag: "🇩🇪", placeholder: "151 12345678" },
  { country: "Philippines", code: "63", flag: "🇵🇭", placeholder: "917 123 4567" },
  { country: "Canada", code: "1", flag: "🇨🇦", placeholder: "416 123 4567" },
  { country: "Brazil", code: "55", flag: "🇧🇷", placeholder: "11 91234 5678" },
];

/**
 * Normalizes phone number with country dial code.
 * Strips leading '0', '+', dashes, spaces, and non-numeric characters.
 */
export function normalizeWhatsappPhone(countryCode: string, localNumber: string): string {
  const cleanCountry = countryCode.replace(/[^0-9]/g, "");
  let cleanLocal = localNumber.replace(/[^0-9]/g, "");

  // If user entered leading zero (e.g. 08123456789), strip it
  if (cleanLocal.startsWith("0")) {
    cleanLocal = cleanLocal.slice(1);
  }

  // If user already typed the country code into the local number input, don't duplicate it
  if (cleanCountry && cleanLocal.startsWith(cleanCountry)) {
    return cleanLocal;
  }

  return `${cleanCountry}${cleanLocal}`;
}

export interface WhatsappLinkOptions {
  countryCode: string;
  phoneNumber: string;
  message?: string;
}

export function buildWhatsappLink(opts: WhatsappLinkOptions): {
  url: string;
  fullPhone: string;
  isValid: boolean;
  validationError?: string;
} {
  const fullPhone = normalizeWhatsappPhone(opts.countryCode, opts.phoneNumber);

  if (!fullPhone || fullPhone.length < 7) {
    return {
      url: "",
      fullPhone,
      isValid: false,
      validationError: "Phone number is too short or invalid",
    };
  }

  if (fullPhone.length > 15) {
    return {
      url: "",
      fullPhone,
      isValid: false,
      validationError: "Phone number exceeds E.164 maximum of 15 digits",
    };
  }

  const encodedMsg = opts.message?.trim() ? encodeURIComponent(opts.message.trim()) : "";
  const url = encodedMsg
    ? `https://wa.me/${fullPhone}?text=${encodedMsg}`
    : `https://wa.me/${fullPhone}`;

  return {
    url,
    fullPhone,
    isValid: true,
  };
}

/**
 * Generates ready-to-paste HTML button code for website integration.
 */
export function generateHtmlButtonCode(url: string, buttonText = "Chat on WhatsApp"): string {
  return `<a href="${url}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;gap:8px;background-color:#25D366;color:#ffffff;padding:12px 24px;border-radius:12px;font-weight:600;font-family:system-ui,-apple-system,sans-serif;text-decoration:none;box-shadow:0 2px 6px rgba(37,211,102,0.3);transition:background-color 0.2s ease;">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#ffffff">
    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"/>
  </svg>
  <span>${buttonText}</span>
</a>`;
}
