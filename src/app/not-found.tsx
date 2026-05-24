import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-margin-mobile py-24 text-center">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="text-2xl font-bold text-on-surface">הדף לא נמצא</h1>
      <p className="max-w-sm text-on-surface-variant">
        העמוד שחיפשת אינו קיים או הוסר.
      </p>
      <Button variant="cta" render={<Link href="/" />}>
        חזרה לדף הבית
      </Button>
    </div>
  );
}
