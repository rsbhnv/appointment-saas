import type { BusinessThemeStyle } from "@/lib/theme/types";

export type ThemePreset = {
  id: BusinessThemeStyle;
  labelHe: string;
  primary: string;
  secondary: string;
};

export const THEME_PRESETS: Record<BusinessThemeStyle, ThemePreset> = {
  wellness: {
    id: "wellness",
    labelHe: "Wellness",
    primary: "#4CAF50",
    secondary: "#F4E04D",
  },
  beauty: {
    id: "beauty",
    labelHe: "Beauty",
    primary: "#E91E63",
    secondary: "#D4AF37",
  },
  barber: {
    id: "barber",
    labelHe: "Barber",
    primary: "#1E3A8A",
    secondary: "#6B7280",
  },
  medical: {
    id: "medical",
    labelHe: "Medical",
    primary: "#0D9488",
    secondary: "#64748B",
  },
  fitness: {
    id: "fitness",
    labelHe: "Fitness",
    primary: "#EA580C",
    secondary: "#1F2937",
  },
  professional: {
    id: "professional",
    labelHe: "Professional",
    primary: "#334155",
    secondary: "#6366F1",
  },
};

export const THEME_PRESET_LIST = Object.values(THEME_PRESETS);

export function isBusinessThemeStyle(value: string): value is BusinessThemeStyle {
  return value in THEME_PRESETS;
}
