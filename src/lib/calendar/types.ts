import type { AppointmentStatus, PaymentStatus } from "@/types/database";

export type CalendarAppointmentCustomer = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  smsConsent: boolean;
  whatsappConsent: boolean;
  emailConsent: boolean;
};

export type CalendarAppointmentService = {
  id: string;
  name: string;
  durationMinutes: number;
};

export type CalendarAppointmentStaff = {
  id: string;
  name: string;
  color: string | null;
};

export type CalendarAppointment = {
  id: string;
  businessId: string;
  startsAt: string;
  endsAt: string;
  status: AppointmentStatus;
  notes: string | null;
  internalNotes: string | null;
  cancellationReason: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  customer: CalendarAppointmentCustomer;
  service: CalendarAppointmentService;
  staff: CalendarAppointmentStaff;
  paymentStatus: PaymentStatus | null;
};

export type CalendarAppointmentAudit = {
  action: string;
  createdAt: string;
  userId: string | null;
  metadata: Record<string, unknown> | null;
};

export type CalendarAppointmentDetail = CalendarAppointment & {
  auditEvents: CalendarAppointmentAudit[];
};

export type AppointmentListFilters = {
  from?: string;
  to?: string;
  staffMemberId?: string;
  serviceId?: string;
  status?: AppointmentStatus;
};

export type AvailableSlot = {
  startsAt: string;
  endsAt: string;
};

export type CalendarAvailableSlot = AvailableSlot & {
  date: string;
  staffMemberId: string | null;
  staffName: string | null;
};

export type WorkingHoursWindow = {
  startMinutes: number;
  endMinutes: number;
};
