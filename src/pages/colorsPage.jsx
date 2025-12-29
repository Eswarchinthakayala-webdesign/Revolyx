"use client";
import React, { useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, ArrowDown, ArrowUp } from "lucide-react";
import { toast, Toaster } from "sonner";

// If using shadcn UI replace below imports with your component paths
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { showToast } from "../lib/ToastHelper";

// ---- Tailwind-style palette (common families + shades 50..950) ----
// NOTE: these are the canonical Tailwind v3-ish hex values for reference.
// You can extend/add more families easily.
const PALETTE = {
  slate: {
    50: "#f8fafc", 100: "#f1f5f9", 200: "#e2e8f0", 300: "#cbd5e1", 400: "#94a3b8",
    500: "#64748b", 600: "#475569", 700: "#334155", 800: "#0f172a", 900: "#0b1220", 950: "#020617"
  },
  gray: {
    50: "#f9fafb", 100: "#f3f4f6", 200: "#e5e7eb", 300: "#d1d5db", 400: "#9ca3af",
    500: "#6b7280", 600: "#4b5563", 700: "#374151", 800: "#1f2937", 900: "#111827", 950: "#030712"
  },
  zinc: {
    50: "#fafafa", 100: "#f4f4f5", 200: "#e4e4e7", 300: "#d4d4d8", 400: "#a1a1aa",
    500: "#71717a", 600: "#52525b", 700: "#3f3f46", 800: "#27272a", 900: "#18181b", 950: "#09090a"
  },
  neutral: {
    50: "#fafafa", 100: "#f5f5f5", 200: "#e5e5e5", 300: "#d4d4d4", 400: "#a3a3a3",
    500: "#737373", 600: "#525252", 700: "#404040", 800: "#262626", 900: "#171717", 950: "#0a0a0a"
  },
  stone: {
    50: "#fafaf9", 100: "#f5f5f4", 200: "#e7e5e4", 300: "#d6d3d1", 400: "#a8a29e",
    500: "#78716c", 600: "#57534e", 700: "#44403c", 800: "#292524", 900: "#1c1917", 950: "#0c0a09"
  },
  red: {
    50: "#fef2f2", 100: "#fee2e2", 200: "#fecaca", 300: "#fca5a5", 400: "#f87171",
    500: "#ef4444", 600: "#dc2626", 700: "#b91c1c", 800: "#991b1b", 900: "#7f1d1d", 950: "#450a0a"
  },
  orange: {
    50: "#fff7ed", 100: "#ffedd5", 200: "#fed7aa", 300: "#fdba74", 400: "#fb923c",
    500: "#f97316", 600: "#ea580c", 700: "#c2410c", 800: "#9a3412", 900: "#7c2d12", 950: "#431407"
  },
  amber: {
    50: "#fffbeb", 100: "#fef3c7", 200: "#fde68a", 300: "#fcd34d", 400: "#fbbf24",
    500: "#f59e0b", 600: "#d97706", 700: "#b45309", 800: "#92400e", 900: "#78350f", 950: "#451a03"
  },
  yellow: {
    50: "#fefce8", 100: "#fef9c3", 200: "#fef08a", 300: "#fde047", 400: "#facc15",
    500: "#eab308", 600: "#ca8a04", 700: "#a16207", 800: "#854d0e", 900: "#713f12", 950: "#422006"
  },
  lime: {
    50: "#f7fee7", 100: "#ecfccb", 200: "#d9f99d", 300: "#bef264", 400: "#a3e635",
    500: "#84cc16", 600: "#65a30d", 700: "#4d7c0f", 800: "#3f6212", 900: "#365314", 950: "#20320a"
  },
  green: {
    50: "#f0fdf4", 100: "#dcfce7", 200: "#bbf7d0", 300: "#86efac", 400: "#4ade80",
    500: "#22c55e", 600: "#16a34a", 700: "#15803d", 800: "#166534", 900: "#14532d", 950: "#052e16"
  },
  emerald: {
    50: "#ecfdf5", 100: "#d1fae5", 200: "#a7f3d0", 300: "#6ee7b7", 400: "#34d399",
    500: "#10b981", 600: "#059669", 700: "#047857", 800: "#065f46", 900: "#064e3b", 950: "#03291d"
  },
  teal: {
    50: "#f0fdfa", 100: "#ccfbf1", 200: "#99f6e4", 300: "#5eead4", 400: "#2dd4bf",
    500: "#14b8a6", 600: "#0d9488", 700: "#0f766e", 800: "#115e59", 900: "#134e4a", 950: "#052f2a"
  },
  cyan: {
    50: "#ecfeff", 100: "#cffafe", 200: "#a5f3fc", 300: "#67e8f9", 400: "#22d3ee",
    500: "#06b6d4", 600: "#0891b2", 700: "#0e7490", 800: "#155e75", 900: "#164e63", 950: "#083344"
  },
  sky: {
    50: "#f0f9ff", 100: "#e0f2fe", 200: "#bae6fd", 300: "#7dd3fc", 400: "#38bdf8",
    500: "#0ea5e9", 600: "#0284c7", 700: "#0369a1", 800: "#075985", 900: "#0c4a6e", 950: "#062e3a"
  },
  blue: {
    50: "#eff6ff", 100: "#dbeafe", 200: "#bfdbfe", 300: "#93c5fd", 400: "#60a5fa",
    500: "#3b82f6", 600: "#2563eb", 700: "#1d4ed8", 800: "#1e40af", 900: "#1e3a8a", 950: "#172554"
  },
  indigo: {
    50: "#eef2ff", 100: "#e0e7ff", 200: "#c7d2fe", 300: "#a5b4fc", 400: "#818cf8",
    500: "#6366f1", 600: "#4f46e5", 700: "#4338ca", 800: "#3730a3", 900: "#312e81", 950: "#1e1b4b"
  },
  violet: {
    50: "#f5f3ff", 100: "#ede9fe", 200: "#ddd6fe", 300: "#c4b5fd", 400: "#a78bfa",
    500: "#8b5cf6", 600: "#7c3aed", 700: "#6d28d9", 800: "#5b21b6", 900: "#4c1d95", 950: "#2a0b5a"
  },
  purple: {
    50: "#faf5ff", 100: "#f3e8ff", 200: "#e9d5ff", 300: "#d8b4fe", 400: "#c084fc",
    500: "#a855f7", 600: "#9333ea", 700: "#7e22ce", 800: "#6b21a8", 900: "#581c87", 950: "#2d0b4b"
  },
  fuchsia: {
    50: "#fdf4ff", 100: "#fae8ff", 200: "#f5d0fe", 300: "#f0abfc", 400: "#e879f9",
    500: "#d946ef", 600: "#c026d3", 700: "#a21caf", 800: "#86198f", 900: "#701a75", 950: "#3a0b3a"
  },
  pink: {
    50: "#fdf2f8", 100: "#fce7f3", 200: "#fbcfe8", 300: "#f9a8d4", 400: "#f472b6",
    500: "#ec4899", 600: "#db2777", 700: "#be185d", 800: "#9d174d", 900: "#831843", 950: "#3b021f"
  },
  rose: {
    50: "#fff1f2", 100: "#ffe4e6", 200: "#fecdd3", 300: "#fda4af", 400: "#fb7185",
    500: "#f43f5e", 600: "#e11d48", 700: "#be123c", 800: "#9f1239", 900: "#881337", 950: "#4c0519"
  },
  
};

// ---- Utility converters ----
function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const bigint = parseInt(h, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r, g, b };
}

function rgbToString({ r, g, b }) {
  return `rgb(${r}, ${g}, ${b})`;
}

function rgbToHsl({ r, g, b }) {
  // convert to [0,1]
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn:
        h = (gn - bn) / d + (gn < bn ? 6 : 0);
        break;
      case gn:
        h = (bn - rn) / d + 2;
        break;
      case bn:
        h = (rn - gn) / d + 4;
        break;
    }
    h = h / 6;
  }
  const H = Math.round(h * 360);
  const S = Math.round(s * 100);
  const L = (l*100).toFixed(1);
  return `hsl(${H} ${S}% ${L}%)`;
}

// OKLab/OKLCH conversion (approx, using standard transforms)
function hexToOKLCH(hex) {
  const { r, g, b } = hexToRgb(hex);
  // sRGB [0..1]
  const sr = r / 255;
  const sg = g / 255;
  const sb = b / 255;

  // to linear sRGB
  const lr = sr <= 0.04045 ? sr / 12.92 : Math.pow((sr + 0.055) / 1.055, 2.4);
  const lg = sg <= 0.04045 ? sg / 12.92 : Math.pow((sg + 0.055) / 1.055, 2.4);
  const lb = sb <= 0.04045 ? sb / 12.92 : Math.pow((sb + 0.055) / 1.055, 2.4);

  // linear sRGB -> LMS (via Oklab matrices)
  const l = 0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb;
  const m = 0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb;
  const s = 0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb;

  const l_ = Math.cbrt(Math.max(0, l));
  const m_ = Math.cbrt(Math.max(0, m));
  const s_ = Math.cbrt(Math.max(0, s));

  const L = 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_;
  const a = 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_;
  const b_ = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_;

  const C = Math.sqrt(a * a + b_ * b_);
  let h = (Math.atan2(b_, a) * 180) / Math.PI;
  if (h < 0) h += 360;

  return `oklch(${(L).toFixed(2)} ${(C).toFixed(2)} ${(Math.round(h))})`;
}

// format CSS var
function cssVar(name, shade, hex) {
  return `--revolyx-${name}-${shade}: ${hex};`;
}

// ---- Utility: flatten palette into entries ----
function paletteToEntries(palette) {
  const entries = [];
  Object.keys(palette).forEach((name) => {
    Object.keys(palette[name]).forEach((shade) => {
      entries.push({
        name,
        shade: Number(shade),
        hex: palette[name][shade],
        className: `bg-${name}-${shade}`,
        cssVar: cssVar(name, shade, palette[name][shade]),
      });
    });
  });
  // sort by name then shade
  entries.sort((a, b) => {
    if (a.name === b.name) return a.shade - b.shade;
    return a.name.localeCompare(b.name);
  });
  return entries;
}

const ALL_COLORS = paletteToEntries(PALETTE);

export default function ColorsPage() {
  // Selected format to copy
  const [format, setFormat] = useState("hex"); // hex, rgb, hsl, oklch, class, var
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("group"); // group, asc, desc, alpha
  const [filterFamily, setFilterFamily] = useState("all");

  // derive families list
  const families = useMemo(() => {
    const f = Array.from(new Set(ALL_COLORS.map((c) => c.name)));
    return f;
  }, []);

  // filtered and sorted entries
  const visible = useMemo(() => {
    let arr = ALL_COLORS.slice();

    if (filterFamily !== "all") {
      arr = arr.filter((i) => i.name === filterFamily);
    }

    if (query.trim()) {
      const q = query.toLowerCase();
      arr = arr.filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          String(i.shade).includes(q) ||
          i.hex.toLowerCase().includes(q)
      );
    }

    if (sort === "asc") {
      arr = arr.sort((a, b) => a.shade - b.shade || a.name.localeCompare(b.name));
    } else if (sort === "desc") {
      arr = arr.sort((a, b) => b.shade - a.shade || a.name.localeCompare(b.name));
    } else if (sort === "alpha") {
      arr = arr.sort((a, b) => a.name.localeCompare(b.name) || a.shade - b.shade);
    } else {
      // group default: group by family, ascending shade
      arr = arr.sort((a, b) => {
        if (a.name === b.name) return a.shade - b.shade;
        return a.name.localeCompare(b.name);
      });
    }

    return arr;
  }, [query, sort, filterFamily]);

  // copy handler
  const handleCopy = async (entry) => {
    const { name, shade, hex, className, cssVar: css } = entry;
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb);
    const oklch = hexToOKLCH(hex);

    let text = hex;
    switch (format) {
      case "hex":
        text = hex;
        break;
      case "rgb":
        text = rgbToString(rgb);
        break;
      case "hsl":
        text = hsl;
        break;
      case "oklch":
        text = oklch;
        break;
      case "class":
        text = className;
        break;
      case "var":
        text = css;
        break;
      default:
        text = hex;
    }

  try {
      await navigator.clipboard.writeText(text);
      showToast("success",
        <div className="max-w-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-md flex-shrink-0"
                 style={{ background: hex }} />
             <div>{`${name}:${text} copied • ${format.toUpperCase()}`}</div>
     
           
          </div>
        </div>,
        2000,""
      );
    } catch (err) {
      showToast("error","Failed to copy",2000,"")
    }
  };

  // small responsive columns based on screen width
  // but we'll rely on tailwind grid classes

  return (
    <div
    
    >
  

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-hidden py-8">
        {/* Heading + controls */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              Revolyx Colors
            </h1>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 max-w-xl">
              Interactive Tailwind palette explorer
            </p>
          </div>

          <div className="flex flex-wrap gap-3 items-center w-full md:w-auto">
            {/* Search */}
            <div className="flex items-center gap-2 bg-white dark:bg-black/60 border border-gray-200 dark:border-white/10 rounded-md px-2 py-1 shadow-sm w-full md:w-auto">
              <Search className="w-4 h-4 text-gray-500 dark:text-gray-300" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search color, shade or hex (e.g. blue, 500, #3b82f6)"
                className="border-none outline-none py-1  bg-transparent px-0"
              />
            </div>

            {/* Family filter (shadcn Select style) */}
            <Select onValueChange={(v) => setFilterFamily(v)} defaultValue="all">
              <SelectTrigger className="w-44">
                <SelectValue placeholder="All families" />
              </SelectTrigger>
              <SelectContent className="h-120">
                <SelectItem value="all">All families</SelectItem>
                {families.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select onValueChange={(v) => setSort(v)} defaultValue="group">
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="group">Group (family → shade)</SelectItem>
                <SelectItem value="asc">
                  <ArrowUp className="mr-2 inline" /> Shade ascending
                </SelectItem>
                <SelectItem value="desc">
                  <ArrowDown className="mr-2 inline" /> Shade descending
                </SelectItem>
                <SelectItem value="alpha">
                  <ArrowDown className="mr-2 inline" /> Alphabetical
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Format select */}
            <Select onValueChange={(v) => setFormat(v)} defaultValue="hex">
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Copy as" />
              </SelectTrigger>
              <SelectContent >
                <SelectItem value="hex">HEX</SelectItem>
                <SelectItem value="rgb">RGB</SelectItem>
                <SelectItem value="hsl">HSL</SelectItem>
                <SelectItem value="oklch">OKLCH</SelectItem>
                <SelectItem value="class">Tailwind class</SelectItem>
                <SelectItem value="var">CSS var</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Palette grid */}
        <section aria-label="Color palette" className="space-y-6">
          {/* Show families grouped */}
          {(() => {
            // if filtered to single family, show only that family in a responsive grid
            if (filterFamily !== "all") {
              const familyEntries = visible.filter((v) => v.name === filterFamily);
              const grouped = groupByShadeOrder(familyEntries);
              return (
                <div>
                  <h2 className="text-lg font-semibold mb-3 capitalize">{filterFamily}</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4">
                    {grouped.map((entry) => (
                      <ColorTile key={`${entry.name}-${entry.shade}`} entry={entry} onCopy={handleCopy} />
                    ))}
                  </div>
                </div>
              );
            }

            // Otherwise, show family sections
            const familiesOrder = [...families].sort((a, b) => a.localeCompare(b));
            return familiesOrder.map((fam) => {
              const famEntries = visible.filter((e) => e.name === fam);
              if (!famEntries.length) return null;
              return (
                <div key={fam}>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold capitalize">{fam}</h2>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {famEntries.length} shades
                    </div>
                  </div>

                  <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-11 gap-3">
                    {famEntries.map((entry) => (
                      <ColorTile key={`${entry.name}-${entry.shade}`} entry={entry} onCopy={handleCopy} />
                    ))}
                  </div>
                </div>
              );
            });
          })()}
        </section>
      </main>

      {/* bottom padding to accommodate mobile bottom nav/header */}
      <div className="h-24 md:h-32" />
    </div>
  );
}

// small helper to ensure display order 50..950 for a family
function groupByShadeOrder(entries) {
  const shades = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  const map = {};
  entries.forEach((e) => {
    if (!map[e.shade]) map[e.shade] = e;
  });
  return shades
    .map((s) => map[s])
    .filter(Boolean);
}

// Color tile component
function ColorTile({ entry, onCopy }) {
  const { name, shade, hex } = entry;
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb);
  const oklch = hexToOKLCH(hex);
  const className = `bg-[${hex}]`; // not used for Tailwind classes; display only
  const tailwindClass = `bg-${name}-${shade}`;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onCopy(entry)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onCopy(entry);
      }}
      className="rounded-lg overflow-hidden cursor-pointer select-none focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-zinc-400/25"
    >
      <div
        style={{ backgroundColor: hex }}
        className="w-full border border-gray-500/25 aspect-[3/4] sm:aspect-[2/1] md:aspect-[1/1] rounded-md"
      />
      <div className="mt-2 px-2 pb-2">
        <div className="flex items-center flex-col justify-between">
          <div className="text-xs font-medium capitalize">{name}-{shade}</div>
          <div className="text-xs opacity-80">{hex.toUpperCase()}</div>
        </div>

       
      </div>
    </div>
  );
}
