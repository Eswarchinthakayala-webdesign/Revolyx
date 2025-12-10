// src/pages/GradientPlayground.jsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Toaster } from "sonner";
import {
  Copy,
  Download,
  RotateCcw,
  Plus,
  Trash2,
  Shuffle,
  Palette,
  Code,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  Copyright,
  Stamp,
  Check,
  MinusCircle,
  PlusCircle,
} from "lucide-react";

import { toPng } from "html-to-image"; // npm i html-to-image

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox"; // shadcn checkbox
import MDEditor from "@uiw/react-md-editor";
import { showToast } from "../lib/ToastHelper";
import { useTheme } from "../components/theme-provider";

/* --------------- Utilities & helpers --------------- */
const uid = () => Math.random().toString(36).slice(2, 9);

const DEFAULT_STOPS = [
  { id: uid(), color: "#06b6d4", pos: 0 },
  { id: uid(), color: "#7c3aed", pos: 50 },
  { id: uid(), color: "#ef4444", pos: 100 },
];

function clamp(n, a = 0, b = 100) {
  return Math.max(a, Math.min(b, n));
}

function hexToRgba(hex) {
  const h = String(hex).replace("#", "");
  const full = h.length === 3 ? h.split("").map(c => c + c).join("") : h;
  const bigint = parseInt(full, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
    a: 1,
  };
}
function rgbaToCss(c) {
  return `rgba(${Math.round(c.r)}, ${Math.round(c.g)}, ${Math.round(c.b)}, ${Number(c.a ?? 1).toFixed(3)})`;
}
function lerp(a, b, t) { return a + (b - a) * t; }
function mixColors(c1, c2, t) {
  return {
    r: lerp(c1.r, c2.r, t),
    g: lerp(c1.g, c2.g, t),
    b: lerp(c1.b, c2.b, t),
    a: lerp(c1.a ?? 1, c2.a ?? 1, t),
  };
}
function colorAtPercent(stops, pct) {
  if (!stops.length) return { r: 255, g: 255, b: 255, a: 1 };
  const s = [...stops].sort((a, b) => a.pos - b.pos);
  if (pct <= s[0].pos) return hexToRgba(s[0].color);
  if (pct >= s[s.length - 1].pos) return hexToRgba(s[s.length - 1].color);
  for (let i = 0; i < s.length - 1; i++) {
    const a = s[i], b = s[i + 1];
    if (pct >= a.pos && pct <= b.pos) {
      const t = (pct - a.pos) / (b.pos - a.pos || 1);
      return mixColors(hexToRgba(a.color), hexToRgba(b.color), t);
    }
  }
  return hexToRgba(s[0].color);
}

function buildCssGradient({ type, repeating, angle, stops }) {
  const sorted = [...stops].sort((a, b) => a.pos - b.pos);
  const func = `${repeating ? "repeating-" : ""}${type}-gradient`;
  const stopsStr = sorted.map((s) => `${s.color} ${s.pos}%`).join(", ");
  if (type === "linear") {
    return `${func}(${angle}deg, ${stopsStr})`;
  }
  if (type === "radial") {
    return `${func}(ellipse at center, ${stopsStr})`;
  }
  if (type === "conic") {
    return `${func}(from ${angle}deg at 50% 50%, ${stopsStr})`;
  }
  return `${func}(${stopsStr})`;
}

function tailwindArbitrary(cssGradient) {
  const inner = cssGradient.replace(/\s+/g, " ").trim();
  return `bg-[${inner}]`;
}
function tailwindFromViaTo(stops) {
  const sorted = [...stops].sort((a, b) => a.pos - b.pos);
  const colors = sorted.map(s => s.color.toLowerCase());
  if (colors.length === 1) return `bg-[${colors[0]}]`;
  if (colors.length === 2) return `bg-gradient-to-r from-[${colors[0]}] to-[${colors[1]}]`;
  const first = colors[0];
  const via = colors[Math.floor(colors.length / 2)];
  const last = colors[colors.length - 1];
  return `bg-gradient-to-r from-[${first}] via-[${via}] to-[${last}]`;
}

/* --------------- Component --------------- */
export default function GradientPlayground() {

  
    const { theme } = useTheme();
    const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    

  // gradient state
  const [stops, setStops] = useState(DEFAULT_STOPS.map(s => ({ ...s })));
  const [angle, setAngle] = useState(90);
  const [type, setType] = useState("linear"); // linear | radial | conic
  const [repeating, setRepeating] = useState(false);

  // UI state
  const [name, setName] = useState("my-gradient");
  const [previewOpacity, setPreviewOpacity] = useState(1);
  const [fullscreen, setFullscreen] = useState(false);
  const [watermark, setWatermark] = useState(true);
  const [scaleExport, setScaleExport] = useState(2); // export scale multiplier
  const [loading, setLoading] = useState(false);
   const [copied, setCopied] = useState(false);
   const [copied1, setCopied1] = useState(false);


  const previewRef = useRef(null);
  const previewWrapRef = useRef(null);

  const sortedStops = useMemo(() => [...stops].sort((a, b) => a.pos - b.pos), [stops]);
  const cssGradient = useMemo(() => buildCssGradient({ type, repeating, angle, stops }), [type, repeating, angle, stops]);
  const cssSnippet = useMemo(() => `/* ${name} */\nbackground-image: ${cssGradient};\n${previewOpacity < 1 ? `opacity: ${previewOpacity.toFixed(2)};` : ""}\n`, [cssGradient, name, previewOpacity]);
  const tailwindArb = useMemo(() => tailwindArbitrary(cssGradient), [cssGradient]);
  const tailwindFvt = useMemo(() => tailwindFromViaTo(stops), [stops]);
  const colorBarCss = useMemo(() => {
    const stopsStr = sortedStops.map(s => `${s.color} ${s.pos}%`).join(", ");
    return `linear-gradient(90deg, ${stopsStr})`;
  }, [sortedStops]);

  /* -------------- helpers -------------- */
  const updateStop = useCallback((id, patch) => {
    setStops(s => s.map(st => (st.id === id ? { ...st, ...patch } : st)));
  }, []);

  const addStop = useCallback(() => {
    setStops(s => {
      const pos = 50;
      return [...s, { id: uid(), color: "#ffffff", pos }];
    });
  }, []);

  const removeStop = useCallback((id) => {
    setStops(s => (s.length <= 2 ? s : s.filter(st => st.id !== id)));
  }, []);

  const nudgeStop = useCallback((id, delta) => {
    setStops(s => s.map(st => (st.id === id ? { ...st, pos: clamp(st.pos + delta, 0, 100) } : st)));
  }, []);

  const randomize = useCallback(() => {
    const rnd = () => "#" + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, "0");
    setStops(s => s.map(st => ({ ...st, color: rnd(), pos: Math.round(Math.random() * 100) })));
    showToast("success", "Randomized stops");
  }, []);

  const reset = useCallback(() => {
    setStops(DEFAULT_STOPS.map(d => ({ ...d, id: uid() })));
    setAngle(90);
    setType("linear");
    setRepeating(false);
    setPreviewOpacity(1);
    showToast("success", "Reset to defaults");
  }, []);

  const copyCss = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cssSnippet);
      showToast("success", "Copied CSS");
    } catch {
      showToast("error", "Copy failed");
    }
  }, [cssSnippet]);

  const copyTailwind = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(tailwindArb);
      showToast("success", "Copied Tailwind (arbitrary)");
    } catch {
      showToast("error", "Copy failed");
    }
  }, [tailwindArb]);

  /* -------------- Export PNG using html-to-image -------------- */
  const capturePng = useCallback(async ({ withWatermark = true, fileName = `${name || "gradient"}.png`, scale = 2 } = {}) => {
    try {
      if (!previewWrapRef.current) return showToast("error", "Preview not available");
      setLoading(true);

      // Ensure watermark vis state set as desired during capture
      const watermarkNodes = previewWrapRef.current.querySelectorAll("[data-gradient-watermark]");
      watermarkNodes.forEach(node => {
        if (withWatermark) node.style.visibility = "visible";
        else node.style.visibility = "hidden";
      });

      // Use html-to-image to capture high-resolution PNG
      // We capture the wrapper so the full padding and text are included
      const node = previewWrapRef.current;
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: Math.max(1, scale),
        // filter: (n) => { /* optionally filter elements */ return true; },
      });

      // restore visibility (just in case)
      watermarkNodes.forEach(node => (node.style.visibility = ""));

      // trigger download
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      showToast("success", "PNG downloaded");
    } catch (err) {
      console.error("capture error", err);
      showToast("error", "PNG export failed");
    } finally {
      setLoading(false);
    }
  }, [name]);

  /* -------------- Fullscreen overlay (not dialog) -------------- */
  const openFullscreen = useCallback(() => setFullscreen(true), []);
  const closeFullscreen = useCallback(() => setFullscreen(false), []);

  /* -------------- Accessibility keyboard shortcuts -------------- */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        // Ctrl/Cmd+S to download PNG fast
        capturePng({ withWatermark: false, scale: 2 });
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
        e.preventDefault();
        copyCss();
      }
      if (e.key === "Escape") {
        if (fullscreen) closeFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [capturePng, copyCss, fullscreen, closeFullscreen]);

  /* -------------- Presets -------------- */
const PRESETS = [
  { name: "Sunset", stops: ["#ff7e5f", "#feb47b"] },
  { name: "Aqua", stops: ["#06b6d4", "#7dd3fc"] },
  { name: "Purple Dream", stops: ["#7c3aed", "#06b6d4", "#ef4444"] },
  { name: "Moss", stops: ["#34d399", "#3b82f6"] },
  { name: "Dusk", stops: ["#0f172a", "#475569", "#06b6d4"] },

  // ⭐ 50 NEW PREMIUM PRESETS
  { name: "Aurora Green", stops: ["#00c6fb", "#005bea"] },
  { name: "Blush Pink", stops: ["#ff9a9e", "#fecfef"] },
  { name: "Peachy Glow", stops: ["#ffecd2", "#fcb69f"] },
  { name: "Deep Ocean", stops: ["#2E3192", "#1BFFFF"] },
  { name: "Royal Glow", stops: ["#4568dc", "#b06ab3"] },
  { name: "Warm Horizon", stops: ["#f6d365", "#fda085"] },
  { name: "Blue Lagoon", stops: ["#43cea2", "#185a9d"] },
  { name: "Midnight City", stops: ["#0f2027", "#203a43", "#2c5364"] },
  { name: "Peach Bloom", stops: ["#f78ca0", "#f9748f", "#fd868c", "#fe9a8b"] },
  { name: "Candy Burst", stops: ["#f857a6", "#ff5858"] },
  { name: "Neon Mint", stops: ["#52E5E7", "#130CB7"] },
  { name: "Berry Mix", stops: ["#4b134f", "#c94b4b"] },
  { name: "Electric Violet", stops: ["#4776E6", "#8E54E9"] },
  { name: "Crimson Heat", stops: ["#ff512f", "#dd2476"] },
  { name: "Skyline", stops: ["#1488CC", "#2B32B2"] },
  { name: "Velvet Rose", stops: ["#e96443", "#904e95"] },
  { name: "Lime Splash", stops: ["#B2FEFA", "#0ED2F7"] },
  { name: "Frozen Dream", stops: ["#403B4A", "#E7E9BB"] },
  { name: "Fiery Bloom", stops: ["#f12711", "#f5af19"] },
  { name: "Pink Crush", stops: ["#F36265", "#961276"] },
  { name: "Azure Flow", stops: ["#1FA2FF", "#12D8FA", "#A6FFCB"] },
  { name: "Steel Blue", stops: ["#2980B9", "#6DD5FA", "#FFFFFF"] },
  { name: "Golden Sand", stops: ["#E6DADA", "#274046"] },
  { name: "Mocha Brown", stops: ["#B79891", "#94716B"] },
  { name: "Royal Gold", stops: ["#f6d365", "#fda085", "#f3a683"] },
  { name: "Horizon Blue", stops: ["#005AA7", "#FFFDE4"] },
  { name: "Plum & Sky", stops: ["#EECDA3", "#EF629F"] },
  { name: "Dark Galaxy", stops: ["#20002c", "#cbb4d4"] },
  { name: "Cosmic Blue", stops: ["#2C3E50", "#4CA1AF"] },
  { name: "Olive Forest", stops: ["#3C7345", "#87BA65"] },
  { name: "Neon Sunrise", stops: ["#FF512F", "#F09819"] },
  { name: "Abyss Purple", stops: ["#614385", "#516395"] },
  { name: "Soft Sky", stops: ["#76b2fe", "#b69efe"] },
  { name: "Teal Mist", stops: ["#13547a", "#80d0c7"] },
  { name: "Lavender Fields", stops: ["#c3cfe2", "#f5f7fa"] },
  { name: "Ocean Mint", stops: ["#00d2ff", "#3a7bd5"] },
  { name: "Rose Garden", stops: ["#ff9a9e", "#f6abb6"] },
  { name: "Jungle Heat", stops: ["#12c2e9", "#c471ed", "#f64f59"] },
  { name: "Mint Breeze", stops: ["#76f7a1", "#2ec4b6"] },
  { name: "Shadow Night", stops: ["#000428", "#004e92"] },
  { name: "Cyber Neon", stops: ["#00c3ff", "#ffff1c"] },
  { name: "Pink Flame", stops: ["#f953c6", "#b91d73"] },
  { name: "Metallic Blue", stops: ["#1488CC", "#2B32B2"] },
  { name: "Sunset Fusion", stops: ["#ff416c", "#ff4b2b"] },
  { name: "Steel Mint", stops: ["#4ca1af", "#c4e0e5"] },
  { name: "Emerald Mist", stops: ["#348F50", "#56B4D3"] },
  { name: "Golden Hour", stops: ["#fceabb", "#f8b500"] },
  { name: "Arctic White", stops: ["#e0eafc", "#cfdef3"] },
  { name: "Coffee Glow", stops: ["#b99362", "#8ca6db"] },
  { name: "Red Fusion", stops: ["#cb2d3e", "#ef473a"] }
];


    const handleCopy = () => {
    navigator.clipboard.writeText(tailwindArb);
    setCopied(true);
    showToast("success", "Copied Tailwind");
    setTimeout(() => setCopied(false), 1500);
  };

  const handleCopy1 = async () => {
    try {
      await navigator.clipboard.writeText(cssSnippet || "");
      setCopied1(true);
      showToast("success", "Copied CSS");
      // revert icon after 1.5s
      setTimeout(() => setCopied1(false), 1500);
    } catch {
      showToast("error", "Copy failed");
    }
  };

  return (
    <div className="min-h-screen max-w-8xl overflow-hidden mx-auto py-8 px-4 md:px-8">
      <Toaster richColors />
      <header className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
            Gradient Playground
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Live CSS & Tailwind gradient authoring.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button className="cursor-pointer" variant="secondary" onClick={randomize}><Shuffle className="w-4 h-4" />Randomize</Button>
          <Button className="cursor-pointer" variant="outline" onClick={reset}><RotateCcw className="w-4 h-4 " />Reset</Button>
          <Button className="cursor-pointer" onClick={openFullscreen}><Maximize2 className="w-4 h-4 " />Preview</Button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: controls */}
        <aside className="lg:col-span-3">
          <Card className="shadow dark:bg-black/80 bg-white/80">
            <CardHeader>
              <CardTitle>Controls</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="space-y-4">
                <Label className="text-xs">Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs my-2">Type</Label>
                    <Select value={type} onValueChange={(v) => setType(v)}>
                      <SelectTrigger className="w-full cursor-pointer"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem className="cursor-pointer"  value="linear">Linear</SelectItem>
                        <SelectItem className="cursor-pointer" value="radial">Radial</SelectItem>
                        <SelectItem className="cursor-pointer" value="conic">Conic</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs my-2">Repeating</Label>
                    <div className="mt-3 flex items-center gap-2">
                      <Checkbox className="cursor-pointer" id="rep" checked={repeating} onCheckedChange={(v) => setRepeating(Boolean(v))} />
                      <label htmlFor="rep" className="text-sm">Repeating</label>
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs mt-2">Angle / Start ({angle}°)</Label>
                  <div className="flex items-center gap-3">
                    <Slider  value={[angle]} onValueChange={(v) => setAngle(v[0])} min={0} max={360} step={1} className="flex-1 cursor-pointer" />
                    <div className="w-14 text-right text-xs">{angle}°</div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs mt-2">Opacity ({Math.round(previewOpacity * 100)}%)</Label>
                  <div className="flex items-center gap-3">
                    <Slider value={[Math.round(previewOpacity * 100)]} onValueChange={(v) => setPreviewOpacity(v[0] / 100)} min={10} max={100} step={1} className="flex-1 cursor-pointer" />
                    <div className="w-14 text-right text-xs">{Math.round(previewOpacity * 100)}%</div>
                  </div>
                </div>

                <Separator />

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs">Color stops</Label>
                    <div className="flex items-center gap-2">
                      <Button className="cursor-pointer" size="sm" variant="ghost" onClick={addStop}><Plus className="w-4 h-4" /></Button>
                      <Button className="cursor-pointer" size="sm" variant="ghost" onClick={() => { setStops(s => s.slice(0, 2)); showToast("success", "Trimmed to 2 stops"); }}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>

                  {/* Color bar */}
                  <div className="h-9 rounded-md mb-3 border overflow-hidden" style={{ backgroundImage: colorBarCss }} aria-hidden />

<div className="space-y-4">
  {sortedStops.map((st, idx) => (
    <div
      key={st.id}
      className="
        flex flex-col sm:flex-row '
        flex-wrap
        sm:items-center gap-3 p-3 
        rounded-lg border bg-muted/30
      "
    >
      {/* Row 1: Color + HEX + Remove */}
      <div className="flex items-center  gap-3 w-full sm:w-auto">
        
        {/* Color Preview + Invisible Input */}
        <div className="relative">
          <div
            style={{ background: st.color }}
            className="w-10 h-10 rounded-md border shadow-sm"
          />
          <input
            type="color"
            value={st.color}
            onChange={(e) => updateStop(st.id, { color: e.target.value })}
            className="absolute inset-0 opacity-0 cursor-pointer"
            aria-label={`Stop color ${idx + 1}`}
          />
        </div>

        {/* HEX Input */}
        <input
          className="
            w-32 h-10 rounded px-2 border 
            font-mono text-sm bg-background
          "
          value={st.color}
          onChange={(e) => updateStop(st.id, { color: e.target.value })}
          aria-label={`Stop hex ${idx + 1}`}
        />

        {/* Remove (mobile friendly) */}
        <Button
          size="icon"
          variant="destructive"
          className="shrink-0 cursor-pointer sm:hidden"
          onClick={() => removeStop(st.id)}
          disabled={sortedStops.length <= 2}
        >
          <Trash2 className="w-4 h-4" />
        </Button>
            <Button className="cursor-pointer shrink-0 sm:hidden" size="sm" variant="outline" onClick={() => nudgeStop(st.id, -1)}>
            <MinusCircle/>
          </Button>
          <Button className="cursor-pointer shrink-0 sm:hidden" size="sm" variant="outline" onClick={() => nudgeStop(st.id, 1)}>
            <PlusCircle/>
          </Button>
      </div>

      {/* Row 2: Slider + % + Nudge Buttons */}
      <div className="flex items-center gap-3 flex-1">

        {/* Slider grows nicely */}
        <div className="flex-1">
          <Slider
            value={[st.pos]}
            onValueChange={(v) => updateStop(st.id, { pos: Math.round(v[0]) })}
            min={0}
            max={100}
            step={1}
            className="cursor-pointer"
          />
        </div>

        <div className="text-xs w-12 text-right">{st.pos}%</div>

        {/* Desktop: Nudge Buttons */}
        <div className="hidden sm:flex items-center gap-1">
          <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => nudgeStop(st.id, -1)}>
            <MinusCircle/>
          </Button>
          <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => nudgeStop(st.id, 1)}>
            <PlusCircle/>
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => removeStop(st.id)}
            disabled={sortedStops.length <= 2}
            className="cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>

      </div>
    </div>
  ))}
</div>

                </div>

                <Separator />

                <div className="flex flex-wrap gap-2">
                  <Button className="cursor-pointer" onClick={copyCss}><Copy className="w-4 h-4 " />Copy CSS</Button>
                  <Button className="cursor-pointer" variant="outline" onClick={copyTailwind}><Code className="w-4 h-4 " />Copy Tailwind</Button>
                  <Button className="cursor-pointer" variant="outline" onClick={() => navigator.clipboard.writeText(tailwindFvt)}><Badge className="" />Copy F/V/T</Button>
                </div>

                <div className="text-xs text-muted-foreground mt-2">
                  Tip: Tailwind arbitrary classes require JIT/safelist: <code>{`bg-[linear-gradient(...)]`}</code>
                </div>
              </div>
            </CardContent>
          </Card>
          
      
     
          <Card className="shadow mt-2 dark:bg-black/80 bg-white/80">
            <CardHeader><CardTitle>Presets</CardTitle></CardHeader>
            <CardContent className="h-60 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                {PRESETS.map(p => (
                  <button
                    key={p.name}
                    onClick={() => {
                      setStops(p.stops.map((c, i) => ({ id: uid(), color: c, pos: Math.round((i / (p.stops.length - 1 || 1)) * 100) })));
                      showToast("success", `Loaded ${p.name}`);
                    }}
                    className="px-3 py-2 cursor-pointer rounded border flex items-center gap-2"
                  >
                    <div className="w-10 h-6 rounded" style={{ background: `linear-gradient(90deg, ${p.stops.join(", ")})` }} />
                    <div className="text-sm">{p.name}</div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow mt-2 dark:bg-black/80 bg-white/80">
            <CardHeader><CardTitle>Accessibility</CardTitle></CardHeader>
            <CardContent>
              <div className="text-xs text-muted-foreground">
                Tip: For readable overlay text, add an overlay like <code>background: linear-gradient(...), rgba(0,0,0,0.35)</code> or use strong text outlines. Use contrast checkers for important content.
              </div>
            </CardContent>
          </Card>
        
        </aside>

        {/* Center: live preview + export */}
        <section className="lg:col-span-9 space-y-4">
          <Card className="shadow dark:bg-black/80 bg-white/80">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Live preview
                <Badge className="backdrop-blur-md bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300 ml-2">{type}</Badge>
              </CardTitle>
               
              <div className="flex items-center gap-2">
               
                <Button variant="ghost" className="cursor-pointer" size="sm" onClick={openFullscreen}><Maximize2 className="w-4 h-4" /></Button>
                <Button variant="ghost" className="cursor-pointer" size="sm" onClick={() => capturePng({ withWatermark: watermark, scale: scaleExport })}><ImageIcon className="w-4 h-4" /></Button>
              </div>
            </CardHeader>

            <CardContent>
              {/* Wrapper that we capture via html-to-image */}
              <div ref={previewWrapRef} className="rounded-lg border overflow-hidden relative" style={{ minHeight: 420, padding: 10 }}>
                <div
                  ref={previewRef}
                  className="w-full h-full rounded-md flex items-center justify-center"
                  style={{
                    backgroundImage: cssGradient,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    opacity: previewOpacity,
                    width: "100%",
                    height: "420px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {/* Inner box to ensure centered watermark and consistent capture */}
                  <div className="px-8 py-4 rounded bg-white/10 backdrop-blur-sm" style={{ textAlign: "center" }}>
                    <div className="text-3xl font-extrabold text-white drop-shadow-md">Revolyx Designs</div>
                    <div className="text-sm text-white/70 mt-1">Gradient preview</div>
                  </div>

                  {/* watermark overlay element (we'll toggle visibility during capture) */}
                  <div data-gradient-watermark style={{ position: "absolute", bottom: 12, right: 12, background: "rgba(0,0,0,0.4)", color: "#fff", padding: "6px 10px", borderRadius: 6, fontSize: 12, visibility: watermark ? "visible" : "hidden" }}>
                    Revolyx Designs
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Download PNG</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Button  variant="outline" className="cursor-pointer" onClick={() => capturePng({ withWatermark: true, scale: 1 })}>PNG (screen)</Button>
                    <Button variant="outline" className="cursor-pointer" onClick={() => capturePng({ withWatermark: true, scale: 2 })}>PNG (2×)</Button>
                    <Button variant="outline" className="cursor-pointer" onClick={() => capturePng({ withWatermark: false, scale: 2 })}>PNG (no watermark)</Button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Preview options</Label>
                  <div className="mt-2 flex items-center gap-3">
                    <Checkbox className="cursor-pointer" id="wm" checked={watermark} onCheckedChange={(v) => setWatermark(Boolean(v))} />
                    <label htmlFor="wm" className="text-sm">Watermark</label>
                  </div>

                  <div className="mt-3">
                    <Label className="text-xs mb-2">Export scale</Label>
                    <Select value={String(scaleExport)} onValueChange={(v) => setScaleExport(Number(v))}>
                      <SelectTrigger className="w-full cursor-pointer"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem className="cursor-pointer" value="1">1× (screen)</SelectItem>
                        <SelectItem className="cursor-pointer" value="2">2× (high-res)</SelectItem>
                        <SelectItem className="cursor-pointer" value="3">3×</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow dark:bg-black/80 bg-white/80">
            <CardHeader><CardTitle>Export & share</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
             <div className="relative ">
      <Label className="text-xs mb-2 block">CSS</Label>

      {/* Code block */}
      <pre
        className="rounded border p-3 bg-white/60 dark:bg-zinc-900/60 font-mono text-sm overflow-auto max-h-36 whitespace-pre-wrap"
        aria-live="polite"
      >
        {cssSnippet}
      </pre>

      {/* Floating copy button */}
      <button
        onClick={handleCopy1}
        aria-label="Copy CSS to clipboard"
        className={`
          absolute top-2 cursor-pointer right-2
          p-1.5 rounded-md
          bg-zinc-200/70 dark:bg-zinc-800/70
          hover:bg-zinc-300 dark:hover:bg-zinc-700
          transition
          border border-zinc-300 dark:border-zinc-700
          backdrop-blur-sm
          flex items-center justify-center
        `}
      >
        {copied1 ? (
          <Check className="w-4 h-4 text-emerald-500" />
        ) : (
          <Copy className="w-4 h-4 text-zinc-600 dark:text-zinc-300" />
        )}
      </button>

    </div>

          <div className="relative">
      <Label className="text-xs mb-2 block">Tailwind</Label>

      {/* Code Box */}
      <pre className="rounded border p-3 bg-white/60 dark:bg-zinc-900/60 font-mono text-sm overflow-auto max-h-36 whitespace-pre-wrap">
{`class="${tailwindArb}"
# or
class="${tailwindFvt}"`}
      </pre>

      {/* Floating Copy Button (top-right) */}
      <button
        onClick={handleCopy}
        className="
          absolute top-2 right-2
          p-1.5 rounded-md
          bg-zinc-200/70 cursor-pointer dark:bg-zinc-800/70
          hover:bg-zinc-300 dark:hover:bg-zinc-700
          transition-all
          border border-zinc-300 dark:border-zinc-700
          backdrop-blur-sm
        "
      >
        {copied ? (
          <Check className="w-4 h-4 text-green-500 transition-all" />
        ) : (
          <Copy className="w-4 h-4 text-zinc-600 dark:text-zinc-300 transition-all" />
        )}
      </button>
    </div>
              </div>
            </CardContent>
          </Card>
        </section>

      </main>

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6">
          <div className="absolute p-2 bottom-6 sm:top-6 right-6 z-60 flex flex-wrap gap-2">
            <Button className="cursor-pointer" variant="secondary" size="sm" onClick={() => capturePng({ withWatermark: watermark, scale: 2 })}><Copyright className="w-4 h-4 " /></Button>
            <Button className="cursor-pointer" variant="secondary" size="sm" onClick={() => capturePng({ withWatermark: false, scale: 2 })}><Stamp className="w-4 h-4" /></Button>
            <Button className="cursor-pointer" size="sm" onClick={closeFullscreen}><Minimize2 className="w-4 h-4 " />Close</Button>
          </div>

          <div
            className="w-full h-full max-w-6xl max-h-full rounded overflow-hidden flex items-center justify-center"
            style={{ padding: 24 }}
          >
            {/* full-screen preview area — we reuse previewRef and previewWrapRef content by cloning DOM styling */}
            <div
              className="w-full h-[80%] sm:h-full rounded-lg flex items-center justify-center relative"
              style={{ backgroundImage: cssGradient, backgroundSize: "cover", backgroundPosition: "center", opacity: previewOpacity }}
            >
              <div className="px-12 py-8 rounded bg-white/10 backdrop-blur-sm text-center">
                <div className="text-6xl font-extrabold text-white drop-shadow-lg">Revolyx Designs</div>
                <div className="text-lg text-white/80 mt-2">Gradient preview</div>
              </div>

              <div style={{ position: "absolute", bottom: 24, right: 24, background: "rgba(0,0,0,0.45)", color: "#fff", padding: "8px 12px", borderRadius: 8, visibility: watermark ? "visible" : "hidden" }}>
                Revolyx Designs
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
