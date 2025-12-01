// XColorsPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Copy, Download, List, ImageIcon, Zap,
  Palette, Loader2, Sun, Moon, RefreshCw, Code, ExternalLink,
  LoaderPinwheel,
  Shuffle,
  Loader2Icon
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";
import { CopyButton } from "../components/copy-button";

/* ----------------------------------------------------------
   UTILITY FUNCTIONS (Refined / Optimized)
-----------------------------------------------------------*/
const RANDOM_ENDPOINT = "https://x-colors.yurace.pro/api/random";

function prettyJSON(obj) {
  try { return JSON.stringify(obj, null, 2); } catch { return ""; }
}

// Clean hex -> always #rrggbb
function sanitizeHex(input) {
  if (!input) return null;
  let hex = input.trim().replace("#", "");
  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    hex = hex.split("").map(c => c + c).join("");
  }
  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return "#" + hex.toLowerCase();
  }
  return null;
}

function hexToRgb(hex) {
  const h = sanitizeHex(hex);
  if (!h) return null;
  return {
    r: parseInt(h.substring(1, 3), 16),
    g: parseInt(h.substring(3, 5), 16),
    b: parseInt(h.substring(5, 7), 16)
  };
}

function rgbToHex({ r, g, b }) {
  const x = (n) => n.toString(16).padStart(2, "0");
  return `#${x(r)}${x(g)}${x(b)}`;
}

function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > .5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100)
  };
}

function hslToRgb({ h, s, l }) {
  h /= 360; s /= 100; l /= 100;

  if (s === 0) {
    const v = Math.round(l * 255);
    return { r: v, g: v, b: v };
  }

  const hue2rgb = (p, q, t) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < .5 ? l * (1 + s) : (l + s - l * s);
  const p = 2 * l - q;

  return {
    r: Math.round(hue2rgb(p, q, h + 1/3) * 255),
    g: Math.round(hue2rgb(p, q, h) * 255),
    b: Math.round(hue2rgb(p, q, h - 1/3) * 255)
  };
}

function getContrastColor(hex) {
  const rgb = hexToRgb(hex);
  const lum = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return lum > 0.55 ? "#000000" : "#ffffff";
}

// FIXED SHADE GENERATOR (No duplicates, perfect spread)
function generateShades(hex, count = 6) {
  const rgb = hexToRgb(hex);
  if (!rgb) return [];

  const base = rgbToHsl(rgb);

  // Build unique shades
  const set = new Set();
  const shades = [];

  const step = 12; // even spread

  for (let i = 3; i >= 1; i--) {
    const l = Math.max(0, base.l - step * i);
    const rgbV = hslToRgb({ h: base.h, s: base.s, l });
    set.add(rgbToHex(rgbV));
  }

  set.add(hex.toLowerCase());

  for (let i = 1; i <= 3; i++) {
    const l = Math.min(100, base.l + step * i);
    const rgbV = hslToRgb({ h: base.h, s: base.s, l });
    set.add(rgbToHex(rgbV));
  }

  // convert to array
  [...set].forEach((v) => shades.push({ hex: v, hsl: rgbToHsl(hexToRgb(v)) }));

  return shades;
}

function getComplementary(hex) {
  const rgb = hexToRgb(hex);
  return rgbToHex({ r: 255 - rgb.r, g: 255 - rgb.g, b: 255 - rgb.b });
}

/* ----------------------------------------------------------
   MAIN COMPONENT
-----------------------------------------------------------*/

export default function XColorsPage() {

  /* ---------------- Theme --------------- */
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const panelBg = isDark
    ? "bg-black/30 border border-zinc-800"
    : "bg-white/90 border border-zinc-200";

  /* ---------------- State --------------- */
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);

  const [colorData, setColorData] = useState(null);
  const [rawResp, setRawResp] = useState(null);

  const [loadingColor, setLoadingColor] = useState(false);
  const [loadingSuggest] = useState(false);

  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const abortRef = useRef(null);
  const suggestTimer = useRef(null);

  /* ---------------- Fetch Random --------------- */
  async function fetchRandomColor() {
    try {
      setLoadingColor(true);

      if (abortRef.current) abortRef.current.abort();

      const ctrl = new AbortController();
      abortRef.current = ctrl;

      const res = await fetch(RANDOM_ENDPOINT, { signal: ctrl.signal });
      const json = await res.json();

      let hex = null;
      if (json.hex) hex = sanitizeHex(json.hex);
      if (!hex) {
        for (const val of Object.values(json)) {
          if (sanitizeHex(val)) hex = sanitizeHex(val);
        }
      }
      if (!hex) throw new Error("Bad API response");

      const rgb = hexToRgb(hex);
      const hsl = rgbToHsl(rgb);

      setColorData({ hex, rgb, hsl, apiBody: json, source: "api" });
      setRawResp(json);
      setSuggestions(generateShades(hex));
      setShowSuggest(false);

    } catch (err) {
      if (err.name !== "AbortError") showToast("error", "Failed to fetch color");
    } finally {
      setLoadingColor(false);
      abortRef.current = null;
    }
  }

  /* ---------------- User Input → Suggestions --------------- */
  function handleInput(v) {
    setQuery(v);
    setShowSuggest(true);

    if (suggestTimer.current) clearTimeout(suggestTimer.current);

    suggestTimer.current = setTimeout(() => {
      const h = sanitizeHex(v);
      if (h) {
        setSuggestions(generateShades(h));
      } else {
        const presets = ["#ff4757", "#1e90ff", "#2ed573", "#ffb142", "#3742fa", "#ff6b81"];
        setSuggestions(presets.map(hex => ({ hex, hsl: rgbToHsl(hexToRgb(hex)) })));
      }
    }, 280);
  }

  /* ---------------- User Search --------------- */
  function onSearchSubmit(e) {
    e.preventDefault();
    const h = sanitizeHex(query);
    if (h) {
      const rgb = hexToRgb(h);
      const hsl = rgbToHsl(rgb);
      setColorData({ hex: h, rgb, hsl, source: "local" });
      setSuggestions(generateShades(h));
      setShowSuggest(false);
    } else {
      fetchRandomColor();
    }
  }

  /* ---------------- Pick Suggestion --------------- */
  function pickSuggestion(s) {
    const hex = sanitizeHex(s.hex);
    const rgb = hexToRgb(hex);
    const hsl = rgbToHsl(rgb);

    setColorData({ hex, rgb, hsl, source: "suggestion" });
    setShowSuggest(false);
  }

  /* ---------------- Utils --------------- */
  function copy(text) {
    navigator.clipboard.writeText(text);
    showToast("success", "Copied");
  }

  function downloadJSON() {
    const payload = colorData.apiBody || colorData;
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `color_${colorData.hex.replace("#", "")}.json`;
    a.click();
  }

  /* ---------------- Init --------------- */
  useEffect(() => {
    fetchRandomColor();
    return () => {
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, []);

  const contrast = useMemo(() => colorData ? getContrastColor(colorData.hex) : "#000", [colorData]);
  const complement = useMemo(() => colorData ? getComplementary(colorData.hex) : null, [colorData]);

  /* ----------------------------------------------------------
     UI: PROFESSIONAL REDESIGN
  -----------------------------------------------------------*/

  return (
    <div className={clsx("min-h-screen pb-10 p-4 md:p-6", isDark ? "bg-black text-white" : "bg-white text-black")}>
      
      {/* ---------------- HEADER ---------------- */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">Revolyx - xColors</h1>
          <p className="opacity-60 text-sm mt-1">
            Generate colors, inspect details, explore shades & contrasts. Fully rebuilt UI.
          </p>
        </div>

        <form
          onSubmit={onSearchSubmit}
          className={clsx(
            "flex items-center gap-2 rounded-lg px-3 py-2 w-full md:w-[480px]",
            "border cursor-pointer",
            isDark ? "bg-black/40 border-zinc-700" : "bg-white border-zinc-300"
          )}
        >
          <Search className="opacity-60" />
          <Input
            placeholder="Enter HEX (#ff00aa)… or hit Enter for random"
            className="border-0 shadow-none bg-transparent outline-none"
            value={query}
            onFocus={() => setShowSuggest(true)}
            onChange={(e) => handleInput(e.target.value)}
          />
          <Button variant="outline" className="cursor-pointer">
            Find
          </Button>
        </form>
      </header>

      {/* ---------------- Suggestion Dropdown ---------------- */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={clsx(
              "absolute w-[90%] md:w-[480px] left-1/2 -translate-x-1/2 z-40 rounded-xl shadow-xl overflow-hidden",
              isDark ? "bg-black border border-zinc-800" : "bg-white border"
            )}
          >
            {suggestions.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer"
                onClick={() => pickSuggestion(s)}
              >
                <div className="w-10 h-10 rounded border" style={{ background: s.hex }} />
                <div className="flex-1">
                  <div className="font-medium">{s.hex}</div>
                  <div className="text-xs opacity-60">H:{s.hsl.h} S:{s.hsl.s} L:{s.hsl.l}</div>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- GRID MAIN LAYOUT ---------------- */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">
        
        {/* LEFT ------------------------------- */}
        <aside className={clsx("lg:col-span-3 p-4 rounded-2xl", panelBg)}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 opacity-70" />
              <div className="text-sm font-semibold">Palette</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {suggestions.map((s) => (
              <div
                key={s.hex}
                className="rounded-md border p-2 cursor-pointer hover:scale-[1.03] transition"
                onClick={() => pickSuggestion(s)}
              >
                <div className="h-16 rounded border" style={{ background: s.hex }} />
                <div className="text-xs mt-1 opacity-70">{s.hex}</div>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          <div className="text-sm font-semibold">Actions</div>
          <div className="mt-2 space-y-2">
            <Button className="w-full cursor-pointer" variant="outline" onClick={() => fetchRandomColor()}>
              <RefreshCw /> Random
            </Button>
            <Button className="w-full cursor-pointer" variant="outline" onClick={() => copy(colorData?.hex)}>
              <Copy /> Copy HEX
            </Button>
            <Button className="w-full cursor-pointer" variant="outline" onClick={() => setShowRaw((s) => !s)}>
              <List /> Raw
            </Button>
          </div>
        </aside>

        {/* CENTER -------------------------------- */}
        <section className="lg:col-span-6">
          <Card className={clsx("rounded-2xl overflow-hidden", panelBg)}>
            <CardHeader className="p-5 flex justify-between">
              <div>
                <CardTitle>Color Details</CardTitle>
                <div className="text-xs opacity-60">{colorData?.hex || ""}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" className="cursor-pointer" onClick={() => setDialogOpen(true)}>
                  <ImageIcon />
                </Button>
                <Button variant="outline" className="cursor-pointer" onClick={() => fetchRandomColor()}>
                  <Shuffle  /> Random
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {!colorData ? (
                <div className="py-12 text-center opacity-60">Loading…</div>
              ) : (
                <>
                  {/* BIG PREVIEW */}
                  <div className="rounded-xl overflow-hidden border mb-6" style={{ background: colorData.hex }}>
                    <div className="p-8 flex flex-col gap-3 sm:flex-row justify-between" style={{ minHeight: 180 }}>
                      <div>
                        <div className="text-5xl font-extrabold" style={{ color: contrast }}>
                          {colorData.hex}
                        </div>
                        <div className="opacity-90 mt-2" style={{ color: contrast }}>
                          Contrast: {contrast}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2">
                        <Button className="cursor-pointer" variant="outline" onClick={() => copy(colorData.hex)}>
                          Copy HEX
                        </Button>
                        <Button className="cursor-pointer" variant="outline" onClick={() => copy(`${colorData.rgb.r}, ${colorData.rgb.g}, ${colorData.rgb.b}`)}>
                          Copy RGB
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* FORMAT DETAILS */}
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

  {/* HEX -------------------------------- */}
  <div className="p-4 rounded-lg border">
    <div className="text-xs opacity-60">HEX</div>
    <div className="text-lg mt-1">{colorData.hex}</div>

    <CopyButton
      text={colorData.hex}
      className="mt-3"
    />
  </div>

  {/* RGB -------------------------------- */}
  <div className="p-4 rounded-lg border">
    <div className="text-xs opacity-60">RGB</div>
    <div className="text-lg mt-1">
      {colorData.rgb.r}, {colorData.rgb.g}, {colorData.rgb.b}
    </div>

    <CopyButton
      text={`rgb(${colorData.rgb.r},${colorData.rgb.g},${colorData.rgb.b})`}
      className="mt-3"
    />
  </div>

  {/* COMPLEMENT -------------------------------- */}
  <div className="p-4 rounded-lg border">
    <div className="text-xs opacity-60">Complement</div>
    <div className="text-lg mt-1">{complement}</div>

    <CopyButton
      text={complement}
      className="mt-3"
    />
  </div>

</div>


                  {/* SHADES */}
                  <div className="p-4 border rounded-lg">
                    <div className="text-sm font-semibold mb-2">Shades</div>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
                      {generateShades(colorData.hex).map((s) => (
                        <div key={s.hex} className="rounded overflow-hidden border cursor-pointer" onClick={() => pickSuggestion(s)}>
                          <div className="h-14" style={{ background: s.hex }} />
                          <div className="text-xs text-center p-1">{s.hex}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* RAW JSON */}
                  {showRaw && rawResp && (
                    <div className="mt-4 border rounded-lg p-4 text-xs overflow-auto max-h-[260px]">
                      <pre>{prettyJSON(rawResp)}</pre>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </section>

        {/* RIGHT -------------------------------- */}
        <aside className={clsx("lg:col-span-3 p-4 rounded-2xl", panelBg)}>
          <div className="text-sm font-semibold mb-3">Quick Tools</div>

          <Button className="w-full cursor-pointer mb-2" variant="outline" onClick={() => fetchRandomColor()}>
            <Zap /> Random Color
          </Button>

          <Button className="w-full cursor-pointer mb-2" variant="outline" onClick={() => downloadJSON()}>
            <Download /> Download JSON
          </Button>

          <Button className="w-full cursor-pointer mb-2" variant="outline" onClick={() => setShowRaw((s) => !s)}>
            <List /> Toggle Raw
          </Button>

          <Separator className="my-4" />

        </aside>

      </main>

      {/* ---------------- DIALOG PREVIEW ---------------- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl overflow-hidden p-0 rounded-xl">
          <DialogHeader className="p-4">
            <DialogTitle>{colorData?.hex}</DialogTitle>
          </DialogHeader>

          <div
            className="h-[300px] flex items-center justify-center"
            style={{ background: colorData?.hex }}
          >
            <div style={{ color: contrast }} className="text-4xl font-bold">
              {colorData?.hex}
            </div>
          </div>

          <DialogFooter className="p-3 flex items-center justify-end gap-2 border-t">
           
             <CopyButton
                text={colorData?.hex }
                className=""
                />
            <Button variant="outline" className="cursor-pointer" onClick={() =>
              window.open(`https://www.color-hex.com/color/${colorData.hex.replace("#", "")}`, "_blank")
            }>
              <ExternalLink />
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
