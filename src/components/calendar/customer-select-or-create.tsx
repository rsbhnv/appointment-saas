"use client";

import { useEffect, useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createCustomerAction, searchCustomersAction } from "@/server/actions/customers";
import type { Tables } from "@/types/database";

type CustomerSelectOrCreateProps = {
  selectedCustomerId: string;
  onSelect: (customerId: string) => void;
};

const ERROR_COPY: Record<string, string> = {
  invalid_input: "פרטי לקוח לא תקינים.",
  unknown: "לא הצלחנו לשמור את הלקוח.",
};

export function CustomerSelectOrCreate({
  selectedCustomerId,
  onSelect,
}: CustomerSelectOrCreateProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Tables<"customers">[]>([]);
  const [mode, setMode] = useState<"search" | "create">("search");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [smsConsent, setSmsConsent] = useState(false);
  const [whatsappConsent, setWhatsappConsent] = useState(false);
  const [emailConsent, setEmailConsent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    const timer = setTimeout(() => {
      startTransition(async () => {
        const result = await searchCustomersAction({ query });
        if (result.ok) setResults(result.customers);
      });
    }, 250);
    return () => clearTimeout(timer);
  }, [query]);

  function createCustomer() {
    setError(null);
    startTransition(async () => {
      const result = await createCustomerAction({
        full_name: fullName,
        phone: phone || null,
        email: email || null,
        sms_consent: smsConsent,
        whatsapp_consent: whatsappConsent,
        email_consent: emailConsent,
      });
      if (!result.ok) {
        setError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
        return;
      }
      if (result.customer) {
        onSelect(result.customer.id);
        setResults((prev) => [result.customer!, ...prev]);
        setMode("search");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button
          type="button"
          variant={mode === "search" ? "cta" : "outline"}
          size="sm"
          onClick={() => setMode("search")}
        >
          חיפוש לקוח
        </Button>
        <Button
          type="button"
          variant={mode === "create" ? "cta" : "outline"}
          size="sm"
          onClick={() => setMode("create")}
        >
          לקוח חדש
        </Button>
      </div>

      {mode === "search" ? (
        <div className="space-y-3">
          <Field label="חיפוש לפי שם, טלפון או אימייל">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="הקלד/י לחיפוש..."
            />
          </Field>
          <ul className="max-h-48 space-y-2 overflow-y-auto">
            {results.map((customer) => (
              <li key={customer.id}>
                <button
                  type="button"
                  onClick={() => onSelect(customer.id)}
                  className={`w-full rounded-lg border px-3 py-2 text-start text-sm transition-colors ${
                    selectedCustomerId === customer.id
                      ? "border-primary bg-primary/10"
                      : "border-outline-variant/30 hover:bg-surface-container-low"
                  }`}
                >
                  <span className="font-medium">{customer.full_name}</span>
                  <span className="mt-0.5 block text-xs text-on-surface-variant">
                    {[customer.phone, customer.email].filter(Boolean).join(" · ") ||
                      "ללא פרטי קשר"}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="space-y-3">
          <Field label="שם מלא">
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </Field>
          <Field label="טלפון">
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
          </Field>
          <Field label="אימייל">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
            />
          </Field>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={smsConsent}
              onChange={(e) => setSmsConsent(e.target.checked)}
            />
            הסכמה ל-SMS
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={whatsappConsent}
              onChange={(e) => setWhatsappConsent(e.target.checked)}
            />
            הסכמה ל-WhatsApp
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={emailConsent}
              onChange={(e) => setEmailConsent(e.target.checked)}
            />
            הסכמה לאימייל
          </label>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="button" variant="cta" disabled={isPending} onClick={createCustomer}>
            {isPending ? "שומר..." : "יצירת לקוח"}
          </Button>
        </div>
      )}
    </div>
  );
}
