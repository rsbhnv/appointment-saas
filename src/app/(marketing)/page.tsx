import { Star } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

const FEATURES = [
  {
    title: "ניהול תורים רב-דיירי",
    description:
      "כל עסק מקבל מרחב מבודד עם נתונים, מיתוג והרשאות משלו — מבלי לערב לקוחות.",
  },
  {
    title: "הזמנה בזרימה קצרה",
    description: "שלב זיהוי → שירות ומועד → אישור. ללא ת״ז חובה, ללא הרשמה מסורבלת.",
  },
  {
    title: "תפקידים עסקיים",
    description:
      "Owner, Admin, Staff — כל אחד רואה את מה שצריך. אכיפה עם RLS, לא רק UI.",
  },
  {
    title: "white-label לכל עסק",
    description: "צבעים, לוגו וקישור הזמנה ייחודי. הלקוח שלך לא רואה את המותג שלנו.",
  },
];

const FLOW_STEPS = [
  {
    label: "1",
    title: "זיהוי לקוח",
    description: "חיפוש לפי טלפון או אימייל. אם לא קיים — הרשמה מהירה בלי ת״ז.",
  },
  {
    label: "2",
    title: "שירות ומועד",
    description: "רשימת שירותים, לוח שנה חודשי, ושעות פנויות שמחושבות בזמן אמת.",
  },
  {
    label: "3",
    title: "אישור",
    description: "סיכום + בחירת ערוץ תזכורת. בדיקת זמינות סופית לפני שמירה.",
  },
];

const STATS = [
  { value: "2,400+", label: "עסקים פעילים" },
  { value: "18,000+", label: "תורים בחודש" },
  { value: "4.9", label: "דירוג ממוצע", showStar: true },
];

export default function HomePage() {
  return (
    <>
      <section className="relative overflow-hidden soft-gradient border-b border-outline-variant/30">
        <div className="pointer-events-none absolute -start-24 -top-24 size-64 rounded-full bg-primary-container/10 blur-3xl" />
        <Container>
          <div className="flex flex-col items-center py-14 text-center sm:py-20">
            <Badge variant="accent" className="mb-6 h-8 px-4 text-sm">
              ✦ מערכת ניהול תורים חכמה
            </Badge>
            <h1 className="max-w-3xl text-4xl font-extrabold leading-tight tracking-tight text-on-surface sm:text-5xl md:text-6xl">
              הדרך הפשוטה לנהל
              <br />
              <span className="text-gradient-primary">תורים לכל עסק</span>
            </h1>
            <p className="mx-auto mt-4 max-w-prose text-base leading-relaxed text-on-surface-variant sm:text-lg">
              {siteConfig.description}
            </p>
            <div className="mt-8 flex w-full max-w-md flex-col gap-3 sm:flex-row sm:justify-center">
              <ButtonLink
                href="/login"
                variant="cta"
                size="xl"
                className="w-full sm:w-auto"
              >
                התחל בחינם
              </ButtonLink>
              <ButtonLink
                href="/demo-studio"
                variant="outline"
                size="xl"
                className="w-full border-primary/20 sm:w-auto"
              >
                צפה בהדגמה
              </ButtonLink>
            </div>
          </div>
        </Container>
      </section>

      <section className="py-10">
        <Container>
          <div className="flex items-center justify-between rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-purple-md">
            {STATS.map((stat, index) => (
              <div key={stat.label} className="contents">
                {index > 0 ? (
                  <div className="hidden h-10 w-px bg-outline-variant/30 sm:block" aria-hidden="true" />
                ) : null}
                <div className="flex flex-1 flex-col items-center text-center">
                  <span className="flex items-center gap-1 text-xl font-bold text-primary">
                    {stat.value}
                    {stat.showStar ? (
                      <Star className="size-4 fill-amber-400 text-amber-400" />
                    ) : null}
                  </span>
                  <span className="text-sm text-on-surface-variant">{stat.label}</span>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <section className="hidden py-6 lg:block">
        <Container>
          <Card tone="elegant" className="mx-auto max-w-md">
            <CardHeader>
              <CardTitle>תור חדש · אולפן הדגמה</CardTitle>
              <CardDescription>היום, 14:30 — טיפול ראשוני</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <InfoRow label="לקוח" value="שירה לוי" />
              <InfoRow label="שירות" value="ייעוץ ראשוני · 45 דק׳" />
              <InfoRow
                label="סטטוס"
                value={<Badge variant="success">מאושר</Badge>}
              />
            </CardContent>
          </Card>
        </Container>
      </section>

      <section id="features" className="py-14 sm:py-20">
        <Container>
          <div className="mx-auto max-w-2xl space-y-3 text-center">
            <Badge variant="outline">תכונות ליבה</Badge>
            <h2 className="text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
              תשתית שמוכנה לעסקים אמיתיים
            </h2>
            <p className="text-on-surface-variant">
              לא PoC. כל ההחלטות עוצבו לפרודקשן — אבטחה, בידוד דיירים, נתונים נקיים.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((feature) => (
              <Card key={feature.title}>
                <CardHeader>
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section
        id="flow"
        className="border-t border-outline-variant/30 bg-surface-container-low/50 py-14 sm:py-20"
      >
        <Container>
          <div className="mx-auto max-w-2xl space-y-3 text-center">
            <Badge variant="outline">זרימה ללקוח</Badge>
            <h2 className="text-3xl font-bold tracking-tight text-on-surface sm:text-4xl">
              שלושה שלבים, פחות מדקה
            </h2>
          </div>

          <ol className="mt-10 grid gap-4 md:grid-cols-3">
            {FLOW_STEPS.map((step) => (
              <li key={step.label}>
                <Card>
                  <CardHeader>
                    <div className="flex size-10 items-center justify-center rounded-lg bg-gradient-primary text-base font-bold text-primary-foreground">
                      {step.label}
                    </div>
                    <CardTitle className="mt-3">{step.title}</CardTitle>
                    <CardDescription>{step.description}</CardDescription>
                  </CardHeader>
                </Card>
              </li>
            ))}
          </ol>
        </Container>
      </section>
    </>
  );
}

function InfoRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-on-surface-variant">{label}</span>
      <span className="font-medium text-on-surface">{value}</span>
    </div>
  );
}
