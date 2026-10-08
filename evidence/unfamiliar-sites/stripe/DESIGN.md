# DESIGN.md: Design System & UI Specifications

> **Project:** Stripe Empirical Design System  
> **Archetype:** Editorial / Longform (Serif Typography, Warm Surfaces, Restraint)  
> **Platform:** Web & Tablet Reading  
> **Brand Tone:** Stripe is a financial services platform that helps all types of businesses accept payments, build flexible billing models, and manage money movement.  
> **Specification Version:** 1.0.0  
> **Generated:** 2026-10-08

---

## 1. Epistemic Architecture & Evidence Status

ForgeKit enforces strict epistemic separation between empirical observations and synthesized tokens.

### 🔍 1.1 Observed Characteristics (Empirical Evidence)
- **[Observed]** Inspected target URL: https://stripe.com
- **[Observed]** Document title: "Stripe | Financial Infrastructure to Grow Your Revenue"
- **[Observed]** Extracted DOM palette samples: #000000, #ffffff, #533afd, #061b31, #e8e9ff, #81b81a, #000eff
- **[Observed]** Detected web fonts: sohne-var

### 📐 1.2 Inferred Specifications (Engine Synthesis)
- **[Inferred]** Primary palette ladder (50–950) generated via linear tint/shade interpolation.
- **[Inferred]** Typography scale ratio: 1.333 with base size 16px.
- **[Inferred]** Surface radii and spatial scale structured around archetype "Editorial / Longform".
- **[Inferred]** WCAG contrast pairs audited automatically against declared background.

### ⚠️ 1.3 Unknown / Requires Human Verification
- **[Unknown]** Micro-interaction spring stiffness and drag gesture friction require code verification.
- **[Unknown]** Component state variants (disabled, focus-visible outline offsets) must be confirmed in Figma or staging.
- **[Unknown]** Dark mode contrast ratios against WCAG 2.1 AA/AAA should be audited per screen.
- **[Unknown]** Subtle sound effects and haptic responses require device-level calibration.

---

## 2. Color System & Semantic Palette

### Primary Ladder
| Token | Hex Value | Role |
| :--- | :--- | :--- |
| `primary-50` | `#f6f5ff` | Subtle backgrounds, tag highlights |
| `primary-100` | `#e5e1ff` | Hover states on light mode |
| `primary-200` | `#cbc4fe` | Borders on tinted badges |
| `primary-500` | `#533afd` | **Core Brand Primary & Key CTAs** |
| `primary-600` | `#4731d7` | Pressed & hover states |
| `primary-800` | `#2a1d7f` | Dark mode surface accents |
| `primary-950` | `#0c0926` | High-contrast dark backgrounds |

### Signal & Semantic Colors
- **Accent Highlight:** `#061b31`
- **Secondary Neutral:** `#e8e9ff`
- **Success:** `#15803d`
- **Warning:** `#b45309`
- **Error / Danger:** `#b91c1c`
- **Info:** `#0369a1`

### Neutrals
- **Background:** `#ffffff`
- **Surface:** `#ffffff`
- **Border:** `#e7e2d7`
- **Body Text:** `#000000`
- **Muted Text:** `#78716c`

---

## 3. Typography System

- **Heading Font:** `sohne-var, "SF Pro Display", sans-serif`
- **Body Font:** `sohne-var, "SF Pro Display", sans-serif`
- **Code / Mono Font:** `Courier Prime, monospace`
- **Scale Factor:** `1.333` (Base size: `16px`)

| Level | Size | Weight | Line Height | Tracking |
| :--- | :--- | :--- | :--- | :--- |
| **H1 Display** | `48px` | `300` | `55.2px` | `-0.96px` |
| **H2 Section** | `32px` | `300` | `35.2px` | `-0.64px` |
| **H3 Subsection** | `1.5rem` | `500` | `1.25` | `-0.01em` |
| **H4 Title** | `1.25rem` | `500` | `1.3` | `0em` |

---

## 4. Grid, Layout & Containers

- **Container Max Width:** `1298px`
- **Container Padding:** `2rem`
- **Grid Columns:** `12`
- **Gutter Width:** `2rem`

---

## 5. Spacing & Density

- **Base Unit:** `8px`
- **Density Mode:** `comfortable`
- **Spacing Scale:**
  - `xs`: `4px`
  - `sm`: `8px`
  - `md`: `16px`
  - `lg`: `24px`
  - `xl`: `40px`
  - `2xl`: `64px`

---

## 6. Surfaces, Elevation & Borders

- **Base Radius:** `4px`
- **Card Radius:** `6px`
- **Border Stroke:** `1px` solid `#e7e2d7`
- **Shadow Scale:**
  - **Subtle:** `0 1px 3px rgba(0,0,0,0.04)`
  - **Medium:** `0 4px 12px rgba(0,0,0,0.06)`
  - **Elevated:** `0 12px 24px rgba(0,0,0,0.08)`
- **Glassmorphism:** `Disabled`

---

## 7. Button & Interactive System

- **Primary Button:** Background `#ffffff`, text `#061b31`, radius `4px`
- **Secondary Button:** Background `transparent`, border `1px solid #d6cfc2`
- **Ghost Button:** Hover background `#ede7da`
- **Destructive Button:** Background `#b91c1c`

---

## 8. Form Controls & Inputs

- **Default Input Height:** `42px`
- **Input Radius:** `4px`
- **Default Border:** `#d6cfc2`
- **Focus Ring:** `0 0 0 2px rgba(28,25,23,0.15)`

---

## 9. Navigation & App Shell

- **Navbar Height:** `64px`
- **Sidebar Width:** `240px`
- **Nav Style:** `minimal`

---

## 10. Key Component Patterns

- **Card Specification:** Paper-like surface, 1px border #e7e2d7, 0 1px 3px shadow
- **Badge Specification:** Muted neutral pill with subtle border and serif italic label
- **Modal Backdrop:** `rgba(28, 25, 23, 0.4) with slight blur`
- **Tooltip Specification:** Warm charcoal surface with crisp border, serif typography

---

## 11. Imagery, Media & Iconography

- **Recommended Icon Set:** Lucide Icons (thin stroke)
- **Avatar Radius:** `50%`
- **Default Media Aspect Ratio:** `4:3`

---

## 12. Motion & Transitions

- **Fast:** `120ms` (tooltips, micro-toggles)
- **Normal:** `200ms` (dialogs, drawers, standard hovers)
- **Slow:** `350ms` (page transitions, complex accordions)
- **Default Easing:** `cubic-bezier(0.2, 0.0, 0, 1.0)`

---

## 13. Responsive Breakpoints

| Breakpoint | Minimum Width | Target Device |
| :--- | :--- | :--- |
| `sm` | `640px` | Mobile landscape |
| `md` | `768px` | Tablets |
| `lg` | `1024px` | Small desktops / Laptops |
| `xl` | `1280px` | Standard desktops |
| `2xl` | `1536px` | Ultra-wide displays |

---

## 14. Accessibility & Contrast Verification

- **Target Compliance:** **WCAG_AAA**
- **Focus Visible Standard:** `outline: 2px solid #1c1917; outline-offset: 2px;`

### Verified Contrast Audit
| Pair | Foreground | Background | Ratio | WCAG AA (≥4.5) | WCAG AAA (≥7.0) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Text on Background** | `#000000` | `#ffffff` | **21:1** | ✅ Pass | ✅ Pass |
| **Text on Surface** | `#000000` | `#ffffff` | **21:1** | ✅ Pass | ✅ Pass |
| **Button Label on Primary CTA** | `#061b31` | `#533afd` | **2.81:1** | ❌ Fail | ❌ Fail |
| **Primary on Background** | `#533afd` | `#ffffff` | **6.19:1** | ✅ Pass | ❌ Fail |

---

## 15. Rules for AI Coding Agents

When implementing UI for this project:
1. **Never hardcode hex values**; always reference design tokens via CSS variables or Tailwind classes.
2. Maintain spatial consistency using multiples of **8px**.
3. Do not invent non-standard border radii outside of **4px** and **6px**.
4. Honor user accessibility by wrapping transitions with `motion-safe:`.
