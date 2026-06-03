import Link from "next/link";

import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { signOutToLogin } from "@/server/actions/auth";

type StaffPortalGateProps = {
  businessName: string;
  bookingPath: string;
};

export function StaffPortalGate({ businessName, bookingPath }: StaffPortalGateProps) {
  const loginPath = `/login?next=${encodeURIComponent(bookingPath)}`;

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>מחוברים כצוות {businessName}</CardTitle>
        <CardDescription>
          החשבון הנוכחי מקושר ללוח הבקרה, לא לאזור הלקוחות. כדי להיכנס כלקוח/ה — התנתקו
          והתחברו עם אימייל הלקוח/ה (או הירשמו כאן).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        <form action={signOutToLogin.bind(null, bookingPath)}>
          <Button type="submit" variant="cta" className="w-full sm:w-auto">
            התנתקות והתחברות כלקוח/ה
          </Button>
        </form>
        <div className="flex flex-wrap gap-3">
          <ButtonLink href={loginPath} variant="outline">
            התחברות (בלי התנתקות)
          </ButtonLink>
          <ButtonLink href="/dashboard" variant="outline">
            חזרה ללוח הבקרה
          </ButtonLink>
        </div>
        <p className="text-xs text-on-surface-variant">
          קישור לשיתוף עם לקוחות:{" "}
          <Link href={bookingPath} className="font-medium text-primary hover:underline">
            {bookingPath}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
