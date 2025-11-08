
# Revolyx Charts

Revolyx Charts are **theme-aware**, **highly composable**, and **AI-ready** chart components built on top of [Recharts](https://recharts.org/en-US/).  
They integrate directly with the **Revolyx design system** using Tailwind CSS and shadcn/ui for consistent theming and interactivity.


##  Installation

Before using Revolyx Charts, ensure you have all dependencies installed:

```bash
npm install recharts clsx framer-motion
npm install @radix-ui/react-icons lucide-react
npm install @shadcn/ui tailwindcss
````

You can then import and start building charts instantly.


##  Design Principles

1. **Theme Consistency** — Automatically adapts to Revolyx dark/light themes.
2. **Reusability** — Every chart is modular and can be reused across analytics pages or dashboards.
3. **Interactivity** — Smooth tooltips, animations, and responsive layouts by default.
4. **Performance** — Optimized rendering using Recharts and React 18 concurrent features.
5. **Accessibility** — Supports focus states, tooltips, and responsive legends.


##  Quick Example

A minimal **Bar Chart** inside a shadcn Card component:

```jsx
"use client";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { Card, CardHeader, CardContent } from "@/components/ui/card";

const data = [
  { name: "Mon", users: 120 },
  { name: "Tue", users: 180 },
  { name: "Wed", users: 140 },
  { name: "Thu", users: 200 },
  { name: "Fri", users: 160 },
];

export default function BarChartDemo() {
  return (
    <Card className="bg-background border shadow-sm">
      <CardHeader>Active Users</CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted))" />
            <YAxis stroke="hsl(var(--muted))" />
            <Tooltip />
            <Bar dataKey="users" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
```


##  Chart Types

### 1. Line Chart

Use for **trend analysis** — perfect for time-series data like sales or performance.

```jsx
<LineChart data={data}>
  <XAxis dataKey="day" />
  <YAxis />
  <Tooltip />
  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} />
</LineChart>
```

 *Tip:* Combine multiple `<Line>` elements to display multiple data series.


### 2. Area Chart

For showing **cumulative trends** and gradients with smooth visuals.

```jsx
<AreaChart data={data}>
  <defs>
    <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.7} />
      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.1} />
    </linearGradient>
  </defs>
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Area type="monotone" dataKey="sales" stroke="hsl(var(--primary))" fill="url(#colorPrimary)" />
</AreaChart>
```

 Add gradients with Tailwind-like hue control for dark mode harmony.


### 3. Pie Chart

Great for **categorical distribution** or percentage-based analytics.

```jsx
<PieChart>
  <Pie
    data={data}
    dataKey="value"
    nameKey="category"
    outerRadius={100}
    fill="hsl(var(--primary))"
    label
  />
  <Tooltip />
</PieChart>
```

 *Pro Tip:* Wrap inside a `Card` for consistent design, and use Tailwind’s `grid` or `flex` for layout.


### 4. Radar Chart

Perfect for **comparative analysis** like skill mapping or feature balance.

```jsx
<RadarChart data={data}>
  <PolarGrid />
  <PolarAngleAxis dataKey="subject" />
  <Radar
    name="Mike"
    dataKey="A"
    stroke="hsl(var(--primary))"
    fill="hsl(var(--primary))"
    fillOpacity={0.5}
  />
  <Tooltip />
</RadarChart>
```

 Best used in compact dashboard cards or skill visualizers.


### 5. Radial Bar Chart

Ideal for **progress visualization** and circular stats.

```jsx
<RadialBarChart
  innerRadius="70%"
  outerRadius="100%"
  data={[{ name: "Progress", value: 78, fill: "hsl(var(--primary))" }]}
>
  <RadialBar dataKey="value" cornerRadius={8} />
  <Tooltip />
</RadialBarChart>
```

 Works beautifully when animated with `framer-motion`.


### 6. Composed Chart

When you need **multiple chart types** together — bars, lines, and areas.

```jsx
<ComposedChart data={data}>
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Area type="monotone" dataKey="growth" fill="hsl(var(--accent))" stroke="none" />
  <Bar dataKey="sales" barSize={20} fill="hsl(var(--primary))" />
  <Line type="monotone" dataKey="profit" stroke="hsl(var(--muted))" />
</ComposedChart>
```

 Combine layers for advanced analytics dashboards.


##  Chart Utilities

### Responsive Containers

All charts should be wrapped in `ResponsiveContainer` for full responsiveness:

```jsx
<ResponsiveContainer width="100%" height={300}>
  {/* your chart here */}
</ResponsiveContainer>
```

### Tooltips & Legends

Use Recharts built-ins or custom tooltip components for brand consistency:

```jsx
<Tooltip contentStyle={{ background: "hsl(var(--background))", borderRadius: "8px" }} />
<Legend verticalAlign="bottom" height={36} />
```

---

##  Integrating with shadcn/ui

Wrap charts in **Card**, **Tabs**, or **Dialog** components to fit into your UI layout.

Example inside a Tab:

```jsx
<Tabs defaultValue="sales">
  <TabsList>
    <TabsTrigger value="sales">Sales</TabsTrigger>
    <TabsTrigger value="revenue">Revenue</TabsTrigger>
  </TabsList>
  <TabsContent value="sales">
    <BarChartDemo />
  </TabsContent>
</Tabs>
```


##  Theming Support

All charts inherit your global theme colors defined via Tailwind or CSS variables.
You can dynamically change the theme using a theme provider (like in shadcn’s `useTheme`).

Example:

```jsx
const { theme } = useTheme();
const primaryColor = theme === "dark" ? "hsl(var(--primary-dark))" : "hsl(var(--primary))";
```


##  Advanced Tips

* Use **Framer Motion** for smooth entry animations of chart sections.
* Combine **Iconify or Lucide icons** with your charts for visual storytelling.
* Import dynamic data via APIs using SWR or TanStack Query.
* Lazy load large charts using React’s `dynamic()` or `Suspense`.

---

##  Playground Integration

Revolyx Charts also support an interactive playground component (coming soon).
This will allow developers to experiment with chart configurations live inside your app.

