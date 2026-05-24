/**
 * Environment variable entry points.
 *
 * - `clientEnv` — safe for Client Components (NEXT_PUBLIC_* only)
 * - `serverEnv` — server-only; never import in client bundles
 */
export { clientEnv, isDemoMode, isSupabaseConfigured } from "./client";
