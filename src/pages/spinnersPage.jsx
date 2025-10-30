// src/pages/RevolyxSpinnersPage.jsx
"use client";

import React, { useEffect, useSearchParams, useMemo, useRef, useState } from "react";
import clsx from "clsx";

/* react-spinners */
import {
  BeatLoader,
  BounceLoader,
  BarLoader,
  CircleLoader,
  ClimbingBoxLoader,
  ClipLoader,
  DotLoader,
  FadeLoader,
  GridLoader,
  HashLoader,
  MoonLoader,
  PacmanLoader,
  PropagateLoader,
  PulseLoader,
  PuffLoader,
  RingLoader,
  RiseLoader,
  RotateLoader,
  ScaleLoader,
  SkewLoader,
  SquareLoader,
  SyncLoader,
// some libs alias, but keep best-effort - if unavailable remove
} from "react-spinners";
import {
  Audio,
  BallTriangle,
  Bars,
  Blocks,
  CirclesWithBar,
  Circles,
  CircularProgress,
  ColorRing,
  Comment,
  Discuss,
  DNA,
  FallingLines,
  FidgetSpinner,
  Grid,
  Hearts,
  Hourglass,
  InfinitySpin,
  LineWave,
  MagnifyingGlass,
  MutatingDots,
  Oval,
  ProgressBar,
  Puff,
  Radio,
  RevolvingDot,
  Rings,
  RotatingLines,
  RotatingSquare,
  RotatingTriangles,
  TailSpin,
  ThreeCircles,
  ThreeDots,
  Triangle,
  Vortex,
  Watch,
} from "react-loader-spinner";
/* shadcn/ui components — adjust import paths to your project */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from "@/components/ui/dropdown-menu";

/* notifications */
import { Toaster, toast } from "sonner";

/* syntax highlighter */

/* framer motion for subtle interactions */
import { motion } from "framer-motion";
import { useTheme } from "../components/theme-provider";
import SpinnerSidebar from "../components/SpinnerSidebar";
import { SpinnerShowcase } from "../components/SpinnerShowcase";
import { SpinnerGrid } from "../components/SpinnerGrid";

/* --- color themes (user-provided, slightly normalized) --- */
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

/* --- 25 spinner entries (most from react-spinners + a few CSS samples) --- */
/* Note: if your installed react-spinners version lacks some names, remove/replace them */
const ALL_SPINNERS = [
  { key: "beat", title: "BeatLoader", comp: BeatLoader },
  { key: "bounce", title: "BounceLoader", comp: BounceLoader },
  { key: "bar", title: "BarLoader", comp: BarLoader },
  { key: "circle", title: "CircleLoader", comp: CircleLoader },
  { key: "climbing", title: "ClimbingBoxLoader", comp: ClimbingBoxLoader },
  { key: "clip", title: "ClipLoader", comp: ClipLoader },
  { key: "dot", title: "DotLoader", comp: DotLoader },
  { key: "fade", title: "FadeLoader", comp: FadeLoader },
  { key: "grid", title: "GridLoader", comp: GridLoader },
  { key: "hash", title: "HashLoader", comp: HashLoader },
  { key: "moon", title: "MoonLoader", comp: MoonLoader },
  { key: "pacman", title: "PacmanLoader", comp: PacmanLoader },
  { key: "propagate", title: "PropagateLoader", comp: PropagateLoader },
  { key: "pulse", title: "PulseLoader", comp: PulseLoader },
  { key: "puff", title: "PuffLoader", comp: PuffLoader },
  { key: "ring", title: "RingLoader", comp: RingLoader },
  { key: "rise", title: "RiseLoader", comp: RiseLoader },
  { key: "rotate", title: "RotateLoader", comp: RotateLoader },
  { key: "scale", title: "ScaleLoader", comp: ScaleLoader },
  { key: "skew", title: "SkewLoader", comp: SkewLoader },
  { key: "square", title: "SquareLoader", comp: SquareLoader },
  { key: "sync", title: "SyncLoader", comp: SyncLoader },
  /* CSS custom spinner (no external lib) */
  { key: "css-ring", title: "CSS Ring (custom)", comp: null },
  { key: "css-dots", title: "CSS Dots (custom)", comp: null },

  { key: "audio", title: "Audio", comp: Audio },
  { key: "balltriangle", title: "Ball Triangle", comp: BallTriangle },
  { key: "bars", title: "Bars", comp: Bars },
  { key: "blocks", title: "Blocks", comp: Blocks },
  { key: "circleswithbar", title: "Circles With Bar", comp: CirclesWithBar },
  { key: "circles", title: "Circles", comp: Circles },
  { key: "circularprogress", title: "Circular Progress", comp: CircularProgress },
  { key: "colorring", title: "Color Ring", comp: ColorRing },
  { key: "comment", title: "Comment", comp: Comment },
  { key: "discuss", title: "Discuss", comp: Discuss },
  { key: "dna", title: "DNA", comp: DNA },
  { key: "fallinglines", title: "Falling Lines", comp: FallingLines },
  { key: "fidgetspinner", title: "Fidget Spinner", comp: FidgetSpinner },
  { key: "loadgrid", title: "Grid", comp: Grid },
  { key: "hearts", title: "Hearts", comp: Hearts },
  { key: "hourglass", title: "Hourglass", comp: Hourglass },
  { key: "infinityspin", title: "Infinity Spin", comp: InfinitySpin },
  { key: "linewave", title: "Line Wave", comp: LineWave },
  { key: "magnifyingglass", title: "Magnifying Glass", comp: MagnifyingGlass },
  { key: "mutatingdots", title: "Mutating Dots", comp: MutatingDots },
  { key: "oval", title: "Oval", comp: Oval },
  { key: "progressbar", title: "Progress Bar", comp: ProgressBar },
  { key: "loadpuff", title: "Puff", comp: Puff },
  { key: "radio", title: "Radio", comp: Radio },
  { key: "revolvingdot", title: "Revolving Dot", comp: RevolvingDot },
  { key: "rings", title: "Rings", comp: Rings },
  { key: "rotatinglines", title: "Rotating Lines", comp: RotatingLines },
  { key: "rotatingsquare", title: "Rotating Square", comp: RotatingSquare },
  { key: "rotatingtriangles", title: "Rotating Triangles", comp: RotatingTriangles },
  { key: "tailspin", title: "Tail Spin", comp: TailSpin },
  { key: "threecircles", title: "Three Circles", comp: ThreeCircles },
  { key: "threedots", title: "Three Dots", comp: ThreeDots },
  { key: "triangle", title: "Triangle", comp: Triangle },
  { key: "vortex", title: "Vortex", comp: Vortex },
  { key: "watch", title: "Watch", comp: Watch },
];

/* --- helper: returns category map (alphabetical) --- */
/* --- helper: returns category map (alphabetical) --- */
function categorizeAlphabetically(list) {
  const map = {};
  list.forEach((s) => {
    const c = s.title.charAt(0).toUpperCase();
    if (!map[c]) map[c] = [];
    map[c].push(s);
  });
  return map;
}

/* --- helper: detect which library spinner belongs to --- */
function detectLibrary(spinnerKey) {
  const reactSpinnersKeys = [
    "beat", "bounce", "bar", "circle", "climbing", "clip", "dot", "fade",
    "grid", "hash", "moon", "pacman", "propagate", "pulse", "puff",
    "ring", "rise", "rotate", "scale", "skew", "square", "sync",
  ];
const reactLoaderSpinnerKeys = [
  "audio",
  "balltriangle",
  "bars",
  "blocks",
  "circleswithbar",
  "circles",
  "circularprogress",
  "colorring",
  "comment",
  "discuss",
  "dna",
  "fallinglines",
  "fidgetspinner",
  "grid",
  "hearts",
  "hourglass",
  "infinityspin",
  "linewave",
  "magnifyingglass",
  "mutatingdots",
  "oval",
  "progressbar",
  "puff",
  "radio",
  "revolvingdot",
  "rings",
  "rotatinglines",
  "rotatingsquare",
  "rotatingtriangles",
  "tailspin",
  "threecircles",
  "threedots",
  "triangle",
  "vortex",
  "watch",
];

  if (reactSpinnersKeys.includes(spinnerKey)) return "react-spinners";
  if (reactLoaderSpinnerKeys.includes(spinnerKey)) return "react-loader-spinner";
  return "custom";
}

/* --- source generator for each spinner (JSX string) --- */
function generateSpinnerSource(spinnerKey, color, size, speed) {
  const c = color || "#3b82f6";
  const s = size || 40;
  const spd = speed || 1;

  const spinner = ALL_SPINNERS.find((x) => x.key === spinnerKey);
  const lib = detectLibrary(spinnerKey);

  if (!spinner) return "/* Invalid spinner key */";

  /* ---- 1️⃣ Custom CSS Spinners ---- */
  if (spinnerKey === "css-ring") {
    return `/* CSS Ring Loader */
<div className="css-ring" style={{ width: ${s}px, height: ${s}px }}>
  <div />
</div>

/* CSS:
.css-ring {
  display: inline-block;
  border-radius: 50%;
  border: 4px solid rgba(0,0,0,0.12);
  border-top-color: ${c};
  animation: ringSpin ${spd}s linear infinite;
}
@keyframes ringSpin { to { transform: rotate(360deg); } }
*/`;
  }

  if (spinnerKey === "css-dots") {
    return `/* CSS Dots Loader */
<div className="css-dots">
  <div /><div /><div />
</div>

/* CSS:
.css-dots { display:flex; gap:6px; align-items:center; }
.css-dots div {
  width:${Math.round(s/4)}px;
  height:${Math.round(s/4)}px;
  border-radius:50%;
  background:${c};
  animation: bounce ${spd}s infinite ease-in-out;
}
.css-dots div:nth-child(2) { animation-delay: ${spd/6}s; }
.css-dots div:nth-child(3) { animation-delay: ${spd/3}s; }
@keyframes bounce { 0%,100% { transform:translateY(0);} 50% { transform:translateY(-8px);} }
*/`;
  }

  /* ---- 2️⃣ React-Spinners ---- */
  if (lib === "react-spinners") {
    return `import { ${spinner.title} } from "react-spinners";

function Demo() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <${spinner.title} color="${c}" size={${s}} speedMultiplier={${spd}} />
    </div>
  );
}

export default Demo;`;
  }

  /* ---- 3️⃣ React-Loader-Spinner ---- */
  if (lib === "react-loader-spinner") {
    return `import { ${spinner.title} } from "react-loader-spinner";

function Demo() {
  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
      <${spinner.title}
        height={${s}}
        width={${s}}
        color="${c}"
        ariaLabel="${spinner.title.toLowerCase()}-loading"
        visible={true}
      />
    </div>
  );
}

export default Demo;`;
  }

  /* ---- 4️⃣ Default fallback ---- */
  return `/* Spinner: ${spinner.title} */\n/* No source code available. */`;
}




/* --- MAIN COMPONENT --- */
export default function RevolyxSpinnersPage() {
  const [paletteName, setPaletteName] = useState("blue");
  const [subPaletteIdx, setSubPaletteIdx] = useState(0);
  const [size, setSize] = useState(40);
  const [speed, setSpeed] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortMode, setSortMode] = useState("asc"); // asc | desc
  const [selectedSpinnerKey, setSelectedSpinnerKey] = useState(ALL_SPINNERS[0].key);
  

  const inputRef = useRef(null);

 

  const filtered = useMemo(() => {
    let arr = ALL_SPINNERS.filter((s) =>
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) || s.key.toLowerCase().includes(searchTerm.toLowerCase())
    );
    arr = arr.sort((a, b) => (sortMode === "asc" ? a.title.localeCompare(b.title) : b.title.localeCompare(a.title)));
    return arr;
  }, [searchTerm, sortMode]);

  const categories = useMemo(() => categorizeAlphabetically(filtered), [filtered]);

  const palette = COLOR_THEMES[paletteName] || COLOR_THEMES.blue;
  const accent = palette[subPaletteIdx % palette.length];

  function handleSelectSpinner(key) {
    setSelectedSpinnerKey(key);
    const newUrl = `${window.location.origin}${window.location.pathname}?spinner=${key}`;
    window.history.pushState({ key }, "", newUrl);
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast(`${ALL_SPINNERS.find(s=>s.key===key)?.title || key} selected`);
  }
  const {theme}=useTheme()
   const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

function renderSpinnerPreview(key) {
  const sizePx = size;
  const color = accent;
  const speedMultiplier = speed;

  const spinner = ALL_SPINNERS.find((s) => s.key === key);
  if (!spinner) return <div className="p-6">No spinner</div>;

  // --- Detect library type ---
  const reactSpinnersKeys = [
    "beat", "bounce", "bar", "circle", "climbing", "clip", "dot", "fade",
    "grid", "hash", "moon", "pacman", "propagate", "pulse", "puff",
    "ring", "rise", "rotate", "scale", "skew", "square", "sync",
  ];
 const reactLoaderSpinnerKeys = [
  "audio",
  "balltriangle",
  "bars",
  "blocks",
  "circleswithbar",
  "circles",
  "circularprogress",
  "colorring",
  "comment",
  "discuss",
  "dna",
  "fallinglines",
  "fidgetspinner",
  "grid",
  "hearts",
  "hourglass",
  "infinityspin",
  "linewave",
  "magnifyingglass",
  "mutatingdots",
  "oval",
  "progressbar",
  "puff",
  "radio",
  "revolvingdot",
  "rings",
  "rotatinglines",
  "rotatingsquare",
  "rotatingtriangles",
  "tailspin",
  "threecircles",
  "threedots",
  "triangle",
  "vortex",
  "watch",
];


  const lib = reactSpinnersKeys.includes(key)
    ? "react-spinners"
    : reactLoaderSpinnerKeys.includes(key)
    ? "react-loader-spinner"
    : "custom";

  // --- 1️⃣ Custom CSS Spinners ---
  if (key === "css-ring") {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <div
          style={{
            width: sizePx,
            height: sizePx,
            borderRadius: "50%",
            border: `${Math.max(
              3,
              Math.round(sizePx * 0.08)
            )}px solid ${
              isDark
                ? "rgba(255,255,255,0.08)"
                : "rgba(0,0,0,0.08)"
            }`,
            borderTopColor: color,
            animation: `rotRev ${1 / Math.max(0.1, speedMultiplier)}s linear infinite`,
          }}
        />
        <style>{`@keyframes rotRev { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (key === "css-dots") {
    const dotSize = Math.max(6, Math.round(sizePx / 5));
    return (
      <div
        style={{
          display: "flex",
          gap: 8,
          justifyContent: "center",
          padding: 18,
        }}
      >
        <style>{`
          .rev-dot {
            width: ${dotSize}px;
            height: ${dotSize}px;
            border-radius: 50%;
            background: ${color};
            animation: rev-bounce ${0.6 / Math.max(0.2, speed)}s infinite ease-in-out;
          }
          .rev-dot:nth-child(2){ animation-delay: ${0.08 / Math.max(0.1, speed)}s; }
          .rev-dot:nth-child(3){ animation-delay: ${0.16 / Math.max(0.1, speed)}s; }
          @keyframes rev-bounce {
            0%,100%{ transform: translateY(0);}
            50%{ transform: translateY(-8px);}
          }
        `}</style>
        <div className="rev-dot" />
        <div className="rev-dot" />
        <div className="rev-dot" />
      </div>
    );
  }

  // --- 2️⃣ React-Spinners Components ---
  if (lib === "react-spinners") {
    const Comp = spinner.comp;
    if (!Comp) return <div className="p-6">Preview unavailable</div>;

    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <Comp color={color} size={sizePx} speedMultiplier={speedMultiplier} />
      </div>
    );
  }

  // --- 3️⃣ React-Loader-Spinner Components ---
  if (lib === "react-loader-spinner") {
    const Comp = spinner.comp;
    if (!Comp) return <div className="p-6">Preview unavailable</div>;

    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: 24,
        }}
      >
        <Comp
          height={sizePx}
          width={sizePx}
          color={color}
          visible={true}
          ariaLabel={`${spinner.title.toLowerCase()}-loading`}
        />
      </div>
    );
  }

  // --- 4️⃣ Fallback ---
  return <div className="p-6">Preview unavailable</div>;
}

  
  
  function renderSpinnerPreview2(key) {
    const sizePx = 20;
    const color = accent;
    const speedMultiplier = 1;

    const spinner = ALL_SPINNERS.find((s) => s.key === key);
    if (!spinner) return <div className="p-6">No spinner</div>;

    // Custom CSS spinners
    if (key === "css-ring") {
      return (
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 24 }}>
          <div
            style={{
              width: sizePx,
              height: sizePx,
              borderRadius: "50%",
              border: `${Math.max(3, Math.round(sizePx * 0.08))}px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
              borderTopColor: color,
              animation: `rotRev ${1 / Math.max(0.1, speedMultiplier)}s linear infinite`,
            }}
          />
          <style>{`@keyframes rotRev { to { transform: rotate(360deg); } }`}</style>
        </div>
      );
    }
    if (key === "css-dots") {
      const dotSize = Math.max(6, Math.round(sizePx / 5));
      return (
        <div style={{ display: "flex", gap: 8, justifyContent: "center", padding: 18 }}>
          <style>{`
            .rev-dot { width: ${dotSize}px; height: ${dotSize}px; border-radius: 50%; background: ${color}; animation: rev-bounce ${0.6 / Math.max(0.2,speed)}s infinite ease-in-out; }
            .rev-dot:nth-child(2){ animation-delay: ${0.08 / Math.max(0.1,speed)}s; }
            .rev-dot:nth-child(3){ animation-delay: ${0.16 / Math.max(0.1,speed)}s; }
            @keyframes rev-bounce { 0%,100%{ transform: translateY(0);} 50%{ transform: translateY(-8px);} }
          `}</style>
          <div className="rev-dot" />
          <div className="rev-dot" />
          <div className="rev-dot" />
        </div>
      );
    }

    // For react-spinners components — render dynamically
    const Comp = spinner.comp;
    if (!Comp) return <div className="p-6">Preview unavailable</div>;

    // Different react-spinners accept slightly different props; we'll pass common ones and let component ignore unknowns
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: 24 }}>
        <Comp color={color} size={sizePx} speedMultiplier={speedMultiplier} />
      </div>
    );
  }
  function renderSpinnerThumbnail(key) {
    return (
      <div className="w-full h-20 flex items-center justify-center">
        {renderSpinnerPreview2(key,31,1)}
      </div>
    );
  }

  function copySource() {
    const src = generateSpinnerSource(selectedSpinnerKey, accent, size, speed);
    navigator.clipboard?.writeText(src).then(() => toast.success("Source copied to clipboard"));
  }

  // generate a compact visible label of palette and its sub-colors
  function PalettePreview({ paletteArr, selectedIndex, onSelect }) {
    return (
      <div className="flex items-center gap-3">
        {paletteArr.map((c, i) => (
          <button
            key={c}
            onClick={() => onSelect(i)}
            className={clsx("w-8 h-6 rounded-sm ring-1 ring-black/10", i === selectedIndex ? "ring-2 ring-offset-1" : "")}
            style={{ background: c }}
            aria-label={`palette-${i}`}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="min-h-screen  overflow-hidden max-w-8xl mx-auto py-8 px-4 md:px-8">
      <Toaster richColors />
      <div className="">
        <header className="flex flex-row flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3">
              Revolyx Spinners
            </h1>
            <p className="text-sm opacity-80 mt-1">A curated gallery of spinners</p>
          </div>

            <Select value={paletteName} onValueChange={(v)=> setPaletteName(v)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Palette" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(COLOR_THEMES).map((k) => (
                  <SelectItem key={k} value={k}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-4 rounded-sm" style={{ background: `linear-gradient(90deg, ${COLOR_THEMES[k].join(",")})` }} />
                      <div className="text-sm">{k}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

         
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sheet: spinner list */}
          <aside className="lg:col-span-1 max-h-screen">
            <SpinnerSidebar
                ALL_SPINNERS={ALL_SPINNERS}
                categories={categories}
                selectedSpinnerKey={selectedSpinnerKey}
                handleSelectSpinner={handleSelectSpinner}
                />

          </aside>

          {/* Middle+Right: preview and controls (span 3 cols on large) */}
          <section className="lg:col-span-3 space-y-4">
              <SpinnerShowcase
                ALL_SPINNERS={ALL_SPINNERS}
                selectedSpinnerKey={selectedSpinnerKey}
                renderSpinnerPreview={(key) =>
                    renderSpinnerPreview(key, size, speed) // ✅ forward props
                }
                generateSpinnerSource={generateSpinnerSource}
                palette={palette}
                subPaletteIdx={subPaletteIdx}
                setSubPaletteIdx={setSubPaletteIdx}
                paletteName={paletteName}
                accent={accent}
                isDark={isDark}
                size={size}                  // ✅ pass down
                setSize={setSize}
                speed={speed}                // ✅ pass down
                setSpeed={setSpeed}
                />

            {/* Remaining spinner thumbnails grid */}
           <SpinnerGrid
            filtered={filtered}
            handleSelectSpinner={handleSelectSpinner}
            renderSpinnerThumbnail={renderSpinnerThumbnail}
            />

          </section>
        </main>

       
      </div>
    </div>
  );
}
