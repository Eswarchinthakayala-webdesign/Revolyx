
# Revolyx Charts

**Revolyx Charts** provide a rich, flexible, and modern data visualization framework powered by [Recharts](https://recharts.org/en-US/) and styled with **Tailwind CSS** and **shadcn/ui**.  

It’s not just about rendering charts — it’s about providing a **beautiful, accessible, and theme-consistent experience** that fits seamlessly into the Revolyx design ecosystem.


##  Key Highlights

-  **Theme-aware design:** Charts automatically adapt to dark and light modes using Revolyx’s color tokens.
-  **Multi-chart support:** Line, Bar, Area, Radar, Pie, Radial, Scatter, and Composed charts.
-  **shadcn/ui integration:** Consistent design system across your UI and charts.
-  **Highly customizable:** Modify gradients, animations, tooltips, and legends effortlessly.
-  **Responsive by design:** Scales perfectly for dashboards, analytics, and mobile.
-  **AI-Ready schema:** Charts are structured for AI model parsing and intelligent UI generation.


##  Installation

To start using Revolyx Charts, install the required dependencies:

```bash
npm install recharts
npm install clsx framer-motion
npm install @radix-ui/react-icons lucide-react
npm install @shadcn/ui tailwindcss
````

If Tailwind CSS isn’t set up yet, initialize it:

```bash
npx tailwindcss init -p
```

Then configure your **`tailwind.config.js`**:

```js
// tailwind.config.js
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "hsl(var(--primary))",
        accent: "hsl(var(--accent))",
        muted: "hsl(var(--muted))",
      },
    },
  },
  plugins: [],
};
```


##  Folder Structure

A recommended structure for maintaining Revolyx charts:

```
src/
 ├── components/
 │    ├── ui/
 │    │   ├── card.jsx
 │    │   ├── button.jsx
 │    │   └── tooltip.jsx
 │    └── charts/
 │         ├── ChartCard.jsx
 │         └── ChartWrapper.jsx
 ├── pages/
 │    └── chartPage.jsx
 └── lib/
      └── chartData.js
```

---

##  Minimal Example

A simple **Line Chart** example with theme integration:

```jsx
"use client";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

const data = [
  { day: "Mon", value: 30 },
  { day: "Tue", value: 50 },
  { day: "Wed", value: 40 },
  { day: "Thu", value: 70 },
  { day: "Fri", value: 60 },
];

export default function DemoLineChart() {
  return (
    <Card className="p-4 bg-background border">
      <CardHeader>Weekly Activity</CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <XAxis dataKey="day" stroke="hsl(var(--muted))" />
            <YAxis stroke="hsl(var(--muted))" />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="value"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 4, fill: "hsl(var(--accent))" }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```


##  Dark & Light Mode

Revolyx Charts use **CSS variables** (`--primary`, `--accent`, `--muted`, etc.) that sync automatically with your app’s theme — no extra logic required.

Example:

```css
:root {
  --primary: 221 83% 53%;
  --accent: 267 83% 64%;
  --muted: 240 5% 64%;
}
.dark {
  --primary: 221 83% 66%;
  --accent: 267 83% 78%;
  --muted: 240 6% 50%;
}
```


##  Tip

Use `ResponsiveContainer` from Recharts to make your charts automatically scale to the available space.

```jsx
<ResponsiveContainer width="100%" height={300}>
  {/* chart here */}
</ResponsiveContainer>
```

