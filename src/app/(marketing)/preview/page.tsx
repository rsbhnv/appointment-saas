import Link from "next/link";

import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

const SCREEN_LINKS = [
  {
    title: "ציבורי",
    links: [
      { href: "/", label: "דף הבית" },
      { href: "/login", label: "התחברות" },
      { href: "/#features", label: "תכונות" },
      { href: "/#flow", label: "איך זה עובד" },
    ],
  },
  {
    title: "לוח בקרה (דורש התחברות)",
    links: [
      { href: "/dashboard", label: "סקירה" },
      { href: "/dashboard/calendar", label: "יומן" },
      { href: "/preview/calendar", label: "יומן — תצוגות עיצוב" },
      { href: "/dashboard/availability", label: "זמינות" },
      { href: "/dashboard/customers", label: "לקוחות" },
      { href: "/dashboard/services", label: "שירותים" },
      { href: "/dashboard/staff", label: "צוות" },
      { href: "/dashboard/settings", label: "הגדרות" },
    ],
  },
  {
    title: "Super Admin",
    links: [
      { href: "/super-admin", label: "סקירה" },
      { href: "/super-admin/businesses", label: "עסקים" },
      { href: "/super-admin/users", label: "משתמשים" },
    ],
  },
  {
    title: "עתידי / עסק",
    links: [
      { href: "/demo-studio", label: "דף עסק (demo-studio)" },
      { href: "/demo-studio/book", label: "הזמנת תור" },
      { href: "/demo-studio/my-appointments", label: "התורים שלי" },
    ],
  },
];

export default function PreviewPage() {
  return (
    <Container className="py-12">
      <div className="mx-auto max-w-3xl space-y-8">
        <div className="space-y-2 text-start">
          <h1 className="text-3xl font-bold text-on-surface">כל המסכים</h1>
          <p className="text-on-surface-variant">
            מפת ניווט ל-{siteConfig.name}. קישורים שעדיין לא מומשו יציגו 404.
            תצוגות עיצוב ליומן:{" "}
            <Link href="/preview/calendar" className="text-primary hover:underline">
              /preview/calendar
            </Link>
            .
          </p>
        </div>

        {SCREEN_LINKS.map((section) => (
          <section key={section.title} className="space-y-3">
            <h2 className="text-lg font-semibold text-primary">{section.title}</h2>
            <ul className="grid gap-2 sm:grid-cols-2">
              {section.links.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block rounded-lg border border-outline-variant/30 bg-surface-container-lowest px-4 py-3 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-low hover:text-primary"
                  >
                    {link.label}
                    <span className="mt-1 block text-xs font-normal text-outline">
                      {link.href}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Container>
  );
}
