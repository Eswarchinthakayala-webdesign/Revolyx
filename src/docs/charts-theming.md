
#  Charts Theming in Revolyx

Revolyx Charts are designed to **seamlessly adapt** to your global theme and color system.  
They integrate with **Tailwind CSS variables**, **shadcn/ui design tokens**, and **Recharts** styling APIs.

This guide covers how to apply and customize theming for your data visualizations — including **light/dark mode**, **dynamic brand colors**, and **AI-based palette generation**.


##  Prerequisites

Ensure you have Revolyx Charts installed and Tailwind CSS configured with CSS variables for themes.

```bash
npm install recharts @shadcn/ui clsx framer-motion
````

Make sure your `tailwind.config.js` contains theme variables:

```js
theme: {
  extend: {
    colors: {
      background: "hsl(var(--background))",
      foreground: "hsl(var(--foreground))",
      primary: "hsl(var(--primary))",
      secondary: "hsl(var(--secondary))",
      accent: "hsl(var(--accent))",
      muted: "hsl(var(--muted))",
    },
  },
}
```


##  Dynamic Light & Dark Mode

Revolyx uses `next-themes` or the `useTheme()` hook from shadcn/ui to switch chart colors automatically.

```jsx
import { useTheme } from "next-themes";

const { theme } = useTheme();

const chartColor = theme === "dark"
  ? "hsl(var(--primary))"
  : "hsl(var(--accent))";
```

Then apply the color dynamically to Recharts elements:

```jsx
<Bar dataKey="visitors" fill={chartColor} radius={[4, 4, 0, 0]} />
```

 Works automatically with dark/light transitions.


##  Using CSS Variables

Every chart component reads from Revolyx's system CSS variables, meaning **you can override chart color globally** without modifying code.

```css
:root {
  --primary: 220 90% 56%;
  --accent: 180 80% 45%;
}

.dark {
  --primary: 220 90% 70%;
  --accent: 180 70% 55%;
}
```

Then in JSX:

```jsx
<Line
  dataKey="sales"
  stroke="hsl(var(--primary))"
  fill="hsl(var(--accent))"
/>
```


##  Gradient Fills

Create beautiful, theme-aware gradients that react to the current color scheme:

```jsx
<defs>
  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
    <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0.1}/>
  </linearGradient>
</defs>

<Area
  type="monotone"
  dataKey="revenue"
  stroke="hsl(var(--primary))"
  fill="url(#colorGradient)"
/>
```

 *Tip:* You can animate gradient transitions with Framer Motion for reactive visual feedback.


##  Palette Synchronization

Each Revolyx theme comes with a synchronized Tailwind-like palette:

| Color Group   | Example Variable        | Usage                    |
| ------------- | ----------------------- | ------------------------ |
| `--primary`   | `hsl(var(--primary))`   | Main data highlights     |
| `--secondary` | `hsl(var(--secondary))` | Complementary lines      |
| `--accent`    | `hsl(var(--accent))`    | Gradients and highlights |
| `--muted`     | `hsl(var(--muted))`     | Axes, legends, borders   |

### Example:

```jsx
<CartesianGrid stroke="hsl(var(--muted))" />
<XAxis stroke="hsl(var(--muted))" />
<Bar dataKey="visits" fill="hsl(var(--primary))" />
```


##  Integrating with shadcn/ui Components

Charts blend perfectly with shadcn’s Cards, Tabs, and Dialogs for cohesive dashboards.

```jsx
<Card>
  <CardHeader>
    <h3 className="text-lg font-semibold">Revenue Overview</h3>
  </CardHeader>
  <CardContent>
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data}>
        <XAxis dataKey="month" stroke="hsl(var(--muted))" />
        <YAxis stroke="hsl(var(--muted))" />
        <Tooltip
          contentStyle={{
            background: "hsl(var(--background))",
            border: "1px solid hsl(var(--muted))",
            borderRadius: "0.5rem",
          }}
        />
        <Area
          dataKey="revenue"
          stroke="hsl(var(--primary))"
          fill="url(#colorGradient)"
        />
      </AreaChart>
    </ResponsiveContainer>
  </CardContent>
</Card>
```


##  Advanced Customization

### 1. Dynamic Gradients per Series

```jsx
{colors.map((c, i) => (
  <Bar key={i} dataKey={c.key} fill={`hsl(var(--${c.color}))`} />
))}
```

### 2. Animated Entry

```jsx
<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
  <BarChartDemo />
</motion.div>
```

### 3. Custom Tooltip

```jsx
<Tooltip
  cursor={{ fill: "hsl(var(--muted) / 0.1)" }}
  content={({ payload }) => (
    <div className="p-2 rounded-md bg-background border text-sm">
      {payload?.[0]?.payload?.name}: {payload?.[0]?.value}
    </div>
  )}
/>
```


##  Theme-Aware Recharts Defaults

Revolyx automatically adjusts default chart stroke, grid, and fill colors based on theme context.
To override globally:

```js
// revolyx.config.js
export const chartDefaults = {
  gridColor: "hsl(var(--muted))",
  strokeColor: "hsl(var(--foreground))",
  tooltipBg: "hsl(var(--background))",
};
```

Then in your chart wrapper component:

```jsx
<CartesianGrid stroke={chartDefaults.gridColor} />
```


##  Recommended Theme Variables

| Variable       | Description                   | Default             |
| -------------- | ----------------------------- | ------------------- |
| `--background` | Background of card/container  | `0 0% 100%`         |
| `--foreground` | Text and icon color           | `222.2 47.4% 11.2%` |
| `--primary`    | Brand or main accent          | `220 90% 56%`       |
| `--accent`     | Supporting hue                | `280 80% 55%`       |
| `--muted`      | Grid lines, legends, tooltips | `240 5% 64.9%`      |

---

##  Best Practices

* Use **CSS variables** instead of hard-coded colors for theme consistency.
* Always wrap charts with `ResponsiveContainer` for adaptive layouts.
* Reuse **shadcn/ui Cards** for chart containers.
* When animating multiple charts, use **Framer Motion’s staggered transitions**.
* For brand customization, define your palette in `/styles/globals.css` once.

