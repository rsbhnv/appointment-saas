export const BUSINESS_THEME_STYLES = [
  "wellness",
  "beauty",
  "barber",
  "medical",
  "fitness",
  "professional",
] as const;

export type BusinessThemeStyle = (typeof BUSINESS_THEME_STYLES)[number];

export type BusinessThemeInput = {
  theme_style?: string | null;
  primary_color?: string | null;
  secondary_color?: string | null;
};

export type ResolvedBusinessTheme = {
  style: BusinessThemeStyle | "custom" | null;
  primary: string;
  secondary: string;
  cssVars: Record<string, string>;
};
