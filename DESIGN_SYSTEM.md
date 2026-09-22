# Design System: tapdaa.com

> Extracted: 2026-09-21 | Target: Field Compliance & Shop Onboarding Platform

---

## 1. Design Language & Aesthetic Overview

- **Vibe:** Balanced · Modern · Organic compliance · Clean Light Theme
- **Design Rhythm:** 4px geometric grid · Pill buttons · Highly rounded container vocabulary · Tight line-height (1.2 – 1.3) · Flat (no heavy drop shadows)
- **Viewport Reference:** 1536x730 (Mobile-first responsive inspection wizard + admin dashboard)

---

## 2. Color System & Semantic Tokens

### Core Palette
| Role | Hex | RGB / RGBA | Usage & Purpose |
|---|---|---|---|
| **Primary Interactive** | `#64D7C2` | `rgb(100, 215, 194)` | Primary CTAs, active buttons, key interactive accents |
| **Accent / Highlight** | `#D399ED` | `rgb(211, 153, 237)` | Badge highlights, success/alert state moments, decorative tags |
| **Surface (Page BG)** | `#F9FCF5` | `rgba(249, 252, 245, 0.9)` | Main page canvas background, frosted sticky topbar |
| **Elevated Surface** | `#EBEEE8` | `rgb(235, 238, 232)` | Cards, inspection step containers, raised panels |
| **Brand Highlight BG** | `#C1F48F` | `rgb(193, 244, 143)` | Pale lime highlight badges, category pills, verified chips |
| **Subtle Tint BG** | `#EEF8E4` | `rgb(238, 248, 228)` | Table active rows, checklist background, summary cards |
| **Input Background** | `#F7FAF4` | `rgb(247, 250, 244)` | Text inputs, dropdowns, textarea fields |
| **Surface Pure** | `#FFFFFF` | `rgb(255, 255, 255)` | Pure white card surfaces, modals |
| **Text Dark / Contrast** | `#1E2C0F` | `rgb(30, 44, 15)` | Primary action text, prominent labels, deep forest contrast |
| **Text Heading / Body** | `#000000` | `rgb(0, 0, 0)` | Headings, general high-contrast text |
| **Text Body Muted** | `#33382D` | `rgb(51, 56, 45)` | Standard body text, descriptions, checklist item labels |
| **Text Muted / Caption** | `#777A74` | `rgb(119, 122, 116)` | Secondary labels, placeholders, timestamps, inactive links |
| **Link Color** | `#0000EE` | `rgb(0, 0, 238)` | External links / reference documentation links |

---

## 3. Typography & Hierarchy

- **Font Families:** `FH Oscar Bold`, `FH Oscar Medium`, `Inter`, `Crisp Noto Sans Regular`, `sans-serif`
- **Scale:** `64px` / `48px` / `36px` / `26.45px` / `20px` / `18px` / `16px` / `14px` / `12px`
- **Ratio:** Major Second (`1.125`)
- **Base Size:** `14px`

### Type Scale Breakdown
- **H1 (Hero Titles):** FH Oscar Bold `48px` (or `64px` on wide screens), Weight `400` / `700`, Line-height `1.0` (`48px`)
- **H2 (Section Headings):** FH Oscar Medium `48px` / `36px` / `26.45px`, Weight `400` / `500`, Line-height `1.2`
- **Body Large / Paragraphs:** FH Oscar Medium `18px` – `20px`, Weight `400`, Line-height `1.3` (`22px` – `26px`)
- **Body Regular:** `14px` – `16px`, Weight `400`, Line-height `1.3` (`19.2px` – `24px`)
- **Caption / Meta Text:** `12px`, Weight `400` / `500`, Line-height `normal`

---

## 4. Spacing & Radius Vocabulary

### Spacing Scale (4px Base Grid)
`4px`, `8px`, `12px`, `16px`, `20px`, `24px`, `32px`, `48px`, `56px`, `60px`, `92px`
- **Outliers (Page separators):** `120px`, `200px`

### Border Radius Hierarchy
- **Base / Cards:** `8px` to `12px`
- **Inputs & Field Boxes:** `8px`
- **Buttons / Filter Badges / Tags:** `Pill` (`9999px` / `rounded-full`)
- **Ghost / Action Icons:** `100%` (`circular`)

### Shadows & Depth
- **Pattern:** Flat aesthetic with subtle border dividers. No heavy multi-tiered drop shadows.
- **Borders:** `1px solid rgba(30, 44, 15, 0.08)` to `0.8px solid #E3E3E3`

---

## 5. Component Specifications

### 5.1 Buttons
- **Primary CTA Button (Filled):**
  - Background: `#64D7C2`
  - Text Color: `#1E2C0F`
  - Font Size: `15px` – `16px`
  - Font Weight: `700`
  - Padding: `10px 20px` (min-height: `44px`)
  - Radius: Pill (`9999px`)
- **Secondary / Outline Pill Button:**
  - Background: `transparent` (`rgba(30, 44, 15, 0)`)
  - Border: `1.5px solid #1E2C0F`
  - Text Color: `#1E2C0F`
  - Padding: `10px 18px`
  - Font Weight: `700`
  - Radius: Pill (`9999px`)
  - Hover: Background `#1E2C0F`, Text `#FFFFFF` or `#64D7C2`
- **Dark Compact Button:**
  - Background: `#1E2C0F`
  - Text Color: `#FFFFFF`
  - Height: `38px`
  - Padding: `9px 16px`
  - Radius: Pill (`9999px`)
- **Ghost Circular Icon Button:**
  - Dimension: `44px` x `44px` to `54px` x `54px`
  - Radius: `100%` (Circle)
  - Text/Icon: `#000000`

### 5.2 Cards & Elevated Containers
- Background: `#FFFFFF` or Elevated `#EBEEE8`
- Border: `1px solid rgba(30, 44, 15, 0.08)`
- Border Radius: `12px`
- Padding: `24px`

### 5.3 Inputs & Checklist Items
- Background: `#F7FAF4`
- Border: `0.8px solid rgba(227, 227, 227, 0.6)`
- Focus State: `1.5px solid #1E2C0F`
- Height: `46px`
- Padding: `12px 16px`
- Border Radius: `8px`

### 5.4 Topbar Navigation
- Position: Fixed / Sticky `top: 0`, `z-index: 50`
- Height: `72px`
- Max Width: `1200px` (centered)
- Background: `rgba(249, 252, 245, 0.9)` with backdrop-blur (`8px`)
- Border Bottom: `1px solid rgba(30, 44, 15, 0.06)`

---

## 6. Responsive Breakpoints

- **Mobile Viewport:** `< 810px`
  - Full-width stacked inspection flows, sticky bottom floating action bar for Agents.
- **Tablet / Mid-tier:** `810px` – `1199px`
- **Desktop:** `>= 1200px` (Container capped at `1200px` centered)

---

## 7. Implementation Rules & Best Practices

### DO:
- Use `#64D7C2` for all primary CTAs, active steps, and primary actions.
- Reserve `#D399ED` for accent moments, category flags, and special status badges — do not overuse.
- Use `#1E2C0F` for crisp text contrast against `#64D7C2` and pale lime `#C1F48F`.
- Strictly follow the spacing scale (`4, 8, 12, 16, 20, 24, 32, 48, 56, 60, 92`).
- Match the radius vocabulary: `8px` for inputs/cards, `Pill` (`9999px`) for buttons and badges.
- Honor the visual hierarchy: bold primary interactive states, clean muted tones (`#777A74`, `#33382D`) for secondary information.

### DON'T:
- Do not introduce random arbitrary hex colors or competing bright primaries.
- Do not introduce arbitrary border-radius values (keep inputs/cards at 8–12px and interactive controls as pills).
- Do not use heavy drop shadows; preserve the clean, modern, flat aesthetic.
- Do not clutter screens on mobile; utilize compact 12px captions and tight 1.2–1.3 line heights.
