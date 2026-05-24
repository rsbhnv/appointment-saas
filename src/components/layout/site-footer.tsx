import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-outline-variant/30 bg-surface-container-low/50">
      <Container>
        <div className="flex flex-col items-center justify-between gap-2 py-6 sm:flex-row">
          <p className="text-xs text-outline">
            © {year} {siteConfig.name}
          </p>
          <p className="text-xs text-outline">
            פלטפורמת SaaS לניהול תורים — תשתית רב-דיירים מאובטחת.
          </p>
        </div>
      </Container>
    </footer>
  );
}
