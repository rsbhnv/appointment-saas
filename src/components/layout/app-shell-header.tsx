import Link from "next/link";

import { DemoModeBadge } from "@/components/layout/demo-mode-badge";
import { LogoMark } from "@/components/layout/logo-mark";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { signOut } from "@/server/actions/auth";

type AppShellHeaderProps = {
  title: string;
  email: string | null;
  children?: React.ReactNode;
};

export function AppShellHeader({ title, email, children }: AppShellHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur">
      <Container>
        <div className="flex h-14 items-center gap-3 sm:h-16 sm:gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-semibold tracking-tight"
          >
            <LogoMark className="size-7" />
            <span className="hidden sm:inline">{title}</span>
          </Link>
          <DemoModeBadge />
          {children ? <div className="ms-4 hidden md:block">{children}</div> : null}
          <div className="ms-auto flex items-center gap-2">
            {email ? (
              <span className="hidden text-xs text-muted-foreground sm:inline">
                {email}
              </span>
            ) : null}
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="sm">
                התנתקות
              </Button>
            </form>
          </div>
        </div>
        {children ? (
          <div className="border-t border-border/40 py-2 md:hidden">{children}</div>
        ) : null}
      </Container>
    </header>
  );
}
