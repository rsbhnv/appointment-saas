import { redirect } from "next/navigation";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { isDemoMode, isSupabaseConfigured } from "@/lib/env/client";
import { tryGetSession } from "@/server/guards";

import { ForgotPasswordForm } from "./forgot-password-form";

export const dynamic = "force-dynamic";

export default async function ForgotPasswordPage() {
  if (isDemoMode) {
    redirect("/login");
  }

  const user = await tryGetSession();
  if (user) {
    redirect("/dashboard");
  }

  return (
    <Card tone="elegant" className="w-full max-w-[440px] border-0 shadow-purple-md">
      <CardHeader className="space-y-1 border-b border-outline-variant/20 pb-6 text-center">
        <CardTitle className="text-xl">שכחתי סיסמה</CardTitle>
        <CardDescription>
          הזן/י את כתובת האימייל ונשלח קישור להגדרת סיסמה חדשה.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <ForgotPasswordForm supabaseConfigured={isSupabaseConfigured} />
      </CardContent>
    </Card>
  );
}
