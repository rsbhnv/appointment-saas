import "server-only";

export type BookingConfirmationSmsParams = {
  customerFirstName: string;
  businessName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
  manageAppointmentUrl: string;
};

export type AppointmentReminderSmsParams = {
  customerFirstName: string;
  businessName: string;
  serviceName: string;
  appointmentDate: string;
  appointmentTime: string;
};

export function buildBookingConfirmationSms(params: BookingConfirmationSmsParams): string {
  return [
    `שלום ${params.customerFirstName},`,
    "",
    "התור נקבע בהצלחה.",
    "",
    params.businessName,
    params.serviceName,
    "",
    `תאריך: ${params.appointmentDate}`,
    `שעה: ${params.appointmentTime}`,
    "",
    "לניהול התור:",
    params.manageAppointmentUrl,
    "",
    "תודה.",
  ].join("\n");
}

export function buildAppointmentReminderSms(params: AppointmentReminderSmsParams): string {
  return [
    `שלום ${params.customerFirstName},`,
    "",
    "תזכורת לתור מחר.",
    "",
    params.businessName,
    params.serviceName,
    "",
    `תאריך: ${params.appointmentDate}`,
    `שעה: ${params.appointmentTime}`,
    "",
    "נשמח לראותך.",
  ].join("\n");
}
