"use client";

import { useRef, useState, useTransition } from "react";

import { BusinessLogo } from "@/components/business/business-logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { BUSINESS_LOGO_MAX_BYTES, BUSINESS_LOGO_MIME_TYPES } from "@/lib/business/logo";
import {
  removeBusinessLogoAction,
  uploadBusinessLogoAction,
} from "@/server/actions/business-logo";
import type { Business } from "@/server/repositories/businesses";

const ERROR_COPY: Record<string, string> = {
  invalid_input: "קובץ לא תקין. השתמשו ב-PNG, JPG או WEBP.",
  file_too_large: "הקובץ גדול מדי. מקסימום 2MB.",
  upload_failed: "העלאה נכשלה. נסו שוב.",
  forbidden: "רק בעל העסק יכול לעדכן לוגו.",
  unknown: "אירעה שגיאה. נסה שוב.",
};

const ACCEPT = BUSINESS_LOGO_MIME_TYPES.join(",");

type BusinessLogoFormProps = {
  business: Business;
  canEdit: boolean;
};

export function BusinessLogoForm({ business, canEdit }: BusinessLogoFormProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [logoUrl, setLogoUrl] = useState(business.logo_url);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploadPending, startUploadTransition] = useTransition();
  const [isRemovePending, startRemoveTransition] = useTransition();

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setError(null);
    setMessage(null);

    if (!(BUSINESS_LOGO_MIME_TYPES as readonly string[]).includes(file.type)) {
      setError(ERROR_COPY.invalid_input);
      return;
    }
    if (file.size > BUSINESS_LOGO_MAX_BYTES) {
      setError(ERROR_COPY.file_too_large);
      return;
    }

    const formData = new FormData();
    formData.set("logo", file);

    startUploadTransition(async () => {
      const result = await uploadBusinessLogoAction(formData);
      if (!result.ok) {
        setError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
        return;
      }
      setLogoUrl(result.logoUrl ?? logoUrl);
      setMessage("הלוגו נשמר.");
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  function onRemove() {
    setError(null);
    setMessage(null);
    startRemoveTransition(async () => {
      const result = await removeBusinessLogoAction();
      if (!result.ok) {
        setError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
        return;
      }
      setLogoUrl(null);
      setMessage("הלוגו הוסר.");
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <CardTitle>לוגו העסק</CardTitle>
        <CardDescription>
          מוצג בדף ההזמנה, בתורים שלי ובלוח הבקרה. PNG, JPG או WEBP — עד 2MB.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <BusinessLogo name={business.name} logoUrl={logoUrl} size="lg" />
          <div className="flex-1 space-y-3 text-center sm:text-start">
            <p className="text-sm text-on-surface-variant">
              {logoUrl
                ? "לוגו מותאם אישית"
                : "לא הועלה לוגו — מוצגת אות ראשונה של שם העסק"}
            </p>
            {canEdit ? (
              <Field label="העלאת לוגו" htmlFor="business-logo-upload">
                <input
                  ref={inputRef}
                  id="business-logo-upload"
                  type="file"
                  accept={ACCEPT}
                  disabled={isUploadPending || isRemovePending}
                  onChange={onFileChange}
                  className="block w-full text-sm text-on-surface-variant file:me-4 file:rounded-lg file:border-0 file:bg-primary file:px-4 file:py-2 file:text-sm file:font-semibold file:text-primary-foreground hover:file:opacity-90"
                />
              </Field>
            ) : null}
          </div>
        </div>

        {error ? (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
        {message ? (
          <p className="text-sm text-primary" role="status">
            {message}
          </p>
        ) : null}

        {canEdit && logoUrl ? (
          <Button
            type="button"
            variant="outline"
            disabled={isRemovePending || isUploadPending}
            onClick={onRemove}
          >
            {isRemovePending ? "מסיר..." : "הסרת לוגו"}
          </Button>
        ) : null}

        {!canEdit ? (
          <p className="text-sm text-on-surface-variant">רק בעל העסק יכול לערוך לוגו.</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
