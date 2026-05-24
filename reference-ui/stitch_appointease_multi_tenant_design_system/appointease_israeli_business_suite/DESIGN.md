---
name: AppointEase Israeli Business Suite
colors:
  surface: '#fcf8ff'
  surface-dim: '#dbd6f7'
  surface-bright: '#fcf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f1ff'
  surface-container: '#f0ebff'
  surface-container-high: '#eae5ff'
  surface-container-highest: '#e4dfff'
  on-surface: '#1b1931'
  on-surface-variant: '#484555'
  inverse-surface: '#302e47'
  inverse-on-surface: '#f3eeff'
  outline: '#797586'
  outline-variant: '#c9c4d7'
  surface-tint: '#5f41da'
  primary: '#5230cd'
  on-primary: '#ffffff'
  primary-container: '#6b4ee6'
  on-primary-container: '#eee7ff'
  inverse-primary: '#cabeff'
  secondary: '#5f5c6f'
  on-secondary: '#ffffff'
  secondary-container: '#e2ddf3'
  on-secondary-container: '#636073'
  tertiary: '#5342a1'
  on-tertiary: '#ffffff'
  tertiary-container: '#6c5bbb'
  on-tertiary-container: '#eee7ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#e6deff'
  primary-fixed-dim: '#cabeff'
  on-primary-fixed: '#1b0062'
  on-primary-fixed-variant: '#4720c2'
  secondary-fixed: '#e4e0f6'
  secondary-fixed-dim: '#c8c4da'
  on-secondary-fixed: '#1b1a2a'
  on-secondary-fixed-variant: '#474557'
  tertiary-fixed: '#e6deff'
  tertiary-fixed-dim: '#cabeff'
  on-tertiary-fixed: '#1c0062'
  on-tertiary-fixed-variant: '#483695'
  background: '#fcf8ff'
  on-background: '#1b1931'
  surface-variant: '#e4dfff'
typography:
  display-lg:
    fontFamily: Rubik
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: '0'
  headline-lg:
    fontFamily: Rubik
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.3'
    letterSpacing: '0'
  headline-lg-mobile:
    fontFamily: Rubik
    fontSize: 28px
    fontWeight: '700'
    lineHeight: '1.3'
    letterSpacing: '0'
  title-md:
    fontFamily: Rubik
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: '0'
  body-lg:
    fontFamily: Rubik
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Rubik
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  label-sm:
    fontFamily: Rubik
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.02em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 40px
  xl: 64px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 32px
---

## Brand & Style
The design system is engineered for the Israeli B2B landscape, prioritizing high-efficiency scheduling and multi-tenant management. The brand personality is professional and authoritative yet approachable, replacing the coldness often found in enterprise software with a warm, lavender-tinted "Soft Corporate" aesthetic.

The visual language is rooted in **Modern Minimalism** with a focus on RTL (Right-to-Left) ergonomics. It avoids human imagery to remain neutral across diverse business sectors, relying instead on clean geometry, purposeful whitespace, and a sophisticated purple-weighted palette to evoke trust and technological precision.

## Colors
The palette is anchored by a deep royal purple primary, chosen for its professional weight and distinctiveness in the Israeli SaaS market. A secondary "Primary Light" lavender is used extensively for surface backgrounds and subtle UI states to provide warmth without visual noise.

- **Primary (#6B4EE6):** Used for key actions, active states, and brand identifiers.
- **Secondary (#EDE8FF):** Utilized for soft highlights, hover states on light elements, and secondary button backgrounds.
- **Background (#F8F7FF):** A tinted off-white that reduces eye strain compared to pure hex-white, maintaining a premium feel.
- **Neutral (#1A1830):** A high-contrast indigo-black for typography and borders, ensuring legibility and depth.

## Typography
This design system utilizes **Rubik** as its sole typeface. Rubik is specifically chosen for its exceptional Hebrew glyph support, offering a balanced, geometric sans-serif aesthetic that feels native to modern RTL interfaces. 

Hebrew script typically requires slightly more line-height than Latin text to prevent visual crowding of diacritics and complex letterforms; hence, a 1.6x ratio is standard for body text. All alignments are right-aligned by default. Hierarchy is established through aggressive weight hopping—using Bold (700) for headers to provide a clear "anchor" for the eye when scanning from right to left.

## Layout & Spacing
The layout philosophy is built on an **8px linear grid**, ensuring mathematical harmony across all components. 

### Grid Logic
- **Desktop:** A 12-column fluid grid with 24px gutters. Content is right-aligned.
- **Mobile:** A single-column layout with 16px side margins. 
- **Sidebars:** Persistent right-hand navigation (RTL standard) with a fixed width of 280px on desktop.

Spacing should be applied using the "Outside-In" method: larger gaps (lg, xl) for sectional breaks, and smaller units (xs, sm) for internal component padding. In RTL contexts, `padding-right` and `margin-right` take precedence as the starting edge.

## Elevation & Depth
Depth in this design system is achieved through **Purple-Tinted Ambient Shadows**. Unlike standard grey shadows which can look muddy, our shadows use a low-opacity primary tint (#6B4EE6) to maintain the "warm" brand feel.

1.  **Level 0 (Flat):** Used for the main background and decorative elements.
2.  **Level 1 (Subtle):** Low-contrast #1A1830 outlines (1px, 8% opacity) for input fields and static cards.
3.  **Level 2 (Elevated):** Purple-tinted shadows for interactive cards and dropdowns. Shadow formula: `0px 4px 12px rgba(107, 78, 230, 0.08)`.
4.  **Level 3 (Floating):** High-diffusion shadows for modals and popovers. Shadow formula: `0px 12px 32px rgba(107, 78, 230, 0.12)`.

Glassmorphism is used sparingly, only for sticky top navigation bars to maintain a sense of context during scrolling.

## Shapes
The shape language balances professional rigidity with modern softness. 
- **Standard Radius:** 8px (0.5rem) for buttons, input fields, and small components.
- **Large Radius:** 12px (0.75rem) for primary cards and containers.
- **Interactive Elements:** Buttons never use pill-shapes; they maintain the 8px radius to feel more "tool-like" and stable. 

All containers use a 1px border stroke in a light lavender-grey to provide definition on the #F8F7FF background.

## Components
### Buttons
- **Primary:** Solid #6B4EE6 with white text. 8px radius.
- **Secondary:** Solid #EDE8FF with #6B4EE6 text. Used for non-destructive actions.
- **Tertiary:** Ghost style with #6B4EE6 text and no border.

### Input Fields
Inputs must include a right-aligned label. The border is 1px #1A1830 at 12% opacity, changing to #6B4EE6 on focus. Error states use a soft coral-red, but must maintain the 8px radius.

### Cards
Cards are the primary container for scheduling data. They feature a white background, 12px radius, and the Level 2 purple-tinted shadow. Headers within cards should have a subtle bottom border (1px #EDE8FF).

### Scheduling Grid
The calendar/grid component uses #F8F7FF for inactive time slots and #EDE8FF for available slots. Appointments are represented as cards with a vertical 4px "accent bar" on the right edge (the RTL starting edge) to denote category or status.

### Selection Controls
Checkboxes and Radios use the Primary color for active states. Checkmarks appear on the right side of label text.