export const BOOKING_PRICE_FALLBACK = "המחיר יימסר בבית העסק";
export const BOOKING_ARRIVAL_FALLBACK = "כתובת תימסר לאחר קביעת התור";
export const BOOKING_PAYMENT_FALLBACK = "התשלום יתבצע מול בית העסק";

export function formatBookingPrice(
  price: number | null | undefined,
  currency: string,
): string {
  if (price == null || price <= 0) {
    return BOOKING_PRICE_FALLBACK;
  }

  try {
    return new Intl.NumberFormat("he-IL", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(price);
  } catch {
    return `${price} ${currency}`;
  }
}

export function formatArrivalLocation(
  address: string | null | undefined,
  arrivalInstructions: string | null | undefined,
): string {
  const parts = [address?.trim(), arrivalInstructions?.trim()].filter(Boolean);
  if (parts.length === 0) {
    return BOOKING_ARRIVAL_FALLBACK;
  }
  return parts.join("\n");
}

export function formatPaymentMethods(paymentMethods: string | null | undefined): string {
  const trimmed = paymentMethods?.trim();
  return trimmed || BOOKING_PAYMENT_FALLBACK;
}
