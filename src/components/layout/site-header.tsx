"use client";

import Link from "next/link";
import { useState } from "react";

import { LogoMark } from "@/components/layout/logo-mark";
import { Button, ButtonLink } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import {
  Sheet,
  SheetBody,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/utils";

export type SiteNavLink = {
  href: string;
  label: string;
};

type SiteHeaderProps = {
  navItems?: SiteNavLink[];
  secondaryAction?: { href: string; label: string };
};

export function SiteHeader({ navItems = [], secondaryAction }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const showMobileMenu = navItems.length > 0 || secondaryAction !== undefined;

  return (
    <header className="glass-header sticky top-0 z-40 w-full border-b border-outline-variant/30 bg-surface/85">
      <Container>
        <div className="flex h-14 items-center gap-3 sm:h-16">
          <Link
            href="/"
            className="flex items-center gap-2 text-base font-bold tracking-tight text-primary"
            aria-label={siteConfig.name}
          >
            <LogoMark className="size-8" />
            <span className="hidden sm:inline">{siteConfig.name}</span>
          </Link>

          <nav
            className="ms-auto hidden items-center gap-1 md:flex"
            aria-label="ניווט ראשי"
          >
            {navItems.map((item) => (
              <ButtonLink
                key={item.href}
                href={item.href}
                variant="ghost"
                size="sm"
              >
                {item.label}
              </ButtonLink>
            ))}
            {secondaryAction ? (
              <ButtonLink
                href={secondaryAction.href}
                variant="cta"
                size="sm"
              >
                {secondaryAction.label}
              </ButtonLink>
            ) : null}
          </nav>

          {showMobileMenu ? (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ms-auto md:hidden"
                    aria-label="פתיחת תפריט"
                  >
                    <MenuIcon />
                  </Button>
                }
              />
              <SheetContent side="end" className="sm:max-w-xs">
                <SheetHeader>
                  <SheetTitle>{siteConfig.name}</SheetTitle>
                </SheetHeader>
                <SheetBody>
                  <nav className="flex flex-col gap-1" aria-label="ניווט נייד">
                    {navItems.map((item) => (
                      <SheetClose
                        key={item.href}
                        render={
                          <Link
                            href={item.href}
                            className={cn(
                              "flex min-h-11 items-center rounded-lg px-3 py-3 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high",
                            )}
                          >
                            {item.label}
                          </Link>
                        }
                      />
                    ))}
                    {secondaryAction ? (
                      <SheetClose
                        render={
                          <Link
                            href={secondaryAction.href}
                            className="mt-3 rounded-lg bg-primary px-3 py-2 text-center text-sm font-semibold text-primary-foreground"
                          >
                            {secondaryAction.label}
                          </Link>
                        }
                      />
                    ) : null}
                  </nav>
                </SheetBody>
              </SheetContent>
            </Sheet>
          ) : null}
        </div>
      </Container>
    </header>
  );
}

function MenuIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="size-5"
      aria-hidden="true"
    >
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}
