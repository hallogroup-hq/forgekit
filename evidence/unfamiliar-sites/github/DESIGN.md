# DESIGN.md: Design System & UI Specifications

> **Project:** GitHub Empirical Design System  
> **Archetype:** Modern SaaS / Productivity (Precision, High-Density, Functional)  
> **Platform:** Web & Cross-Platform  
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
- **[Inferred]** Typography scale ratio: 1.25 with base size 15px.
- **[Inferred]** Surface radii and spatial scale structured around archetype "Modern SaaS / Productivity".
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
- **Accent Highlight:** `#10b981`
- **Secondary Neutral:** `#94a3b8`
- **Success:** `#10b981`
- **Warning:** `#f59e0b`
- **Error / Danger:** `#ef4444`
- **Info:** `#3b82f6`

### Neutrals
- **Background:** `#0d1117`
- **Surface:** `#000000`
- **Border:** `#27272a`
- **Body Text:** `#f0f6fc`
- **Muted Text:** `#a1a1aa`

---

## 3. Typography System

- **Heading Font:** `"Mona Sans", MonaSansFallback, -apple-system, "system-ui", "Segoe UI", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"`
- **Body Font:** `"Mona Sans VF", -apple-system, "system-ui", "Segoe UI", "Noto Sans Backtick Fix", "Noto Sans", Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"`
- **Code / Mono Font:** `JetBrains Mono, monospace`
- **Scale Factor:** `1.25` (Base size: `15px`)

| Level | Size | Weight | Line Height | Tracking |
| :--- | :--- | :--- | :--- | :--- |
| **H1 Display** | `64px` | `425` | `69.12px` | `-2.24px` |
| **H2 Section** | `1.875rem` | `600` | `1.2` | `-0.02em` |
| **H3 Subsection** | `1.375rem` | `600` | `1.25` | `-0.015em` |
| **H4 Title** | `1.125rem` | `500` | `1.3` | `-0.01em` |

---

## 4. Grid, Layout & Containers

- **Container Max Width:** `1440px`
- **Container Padding:** `1.5rem`
- **Grid Columns:** `12`
- **Gutter Width:** `1.5rem`

---

## 5. Spacing & Density

- **Base Unit:** `4px`
- **Density Mode:** `normal`
- **Spacing Scale:**
  - `xs`: `4px`
  - `sm`: `8px`
  - `md`: `16px`
  - `lg`: `24px`
  - `xl`: `32px`
  - `2xl`: `48px`

---

## 6. Surfaces, Elevation & Borders

- **Base Radius:** `8px`
- **Card Radius:** `12px`
- **Border Stroke:** `1px` solid `#27272a`
- **Shadow Scale:**
  - **Subtle:** `0 1px 2px 0 rgba(0, 0, 0, 0.4)`
  - **Medium:** `0 4px 6px -1px rgba(0, 0, 0, 0.5), 0 2px 4px -2px rgba(0, 0, 0, 0.5)`
  - **Elevated:** `0 20px 25px -5px rgba(0, 0, 0, 0.6), 0 8px 10px -6px rgba(0, 0, 0, 0.6)`
- **Glassmorphism:** `Disabled`

---

## 7. Button & Interactive System

- **Primary Button:** Background `#6366f1`, text `#ffffff`, radius `8px`
- **Secondary Button:** Background `#27272a`, border `1px solid #3f3f46`
- **Ghost Button:** Hover background `#27272a`
- **Destructive Button:** Background `#ef4444`

---

## 8. Form Controls & Inputs

- **Default Input Height:** `38px`
- **Input Radius:** `8px`
- **Default Border:** `#27272a`
- **Focus Ring:** `0 0 0 2px rgba(99, 102, 241, 0.35)`

---

## 9. Navigation & App Shell

- **Navbar Height:** `56px`
- **Sidebar Width:** `240px`
- **Nav Style:** `sticky`

---

## 10. Key Component Patterns

- **Card Specification:** 12px radius, subtle border 1px #27272a, high density surface
- **Badge Specification:** Compact 6px radius badge with tinted background and 1px border
- **Modal Backdrop:** `rgba(0, 0, 0, 0.7) backdrop-blur-sm`
- **Tooltip Specification:** Dark obsidian surface with 1px border and sharp typography

---

## 11. Imagery, Media & Iconography

- **Recommended Icon Set:** Lucide Icons
- **Avatar Radius:** `8px`
- **Default Media Aspect Ratio:** `16:9`

---

## 12. Motion & Transitions

- **Fast:** `120ms` (tooltips, micro-toggles)
- **Normal:** `200ms` (dialogs, drawers, standard hovers)
- **Slow:** `320ms` (page transitions, complex accordions)
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
- **Focus Visible Standard:** `outline: 2px solid #6366f1; outline-offset: 2px;`

### Verified Contrast Audit
| Pair | Foreground | Background | Ratio | WCAG AA (≥4.5) | WCAG AAA (≥7.0) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Text on Background** | `#f0f6fc` | `#0d1117` | **17.39:1** | ✅ Pass | ✅ Pass |
| **Text on Surface** | `#f0f6fc` | `#000000` | **19.29:1** | ✅ Pass | ✅ Pass |
| **White on Primary CTA** | `#ffffff` | `#ffffff` | **1:1** | ❌ Fail | ❌ Fail |
| **Primary on Background** | `#ffffff` | `#0d1117` | **18.92:1** | ✅ Pass | ✅ Pass |

---

## 15. Rules for AI Coding Agents

When implementing UI for this project:
1. **Never hardcode hex values**; always reference design tokens via CSS variables or Tailwind classes.
2. Maintain spatial consistency using multiples of **4px**.
3. Do not invent non-standard border radii outside of **8px** and **12px**.
4. Honor user accessibility by wrapping transitions with `motion-safe:`.
