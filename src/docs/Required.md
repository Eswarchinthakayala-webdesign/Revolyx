
# Required  

 Step-by-step guide to set up Revolyx locally with all modules — charts, icons, loaders, flowcharts, and colors.


# Required Guide

Revolyx is an all-in-one developer and designer playground featuring 2L+ icons, beautiful charts, flowchart generation, color tools, and background utilities — all in a single React + Tailwind app.



##  Prerequisites

Before installing Revolyx, ensure your setup meets the following requirements:

- Node.js ≥ **18.x**
- npm or yarn installed
- Modern browser (Chrome, Edge, Firefox)
- Optional: Git for version control


##  Install Dependencies

Revolyx uses **React + Tailwind + shadcn/ui** as the core UI stack and includes 20+ icon libraries and chart modules.

Run:

```bash
npm install
```

If you’re setting up manually in a new React app, install these packages:

```bash
npm install react react-dom framer-motion clsx
npm install tailwindcss postcss autoprefixer
npm install @shadcn/ui lucide-react @radix-ui/react-icons phosphor-react @heroicons/react
npm install react-feather remixicon-react tabler-icons-react react-icons
npm install @iconify/react simple-icons lineicons eva-icons devicon cryptocurrency-icons react-pay-icons
npm install recharts @hugeicons/react healthicons-react grommet-icons
npm install reactflow @react-spring/web
npm install lottie-react
```


##  Folder Structure

```
src/
│
├── components/
│   ├── charts/           # Revolyx Recharts Gallery
│   ├── icons/            # Icon explorer with 2L+ icons
│   ├── loaders/          # Animated SVG + Lottie loaders
│   ├── flow/             # Flowchart builder & generator
│   ├── colors/           # Color explorer & background creator
│   ├── ui/               # shadcn/ui base components
│   └── layout/           # Navigation, theme, and global UI
│
├── IconData/json/        # Minified Iconify JSON sets
├── lib/                  # Hooks, utils, and theme persistence
├── app/ or pages/        # Routes (Next.js or Vite style)
└── main.jsx / App.jsx    # Root entry file
```

---

##  Configure Tailwind

Ensure your `tailwind.config.js` includes:

```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

Run Tailwind setup if not done yet:

```bash
npx tailwindcss init -p
```


##  Theme Provider Setup

In `src/theme-provider.jsx`:

```jsx
"use client";
import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(localStorage.getItem("revolyx-theme") || "dark");

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    localStorage.setItem("revolyx-theme", next);
  };

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
```

Wrap your root:

```jsx
import { ThemeProvider } from "./theme-provider";

export default function App() {
  return (
    <ThemeProvider>
      <YourRoutes />
    </ThemeProvider>
  );
}
```


##  Icons — 2 Lakh+ Icon Explorer

Revolyx supports **Iconify** (all collections) + major icon sets like Lucide, Feather, Remix, Heroicons, and more.

### Example:

```jsx
import { Icon } from "@iconify/react";

export default function IconDemo() {
  return (
    <div className="flex gap-4 text-3xl">
      <Icon icon="lucide:activity" />
      <Icon icon="mdi:account" />
      <Icon icon="fluent:home-24-filled" />
      <Icon icon="noto:rocket" />
    </div>
  );
}
```

**Features:**

* Search & copy icons instantly
* Alphabetic quick jump
* Animated icons support (`svg-spinners`, `line-md`, `openmoji`)
* Multi-library toggle in sidebar


##  Recharts Gallery

```jsx
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

const data = [
  { name: "Jan", value: 400 },
  { name: "Feb", value: 350 },
  { name: "Mar", value: 500 },
];

export default function ChartDemo() {
  return (
    <LineChart width={400} height={250} data={data}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Line type="monotone" dataKey="value" stroke="#10b981" />
    </LineChart>
  );
}
```

**Features:**

* 20+ chart templates
* Copy-to-code with one click
* Dark/light color adaptation


##  Animated Loaders

```jsx
import { Icon } from "@iconify/react";

export default function LoaderDemo() {
  return (
    <div className="flex items-center justify-center h-32">
      <Icon icon="svg-spinners:3-dots-fade" width="40" />
    </div>
  );
}
```

Supports:

* Iconify animated icons
* Lottie-based animations
* Progress & text loaders


##  Flowchart Builder & Generator

```jsx
import { FlowChartBuilder } from "@/components/flow";

export default function FlowDemo() {
  return <FlowChartBuilder />;
}
```

* Create or auto-generate diagrams
* Drag, zoom, and connect nodes
* Export to JSON or image


##  Color Explorer

```jsx
import { ColorExplorer } from "@/components/colors";

export default function ColorsDemo() {
  return <ColorExplorer />;
}
```

* Copy HEX/RGB/HSL instantly
* Gradient generator
* Background designer presets


##  Background Design Utilities

Revolyx includes dynamic grid, wave, and gradient backgrounds usable anywhere.

Example:

```html
<div className="grid-background dark:opacity-70 opacity-30" />
```

Customizable through theme-based CSS.


##  Run the App

Start your dev server:

```bash
npm run dev
```

Then visit:
 `http://localhost:5173` (Vite)
or
 `http://localhost:3000` (Next.js)


##  Build for Production

```bash
npm run build
npm run preview
```

Deploy your `/dist` folder to **Vercel**, **Netlify**, or **GitHub Pages**.


> “Revolyx helps you design smarter and build faster — all inside your browser.”



