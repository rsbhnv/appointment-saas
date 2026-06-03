import {
  hexToRgbString,
  mixHex,
  normalizeHex,
  pickAccessibleForeground,
} from "@/lib/theme/color-utils";
import { isBusinessThemeStyle, THEME_PRESETS } from "@/lib/theme/presets";
import type {
  BusinessThemeInput,
  BusinessThemeStyle,
  ResolvedBusinessTheme,
} from "@/lib/theme/types";

function buildCssVars(primary: string, secondary: string): Record<string, string> {
  const primaryForeground = pickAccessibleForeground(primary);
  const secondaryForeground = pickAccessibleForeground(secondary);
  const primaryContainer = mixHex(primary, "#ffffff", 0.22);
  const onPrimaryContainer =
    contrastSafeOnTint(primaryContainer, primary) ?? pickAccessibleForeground(primaryContainer);
  const primaryGlow = mixHex(primary, "#ffffff", 0.12);
  const secondaryContainer = mixHex(secondary, "#ffffff", 0.78);
  const secondaryFixed = mixHex(secondary, "#ffffff", 0.88);
  const accent = mixHex(secondary, "#ffffff", 0.85);
  const accentForeground =
    pickAccessibleForeground(accent) === LIGHT_FG ? primary : DARK_FOREGROUND;
  const surfaceContainer = mixHex(primary, "#ffffff", 0.92);
  const surfaceContainerLow = mixHex(primary, "#ffffff", 0.95);
  const surfaceContainerHigh = mixHex(primary, "#ffffff", 0.88);
  const muted = mixHex(primary, "#ffffff", 0.94);
  const primaryRgb = hexToRgbString(primary);

  return {
    "--primary": primary,
    "--primary-foreground": primaryForeground,
    "--primary-container": primaryContainer,
    "--on-primary-container": onPrimaryContainer,
    "--primary-glow": primaryGlow,
    "--secondary": secondary,
    "--secondary-foreground": secondaryForeground,
    "--secondary-container": secondaryContainer,
    "--secondary-fixed": secondaryFixed,
    "--muted": muted,
    "--accent": accent,
    "--accent-foreground": accentForeground,
    "--ring": primaryGlow,
    "--surface-container": surfaceContainer,
    "--surface-container-low": surfaceContainerLow,
    "--surface-container-high": surfaceContainerHigh,
    "--chart-1": primary,
    "--chart-2": primaryGlow,
    "--chart-3": secondary,
    "--gradient-primary": `linear-gradient(135deg, ${primary}, ${primaryGlow})`,
    "--card-shadow": `0 4px 12px rgba(${primaryRgb}, 0.08)`,
    "--elegant-shadow": `0 12px 32px rgba(${primaryRgb}, 0.12)`,
    "--purple-shadow-sm": `0 4px 12px rgba(${primaryRgb}, 0.08)`,
    "--purple-shadow-md": `0 12px 32px rgba(${primaryRgb}, 0.12)`,
    "--sidebar-primary": primary,
    "--sidebar-primary-foreground": primaryForeground,
    "--sidebar-accent": surfaceContainer,
    "--sidebar-accent-foreground": primary,
    "--sidebar-ring": primaryGlow,
    "--input-focus-ring": `rgba(${primaryRgb}, 0.12)`,
    "--tenant-tint": `rgba(${primaryRgb}, 0.05)`,
  };
}

const LIGHT_FG = "#1b1931";
const DARK_FOREGROUND = "#ffffff";

function contrastSafeOnTint(tint: string, accent: string): string | null {
  const dark = pickAccessibleForeground(tint);
  if (dark === LIGHT_FG) return accent;
  return dark;
}

/**
 * Resolves tenant theme tokens from business branding fields.
 * Returns null when no custom theme is configured (use default SaaS :root tokens).
 */
export function resolveBusinessTheme(
  business: BusinessThemeInput | null | undefined,
): ResolvedBusinessTheme | null {
  if (!business) return null;

  const style = business.theme_style && isBusinessThemeStyle(business.theme_style)
    ? business.theme_style
    : null;
  const preset = style ? THEME_PRESETS[style] : null;

  const primary =
    normalizeHex(business.primary_color) ?? preset?.primary ?? null;
  const secondary =
    normalizeHex(business.secondary_color) ?? preset?.secondary ?? null;

  if (!primary && !secondary && !style) {
    return null;
  }

  const resolvedPrimary = primary ?? preset?.primary ?? THEME_PRESETS.professional.primary;
  const resolvedSecondary =
    secondary ?? preset?.secondary ?? THEME_PRESETS.professional.secondary;

  const resolvedStyle: BusinessThemeStyle | "custom" | null =
    style ?? (primary || secondary ? "custom" : null);

  return {
    style: resolvedStyle,
    primary: resolvedPrimary,
    secondary: resolvedSecondary,
    cssVars: buildCssVars(resolvedPrimary, resolvedSecondary),
  };
}
