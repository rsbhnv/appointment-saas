import type { NextConfig } from "next";

import { securityHeaders } from "@/lib/security/headers";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    serverActions: {
      // Logo uploads allow up to 2 MB (see BUSINESS_LOGO_MAX_BYTES).
      bodySizeLimit: "3mb",
    },
    // Windows: native dist lockfile can fail with ENOENT (Next.js 16 default).
    lockDistDir: false,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
