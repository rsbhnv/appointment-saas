export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

export function actionError(error: string): ActionResult {
  return { ok: false, error };
}

export function guardErrorCode(err: unknown): string {
  if (err instanceof Error && "code" in err) {
    return String((err as { code: string }).code);
  }
  return "unknown";
}
