// ColorMindPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  RefreshCw,
  Palette,
  Copy,
  Download,
  ArrowRight,
  List,
  Eye,
  SunMoon,
  X,
  Check,
  ArrowDownCircle,
  FileText,
  BrushCleaning
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";
// shadcn sheet (mobile sidebar)
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

/**
 * ColorMindPage (improved)
 *
 * - Mobile sheet sidebar (10 random + presets)
 * - Search across presets & random
 * - Animated copy button: shows tick on success then resets
 * - Raw response shown only when toggled
 * - Better responsive layout and cursor:pointer for interactive elements
 */

const API_ENDPOINT = "/api/colormind";
const DEFAULT_MODEL = "default";

const PRESET_SUGGESTIONS = [
  { id: "neo", title: "Neo (cyber)", seed: [25, 200, 240] },
  { id: "sunset", title: "Warm Sunset", seed: [245, 90, 70] },
  { id: "forest", title: "Forest Green", seed: [34, 139, 34] },
  { id: "pastel", title: "Soft Pastel", seed: [238, 201, 255] },
  { id: "mono", title: "Monochrome", seed: [40, 40, 40] },
  { id: "ocean", title: "Deep Ocean", seed: [8, 118, 172] },
  { id: "sun", title: "Sunny", seed: [255, 200, 50] },
];

function randomSeed() {
  return [rand255(), rand255(), rand255()];
}
function rand255() {
  return Math.floor(Math.random() * 256);
}

function rgbToHex([r, g, b]) {
  const toHex = (n) => n.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}
function rgbToCssRgb([r, g, b]) {
  return `rgb(${r}, ${g}, ${b})`;
}
function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}
function averageLuminance([r, g, b]) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export default function ColorMindPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [query, setQuery] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [palette, setPalette] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSwatch, setSelectedSwatch] = useState(null);

  // UI states
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  // copy animation states
  const [copiedCss, setCopiedCss] = useState(false);
  const [copiedHexIndex, setCopiedHexIndex] = useState(null); // index of swatch last copied (for animation)
  const copyTimers = useRef({});

  // generate a rotating pool of 10 random suggestions (varies every load)
  const randomPresets = useMemo(() => {
    const arr = Array.from({ length: 10 }).map((_, i) => ({
      id: `rand-${i}-${Math.random().toString(36).slice(2, 6)}`,
      title: `Random ${i + 1}`,
      seed: randomSeed(),
    }));
    return arr;
  }, []);

  // combined suggestions used for searching/listing
  const combinedSuggestions = useMemo(() => [...PRESET_SUGGESTIONS, ...randomPresets], [randomPresets]);

  // filtered list for sidebar / dropdown
  const filteredSuggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return combinedSuggestions;
    return combinedSuggestions.filter((s) => s.title.toLowerCase().includes(q) || s.id.includes(q) || rgbToHex(s.seed).toLowerCase().includes(q));
  }, [query, combinedSuggestions]);

  useEffect(() => {
    // initial palette
    generatePalette();
    return () => {
      Object.values(copyTimers.current).forEach((t) => clearTimeout(t));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // palette meta
  const paletteMeta = useMemo(() => {
    if (!palette) return [];
    return palette.map((rgb) => {
      const hex = rgbToHex(rgb);
      const rgbCss = rgbToCssRgb(rgb);
      const lum = averageLuminance(rgb);
      const textColor = lum > 160 ? "#0b0b0b" : "#ffffff";
      return { rgb, hex, rgbCss, lum, textColor };
    });
  }, [palette]);

  const cssSnippet = useMemo(() => {
    if (!palette) return "";
    return palette
      .map((c, i) => `--color-${i + 1}: ${rgbToHex(c)}; /* ${rgbToCssRgb(c)} */`)
      .join("\n");
  }, [palette]);

  // request to Colormind (serverless proxy at /api/colormind)
  async function generatePalette({ seed } = {}) {
    setLoading(true);
    try {
      const input = Array(5).fill("N");
      if (seed && Array.isArray(seed) && seed.length === 3) {
        input[0] = seed;
      }
      const payload = { model: DEFAULT_MODEL, input };

      const res = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        showToast("error", `Colormind request failed (${res.status})`);
        setLoading(false);
        return;
      }
      const json = await res.json();
      const result = json?.result || null;
      if (result && Array.isArray(result)) {
        setPalette(result);
        setRawResp(json);
        showToast("success", "Palette generated");
      } else {
        showToast("error", "Unexpected response from Colormind");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Network error generating palette");
    } finally {
      setLoading(false);
    }
  }

  function chooseSuggestion(s) {
    setQuery(s.title);
    setShowSuggest(false);
    setMobileSheetOpen(false);
    generatePalette({ seed: s.seed });
  }

  // copy CSS with animation
  async function copyPaletteCss() {
    if (!palette) return showToast("info", "No palette to copy");
    const cssVars = palette
      .map((c, i) => `--c${i + 1}: ${rgbToHex(c)}; /* ${rgbToCssRgb(c)} */`)
      .join("\n");
    const css = `:root {\n${cssVars}\n}`;
    try {
      await navigator.clipboard.writeText(css);
      setCopiedCss(true);
      showToast("success", "CSS variables copied");
      // reset after 1.6s
      if (copyTimers.current.css) clearTimeout(copyTimers.current.css);
      copyTimers.current.css = setTimeout(() => setCopiedCss(false), 1600);
    } catch {
      showToast("error", "Copy failed");
    }
  }

  // copy single hex with animation indicator for that index
  async function copyColorHex(hex, index) {
    try {
      await navigator.clipboard.writeText(hex);
      setCopiedHexIndex(index);
      showToast("success", `${hex} copied`);
      if (copyTimers.current[`hex-${index}`]) clearTimeout(copyTimers.current[`hex-${index}`]);
      copyTimers.current[`hex-${index}`] = setTimeout(() => {
        // only clear if not overwritten
        setCopiedHexIndex((cur) => (cur === index ? null : cur));
      }, 1400);
    } catch {
      showToast("error", "Copy failed");
    }
  }

  function downloadJSON() {
    if (!rawResp && !palette) return showToast("info", "No palette to download");
    const payload = rawResp || { result: palette };
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `colormind_palette_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "JSON downloaded");
  }

  function downloadSwatchesImage() {
    if (!palette) return showToast("info", "No palette to export");
    const canvas = document.createElement("canvas");
    const w = 1200;
    const h = 240;
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    const sw = w / palette.length;
    palette.forEach((c, i) => {
      ctx.fillStyle = rgbToHex(c);
      ctx.fillRect(i * sw, 0, sw, h);
    });
    canvas.toBlob((blob) => {
      if (!blob) return showToast("error", "Export failed");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `palette_${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      showToast("success", "PNG exported");
    });
  }

  function openSwatch(i) {
    setSelectedSwatch({ index: i, meta: paletteMeta[i] });
    setDialogOpen(true);
  }

  return (
    <div className={clsx("min-h-screen p-4 md:p-6 max-w-8xl mx-auto", isDark ? "bg-black text-zinc-100" : "bg-slate-50 text-zinc-900")}>
      {/* Header */}
      <header className="flex items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">Chromatic — Color Scheme Generator</h1>
          <p className="mt-1 text-sm opacity-70">AI palettes using Colormind. Seed or pick a mood, export CSS / PNG / JSON.</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Mobile sheet trigger */}
          <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
            <SheetTrigger asChild>
               <Button  variant="ghost" className="md:hidden cursor-pointer" aria-label="Open presets">
                <List />
              </Button>
            </SheetTrigger>

            <SheetContent side="right" className=" p-3">
              <div className={clsx("p-4", isDark ? "bg-black/80" : "bg-white")}>
                <div className="flex items-center gap-2 mr-3 mb-3">
                  <Search className="opacity-60" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search presets or colors"
                    className="flex-1"
                  />
                   <Button className="cursor-pointer" variant="ghost" onClick={() => { setQuery(""); }}>
                    <BrushCleaning />
                  </Button>
                </div>

                <ScrollArea style={{ height: 420 }}>
                  <div className="grid gap-2">
                    {filteredSuggestions.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => chooseSuggestion(s)}
                        className={clsx("flex items-center gap-3 p-3 rounded-md hover:shadow-sm transition-shadow cursor-pointer", isDark ? "bg-black/20" : "bg-white/80")}
                      >
                        <div className="w-12 h-8 rounded-sm flex-shrink-0 border" style={{ background: rgbToHex(s.seed) }} />
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">{s.title}</div>
                          <div className="text-xs opacity-60">{rgbToCssRgb(s.seed)}</div>
                        </div>
                        <div className="text-xs opacity-60">Seed</div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
                <div className="mt-4 text-xs opacity-60">Tap a preset to generate</div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop search + generate */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const found = combinedSuggestions.find((s) => s.title.toLowerCase() === query.trim().toLowerCase());
              if (found) chooseSuggestion(found);
              else generatePalette();
              setShowSuggest(false);
            }}
            className={clsx("hidden md:flex items-center gap-2 w-[520px] rounded-lg px-3 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}
          >
            <Search className="opacity-60" />
            <Input
              placeholder="Search presets (e.g., 'sunset', '#F5A') or press Enter to generate"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowSuggest(true); }}
              className="border-0 shadow-none bg-transparent outline-none"
            />
            <Button type="submit" variant="outline" className="px-3 cursor-pointer">
              <ArrowRight />
            </Button>
            <Button type="button" variant="outline" onClick={() => generatePalette()} className="px-3 cursor-pointer">
              <RefreshCw className={loading ? "animate-spin" : ""} /> Regenerate
            </Button>
          </form>

          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setShowRaw((s) => !s)} className="hidden md:flex cursor-pointer" title="Toggle raw response">
              <FileText />
            </Button>
            
          </div>
        </div>
      </header>

      {/* Suggest dropdown (desktop) */}
      <AnimatePresence>
        {showSuggest && filteredSuggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={clsx("absolute z-50 left-4 right-4 md:left-[calc(50%_-_260px)] md:right-auto max-w-2xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
          >
            {filteredSuggestions.slice(0, 8).map((s) => (
              <li key={s.id} onClick={() => chooseSuggestion(s)} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 rounded-md overflow-hidden border" style={{ background: rgbToHex(s.seed) }} />
                  <div className="flex-1">
                    <div className="font-medium">{s.title}</div>
                    <div className="text-xs opacity-60">Seed: {rgbToCssRgb(s.seed)}</div>
                  </div>
                  <div className="text-xs opacity-60">Preset</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: Sidebar (desktop only) */}
        <aside className={clsx("hidden lg:block lg:col-span-3 space-y-4 p-4 rounded-2xl border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Presets</div>
            <div className="text-xs opacity-60">10 random + presets</div>
          </div>

          <div className="mt-3">
            <Input placeholder="Search presets" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>

          <ScrollArea style={{ height: 380 }} className="mt-3">
            <div className="grid gap-2">
              {filteredSuggestions.map((s) => (
                <button
                  key={s.id}
                  onClick={() => chooseSuggestion(s)}
                  className={clsx("p-2 rounded-md border flex items-center gap-3 text-sm cursor-pointer hover:shadow-sm transition", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}
                >
                  <div className="w-10 h-8 rounded-sm flex-shrink-0 border" style={{ background: rgbToHex(s.seed) }} />
                  <div className="flex-1 text-left">
                    <div className="font-medium">{s.title}</div>
                    <div className="text-xs opacity-60">{rgbToCssRgb(s.seed)}</div>
                  </div>
                  <div className="text-xs opacity-60">Seed</div>
                </button>
              ))}
            </div>
          </ScrollArea>

          <Separator />

          <div>
            <div className="text-sm font-semibold">Quick seed (manual)</div>
            <div className="text-xs opacity-60 mt-1">Type `r,g,b` and hit Use</div>
            <div className="mt-2 grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="r,g,b"
                className={clsx("p-2 rounded-md border text-sm cursor-text", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const v = e.target.value.trim();
                    const parts = v.split(",").map((x) => Number(x.trim()));
                    if (parts.length === 3 && parts.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) {
                      generatePalette({ seed: parts });
                    } else {
                      showToast("info", "Enter seed as: r,g,b (0-255)");
                    }
                  }
                }}
              />
              <button
                className={clsx("col-span-2 p-2 rounded-md border text-sm flex items-center justify-center gap-2 cursor-pointer", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}
                onClick={() => {
                  const v = query.trim();
                  const parts = v.split(",").map((x) => Number(x.trim()));
                  if (parts.length === 3 && parts.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) {
                    generatePalette({ seed: parts });
                  } else {
                    showToast("info", "Type a seed into the search as r,g,b then press Use");
                  }
                }}
              >
                <Palette /> Use
              </button>
            </div>
          </div>
        </aside>

        {/* Center */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-6 flex items-center justify-between", isDark ? "bg-black/40 border-b border-zinc-800" : "bg-white/95 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Palette</CardTitle>
                <div className="text-xs opacity-60">{palette ? `Generated ${palette.length}-color palette` : "No palette yet — generate to begin"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => generatePalette()} className="cursor-pointer">
                  <RefreshCw className={loading ? "animate-spin" : ""} /> Regenerate
                </Button>
                <Button variant="outline" onClick={() => setPalette(null)} className="cursor-pointer">Reset</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-12 text-center"><RefreshCw className="animate-spin mx-auto" /></div>
              ) : !palette ? (
                <div className="py-12 text-center text-sm opacity-60">Click "Regenerate" or select a preset to see a palette.</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
                    {paletteMeta.map((m, i) => (
                      <div key={i} className="rounded-lg overflow-hidden border cursor-pointer">
                        <button
                          onClick={() => openSwatch(i)}
                          className="w-full h-36 flex items-center cursor-pointer justify-center"
                          style={{ background: m.hex }}
                          aria-label={`Open details for color ${m.hex}`}
                        >
                          <div className="text-sm font-semibold select-none" style={{ color: m.textColor }}>{m.hex}</div>
                        </button>

                        <div className={clsx("p-3 flex items-center flex-col gap-3 justify-between", isDark ? "bg-black/20 border-t border-zinc-800" : "bg-white/70 border-t border-zinc-200")}>
                          <div className="text-xs opacity-70">{m.rgbCss}</div>
                          <div className="flex items-center gap-2">
                            {/* Copy hex with animated tick */}
                            <motion.button
                              whileTap={{ scale: 0.96 }}
                              onClick={() => copyColorHex(m.hex, i)}
                              className="flex items-center gap-2 text-xs opacity-80 cursor-pointer"
                              style={{ background: "transparent", border: "none", padding: 0 }}
                            >
                              <AnimatePresence>
                                {copiedHexIndex === i ? (
                                  <motion.span initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-1">
                                    <Check className="w-4 h-4" />
                                    <span className="text-[11px]">Copied</span>
                                  </motion.span>
                                ) : (
                                  <motion.span className="flex gap-1" initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ opacity: 0 }}>
                                    <Copy className="w-4 h-4" />hex
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </motion.button>
                            

                            <button
                              onClick={() => { navigator.clipboard.writeText(m.rgbCss); showToast("success", "RGB copied"); }}
                              className="text-xs flex gap-1 opacity-70 cursor-pointer"
                            >
                                <Copy className="w-4 h-4" />
                              RGB
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Separator className="my-4" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs opacity-60">CSS Variables</div>
                      <pre className={clsx("text-xs p-3 mt-2 rounded-md overflow-auto", isDark ? "bg-black/20 border border-zinc-800" : "bg-white/70 border border-zinc-200")} style={{ maxHeight: 240 }}>
                        {`:root {\n${cssSnippet}\n}`}
                      </pre>
                    </div>

                    <div>
                      <div className="text-xs opacity-60">Export</div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <motion.button
                          onClick={copyPaletteCss}
                          whileTap={{ scale: 0.96 }}
                          className={clsx("px-3 py-2 rounded-md border flex items-center gap-2 cursor-pointer", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}
                          style={{ borderStyle: "solid" }}
                        >
                          <AnimatePresence>
                            {copiedCss ? (
                              <motion.span initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                                <Check className="w-4 h-4" /> Copied
                              </motion.span>
                            ) : (
                              <motion.span initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                                <Copy className="w-4 h-4" /> Copy CSS
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </motion.button>

                        <Button variant="outline" onClick={downloadJSON} className="cursor-pointer"><Download className="w-4 h-4" /> Download JSON</Button>
                        <Button variant="outline" onClick={downloadSwatchesImage} className="cursor-pointer"><ArrowDownCircle className="w-4 h-4" /> Export PNG</Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Raw response viewer toggle */}
          <AnimatePresence>
            {showRaw && rawResp && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/90 border-zinc-200")}>
                  <CardHeader className="p-4">
                    <div className="flex items-center justify-between w-full">
                      <div className="text-sm font-semibold">Raw Response</div>
                      <div className="text-xs opacity-60">JSON</div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs overflow-auto" style={{ maxHeight: 220 }}>{prettyJSON(rawResp)}</pre>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Right: Quick actions (mobile visible as block under center on small screens) */}
        <aside className={clsx("lg:col-span-3 h-fit space-y-4 p-4 rounded-2xl border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Quick Actions</div>
            <div className="text-xs opacity-60">one-click</div>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            <Button variant="outline" onClick={copyPaletteCss} className="cursor-pointer"><Copy /> Copy CSS</Button>
            <Button variant="outline" onClick={downloadJSON} className="cursor-pointer"><Download /> Download JSON</Button>
            <Button variant="outline" onClick={downloadSwatchesImage} className="cursor-pointer"><ArrowDownCircle /> Export PNG</Button>
            <Button variant="outline" onClick={() => setPalette(null)} className="cursor-pointer"><List /> Clear</Button>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold">Preview</div>
            <div className="text-xs opacity-60 mt-2">Apply the palette to a sample layout</div>

            <div className="mt-3 rounded-md border overflow-hidden">
              <div className="p-3" style={{ background: paletteMeta[0]?.hex || "#111" }}>
                <div style={{ color: paletteMeta[4]?.textColor || "#fff" }} className="font-bold p-2">Headline</div>
              </div>
              <div className={clsx("p-3", isDark ? "bg-black/20" : "bg-white/95")}>
                <div style={{ color: paletteMeta[1]?.hex || "#555" }} className="text-sm">This is a preview of the body text color</div>
                <div className="mt-2">
                  <button className="px-3 py-1 rounded-md border mr-2 cursor-pointer" style={{ background: paletteMeta[2]?.hex || "#eee", color: paletteMeta[2]?.textColor || "#000" }}>Primary</button>
                  <button className="px-3 py-1 rounded-md border cursor-pointer" style={{ background: paletteMeta[3]?.hex || "#ddd", color: paletteMeta[3]?.textColor || "#000" }}>Secondary</button>
                </div>
              </div>
            </div>
          </div>

          

        </aside>
      </main>

      {/* Swatch dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-2xl w-full p-3 rounded-2xl overflow-hidden")}>
          <DialogHeader>
            <DialogTitle>{selectedSwatch ? selectedSwatch.meta.hex : "Color"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "45vh", display: "flex", alignItems: "center", justifyContent: "center", background: selectedSwatch?.meta?.hex || "#111" }}>
            {selectedSwatch ? (
              <div className="text-center" style={{ color: selectedSwatch.meta.textColor }}>
                <div className="text-3xl font-bold">{selectedSwatch.meta.hex}</div>
                <div className="mt-2">{selectedSwatch.meta.rgbCss}</div>
                <div className="mt-3 text-sm opacity-80">Luminance: {Math.round(selectedSwatch.meta.lum)}</div>
              </div>
            ) : (
              <div>No color</div>
            )}
          </div>

          <DialogFooter className="flex justify-end items-center p-4 border-t">
            <div className="text-xs opacity-60 mr-auto">Swatch details</div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { if (selectedSwatch) navigator.clipboard.writeText(selectedSwatch.meta.hex); showToast("success", "Hex copied"); }}><Copy /></Button>
               <Button className="cursor-pointer" onClick={() => setDialogOpen(false)}><X /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
