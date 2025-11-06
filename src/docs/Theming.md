

#  Revolyx Themes

The **Revolyx Theme System** provides a unified way to manage **light**, **dark**, and **custom themes** using CSS variables and Tailwind’s built-in color modes.

It’s designed to integrate seamlessly with **React**, **ShadCN UI**, and **TailwindCSS**, offering a simple yet flexible theming API for developers and designers alike.

---

##  Core Idea

Revolyx separates **functional colors** (UI tokens like `background`, `primary`, `muted`) from **raw palette colors** (e.g., `blue-500`, `gray-900`).  
This makes your design system **semantic**, not tied to a specific palette.

Each theme is defined using color variables such as:

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 221.2 83.2% 53.3%;
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96.1%;
  --secondary-foreground: 222.2 47.4% 11.2%;
  --muted: 210 40% 96.1%;
  --accent: 221.2 83.2% 53.3%;
  --border: 214.3 31.8% 91.4%;
}
````

>  Values use **HSL syntax** for Tailwind compatibility and real-time theme switching.


##  Light Theme Example

```css
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --card: 0 0% 100%;
  --card-foreground: 222.2 84% 4.9%;
  --muted: 210 40% 96.1%;
  --primary: 221.2 83.2% 53.3%;
  --accent: 221.2 83.2% 53.3%;
  --border: 214.3 31.8% 91.4%;
}
```

Example Tailwind usage:

```html
<div className="bg-background text-foreground border border-border p-4 rounded-lg">
  Light theme container
</div>
```

##  Dark Theme Example

```css
[data-theme="dark"] {
  --background: 222.2 84% 4.9%;
  --foreground: 210 40% 98%;
  --card: 222.2 84% 4.9%;
  --card-foreground: 210 40% 98%;
  --muted: 217.2 32.6% 17.5%;
  --primary: 210 90% 60%;
  --accent: 210 90% 60%;
  --border: 217.2 32.6% 17.5%;
}
```

In Tailwind, simply apply:

```html
<html class="dark">
  <body className="bg-background text-foreground">
    Dark mode active 
  </body>
</html>
```


##  React Integration

### Automatic Theme Switching Hook

```tsx
import { useEffect, useState } from "react";

export function useTheme() {
  const [theme, setTheme] = useState(() =>
    localStorage.getItem("revolyx-theme") || "light"
  );

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("revolyx-theme", theme);
  }, [theme]);

  return { theme, setTheme };
}
```

Usage:

```tsx
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const toggle = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <Button variant="ghost" size="sm" onClick={toggle} className="cursor-pointer">
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
      <span className="ml-2 capitalize">{theme}</span>
    </Button>
  );
}
```


##  Semantic Color Mapping

Each semantic color key is linked to a Tailwind palette color under the hood:

| Semantic      | Mapped To    | Example                 |
| ------------- | ------------ | ----------------------- |
| `--primary`   | `blue-500`   | Brand or main accent    |
| `--secondary` | `gray-400`   | Muted secondary buttons |
| `--accent`    | `indigo-500` | Link / highlight        |
| `--muted`     | `gray-200`   | Background surfaces     |
| `--border`    | `gray-300`   | Outline or separator    |

This abstraction allows you to **change themes** without modifying the entire UI color scheme.


##  Dynamic Theme Variants

You can dynamically register themes (useful for multi-brand setups):

```ts
export const THEMES = {
  light: "light",
  dark: "dark",
  ocean: "ocean",
  rose: "rose",
};
```

Then define the palette for each:

```css
[data-theme="ocean"] {
  --primary: 200 95% 55%;
  --accent: 190 90% 45%;
  --background: 210 50% 97%;
}

[data-theme="rose"] {
  --primary: 340 90% 60%;
  --accent: 330 85% 55%;
  --background: 0 0% 98%;
}
```

Switch at runtime:

```js
document.documentElement.setAttribute("data-theme", "ocean");
```


##  Tailwind Configuration

In your `tailwind.config.js`, include the `:root` color variables to support dynamic theme switching:

```js
module.exports = {
  darkMode: ["class", '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: "hsl(var(--primary))",
        "primary-foreground": "hsl(var(--primary-foreground))",
        border: "hsl(var(--border))",
        muted: "hsl(var(--muted))",
      },
    },
  },
  plugins: [],
};
```

>  *Now your components automatically respond to light/dark mode toggling.*


##  Pro Tip — Animate Theme Transitions

Use Framer Motion for smooth color transitions between themes:

```tsx
import { motion } from "framer-motion";

<motion.div
  layout
  transition={{ duration: 0.4 }}
  className="bg-background text-foreground p-6 rounded-xl shadow-md"
>
  <h2>Animated Theme Transition</h2>
</motion.div>
```


##  Best Practices

* Use **semantic variables** (`--primary`, `--accent`, etc.) — not raw palette names.
* Prefer **HSL color values** for smoother transitions.
* Keep dark mode colors at least **4.5:1** contrast ratio.
* Always sync `localStorage` with your theme state for persistence.


> © 2025 **Revolyx UI** — Scalable design system with dark/light theming support for React + Tailwind.


