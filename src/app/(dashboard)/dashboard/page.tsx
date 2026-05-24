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

export const dynamic = "force-dynamic";

const KPIS = [
  { id: "today", label: "תורים היום", value: "3", hint: "דמו" },
  { id: "week", label: "תורים השבוע", value: "12", hint: "דמו" },
  { id: "customers", label: "סך לקוחות", value: "48", hint: "דמו" },
  { id: "occupancy", label: "תפוסה", value: "72%", hint: "דמו" },
];

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

  return (
    <div className="space-y-8">
      <PageHeader
        title={`שלום${business ? `, ${business.name}` : ""}`}
        description="סקירה תפעולית של העסק. הנתונים המוצגים הם דמו עד חיבור מנוע התורים."
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
            {KPIS.map((kpi, index) => (
              <KpiCard
                key={kpi.id}
                label={kpi.label}
                value={kpi.value}
                hint={kpi.hint}
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
