import { KpiCard } from "@/components/dashboard/kpi-card";
import { PageHeader } from "@/components/dashboard/page-header";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const dynamic = "force-dynamic";

const PLATFORM_KPIS = [
  { id: "total", label: "סך עסקים", value: "1", hint: "דמו" },
  { id: "active", label: "עסקים פעילים", value: "1", hint: "73%" },
  { id: "users", label: "משתמשים", value: "3", hint: "דמו" },
  { id: "activity", label: "פעילות אחרונה", value: "12", hint: "24ש" },
];

export default function SuperAdminHomePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="סקירה חוצת-עסקים"
        description="מבט-על על כל הדיירים בפלטפורמה. מסך זה נפרד מלוח הבקרה של עסק בודד."
        action={<Badge variant="warning">פלטפורמה</Badge>}
      />

      <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
        {PLATFORM_KPIS.map((kpi, index) => (
          <KpiCard
            key={kpi.id}
            label={kpi.label}
            value={kpi.value}
            hint={kpi.hint}
            accent={index === 0}
          />
        ))}
      </div>

      <Card className="border-warning/20 bg-warning/5">
        <CardHeader className="border-b border-warning/10">
          <CardTitle>הצעד הבא</CardTitle>
          <CardDescription>
            מודולי super-admin: עסקים, משתמשים, מנויים, תוכניות, יומן ביקורת
            והגדרות מערכת.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-on-surface-variant">
          אין כאן ממשק הזמנות ללקוח — רק ניהול ברמת הפלטפורמה.
        </CardContent>
      </Card>
    </div>
  );
}
