import { Badge } from "@/components/ui/badge";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GuardError, requireBusinessMember, requireSession } from "@/server/guards";
import { findBusinessById } from "@/server/repositories/businesses";
import { getDashboardStats } from "@/server/repositories/dashboard-stats";

export const dynamic = "force-dynamic";

export default async function DashboardOverviewPage({
  searchParams,
}: {
  searchParams?: Promise<{ empty?: string }>;
}) {
  const params = (await searchParams) ?? {};
  const user = await requireSession();

  let membership:
    | Awaited<ReturnType<typeof requireBusinessMember>>["membership"]
    | null = null;
  try {
    const ctx = await requireBusinessMember();
    membership = ctx.membership;
  } catch (err) {
    if (!(err instanceof GuardError) || err.code !== "no_business_membership") {
      throw err;
    }
  }

  const business = membership
    ? await findBusinessById(membership.businessId)
    : null;

  const stats =
    membership && business
      ? await getDashboardStats(
          membership.businessId,
          business.timezone ?? "Asia/Jerusalem",
        )
      : null;

  const kpis = stats
    ? [
        {
          id: "today",
          label: "תורים היום",
          value: String(stats.appointmentsToday),
        },
        {
          id: "week",
          label: "תורים השבוע",
          value: String(stats.appointmentsThisWeek),
        },
        {
          id: "customers",
          label: "סך לקוחות",
          value: String(stats.customerCount),
        },
        {
          id: "staff",
          label: "צוות פעיל",
          value: String(stats.activeStaffCount),
        },
      ]
    : [];

  return (
    <div className="space-y-8">
      <PageHeader
        title={`שלום${business ? `, ${business.name}` : ""}`}
        description="סקירה תפעולית של העסק — נתונים מ-Supabase."
        action={<Badge variant="accent">סקירה</Badge>}
      />

      {!membership ? (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>אין שיוך לעסק</CardTitle>
            <CardDescription>
              {params.empty
                ? "סיימת התחברות, אך החשבון עדיין לא משויך לעסק."
                : "החשבון אינו משויך לעסק פעיל. צור עסק או בקש הזמנה מהבעלים."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-on-surface-variant">
            יצירה והזמנת צוות יתווספו בשלב הבא.
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi, index) => (
              <KpiCard
                key={kpi.id}
                label={kpi.label}
                value={kpi.value}
                accent={index === 0}
              />
            ))}
          </div>

          <Card>
            <CardHeader className="border-b">
              <CardTitle>הקשר עסקי פעיל</CardTitle>
              <CardDescription>
                {user.email ? `מחובר כ-${user.email}` : "משתמש מחובר"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Row
                label="עסק"
                value={business?.name ?? membership.businessId}
              />
              <Row
                label="תפקיד"
                value={<Badge variant="accent">{membership.role}</Badge>}
              />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-outline-variant/20 py-2 last:border-0">
      <span className="text-on-surface-variant">{label}</span>
      <span className="font-medium text-on-surface">{value}</span>
    </div>
  );
}
