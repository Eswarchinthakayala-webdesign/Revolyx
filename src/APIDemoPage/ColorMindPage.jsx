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
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/**
 * ColorMindPage
 * - POSTs to http://colormind.io/api/ with { model: "default", input: [...] }
 * - Shows a default palette on load
 * - Provides "mood" suggestions which seed the API with one or two colors
 *
 * Notes:
 * - Colormind is HTTP. If your site is HTTPS, you may need a server proxy to avoid mixed content blocks in production.
 */

const API_ENDPOINT = "/api/colormind";
const DEFAULT_MODEL = "default";

// Some pre-made suggestion presets (searchable). Each suggestion can include a seed color (RGB).
const PRESET_SUGGESTIONS = [
  { id: "neo", title: "Neo (cyber)", seed: [25, 200, 240] },
  { id: "sunset", title: "Warm Sunset", seed: [245, 90, 70] },
  { id: "forest", title: "Forest Green", seed: [34, 139, 34] },
  { id: "pastel", title: "Soft Pastel", seed: [238, 201, 255] },
  { id: "mono", title: "Monochrome", seed: [40, 40, 40] },
  { id: "ocean", title: "Deep Ocean", seed: [8, 118, 172] },
  { id: "sun", title: "Sunny", seed: [255, 200, 50] },
];

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
  // Quick perceived luminance (0..255)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export default function ColorMindPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [query, setQuery] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestions, setSuggestions] = useState(PRESET_SUGGESTIONS);
  const [loading, setLoading] = useState(false);
  const [palette, setPalette] = useState(null); // array of [r,g,b] colors
  const [rawResp, setRawResp] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedSwatch, setSelectedSwatch] = useState(null);

  const suggestTimer = useRef(null);

  // On mount: load a default palette
  useEffect(() => {
    generatePalette(); // default seedless generation
    // cleanup
    return () => {
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced suggestion filter
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      const q = v.trim().toLowerCase();
      if (!q) {
        setSuggestions(PRESET_SUGGESTIONS);
        return;
      }
      setSuggestions(
        PRESET_SUGGESTIONS.filter((s) => s.title.toLowerCase().includes(q) || s.id.includes(q))
      );
    }, 220);
  }

  async function generatePalette({ seed } = {}) {
    // seed: optional RGB triple to bias the palette (we place seed at index 0)
    setLoading(true);
    try {
      const input = Array(5).fill("N"); // "N" means unknown in colormind API
      if (seed && Array.isArray(seed) && seed.length === 3) {
        // place seed as first color to bias generation
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
      // Expected shape: { result: [ [r,g,b], ... ] }
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

  // suggestion click
  function chooseSuggestion(s) {
    setQuery(s.title);
    setShowSuggest(false);
    generatePalette({ seed: s.seed });
  }

  function copyPaletteCss() {
    if (!palette) return showToast("info", "No palette to copy");
    const cssVars = palette
      .map((c, i) => `--c${i + 1}: ${rgbToHex(c)}; /* ${rgbToCssRgb(c)} */`)
      .join("\n");
    const css = `:root {\n${cssVars}\n}`;
    navigator.clipboard.writeText(css);
    showToast("success", "CSS variables copied");
  }

  function copyColorHex(hex) {
    navigator.clipboard.writeText(hex);
    showToast("success", `${hex} copied`);
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
    // small canvas export
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

  // derived palette with hex and luminance
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

  // build CSS snippet for display
  const cssSnippet = useMemo(() => {
    if (!palette) return "";
    return palette
      .map((c, i) => `--color-${i + 1}: ${rgbToHex(c)}; /* ${rgbToCssRgb(c)} */`)
      .join("\n");
  }, [palette]);

  // Quick Action: show single swatch details (open dialog)
  function openSwatch(i) {
    setSelectedSwatch({ index: i, meta: paletteMeta[i] });
    setDialogOpen(true);
  }

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto", isDark ? "bg-black text-zinc-100" : "bg-white text-zinc-900")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>
            Chromatic — Color Scheme Generator
          </h1>
          <p className="mt-1 text-sm opacity-70">AI-powered palettes using Colormind. Seed or pick a mood, export CSS, PNG or JSON.</p>
        </div>

        {/* Search / suggestions */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              // If query matches a preset, pick it; otherwise generate seedless
              const found = PRESET_SUGGESTIONS.find((s) => s.title.toLowerCase() === query.trim().toLowerCase());
              if (found) chooseSuggestion(found);
              else generatePalette();
              setShowSuggest(false);
            }}
            className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-2 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}
          >
            <Search className="opacity-60" />
            <Input
              placeholder="Search presets (e.g. 'sunset', 'ocean') or press Enter to generate"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
              aria-label="Search color presets"
            />
            <Button type="submit" variant="outline" className="px-3">
              <ArrowRight />
            </Button>
            <Button type="button" variant="outline" onClick={() => generatePalette()}>
              <RefreshCw className={loading ? "animate-spin" : ""} />
            </Button>
          </form>
        </div>
      </header>

      {/* suggestions dropdown */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {suggestions.map((s) => (
              <li key={s.id} onClick={() => chooseSuggestion(s)} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 rounded-md overflow-hidden" style={{ background: rgbToHex(s.seed) }} />
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

      {/* Layout: left (controls) | center (palette) | right (quick actions) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: Controls & small palette library (2 cols on md) */}
        <aside className={clsx("lg:col-span-3 space-y-4", isDark ? "bg-black/30 border border-zinc-800 p-4 rounded-2xl" : "bg-white/90 border border-zinc-200 p-4 rounded-2xl")}>
          <div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Presets</div>
              <div className="text-xs opacity-60">Quick seeds</div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {PRESET_SUGGESTIONS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => chooseSuggestion(s)}
                  className={clsx("p-2 rounded-md border flex items-center gap-2 text-sm", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}
                >
                  <div className="w-8 h-6 rounded-sm flex-shrink-0" style={{ background: rgbToHex(s.seed) }} />
                  <div className="text-xs">{s.title}</div>
                </button>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold">Input seed</div>
            <div className="text-xs opacity-60 mt-2">Provide a single RGB triplet to bias the generation (example: 34,139,34)</div>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <input
                type="text"
                placeholder="r,g,b"
                className={clsx("p-2 rounded-md border text-sm", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}
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
                className={clsx("col-span-2 p-2 rounded-md border text-sm flex items-center justify-center gap-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}
                onClick={() => {
                  // quick demo seed for manual input field - take query if formatted
                  const v = query.trim();
                  const parts = v.split(",").map((x) => Number(x.trim()));
                  if (parts.length === 3 && parts.every((n) => Number.isInteger(n) && n >= 0 && n <= 255)) {
                    generatePalette({ seed: parts });
                  } else {
                    showToast("info", "Type a seed into the input as r,g,b then press this button");
                  }
                }}
              >
                <Palette /> Use seed
              </button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold">Notes</div>
            <div className="text-xs opacity-60 mt-2">Colormind is an external service (HTTP). For production and secure origins, proxy the request server-side to avoid mixed-content issues and to cache results.</div>
          </div>
        </aside>

        {/* Center: Main large palette display */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-6 flex items-center justify-between", isDark ? "bg-black/40 border-b border-zinc-800" : "bg-white/95 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Palette</CardTitle>
                <div className="text-xs opacity-60">{palette ? `Generated ${palette.length}-color palette` : "No palette yet — generate to begin"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => generatePalette()}>
                  <RefreshCw className={loading ? "animate-spin" : ""} /> Regenerate
                </Button>
                <Button variant="outline" onClick={() => setPalette(null)}>Reset</Button>
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
                      <div key={i} className="rounded-lg overflow-hidden border">
                        <button
                          onClick={() => openSwatch(i)}
                          className="w-full h-36 flex items-center justify-center"
                          style={{ background: m.hex }}
                          aria-label={`Open details for color ${m.hex}`}
                        >
                          <div className="text-sm font-semibold" style={{ color: m.textColor }}>{m.hex}</div>
                        </button>

                        <div className={clsx("p-3", isDark ? "bg-black/20 border-t border-zinc-800" : "bg-white/70 border-t border-zinc-200")}>
                          <div className="flex items-center justify-between">
                            <div className="text-xs opacity-70">{m.rgbCss}</div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => copyColorHex(m.hex)} className="text-xs opacity-70"><Copy className="w-4 h-4" /></button>
                              <button onClick={() => { navigator.clipboard.writeText(m.rgbCss); showToast("success", "RGB copied"); }} className="text-xs opacity-70">RGB</button>
                            </div>
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
                      <div className="mt-3 flex gap-2">
                        <Button variant="outline" onClick={() => copyPaletteCss()}><Copy /> Copy CSS</Button>
                        <Button variant="outline" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
                        <Button variant="outline" onClick={() => downloadSwatchesImage()}><Download /> Export PNG</Button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Raw response viewer */}
          <AnimatePresence>
            {rawResp && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
                <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/90 border-zinc-200")}>
                  <CardHeader className="p-4">
                    <div className="text-sm font-semibold">Raw Response</div>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs overflow-auto" style={{ maxHeight: 220 }}>{prettyJSON(rawResp)}</pre>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Right: Quick actions */}
        <aside className={clsx("lg:col-span-3 space-y-4", isDark ? "bg-black/30 border border-zinc-800 p-4 rounded-2xl" : "bg-white/90 border border-zinc-200 p-4 rounded-2xl")}>
          <div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Quick Actions</div>
              <div className="text-xs opacity-60">one-click</div>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              <Button variant="outline" onClick={() => copyPaletteCss()}><Copy /> Copy CSS</Button>
              <Button variant="outline" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
              <Button variant="outline" onClick={() => downloadSwatchesImage()}><Download /> Export PNG</Button>
              <Button variant="outline" onClick={() => setPalette(null)}><List /> Clear</Button>
            </div>
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
                  <button className="px-3 py-1 rounded-md border mr-2" style={{ background: paletteMeta[2]?.hex || "#eee", color: paletteMeta[2]?.textColor || "#000" }}>Primary</button>
                  <button className="px-3 py-1 rounded-md border" style={{ background: paletteMeta[3]?.hex || "#ddd", color: paletteMeta[3]?.textColor || "#000" }}>Secondary</button>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold">Theme</div>
            <div className="mt-3 flex items-center gap-2">
              <div className="text-xs opacity-60">Dark / Light</div>
              <div className="ml-auto">
                <Button variant="outline" onClick={() => { /* toggle handled by theme-provider in app */ }}><SunMoon /></Button>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Swatch dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-2xl w-full p-0 rounded-2xl overflow-hidden")}>
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
              <Button onClick={() => setDialogOpen(false)}><X /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
