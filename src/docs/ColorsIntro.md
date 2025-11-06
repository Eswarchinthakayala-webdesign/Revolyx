
#  Revolyx Colors

The **Revolyx Colors** system is a scalable, theme-aware color framework built on top of the official **TailwindCSS palette** with support for modern color models like **HSL**, **OKLCH**, and **RGB**.  

It enables developers to explore, visualize, and use consistent color tokens across their applications while supporting both **light** and **dark themes**.


##  Features

-  28 Tailwind-based color families (slate → rose)
-  Supports HEX, RGB, HSL, and OKLCH conversions
-  Copy-friendly — one-click copy for any format
-  Dark theme ready with proper contrast control
-  Smart sorting (by family, hue, or shade)
-  Lightweight & framework-agnostic
-  Built with React + Framer Motion + ShadCN UI


##  Installation

The Revolyx color explorer is included in the main **Revolyx UI package**.  
If you haven’t installed it yet, run:

Coming Soon

```bash
# via npm
npm install revolyx

# or via yarn
yarn add revolyx

# optional (if not already in your project)
npm install framer-motion lucide-react sonner
````


##  Importing the Colors Page

If you want to integrate the **Color Explorer** directly in your React app:

```tsx
"use client";
import ColorsPage from "@/components/revolyx/ColorsPage";

export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <ColorsPage />
    </div>
  );
}
```

> 💡 **Tip:** The ColorsPage is fully responsive and supports Tailwind’s dark mode. You can use it as a standalone `/colors` route for documentation or internal design systems.


##  Palette Overview

Revolyx provides all Tailwind v3 standard color families:

| Family                       | Example            | Range  |
| :--------------------------- | :----------------- | :----- |
| Slate                        | `#64748b`          | 50–950 |
| Gray                         | `#6b7280`          | 50–950 |
| Zinc                         | `#71717a`          | 50–950 |
| Neutral                      | `#737373`          | 50–950 |
| Stone                        | `#78716c`          | 50–950 |
| Red, Orange, Amber, Yellow   | Vibrant warm tones | 50–950 |
| Green, Emerald, Teal, Cyan   | Natural cool tones | 50–950 |
| Blue, Indigo, Violet, Purple | Deep brand tones   | 50–950 |
| Fuchsia, Pink, Rose          | Accent tones       | 50–950 |

You can easily reference them in your Tailwind classes:

```html
<div className="bg-blue-500 text-white p-4 rounded-lg">
  Primary Blue 500
</div>
```

Or in your CSS using variables:

```css
:root {
  --revolyx-blue-500: #3b82f6;
  --revolyx-emerald-400: #34d399;
}
```


##  Copy Formats Supported

When browsing the color explorer, you can copy colors in any of the following formats:

| Format         | Example Output                 |
| :------------- | :----------------------------- |
| HEX            | `#3b82f6`                      |
| RGB            | `rgb(59, 130, 246)`            |
| HSL            | `hsl(217 91% 60%)`             |
| OKLCH          | `oklch(0.64 0.13 257)`         |
| Tailwind Class | `bg-blue-500`                  |
| CSS Variable   | `--revolyx-blue-500: #3b82f6;` |

All formats are clipboard-ready and can be pasted directly into your codebase.


##  Example: Copying a Color

Clicking a color tile automatically copies its formatted value.

Example copy logic:

```tsx
const handleCopy = async (entry) => {
  const { hex } = entry;
  await navigator.clipboard.writeText(hex);
  showToast("success", `${hex} copied to clipboard`);
};
```

>  *The explorer uses `sonner` for toast notifications and `framer-motion` for smooth animations.*

---

##  Developer Notes

* Every color is precomputed for `HEX`, `RGB`, `HSL`, and `OKLCH` via conversion utilities.
* You can extend the palette by editing the `PALETTE` object inside `ColorsPage.jsx`.
* The colors follow the **TailwindCSS v3 official color standard** for full consistency with your design system.

---

##  Related References

* [Tailwind CSS Colors Reference](https://tailwindcss.com/docs/customizing-colors)
* [OKLCH Color Space Guide](https://oklch.com/)
* [Sonner Toasts (UI Feedback)](https://sonner.emilkowal.ski/)
* [Lucide Icons](https://lucide.dev/icons/)
* [Framer Motion](https://www.framer.com/motion/)


> © 2025 **Revolyx UI** — A modern, composable design system built for React + Tailwind.


