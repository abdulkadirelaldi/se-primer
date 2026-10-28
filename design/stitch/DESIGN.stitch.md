---
name: Nocturne Incident
colors:
  surface: '#faf8ff'
  surface-dim: '#d2d9f7'
  surface-bright: '#faf8ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f2f3ff'
  surface-container: '#eaedff'
  surface-container-high: '#e2e7ff'
  surface-container-highest: '#dae2ff'
  on-surface: '#131b30'
  on-surface-variant: '#55433a'
  inverse-surface: '#283046'
  inverse-on-surface: '#eef0ff'
  outline: '#897268'
  outline-variant: '#dcc1b5'
  surface-tint: '#9b4511'
  primary: '#893802'
  on-primary: '#ffffff'
  primary-container: '#a84f1b'
  on-primary-container: '#ffe3d8'
  inverse-primary: '#ffb692'
  secondary: '#8b5010'
  on-secondary: '#ffffff'
  secondary-container: '#ffb069'
  on-secondary-container: '#784100'
  tertiary: '#47525b'
  on-tertiary: '#ffffff'
  tertiary-container: '#5f6a73'
  on-tertiary-container: '#dfeaf5'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbcb'
  primary-fixed-dim: '#ffb692'
  on-primary-fixed: '#341100'
  on-primary-fixed-variant: '#793000'
  secondary-fixed: '#ffdcc1'
  secondary-fixed-dim: '#ffb77a'
  on-secondary-fixed: '#2e1500'
  on-secondary-fixed-variant: '#6d3a00'
  tertiary-fixed: '#d9e4ef'
  tertiary-fixed-dim: '#bdc8d2'
  on-tertiary-fixed: '#121d24'
  on-tertiary-fixed-variant: '#3d4851'
  background: '#faf8ff'
  on-background: '#131b30'
  surface-variant: '#dae2ff'
typography:
  headline-xl:
    fontFamily: Source Serif 4
    fontSize: 40px
    fontWeight: '600'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-xl-mobile:
    fontFamily: Source Serif 4
    fontSize: 30px
    fontWeight: '600'
    lineHeight: 38px
    letterSpacing: -0.015em
  headline-lg:
    fontFamily: Source Serif 4
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.015em
  headline-lg-mobile:
    fontFamily: Source Serif 4
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Source Serif 4
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 30px
  headline-sm:
    fontFamily: Source Serif 4
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 26px
  body-lg:
    fontFamily: Source Serif 4
    fontSize: 19px
    fontWeight: '400'
    lineHeight: 32px
  body-md:
    fontFamily: Source Serif 4
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 26px
  body-sm:
    fontFamily: Source Serif 4
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  quote:
    fontFamily: Source Serif 4
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 30px
  eyebrow:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.08em
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.02em
  code-stat:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '600'
    lineHeight: 18px
    letterSpacing: -0.01em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-desktop: 1.5rem
  margin: 1rem
  margin-tablet: 1.5rem
  margin-desktop: 2.5rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 1rem
  space-lg: 1.5rem
  space-xl: 2.5rem
---

## Brand & Style

This design system establishes an atmospheric, high-stakes editorial interface: a luminescent digital codex consulted during a hospital IT infrastructure failure at 03:00. The experience balances literary contemplation with tactical crisis triage, immersing Turkish software engineering students and engineers in branching narrative architectures.

The visual style synthesizes **Contemporary Editorial Bookbinding** with **Mission-Critical Diagnostic Tooling**:
- Deep navy consoles reflect dark server rooms, juxtaposed against tactile, warm cream parchment pages.
- Expressive serif literature delivers systemic complexity through narrative prose, while crisp grotesque labels provide actionable diagnostics.
- Luminous amber and rust indicators evoke incident monitors, telemetry spikes, and critical triage interventions.

## Colors

The palette operates across dual contextual planes: **Incident Room (Night Console)** and **Field Codex (Diagnostic Page)**.

- **Primary (`#A84F1B` - Triage Rust):** Anchors high-priority actions, decisive story branches, and critical callouts against light parchment substrates.
- **Secondary (`#F0A35E` - Terminal Amber):** Emits glowing telemetry indicators, warnings, active chapter anchors, and illuminated accents across dark night surfaces.
- **Tertiary (`#E3EEF9` - Post-Mortem Blue):** Provides soothing resolution highlights, mitigation confirmations, verified diagnostics, and stable system states.
- **Neutral (`#1A2238` - Deep Ink):** Delivers foundational editorial body text on light surfaces and establishes deep typographic hierarchy.
- **Atmospheric Canvas Tiers:**
  - `page-canvas`: `#F6F4EF` (Aged Cream) for daylight/reading contexts.
  - `paper-card`: `#FFFDF8` (Parchment White) for daylight elevation layers.
  - `terminal-canvas`: `#13203B` (Midnight Navy) for incident night-shift mode.
  - `terminal-card`: `#1D2C4E` (Console Slate) for elevated diagnostic panels on dark surfaces.

## Typography

The typographic hierarchy enforces a dichotomy between narrative immersion and operational feedback:
- **Literary Voice (`Source Serif 4`):** Governs headlines, prose chapters, character dialogues, and post-incident retrospectives. Turkish diacritics (ç, ğ, ı, İ, ö, ş, ü) retain balanced ascender and descender rhythm. Generous body line heights (`1.6` to `1.7`) preserve readability during intensive reading sessions.
- **System Interface (`Inter`):** Powers metrics, telemetry indicators, status badges, buttons, form controls, and architectural diagrams.
- **Eyebrow Convention:** Incident codes and section indicators (e.g., `ACİL SERVİS // HL7-V2 BAĞLANTI HATASI`) must be rendered strictly in 12px uppercase Inter with `0.08em` tracking and bold weight.

## Layout & Spacing

The layout is built around a single-column, distraction-free reading column that unfolds into an operational split-console on wider viewports:

- **Mobile (< 768px):** Fixed 16px (`1rem`) horizontal screen margins ensure maximum touch perimeter and reading width. Interactive decision blocks flow inline with narrative paragraphs.
- **Tablet (768px - 1024px):** 24px margins with centered prose containers restricted to `680px` max-width to protect editorial line length.
- **Desktop (> 1024px):** 40px margins with a synchronized dual-column interface: narrative crisis stream on the left (60% width), real-time hospital architecture metrics, server states, and terminal choices locked on the right (40% width).
- **Rhythm:** Spacing follows an 8pt modular interval, relying on `space-md` (16px) for interior component structures and `space-xl` (40px) between literary chapters and triage nodes.

## Elevation & Depth

Visual depth mirrors an illuminated book surface casting subtle radiance into a dark operations room. Traditional dropshadows are replaced with tactile edge definitions and warm photonic glows:

- **Parchment Stack (Light Mode):**
  - Surface: `#FFFDF8` atop `#F6F4EF`.
  - Border: 1px solid rgba(26, 34, 56, 0.08).
  - Depth: Ambient edge shadow `0 2px 8px -2px rgba(26, 34, 56, 0.05), 0 8px 24px -4px rgba(168, 79, 27, 0.04)`.
- **Night Console Stack (Dark Mode):**
  - Surface: `#1D2C4E` layered atop `#13203B`.
  - Border: 1px solid rgba(240, 163, 94, 0.14).
  - Depth: Luminous amber underglow `0 4px 20px -2px rgba(0, 0, 0, 0.4), 0 0 16px -4px rgba(240, 163, 94, 0.12)`.
- **Active State Elevation:** Interactive decision tiles elevate subtly using a `translateY(-1px)` shift and an intensification of the `#F0A35E` outline opacity rather than high-contrast blur expansion.

## Shapes

The design system employs consistent roundedness that balances modern software utilities with softened book corners:
- Standard container radius is fixed at **14px** across cards, modal containers, and interactive diagnostic modules.
- Form inputs, interactive telemetry badges, and button controls inherit an 8px (`rounded-md`) geometry for high structural legibility.
- Eyebrow badges and status chips utilize fully circular pill contours (`rounded-full`) to delineate metadata from contextual cards.

## Components

### Buttons & Interactive Choices
- **Primary Action (Decision Choice):** Full-width, minimum touch target of 44px (recommended 48px on mobile). On parchment: `#A84F1B` background, `#FFFDF8` label, subtle amber active glow. On night console: `#F0A35E` background with `#13203B` text.
- **Secondary Action (Inspect System / Telemetry):** Transparent background with a 1.5px border (`rgba(26, 34, 56, 0.2)` on parchment; `rgba(240, 163, 94, 0.35)` on terminal). Inter 14px bold, uppercase tracking.

### Cards & Story Panels
- Rendered with a mandatory 14px corner radius and 16px (`space-md`) to 24px (`space-lg`) internal padding.
- Light mode cards use `#FFFDF8` on `#F6F4EF` with soft hairline border.
- Dark mode incident cards use `#1D2C4E` on `#13203B` accented with a 3px left vertical indicator bar indicating triage status (Rust for error, Amber for latency/warning, Soft Blue for resolved).

### Status Badges & Chips
- Eyebrow chips: Inter 12px, bold, uppercase tracking.
- Severity Indicators:
  - *Kritik (Critical):* `#A84F1B` text with `rgba(168, 79, 27, 0.12)` pill background.
  - *İnceleme (Investigating):* `#F0A35E` text with `rgba(240, 163, 94, 0.15)` pill background.
  - *Çözüldü (Resolved):* `#13203B` text with `#E3EEF9` fill.

### Interactive Code & Log Snippets
- Displayed in monospaced or structured Inter inside `#13203B` containers even during light mode, recreating the physical look of diagnostic medical monitors.
- Critical log highlights utilize `#F0A35E` inline text accents and `#E3EEF9` for successful payload deliveries.

### Form Inputs & Parameter Toggles
- Minimum 44px height for touch ergonomics.
- Crisp 1px border using `#1A2238` at 20% opacity. Focused inputs highlight with a 1.5px border in `#A84F1B` (light) or `#F0A35E` (dark), paired with a 2px soft outer focus ring.