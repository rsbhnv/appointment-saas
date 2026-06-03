import { Agent, fetch as undiciFetch, type RequestInit as UndiciRequestInit } from "undici";

/**
 * Optional dev-only fetch for corporate proxies that inject self-signed TLS certs.
 * Enable with SUPABASE_INSECURE_TLS=true in .env.local — never in production.
 *
 * Uses a dedicated undici Agent (not NODE_TLS_REJECT_UNAUTHORIZED) so Node does
 * not emit global TLS warnings and other HTTPS traffic stays verified.
 */
let devInsecureAgent: Agent | undefined;

function getDevInsecureAgent(): Agent {
  devInsecureAgent ??= new Agent({
    connect: { rejectUnauthorized: false },
  });
  return devInsecureAgent;
}

export function getSupabaseFetch(): typeof fetch | undefined {
  if (
    process.env.NODE_ENV !== "development" ||
    process.env.SUPABASE_INSECURE_TLS !== "true"
  ) {
    return undefined;
  }

  const agent = getDevInsecureAgent();
  const insecureFetch: typeof fetch = async (input, init) => {
    const response = await undiciFetch(input as string | URL, {
      ...init,
      dispatcher: agent,
    } as UndiciRequestInit);
    return response as unknown as Response;
  };

  return insecureFetch;
}
