"use client";

import { useState, useTransition } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  createServiceAction,
  deleteServiceAction,
  updateServiceAction,
} from "@/server/actions/services";
import type { Service } from "@/server/repositories/services";

const ERROR_COPY: Record<string, string> = {
  invalid_input: "פרטים לא תקינים.",
  forbidden: "אין הרשאה לבצע פעולה זו.",
  not_found: "השירות לא נמצא.",
  in_use: "לא ניתן למחוק — השירות משויך לתורים.",
  unknown: "אירעה שגיאה. נסה שוב.",
};

type ServicesManagerProps = {
  services: Service[];
  canManage: boolean;
};

type FormState = {
  name: string;
  description: string;
  duration_minutes: string;
  price: string;
  active: boolean;
};

const emptyForm = (): FormState => ({
  name: "",
  description: "",
  duration_minutes: "30",
  price: "0",
  active: true,
});

export function ServicesManager({ services, canManage }: ServicesManagerProps) {
  const [items, setItems] = useState(services);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm());
    setError(null);
  }

  function startEdit(service: Service) {
    setEditingId(service.id);
    setForm({
      name: service.name,
      description: service.description ?? "",
      duration_minutes: String(service.duration_minutes),
      price: String(service.price),
      active: service.active,
    });
    setError(null);
  }

  function submitCreateOrUpdate() {
    setError(null);
    const payload = {
      name: form.name,
      description: form.description || null,
      duration_minutes: Number(form.duration_minutes),
      price: Number(form.price),
      active: form.active,
      ...(editingId ? { id: editingId } : {}),
    };

    startTransition(async () => {
      const result = editingId
        ? await updateServiceAction(payload)
        : await createServiceAction(payload);

      if (!result.ok) {
        setError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
        return;
      }

      window.location.reload();
    });
  }

  function remove(id: string) {
    if (!window.confirm("למחוק את השירות?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteServiceAction({ id });
      if (!result.ok) {
        setError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
        return;
      }
      setItems((prev) => prev.filter((item) => item.id !== id));
    });
  }

  return (
    <div className="space-y-6">
      {canManage ? (
        <Card>
          <CardHeader className="border-b">
            <CardTitle>{editingId ? "עריכת שירות" : "שירות חדש"}</CardTitle>
            <CardDescription>
              {editingId ? "עדכון פרטי שירות קיים" : "הוספת שירות לקטלוג העסק"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
            <Field label="שם" htmlFor="service-name">
              <Input
                id="service-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </Field>
            <Field label="משך (דקות)" htmlFor="service-duration">
              <Input
                id="service-duration"
                type="number"
                min={5}
                max={480}
                value={form.duration_minutes}
                onChange={(e) =>
                  setForm((f) => ({ ...f, duration_minutes: e.target.value }))
                }
                required
              />
            </Field>
            <Field label="מחיר (₪)" htmlFor="service-price">
              <Input
                id="service-price"
                type="number"
                min={0}
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                required
              />
            </Field>
            <Field label="תיאור" htmlFor="service-description" className="md:col-span-2">
              <Input
                id="service-description"
                value={form.description}
                onChange={(e) =>
                  setForm((f) => ({ ...f, description: e.target.value }))
                }
              />
            </Field>
            <label className="flex items-center gap-2 text-sm text-on-surface-variant md:col-span-2">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) =>
                  setForm((f) => ({ ...f, active: e.target.checked }))
                }
              />
              שירות פעיל
            </label>
            {error ? (
              <p className="text-sm text-destructive md:col-span-2" role="alert">
                {error}
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2 md:col-span-2">
              <Button type="button" disabled={isPending} onClick={submitCreateOrUpdate}>
                <Plus className="size-4" aria-hidden />
                {editingId ? "שמירה" : "הוספה"}
              </Button>
              {editingId ? (
                <Button type="button" variant="outline" disabled={isPending} onClick={resetForm}>
                  ביטול
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="border-b">
          <CardTitle>רשימת שירותים</CardTitle>
          <CardDescription>{items.length} שירותים רשומים</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-outline-variant/20 p-0">
          {items.length === 0 ? (
            <p className="p-6 text-sm text-on-surface-variant">אין שירותים עדיין.</p>
          ) : (
            items.map((service) => (
              <div
                key={service.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6"
              >
                <div>
                  <p className="font-medium text-on-surface">{service.name}</p>
                  <p className="text-sm text-on-surface-variant">
                    {service.duration_minutes} דק׳ · ₪{service.price}
                    {service.description ? ` · ${service.description}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={service.active ? "accent" : "outline"}>
                    {service.active ? "פעיל" : "לא פעיל"}
                  </Badge>
                  {canManage ? (
                    <>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`עריכת ${service.name}`}
                        onClick={() => startEdit(service)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="destructive"
                        aria-label={`מחיקת ${service.name}`}
                        disabled={isPending}
                        onClick={() => remove(service.id)}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
