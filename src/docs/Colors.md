

#  Revolyx Colors

The **Revolyx Colors API** provides direct access to every color family, shade, and color model (HEX, RGB, HSL, OKLCH).  
You can use these utilities for building **design systems**, **dynamic themes**, and **brand color palettes** — all with the precision of Tailwind’s color logic and OKLCH conversion.


##  Color Structure

Each color in the Revolyx system is represented by a consistent object structure:

```ts
interface ColorEntry {
  name: string;     // Color family (e.g., "blue")
  shade: number;    // Shade (50 - 950)
  hex: string;      // HEX code (#3b82f6)
  className: string;// Tailwind class (bg-blue-500)
  cssVar: string;   // CSS variable (--revolyx-blue-500)
}
````

Colors are automatically generated from the **PALETTE** object inside `ColorsPage.jsx` and flattened using the helper:

```js
function paletteToEntries(palette) {
  const entries = [];
  Object.keys(palette).forEach((name) => {
    Object.keys(palette[name]).forEach((shade) => {
      entries.push({
        name,
        shade: Number(shade),
        hex: palette[name][shade],
        className: `bg-${name}-${shade}`,
        cssVar: `--revolyx-${name}-${shade}: ${palette[name][shade]};`,
      });
    });
  });
  return entries.sort((a, b) => (a.name === b.name ? a.shade - b.shade : a.name.localeCompare(b.name)));
}
```

---

##  Basic Usage Examples

### 1. Use Colors in Tailwind Classes

```html
<div className="bg-blue-500 text-white p-4 rounded-lg shadow">
  Blue 500 — Primary Button
</div>

<div className="bg-emerald-400/90 text-gray-900 rounded-md px-3 py-2">
  Emerald Accent
</div>
```

### 2. Use Colors as CSS Variables

```css
:root {
  --revolyx-blue-500: #3b82f6;
  --revolyx-emerald-400: #34d399;
}

button {
  background-color: var(--revolyx-blue-500);
  color: white;
}
```

### 3. Accessing Palette in Code

```ts
import { PALETTE } from "@/components/revolyx/ColorsPage";

const primary = PALETTE.blue[500];
console.log(primary); // "#3b82f6"
```

---

##  Color Conversion Utilities

Revolyx exposes multiple conversion helpers to transform colors across formats.

###  HEX → RGB

```js
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

hexToRgb("#3b82f6");
// => { r: 59, g: 130, b: 246 }
```

###  RGB → HSL

```js
function rgbToHsl({ r, g, b }) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break;
      case gn: h = (bn - rn) / d + 2; break;
      case bn: h = (rn - gn) / d + 4; break;
    }
    h /= 6;
  }

  return `hsl(${Math.round(h * 360)} ${Math.round(s * 100)}% ${(l * 100).toFixed(1)}%)`;
}
```

###  HEX → OKLCH (Modern Color Space)

```js
function hexToOKLCH(hex) {
  const { r, g, b } = hexToRgb(hex);
  const sr = r / 255, sg = g / 255, sb = b / 255;

  const lr = sr <= 0.04045 ? sr / 12.92 : Math.pow((sr + 0.055) / 1.055, 2.4);
  const lg = sg <= 0.04045 ? sg / 12.92 : Math.pow((sg + 0.055) / 1.055, 2.4);
  const lb = sb <= 0.04045 ? sb / 12.92 : Math.pow((sb + 0.055) / 1.055, 2.4);

  const l = 0.4122 * lr + 0.5363 * lg + 0.0514 * lb;
  const m = 0.2119 * lr + 0.6807 * lg + 0.1074 * lb;
  const s = 0.0883 * lr + 0.2817 * lg + 0.63 * lb;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  const L = 0.21045 * l_ + 0.79361 * m_ - 0.00407 * s_;
  const a = 1.97799 * l_ - 2.42859 * m_ + 0.45059 * s_;
  const b_ = 0.0259 * l_ + 0.78277 * m_ - 0.80867 * s_;

  const C = Math.sqrt(a * a + b_ * b_);
  let h = Math.atan2(b_, a) * (180 / Math.PI);
  if (h < 0) h += 360;

  return `oklch(${L.toFixed(2)} ${C.toFixed(2)} ${Math.round(h)})`;
}
```


##  Example — Customizing and Extending the Palette

You can easily add or override your own custom palette:

```js
const CUSTOM_COLORS = {
  brand: {
    50: "#f5f9ff",
    100: "#e0edff",
    200: "#b8d5ff",
    300: "#89b9ff",
    400: "#5b9eff",
    500: "#2f82ff",
    600: "#1868e3",
    700: "#0d4eb6",
    800: "#093b8a",
    900: "#072f6b",
    950: "#021b3f",
  },
};

const EXTENDED_PALETTE = { ...PALETTE, ...CUSTOM_COLORS };
```

Now your new family `brand` will automatically appear in the Revolyx Colors UI.


##  Sorting & Filtering

The colors can be dynamically sorted and filtered:

| Mode           | Description                                        |
| -------------- | -------------------------------------------------- |
| **Group**      | Default — grouped by family (slate, gray, blue...) |
| **Asc / Desc** | Sort by shade (50 → 950 or reverse)                |
| **Alpha**      | Alphabetically by color family                     |

Example:

```js
const visibleColors = ALL_COLORS.filter((c) => c.name === "blue")
                                .sort((a, b) => a.shade - b.shade);
```


##  Copy Feedback (UI Example)

When a color tile is clicked, it automatically copies its formatted value using the browser Clipboard API and shows a success toast.

```tsx
await navigator.clipboard.writeText(text);
showToast("success",
  <div className="flex items-center gap-3">
    <div className="w-6 h-6 rounded" style={{ background: hex }} />
    <span>{`${name}-${shade} copied as ${format.toUpperCase()}`}</span>
  </div>
);
```

Uses:

*  `sonner` for toasts
*  `framer-motion` for animations
*  `lucide-react` icons for controls

---

##  UI Components Used

| Component                                | Source                         |
| ---------------------------------------- | ------------------------------ |
| `Select`, `SelectItem`, `Button`, `Card` | ShadCN UI                      |
| `Search`, `ArrowUp`, `ArrowDown`         | Lucide Icons                   |
| `showToast()`                            | Custom helper (Sonner wrapper) |
| `motion.div`                             | Framer Motion                  |

Example import block:

```js
import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectItem, SelectContent, SelectValue } from "@/components/ui/select";
import { Search, ArrowUp, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
```


##  Utility Tip: Generate CSS Variables from Palette

If you need to generate variables programmatically:

```js
Object.entries(PALETTE).forEach(([family, shades]) => {
  Object.entries(shades).forEach(([shade, hex]) => {
    console.log(`--revolyx-${family}-${shade}: ${hex};`);
  });
});
```

Output:

```css
--revolyx-blue-500: #3b82f6;
--revolyx-emerald-400: #34d399;
--revolyx-pink-600: #db2777;
```


