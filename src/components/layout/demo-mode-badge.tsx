import { isDemoMode } from "@/lib/env/client";

/**
 * Visible badge that announces demo mode in protected shells.
 * Renders nothing when demo mode is off.
 */
export function DemoModeBadge({ className }: { className?: string }) {
  if (!isDemoMode) return null;
  return (
    <span
      role="status"
      aria-label="מצב הדגמה פעיל"
      className={
        "inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-100/70 px-2.5 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-500/15 dark:text-amber-200 " +
        (className ?? "")
      }
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-amber-500" />
      מצב הדגמה
    </span>
  );
}
