/**
 * Authentication security rules (policy definitions — enforce in server code).
 */
export const authenticationRules = {
  /** All auth/session mutations run server-side only. */
  serverSideOnly: true,

  /** Never expose service role or auth secrets to the client. */
  noSecretsOnClient: true,

  /** Session cookies must be HttpOnly, Secure (prod), SameSite=Lax minimum. */
  cookieRequirements: {
    httpOnly: true,
    secureInProduction: true,
    sameSite: "lax" as const,
  },

  /** Refresh tokens via middleware, not client-side service role. */
  refreshViaMiddleware: true,
} as const;
