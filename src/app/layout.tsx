import type { Metadata, Viewport } from "next";
import { Geist_Mono, Rubik } from "next/font/google";
import Script from "next/script";

import { AppProviders } from "@/components/providers/app-providers";
import { ServiceWorkerRegister } from "@/components/pwa/service-worker-register";
import { defaultLocale, getDirection } from "@/config/i18n";
import { siteConfig } from "@/config/site";

import "./globals.css";

const rubik = Rubik({
  variable: "--font-sans",
  subsets: ["hebrew", "latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const direction = getDirection(defaultLocale);

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: siteConfig.name,
    template: `%s | ${siteConfig.name}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.name,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: siteConfig.name,
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fcf8ff" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0e1a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang={defaultLocale}
      dir={direction}
      suppressHydrationWarning
      className={`${rubik.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col font-sans">
        <Script
          id="system-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement,m=window.matchMedia("(prefers-color-scheme: dark)");d.classList.add(m.matches?"dark":"light")}catch(e){}})();`,
          }}
        />
        <AppProviders>
          {children}
          <ServiceWorkerRegister />
        </AppProviders>
      </body>
    </html>
  );
}
