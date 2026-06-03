const HEX6 = /^#([0-9A-Fa-f]{6})$/;

export function normalizeHex(value: string | null | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  const match = HEX6.exec(trimmed);
  return match ? `#${match[1]!.toLowerCase()}` : null;
}

function hexToRgb(hex: string): [number, number, number] {
  const normalized = normalizeHex(hex);
  if (!normalized) return [0, 0, 0];
  const raw = normalized.slice(1);
  return [
    Number.parseInt(raw.slice(0, 2), 16),
    Number.parseInt(raw.slice(2, 4), 16),
    Number.parseInt(raw.slice(4, 6), 16),
  ];
}

function channelLinear(value: number): number {
  const s = value / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}

export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(channelLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(foreground: string, background: string): number {
  const l1 = relativeLuminance(foreground);
  const l2 = relativeLuminance(background);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const LIGHT_FOREGROUND = "#1b1931";
const DARK_FOREGROUND = "#ffffff";

/** Picks #ffffff or #1b1931 for readable text on a solid background. */
export function pickAccessibleForeground(background: string): string {
  const whiteContrast = contrastRatio(DARK_FOREGROUND, background);
  const darkContrast = contrastRatio(LIGHT_FOREGROUND, background);
  if (whiteContrast >= darkContrast && whiteContrast >= 4.5) {
    return DARK_FOREGROUND;
  }
  if (darkContrast >= 4.5) {
    return LIGHT_FOREGROUND;
  }
  return whiteContrast >= darkContrast ? DARK_FOREGROUND : LIGHT_FOREGROUND;
}

export function mixHex(base: string, target: string, targetWeight: number): string {
  const [r1, g1, b1] = hexToRgb(base);
  const [r2, g2, b2] = hexToRgb(target);
  const w = Math.min(1, Math.max(0, targetWeight));
  const mix = (a: number, b: number) => Math.round(a * (1 - w) + b * w);
  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  return `#${toHex(mix(r1, r2))}${toHex(mix(g1, g2))}${toHex(mix(b1, b2))}`;
}

export function hexToRgbString(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `${r}, ${g}, ${b}`;
}
