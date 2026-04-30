---
version: alpha
name: SPICY · Google Material 3
description: A Google-flavored Material You / Material 3 design system tuned for the SPICY meet-up dashboard. Soft tonal surfaces, vibrant Google Blue primary, pill buttons, generous radii, and a friendly Google Sans Display + Roboto Flex typography stack.
colors:
  primary: "#0b57d0"
  on-primary: "#ffffff"
  primary-container: "#d3e3fd"
  on-primary-container: "#001b3f"
  inverse-primary: "#a8c7fa"
  secondary: "#565f71"
  on-secondary: "#ffffff"
  secondary-container: "#dae2f9"
  on-secondary-container: "#131c2b"
  tertiary: "#715573"
  on-tertiary: "#ffffff"
  tertiary-container: "#fbd7fc"
  on-tertiary-container: "#28132c"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#410002"
  surface: "#fdfbff"
  surface-dim: "#dad9e0"
  surface-bright: "#fdfbff"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f7f5fc"
  surface-container: "#f1eff7"
  surface-container-high: "#ebe9f1"
  surface-container-highest: "#e6e4ec"
  on-surface: "#1a1b21"
  on-surface-variant: "#44464f"
  outline: "#74777f"
  outline-variant: "#c4c6d0"
  inverse-surface: "#2f3036"
  inverse-on-surface: "#f1eff7"
  scrim: "#000000"
typography:
  display-large:
    fontFamily: "'Google Sans Display', 'Google Sans', 'Roboto Flex', 'Roboto', system-ui, sans-serif"
    fontSize: 57px
    fontWeight: "400"
    lineHeight: 64px
    letterSpacing: -0.25px
  display-medium:
    fontFamily: "'Google Sans Display', 'Google Sans', 'Roboto Flex', 'Roboto', system-ui, sans-serif"
    fontSize: 45px
    fontWeight: "400"
    lineHeight: 52px
    letterSpacing: 0px
  display-small:
    fontFamily: "'Google Sans Display', 'Google Sans', 'Roboto Flex', 'Roboto', system-ui, sans-serif"
    fontSize: 36px
    fontWeight: "400"
    lineHeight: 44px
    letterSpacing: 0px
  headline-large:
    fontFamily: "'Google Sans Display', 'Google Sans', 'Roboto Flex', 'Roboto', system-ui, sans-serif"
    fontSize: 32px
    fontWeight: "500"
    lineHeight: 40px
    letterSpacing: 0px
  headline-medium:
    fontFamily: "'Google Sans Display', 'Google Sans', 'Roboto Flex', 'Roboto', system-ui, sans-serif"
    fontSize: 28px
    fontWeight: "500"
    lineHeight: 36px
    letterSpacing: 0px
  headline-small:
    fontFamily: "'Google Sans Display', 'Google Sans', 'Roboto Flex', 'Roboto', system-ui, sans-serif"
    fontSize: 24px
    fontWeight: "500"
    lineHeight: 32px
    letterSpacing: 0px
  title-large:
    fontFamily: "'Google Sans', 'Roboto Flex', 'Roboto', system-ui, sans-serif"
    fontSize: 22px
    fontWeight: "500"
    lineHeight: 28px
    letterSpacing: 0px
  title-medium:
    fontFamily: "'Google Sans', 'Roboto Flex', 'Roboto', system-ui, sans-serif"
    fontSize: 16px
    fontWeight: "500"
    lineHeight: 24px
    letterSpacing: 0.15px
  title-small:
    fontFamily: "'Google Sans', 'Roboto Flex', 'Roboto', system-ui, sans-serif"
    fontSize: 14px
    fontWeight: "500"
    lineHeight: 20px
    letterSpacing: 0.1px
  body-large:
    fontFamily: "'Roboto Flex', 'Roboto', system-ui, sans-serif"
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 24px
    letterSpacing: 0.5px
  body-medium:
    fontFamily: "'Roboto Flex', 'Roboto', system-ui, sans-serif"
    fontSize: 14px
    fontWeight: "400"
    lineHeight: 20px
    letterSpacing: 0.25px
  body-small:
    fontFamily: "'Roboto Flex', 'Roboto', system-ui, sans-serif"
    fontSize: 12px
    fontWeight: "400"
    lineHeight: 16px
    letterSpacing: 0.4px
  label-large:
    fontFamily: "'Google Sans', 'Roboto Flex', 'Roboto', system-ui, sans-serif"
    fontSize: 14px
    fontWeight: "500"
    lineHeight: 20px
    letterSpacing: 0.1px
  label-medium:
    fontFamily: "'Google Sans', 'Roboto Flex', 'Roboto', system-ui, sans-serif"
    fontSize: 12px
    fontWeight: "500"
    lineHeight: 16px
    letterSpacing: 0.5px
  label-small:
    fontFamily: "'Google Sans', 'Roboto Flex', 'Roboto', system-ui, sans-serif"
    fontSize: 11px
    fontWeight: "500"
    lineHeight: 16px
    letterSpacing: 0.5px
rounded:
  none: 0px
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 28px
  "2xl": 32px
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  "2xl": 48px
  "3xl": 64px
  gutter: 24px
  page-margin: 24px
components:
  button-filled:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-large}"
    rounded: "{rounded.full}"
    height: 40px
    padding: 0 24px
  button-filled-hover:
    backgroundColor: "#0a4abf"
  button-tonal:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.on-secondary-container}"
    typography: "{typography.label-large}"
    rounded: "{rounded.full}"
    height: 40px
    padding: 0 24px
  button-outlined:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    typography: "{typography.label-large}"
    rounded: "{rounded.full}"
    height: 40px
    padding: 0 24px
  button-text:
    backgroundColor: transparent
    textColor: "{colors.primary}"
    typography: "{typography.label-large}"
    rounded: "{rounded.full}"
    height: 40px
    padding: 0 12px
  button-elevated:
    backgroundColor: "{colors.surface-container-low}"
    textColor: "{colors.primary}"
    typography: "{typography.label-large}"
    rounded: "{rounded.full}"
    height: 40px
    padding: 0 24px
  fab:
    backgroundColor: "{colors.primary-container}"
    textColor: "{colors.on-primary-container}"
    rounded: "{rounded.lg}"
    size: 56px
  card-filled:
    backgroundColor: "{colors.surface-container-highest}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 16px
  card-elevated:
    backgroundColor: "{colors.surface-container-low}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 16px
  card-outlined:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    rounded: "{rounded.md}"
    padding: 16px
  chip-assist:
    backgroundColor: "{colors.surface-container-low}"
    textColor: "{colors.on-surface}"
    typography: "{typography.label-large}"
    rounded: "{rounded.sm}"
    height: 32px
    padding: 0 16px
  chip-filter-selected:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.on-secondary-container}"
  search-bar:
    backgroundColor: "{colors.surface-container-high}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-large}"
    rounded: "{rounded.full}"
    height: 56px
    padding: 0 16px
  text-field-filled:
    backgroundColor: "{colors.surface-container-highest}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-large}"
    rounded: "{rounded.xs}"
    height: 56px
    padding: 0 16px
  nav-rail-item-selected:
    backgroundColor: "{colors.secondary-container}"
    textColor: "{colors.on-secondary-container}"
    rounded: "{rounded.full}"
  list-item:
    backgroundColor: transparent
    textColor: "{colors.on-surface}"
    rounded: "{rounded.full}"
    height: 56px
    padding: 0 16px
---

# SPICY · Google Material 3

## Overview

This is a **Material 3 / Material You** design system tuned for the SPICY meet-up management app. The product is a dashboard for organizers to track members, plan seating, watch participation stats, and rally a community. The voice is friendly, expressive, and a little playful — closer to the warmth of Google Drive, Calendar, or Photos than the institutional weight of older Material.

The signature visual cues are:

- **Tonal surfaces over heavy shadows.** Stacked surface containers (`surface-container-lowest` → `surface-container-highest`) carry the visual hierarchy. Elevation shadows are reserved for floating elements like FABs, dialogs, and snackbars.
- **Vibrant single accent.** Google Blue (`primary: #0b57d0`) drives every primary action, with the soft `primary-container` (`#d3e3fd`) as its companion fill for chips, FABs, and tagged emphasis.
- **Pill everything.** Buttons, chips, search bars, segmented buttons, and selected-state navigation indicators all use the full pill (`9999px`). Cards stay at a calm 12-16px.
- **Friendly typography.** Google Sans Display for headlines, Google Sans for titles and labels, Roboto Flex for body. Letter-spacing tracks the M3 type scale (negative on display, positive on labels and body).

## Colors

The palette derives from Material 3's tonal system. Light mode opens on a near-white `surface` with progressively warmer surface-containers stacking the UI. Dark mode mirrors the structure with deep neutrals.

- **Primary (`#0b57d0`)** — Google Blue 60. The single saturated color that drives filled buttons, active selections, focus rings, links, and key data points in charts.
- **Primary container (`#d3e3fd`)** — A pale blue tonal fill used for FABs, badges, and the "selected" indicator on navigation rails.
- **Secondary (`#565f71`)** — A neutral slate for icons, secondary text, and structural lines.
- **Secondary container (`#dae2f9`)** — Tonal fill for tonal buttons, filter chips when selected, and the active background for nav-rail items.
- **Tertiary (`#715573`)** — A warm purple accent reserved for delight moments and decorative chart palette positions.
- **Tertiary container (`#fbd7fc`)** — Soft pink fill for highlight cards.
- **Error (`#ba1a1a`)** and **Error container (`#ffdad6`)** — Reserved for destructive and overdue states.
- **Surface tones** — `surface` (`#fdfbff`) is the base canvas. `surface-container` (`#f1eff7`) is the dashboard background for the filled surface look. `surface-container-low` and `surface-container-high` provide tonal stacking inside cards and dialogs.

### Quick role map

- Primary CTA → `primary` on `on-primary`.
- Tonal CTA → `secondary-container` on `on-secondary-container`.
- Cards → `surface-container-low` filled, with optional outline (`outline-variant`).
- Selected nav / chip → `secondary-container` on `on-secondary-container`, full-pill shape.
- Error pill / overdue → `error-container` on `on-error-container`.
- Decorative highlight → `tertiary-container` on `on-tertiary-container`.

## Typography

Type uses Google's two-font partnership: **Google Sans Display** for display and headline, **Google Sans** for titles and labels, and **Roboto Flex** for body copy. The M3 type scale spans 15 levels:

- **Display** (large/medium/small) for hero billboards. Tight line-height (1.12), regular weight (400), slight negative letter-spacing on the large size.
- **Headline** (large/medium/small) for page section titles. Medium weight (500).
- **Title** (large/medium/small) for card titles, list groups, dialog titles. Medium weight (500).
- **Body** (large/medium/small) for reading text. Regular weight (400) with positive tracking for legibility.
- **Label** (large/medium/small) for buttons, chips, captions, and metadata. Medium weight (500), positive tracking.

The Display family uses optical sizing where available; on smaller bodies (Body & Label), Roboto Flex's `wght` and `opsz` axes are tuned for screen rendering.

## Layout

The app uses a **fluid grid** with a fixed-max content width of `1280px` for desktop and an 8/16/24/32 spacing scale built on a 4px unit. The dashboard adopts:

- **Top app bar** (small variant, 64px) with logo + actions on the right.
- **Navigation drawer** (256px) on desktop, modal navigation drawer on mobile. The selected item uses a full-pill `secondary-container` indicator.
- **Surface canvas**. The page sits on `surface-container` with cards stepping down to `surface-container-low` or up to `surface-container-high`. This tonal stack replaces drop shadows for ambient hierarchy.
- **Generous gutters**. 24px page margin, 16px between cards, 24-32px section spacing, 32-48px between major bands.

## Elevation & Depth

Material 3 favors **tonal stepping** over shadows. Elevation levels:

| Level | Use | Treatment |
|------|-----|-----------|
| 0 | Base canvas | `surface-container` (no shadow) |
| 1 | Filled cards, search bar | `surface-container-low` + faint shadow |
| 2 | Elevated buttons, top app bar on scroll | tonal step + `0 1px 2px / 0 2px 6px 2px` rgba(0,0,0,0.10) |
| 3 | FAB resting | `surface-container` + `0 1px 3px / 0 4px 8px 3px` rgba(0,0,0,0.12) |
| 4 | FAB hover, modal | tonal step + `0 2px 3px / 0 6px 10px 4px` rgba(0,0,0,0.14) |
| 5 | Snackbars, picker pop-overs | `0 4px 4px / 0 8px 12px 6px` rgba(0,0,0,0.18) |

## Shapes

A scale of generous, friendly radii. Most interactive elements use the **full pill** (`9999px`). Cards and surfaces use the **medium** radius (`12px` standard, `16px` for large feature cards). FAB sticks at `lg` (`16px`) for the standard variant.

| Token | Value | Use |
|-------|-------|-----|
| xs | 4px | Text fields (filled), tabs |
| sm | 8px | Compact cards, list dividers |
| md | 12px | Cards (standard), dialogs (top corners) |
| lg | 16px | Feature cards, FAB |
| xl | 28px | Bottom sheets, large dialogs |
| 2xl | 32px | Hero containers |
| full | 9999px | Buttons, chips, search, nav indicator, badges |

## Components

### Buttons

Five canonical variants, all pill-shaped with `40px` height and `24px` horizontal padding (`12px` for text variants). Use exactly one **Filled** button per primary screen action. Tonal sits one step down for secondary actions; Outlined for tertiary; Text for the lightest.

- **Filled**: `primary` background, `on-primary` text. Hover deepens to `#0a4abf`.
- **Tonal**: `secondary-container` bg, `on-secondary-container` text.
- **Outlined**: transparent bg, `outline` border, `primary` text.
- **Text**: transparent bg, `primary` text.
- **Elevated**: `surface-container-low` bg, level-1 elevation, `primary` text.

### FAB

`56px` square with `lg` (16px) radius. `primary-container` bg, `on-primary-container` icon. Resting elevation level-3.

### Cards

Three variants:

- **Filled** — `surface-container-highest` bg, no border, no shadow.
- **Elevated** — `surface-container-low` bg, level-1 elevation.
- **Outlined** — `surface` bg, `outline-variant` 1px border.

Default card radius is `md` (12px). Padding is 16px small / 24px standard / 32px feature.

### Chips

Pill (`9999px`), 32px tall, `0 16px` padding, `label-large` text. Variants: assist (`surface-container-low`), filter (selected = `secondary-container`), input (with leading element), suggestion.

### Search bar

A full-pill (56px tall) `surface-container-high` field with leading search icon and trailing clear button. Body-large text.

### Text fields (filled)

Filled style: `surface-container-highest` bg, `xs` (4px) top corners, 0 bottom corners, 56px tall. Floating label transitions on focus to `primary` and the bottom edge thickens to a 2px `primary` indicator.

### Lists

List items are 56px tall, full-pill background on hover/select, with leading icon (24px) and supporting text. Selected state uses `secondary-container` fill.

### Navigation rail (drawer)

256px wide drawer on desktop. Each item is 56px tall, full-pill selected indicator, leading icon + label-large text. Section labels are `label-medium` in `on-surface-variant`, ALL CAPS.

## Do's and Don'ts

- **Do** use exactly one Filled (primary) button per primary action; use Tonal for secondary, Outlined for tertiary.
- **Do** use full pill (9999px) for every button, chip, search bar, and selected nav indicator.
- **Do** prefer tonal surface stepping over heavy drop shadows.
- **Do** use Google Blue (`primary`) sparingly — primarily for the active CTA, links, and the data emphasis in charts.
- **Don't** mix sharp corners (≤2px) with the M3 family. Stay on the radii scale.
- **Don't** layer multiple saturated accents on the same screen. Tertiary is a delight color, not a workhorse.
- **Don't** use heavy borders. If a card needs separation, prefer `surface-container-low` against `surface-container` over a 1px line.
- **Do** maintain WCAG AA contrast (≥ 4.5:1 for body text, ≥ 3:1 for large text).
