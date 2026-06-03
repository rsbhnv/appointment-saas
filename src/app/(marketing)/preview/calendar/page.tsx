import Link from "next/link";

import { Container } from "@/components/ui/container";
import { AppointmentCard } from "@/components/calendar/appointment-card";
import { AppointmentStatusBadge } from "@/components/calendar/appointment-status-badge";
import { EmptyCalendarState } from "@/components/calendar/empty-calendar-state";
import { Button } from "@/components/ui/button";
import type { CalendarAppointment } from "@/lib/calendar/types";

const MOCK_APPOINTMENT: CalendarAppointment = {
  id: "preview-1",
  businessId: "preview",
  startsAt: new Date(Date.now() + 86_400_000).toISOString(),
  endsAt: new Date(Date.now() + 86_400_000 + 3_600_000).toISOString(),
  status: "pending",
  notes: "בקשה לטיפול עדין",
  internalNotes: "לקוחה חוזרת",
  cancellationReason: null,
  cancelledAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  customer: {
    id: "c1",
    fullName: "רחל ישראלי",
    phone: "050-1234567",
    email: "rachel@example.com",
    smsConsent: true,
    whatsappConsent: false,
    emailConsent: true,
  },
  service: { id: "s1", name: "טיפול פנים", durationMinutes: 60 },
  staff: { id: "st1", name: "אודליה", color: "#7c3aed" },
  paymentStatus: "pending",
};

export default function CalendarPreviewPage() {
  return (
    <Container className="space-y-10 py-12">
      <div className="space-y-2">
        <Link href="/preview" className="text-sm text-primary hover:underline">
          ← חזרה למפת המסכים
        </Link>
        <h1 className="text-3xl font-bold text-on-surface">תצוגות יומן תורים</h1>
        <p className="text-on-surface-variant">
          דוגמאות סטטיות לעיצוב. היומן החי זמין ב-
          <Link href="/dashboard/calendar" className="text-primary hover:underline">
            /dashboard/calendar
          </Link>
          .
        </p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">רשימת תורים / כרטיס</h2>
        <AppointmentCard appointment={MOCK_APPOINTMENT} />
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">פרטי תור (תגיות סטטוס)</h2>
        <div className="rounded-xl border border-outline-variant/30 p-4 space-y-3">
          <AppointmentStatusBadge status="pending" />
          <AppointmentStatusBadge status="confirmed" />
          <AppointmentStatusBadge status="completed" />
          <AppointmentStatusBadge status="cancelled" />
          <AppointmentStatusBadge status="no_show" />
          <div className="pt-2 text-sm">
            <p className="font-medium">{MOCK_APPOINTMENT.customer.fullName}</p>
            <p className="text-on-surface-variant">{MOCK_APPOINTMENT.service.name}</p>
          </div>
          <Button variant="cta" size="sm">
            אישור תור
          </Button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">הוספת תור ידנית</h2>
        <div className="rounded-xl border border-outline-variant/30 p-4 text-sm text-on-surface-variant">
          טופס הוספה נפתח מלוח הבקרה — בחירת לקוח, שירות, צוות, תאריך ושעה פנויה.
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">יומן ריק</h2>
        <EmptyCalendarState />
      </section>
    </Container>
  );
}
