# DESIGN.md: Design System & UI Specifications

> **Project:** Raycast Empirical Design System  
> **Archetype:** Expressive Creative / Studio (Bold Display Fonts, Glassmorphism, Neon)  
> **Platform:** Creative Studio Web  
> **Brand Tone:** A collection of powerful productivity tools all within an extendable launcher.  
> **Specification Version:** 1.0.0  
> **Generated:** 2026-10-08

---

## 1. Epistemic Architecture & Evidence Status

ForgeKit enforces strict epistemic separation between empirical observations and synthesized tokens.

### 🔍 1.1 Observed Characteristics (Empirical Evidence)
- **[Observed]** Inspected target URL: https://raycast.com
- **[Observed]** Document title: "Raycast - Your shortcut to everything"
- **[Observed]** Extracted DOM palette samples: #ffffff, #07080a, #9c9c9d, #2f3031, #e6e6e6, #130d0e, #6a6b6c
- **[Observed]** Detected web fonts: Inter, GeistMono

### 📐 1.2 Inferred Specifications (Engine Synthesis)
- **[Inferred]** Primary palette ladder (50–950) generated via linear tint/shade interpolation.
- **[Inferred]** Typography scale ratio: 1.333 with base size 16px.
- **[Inferred]** Surface radii and spatial scale structured around archetype "Expressive Creative / Studio".
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
| `primary-50` | `#fefefe` | Subtle backgrounds, tag highlights |
| `primary-100` | `#fbfbfb` | Hover states on light mode |
| `primary-200` | `#f8f8f8` | Borders on tinted badges |
| `primary-500` | `#e6e6e6` | **Core Brand Primary & Key CTAs** |
| `primary-600` | `#c4c4c4` | Pressed & hover states |
| `primary-800` | `#737373` | Dark mode surface accents |
| `primary-950` | `#232323` | High-contrast dark backgrounds |

### Signal & Semantic Colors
- **Accent Highlight:** `#9c9c9d`
- **Secondary Neutral:** `#2f3031`
- **Success:** `#34d399`
- **Warning:** `#fbbf24`
- **Error / Danger:** `#f87171`
- **Info:** `#38bdf8`

### Neutrals
- **Background:** `#07080a`
- **Surface:** `#07080a`
- **Border:** `#2e1065`
- **Body Text:** `#ffffff`
- **Muted Text:** `#c4b5fd`

---

## 3. Typography System

- **Heading Font:** `Inter, "Inter Fallback", sans-serif`
- **Body Font:** `Inter, "Inter Fallback", sans-serif`
- **Code / Mono Font:** `Fira Code, monospace`
- **Scale Factor:** `1.333` (Base size: `16px`)

| Level | Size | Weight | Line Height | Tracking |
| :--- | :--- | :--- | :--- | :--- |
| **H1 Display** | `64px` | `600` | `70.4px` | `normal` |
| **H2 Section** | `20px` | `500` | `normal` | `0.2px` |
| **H3 Subsection** | `1.75rem` | `600` | `1.25` | `-0.02em` |
| **H4 Title** | `1.25rem` | `600` | `1.3` | `-0.01em` |

---

## 4. Grid, Layout & Containers

- **Container Max Width:** `1440px`
- **Container Padding:** `2rem`
- **Grid Columns:** `12`
- **Gutter Width:** `2rem`

---

## 5. Spacing & Density

- **Base Unit:** `4px`
- **Density Mode:** `normal`
- **Spacing Scale:**
  - `xs`: `4px`
  - `sm`: `8px`
  - `md`: `16px`
  - `lg`: `24px`
  - `xl`: `36px`
  - `2xl`: `60px`

---

## 6. Surfaces, Elevation & Borders

- **Base Radius:** `8px`
- **Card Radius:** `20px`
- **Border Stroke:** `1px` solid `#2e1065`
- **Shadow Scale:**
  - **Subtle:** `rgba(0, 0, 0, 0.5) 0px 0px 0px 2px, rgba(255, 255, 255, 0.19) 0px 0px 14px 0px, rgba(0, 0, 0, 0.2) 0px -1px 0.4px 0px inset, rgb(255, 255, 255) 0px 1px 0.4px 0px inset`
  - **Medium:** `rgba(255, 255, 255, 0.1) 0px 1px 0px 0px inset, rgba(7, 13, 79, 0.05) 0px 0px 20px 3px, rgba(7, 13, 79, 0.05) 0px 0px 40px 20px, rgba(255, 255, 255, 0.06) 0px 0px 0px 1px inset`
  - **Elevated:** `0 20px 60px rgba(236, 72, 153, 0.3)`
- **Glassmorphism:** `Enabled (blur: 16px)`

---

## 7. Button & Interactive System

- **Primary Button:** Background `#e6e6e6`, text `#2f3031`, radius `8px`
- **Secondary Button:** Background `rgba(255,255,255,0.08)`, border `1px solid rgba(255,255,255,0.15)`
- **Ghost Button:** Hover background `rgba(255,255,255,0.1)`
- **Destructive Button:** Background `#f43f5e`

---

## 8. Form Controls & Inputs

- **Default Input Height:** `48px`
- **Input Radius:** `16px`
- **Default Border:** `#2e1065`
- **Focus Ring:** `0 0 0 3px rgba(139,92,246,0.4)`

---

## 9. Navigation & App Shell

- **Navbar Height:** `76px`
- **Sidebar Width:** `260px`
- **Nav Style:** `floating`

---

## 10. Key Component Patterns

- **Card Specification:** Deep violet frosted glass card, neon gradient hover border, 28px radius
- **Badge Specification:** Neon glowing gradient pill with dark fill and vibrant border
- **Modal Backdrop:** `rgba(15, 7, 40, 0.8) backdrop-blur-xl`
- **Tooltip Specification:** Frosted violet pill with bright cyan typography

---

## 11. Imagery, Media & Iconography

- **Recommended Icon Set:** Lucide Icons
- **Avatar Radius:** `9999px`
- **Default Media Aspect Ratio:** `16:9`

---

## 12. Motion & Transitions

- **Fast:** `150ms` (tooltips, micro-toggles)
- **Normal:** `300ms` (dialogs, drawers, standard hovers)
- **Slow:** `500ms` (page transitions, complex accordions)
- **Default Easing:** `cubic-bezier(0.34, 1.56, 0.64, 1)`

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
- **Focus Visible Standard:** `outline: 2px solid #ec4899; outline-offset: 3px;`

### Verified Contrast Audit
| Pair | Foreground | Background | Ratio | WCAG AA (≥4.5) | WCAG AAA (≥7.0) |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Text on Background** | `#ffffff` | `#07080a` | **20.04:1** | ✅ Pass | ✅ Pass |
| **Text on Surface** | `#ffffff` | `#07080a` | **20.04:1** | ✅ Pass | ✅ Pass |
| **Button Label on Primary CTA** | `#2f3031` | `#e6e6e6` | **10.6:1** | ✅ Pass | ✅ Pass |
| **Primary on Background** | `#e6e6e6` | `#07080a` | **16.05:1** | ✅ Pass | ✅ Pass |

---

## 15. Rules for AI Coding Agents

When implementing UI for this project:
1. **Never hardcode hex values**; always reference design tokens via CSS variables or Tailwind classes.
2. Maintain spatial consistency using multiples of **4px**.
3. Do not invent non-standard border radii outside of **8px** and **20px**.
4. Honor user accessibility by wrapping transitions with `motion-safe:`.
