/**
 * Data access and secret handling rules.
 */
export const dataAccessRules = {
  /** Anon key + RLS for user-facing reads/writes; service role for system jobs only. */
  useAnonKeyWithRls: true,

  /** Service role key only in server-only modules (see lib/supabase/admin.ts). */
  serviceRoleServerOnly: true,

  /** Validate and sanitize all external input at server boundaries. */
  validateAtBoundary: true,

  /** No raw SQL from client; use parameterized queries / Supabase client. */
  noClientSideSql: true,
} as const;
