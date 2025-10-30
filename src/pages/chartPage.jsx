// src/pages/RevolyxChartsPage.jsx
import React, { useMemo, useState, useEffect, useRef } from "react";
import {
  LineChart,Label, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  Tooltip, Legend, ResponsiveContainer, CartesianGrid, ComposedChart,
  PieChart, Pie, Cell, RadialBarChart, RadialBar, ScatterChart, Scatter,
  ZAxis, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  Treemap, FunnelChart, Funnel, LabelList, Brush, ReferenceLine
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Menu,
  Search,
  SortAsc,
  SortDesc,
  BarChart2,
  Copy,
  Code2,
  EyeOff,
  Loader2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { Toaster } from "sonner";
import { toast } from "sonner";



/* shadcn/ui imports - adapt these to your project's shadcn export paths */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { useTheme } from "../components/theme-provider";
import CustomActiveShapePieChart from "../components/CustomActiveShapePieChart";
import CopySourceButton from "../components/CopySourceButton";
import ToggleSourceButton from "../components/ToggleSourceButton";
import { Link, useNavigate } from "react-router-dom";


/* Color themes provided by user */
const COLOR_THEMES = {
  zinc: ["#71717a", "#a1a1aa", "#27272a", "#52525b", "#3f3f46"],
  gray: ["#9ca3af", "#4b5563", "#6b7280", "#374151", "#1f2937"],
  slate: ["#64748b", "#94a3b8", "#334155", "#475569", "#1e293b"],
  stone: ["#78716c", "#a8a29e", "#57534e", "#44403c", "#292524"],
  orange: ["#f97316", "#fb923c", "#ea580c", "#fdba74", "#ffedd5"],
  green: ["#22c55e", "#4ade80", "#16a34a", "#86efac", "#dcfce7"],
  emerald: ["#10b981", "#34d399", "#059669", "#6ee7b7", "#a7f3d0"],
  teal: ["#14b8a6", "#2dd4bf", "#0d9488", "#5eead4", "#99f6e4"],
  cyan: ["#06b6d4", "#22d3ee", "#0891b2", "#67e8f9", "#a5f3fc"],
  sky: ["#0ea5e9", "#38bdf8", "#0284c7", "#7dd3fc", "#bae6fd"],
  blue: ["#3b82f6", "#60a5fa", "#2563eb", "#93c5fd", "#bfdbfe"],
  indigo: ["#6366f1", "#818cf8", "#4f46e5", "#a5b4fc", "#c7d2fe"],
  violet: ["#8b5cf6", "#a78bfa", "#7c3aed", "#c4b5fd", "#ddd6fe"],
  purple: ["#9333ea", "#a855f7", "#7e22ce", "#d8b4fe", "#f3e8ff"],
  pink: ["#ec4899", "#f472b6", "#db2777", "#f9a8d4", "#fce7f3"],
  rose: ["#f43f5e", "#fb7185", "#e11d48", "#fecdd3", "#ffe4e6"],
  red: ["#ef4444", "#f87171", "#dc2626", "#fca5a5", "#fee2e2"],
  yellow: ["#eab308", "#facc15", "#ca8a04", "#fde047", "#fef9c3"],
  amber: ["#f59e0b", "#fbbf24", "#d97706", "#fcd34d", "#fef3c7"],

};

/* ---------- sample demo dataset (can be replaced with real data) ---------- */
const demoData = [
  { name: "Jan", uv: 4000, pv: 2400, amt: 2400, cnt: 24, score: 80 },
  { name: "Feb", uv: 3000, pv: 1398, amt: 2210, cnt: 13, score: 65 },
  { name: "Mar", uv: 2000, pv: 9800, amt: 2290, cnt: 98, score: 90 },
  { name: "Apr", uv: 2780, pv: 3908, amt: 2000, cnt: 39, score: 70 },
  { name: "May", uv: 1890, pv: 4800, amt: 2181, cnt: 48, score: 55 },
  { name: "Jun", uv: 2390, pv: 3800, amt: 2500, cnt: 38, score: 88 },
  { name: "Jul", uv: 3490, pv: 4300, amt: 2100, cnt: 43, score: 92 },
];
const demoData2 = [
  { name: "Jan", uv: 4000, pv: 2400, amt: 2400, cnt: 24, score: 80 },
  { name: "Feb", uv: 3000, pv: 1398, amt: 2210, cnt: 13, score: 65 },
  { name: "Mar",  pv: 9800, amt: 2290, cnt: 98, score: 90 },
  { name: "Apr", uv: 2780, pv: 3908, amt: 2000, cnt: 39, score: 70 },
  { name: "May", uv: 1890, pv: 4800, amt: 2181, cnt: 48, score: 55 },
  { name: "Jun", uv: 2390, pv: 3800, amt: 2500, cnt: 38, score: 88 },
  { name: "Jul", uv: 3490, pv: 4300, amt: 2100, cnt: 43, score: 92 },
];
const data01 = [
  { hour: '12a', index: 1, value: 170 },
  { hour: '1a', index: 1, value: 180 },
  { hour: '2a', index: 1, value: 150 },
  { hour: '3a', index: 1, value: 120 },
  { hour: '4a', index: 1, value: 200 },
  { hour: '5a', index: 1, value: 300 },
  { hour: '6a', index: 1, value: 400 },
  { hour: '7a', index: 1, value: 200 },
  { hour: '8a', index: 1, value: 100 },
  { hour: '9a', index: 1, value: 150 },
  { hour: '10a', index: 1, value: 160 },
  { hour: '11a', index: 1, value: 170 },
  { hour: '12a', index: 1, value: 180 },
  { hour: '1p', index: 1, value: 144 },
  { hour: '2p', index: 1, value: 166 },
  { hour: '3p', index: 1, value: 145 },
  { hour: '4p', index: 1, value: 150 },
  { hour: '5p', index: 1, value: 170 },
  { hour: '6p', index: 1, value: 180 },
  { hour: '7p', index: 1, value: 165 },
  { hour: '8p', index: 1, value: 130 },
  { hour: '9p', index: 1, value: 140 },
  { hour: '10p', index: 1, value: 170 },
  { hour: '11p', index: 1, value: 180 },
];
const data001 = [
  { name: 'Group A', value: 400 },
  { name: 'Group B', value: 300 },
  { name: 'Group C', value: 300 },
  { name: 'Group D', value: 200 },
];
const data002 = [
  { name: 'A1', value: 100 },
  { name: 'A2', value: 300 },
  { name: 'B1', value: 100 },
  { name: 'B2', value: 80 },
  { name: 'B3', value: 40 },
  { name: 'B4', value: 30 },
  { name: 'B5', value: 50 },
  { name: 'C1', value: 100 },
  { name: 'C2', value: 200 },
  { name: 'D1', value: 150 },
  { name: 'D2', value: 50 },
];
 const isAnimationActive=true
const data02 = [
  { hour: '12a', index: 1, value: 160 },
  { hour: '1a', index: 1, value: 180 },
  { hour: '2a', index: 1, value: 150 },
  { hour: '3a', index: 1, value: 120 },
  { hour: '4a', index: 1, value: 200 },
  { hour: '5a', index: 1, value: 300 },
  { hour: '6a', index: 1, value: 100 },
  { hour: '7a', index: 1, value: 200 },
  { hour: '8a', index: 1, value: 100 },
  { hour: '9a', index: 1, value: 150 },
  { hour: '10a', index: 1, value: 160 },
  { hour: '11a', index: 1, value: 160 },
  { hour: '12a', index: 1, value: 180 },
  { hour: '1p', index: 1, value: 144 },
  { hour: '2p', index: 1, value: 166 },
  { hour: '3p', index: 1, value: 145 },
  { hour: '4p', index: 1, value: 150 },
  { hour: '5p', index: 1, value: 160 },
  { hour: '6p', index: 1, value: 180 },
  { hour: '7p', index: 1, value: 165 },
  { hour: '8p', index: 1, value: 130 },
  { hour: '9p', index: 1, value: 140 },
  { hour: '10p', index: 1, value: 160 },
  { hour: '11p', index: 1, value: 180 },
];

const ALL_CHARTS = [
  { key: "line", title: "Line Chart", tags: ["time", "trend"] },
  { key: "area", title: "Area Chart", tags: ["trend", "volume"] },
  { key: "bar", title: "Bar Chart", tags: ["categorical"] },
  { key: "composed", title: "Composed Chart", tags: ["mixed"] },
  { key: "pie", title: "Pie Chart", tags: ["proportion"] },
  { key: "radial", title: "Radial Bar Chart", tags: ["gauge"] },
  { key: "scatter", title: "Scatter Chart", tags: ["correlation"] },
  { key: "radar", title: "Radar Chart", tags: ["multivariate"] },
  { key: "treemap", title: "Treemap", tags: ["hierarchy"] },
  { key: "funnel", title: "Funnel Chart", tags: ["conversion"] },
  { key: "tinyLine", title: "Tiny Line Chart", tags: ["mini", "preview", "dashboard"] },
  { key: "dottedLine", title: "Dotted Line Chart", tags: ["pattern", "trend", "decorative"] },
  { key: "verticalLine", title: "Vertical Line Chart", tags: ["trend", "vertical", "comparison"] },
  { key: "lineWithReference", title: "Line Chart with Reference Lines", tags: ["trend", "highlight", "reference"] },
  { key: "customizedDotted", title: "Customized Dotted Line Chart", tags: ["dots", "custom", "highlight"] },
  { key: "stackedArea", title: "Stacked Area Chart", tags: ["area", "stacked", "trend"] },
  { key: "areaConnectNull", title: "Area Chart (Connect Nulls)", tags: ["area", "null", "trend"] },
  { key: "cardinalArea", title: "Cardinal Area Chart", tags: ["area", "smooth", "spline"] },
  { key: "areaFillByValue", title: "Area Chart (Fill by Value)", tags: ["area", "gradient", "threshold"] },
  { key: "customShapeBar", title: "Custom Shape Bar Chart", tags: ["bar", "custom", "triangle", "shape"] },
  { key: "positiveNegativeBar", title: "Positive & Negative Bar Chart", tags: ["bar", "comparison", "reference", "axis"] },
  { key: "brushBar", title: "Brush Bar Chart", tags: ["bar", "zoom", "interactive", "scroll"] },
  {
  key: "barMultiXAxis",
  title: "Bar Chart (Multiple X-Axes)",
  tags: ["bar", "axis", "quarter", "multi-axis"]
},
{ 
  key: "lineBarAreaComposedChart", 
  title: "Line-Bar-Area Composed Chart", 
  tags: ["composed", "multi-series", "area", "bar", "line", "scatter"] 
},
{
  key: "sameDataComposedChart",
  title: "Same Data Composed Chart",
  tags: ["composed", "bar", "line", "dual", "comparison"]
},
{
  key: "verticalComposedChart",
  title: "Vertical Composed Chart",
  tags: ["composed", "bar", "line", "area", "vertical"]
},
{
  key: "scatterAndLineOfBestFit",
  title: "Scatter and Line of Best Fit",
  tags: ["scatter", "line", "composed", "trendline"]
},
{
  key: "bandedChart",
  title: "Banded Chart (Range + Line)",
  tags: ["composed", "area", "band", "range", "line"]
},
{
  key: "threeDimScatterChart",
  title: "3D Scatter Chart (Z-Axis Scaling)",
  tags: ["scatter", "3D", "bubble", "z-axis"]
},

{
  key: "jointLineScatterChart",
  title: "Joint Line Scatter Chart",
  tags: ["scatter", "line", "comparison", "connected"],
},
{
  key: "bubbleChart",
  title: "Bubble Chart (Hourly by Day)",
  tags: ["scatter", "bubble", "time-series", "responsive"]
},
{
  key: "scatterChartWithCells",
  title: "Scatter Chart (Colored Cells)",
  tags: ["scatter", "cells", "custom-colors"]
},
{ key: "twoLevelPieChart", title: "Two-Level Pie Chart", tags: ["pie", "nested", "responsive"] },
{
  key: "straightAnglePieChart",
  title: "Straight Angle Pie Chart (Semi Circle)",
  tags: ["pie", "half", "angle", "donut"]
},
{
  key: "customActiveShapePieChart",
  title: "Custom Active Shape Pie Chart",
  tags: ["pie", "custom-shape", "interactive", "sector", "animation"],
},
{
  key: "pieChartWithNeedle",
  title: "Pie Chart with Needle Gauge",
  tags: ["pie", "gauge", "needle", "indicator"]
},
{
  key: "pieChartInFlexbox",
  title: "Pie Chart in Flexbox Layout",
  tags: ["pie", "responsive", "layout", "flexbox"]
},

{
  key: "specifiedDomainRadarChart",
  title: "Radar Chart (Specified Domain)",
  tags: ["radar", "polar", "domain", "responsive"]
},

{
  key: "simpleRadialBarChart",
  title: "Radial Bar Chart (Simple)",
  tags: ["radial", "bar", "circular", "legend"]
},





];

/* ---------- utility helpers ---------- */
function sortCharts(list, mode) {
  if (mode === "asc") return [...list].sort((a,b)=>a.title.localeCompare(b.title));
  if (mode === "desc") return [...list].sort((a,b)=>b.title.localeCompare(a.title));
  return list;
}

function copyToClipboard(text) {
  navigator.clipboard?.writeText(text).then(()=> toast.success("Source copied to clipboard"));
}

/* ---------- source-code generator helpers (returns string snippets) ---------- */
function generateChartSource(key, paletteName) {
  const palette = COLOR_THEMES[paletteName] || COLOR_THEMES.blue;
  switch (key) {
    case "line":
      return `// LineChart example (Recharts)
<ResponsiveContainer width="100%" height={260}>
  <LineChart data={demoData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Line type="monotone" dataKey="uv" stroke="${palette[0]}" strokeWidth={2} dot={{ r: 3 }} />
    <Line type="monotone" dataKey="pv" stroke="${palette[1]}" strokeWidth={2} dot={{ r: 3 }} />
  </LineChart>
</ResponsiveContainer>`;
case "simpleRadialBarChart":
      return `// Radial Bar Chart (Simple)
import { RadialBarChart, RadialBar, Legend } from 'recharts';

// #region Sample data
const data = [
  {
    name: '18-24',
    uv: 31.47,
    pv: 2400,
    fill: '#8884d8',
  },
  {
    name: '25-29',
    uv: 26.69,
    pv: 4567,
    fill: '#83a6ed',
  },
  {
    name: '30-34',
    uv: 15.69,
    pv: 1398,
    fill: '#8dd1e1',
  },
  {
    name: '35-39',
    uv: 8.22,
    pv: 9800,
    fill: '#82ca9d',
  },
  {
    name: '40-49',
    uv: 8.63,
    pv: 3908,
    fill: '#a4de6c',
  },
  {
    name: '50+',
    uv: 2.63,
    pv: 4800,
    fill: '#d0ed57',
  },
  {
    name: 'unknown',
    uv: 6.67,
    pv: 4800,
    fill: '#ffc658',
  },
];

// #endregion
const style = {
  top: '50%',
  right: 0,
  transform: 'translate(0, -50%)',
  lineHeight: '24px',
};

const SimpleRadialBarChart = () => {
  return (
    <RadialBarChart
      style={{ width: '100%', maxWidth: '700px', maxHeight: '80vh', aspectRatio: 1.618 }}
      responsive
      cx="30%"
      barSize={14}
      data={data}
    >
      <RadialBar label={{ position: 'insideStart', fill: '#fff' }} background dataKey="uv" />
      <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={style} />
    </RadialBarChart>
  );
};

export default SimpleRadialBarChart;
`;
case "specifiedDomainRadarChart":
      return `// Radar Chart (Specified Domain)
import { Radar, RadarChart, PolarGrid, Legend, PolarAngleAxis, PolarRadiusAxis } from 'recharts';

// #region Sample data
const data = [
  {
    subject: 'Math',
    A: 120,
    B: 110,
    fullMark: 150,
  },
  {
    subject: 'Chinese',
    A: 98,
    B: 130,
    fullMark: 150,
  },
  {
    subject: 'English',
    A: 86,
    B: 130,
    fullMark: 150,
  },
  {
    subject: 'Geography',
    A: 99,
    B: 100,
    fullMark: 150,
  },
  {
    subject: 'Physics',
    A: 85,
    B: 90,
    fullMark: 150,
  },
  {
    subject: 'History',
    A: 65,
    B: 85,
    fullMark: 150,
  },
];

// #endregion
const SpecifiedDomainRadarChart = () => {
  return (
    <RadarChart
      style={{ width: '100%', maxWidth: '500px', maxHeight: '80vh', aspectRatio: 1 }}
      responsive
      outerRadius="80%"
      data={data}
    >
      <PolarGrid />
      <PolarAngleAxis dataKey="subject" />
      <PolarRadiusAxis angle={30} domain={[0, 150]} />
      <Radar name="Mike" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
      <Radar name="Lily" dataKey="B" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
      <Legend />
    </RadarChart>
  );
};

export default SpecifiedDomainRadarChart;
`;
case "pieChartWithNeedle":
      return `// Pie Chart with Needle Gauge

import { Pie, PieChart } from 'recharts';

const RADIAN = Math.PI / 180;
// #region Sample data
const chartData = [
  { name: 'A', value: 80, fill: '#ff0000' },
  { name: 'B', value: 45, fill: '#00ff00' },
  { name: 'C', value: 25, fill: '#0000ff' },
];

// #endregion
type Needle = {
  value: number;
  data: { name: string; value: number; fill: string }[];
  cx: number;
  cy: number;
  iR: number;
  oR: number;
  color: string;
};

const needle = ({ value, data, cx, cy, iR, oR, color }: Needle) => {
  const total = data.reduce((sum, entry) => sum + entry.value, 0);
  const ang = 180.0 * (1 - value / total);
  const length = (iR + 2 * oR) / 3;
  const sin = Math.sin(-RADIAN * ang);
  const cos = Math.cos(-RADIAN * ang);
  const r = 5;
  const x0 = cx + 5;
  const y0 = cy + 5;
  const xba = x0 + r * sin;
  const yba = y0 - r * cos;
  const xbb = x0 - r * sin;
  const ybb = y0 + r * cos;
  const xp = x0 + length * cos;
  const yp = y0 + length * sin;

  return [
    <circle key="needle-circle" cx={x0} cy={y0} r={r} fill={color} stroke="none" />,
    <path
      key="needle-path"
      d={M{xba} {yba}L{xbb} {ybb} L{xp} {yp} L{xba} {yba}}
      stroke="#none"
      fill={color}
    />,
  ];
};

export default function PieChartWithNeedle({ isAnimationActive = true }: { isAnimationActive?: boolean }) {
  const cx = 100;
  const cy = 100;
  const iR = 50;
  const oR = 100;
  const value = 50;

  return (
    <PieChart width={210} height={120} style={{ margin: '0 auto' }}>
      <Pie
        dataKey="value"
        startAngle={180}
        endAngle={0}
        data={chartData}
        cx={cx}
        cy={cy}
        innerRadius={iR}
        outerRadius={oR}
        fill="#8884d8"
        stroke="none"
        isAnimationActive={isAnimationActive}
      />
      {needle({ value, data: chartData, cx, cy, iR, oR, color: '#d0d000' })}
    </PieChart>
  );
}
`;
case "pieChartWithPaddingAngle":
      return `// Pie Chart with Padding & Rounded Corners

import { Pie, PieChart } from 'recharts';

// #region Sample data
const data = [
  { name: 'Group A', value: 400, fill: '#0088FE' },
  { name: 'Group B', value: 300, fill: '#00C49F' },
  { name: 'Group C', value: 300, fill: '#FFBB28' },
  { name: 'Group D', value: 200, fill: '#FF8042' },
];

// #endregion
export default function PieChartWithPaddingAngle({ isAnimationActive = true }: { isAnimationActive?: boolean }) {
  return (
    <PieChart style={{ width: '100%', maxWidth: '500px', maxHeight: '80vh', aspectRatio: 1 }} responsive>
      <Pie
        data={data}
        innerRadius="80%"
        outerRadius="100%"
        // Corner radius is the rounded edge of each pie slice
        cornerRadius="50%"
        fill="#8884d8"
        // padding angle is the gap between each pie slice
        paddingAngle={5}
        dataKey="value"
        isAnimationActive={isAnimationActive}
      />
    </PieChart>
  );
}
`;

case "scatterChartWithCells":
      return `// Scatter Chart (Colored Cells)
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

// #region Sample data
const data = [
  { x: 100, y: 200, z: 200 },
  { x: 120, y: 100, z: 260 },
  { x: 170, y: 300, z: 400 },
  { x: 140, y: 250, z: 280 },
  { x: 150, y: 400, z: 500 },
  { x: 110, y: 280, z: 200 },
];
// #endregion
const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', 'red', 'pink'];

export default function ScatterChartWithCells() {
  return (
    <ScatterChart
      style={{ width: '100%', maxWidth: '300px', maxHeight: '70vh', aspectRatio: 1.618 }}
      responsive
      margin={{
        top: 20,
        right: 0,
        bottom: 0,
        left: 0,
      }}
    >
      <CartesianGrid />
      <XAxis type="number" dataKey="x" name="stature" unit="cm" />
      <YAxis type="number" dataKey="y" name="weight" unit="kg" width="auto" />
      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
      <Scatter name="A school" data={data} fill="#8884d8">
        {data.map((_entry, index) => (
          <Cell key={cell-{index}} fill={COLORS[index % COLORS.length]} />
        ))}
      </Scatter>
    </ScatterChart>
  );
}
`;
case "customActiveShapePieChart":
      return `// Custom Active Shape Pie Chart
import { Pie, PieChart, Sector, SectorProps, Tooltip } from 'recharts';
import { TooltipIndex } from 'recharts/types/state/tooltipSlice';

type Coordinate = {
  x: number;
  y: number;
};

type PieSectorData = {
  percent?: number;
  name?: string | number;
  midAngle?: number;
  middleRadius?: number;
  tooltipPosition?: Coordinate;
  value?: number;
  paddingAngle?: number;
  dataKey?: string;
  payload?: any;
};

type PieSectorDataItem = React.SVGProps<SVGPathElement> & Partial<SectorProps> & PieSectorData;

// #region Sample data
const data = [
  { name: 'Group A', value: 400 },
  { name: 'Group B', value: 300 },
  { name: 'Group C', value: 300 },
  { name: 'Group D', value: 200 },
];

// #endregion
const renderActiveShape = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  startAngle,
  endAngle,
  fill,
  payload,
  percent,
  value,
}: PieSectorDataItem) => {
  const RADIAN = Math.PI / 180;
  const sin = Math.sin(-RADIAN * (midAngle ?? 1));
  const cos = Math.cos(-RADIAN * (midAngle ?? 1));
  const sx = (cx ?? 0) + ((outerRadius ?? 0) + 10) * cos;
  const sy = (cy ?? 0) + ((outerRadius ?? 0) + 10) * sin;
  const mx = (cx ?? 0) + ((outerRadius ?? 0) + 30) * cos;
  const my = (cy ?? 0) + ((outerRadius ?? 0) + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g>
      <text x={cx} y={cy} dy={8} textAnchor="middle" fill={fill}>
        {payload.name}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={(outerRadius ?? 0) + 6}
        outerRadius={(outerRadius ?? 0) + 10}
        fill={fill}
      />
      <path d={M{sx},{sy}L{mx},{my}L{ex},{ey}} stroke={fill} fill="none" />
      <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} textAnchor={textAnchor} fill="#333">{PV {value}}</text>
      <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} textAnchor={textAnchor} fill="#999">
        {(Rate {((percent ?? 1) * 100).toFixed(2)}%)}
      </text>
    </g>
  );
};

export default function CustomActiveShapePieChart({
  isAnimationActive = true,
  defaultIndex = undefined,
}: {
  isAnimationActive?: boolean;
  defaultIndex?: TooltipIndex;
}) {
  return (
    <PieChart
      style={{ width: '100%', maxWidth: '500px', maxHeight: '80vh', aspectRatio: 1 }}
      responsive
      margin={{
        top: 50,
        right: 120,
        bottom: 0,
        left: 120,
      }}
    >
      <Pie
        // @ts-expect-error the parameter type doesn't match
        activeShape={renderActiveShape}
        data={data}
        cx="50%"
        cy="50%"
        innerRadius="60%"
        outerRadius="80%"
        fill="#8884d8"
        dataKey="value"
        isAnimationActive={isAnimationActive}
      />
      <Tooltip content={() => null} defaultIndex={defaultIndex} />
    </PieChart>
  );
}
`;
case "twoLevelPieChart":
  return `
import { PieChart, Pie, Tooltip, Legend } from "recharts";

// #region Sample data
const data01 = [
  { name: "Group A", value: 400 },
  { name: "Group B", value: 300 },
  { name: "Group C", value: 300 },
  { name: "Group D", value: 200 },
];

const data02 = [
  { name: "A1", value: 100 },
  { name: "A2", value: 300 },
  { name: "B1", value: 100 },
  { name: "B2", value: 80 },
  { name: "C1", value: 150 },
  { name: "C2", value: 120 },
  { name: "D1", value: 50 },
  { name: "D2", value: 50 },
];
// #endregion

export default function TwoLevelPieChart({ isAnimationActive = true }) {
  return (
    <PieChart
      style={{
        width: "100%",
        height: "100%",
        maxWidth: "500px",
        maxHeight: "80vh",
        aspectRatio: 1,
      }}
      responsive
    >
      <Tooltip />
      <Legend />
      <Pie
        data={data01}
        dataKey="value"
        cx="50%"
        cy="50%"
        outerRadius="50%"
        fill="#8884d8"
        label
        isAnimationActive={isAnimationActive}
      />
      <Pie
        data={data02}
        dataKey="value"
        cx="50%"
        cy="50%"
        innerRadius="60%"
        outerRadius="80%"
        fill="#82ca9d"
        label
        isAnimationActive={isAnimationActive}
      />
    </PieChart>
  );
}
`;

case "bubbleChart":
      return `// Bubble Chart (Hourly by Day)
import { Scatter, ScatterChart, Tooltip, XAxis, YAxis, ZAxis, TooltipContentProps } from 'recharts';
import { ReactNode } from 'react';

// #region Sample data
const data01 = [
  { hour: '12a', index: 1, value: 170 },
  { hour: '1a', index: 1, value: 180 },
  { hour: '2a', index: 1, value: 150 },
  { hour: '3a', index: 1, value: 120 },
  { hour: '4a', index: 1, value: 200 },
  { hour: '5a', index: 1, value: 300 },
  { hour: '6a', index: 1, value: 400 },
  { hour: '7a', index: 1, value: 200 },
  { hour: '8a', index: 1, value: 100 },
  { hour: '9a', index: 1, value: 150 },
  { hour: '10a', index: 1, value: 160 },
  { hour: '11a', index: 1, value: 170 },
  { hour: '12a', index: 1, value: 180 },
  { hour: '1p', index: 1, value: 144 },
  { hour: '2p', index: 1, value: 166 },
  { hour: '3p', index: 1, value: 145 },
  { hour: '4p', index: 1, value: 150 },
  { hour: '5p', index: 1, value: 170 },
  { hour: '6p', index: 1, value: 180 },
  { hour: '7p', index: 1, value: 165 },
  { hour: '8p', index: 1, value: 130 },
  { hour: '9p', index: 1, value: 140 },
  { hour: '10p', index: 1, value: 170 },
  { hour: '11p', index: 1, value: 180 },
];

const data02 = [
  { hour: '12a', index: 1, value: 160 },
  { hour: '1a', index: 1, value: 180 },
  { hour: '2a', index: 1, value: 150 },
  { hour: '3a', index: 1, value: 120 },
  { hour: '4a', index: 1, value: 200 },
  { hour: '5a', index: 1, value: 300 },
  { hour: '6a', index: 1, value: 100 },
  { hour: '7a', index: 1, value: 200 },
  { hour: '8a', index: 1, value: 100 },
  { hour: '9a', index: 1, value: 150 },
  { hour: '10a', index: 1, value: 160 },
  { hour: '11a', index: 1, value: 160 },
  { hour: '12a', index: 1, value: 180 },
  { hour: '1p', index: 1, value: 144 },
  { hour: '2p', index: 1, value: 166 },
  { hour: '3p', index: 1, value: 145 },
  { hour: '4p', index: 1, value: 150 },
  { hour: '5p', index: 1, value: 160 },
  { hour: '6p', index: 1, value: 180 },
  { hour: '7p', index: 1, value: 165 },
  { hour: '8p', index: 1, value: 130 },
  { hour: '9p', index: 1, value: 140 },
  { hour: '10p', index: 1, value: 160 },
  { hour: '11p', index: 1, value: 180 },
];

// #endregion
const parseDomain = () => [
  0,
  Math.max(
    Math.max.apply(
      null,
      data01.map(entry => entry.value),
    ),
    Math.max.apply(
      null,
      data02.map(entry => entry.value),
    ),
  ),
];

const domain = parseDomain();
const range = [16, 225] as const;
const margin = { top: 10, right: 0, bottom: 0, left: 0 };

const renderTooltip = (props: TooltipContentProps<string | number, string>) => {
  const { active, payload } = props;

  if (active && payload && payload.length) {
    const data = payload[0] && payload[0].payload;

    return (
      <div
        style={{
          backgroundColor: '#fff',
          border: '1px solid #999',
          margin: 0,
          padding: 10,
        }}
      >
        <p>{data.hour}</p>
        <p>
          <span>value: </span>
          {data.value}
        </p>
      </div>
    );
  }

  return null;
};

const BubbleAxes = ({ day, showXTicks = false }: { day: string; showXTicks?: boolean }) => (
  <>
    <XAxis
      type="category"
      dataKey="hour"
      name="hour"
      interval={0}
      tick={showXTicks || { fontSize: 0 }}
      tickLine={{ transform: 'translate(0, -6)' }}
    />
    <YAxis
      type="number"
      dataKey="index"
      name="sunday"
      height={10}
      width={80}
      tick={false}
      tickLine={false}
      axisLine={false}
      label={{ value: day, position: 'insideRight' }}
    />
    <ZAxis type="number" dataKey="value" domain={domain} range={range} />
  </>
);

const MyTooltip = () => (
  <Tooltip cursor={{ strokeDasharray: '3 3' }} wrapperStyle={{ zIndex: 100 }} content={renderTooltip} />
);

const Bubbles = ({ data }: { data: Array<unknown> }) => <Scatter data={data} fill="#8884d8" />;

const DayChart = ({ children }: { children: ReactNode }) => (
  <ScatterChart
    margin={margin}
    style={{ width: '100%', minWidth: '700px', maxWidth: '900px', height: '60px' }}
    responsive
  >
    {children}
  </ScatterChart>
);

const BubbleChart = () => {
  return (
    <div style={{ width: '100%', maxWidth: '900px' }}>
      <DayChart>
        <BubbleAxes day="Sunday" />
        <Bubbles data={data01} />
        <MyTooltip />
      </DayChart>

      <DayChart>
        <BubbleAxes day="Monday" />
        <Bubbles data={data02} />
        <MyTooltip />
      </DayChart>

      <DayChart>
        <BubbleAxes day="Tuesday" />
        <Bubbles data={data01} />
        <MyTooltip />
      </DayChart>

      <DayChart>
        <BubbleAxes day="Wednesday" />
        <Bubbles data={data02} />
        <MyTooltip />
      </DayChart>

      <DayChart>
        <BubbleAxes day="Thursday" />
        <Bubbles data={data01} />
        <MyTooltip />
      </DayChart>

      <DayChart>
        <BubbleAxes day="Friday" />
        <Bubbles data={data02} />
        <MyTooltip />
      </DayChart>

      <DayChart>
        <BubbleAxes day="Saturday" showXTicks />
        <Bubbles data={data01} />
        <MyTooltip />
      </DayChart>
    </div>
  );
};

export default BubbleChart;
`;
case "pieChartInFlexbox":
      return `// Pie Chart in Flexbox Layout

import { PieChart, Pie, Label } from 'recharts';

// #region Sample data
const data = [
  { name: 'Group A', value: 400, fill: '#0088FE' },
  { name: 'Group B', value: 300, fill: '#00C49F' },
  { name: 'Group C', value: 300, fill: '#FFBB28' },
  { name: 'Group D', value: 200, fill: '#FF8042' },
];

// #endregion
const MyPie = () => (
  <Pie data={data} dataKey="value" nameKey="name" outerRadius="80%" innerRadius="60%" isAnimationActive={false} />
);

/**
 * This example shows how to use the responsive prop on charts inside a flexbox container.
 * The responsive prop makes the chart automatically resize to fit its parent container.
 * By combining it with flexbox properties and CSS like maxWidth or aspectRatio,
 * you can create complex and responsive chart layouts.
 */
export default function PieChartInFlexbox() {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        width: '100%',
        minHeight: '300px',
        border: '1px solid #ccc',
        padding: '10px',
        justifyContent: 'space-around',
        alignItems: 'stretch',
      }}
    >
      <PieChart responsive style={{ height: 'calc(100% - 20px)', width: '33%', flex: '1 1 200px', aspectRatio: 1 }}>
        <MyPie />
        <Label position="center" fill="#666">
          Flex: 1 1 200px
        </Label>
      </PieChart>

      <PieChart responsive style={{ height: 'calc(100% - 20px)', width: '33%', maxWidth: '300px', aspectRatio: 1 }}>
        <MyPie />
        <Label position="center" fill="#666">
          maxWidth: &#39;300px&#39;
        </Label>
      </PieChart>

      <PieChart responsive style={{ height: 'calc(100% - 20px)', maxHeight: '20vh', width: '33%', aspectRatio: 1 }}>
        <MyPie />
        <Label position="center" fill="#666">
          maxHeight: &#39;20vh&#39;
        </Label>
      </PieChart>
    </div>
  );
}
`;
case "verticalComposedChart":
      return `// Vertical Composed Chart
import { ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// #region Sample data
const data = [
  {
    name: 'Page A',
    uv: 590,
    pv: 800,
    amt: 1400,
  },
  {
    name: 'Page B',
    uv: 868,
    pv: 967,
    amt: 1506,
  },
  {
    name: 'Page C',
    uv: 1397,
    pv: 1098,
    amt: 989,
  },
  {
    name: 'Page D',
    uv: 1480,
    pv: 1200,
    amt: 1228,
  },
  {
    name: 'Page E',
    uv: 1520,
    pv: 1108,
    amt: 1100,
  },
  {
    name: 'Page F',
    uv: 1400,
    pv: 680,
    amt: 1700,
  },
];

// #endregion
const VerticalComposedChart = () => {
  return (
    <ComposedChart
      layout="vertical"
      style={{ width: '100%', maxWidth: '300px', maxHeight: '70vh', aspectRatio: 1 / 1.618 }}
      responsive
      data={data}
      margin={{
        top: 20,
        right: 0,
        bottom: 0,
        left: 0,
      }}
    >
      <CartesianGrid stroke="#f5f5f5" />
      <XAxis type="number" />
      <YAxis dataKey="name" type="category" scale="band" width="auto" />
      <Tooltip />
      <Legend />
      <Area dataKey="amt" fill="#8884d8" stroke="#8884d8" />
      <Bar dataKey="pv" barSize={20} fill="#413ea0" />
      <Line dataKey="uv" stroke="#ff7300" />
    </ComposedChart>
  );
};

export default VerticalComposedChart;
`;
case "sameDataComposedChart":
    return `
      // Same Data Composed Chart
    import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

    // #region Sample data
    const data = [
    {
        name: 'Page A',
        uv: 590,
        pv: 800,
        amt: 1400,
    },
    {
        name: 'Page B',
        uv: 868,
        pv: 967,
        amt: 1506,
    },
    {
        name: 'Page C',
        uv: 1397,
        pv: 1098,
        amt: 989,
    },
    {
        name: 'Page D',
        uv: 1480,
        pv: 1200,
        amt: 1228,
    },
    {
        name: 'Page E',
        uv: 1520,
        pv: 1108,
        amt: 1100,
    },
    {
        name: 'Page F',
        uv: 1400,
        pv: 680,
        amt: 1700,
    },
    ];

    // #endregion
    const SameDataComposedChart = () => {
    return (
        <ComposedChart
        style={{ width: '100%', maxWidth: '700px', maxHeight: '70vh', aspectRatio: 1.618 }}
        responsive
        data={data}
        margin={{
            top: 20,
            right: 0,
            bottom: 0,
            left: 0,
        }}
        >
        <CartesianGrid stroke="#f5f5f5" />
        <XAxis dataKey="name" scale="band" />
        <YAxis width="auto" />
        <Tooltip />
        <Legend />
        <Bar dataKey="uv" barSize={20} fill="#413ea0" />
        <Line type="monotone" dataKey="uv" stroke="#ff7300" />
        </ComposedChart>
    );
    };

    export default SameDataComposedChart;

    `

case "positiveNegativeBar":
    return `   //Positive & Negative Bar Chart
            import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';

            // #region Sample data
            const data = [
            {
                name: 'Page A',
                uv: 4000,
                pv: 2400,
                amt: 2400,
            },
            {
                name: 'Page B',
                uv: -3000,
                pv: 1398,
                amt: 2210,
            },
            {
                name: 'Page C',
                uv: -2000,
                pv: -9800,
                amt: 2290,
            },
            {
                name: 'Page D',
                uv: 2780,
                pv: 3908,
                amt: 2000,
            },
            {
                name: 'Page E',
                uv: -1890,
                pv: 4800,
                amt: 2181,
            },
            {
                name: 'Page F',
                uv: 2390,
                pv: -3800,
                amt: 2500,
            },
            {
                name: 'Page G',
                uv: 3490,
                pv: 4300,
                amt: 2100,
            },
            ];

            // #endregion
            const PositiveAndNegativeBarChart = () => {
            return (
                <BarChart
                style={{ width: '100%', maxWidth: '700px', maxHeight: '70vh', aspectRatio: 1.618 }}
                responsive
                data={data}
                margin={{
                    top: 5,
                    right: 0,
                    left: 0,
                    bottom: 5,
                }}
                >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis width="auto" />
                <Tooltip />
                <Legend />
                <ReferenceLine y={0} stroke="#000" />
                <Bar dataKey="pv" fill="#8884d8" />
                <Bar dataKey="uv" fill="#82ca9d" />
                </BarChart>
            );
            };

            export default PositiveAndNegativeBarChart;

    
    `

case "customShapeBar":
    return `  //Custom Shape Bar Chart
        import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, BarProps } from 'recharts';

        const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', 'red', 'pink'];

        // #region Sample data
        const data = [
        {
            name: 'Page A',
            uv: 4000,
            pv: 2400,
            amt: 2400,
        },
        {
            name: 'Page B',
            uv: 3000,
            pv: 1398,
            amt: 2210,
        },
        {
            name: 'Page C',
            uv: 2000,
            pv: 9800,
            amt: 2290,
        },
        {
            name: 'Page D',
            uv: 2780,
            pv: 3908,
            amt: 2000,
        },
        {
            name: 'Page E',
            uv: 1890,
            pv: 4800,
            amt: 2181,
        },
        {
            name: 'Page F',
            uv: 2390,
            pv: 3800,
            amt: 2500,
        },
        {
            name: 'Page G',
            uv: 3490,
            pv: 4300,
            amt: 2100,
        },
        ];

        // #endregion
        const getPath = (x: number, y: number, width: number, height: number) => {
        return M{x},{y + height}C{x + width / 3},{y + height} {x + width / 2},{y + height / 3}
        {x + width / 2}, {y}
        C{x + width / 2},{y + height / 3} {x + (2 * width) / 3},{y + height} {x + width}, {y + height}
        Z
        };

        const TriangleBar = (props: BarProps) => {
        const { fill, x, y, width, height } = props;

        return <path d={getPath(Number(x), Number(y), Number(width), Number(height))} stroke="none" fill={fill} />;
        };

        export default function CustomShapeBarChart() {
        return (
            <BarChart
            style={{ width: '100%', maxWidth: '700px', maxHeight: '70vh', aspectRatio: 1.618 }}
            responsive
            data={data}
            margin={{
                top: 20,
                right: 0,
                left: 0,
                bottom: 5,
            }}
            >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis width="auto" />
            <Bar dataKey="uv" fill="#8884d8" shape={TriangleBar} label={{ position: 'top' }}>
                {data.map((_entry, index) => (
                <Cell key={cell-{index}} fill={colors[index % 20]} />
                ))}
            </Bar>
            </BarChart>
        );
        }

    `;
    case "straightAnglePieChart":
      return `// Straight Angle Pie Chart (Semi Circle)
import { Pie, PieChart } from 'recharts';

// #region Sample data
const data = [
  { name: 'Group A', value: 400 },
  { name: 'Group B', value: 300 },
  { name: 'Group C', value: 300 },
  { name: 'Group D', value: 200 },
  { name: 'Group E', value: 278 },
  { name: 'Group F', value: 189 },
];

// #endregion
export default function StraightAnglePieChart({ isAnimationActive = true }: { isAnimationActive?: boolean }) {
  return (
    <PieChart style={{ width: '100%', maxWidth: '500px', maxHeight: '80vh', aspectRatio: 2 }} responsive>
      <Pie
        dataKey="value"
        startAngle={180}
        endAngle={0}
        data={data}
        cx="50%"
        cy="100%"
        outerRadius="120%"
        fill="#8884d8"
        label
        isAnimationActive={isAnimationActive}
      />
    </PieChart>
  );
}
`;
case "areaFillByValue":
  return `// Area Chart (Fill by Value)
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

// #region Sample data
const data = [
  {
    name: 'Page A',
    uv: 4000,
    pv: 2400,
    amt: 2400,
  },
  {
    name: 'Page B',
    uv: 3000,
    pv: 1398,
    amt: 2210,
  },
  {
    name: 'Page C',
    uv: -1000,
    pv: 9800,
    amt: 2290,
  },
  {
    name: 'Page D',
    uv: 500,
    pv: 3908,
    amt: 2000,
  },
  {
    name: 'Page E',
    uv: -2000,
    pv: 4800,
    amt: 2181,
  },
  {
    name: 'Page F',
    uv: -250,
    pv: 3800,
    amt: 2500,
  },
  {
    name: 'Page G',
    uv: 3490,
    pv: 4300,
    amt: 2100,
  },
];

// #endregion
const gradientOffset = () => {
  const dataMax = Math.max(...data.map(i => i.uv));
  const dataMin = Math.min(...data.map(i => i.uv));

  if (dataMax <= 0) {
    return 0;
  }
  if (dataMin >= 0) {
    return 1;
  }

  return dataMax / (dataMax - dataMin);
};

const off = gradientOffset();

const AreaChartFillByValue = () => {
  return (
    <AreaChart
      style={{
        width: '100%',
        maxWidth: '700px',
        maxHeight: '70vh',
        aspectRatio: 1.618,
      }}
      responsive
      data={data}
      margin={{
        top: 10,
        right: 0,
        left: 0,
        bottom: 0,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis width="auto" />
      <Tooltip />
      <defs>
        <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="green" stopOpacity={1} />
          <stop offset={off} stopColor="green" stopOpacity={0.1} />
          <stop offset={off} stopColor="red" stopOpacity={0.1} />
          <stop offset="1" stopColor="red" stopOpacity={1} />
        </linearGradient>
      </defs>
      <Area type="monotone" dataKey="uv" stroke="#000" fill="url(#splitColor)" />
    </AreaChart>
  );
};

export default AreaChartFillByValue;
`;

 case 'areaConnectNull':
    return `
    import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

// #region Sample data
const data = [
  {
    name: 'Page A',
    uv: 4000,
    pv: 2400,
    amt: 2400,
  },
  {
    name: 'Page B',
    uv: 3000,
    pv: 1398,
    amt: 2210,
  },
  {
    name: 'Page C',
    uv: 2000,
    pv: 9800,
    amt: 2290,
  },
  {
    name: 'Page D',
    pv: 3908,
    amt: 2000,
  },
  {
    name: 'Page E',
    uv: 1890,
    pv: 4800,
    amt: 2181,
  },
  {
    name: 'Page F',
    uv: 2390,
    pv: 3800,
    amt: 2500,
  },
  {
    name: 'Page G',
    uv: 3490,
    pv: 4300,
    amt: 2100,
  },
];

// #endregion
const AreaChartConnectNulls = () => {
  return (
    <>
      <AreaChart
        style={{ width: '100%', maxWidth: '700px', maxHeight: '30vh', aspectRatio: 1.618 }}
        responsive
        data={data}
        margin={{
          top: 20,
          right: 0,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis width="auto" />
        <Tooltip />
        <Area type="monotone" dataKey="uv" stroke="#8884d8" fill="#8884d8" />
      </AreaChart>

      <AreaChart
        style={{ width: '100%', maxWidth: '700px', maxHeight: '30vh', aspectRatio: 1.618 }}
        responsive
        data={data}
        margin={{
          top: 20,
          right: 0,
          left: 0,
          bottom: 0,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis width="auto" />
        <Tooltip />
        <Area connectNulls type="monotone" dataKey="uv" stroke="#8884d8" fill="#8884d8" />
      </AreaChart>
    </>
  );
};

export default AreaChartConnectNulls;
`
    case "cardinalArea":
  return `// Cardinal Area Chart (Recharts)
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import { curveCardinal } from 'd3-shape';

// #region Sample data
const data = [
  {
    name: 'Page A',
    uv: 4000,
    pv: 2400,
    amt: 2400,
  },
  {
    name: 'Page B',
    uv: 3000,
    pv: 1398,
    amt: 2210,
  },
  {
    name: 'Page C',
    uv: 2000,
    pv: 9800,
    amt: 2290,
  },
  {
    name: 'Page D',
    uv: 2780,
    pv: 3908,
    amt: 2000,
  },
  {
    name: 'Page E',
    uv: 1890,
    pv: 4800,
    amt: 2181,
  },
  {
    name: 'Page F',
    uv: 2390,
    pv: 3800,
    amt: 2500,
  },
  {
    name: 'Page G',
    uv: 3490,
    pv: 4300,
    amt: 2100,
  },
];

// #endregion
const cardinal = curveCardinal.tension(0.2);

const CardinalAreaChart = () => {
  return (
    <AreaChart
      style={{ width: '100%', maxWidth: '700px', maxHeight: '70vh', aspectRatio: 1.618 }}
      responsive
      data={data}
      margin={{
        top: 20,
        right: 0,
        left: 0,
        bottom: 0,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis width="auto" />
      <Tooltip />
      <Area type="monotone" dataKey="uv" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
      <Area type={cardinal} dataKey="uv" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
    </AreaChart>
  );
};

export default CardinalAreaChart;
`; 

case "brushBar":
    return ` 
     // Brush Bar Chart

     import { BarChart, Bar, Brush, ReferenceLine, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

    // #region Sample data
    const data = [
    { name: '1', uv: 300, pv: 456 },
    { name: '2', uv: -145, pv: 230 },
    { name: '3', uv: -100, pv: 345 },
    { name: '4', uv: -8, pv: 450 },
    { name: '5', uv: 100, pv: 321 },
    { name: '6', uv: 9, pv: 235 },
    { name: '7', uv: 53, pv: 267 },
    { name: '8', uv: 252, pv: -378 },
    { name: '9', uv: 79, pv: -210 },
    { name: '10', uv: 294, pv: -23 },
    { name: '12', uv: 43, pv: 45 },
    { name: '13', uv: -74, pv: 90 },
    { name: '14', uv: -71, pv: 130 },
    { name: '15', uv: -117, pv: 11 },
    { name: '16', uv: -186, pv: 107 },
    { name: '17', uv: -16, pv: 926 },
    { name: '18', uv: -125, pv: 653 },
    { name: '19', uv: 222, pv: 366 },
    { name: '20', uv: 372, pv: 486 },
    { name: '21', uv: 182, pv: 512 },
    { name: '22', uv: 164, pv: 302 },
    { name: '23', uv: 316, pv: 425 },
    { name: '24', uv: 131, pv: 467 },
    { name: '25', uv: 291, pv: -190 },
    { name: '26', uv: -47, pv: 194 },
    { name: '27', uv: -415, pv: 371 },
    { name: '28', uv: -182, pv: 376 },
    { name: '29', uv: -93, pv: 295 },
    { name: '30', uv: -99, pv: 322 },
    { name: '31', uv: -52, pv: 246 },
    { name: '32', uv: 154, pv: 33 },
    { name: '33', uv: 205, pv: 354 },
    { name: '34', uv: 70, pv: 258 },
    { name: '35', uv: -25, pv: 359 },
    { name: '36', uv: -59, pv: 192 },
    { name: '37', uv: -63, pv: 464 },
    { name: '38', uv: -91, pv: -2 },
    { name: '39', uv: -66, pv: 154 },
    { name: '40', uv: -50, pv: 186 },
    ];

    // #endregion
    const BrushBarChart = () => {
    return (
        <BarChart
        style={{ width: '100%', maxWidth: '700px', maxHeight: '70vh', aspectRatio: 1.618 }}
        responsive
        data={data}
        margin={{
            top: 5,
            right: 0,
            left: 0,
            bottom: 5,
        }}
        >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis width="auto" />
        <Tooltip />
        <Legend verticalAlign="top" wrapperStyle={{ lineHeight: '40px' }} />
        <ReferenceLine y={0} stroke="#000" />
        <Brush dataKey="name" height={30} stroke="#8884d8" />
        <Bar dataKey="pv" fill="#8884d8" />
        <Bar dataKey="uv" fill="#82ca9d" />
        </BarChart>
    );
    };

    export default BrushBarChart;


    `

    case "dottedLine":
         return `import { CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from 'recharts';

// #region Sample data
const data = [
  {
    name: 'Page A',
    uv: 4000,
    pv: 2400,
    amt: 2400,
  },
  {
    name: 'Page B',
    uv: 3000,
    pv: 1398,
    amt: 2210,
  },
  {
    name: 'Page C',
    uv: 2000,
    pv: 9800,
    amt: 2290,
  },
  {
    name: 'Page D',
    uv: 2780,
    pv: 3908,
    amt: 2000,
  },
  {
    name: 'Page E',
    uv: 1890,
    pv: 4800,
    amt: 2181,
  },
  {
    name: 'Page F',
    uv: 2390,
    pv: 3800,
    amt: 2500,
  },
  {
    name: 'Page G',
    uv: 3490,
    pv: 4300,
    amt: 2100,
  },
];

// #endregion
export default function Example() {
  return (
    <LineChart
      style={{ width: '100%', maxWidth: '700px', maxHeight: '70vh', aspectRatio: 1.618 }}
      responsive
      data={data}
      margin={{
        top: 15,
        right: 0,
        left: 0,
        bottom: 5,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis width="auto" />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="pv" stroke="#8884d8" strokeDasharray="5 5" />
      <Line type="monotone" dataKey="uv" stroke="#82ca9d" strokeDasharray="3 4 5 2" />
    </LineChart>
  );
}
`;
case "stackedArea":
  return `// Stacked Area Chart (Recharts)
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

// #region Sample data
const data = [
  {
    name: 'Page A',
    uv: 4000,
    pv: 2400,
    amt: 2400,
  },
  {
    name: 'Page B',
    uv: 3000,
    pv: 1398,
    amt: 2210,
  },
  {
    name: 'Page C',
    uv: 2000,
    pv: 9800,
    amt: 2290,
  },
  {
    name: 'Page D',
    uv: 2780,
    pv: 3908,
    amt: 2000,
  },
  {
    name: 'Page E',
    uv: 1890,
    pv: 4800,
    amt: 2181,
  },
  {
    name: 'Page F',
    uv: 2390,
    pv: 3800,
    amt: 2500,
  },
  {
    name: 'Page G',
    uv: 3490,
    pv: 4300,
    amt: 2100,
  },
];

// #endregion
const StackedAreaChart = () => {
  return (
    <AreaChart
      style={{ width: '100%', maxWidth: '700px', maxHeight: '70vh', aspectRatio: 1.618 }}
      responsive
      data={data}
      margin={{
        top: 20,
        right: 0,
        left: 0,
        bottom: 0,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis width="auto" />
      <Tooltip />
      <Area type="monotone" dataKey="uv" stackId="1" stroke="#8884d8" fill="#8884d8" />
      <Area type="monotone" dataKey="pv" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
      <Area type="monotone" dataKey="amt" stackId="1" stroke="#ffc658" fill="#ffc658" />
    </AreaChart>
  );
};

export default StackedAreaChart;
`;


    case "area":
   
      return `// AreaChart example (Recharts)
<ResponsiveContainer width="100%" height={260}>
  <AreaChart data={demoData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
    <defs>
      <linearGradient id="gradUv" x1="0" y1="0" x2="0" y2="1">
        <stop offset="5%" stopColor="${palette[0]}" stopOpacity={0.8}/>
        <stop offset="95%" stopColor="${palette[0]}" stopOpacity={0}/>
      </linearGradient>
    </defs>
    <XAxis dataKey="name"/>
    <YAxis/>
    <Tooltip/>
    <Area type="monotone" dataKey="uv" stroke="${palette[0]}" fill="url(#gradUv)" />
  </AreaChart>
</ResponsiveContainer>`;
    case "bar":
      return `// BarChart example (Recharts)
<ResponsiveContainer width="100%" height={260}>
  <BarChart data={demoData}>
    <CartesianGrid strokeDasharray="3 3" />
    <XAxis dataKey="name" />
    <YAxis />
    <Tooltip />
    <Legend />
    <Bar dataKey="pv" fill="${palette[1]}">
      <LabelList dataKey="pv" position="top" />
    </Bar>
    <Bar dataKey="uv" fill="${palette[0]}">
      <LabelList dataKey="uv" position="top" />
    </Bar>
  </BarChart>
</ResponsiveContainer>`;
    case "composed":
      return `// ComposedChart example (Recharts)
<ResponsiveContainer width="100%" height={300}>
  <ComposedChart data={demoData}>
    <CartesianGrid strokeDasharray="3 3"/>
    <XAxis dataKey="name"/>
    <YAxis/>
    <Tooltip/>
    <Legend/>
    <Area type="monotone" dataKey="amt" fill="${palette[2]}" stroke="${palette[2]}"/>
    <Bar dataKey="pv" barSize={20} fill="${palette[1]}"/>
    <Line type="monotone" dataKey="uv" stroke="${palette[0]}"/>
  </ComposedChart>
</ResponsiveContainer>`;
    case "tinyLine":
  return `import { Line, LineChart } from 'recharts';

// #region Sample data
const data = [
  {
    name: 'Page A',
    uv: 4000,
    pv: 2400,
    amt: 2400,
  },
  {
    name: 'Page B',
    uv: 3000,
    pv: 1398,
    amt: 2210,
  },
  {
    name: 'Page C',
    uv: 2000,
    pv: 9800,
    amt: 2290,
  },
  {
    name: 'Page D',
    uv: 2780,
    pv: 3908,
    amt: 2000,
  },
  {
    name: 'Page E',
    uv: 1890,
    pv: 4800,
    amt: 2181,
  },
  {
    name: 'Page F',
    uv: 2390,
    pv: 3800,
    amt: 2500,
  },
  {
    name: 'Page G',
    uv: 3490,
    pv: 4300,
    amt: 2100,
  },
];

// #endregion
export default function Example() {
  return (
    <LineChart style={{ maxHeight: 'min(100px, 100%)', aspectRatio: 1.618 }} responsive data={data}>
      <Line type="monotone" dataKey="pv" stroke="#8884d8" strokeWidth={2} />
    </LineChart>
  );
}
`;

    case "pie":
      return `// PieChart example (Recharts)
<ResponsiveContainer width="100%" height={260}>
  <PieChart>
    <Pie data={demoData} dataKey="uv" nameKey="name" outerRadius={80} label>
      ${palette.map((c,i)=>`<Cell key={i} fill="${c}" />`).join("\n      ")}
    </Pie>
    <Tooltip/>
  </PieChart>
</ResponsiveContainer>`;
    case "radial":
      return `// RadialBarChart example (Recharts)
<ResponsiveContainer width="100%" height={240}>
  <RadialBarChart data={demoData.map((d,i)=>({ name:d.name, value:d.score, fill:"${palette[i%palette.length]}" }))} innerRadius="10%" outerRadius="80%" barSize={12}>
    <RadialBar minAngle={15} label background clockWise dataKey="value" />
    <Legend />
  </RadialBarChart>
</ResponsiveContainer>`;
    case "scatter":
      return `// ScatterChart example (Recharts)
<ResponsiveContainer width="100%" height={260}>
  <ScatterChart>
    <CartesianGrid />
    <XAxis dataKey="uv" name="uv"/>
    <YAxis dataKey="pv" name="pv"/>
    <Tooltip cursor={{ strokeDasharray: '3 3' }}/>
    <Scatter name="Points" data={demoData} fill="${palette[0]}" />
  </ScatterChart>
</ResponsiveContainer>`;
    case "radar":
      return `// RadarChart example (Recharts)
<ResponsiveContainer width="100%" height={320}>
  <RadarChart outerRadius={120} data={[
    { subject: 'Math', A: 120, B: 110, fullMark: 150 },
    { subject: 'Chinese', A: 98, B: 130, fullMark: 150 },
  ]}>
    <PolarGrid />
    <PolarAngleAxis dataKey="subject" />
    <PolarRadiusAxis />
    <Radar name="Mike" dataKey="A" stroke="${palette[0]}" fill="${palette[0]}" fillOpacity={0.6}/>
  </RadarChart>
</ResponsiveContainer>`;
case "jointLineScatterChart":
      return `// Joint Line Scatter Chart
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// #region Sample data
const data01 = [
  { x: 10, y: 30 },
  { x: 30, y: 200 },
  { x: 45, y: 100 },
  { x: 50, y: 400 },
  { x: 70, y: 150 },
  { x: 100, y: 250 },
];
const data02 = [
  { x: 30, y: 20 },
  { x: 50, y: 180 },
  { x: 75, y: 240 },
  { x: 100, y: 100 },
  { x: 120, y: 190 },
];

// #endregion
const JointLineScatterChart = () => {
  return (
    <ScatterChart
      style={{ width: '100%', maxWidth: '700px', maxHeight: '70vh', aspectRatio: 1.618 }}
      responsive
      margin={{
        top: 20,
        right: 0,
        bottom: 0,
        left: 0,
      }}
    >
      <CartesianGrid />
      <XAxis type="number" dataKey="x" name="stature" unit="cm" />
      <YAxis type="number" dataKey="y" name="weight" unit="kg" width="auto" />
      <ZAxis type="number" range={[100, 100]} />
      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
      <Legend />
      <Scatter name="A school" data={data01} fill="#8884d8" line shape="cross" />
      <Scatter name="B school" data={data02} fill="#82ca9d" line shape="diamond" />
    </ScatterChart>
  );
};

export default JointLineScatterChart;
`;
    case "treemap":
      return `// Treemap example (Recharts)
<ResponsiveContainer width="100%" height={320}>
  <Treemap data={[
    { name: 'A', size: 400 },
    { name: 'B', size: 300 },
    { name: 'C', size: 200 },
  ]} dataKey="size" ratio={4/3} stroke="#fff" />
</ResponsiveContainer>`;
    case "funnel":
      return `// Funnel example (Recharts)
<ResponsiveContainer width="100%" height={320}>
  <FunnelChart>
    <Tooltip />
    <Funnel data={[
      { name: 'Visit', value: 600 },
      { name: 'SignUp', value: 400 },
      { name: 'Pay', value: 200 },
    ]} dataKey="value" isAnimationActive>
      <LabelList position="right" />
    </Funnel>
  </FunnelChart>
</ResponsiveContainer>`;

    case "verticalLine":
  return `import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// #region Sample data
const data = [
  {
    name: 'Page A',
    uv: 4000,
    pv: 2400,
    amt: 2400,
  },
  {
    name: 'Page B',
    uv: 3000,
    pv: 1398,
    amt: 2210,
  },
  {
    name: 'Page C',
    uv: 2000,
    pv: 9800,
    amt: 2290,
  },
  {
    name: 'Page D',
    uv: 2780,
    pv: 3908,
    amt: 2000,
  },
  {
    name: 'Page E',
    uv: 1890,
    pv: 4800,
    amt: 2181,
  },
  {
    name: 'Page F',
    uv: 2390,
    pv: 3800,
    amt: 2500,
  },
  {
    name: 'Page G',
    uv: 3490,
    pv: 4300,
    amt: 2100,
  },
];

// #endregion
export default function Example() {
  return (
    <LineChart
      layout="vertical"
      style={{ width: '100%', maxWidth: '300px', maxHeight: '70vh', aspectRatio: 1 / 1.618 }}
      responsive
      data={data}
      margin={{
        top: 20,
        right: 0,
        left: 0,
        bottom: 5,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis type="number" />
      <YAxis dataKey="name" type="category" width="auto" />
      <Tooltip />
      <Legend />
      <Line dataKey="pv" stroke="#8884d8" />
      <Line dataKey="uv" stroke="#82ca9d" />
    </LineChart>
  );
}
`;
        case "lineWithReference":
        return `// Line Chart with Reference Lines (Recharts)
        import { CartesianGrid, Legend, Line, LineChart, ReferenceLine, Tooltip, XAxis, YAxis } from 'recharts';

// #region Sample data
const data = [
  {
    name: 'Page A',
    uv: 4000,
    pv: 2400,
    amt: 2400,
  },
  {
    name: 'Page B',
    uv: 3000,
    pv: 1398,
    amt: 2210,
  },
  {
    name: 'Page C',
    uv: 2000,
    pv: 9800,
    amt: 2290,
  },
  {
    name: 'Page D',
    uv: 2780,
    pv: 3908,
    amt: 2000,
  },
  {
    name: 'Page E',
    uv: 1890,
    pv: 4800,
    amt: 2181,
  },
  {
    name: 'Page F',
    uv: 2390,
    pv: 3800,
    amt: 2500,
  },
  {
    name: 'Page G',
    uv: 3490,
    pv: 4300,
    amt: 2100,
  },
];

// #endregion
export default function Example() {
  return (
    <LineChart
      style={{ width: '100%', maxWidth: '700px', maxHeight: '70vh', aspectRatio: 1.618 }}
      responsive
      data={data}
      margin={{
        top: 20,
        right: 0,
        left: 0,
        bottom: 5,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis width="auto" />
      <Tooltip />
      <Legend />
      <ReferenceLine x="Page C" stroke="red" label="Max PV PAGE" />
      <ReferenceLine y={9800} label="Max" stroke="red" />
      <Line type="monotone" dataKey="pv" stroke="#8884d8" />
      <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
    </LineChart>
  );
}
`;
case "bandedChart":
      return `// Banded Chart (Range + Line)
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  DefaultLegendContent,
  DefaultLegendContentProps,
  DefaultTooltipContent,
} from 'recharts';
import { TooltipContentProps } from 'recharts/types/component/Tooltip';

// #region Sample data
const data = [
  {
    name: 'Page A',
    a: [0, 0],
    b: 0,
  },
  {
    name: 'Page B',
    a: [50, 300],
    b: 106,
  },
  {
    name: 'Page C',
    a: [150, 423],
    b: 229,
  },
  {
    name: 'Page D',
    b: 312,
  },
  {
    name: 'Page E',
    a: [367, 678],
    b: 451,
  },
  {
    name: 'Page F',
    a: [305, 821],
    b: 623,
  },
];

// #endregion
const renderTooltipWithoutRange = ({ payload, content, ...rest }: TooltipContentProps<string | number, string>) => {
  const newPayload = payload.filter(x => x.dataKey !== 'a');
  return <DefaultTooltipContent payload={newPayload} {...rest} />;
};

const renderLegendWithoutRange = ({ payload, content, ref, ...rest }: DefaultLegendContentProps) => {
  const newPayload = payload?.filter(x => x.dataKey !== 'a');
  return <DefaultLegendContent payload={newPayload} {...rest} />;
};

export default function BandedChart() {
  return (
    <ComposedChart
      style={{ width: '100%', maxWidth: '700px', maxHeight: '70vh', aspectRatio: 1.618 }}
      responsive
      data={data}
      margin={{
        top: 20,
        right: 0,
        left: 0,
        bottom: 0,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis width="auto" />
      <Tooltip content={renderTooltipWithoutRange} />
      <Area type="monotone" dataKey="a" stroke="none" fill="#cccccc" connectNulls dot={false} activeDot={false} />
      <Line type="natural" dataKey="b" stroke="#ff00ff" connectNulls />
      <Legend content={renderLegendWithoutRange} />
    </ComposedChart>
  );
}
`;
case "lineBarAreaComposedChart":
    return `  // Line-Bar-Area Composed Chart
    import { ComposedChart, Line, Area, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Scatter } from 'recharts';

    // #region Sample data
    const data = [
    {
        name: 'Page A',
        uv: 590,
        pv: 800,
        amt: 1400,
        cnt: 490,
    },
    {
        name: 'Page B',
        uv: 868,
        pv: 967,
        amt: 1506,
        cnt: 590,
    },
    {
        name: 'Page C',
        uv: 1397,
        pv: 1098,
        amt: 989,
        cnt: 350,
    },
    {
        name: 'Page D',
        uv: 1480,
        pv: 1200,
        amt: 1228,
        cnt: 480,
    },
    {
        name: 'Page E',
        uv: 1520,
        pv: 1108,
        amt: 1100,
        cnt: 460,
    },
    {
        name: 'Page F',
        uv: 1400,
        pv: 680,
        amt: 1700,
        cnt: 380,
    },
    ];

    // #endregion
    const LineBarAreaComposedChart = () => {
    return (
        <ComposedChart
        style={{ width: '100%', maxWidth: '700px', maxHeight: '70vh', aspectRatio: 1.618 }}
        responsive
        data={data}
        margin={{
            top: 20,
            right: 0,
            bottom: 0,
            left: 0,
        }}
        >
        <CartesianGrid stroke="#f5f5f5" />
        <XAxis dataKey="name" scale="band" />
        <YAxis width="auto" />
        <Tooltip />
        <Legend />
        <Area type="monotone" dataKey="amt" fill="#8884d8" stroke="#8884d8" />
        <Bar dataKey="pv" barSize={20} fill="#413ea0" />
        <Line type="monotone" dataKey="uv" stroke="#ff7300" />
        <Scatter dataKey="cnt" fill="red" />
        </ComposedChart>
    );
    };

    export default LineBarAreaComposedChart;

    
    `
case "barMultiXAxis":
    return `  // Bar Chart (Multiple X-Axes)


    import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
    import { ReactNode } from 'react';

    // #region Sample data
    const data = [
    {
        date: '2000-01',
        uv: 4000,
        pv: 2400,
        amt: 2400,
    },
    {
        date: '2000-02',
        uv: 3000,
        pv: 1398,
        amt: 2210,
    },
    {
        date: '2000-03',
        uv: 2000,
        pv: 9800,
        amt: 2290,
    },
    {
        date: '2000-04',
        uv: 2780,
        pv: 3908,
        amt: 2000,
    },
    {
        date: '2000-05',
        uv: 1890,
        pv: 4800,
        amt: 2181,
    },
    {
        date: '2000-06',
        uv: 2390,
        pv: 3800,
        amt: 2500,
    },
    {
        date: '2000-07',
        uv: 3490,
        pv: 4300,
        amt: 2100,
    },
    {
        date: '2000-08',
        uv: 4000,
        pv: 2400,
        amt: 2400,
    },
    {
        date: '2000-09',
        uv: 3000,
        pv: 1398,
        amt: 2210,
    },
    {
        date: '2000-10',
        uv: 2000,
        pv: 9800,
        amt: 2290,
    },
    {
        date: '2000-11',
        uv: 2780,
        pv: 3908,
        amt: 2000,
    },
    {
        date: '2000-12',
        uv: 1890,
        pv: 4800,
        amt: 2181,
    },
    ];

    // #endregion
    const monthTickFormatter = (tick: string | number | Date): string => {
    const date = new Date(tick);

    return String(date.getMonth() + 1);
    };

    const renderQuarterTick = (tickProps: any): ReactNode => {
    const { x, y, payload, width, visibleTicksCount } = tickProps;
    const { value, offset } = payload;
    const date = new Date(value);
    const month = date.getMonth();
    const quarterNo = Math.floor(month / 3) + 1;

    if (month % 3 === 1) {
        return <text x={x + width / visibleTicksCount / 2 - offset} y={y - 4} textAnchor="middle">{Q{quarterNo}}</text>;
    }

    const isLast = month === 11;

    if (month % 3 === 0 || isLast) {
        const pathX = Math.floor(isLast ? x - offset + width / visibleTicksCount : x - offset) + 0.5;

        return <path d={M{pathX},{y - 4}v{-35}} stroke="red" />;
    }
    return null;
    };

    const BarChartWithMultiXAxis = () => {
    return (
        <BarChart
        style={{ width: '100%', maxWidth: '700px', maxHeight: '70vh', aspectRatio: 1.618 }}
        responsive
        data={data}
        margin={{
            top: 25,
            right: 0,
            left: 0,
            bottom: 5,
        }}
        >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tickFormatter={monthTickFormatter} />
        <XAxis
            dataKey="date"
            axisLine={false}
            tickLine={false}
            interval={0}
            tick={renderQuarterTick}
            height={1}
            scale="band"
            xAxisId="quarter"
        />
        <YAxis width="auto" />
        <Tooltip />
        <Legend wrapperStyle={{ paddingTop: '1em' }} />
        <Bar dataKey="pv" fill="#8884d8" />
        <Bar dataKey="uv" fill="#82ca9d" />
        </BarChart>
    );
    };

    export default BarChartWithMultiXAxis;

    `
    case "scatterAndLineOfBestFit":
      return `// Scatter and Line of Best Fit
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Scatter } from 'recharts';

// #region Sample data
const data = [
  { index: 10000, red: 1643, blue: 790 },
  { index: 1666, red: 182, blue: 42 },
  { index: 625, red: 56, blue: 11 },
  // Calculation of line of best fit is not included in this demo
  { index: 300, redLine: 0 },
  { index: 10000, redLine: 1522 },
  { index: 600, blueLine: 0 },
  { index: 10000, blueLine: 678 },
];

// #endregion
const ScatterAndLineOfBestFit = () => {
  return (
    <ComposedChart
      style={{ width: '100%', maxWidth: '700px', maxHeight: '70vh', aspectRatio: 1.618 }}
      responsive
      data={data}
      margin={{
        top: 20,
        right: 0,
        bottom: 0,
        left: 0,
      }}
    >
      <CartesianGrid stroke="#f5f5f5" />
      <Tooltip />
      <Legend />

      <XAxis dataKey="index" type="number" label={{ value: 'Index', position: 'insideBottomRight', offset: 0 }} />
      <YAxis unit="ms" type="number" label={{ value: 'Time', angle: -90, position: 'insideLeft' }} width="auto" />
      <Scatter name="red" dataKey="red" fill="red" />
      <Scatter name="blue" dataKey="blue" fill="blue" />
      <Line dataKey="blueLine" stroke="blue" dot={false} activeDot={false} legendType="none" />
      <Line dataKey="redLine" stroke="red" dot={false} activeDot={false} legendType="none" />
    </ComposedChart>
  );
};

export default ScatterAndLineOfBestFit;
`;
case "customizedDotted":
  return `// Customized Dotted Line Chart example (Recharts)
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { DotItemDotProps } from 'recharts/types/util/types';

// #region Sample data
const data = [
  {
    name: 'Page A',
    uv: 4000,
    pv: 2400,
    amt: 2400,
  },
  {
    name: 'Page B',
    uv: 3000,
    pv: 1398,
    amt: 2210,
  },
  {
    name: 'Page C',
    uv: 2000,
    pv: 9800,
    amt: 2290,
  },
  {
    name: 'Page D',
    uv: 2780,
    pv: 3908,
    amt: 2000,
  },
  {
    name: 'Page E',
    uv: 1890,
    pv: 4800,
    amt: 2181,
  },
  {
    name: 'Page F',
    uv: 2390,
    pv: 3800,
    amt: 2500,
  },
  {
    name: 'Page G',
    uv: 3490,
    pv: 4300,
    amt: 2100,
  },
];

// #endregion
const CustomizedDot = (props: DotItemDotProps) => {
  const { cx, cy, value } = props;

  if (cx == null || cy == null) {
    return <g />;
  }

  if (value > 2500) {
    return (
      <svg x={cx - 10} y={cy - 10} width={20} height={20} fill="red" viewBox="0 0 1024 1024">
        <path d="M512 1009.984c-274.912 0-497.76-222.848-497.76-497.76s222.848-497.76 497.76-497.76c274.912 0 497.76 222.848 497.76 497.76s-222.848 497.76-497.76 497.76zM340.768 295.936c-39.488 0-71.52 32.8-71.52 73.248s32.032 73.248 71.52 73.248c39.488 0 71.52-32.8 71.52-73.248s-32.032-73.248-71.52-73.248zM686.176 296.704c-39.488 0-71.52 32.8-71.52 73.248s32.032 73.248 71.52 73.248c39.488 0 71.52-32.8 71.52-73.248s-32.032-73.248-71.52-73.248zM772.928 555.392c-18.752-8.864-40.928-0.576-49.632 18.528-40.224 88.576-120.256 143.552-208.832 143.552-85.952 0-164.864-52.64-205.952-137.376-9.184-18.912-31.648-26.592-50.08-17.28-18.464 9.408-21.216 21.472-15.936 32.64 52.8 111.424 155.232 186.784 269.76 186.784 117.984 0 217.12-70.944 269.76-186.784 8.672-19.136 9.568-31.2-9.12-40.096z" />
      </svg>
    );
  }

  return (
    <svg x={cx - 10} y={cy - 10} width={20} height={20} fill="green" viewBox="0 0 1024 1024">
      <path d="M517.12 53.248q95.232 0 179.2 36.352t145.92 98.304 98.304 145.92 36.352 179.2-36.352 179.2-98.304 145.92-145.92 98.304-179.2 36.352-179.2-36.352-145.92-98.304-98.304-145.92-36.352-179.2 36.352-179.2 98.304-145.92 145.92-98.304 179.2-36.352zM663.552 261.12q-15.36 0-28.16 6.656t-23.04 18.432-15.872 27.648-5.632 33.28q0 35.84 21.504 61.44t51.2 25.6 51.2-25.6 21.504-61.44q0-17.408-5.632-33.28t-15.872-27.648-23.04-18.432-28.16-6.656zM373.76 261.12q-29.696 0-50.688 25.088t-20.992 60.928 20.992 61.44 50.688 25.6 50.176-25.6 20.48-61.44-20.48-60.928-50.176-25.088zM520.192 602.112q-51.2 0-97.28 9.728t-82.944 27.648-62.464 41.472-35.84 51.2q-1.024 1.024-1.024 2.048-1.024 3.072-1.024 8.704t2.56 11.776 7.168 11.264 12.8 6.144q25.6-27.648 62.464-50.176 31.744-19.456 79.36-35.328t114.176-15.872q67.584 0 116.736 15.872t81.92 35.328q37.888 22.528 63.488 50.176 17.408-5.12 19.968-18.944t0.512-18.944-3.072-7.168-1.024-3.072q-26.624-55.296-100.352-88.576t-176.128-33.28z" />
    </svg>
  );
};

const CustomizedDotLineChart = () => {
  return (
    <LineChart
      style={{ width: '100%', maxWidth: '700px', maxHeight: '70vh', aspectRatio: 1.618 }}
      responsive
      data={data}
      margin={{
        top: 5,
        right: 10,
        left: 0,
        bottom: 5,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis width="auto" />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="pv" stroke="#8884d8" dot={CustomizedDot} />
      <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
    </LineChart>
  );
};

export default CustomizedDotLineChart;
`;
case "threeDimScatterChart":
      return `// 3D Scatter Chart (Z-Axis Scaling)
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

// #region Sample data
const data01 = [
  { x: 100, y: 200, z: 200 },
  { x: 120, y: 100, z: 260 },
  { x: 170, y: 300, z: 400 },
  { x: 140, y: 250, z: 280 },
  { x: 150, y: 400, z: 500 },
  { x: 110, y: 280, z: 200 },
];
const data02 = [
  { x: 200, y: 260, z: 240 },
  { x: 240, y: 290, z: 220 },
  { x: 190, y: 290, z: 250 },
  { x: 198, y: 250, z: 210 },
  { x: 180, y: 280, z: 260 },
  { x: 210, y: 220, z: 230 },
];

// #endregion
const ThreeDimScatterChart = () => {
  return (
    <ScatterChart
      style={{ width: '100%', maxWidth: '700px', maxHeight: '70vh', aspectRatio: 1.618 }}
      responsive
      margin={{
        top: 20,
        right: 0,
        bottom: 0,
        left: 0,
      }}
    >
      <CartesianGrid />
      <XAxis type="number" dataKey="x" name="stature" unit="cm" />
      <YAxis type="number" dataKey="y" name="weight" unit="kg" width="auto" />
      <ZAxis type="number" dataKey="z" range={[60, 400]} name="score" unit="km" />
      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
      <Legend />
      <Scatter name="A school" data={data01} fill="#8884d8" shape="star" />
      <Scatter name="B school" data={data02} fill="#82ca9d" shape="triangle" />
    </ScatterChart>
  );
};

export default ThreeDimScatterChart;
`;



    default:
      return `// Chart not found`;
  }
}

/* ---------- Main Component ---------- */
export default function RevolyxChartsPage() {

  const [paletteName, setPaletteName] = useState("blue");
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortMode, setSortMode] = useState("none"); // none | asc | desc
  const [selectedChartKey, setSelectedChartKey] = useState(ALL_CHARTS[0].key);
  const [expandedSource, setExpandedSource] = useState({});
  const inputRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    if (!selectedChartKey) return;

    // ✅ ensures loader paints before chart heavy render
    setIsLoading(true);
    requestAnimationFrame(() => {
      const timeout = setTimeout(() => setIsLoading(false), 700); // feel smooth, not abrupt
      return () => clearTimeout(timeout);
    });
  }, [selectedChartKey]);
useEffect(() => {
  const params = new URLSearchParams(window.location.search);
  const chartFromUrl = params.get("charts");
  if (chartFromUrl && ALL_CHARTS.some(c => c.key === chartFromUrl)) {
    setSelectedChartKey(chartFromUrl);
  }
}, []);
const navigate=useNavigate()
const {theme}=useTheme()
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const filteredCharts = useMemo(()=>{
    const base = ALL_CHARTS.filter(c => c.title.toLowerCase().includes(searchTerm.toLowerCase()) || c.key.toLowerCase().includes(searchTerm.toLowerCase()));
    return sortCharts(base, sortMode === "none" ? null : sortMode);
  },[searchTerm, sortMode]);

  function handleChartClick(key) {
    setSelectedChartKey(key);
    const newUrl = `${window.location.origin}${window.location.pathname}?chart=${key}`;
     window.history.pushState({ key }, "", newUrl);
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast("Chart loaded", { description: `Loaded ${key} preview` });
  }

  const handleToggleSource = () => {
    const isExpanded = expandedSource[selectedChartKey];
    setExpandedSource(prev => ({
      ...prev,
      [selectedChartKey]: !isExpanded,
    }));

    toast(isExpanded ? "Source hidden" : "Source shown", {
      description: isExpanded
        ? "Chart source code is now hidden."
        : "Chart source code is now visible.",
    });
  };

  const handleCopySource = () => {
    copyToClipboard(generateChartSource(selectedChartKey, paletteName));
    toast.success("Copied!", {
      description: "Chart source code copied to clipboard successfully.",
    });
  };

  function renderPreview(key) {
    const palette = COLOR_THEMES[paletteName] || COLOR_THEMES.blue;
    const commonProps = { data: demoData };

    switch (key) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart {...commonProps} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3"  />
              <XAxis dataKey="name"  />
              <YAxis  />
              <Tooltip 
              contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: "#e4e4e7",
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }}  />
              <Legend />
              <Line type="monotone" dataKey="uv" stroke={palette[0]} strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="pv" stroke={palette[1]} strokeWidth={2} dot={{ r: 3 }} />
              <Brush dataKey="name" height={20} stroke={palette[2]} />
            </LineChart>
          </ResponsiveContainer>
        );
        case "threeDimScatterChart":
  return (
    <ResponsiveContainer width="100%" height={260}>
    <ScatterChart
      
      responsive
      margin={{
        top: 20,
        right: 0,
        bottom: 0,
        left: 0,
      }}
    >
      <CartesianGrid />
      <XAxis type="number" dataKey="x" name="stature" unit="cm" />
      <YAxis type="number" dataKey="y" name="weight" unit="kg" width="auto" />
      <ZAxis type="number" dataKey="z" range={[60, 400]} name="score" unit="km" />
       <Tooltip 
               contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: palette[0],
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }} 
            itemStyle={{
                color: palette[3], // text color
                textTransform: "capitalize",
            }}
            labelStyle={{
                color: palette[2],
                fontWeight: "500",
                marginBottom: "0.25rem",
            }}
            cursor={{ fill: "rgba(113,113,122,0.2)" }}
             />
      <Legend />
      <Scatter
        name="A school"
        data={[
          { x: 100, y: 200, z: 200 },
          { x: 120, y: 100, z: 260 },
          { x: 170, y: 300, z: 400 },
          { x: 140, y: 250, z: 280 },
          { x: 150, y: 400, z: 500 },
          { x: 110, y: 280, z: 200 },
        ]}
        fill={palette[1]}
        shape="star"
      />
      <Scatter
        name="B school"
        data={[
          { x: 200, y: 260, z: 240 },
          { x: 240, y: 290, z: 220 },
          { x: 190, y: 290, z: 250 },
          { x: 198, y: 250, z: 210 },
          { x: 180, y: 280, z: 260 },
          { x: 210, y: 220, z: 230 },
        ]}
        fill={palette[4]}
        shape="triangle"
      />
    </ScatterChart>
    </ResponsiveContainer>
  );

        case "stackedArea":
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart
       {...commonProps} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis width="auto" />
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(24,24,27,0.9)",
            border: "1px solid rgba(113,113,122,0.4)",
            borderRadius: "0.75rem",
            backdropFilter: "blur(8px)",
            color: "#e4e4e7",
            fontSize: "0.875rem",
            padding: "0.5rem 0.75rem",
          }}
        />
        <Area type="monotone" dataKey="uv" stackId="1" stroke={palette[0]} fill={palette[0]} />
        <Area type="monotone" dataKey="pv" stackId="1" stroke={palette[1]} fill={palette[1]} />
        <Area type="monotone" dataKey="amt" stackId="1" stroke={palette[2]} fill={palette[2]} />
      </AreaChart>
    </ResponsiveContainer>
  );
case "areaFillByValue": {
  // Compute gradient offset dynamically
  const gradientOffset = () => {
    const dataMax = Math.max(...demoData.map((i) => i.uv));
    const dataMin = Math.min(...demoData.map((i) => i.uv));

    if (dataMax <= 0) return 0;
    if (dataMin >= 0) return 1;
    return dataMax / (dataMax - dataMin);
  };
  

  const off = gradientOffset();

  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart
        {...commonProps}
        margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(24,24,27,0.9)",
            border: "1px solid rgba(113,113,122,0.4)",
            borderRadius: "0.75rem",
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            color: palette[1],
            fontSize: "0.875rem",
            padding: "0.5rem 0.75rem",
          }}
        />
        {/* Define the dynamic gradient */}
        <defs>
          <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#22c55e" stopOpacity={1} />
            <stop offset={off} stopColor="#22c55e" stopOpacity={0.1} />
            <stop offset={off} stopColor="#ef4444" stopOpacity={0.1} />
            <stop offset="1" stopColor="#ef4444" stopOpacity={1} />
          </linearGradient>
        </defs>

        <Area
          type="monotone"
          dataKey="uv"
          stroke={palette[1]}
          fill={palette[1]}
          fillOpacity={0.8}
          isAnimationActive={true}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
case "scatterAndLineOfBestFit":
  return (
     <ResponsiveContainer width="100%" height={260}>
    <ComposedChart
     
      responsive
      data={[
        { index: 10000, red: 1643, blue: 790 },
        { index: 1666, red: 182, blue: 42 },
        { index: 625, red: 56, blue: 11 },
        // line of best fit (precomputed)
        { index: 300, redLine: 0 },
        { index: 10000, redLine: 1522 },
        { index: 600, blueLine: 0 },
        { index: 10000, blueLine: 678 },
      ]}
      margin={{
        top: 20,
        right: 0,
        bottom: 0,
        left: 0,
      }}
    >
      <CartesianGrid stroke="#f5f5f5" />
       <Tooltip 
               contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: palette[0],
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }} 
            itemStyle={{
                color: palette[3], // text color
                textTransform: "capitalize",
            }}
            labelStyle={{
                color: palette[2],
                fontWeight: "500",
                marginBottom: "0.25rem",
            }}
            cursor={{ fill: "rgba(113,113,122,0.2)" }}
             />
      <Legend />
      <XAxis
        dataKey="index"
        type="number"
        label={{ value: "Index", position: "insideBottomRight", offset: 0 }}
      />
      <YAxis
        unit="ms"
        type="number"
        label={{ value: "Time", angle: -90, position: "insideLeft" }}
        width="auto"
      />
      <Scatter name="A" dataKey="red" fill={palette[1]} />
      <Scatter name="B" dataKey="blue" fill={palette[4]} />
      <Line dataKey="blueLine" stroke={palette[1]} dot={false} activeDot={false} legendType="none" />
      <Line dataKey="redLine" stroke={palette[4]} dot={false} activeDot={false} legendType="none" />
    </ComposedChart>
    </ResponsiveContainer>
  );


  case "areaConnectNull":
  return (
    <>
      <ResponsiveContainer width="100%" height={130}>
        <AreaChart
         data={demoData2} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis width="auto" />
               <Tooltip 
               contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: palette[0],
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }} 
            
             />
          <Area
            type="monotone"
            dataKey="uv"
            stroke={palette[0]}
            fill={palette[0]}
          />
        </AreaChart>
      </ResponsiveContainer>

      <ResponsiveContainer width="100%" height={130}>
        <AreaChart
          data={demoData2} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis width="auto" />
              <Tooltip 
               contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: palette[1],
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }} 
            
             />
          <Area
            connectNulls
            type="monotone"
            dataKey="uv"
            stroke={palette[1]}
            fill={palette[1]}
          />
        </AreaChart>
      </ResponsiveContainer>
    </>
  );


      case "dottedLine":
        return (
            <ResponsiveContainer width="100%" height={260}>
            <LineChart
             {...commonProps} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis width="auto" />
                <Tooltip
                contentStyle={{
                    backgroundColor: "rgba(24,24,27,0.9)",
                    border: "1px solid rgba(113,113,122,0.4)",
                    borderRadius: "0.75rem",
                    backdropFilter: "blur(8px)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                    color: "#e4e4e7",
                    fontSize: "0.875rem",
                    padding: "0.5rem 0.75rem",
                }}
                />
                <Legend />
                <Line type="monotone" dataKey="pv" stroke={palette[0]} strokeDasharray="5 5" strokeWidth={2} />
                <Line type="monotone" dataKey="uv" stroke={palette[0]} strokeDasharray="3 4 5 2" strokeWidth={2} />
            </LineChart>
            </ResponsiveContainer>
        );
  
      case "area":
        return (
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart {...commonProps} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gradUv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={palette[0]} stopOpacity={0.8}/>
                  <stop offset="95%" stopColor={palette[0]} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name"  />
              <YAxis  />
              <Tooltip 
               contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: "#e4e4e7",
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }}  />
              <Area type="monotone" dataKey="uv" stroke={palette[0]} fill="url(#gradUv)" />
            </AreaChart>
          </ResponsiveContainer>
        );
      case "tinyLine":
        return (
            <ResponsiveContainer width="100%" height={260}>
            <LineChart
                {...commonProps} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
               
            >
                     <Tooltip 
               contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: palette[0],
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }} 
            
             />
                <Line
                type="monotone"
                dataKey="pv"
                stroke={palette[0]}
                strokeWidth={2}
                dot={false}
                fill={palette[0]}
                />
            </LineChart>
            </ResponsiveContainer>
        );
        case "pieChartWithPaddingAngle":
  return (
     <ResponsiveContainer width="100%" height={260}>
    <PieChart
     
      responsive
    >
      <Pie
        data={[
          { name: "Group A", value: 400, fill: palette[1] },
          { name: "Group B", value: 300, fill: palette[2] },
          { name: "Group C", value: 300, fill: palette[3] },
          { name: "Group D", value: 200, fill: palette[4] },
        ]}
        innerRadius="80%"
        outerRadius="100%"
        cornerRadius="50%"
        paddingAngle={5}
        dataKey="value"
        isAnimationActive
      />
       <Tooltip 
               contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: palette[0],
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }} 
            itemStyle={{
                color: palette[3], // text color
                textTransform: "capitalize",
            }}
            labelStyle={{
                color: palette[2],
                fontWeight: "500",
                marginBottom: "0.25rem",
            }}
            cursor={{ fill: "rgba(113,113,122,0.2)" }}
             />
    </PieChart>
    </ResponsiveContainer>
  );
  case "specifiedDomainRadarChart":
  const radarData = [
    { subject: "Math", A: 120, B: 110, fullMark: 150 },
    { subject: "Chinese", A: 98, B: 130, fullMark: 150 },
    { subject: "English", A: 86, B: 130, fullMark: 150 },
    { subject: "Geography", A: 99, B: 100, fullMark: 150 },
    { subject: "Physics", A: 85, B: 90, fullMark: 150 },
    { subject: "History", A: 65, B: 85, fullMark: 150 },
  ];

  return (
    <RadarChart
      responsive
      outerRadius="80%"
      data={radarData}
      style={{ width: "100%", maxWidth: "500px", maxHeight: "80vh", aspectRatio: 1 }}
    >
      <PolarGrid />
      <PolarAngleAxis dataKey="subject" />
      <PolarRadiusAxis angle={30} domain={[0, 150]} />
      <Radar name="Mike" dataKey="A" stroke={palette[1]} fill={palette[1]} fillOpacity={0.6} />
      <Radar name="Lily" dataKey="B" stroke={palette[2]} fill={palette[2]} fillOpacity={0.6} />
      <Legend />
       <Tooltip 
               contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: palette[0],
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }} 
            itemStyle={{
                color: palette[3], // text color
                textTransform: "capitalize",
            }}
            labelStyle={{
                color: palette[2],
                fontWeight: "500",
                marginBottom: "0.25rem",
            }}
            cursor={{ fill: "rgba(113,113,122,0.2)" }}
             />
    </RadarChart>
  );



        case "brushBar":
  return (
    <BarChart
      style={{
        width: '100%',
        maxWidth: '700px',
        maxHeight: '70vh',
        aspectRatio: 1.618,
      }}
      responsive
      data={[
        { name: '1', uv: 300, pv: 456 },
        { name: '2', uv: -145, pv: 230 },
        { name: '3', uv: -100, pv: 345 },
        { name: '4', uv: -8, pv: 450 },
        { name: '5', uv: 100, pv: 321 },
        { name: '6', uv: 9, pv: 235 },
        { name: '7', uv: 53, pv: 267 },
        { name: '8', uv: 252, pv: -378 },
        { name: '9', uv: 79, pv: -210 },
        { name: '10', uv: 294, pv: -23 },
        { name: '12', uv: 43, pv: 45 },
        { name: '13', uv: -74, pv: 90 },
        { name: '14', uv: -71, pv: 130 },
        { name: '15', uv: -117, pv: 11 },
        { name: '16', uv: -186, pv: 107 },
        { name: '17', uv: -16, pv: 926 },
        { name: '18', uv: -125, pv: 653 },
        { name: '19', uv: 222, pv: 366 },
        { name: '20', uv: 372, pv: 486 },
        { name: '21', uv: 182, pv: 512 },
        { name: '22', uv: 164, pv: 302 },
        { name: '23', uv: 316, pv: 425 },
        { name: '24', uv: 131, pv: 467 },
        { name: '25', uv: 291, pv: -190 },
        { name: '26', uv: -47, pv: 194 },
        { name: '27', uv: -415, pv: 371 },
        { name: '28', uv: -182, pv: 376 },
        { name: '29', uv: -93, pv: 295 },
        { name: '30', uv: -99, pv: 322 },
        { name: '31', uv: -52, pv: 246 },
        { name: '32', uv: 154, pv: 33 },
        { name: '33', uv: 205, pv: 354 },
        { name: '34', uv: 70, pv: 258 },
        { name: '35', uv: -25, pv: 359 },
        { name: '36', uv: -59, pv: 192 },
        { name: '37', uv: -63, pv: 464 },
        { name: '38', uv: -91, pv: -2 },
        { name: '39', uv: -66, pv: 154 },
        { name: '40', uv: -50, pv: 186 },
      ]}
      margin={{
        top: 5,
        right: 0,
        left: 0,
        bottom: 5,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis width="auto" />
           <Tooltip 
               contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: palette[0],
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }} 
            itemStyle={{
                color: palette[2], // text color
                textTransform: "capitalize",
            }}
            labelStyle={{
                color: palette[1],
                fontWeight: "500",
                marginBottom: "0.25rem",
            }}
            cursor={{ fill: "rgba(113,113,122,0.2)" }}
             />
      <Legend verticalAlign="top" wrapperStyle={{ lineHeight: '40px' }} />
      <ReferenceLine y={0} stroke="#000" />
      <Brush dataKey="name" height={30} stroke="#8884d8" />
      <Bar dataKey="pv" fill={palette[0]} />
      <Bar dataKey="uv" fill={palette[3]} />
    </BarChart>
  );
  case "bandedChart":
  return (
     <ResponsiveContainer width="100%" height={260}>
    <ComposedChart
     
      responsive
      data={[
        { name: "Page A", a: [0, 0], b: 0 },
        { name: "Page B", a: [50, 300], b: 106 },
        { name: "Page C", a: [150, 423], b: 229 },
        { name: "Page D", b: 312 },
        { name: "Page E", a: [367, 678], b: 451 },
        { name: "Page F", a: [305, 821], b: 623 },
      ]}
      margin={{
        top: 20,
        right: 0,
        left: 0,
        bottom: 0,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis width="auto" />
      <Tooltip 
               contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: palette[0],
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }} 
            itemStyle={{
                color: palette[3], // text color
                textTransform: "capitalize",
            }}
            labelStyle={{
                color: palette[2],
                fontWeight: "500",
                marginBottom: "0.25rem",
            }}
            cursor={{ fill: "rgba(113,113,122,0.2)" }}
             />
      <Area
        type="monotone"
        dataKey="a"
        stroke="none"
        fill={palette[4]}
        connectNulls
        dot={false}
        activeDot={false}
      />
      <Line type="natural" dataKey="b" stroke={palette[1]} connectNulls />
      <Legend/>
    </ComposedChart>
    </ResponsiveContainer>
  );

  
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3"  />
              <XAxis dataKey="name"  />
              <YAxis />
             <Tooltip 
               contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: "#e4e4e7",
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }}  />
              <Legend />
              <Bar dataKey="pv" fill={palette[1]}><LabelList dataKey="pv" position="top" /></Bar>
              <Bar dataKey="uv" fill={palette[0]}><LabelList dataKey="uv" position="top" /></Bar>
            </BarChart>
          </ResponsiveContainer>
        );
        case "customShapeBar": {
  const data = [
    { name: "Page A", uv: 4000, pv: 2400, amt: 2400 },
    { name: "Page B", uv: 3000, pv: 1398, amt: 2210 },
    { name: "Page C", uv: 2000, pv: 9800, amt: 2290 },
    { name: "Page D", uv: 2780, pv: 3908, amt: 2000 },
    { name: "Page E", uv: 1890, pv: 4800, amt: 2181 },
    { name: "Page F", uv: 2390, pv: 3800, amt: 2500 },
    { name: "Page G", uv: 3490, pv: 4300, amt: 2100 },
  ];

  const colors = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#ef4444", "#e879f9"];

  // Custom triangle path for bar shape
  const getPath = (x, y, width, height) => {
    return `
      M${x},${y + height}
      C${x + width / 3},${y + height} ${x + width / 2},${y + height / 3}
      ${x + width / 2},${y}
      C${x + width / 2},${y + height / 3} ${x + (2 * width) / 3},${y + height} ${x + width},${y + height}
      Z
    `;
  };

  // Reusable triangle shape component
  const TriangleBar = (props) => {
    const { fill, x, y, width, height } = props;
    return (
      <path
        d={getPath(Number(x), Number(y), Number(width), Number(height))}
        stroke="none"
        fill={palette[0]}
      />
    );
  };

  return (
    <ResponsiveContainer width="100%" height={260}>
      <BarChart
        data={data}
        margin={{
          top: 20,
          right: 0,
          left: 0,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
            <Tooltip 
               contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: palette[0],
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }} 
            itemStyle={{
                color: palette[0], // text color
                textTransform: "capitalize",
            }}
            labelStyle={{
                color: palette[0],
                fontWeight: "500",
                marginBottom: "0.25rem",
            }}
            cursor={{ fill: "rgba(113,113,122,0.2)" }}
             />
        <Bar
          dataKey="uv"
          shape={<TriangleBar />}
          label={{ position: "top", fill: "#cbd5e1", fontSize: 12 }}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
// In your chart render switch
case "customActiveShapePieChart":
  return <CustomActiveShapePieChart palette={palette} />;

case "twoLevelPieChart":
  return (<PieChart
      style={{
        width: "100%",
        
        aspectRatio: 1,
      }}
      height={260}
      responsive
    >
       <Tooltip 
               contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: palette[0],
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }} 
            itemStyle={{
                color: palette[3], // text color
                textTransform: "capitalize",
            }}
            labelStyle={{
                color: palette[2],
                fontWeight: "500",
                marginBottom: "0.25rem",
            }}
            cursor={{ fill: "rgba(113,113,122,0.2)" }}
             />
      <Legend />
      <Pie
        data={data001}
        dataKey="value"
        cx="50%"
        cy="50%"
        outerRadius="50%"
        fill={palette[4]}
        label
        isAnimationActive={isAnimationActive}
      />
      <Pie
        data={data002}
        dataKey="value"
        cx="50%"
        cy="50%"
        innerRadius="60%"
        outerRadius="80%"
        fill={palette[1]}
        label
        isAnimationActive={isAnimationActive}
      />
    </PieChart>)

      case "composed":
        return (
          <ResponsiveContainer width="100%" height={260}>
            <ComposedChart {...commonProps}>
              <CartesianGrid strokeDasharray="3 3"  />
              <XAxis dataKey="name"  />
              <YAxis  />
             <Tooltip 
               contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: "#e4e4e7",
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }}  />
              <Legend />
              <Area type="monotone" dataKey="amt" fill={palette[2]} stroke={palette[2]} />
              <Bar dataKey="pv" barSize={20} fill={palette[1]} />
              <Line type="monotone" dataKey="uv" stroke={palette[0]} />
              <ReferenceLine y={2500} label="Goal" stroke={palette[3]} strokeDasharray="3 3" />
            </ComposedChart>
          </ResponsiveContainer>
        );
        case "scatterChartWithCells":
  return (
    <ResponsiveContainer width="100%" height={260}>
    <ScatterChart
     
      responsive
      margin={{
        top: 20,
        right: 0,
        bottom: 0,
        left: 0,
      }}
    >
      <CartesianGrid />
      <XAxis type="number" dataKey="x" name="stature" unit="cm" />
      <YAxis type="number" dataKey="y" name="weight" unit="kg" width="auto" />
      <Tooltip 
               contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: palette[0],
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }} 
            itemStyle={{
                color: palette[3], // text color
                textTransform: "capitalize",
            }}
            labelStyle={{
                color: palette[2],
                fontWeight: "500",
                marginBottom: "0.25rem",
            }}
            cursor={{ fill: "rgba(113,113,122,0.2)" }}
             />
      <Scatter
        name="A school"
        data={[
          { x: 100, y: 200, z: 200 },
          { x: 120, y: 100, z: 260 },
          { x: 170, y: 300, z: 400 },
          { x: 140, y: 250, z: 280 },
          { x: 150, y: 400, z: 500 },
          { x: 110, y: 280, z: 200 },
        ]}
        fill={palette[4]}
      >
        {palette.map((color, index) => (
          <Cell key={`cell-${index}`} fill={color} />
        ))}
      </Scatter>
    </ScatterChart>
    </ResponsiveContainer>
  );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={demoData} dataKey="uv" nameKey="name" outerRadius={80} label>
                {demoData.map((entry, idx) => <Cell key={idx} fill={palette[idx % palette.length]} />)}
              </Pie>
             <Tooltip 
               contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: "#e4e4e7",
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }} itemStyle={{
                color: "#f4f4f5", // text color
                textTransform: "capitalize",
            }}
            labelStyle={{
                color: "#a1a1aa",
                fontWeight: "500",
                marginBottom: "0.25rem",
            }}
            cursor={{ fill: "rgba(113,113,122,0.2)" }}
             />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      case "radial":
        return (
          <ResponsiveContainer width="100%" height={260}>
            <RadialBarChart data={demoData.map((d,i)=>({ name:d.name, value:d.score, fill:palette[i%palette.length] }))} innerRadius="10%" outerRadius="80%" barSize={12}>
              <RadialBar minAngle={15} label background clockWise dataKey="value" />
                   <Tooltip 
                    contentStyle={{
                        backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                        border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                        borderRadius: "0.75rem",
                        backdropFilter: "blur(8px)",
                        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                        color: "#e4e4e7",
                        fontSize: "0.875rem",
                        padding: "0.5rem 0.75rem",
                    }} 
                    itemStyle={{
                        color: "#f4f4f5", // text color
                        textTransform: "capitalize",
                    }}
                    labelStyle={{
                        color: "#a1a1aa",
                        fontWeight: "500",
                        marginBottom: "0.25rem",
                    }}
                    cursor={{ fill: "rgba(113,113,122,0.2)" }}
                    />
              <Legend />
            </RadialBarChart>
          </ResponsiveContainer>
        );
        case "straightAnglePieChart":
  return (
    <ResponsiveContainer width="100%" height={260}>
    <PieChart
      
    >
      <Pie
        dataKey="value"
        startAngle={180}
        endAngle={0}
        data={[
          { name: "Group A", value: 400 },
          { name: "Group B", value: 300 },
          { name: "Group C", value: 300 },
          { name: "Group D", value: 200 },
          { name: "Group E", value: 278 },
          { name: "Group F", value: 189 },
        ]}
        cx="50%"
        cy="100%"
        outerRadius="120%"
        fill={palette[1]}
        label
        isAnimationActive
      />
       <Tooltip 
               contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: palette[0],
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }} 
            itemStyle={{
                color: palette[3], // text color
                textTransform: "capitalize",
            }}
            labelStyle={{
                color: palette[2],
                fontWeight: "500",
                marginBottom: "0.25rem",
            }}
            cursor={{ fill: "rgba(113,113,122,0.2)" }}
             />
    </PieChart>
    </ResponsiveContainer>
  );
case "simpleRadialBarChart":
  const radialData = [
    { name: "18-24", uv: 31.47, pv: 2400, fill: palette[0] },
    { name: "25-29", uv: 26.69, pv: 4567, fill: palette[1] },
    { name: "30-34", uv: 15.69, pv: 1398, fill:palette[2] },
    { name: "35-39", uv: 8.22, pv: 9800, fill: palette[0] },
    { name: "40-49", uv: 8.63, pv: 3908, fill: palette[3] },
    { name: "50+", uv: 2.63, pv: 4800, fill: palette[4] },
    { name: "unknown", uv: 6.67, pv: 4800, fill: palette[2] },
  ];

  const legendStyle = {
    top: "50%",
    right: 0,
    transform: "translate(0, -50%)",
    lineHeight: "24px",
  };

  return (
    <RadialBarChart
      responsive
      cx="30%"
      barSize={14}
      data={radialData}
      style={{ width: "100%", maxWidth: "700px", maxHeight: "80vh", aspectRatio: 1.618 }}
    >
      <RadialBar
        label={{ position: "insideStart", fill: "#000" }}
        background
        dataKey="uv"
      />
       <Tooltip 
               contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: palette[0],
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }} 
            itemStyle={{
                color: palette[3], // text color
                textTransform: "capitalize",
            }}
            labelStyle={{
                color: palette[2],
                fontWeight: "500",
                marginBottom: "0.25rem",
            }}
            cursor={{ fill: "rgba(113,113,122,0.2)" }}
             />
      <Legend
        iconSize={10}
        layout="vertical"
        verticalAlign="middle"
        wrapperStyle={legendStyle}
      />
    </RadialBarChart>
  );

        case "cardinalArea":
            return(
                <ResponsiveContainer width="100%" height={260}>
            <AreaChart
                {...commonProps} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis width="auto" />
                <Tooltip
                contentStyle={{
                    backgroundColor: "rgba(24,24,27,0.9)",
                    border: "1px solid rgba(113,113,122,0.4)",
                    borderRadius: "0.75rem",
                    backdropFilter: "blur(8px)",
                    color: palette[0],
                    fontSize: "0.875rem",
                    padding: "0.5rem 0.75rem",
                }}
                />
                <Area
                type="monotone"
                dataKey="uv"
                stroke={palette[0]}
                fill={palette[0]}
                fillOpacity={0.3}
                />
                <Area
                type="cardinal"
                dataKey="pv"
                stroke={palette[1]}
                fill={palette[1]}
                fillOpacity={0.3}
                />
            </AreaChart>
            </ResponsiveContainer>

            )
        case "positiveNegativeBar":
  return (
    <BarChart
      style={{
        width: '100%',
        maxWidth: '700px',
        maxHeight: '70vh',
        aspectRatio: 1.618,
      }}
      responsive
      data={demoData.map(d => ({
        ...d,
        uv: d.uv * (Math.random() > 0.5 ? 1 : -1),
        pv: d.pv * (Math.random() > 0.5 ? 1 : -1),
      }))} // optional dynamic +/- for demo
      margin={{
        top: 5,
        right: 0,
        left: 0,
        bottom: 5,
      }}
    >
             <Tooltip 
               contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: palette[2],
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }} 
            itemStyle={{
                color: palette[0], // text color
                textTransform: "capitalize",
            }}
            labelStyle={{
                color: palette[1],
                fontWeight: "500",
                marginBottom: "0.25rem",
            }}
            cursor={{ fill: "rgba(113,113,122,0.2)" }}
             />
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis width="auto" />
      
      <Legend />
      <ReferenceLine y={0} stroke="#000" />
      <Bar dataKey="pv" fill={palette[0]} />
      <Bar dataKey="uv" fill={palette[1]} />
    </BarChart>
  );
    
      case "scatter":
        return (
          <ResponsiveContainer width="100%" height={260}>
            <ScatterChart>
              <CartesianGrid  />
              <XAxis dataKey="uv" name="uv"  />
              <YAxis dataKey="pv" name="pv"  />
             <Tooltip 
               contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: "#e4e4e7",
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }} 
            itemStyle={{
                color: palette[0], // text color
                textTransform: "capitalize",
            }}
            labelStyle={{
                color: palette[0],
                fontWeight: "500",
                marginBottom: "0.25rem",
            }}
            cursor={{ fill: "rgba(113,113,122,0.2)" }}
             />
              <Scatter name="Points" data={demoData} fill={palette[0]} />
            </ScatterChart>
          </ResponsiveContainer>
        );
      case "radar":
        return (
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart outerRadius={120} data={[
              { subject: 'Math', A: 120, B: 110, fullMark: 150 },
              { subject: 'Chinese', A: 98, B: 130, fullMark: 150 },
              { subject: 'English', A: 86, B: 130, fullMark: 150 },
            ]}>
              <PolarGrid />
              <PolarAngleAxis dataKey="subject"  />
              <PolarRadiusAxis />
                   <Tooltip 
               contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: "#e4e4e7",
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }} 
           
             />
              <Radar name="Demo" dataKey="A" stroke={palette[0]} fill={palette[0]} fillOpacity={0.6}/>
            </RadarChart>
          </ResponsiveContainer>
        );
      case "treemap":
        return (
          <ResponsiveContainer width="100%" height={260}>
            <Treemap  data={[
              { name: 'A', size: 400 },
              { name: 'B', size: 300 },
              { name: 'C', size: 200 },
            ]} dataKey="size" ratio={4/3} stroke="#fff" fill={palette[0]} fillOpacity={0.6} />
            
          </ResponsiveContainer>
        );
        case "bubbleChart":
  return (
    <div style={{ width: "100%", margin: "0 auto" }}>
        
      {[
        { day: "Sunday", data: data01 },
        { day: "Monday", data: data02 },
        { day: "Tuesday", data: data01 },
        { day: "Wednesday", data: data02 },
        { day: "Thursday", data: data01 },
        { day: "Friday", data: data02 },
        { day: "Saturday", data: data01, showXTicks: true },
      ].map(({ day, data, showXTicks }) => (
        <ScatterChart
          key={day}
          style={{
            width: "100%",
            maxWidth: "900px",
          
            aspectRatio: 2,
          }}
          height={50}
          margin={{ top: 10, right: 0, bottom: 0, left: 0 }}
          responsive
        >
          <XAxis
            type="category"
            dataKey="hour"
            name="hour"
            interval={0}
            tick={showXTicks || { fontSize: 0 }}
            tickLine={{ transform: "translate(0, -6)" }}
          />
          <YAxis
            type="number"
            dataKey="index"
            name={day.toLowerCase()}
            height={10}
            width={80}
            tick={false}
            tickLine={false}
            axisLine={false}
            label={{ value: day, position: "insideRight" }}
          />
          <ZAxis
            type="number"
            dataKey="value"
            domain={[
              0,
              Math.max(
                ...data01.map((e) => e.value),
                ...data02.map((e) => e.value)
              ),
            ]}
            range={[16, 225]}
          />
          <Tooltip 
               contentStyle={{
                backgroundColor: "rgba(24,24,27)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: palette[0],
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }} 
            itemStyle={{
                color: palette[3], // text color
                textTransform: "capitalize",
            }}
            labelStyle={{
                color: palette[2],
                fontWeight: "500",
                marginBottom: "0.25rem",
            }}
            cursor={{ fill: "rgba(113,113,122,0.2)" }}
             />
          <Scatter data={data} fill={palette[0]} />
        </ScatterChart>
      ))}
    </div>
  );

        case "jointLineScatterChart":
  return (
     <ResponsiveContainer width="100%" height={260}>
    <ScatterChart
     
      responsive
      margin={{
        top: 20,
        right: 0,
        bottom: 0,
        left: 0,
      }}
    >
      <CartesianGrid stroke={palette[4]} />
      <XAxis type="number" dataKey="x" name="stature" unit="cm" />
      <YAxis type="number" dataKey="y" name="weight" unit="kg" width="auto" />
      <ZAxis type="number" range={[100, 100]} />
       <Tooltip 
               contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: palette[0],
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }} 
            itemStyle={{
                color: palette[3], // text color
                textTransform: "capitalize",
            }}
            labelStyle={{
                color: palette[2],
                fontWeight: "500",
                marginBottom: "0.25rem",
            }}
            cursor={{ fill: "rgba(113,113,122,0.2)" }}
             />
      <Legend />
      <Scatter
        name="A school"
        data={[
          { x: 10, y: 30 },
          { x: 30, y: 200 },
          { x: 45, y: 100 },
          { x: 50, y: 400 },
          { x: 70, y: 150 },
          { x: 100, y: 250 },
        ]}
        fill={palette[1]}
        line
        shape="cross"
      />
      <Scatter
        name="B school"
        data={[
          { x: 30, y: 20 },
          { x: 50, y: 180 },
          { x: 75, y: 240 },
          { x: 100, y: 100 },
          { x: 120, y: 190 },
        ]}
        fill={palette[4]}
        line
        shape="diamond"
      />
    </ScatterChart>
    </ResponsiveContainer>
  );

      case "verticalLine":
        return (
            <ResponsiveContainer width="100%" height={260}>
            <LineChart
                layout="vertical"
               {...commonProps} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} />
                <Tooltip
                contentStyle={{
                    backgroundColor: "rgba(24,24,27,0.9)",
                    border: "1px solid rgba(113,113,122,0.4)",
                    borderRadius: "0.75rem",
                    backdropFilter: "blur(8px)",
                    boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                    color: "#e4e4e7",
                    fontSize: "0.875rem",
                    padding: "0.5rem 0.75rem",
                }}
                />
                <Legend />
                <Line dataKey="pv" stroke={palette[0]} strokeWidth={2} />
                <Line dataKey="uv" stroke={palette[0]} strokeWidth={2} />
            </LineChart>
            </ResponsiveContainer>
        );

        case "lineBarAreaComposedChart":
  return (
    
    <ComposedChart
      style={{ width: "100%", maxHeight: "70vh", aspectRatio: 1.618 }}
      responsive
      data={[
        { name: "Page A", uv: 590, pv: 800, amt: 1400, cnt: 490 },
        { name: "Page B", uv: 868, pv: 967, amt: 1506, cnt: 590 },
        { name: "Page C", uv: 1397, pv: 1098, amt: 989, cnt: 350 },
        { name: "Page D", uv: 1480, pv: 1200, amt: 1228, cnt: 480 },
        { name: "Page E", uv: 1520, pv: 1108, amt: 1100, cnt: 460 },
        { name: "Page F", uv: 1400, pv: 680, amt: 1700, cnt: 380 },
      ]}
      margin={{
        top: 20,
        right: 0,
        bottom: 0,
        left: 0,
      }}
    >
      <CartesianGrid stroke="#f5f5f5" />
      <XAxis dataKey="name" scale="band" />
      <YAxis width="auto" />
           <Tooltip 
               contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: palette[0],
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }} 
            itemStyle={{
                color: palette[3], // text color
                textTransform: "capitalize",
            }}
            labelStyle={{
                color: palette[2],
                fontWeight: "500",
                marginBottom: "0.25rem",
            }}
            cursor={{ fill: "rgba(113,113,122,0.2)" }}
             />
      <Legend />
      <Area type="monotone" dataKey="amt" fill={palette[4]} stroke={palette[4]} />
      <Bar dataKey="pv" barSize={20} fill={palette[0]} />
      <Line type="monotone" dataKey="uv" stroke={palette[1]} />
      <Scatter dataKey="cnt" fill="red" />
    </ComposedChart>
  );

      case "barMultiXAxis":
  const monthTickFormatter = (tick) => {
    const date = new Date(tick);
    return String(date.getMonth() + 1);
  };

  const renderQuarterTick = (tickProps) => {
    const { x, y, payload, width, visibleTicksCount } = tickProps;
    const { value, offset } = payload;
    const date = new Date(value);
    const month = date.getMonth();
    const quarterNo = Math.floor(month / 3) + 1;

    if (month % 3 === 1) {
      return (
        <text
          x={x + width / visibleTicksCount / 2 - offset}
          y={y - 4}
          textAnchor="middle"
          fill="#888"
          fontSize={12}
        >
          {`Q${quarterNo}`}
        </text>
      );
    }

    const isLast = month === 11;

    if (month % 3 === 0 || isLast) {
      const pathX = Math.floor(isLast ? x - offset + width / visibleTicksCount : x - offset) + 0.5;
      return <path d={`M${pathX},${y - 4}v${-35}`} stroke="red" />;
    }
    return null;
  };

  const multiAxisData = [
    { date: '2000-01', uv: 4000, pv: 2400, amt: 2400 },
    { date: '2000-02', uv: 3000, pv: 1398, amt: 2210 },
    { date: '2000-03', uv: 2000, pv: 9800, amt: 2290 },
    { date: '2000-04', uv: 2780, pv: 3908, amt: 2000 },
    { date: '2000-05', uv: 1890, pv: 4800, amt: 2181 },
    { date: '2000-06', uv: 2390, pv: 3800, amt: 2500 },
    { date: '2000-07', uv: 3490, pv: 4300, amt: 2100 },
    { date: '2000-08', uv: 4000, pv: 2400, amt: 2400 },
    { date: '2000-09', uv: 3000, pv: 1398, amt: 2210 },
    { date: '2000-10', uv: 2000, pv: 9800, amt: 2290 },
    { date: '2000-11', uv: 2780, pv: 3908, amt: 2000 },
    { date: '2000-12', uv: 1890, pv: 4800, amt: 2181 },
  ];

  return (
    <BarChart
      style={{ width: '100%',  maxHeight: '70vh', aspectRatio: 1.618 }}
      responsive
      data={multiAxisData}
      margin={{
        top: 25,
        right: 0,
        left: 0,
        bottom: 5,
      }}
    >
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey="date" tickFormatter={monthTickFormatter} />
      <XAxis
        dataKey="date"
        axisLine={false}
        tickLine={false}
        interval={0}
        tick={renderQuarterTick}
        height={1}
        scale="band"
        xAxisId="quarter"
      />
      <YAxis width="auto" />
           <Tooltip 
               contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: palette[2],
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }} 
            itemStyle={{
                color: palette[1], // text color
                textTransform: "capitalize",
            }}
            labelStyle={{
                color: palette[0],
                fontWeight: "500",
                marginBottom: "0.25rem",
            }}
            cursor={{ fill: "rgba(113,113,122,0.2)" }}
             />
      <Legend wrapperStyle={{ paddingTop: '1em' }} />
      <Bar dataKey="pv" fill={palette[0]} />
      <Bar dataKey="uv" fill={palette[4]} />
    </BarChart>
  );
  case "pieChartInFlexbox":
  const flexData = [
    { name: "Group A", value: 400, fill: palette[0] },
    { name: "Group B", value: 300, fill: palette[1] },
    { name: "Group C", value: 300, fill: palette[2] },
    { name: "Group D", value: 200, fill: palette[3] },
  ];

  const FlexPie = () => (
    <Pie
      data={flexData}
      dataKey="value"
      nameKey="name"
      outerRadius="80%"
      innerRadius="60%"
      isAnimationActive={false}
    />
  );

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        width: "100%",
        minHeight: "300px",
      
        padding: "10px",
        justifyContent: "space-around",
        alignItems: "stretch",
      }}
    >
      <PieChart
        responsive
        style={{ height: "calc(100% - 20px)", width: "33%", flex: "1 1 200px", aspectRatio: 1 }}
      >
         <Tooltip 
               contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: palette[0],
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }} 
            itemStyle={{
                color: palette[3], // text color
                textTransform: "capitalize",
            }}
            labelStyle={{
                color: palette[2],
                fontWeight: "500",
                marginBottom: "0.25rem",
            }}
            cursor={{ fill: "rgba(113,113,122,0.2)" }}
             />
        <FlexPie />
        <Label position="center" fill={palette[1]}>
          Flex: 1 1 200px
        </Label>
      </PieChart>

      <PieChart
        responsive
        style={{ height: "calc(100% - 20px)", width: "33%", maxWidth: "300px", aspectRatio: 1 }}
      >
         <Tooltip 
               contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: palette[0],
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }} 
            itemStyle={{
                color: palette[3], // text color
                textTransform: "capitalize",
            }}
            labelStyle={{
                color: palette[2],
                fontWeight: "500",
                marginBottom: "0.25rem",
            }}
            cursor={{ fill: "rgba(113,113,122,0.2)" }}
             />
        <FlexPie />
        <Label position="center" fill={palette[2]}>
          maxWidth: '300px'
        </Label>
      </PieChart>

      <PieChart
        responsive
        style={{ height: "calc(100% - 20px)", maxHeight: "20vh", width: "33%", aspectRatio: 1 }}
      >
         <Tooltip 
               contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: palette[0],
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }} 
            itemStyle={{
                color: palette[3], // text color
                textTransform: "capitalize",
            }}
            labelStyle={{
                color: palette[2],
                fontWeight: "500",
                marginBottom: "0.25rem",
            }}
            cursor={{ fill: "rgba(113,113,122,0.2)" }}
             />
        <FlexPie />
        <Label position="center" fill={palette[4]}>
          maxHeight: '20vh'
        </Label>
      </PieChart>
    </div>
  );

  case "sameDataComposedChart":
  return (
    
    <ComposedChart
      style={{ width: "100%", maxWidth: "700px", maxHeight: "70vh", aspectRatio: 1.618 }}
      responsive
      data={[
        { name: "Page A", uv: 590, pv: 800, amt: 1400 },
        { name: "Page B", uv: 868, pv: 967, amt: 1506 },
        { name: "Page C", uv: 1397, pv: 1098, amt: 989 },
        { name: "Page D", uv: 1480, pv: 1200, amt: 1228 },
        { name: "Page E", uv: 1520, pv: 1108, amt: 1100 },
        { name: "Page F", uv: 1400, pv: 680, amt: 1700 },
      ]}
      margin={{
        top: 20,
        right: 0,
        bottom: 0,
        left: 0,
      }}
    >
      <CartesianGrid stroke="#f5f5f5" />
      <XAxis dataKey="name" scale="band" />
      <YAxis width="auto" />
      <Tooltip 
               contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: palette[0],
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }} 
            itemStyle={{
                color: palette[3], // text color
                textTransform: "capitalize",
            }}
            labelStyle={{
                color: palette[2],
                fontWeight: "500",
                marginBottom: "0.25rem",
            }}
            cursor={{ fill: "rgba(113,113,122,0.2)" }}
             />
      <Legend />
      <Bar dataKey="uv" barSize={20} fill={palette[1]} />
      <Line type="monotone" dataKey="uv" stroke={palette[1]} />
    </ComposedChart>
  );


      case "lineWithReference":
  return (
    <ResponsiveContainer width="100%" height={260}>
      <LineChart
        {...commonProps} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis width="auto" />
        <Tooltip
          contentStyle={{
            backgroundColor: "rgba(24,24,27,0.9)",
            border: "1px solid rgba(113,113,122,0.4)",
            borderRadius: "0.75rem",
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            color: "#e4e4e7",
            fontSize: "0.875rem",
            padding: "0.5rem 0.75rem",
          }}
        />
        <Legend />
        <ReferenceLine x="Page C" stroke="red" label="Max PV PAGE" />
        <ReferenceLine y={9800} stroke="red" label="Max" />
        <Line type="monotone" dataKey="pv" stroke={palette[0]} strokeWidth={2} />
        <Line type="monotone" dataKey="uv" stroke={palette[0]} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
case "pieChartWithNeedle":
  const gaugeData = [
    { name: "A", value: 80, fill: palette[0] },
    { name: "B", value: 45, fill: palette[1] },
    { name: "C", value: 25, fill: palette[2] },
  ];
  const cx = 100;
  const cy = 100;
  const iR = 50;
  const oR = 100;
  const value = 50;
  const RADIAN = Math.PI / 180;

  const drawNeedle = (value, data, cx, cy, iR, oR, color) => {
    const total = data.reduce((sum, entry) => sum + entry.value, 0);
    const ang = 180.0 * (1 - value / total);
    const length = (iR + 2 * oR) / 3;
    const sin = Math.sin(-RADIAN * ang);
    const cos = Math.cos(-RADIAN * ang);
    const r = 5;
    const x0 = cx + 5;
    const y0 = cy + 5;
    const xba = x0 + r * sin;
    const yba = y0 - r * cos;
    const xbb = x0 - r * sin;
    const ybb = y0 + r * cos;
    const xp = x0 + length * cos;
    const yp = y0 + length * sin;

    return (
      <>
        <circle cx={x0} cy={y0} r={r} fill={color} stroke="none" />
        <path d={`M${xba} ${yba}L${xbb} ${ybb} L${xp} ${yp} Z`} fill={color} />
      </>
    );
  };

  return (
    <PieChart width={210} height={120} style={{ margin: "0 auto" }}>
      <Pie
        dataKey="value"
        startAngle={180}
        endAngle={0}
        data={gaugeData}
        cx={cx}
        cy={cy}
        innerRadius={iR}
        outerRadius={oR}
        fill={palette[2]}
        stroke="none"
        isAnimationActive
      />
      {drawNeedle(value, gaugeData, cx, cy, iR, oR, palette[4])}
       <Tooltip 
               contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: palette[0],
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }} 
            itemStyle={{
                color: palette[3], // text color
                textTransform: "capitalize",
            }}
            labelStyle={{
                color: palette[2],
                fontWeight: "500",
                marginBottom: "0.25rem",
            }}
            cursor={{ fill: "rgba(113,113,122,0.2)" }}
             />
    </PieChart>
  );

    case "customizedDotted":
         return (
        <ResponsiveContainer width="100%" height={260}>
        <LineChart
            {...commonProps} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
        >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis width="auto" />
                <Tooltip 
               contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: palette[1],
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }} 
           
             />
            <Legend />
            <Line
            type="monotone"
            dataKey="pv"
            stroke={palette[0]}
            dot={(props) => {
                const { cx, cy, value } = props;
                if (cx == null || cy == null) return null;
                if (value > 2500) {
                return (
                    <svg x={cx - 10} y={cy - 10} width={20} height={20} fill="red" viewBox="0 0 1024 1024">
                    <path d="M512 1009.984c-274.912 0-497.76-222.848-497.76-497.76s222.848-497.76 497.76-497.76c274.912 0 497.76 222.848 497.76 497.76s-222.848 497.76-497.76 497.76zM340.768 295.936c-39.488 0-71.52 32.8-71.52 73.248s32.032 73.248 71.52 73.248c39.488 0 71.52-32.8 71.52-73.248s-32.032-73.248-71.52-73.248zM686.176 296.704c-39.488 0-71.52 32.8-71.52 73.248s32.032 73.248 71.52 73.248c39.488 0 71.52-32.8 71.52-73.248s-32.032-73.248-71.52-73.248zM772.928 555.392c-18.752-8.864-40.928-0.576-49.632 18.528-40.224 88.576-120.256 143.552-208.832 143.552-85.952 0-164.864-52.64-205.952-137.376-9.184-18.912-31.648-26.592-50.08-17.28-18.464 9.408-21.216 21.472-15.936 32.64 52.8 111.424 155.232 186.784 269.76 186.784 117.984 0 217.12-70.944 269.76-186.784 8.672-19.136 9.568-31.2-9.12-40.096z" />
                    </svg>
                );
                }
                return (
                <svg x={cx - 10} y={cy - 10} width={20} height={20} fill="green" viewBox="0 0 1024 1024">
                    <path d="M517.12 53.248q95.232 0 179.2 36.352t145.92 98.304 98.304 145.92 36.352 179.2-36.352 179.2-98.304 145.92-145.92 98.304-179.2 36.352-179.2-36.352-145.92-98.304-98.304-145.92-36.352-179.2 36.352-179.2 98.304-145.92 145.92-98.304 179.2-36.352zM663.552 261.12q-15.36 0-28.16 6.656t-23.04 18.432-15.872 27.648-5.632 33.28q0 35.84 21.504 61.44t51.2 25.6 51.2-25.6 21.504-61.44q0-17.408-5.632-33.28t-15.872-27.648-23.04-18.432-28.16-6.656zM373.76 261.12q-29.696 0-50.688 25.088t-20.992 60.928 20.992 61.44 50.688 25.6 50.176-25.6 20.48-61.44-20.48-60.928-50.176-25.088zM520.192 602.112q-51.2 0-97.28 9.728t-82.944 27.648-62.464 41.472-35.84 51.2q-1.024 1.024-1.024 2.048-1.024 3.072-1.024 8.704t2.56 11.776 7.168 11.264 12.8 6.144q25.6-27.648 62.464-50.176 31.744-19.456 79.36-35.328t114.176-15.872q67.584 0 116.736 15.872t81.92 35.328q37.888 22.528 63.488 50.176 17.408-5.12 19.968-18.944t0.512-18.944-3.072-7.168-1.024-3.072q-26.624-55.296-100.352-88.576t-176.128-33.28z" />
                </svg>
                );
            }}
            />
            <Line type="monotone" dataKey="uv" stroke={palette[1]} />
        </LineChart>
        </ResponsiveContainer>
    );
    case "verticalComposedChart":
  return (
    <ComposedChart
      layout="vertical"
      style={{ width: "100%", maxWidth: "300px", aspectRatio: 1 / 1.618 }}
      responsive
      height={260}
      data={[
        { name: "Page A", uv: 590, pv: 800, amt: 1400 },
        { name: "Page B", uv: 868, pv: 967, amt: 1506 },
        { name: "Page C", uv: 1397, pv: 1098, amt: 989 },
        { name: "Page D", uv: 1480, pv: 1200, amt: 1228 },
        { name: "Page E", uv: 1520, pv: 1108, amt: 1100 },
        { name: "Page F", uv: 1400, pv: 680, amt: 1700 },
      ]}
      margin={{
        top: 20,
        right: 0,
        bottom: 0,
        left: 0,
      }}
    >
      <CartesianGrid stroke={palette[4]} />
      <XAxis type="number" />
      <YAxis dataKey="name" type="category" scale="band" width="auto" />
       <Tooltip 
               contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: palette[0],
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }} 
            itemStyle={{
                color: palette[3], // text color
                textTransform: "capitalize",
            }}
            labelStyle={{
                color: palette[2],
                fontWeight: "500",
                marginBottom: "0.25rem",
            }}
            cursor={{ fill: "rgba(113,113,122,0.2)" }}
             />
      <Legend />
      <Area dataKey="amt" fill={palette[1]} stroke={palette[2]} />
      <Bar dataKey="pv" barSize={20} fill={palette[3]} />
      <Line dataKey="uv" stroke={palette[4]} />
    </ComposedChart>
  );

  
  
      case "funnel":
        return (
          <ResponsiveContainer width="100%" height={260}>
            <FunnelChart>
              <Tooltip
              contentStyle={{
                backgroundColor: "rgba(24,24,27,0.9)", // dark zinc overlay
                border: "1px solid rgba(113,113,122,0.4)", // subtle zinc border
                borderRadius: "0.75rem",
                backdropFilter: "blur(8px)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
                color: "#e4e4e7",
                fontSize: "0.875rem",
                padding: "0.5rem 0.75rem",
            }}  />
              <Funnel data={[
                { name: 'Visit', value: 600 },
                { name: 'SignUp', value: 400 },
                { name: 'Pay', value: 200 },
              ]} dataKey="value" fill={palette[0]} fillOpacity={0.8} isAnimationActive>
                <LabelList position="right" />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        );
      default:
        return <div className="p-6 text-sm">No preview available</div>;
    }
  }

  return (
    <div >
      <Toaster richColors />
      <div className=" overflow-hidden px-4 sm:px-6 md:px-8 mx-auto">
        <header className="flex flex-col  sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
      
              Revolyx Charts
            </h1> 
            <p className="text-sm opacity-80 mt-1">A  chart gallery with <span>
              
              <a className="px-3 py-1 rounded-full text-xs font-medium text-blue-500 darK:text-blue-200 bg-blue-500/30 backdrop-blur-md 
  border border-blue-400/40 
  shadow-[0_0_10px_rgba(59,130,246,0.4)] 
  hover:shadow-[0_0_15px_rgba(59,130,246,0.7)] 
  transition-all duration-300" target="_blank" href="https://recharts.github.io/en-US/">
                Recharts
              </a>
              
              </span>  </p>

          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex gap-2 items-center">
             
            </div>

            <Select onValueChange={(v)=>setPaletteName(v)} value={paletteName}>
              <SelectTrigger className="w-40 cursor-pointer">
                <SelectValue placeholder="Palette" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(COLOR_THEMES).map(k => (
                  <SelectItem  key={k} value={k} className="flex cursor-pointer items-center gap-2">
                    <span className="w-6 h-4 rounded-sm flex-shrink-0" style={{ background: `linear-gradient(90deg, ${COLOR_THEMES[k].join(",")})` }} />
                    <span>{k}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-10 gap-6">
          {/* Left: Search & Catalog */}
          <aside className="lg:col-span-3">
<Card className="w-full relative  backdrop-blur-xl  bg-white/80 dark:bg-black/70 shadow-2xl border border-zinc-200/70 dark:border-zinc-500/30 transition-colors duration-300">
  <CardHeader>
    <CardTitle className="flex items-center  sticky top-0 z-50 bg-white/80 dark:bg-black/70 backdrop-blur-xl border-b pb-2 border-zinc-300/40 dark:border-zinc-700/40 justify-between">
      <span className="text-xl font-semibold flex items-center gap-2">
        <BarChart2 className="h-5 w-5 text-primary" />
        Charts Catalog
      </span>

      <div className="flex items-center gap-2">
        {/* Count Badge */}
        <Badge
          variant="secondary"
          className="text-xs px-3 py-1 rounded-full bg-zinc-800/10 dark:bg-white/10 text-zinc-800 dark:text-zinc-200 border border-zinc-300/40 dark:border-zinc-700/40 backdrop-blur-sm"
        >
          {ALL_CHARTS.length}
        </Badge>

        {/* Sort Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="flex items-center gap-1 cursor-pointer border-zinc-300/50 dark:border-zinc-700/50 hover:bg-zinc-100/50 dark:hover:bg-zinc-800/40"
            >
              Sort
              <SortAsc className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            className="backdrop-blur-lg bg-white/70 dark:bg-zinc-900/80 border border-zinc-300/40 dark:border-zinc-700/40"
          >
            <DropdownMenuItem className="cursor-pointer" onClick={() => setSortMode("none")}>Default</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => setSortMode("asc")}>A → Z</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => setSortMode("desc")}>Z → A</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Mobile Sidebar */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="lg:hidden cursor-pointer border-zinc-300/50 dark:border-zinc-700/50">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-4 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-r border-zinc-200/30 dark:border-zinc-800/50">
            <h2 className="text-lg font-semibold mb-3 dark:text-white text-zinc-800">Charts Menu</h2>
            <ScrollArea className="h-[80vh]">
              <div className="grid gap-2">
                {filteredCharts.map((c) => (
                  <Button
                    key={c.key}
                    variant={selectedChartKey === c.key ? "secondary" : "ghost"}
                    className="justify-between text-left dark:text-white cursor-pointer"
                    onClick={() => handleChartClick(c.key)}
                  >
                    {c.title}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>
      </div>
    </CardTitle>
  </CardHeader>
  

  <CardContent>
    {/* Search (hidden on mobile) */}
    <div className="relative mb-3 hidden lg:block">
      <Search className="absolute left-3 top-2.5 h-4 w-4 opacity-50" />
      <Input
        ref={inputRef}
        placeholder="Search charts (click to show suggestions)"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setSearchTerm("");
            inputRef.current?.blur();
          }
        }}
        className="pl-9 bg-white/70 dark:bg-zinc-900/60 border border-zinc-300/50 dark:border-zinc-700/50"
      />
    </div>

    {/* Suggestions */}
    <AnimatePresence>
      {showSuggestions && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
        >
          <ScrollArea className=" mb-3 border rounded-md p-2 backdrop-blur-md bg-white/60 dark:bg-zinc-900/40 border-zinc-300/40 dark:border-zinc-700/40 shadow-inner">
            <div className="grid gap-2">
              {ALL_CHARTS.filter(
                (c) =>
                  c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  searchTerm === ""
              )
                .slice(0, 8)
                .map((chart) => (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    key={chart.key}
                    onClick={() => handleChartClick(chart.key)}
                    className={clsx(
                      "text-left p-2 rounded-md w-full cursor-pointer border-zinc-300/40 dark:border-zinc-700/40 border transition-all duration-200",
                      selectedChartKey === chart.key
                        ? "bg-zinc-800/60 dark:bg-zinc-700/60 text-white"
                        : "hover:bg-zinc-100/60 dark:hover:bg-zinc-800/40"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{chart.title}</div>
                        <div className="flex gap-1 flex-wrap mt-1">
                          {chart.tags.slice(0,2).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-[10px] px-2 py-0.5 rounded-full border  bg-gray-100/50 border-gray-400/20 dark:bg-zinc-950/50 text-zinc-800 dark:border-zinc-100/20 dark:text-zinc-100 shadow-sm backdrop-blur-md"
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-xs opacity-60">{chart.key}</div>
                    </div>
                  </motion.button>
                ))}
              {ALL_CHARTS.filter(
                (c) =>
                  c.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  searchTerm === ""
              ).length === 0 && (
                <div className="text-sm opacity-60 p-2">No charts match.</div>
              )}
            </div>
          </ScrollArea>
        </motion.div>
      )}
    </AnimatePresence>

    <Separator className="hidden sm:flex my-3 border-zinc-300/50 dark:border-zinc-700/50" />

    {/* Chart List */}
    <ScrollArea className="mt-2 hidden max-h-screen overflow-auto p-2  sm:grid gap-2">
      <AnimatePresence>
        {filteredCharts.map((c) => (
          <motion.button
            key={c.key}
            onClick={() => handleChartClick(c.key)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={clsx(
              "flex items-center w-full justify-between p-3 border-none cursor-pointer  rounded-lg transition-all backdrop-blur-md border dark:border-zinc-700/70 border-gray-200",
              selectedChartKey === c.key
                ? "dark:bg-zinc-700/50 bg-zinc-100 border-zinc-300/40 dark:border-zinc-700/40"
                : "dark:hover:bg-zinc-800/50 hover:bg-zinc-200/50"
            )}
          >
            <div className="flex flex-col items-start">
              <div className="font-semibold text-sm truncate">{c.title}</div>
             
            </div>
            
          </motion.button>
        ))}
      </AnimatePresence>
    </ScrollArea>
  </CardContent>
</Card>

          </aside>

          {/* Middle: Preview */}
          <section className="lg:col-span-7 space-y-4">
 <Card className="bg-white/70 dark:bg-black/40 border border-zinc-300/50 dark:border-zinc-600/70 backdrop-blur-lg shadow-xl transition-all duration-500">
      <CardHeader>
        <CardTitle className="flex flex-wrap items-center gap-2 justify-between">
          <span className="text-lg font-semibold tracking-tight">
            {ALL_CHARTS.find((c) => c.key === selectedChartKey)?.title || "Select a chart"}
          </span>

          <div className="flex items-center gap-2">
            <ToggleSourceButton
              expanded={expandedSource[selectedChartKey]}
              onToggle={() =>
                setExpandedSource((prev) => ({
                  ...prev,
                  [selectedChartKey]: !prev[selectedChartKey],
                }))
              }
            />
            <CopySourceButton
              onCopy={() =>
                copyToClipboard(generateChartSource(selectedChartKey, paletteName))
              }
            />
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        {/* Chart Area */}
        <div
          className={clsx(
            "relative w-full rounded-md p-3 border transition-all duration-300 overflow-hidden min-h-[240px]",
            "bg-white/60 dark:bg-zinc-900/40 border-zinc-200/50 dark:border-zinc-700/50"
          )}
        >
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                {/* shimmer background */}
                <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-zinc-200/50 via-zinc-100/30 to-zinc-200/50 dark:from-zinc-800/60 dark:via-zinc-700/40 dark:to-zinc-800/60" />
                {/* spinner */}
                <div className="relative z-10 flex flex-col items-center gap-2 text-zinc-600 dark:text-zinc-300">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                  <span className="text-xs opacity-70">Loading chart preview...</span>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="chart"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              >
                {renderPreview(selectedChartKey)}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Palette Selector */}
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <div className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Palette:</div>
          <div className="flex gap-2 flex-wrap items-center">
            {Object.keys(COLOR_THEMES).map((k) => (
              <Button
                key={k}
                onClick={() => setPaletteName(k)}
                title={k}
                className={clsx(
                  "w-8 h-6 rounded-md cursor-pointer transition-all duration-200 ring-1 ring-zinc-400/40 dark:ring-zinc-600/40",
                  paletteName === k && "scale-110 ring-2 ring-blue-500"
                )}
                style={{
                  background: `linear-gradient(90deg, ${COLOR_THEMES[k].join(",")})`,
                }}
              />
            ))}
            <div className="text-xs opacity-70 ml-2">
              Selected: <strong>{paletteName}</strong>
            </div>
          </div>
        </div>

        {/* Source code */}
        <AnimatePresence>
          {expandedSource[selectedChartKey] && (
            <motion.div
              key="source"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3 }}
              className="mt-4"
            >
              <Card className="overflow-auto max-h-[600px] border-zinc-300/40 dark:border-zinc-700/40 backdrop-blur-md bg-white/70 dark:bg-zinc-900/60">
                <CardContent>
                  <SyntaxHighlighter
                    language="jsx"
                    style={isDark ? oneDark : oneLight}
                    customStyle={{
                      fontSize: "0.75rem",
                      borderRadius: "0.5rem",
                      padding: "1rem",
                      whiteSpace: "pre-wrap",
                    }}
                    wrapLines
                  >
                    {generateChartSource(selectedChartKey, paletteName)}
                  </SyntaxHighlighter>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>

            {/* More charts grid (preview thumbnails) */}
            <div className="grid sm:grid-cols-2  gap-4">
              {filteredCharts.map(chart => (
                <Card key={chart.key} className={clsx("cursor-pointer bg-white dark:bg-black/40 dark:border-zinc-600/70  hover:scale-[1.01] transition-transform")} onClick={()=>handleChartClick(chart.key)}>
                  <CardContent>
                    <div className="flex items-center justify-between mb-2">
                      <div className="font-medium">{chart.title}</div>
                      <div className="text-xs opacity-70">{chart.key}</div>
                    </div>
                    <div className="">
                      {renderPreview(chart.key)}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </main>

       
      </div>
    </div>
  );
}
