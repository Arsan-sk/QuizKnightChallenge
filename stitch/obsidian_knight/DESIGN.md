# Design System Specification: The Obsidian Paladin

## 1. Overview & Creative North Star
The "Creative North Star" for this design system is **"The Digital Sanctuary."** Unlike traditional, flat administrative dashboards, this system rejects the sterile grid in favor of a tactile, high-depth environment that feels both protective and prestigious. 

By merging the soft, inflated volumes of **Claymorphism** with a **Minimal Dark Mode** aesthetic, we create a "tactile-digital" hybrid. We break the "template" look through intentional asymmetry—using heavy display typography offset by expansive whitespace—and by treating the UI not as a flat screen, but as a physical space with varying atmospheric depths.

---

## 2. Colors & Surface Philosophy

### The Tonal Foundation
Our palette is rooted in deep space vitrics, utilizing the `surface-container` tiers to create hierarchy without the use of structural lines.

| Token | HSL / Hex | Role |
| :--- | :--- | :--- |
| `background` | `hsl(240 10% 4%)` | The void; the furthest depth layer. |
| `surface` | `hsl(240 8% 10%)` | Base level for primary content areas. |
| `primary` | `hsl(252 87% 62%)` | Actionable energy and brand identity. |
| `secondary` | `hsl(38 95% 58%)` | Achievement, warning, and high-value accents. |

### The "No-Line" Rule
**Explicit Instruction:** 1px solid borders for sectioning are strictly prohibited. 
Boundary definition must be achieved through:
1.  **Tonal Shifts:** Placing a `surface-container-low` card against a `surface` background.
2.  **Shadow Depth:** Using hue-tinted ambient shadows to "lift" an element.
3.  **Negative Space:** Utilizing the `spacing-8` or `spacing-12` tokens to create breathing room that defines edges.

### Surface Hierarchy & Nesting
Treat the UI as a series of nested obsidian plates. 
- **Deepest:** `surface-container-lowest` (#0e0e10) for recessed input areas.
- **Mid-Ground:** `surface-container` (#201f22) for standard content cards.
- **Elevated:** `surface-bright` (#39393b) for floating overlays or active states.

### The "Glass & Gradient" Rule
To elevate the "Clay" effect, primary CTAs should utilize a subtle linear gradient from `primary` to `primary_container`. For floating navigation or proctoring overlays, apply a `backdrop-blur(12px)` combined with a 40% opacity `surface` fill to create a "Frosted Obsidian" effect.

---

## 3. Typography: Editorial Authority
We utilize a high-contrast scale to move the platform from "utility" to "editorial."

*   **Headings (Plus Jakarta Sans):** Used in `800` weight for `display-lg` through `headline-sm`. These should feel heavy and authoritative. Use `tracking-tighter` (-0.02em) on all display text.
*   **Body (Inter):** Used for all functional reading. Maintain a line-height of 1.6 for `body-md` to ensure readability against the dark background.
*   **Data (JetBrains Mono):** All timers, scores, and mathematical figures must use JetBrains Mono. This provides a "technical/proctored" precision that contrasts against the organic curves of the UI.

---

## 4. Elevation & Depth: The Layering Principle

### Ambient Shadows & Claymorphism
Shadows are not grey; they are tinted.
*   **Primary Shadow:** `0 20px 40px -12px hsla(252, 87%, 62%, 0.15)`
*   **Secondary Shadow:** `0 20px 40px -12px hsla(38, 95%, 58%, 0.15)`
*   **The Signature Highlight:** Every card must have an inner highlight to simulate a beveled edge: `inset 0 1px 0 rgba(255,255,255,0.06)`.

### The Ghost Border Fallback
If a border is required for accessibility (e.g., focused states), use the `outline-variant` token at **20% opacity**. Never use 100% opaque lines.

---

## 5. Components

### Cards (The Hero Component)
Cards are the heart of this system. They must use the `rounded-md` (1.5rem) or `rounded-lg` (2rem) scale. 
*   **Constraint:** No dividers. Separate content using `spacing-4` vertical gaps or by nesting a `surface-container-highest` sub-section within the card.

### Buttons: The Tactile Press
*   **Primary:** `primary` background, `on-primary` text. Apply a soft `primary_container` shadow.
*   **Secondary:** `surface-container-highest` background with a `secondary` (Amber) icon or label.
*   **Interaction:** On hover, increase the inner highlight opacity to `0.12`. On press, scale the component to `0.98`.

### Input Fields: Recessed Wells
Instead of floating boxes, inputs should feel recessed into the surface.
*   **Style:** Background `surface-container-lowest`, `rounded-sm`.
*   **Focus:** Transition the background to `surface-container-low` and add a soft `primary` glow (8px blur, 10% opacity).

### Gamified Progress Indicators
Use `tertiary` (Success Green) for progress bars, but apply a "glass tube" effect: a `surface-container-lowest` track with a high-glow `tertiary` fill and the signature `0 1px 0` top highlight.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical margins (e.g., `ml-12 mr-6`) for headline placements to create a custom editorial feel.
*   **Do** use JetBrains Mono for all numeric values to emphasize the "Challenge/Data" aspect.
*   **Do** stack `surface` colors to create depth instead of using borders.

### Don't:
*   **Don't** use pure black (#000000). Use the `background` token (#131315) to maintain the "Obsidian" depth.
*   **Don't** use standard Lucide icons at 1px stroke. Use 1.5px or 2px to match the visual weight of the Plus Jakarta Sans typeface.
*   **Don't** use hard-edged shadows. If a shadow feels visible as a "shape," the blur radius is too low. Increase blur and decrease opacity.

---

## 7. Spacing Scale (Reference)
Use the spacing scale to enforce the "Sanctuary" feel. When in doubt, increase the gap.
- **Internal Card Padding:** `spacing-6` (2rem).
- **Section Gaps:** `spacing-16` (5.5rem).
- **Component Tight Gaps:** `spacing-2` (0.7rem).