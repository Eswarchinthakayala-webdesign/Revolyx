// XColorsPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  Copy,
  Download,
  List,
  ImageIcon,
  Zap,
  Palette,
  Loader2,
  Sun,
  Moon,
  RefreshCw,
  Code,
  ExternalLink
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
 * XColorsPage
 * - Uses https://x-colors.yurace.pro/api/random for default load
 * - Search accepts HEX (with/without #). Suggestions generated client-side (tints/shades).
 * - No localStorage, clean developer actions in right column.
 */

// Endpoint
const RANDOM_ENDPOINT = "https://x-colors.yurace.pro/api/random";
const DEFAULT_EXAMPLE = "#1e90ff";

function prettyJSON(obj) {
  try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
}

// --- Color helpers (small, robust conversions)
function sanitizeHex(input) {
  if (!input) return null;
  const s = input.trim().replace(/^#/, "");
  if (/^[0-9a-fA-F]{6}$/.test(s)) return `#${s.toLowerCase()}`;
  if (/^[0-9a-fA-F]{3}$/.test(s)) {
    // expand shorthand e.g. #abc -> #aabbcc
    return "#" + s.split("").map(ch => ch + ch).join("").toLowerCase();
  }
  return null;
}

function hexToRgb(hex) {
  const h = sanitizeHex(hex);
  if (!h) return null;
  const r = parseInt(h.slice(1, 3), 16);
  const g = parseInt(h.slice(3, 5), 16);
  const b = parseInt(h.slice(5, 7), 16);
  return { r, g, b };
}

function rgbToHex({ r, g, b }) {
  const toHex = (v) => v.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function hslToRgb({ h, s, l }) {
  // expects h [0..360], s/l [0..100]
  h /= 360; s /= 100; l /= 100;
  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }
  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = Math.round(hue2rgb(p, q, h + 1/3) * 255);
  const g = Math.round(hue2rgb(p, q, h) * 255);
  const b = Math.round(hue2rgb(p, q, h - 1/3) * 255);
  return { r, g, b };
}

function getContrastColor(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return "#000";
  // Perceived luminance (WCAG)
  const r = rgb.r / 255, g = rgb.g / 255, b = rgb.b / 255;
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.55 ? "#000000" : "#ffffff";
}

function getComplementary(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return null;
  const comp = { r: 255 - rgb.r, g: 255 - rgb.g, b: 255 - rgb.b };
  return rgbToHex(comp);
}

function generateShades(hex, count = 6) {
  // produce lighter and darker variations using HSL lightness adjustments
  const rgb = hexToRgb(hex);
  if (!rgb) return [];
  const base = rgbToHsl(rgb); // {h,s,l}
  const shades = [];
  const step = 10;
  // darker shades
  for (let i = count/2; i >= 1; i--) {
    const l = Math.max(0, base.l - i * step);
    const rgbv = hslToRgb({ h: base.h, s: base.s, l });
    shades.push({ hex: rgbToHex(rgbv), hsl: { h: base.h, s: base.s, l } });
  }
  // base
  shades.push({ hex: rgbToHex(rgb), hsl: base });
  // lighter shades
  for (let i = 1; i <= count/2; i++) {
    const l = Math.min(100, base.l + i * step);
    const rgbv = hslToRgb({ h: base.h, s: base.s, l });
    shades.push({ hex: rgbToHex(rgbv), hsl: { h: base.h, s: base.s, l } });
  }
  return shades;
}

// --- Component
export default function XColorsPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // state
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]); // array of {hex,hsl}
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [colorData, setColorData] = useState(null); // canonical color object {hex, rgb, hsl, rawApi?}
  const [rawResp, setRawResp] = useState(null);
  const [loadingColor, setLoadingColor] = useState(false);

  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const suggestTimer = useRef(null);
  const abortRef = useRef(null);

  // fetch a random color from API
  async function fetchRandomColor() {
    setLoadingColor(true);
    try {
      if (abortRef.current) { abortRef.current.abort(); abortRef.current = null; }
      const ac = new AbortController();
      abortRef.current = ac;
      const res = await fetch(RANDOM_ENDPOINT, { signal: ac.signal });
      if (!res.ok) {
        showToast("error", `Random color fetch failed (${res.status})`);
        setLoadingColor(false);
        return;
      }
      const json = await res.json();
      // Expected: json might be an object like {hex:"#aabbcc", rgb:"rgb(...)" } or simple string.
      // Normalize:
      let hex = null;
      if (typeof json === "string") hex = sanitizeHex(json) || null;
      else if (json?.hex) hex = sanitizeHex(json.hex) || null;
      else if (json?.value) hex = sanitizeHex(json.value) || null; // some APIs use value
      else {
        // attempt to find first property that looks like a hex
        for (const v of Object.values(json || {})) {
          if (typeof v === "string" && /^#?[0-9a-fA-F]{3,6}$/.test(v.trim())) { hex = sanitizeHex(v.trim()); break; }
        }
      }
      if (!hex) {
        showToast("error", "Unexpected color response from API");
        setLoadingColor(false);
        setRawResp(json);
        return;
      }
      const rgb = hexToRgb(hex);
      const hsl = rgb ? rgbToHsl(rgb) : null;
      setColorData({ hex, rgb, hsl, source: "api", apiBody: json });
      setRawResp(json);
      // update suggestions (shades)
      setSuggestions(generateShades(hex, 6));
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error(err);
      showToast("error", "Failed to fetch color");
    } finally {
      setLoadingColor(false);
      abortRef.current = null;
    }
  }

  // handle search input -> suggestions (debounced)
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    setLoadingSuggest(true);
    suggestTimer.current = setTimeout(() => {
      // if sanitized hex -> generate shades T/F
      const h = sanitizeHex(v);
      if (h) {
        const sh = generateShades(h, 6);
        setSuggestions(sh);
        setLoadingSuggest(false);
      } else {
        // fallback: when query is not hex, show popular presets or empty
        const presets = ["#ff4757","#1e90ff","#2ed573","#ffb142","#3742fa","#ff6b81"].map(hex => ({ hex, hsl: rgbToHsl(hexToRgb(hex)) }));
        setSuggestions(presets);
        setLoadingSuggest(false);
      }
    }, 300);
  }

  // submit search: if hex -> build color, else fallback to random or example
  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    const h = sanitizeHex(query);
    if (h) {
      // local conversion (fast)
      const rgb = hexToRgb(h);
      const hsl = rgb ? rgbToHsl(rgb) : null;
      setColorData({ hex: h, rgb, hsl, source: "local" });
      setRawResp(null);
      setSuggestions(generateShades(h, 6));
      setShowSuggest(false);
      return;
    }
    // if not hex, fallback: fetch random and show
    await fetchRandomColor();
    setShowSuggest(false);
  }

  // pick a suggestion swatch
  function pickSuggestion(s) {
    if (!s) return;
    const hex = sanitizeHex(s.hex || s);
    if (!hex) return;
    const rgb = hexToRgb(hex);
    const hsl = rgb ? rgbToHsl(rgb) : null;
    setColorData({ hex, rgb, hsl, source: "suggestion" });
    setShowSuggest(false);
  }

  // copy helpers
  function copyText(text, label = "Copied") {
    navigator.clipboard.writeText(text).then(() => showToast("success", label)).catch(() => showToast("error", "Copy failed"));
  }

  function downloadJSON() {
    const payload = colorData?.apiBody ? colorData.apiBody : colorData || { hex: query || DEFAULT_EXAMPLE };
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `color_${(colorData?.hex || "color").replace("#","")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  // initial load
  useEffect(() => {
    fetchRandomColor();
    return () => {
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
      if (abortRef.current) abortRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // derived values
  const contrast = useMemo(() => (colorData?.hex ? getContrastColor(colorData.hex) : "#000"), [colorData]);
  const complement = useMemo(() => (colorData?.hex ? getComplementary(colorData.hex) : null), [colorData]);
  const cssVar = useMemo(() => (colorData?.hex ? `--color: ${colorData.hex};` : ""), [colorData]);

  // responsive layout classes
  const containerBg = isDark ? "bg-black text-zinc-100" : "bg-white text-zinc-900";
  const panelBg = isDark ? "bg-black/30 border border-zinc-800" : "bg-white/90 border border-zinc-200";

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto", containerBg)}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">xColors — Color Generator & Converter</h1>
          <p className="mt-1 text-sm opacity-70">Generate random colors, convert formats, and explore palettes. Try a hex like <code className="px-1 rounded bg-zinc-100 dark:bg-zinc-900">#1e90ff</code>.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-2 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search by HEX (e.g. #ff00aa) or press Enter for a random color"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onFocus={() => setShowSuggest(true)}
              aria-label="Search color by hex"
              className="border-0 shadow-none bg-transparent outline-none"
            />
            <Button type="submit" variant="outline" className="px-3">Find</Button>
            <Button type="button" variant="outline" className="px-3" onClick={() => fetchRandomColor()}><RefreshCw /></Button>
          </form>
        </div>
      </header>

      {/* Suggestions dropdown (centered under input) */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("absolute z-40 left-6 right-6 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Generating suggestions…</li>}
            {suggestions.map((s, idx) => (
              <li key={s.hex || idx} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => pickSuggestion(s)}>
                <div className="flex items-center gap-3">
                  <div style={{ backgroundColor: s.hex }} className="w-12 h-8 rounded-md border" />
                  <div className="flex-1">
                    <div className="font-medium">{s.hex}</div>
                    <div className="text-xs opacity-60">H:{s.hsl?.h}° • S:{s.hsl?.s}% • L:{s.hsl?.l}%</div>
                  </div>
                  <div className="text-xs opacity-60">swatch</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout: left (suggestions palette) + center (details) + right (actions) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: palette / suggestions (lg:col-span-3) */}
        <aside className={clsx("lg:col-span-3 space-y-4 p-4 rounded-2xl", panelBg)}>
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 opacity-80" />
                <div className="text-sm font-semibold">Palette</div>
              </div>
              <div className="text-xs opacity-60">Suggestions</div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {(suggestions && suggestions.length > 0) ? suggestions.slice(0, 8).map((s, i) => (
                <button key={s.hex || i} onClick={() => pickSuggestion(s)} className="flex flex-col items-start gap-2 p-2 rounded-md border hover:scale-101 transition-transform" style={{ background: isDark ? "transparent" : "" }}>
                  <div className="w-full h-16 rounded-md border" style={{ backgroundColor: s.hex }} />
                  <div className="text-xs opacity-70">{s.hex}</div>
                </button>
              )) : (
                <div className="text-sm opacity-60">No suggestions — search a hex or load random.</div>
              )}
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold">Quick palette actions</div>
            <div className="mt-2 flex flex-col gap-2">
              <Button variant="outline" onClick={() => { if (colorData?.hex) copyText(colorData.hex, "Hex copied"); else showToast("info", "No color"); }}><Copy /> Copy HEX</Button>
              <Button variant="outline" onClick={() => { if (colorData?.hex) copyText(cssVar, "CSS var copied"); else showToast("info", "No color"); }}><Code /> Copy CSS</Button>
            </div>
          </div>
        </aside>

        {/* Center: large preview + details (lg:col-span-6) */}
        <section className="lg:col-span-6">
          <Card className={clsx("rounded-2xl overflow-hidden", panelBg)}>
            <CardHeader className="p-6 flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Color Detail</CardTitle>
                <div className="text-xs opacity-60">{colorData?.hex || "Loading…"}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setShowRaw(s => !s)}><List /> {showRaw ? "Hide Raw" : "Raw"}</Button>
                <Button variant="ghost" onClick={() => setDialogOpen(true)}><ImageIcon /></Button>
                <Button variant="outline" onClick={() => fetchRandomColor()}><Zap /> Random</Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {loadingColor ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !colorData ? (
                <div className="py-12 text-center text-sm opacity-60">No color loaded.</div>
              ) : (
                <div className="space-y-6">
                  {/* Big preview */}
                  <div className="rounded-xl overflow-hidden border" style={{ background: colorData.hex }}>
                    <div className="p-8 flex items-center justify-between" style={{ minHeight: 180 }}>
                      <div>
                        <div className="text-5xl font-extrabold" style={{ color: contrast }}>{colorData.hex}</div>
                        <div className="mt-1 text-sm opacity-70" style={{ color: contrast === "#000000" ? "rgba(0,0,0,0.6)" : "rgba(255,255,255,0.85)" }}>
                          Contrast: {contrast}
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs opacity-70">Preview</div>
                        <div className="mt-2 inline-flex items-center gap-2">
                          <button onClick={() => copyText(colorData.hex, "HEX copied")} className="px-3 py-2 rounded-md border" style={{ background: contrast, color: colorData.hex }}>
                            Copy HEX
                          </button>
                          <button onClick={() => copyText(`${colorData.rgb?.r}, ${colorData.rgb?.g}, ${colorData.rgb?.b}`, "RGB copied")} className="px-3 py-2 rounded-md border">
                            Copy RGB
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Formats & conversions */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-md border">
                      <div className="text-xs opacity-60">HEX</div>
                      <div className="text-lg font-medium mt-1">{colorData.hex}</div>
                      <div className="mt-2 text-xs opacity-60">CSS</div>
                      <div className="text-sm font-medium">{cssVar}</div>
                      <div className="mt-3 flex gap-2">
                        <Button variant="outline" onClick={() => copyText(colorData.hex, "HEX copied")}><Copy /></Button>
                        <Button variant="outline" onClick={() => copyText(cssVar, "CSS var copied")}><Code /></Button>
                      </div>
                    </div>

                    <div className="p-4 rounded-md border">
                      <div className="text-xs opacity-60">RGB</div>
                      <div className="text-lg font-medium mt-1">{colorData.rgb ? `${colorData.rgb.r}, ${colorData.rgb.g}, ${colorData.rgb.b}` : "—"}</div>
                      <div className="mt-2 text-xs opacity-60">CSS rgb()</div>
                      <div className="text-sm font-medium">rgb({colorData.rgb?.r || 0}, {colorData.rgb?.g || 0}, {colorData.rgb?.b || 0})</div>
                      <div className="mt-3 flex gap-2">
                        <Button variant="outline" onClick={() => copyText(`rgb(${colorData.rgb?.r}, ${colorData.rgb?.g}, ${colorData.rgb?.b})`, "RGB copied")}><Copy /></Button>
                      </div>
                    </div>

                    <div className="p-4 rounded-md border">
                      <div className="text-xs opacity-60">HSL</div>
                      <div className="text-lg font-medium mt-1">{colorData.hsl ? `${colorData.hsl.h}°, ${colorData.hsl.s}%, ${colorData.hsl.l}%` : "—"}</div>
                      <div className="mt-2 text-xs opacity-60">Complement</div>
                      <div className="text-sm font-medium">{complement || "—"}</div>
                      <div className="mt-3 flex gap-2">
                        <Button variant="outline" onClick={() => { if (complement) copyText(complement, "Complement copied"); else showToast("info","No complement"); }}><Copy /></Button>
                      </div>
                    </div>
                  </div>

                  {/* Advanced: palette (shades) */}
                  <div className="p-4 rounded-md border">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-semibold">Shades</div>
                      <div className="text-xs opacity-60">Lighter / darker variants</div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 md:grid-cols-6 gap-3">
                      {generateShades(colorData.hex, 6).map((s) => (
                        <div key={s.hex} className="rounded-md overflow-hidden border">
                          <div style={{ background: s.hex }} className="h-16" />
                          <div className="p-2 text-xs text-center">{s.hex}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Raw JSON */}
                  <AnimatePresence>
                    {showRaw && rawResp && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="rounded-md border p-3">
                        <div className="text-xs opacity-60 mb-2">Raw API response</div>
                        <pre className="text-xs overflow-auto" style={{ maxHeight: 240 }}>{prettyJSON(rawResp)}</pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right: quick actions (lg:col-span-3) */}
        <aside className={clsx("lg:col-span-3 p-4 rounded-2xl", panelBg)}>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Quick actions</div>
            <div className="text-xs opacity-60">Tools</div>
          </div>

          <div className="mt-3 space-y-3">
            <Button className="w-full" variant="outline" onClick={() => fetchRandomColor()}><RefreshCw /> Random color</Button>
            <Button className="w-full" variant="outline" onClick={() => { if (colorData?.hex) copyText(colorData.hex, "HEX copied"); else showToast("info", "No color"); }}><Copy /> Copy HEX</Button>
            <Button className="w-full" variant="outline" onClick={() => { if (colorData) downloadJSON(); else showToast("info", "No data"); }}><Download /> Download JSON</Button>
            <Button className="w-full" variant="outline" onClick={() => setShowRaw(s => !s)}><List /> Toggle Raw</Button>

            <Separator />

            <div>
              <div className="text-xs opacity-60">Theme</div>
              <div className="mt-2 flex gap-2">
                <Button variant="ghost" onClick={() => { /* optional: toggle theme via provider */ }}><Sun /></Button>
                <Button variant="ghost" onClick={() => { /* optional: toggle theme via provider */ }}><Moon /></Button>
              </div>
            </div>
          </div>
        </aside>
      </main>

      {/* Image dialog: show a large solid preview & copy options */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl w-full p-0 rounded-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>{colorData?.hex || "Preview"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center", background: colorData?.hex || "#fff" }}>
            <div className="text-center">
              <div style={{ color: contrast }} className="text-6xl font-extrabold mb-2">{colorData?.hex}</div>
              <div style={{ color: contrast }} className="text-sm opacity-80">{colorData?.hsl ? `${colorData.hsl.h}°, ${colorData.hsl.s}%, ${colorData.hsl.l}%` : ""}</div>
              <div className="mt-4 flex gap-2 justify-center">
                <Button variant="outline" onClick={() => copyText(colorData.hex, "HEX copied")}><Copy /></Button>
                <Button variant="outline" onClick={() => copyText(cssVar, "CSS var copied")}><Code /></Button>
              </div>
            </div>
          </div>

          <DialogFooter className="p-4 border-t flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}><ImageIcon /></Button>
            <Button variant="outline" onClick={() => { if (colorData?.hex) window.open(`https://www.color-hex.com/color/${colorData.hex.replace("#","")}`, "_blank"); }}><ExternalLink /></Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
