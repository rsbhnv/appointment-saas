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
  createStaffAction,
  deleteStaffAction,
  updateStaffAction,
} from "@/server/actions/staff";
import type { StaffMember } from "@/server/repositories/staff-members";

const ERROR_COPY: Record<string, string> = {
  invalid_input: "פרטים לא תקינים.",
  forbidden: "אין הרשאה לבצע פעולה זו.",
  not_found: "איש הצוות לא נמצא.",
  in_use: "לא ניתן למחוק — איש הצוות משויך לתורים.",
  unknown: "אירעה שגיאה. נסה שוב.",
};

type StaffManagerProps = {
  staff: StaffMember[];
  canManage: boolean;
};

type FormState = {
  name: string;
  title: string;
  phone: string;
  email: string;
  active: boolean;
};

const emptyForm = (): FormState => ({
  name: "",
  title: "",
  phone: "",
  email: "",
  active: true,
});

export function StaffManager({ staff, canManage }: StaffManagerProps) {
  const [items, setItems] = useState(staff);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm());
    setError(null);
  }

  function startEdit(member: StaffMember) {
    setEditingId(member.id);
    setForm({
      name: member.name,
      title: member.title ?? "",
      phone: member.phone ?? "",
      email: member.email ?? "",
      active: member.active,
    });
    setError(null);
  }

  function submitCreateOrUpdate() {
    setError(null);
    const payload = {
      name: form.name,
      title: form.title || null,
      phone: form.phone || null,
      email: form.email || null,
      active: form.active,
      ...(editingId ? { id: editingId } : {}),
    };

    startTransition(async () => {
      const result = editingId
        ? await updateStaffAction(payload)
        : await createStaffAction(payload);

      if (!result.ok) {
        setError(ERROR_COPY[result.error] ?? ERROR_COPY.unknown);
        return;
      }

      window.location.reload();
    });
  }

  function remove(id: string) {
    if (!window.confirm("למחוק את איש הצוות?")) return;
    setError(null);
    startTransition(async () => {
      const result = await deleteStaffAction({ id });
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
            <CardTitle>{editingId ? "עריכת איש צוות" : "איש צוות חדש"}</CardTitle>
            <CardDescription>
              {editingId ? "עדכון פרטי צוות" : "הוספת חבר צוות לעסק"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pt-6 md:grid-cols-2">
            <Field label="שם" htmlFor="staff-name">
              <Input
                id="staff-name"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </Field>
            <Field label="תפקיד" htmlFor="staff-title">
              <Input
                id="staff-title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </Field>
            <Field label="טלפון" htmlFor="staff-phone">
              <Input
                id="staff-phone"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </Field>
            <Field label="אימייל" htmlFor="staff-email">
              <Input
                id="staff-email"
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
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
              פעיל
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
          <CardTitle>צוות העסק</CardTitle>
          <CardDescription>{items.length} אנשי צוות</CardDescription>
        </CardHeader>
        <CardContent className="divide-y divide-outline-variant/20 p-0">
          {items.length === 0 ? (
            <p className="p-6 text-sm text-on-surface-variant">אין אנשי צוות עדיין.</p>
          ) : (
            items.map((member) => (
              <div
                key={member.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6"
              >
                <div>
                  <p className="font-medium text-on-surface">{member.name}</p>
                  <p className="text-sm text-on-surface-variant">
                    {[member.title, member.phone, member.email]
                      .filter(Boolean)
                      .join(" · ") || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={member.active ? "accent" : "outline"}>
                    {member.active ? "פעיל" : "לא פעיל"}
                  </Badge>
                  {canManage ? (
                    <>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="ghost"
                        aria-label={`עריכת ${member.name}`}
                        onClick={() => startEdit(member)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon-sm"
                        variant="destructive"
                        aria-label={`מחיקת ${member.name}`}
                        disabled={isPending}
                        onClick={() => remove(member.id)}
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
