# DESIGN.md: Design System & UI Specifications

> **Project:** GitHub Empirical Design System  
> **Archetype:** Minimal Landing Page (Stark Contrast, Electric Highlights, Soft Blur)  
> **Platform:** Landing Page Web  
> **Brand Tone:** Join the world's most widely adopted, AI-powered developer platform where millions of developers, businesses, and the largest open source community build software that advances humanity.  
> **Specification Version:** 1.0.0  
> **Generated:** 2026-10-08

---

## 1. Epistemic Architecture & Evidence Status

ForgeKit enforces strict epistemic separation between empirical observations and synthesized tokens.

### 🔍 1.1 Observed Characteristics (Empirical Evidence)
- **[Observed]** Inspected target URL: https://github.com
- **[Observed]** Document title: "GitHub · Change is constant. GitHub keeps you ahead. · GitHub · GitHub"
- **[Observed]** Meta theme-color: #1e2327
- **[Observed]** Extracted DOM palette samples: #ffffff, #1f6feb, #0d1117, #000000, #0f1511
- **[Observed]** Detected web fonts: Mona Sans VF, Mona Sans

### 📐 1.2 Inferred Specifications (Engine Synthesis)
- **[Inferred]** Primary palette ladder (50–950) generated via linear tint/shade interpolation.
- **[Inferred]** Typography scale ratio: 1.333 with base size 14px.
- **[Inferred]** Surface radii and spatial scale structured around archetype "Minimal Landing Page".
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
| `primary-50` | `#ffffff` | Subtle backgrounds, tag highlights |
| `primary-100` | `#ffffff` | Hover states on light mode |
| `primary-200` | `#ffffff` | Borders on tinted badges |
| `primary-500` | `#ffffff` | **Core Brand Primary & Key CTAs** |
| `primary-600` | `#d9d9d9` | Pressed & hover states |
| `primary-800` | `#808080` | Dark mode surface accents |
| `primary-950` | `#262626` | High-contrast dark backgrounds |

### Signal & Semantic Colors
- **Accent Highlight:** `#1f6feb`
- **Secondary Neutral:** `#0f1511`
- **Success:** `#22c55e`
- **Warning:** `#f59e0b`
- **Error / Danger:** `#ef4444`
- **Info:** `#3b82f6`

### Neutrals
- **Background:** `#0d1117`
- **Surface:** `#000000`
- **Border:** `#e4e4e7`
- **Body Text:** `#f0f6fc`
- **Muted Text:** `#71717a`

---

## 3. Typography System

- **Heading Font:** `"Mona Sans", MonaSansFallback, -apple-system, "system-ui", "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"`
- **Body Font:** `"Mona Sans VF", -apple-system, "system-ui", "Segoe UI", "Noto Sans Backtick Fix", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"`
- **Code / Mono Font:** `Geist Mono, monospace`
- **Scale Factor:** `1.333` (Base size: `14px`)

| Level | Size | Weight | Line Height | Tracking |
| :--- | :--- | :--- | :--- | :--- |
| **H1 Display** | `64px` | `425` | `69.12px` | `-2.24px` |
| **H2 Section** | `40px` | `460` | `48px` | `normal` |
| **H3 Subsection** | `1.5rem` | `600` | `1.3` | `-0.02em` |
| **H4 Title** | `1.125rem` | `500` | `1.4` | `-0.01em` |

---

## 4. Grid, Layout & Containers

- **Container Max Width:** `1440px`
- **Container Padding:** `1.5rem`
- **Grid Columns:** `12`
- **Gutter Width:** `2rem`

---

## 5. Spacing & Density

- **Base Unit:** `4px`
- **Density Mode:** `compact`
- **Spacing Scale:**
  - `xs`: `4px`
  - `sm`: `8px`
  - `md`: `16px`
  - `lg`: `24px`
  - `xl`: `32px`
  - `2xl`: `48px`

---

## 6. Surfaces, Elevation & Borders

- **Base Radius:** `16px`
- **Card Radius:** `20px`
- **Border Stroke:** `1px` solid `#e4e4e7`
- **Shadow Scale:**
  - **Subtle:** `0 1px 2px rgba(0,0,0,0.05)`
  - **Medium:** `0 8px 30px rgba(0,0,0,0.08)`
  - **Elevated:** `0 20px 50px rgba(0,0,0,0.12)`
- **Glassmorphism:** `Enabled (blur: 12px)`

---

## 7. Button & Interactive System

- **Primary Button:** Background `#0d1117`, text `#ffffff`, radius `16px`
- **Secondary Button:** Background `#ffffff`, border `1px solid #e4e4e7`
- **Ghost Button:** Hover background `#f4f4f5`
- **Destructive Button:** Background `#ef4444`

---

## 8. Form Controls & Inputs

- **Default Input Height:** `44px`
- **Input Radius:** `12px`
- **Default Border:** `#e4e4e7`
- **Focus Ring:** `0 0 0 2px rgba(9,9,11,0.2)`

---

## 9. Navigation & App Shell

- **Navbar Height:** `64px`
- **Sidebar Width:** `240px`
- **Nav Style:** `floating`

---

## 10. Key Component Patterns

- **Card Specification:** Soft 20px rounded surface with light blur and subtle 1px border
- **Badge Specification:** Pill with 1px border and soft backdrop blur
- **Modal Backdrop:** `rgba(255, 255, 255, 0.7) backdrop-blur-md`
- **Tooltip Specification:** Pitch black capsule with white typography

---

## 11. Imagery, Media & Iconography

- **Recommended Icon Set:** Lucide Icons
- **Avatar Radius:** `9999px`
- **Default Media Aspect Ratio:** `16:9`

---

## 12. Motion & Transitions

- **Fast:** `150ms` (tooltips, micro-toggles)
- **Normal:** `250ms` (dialogs, drawers, standard hovers)
- **Slow:** `400ms` (page transitions, complex accordions)
- **Default Easing:** `cubic-bezier(0.16, 1, 0.3, 1)`

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

- **Target Compliance:** **WCAG_AA**
- **Focus Visible Standard:** `outline: 2px solid #09090b; outline-offset: 2px;`

### Verified Contrast Audit
| Pair | Foreground | Background | Ratio | WCAG AA (≥4.5) | WCAG AAA (≥7.0) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Text on Background** | `#f0f6fc` | `#0d1117` | **17.39:1** | ✅ Pass | ✅ Pass |
| **Text on Surface** | `#f0f6fc` | `#000000` | **19.29:1** | ✅ Pass | ✅ Pass |
| **Button Label on Primary CTA** | `#ffffff` | `#ffffff` | **1:1** | ❌ Fail | ❌ Fail |
| **Primary on Background** | `#ffffff` | `#0d1117` | **18.92:1** | ✅ Pass | ✅ Pass |

---

## 15. Rules for AI Coding Agents

When implementing UI for this project:
1. **Never hardcode hex values**; always reference design tokens via CSS variables or Tailwind classes.
2. Maintain spatial consistency using multiples of **4px**.
3. Do not invent non-standard border radii outside of **16px** and **20px**.
4. Honor user accessibility by wrapping transitions with `motion-safe:`.
