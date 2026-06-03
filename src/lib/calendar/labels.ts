import type { AppointmentStatus, PaymentStatus } from "@/types/database";

export const APPOINTMENT_STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: "ממתין לאישור",
  confirmed: "מאושר",
  completed: "הושלם",
  cancelled: "בוטל",
  no_show: "לא הגיע",
};

export const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "ממתין לתשלום",
  authorized: "אושר",
  captured: "שולם",
  failed: "נכשל",
  refunded: "הוחזר",
  cancelled: "בוטל",
};

export const CALENDAR_VIEW_LABELS = {
  day: "יומי",
  week: "שבועי",
  month: "חודשי",
  list: "רשימה",
} as const;

export type CalendarView = keyof typeof CALENDAR_VIEW_LABELS;
