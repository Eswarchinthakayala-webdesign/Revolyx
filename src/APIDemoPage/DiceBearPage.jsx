// src/pages/DiceBearPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper";

import {
  Search,
  ImageIcon,
  Download,
  Copy,
  Loader2,
  Star,
  List,
  ExternalLink,
  X,
  Palette,
  FileText,
  Zap,
  Check,
  Box,
  Database,
  Sun,
  Moon,
  ChevronRight,
  Code,
  Sliders,
  Phone,
  Menu,
  Info,
  Layers,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";

// shadcn sheet for mobile drawer
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const DICEBEAR_BASE = "https://api.dicebear.com/7.x";
const DEFAULT_STYLE = "bottts";
const DEFAULT_SEED = "John";
const STYLES = [
  "adventurer",
  "adventurer-neutral",
  "avataaars",
  "avataaars-neutral",
  "big-ears",
  "big-ears-neutral",
  "big-smile",
  "bottts",
  "bottts-neutral",
  "croodles",
  "croodles-neutral",
  "dylan",
  "fun-emoji",
  "glass",
  "identicon",
  "icons",
  "initials",
  "lorelei",
  "lorelei-neutral",
  "micah",
  "miniavs",
  "notionists",
  "notionists-neutral",
  "open-peeps",
  "personas",
  "pixel-art",
  "pixel-art-neutral",
  "rings",
  "shapes",
  "thumbs",
];

function buildEndpoint(style, seed, params = {}) {
  const url = new URL(`${DICEBEAR_BASE}/${style}/svg`);
  url.searchParams.set("seed", seed || "");
  for (const k of Object.keys(params)) {
    if (params[k] != null && params[k] !== "") url.searchParams.set(k, params[k]);
  }
  return url.toString();
}

// encode SVG to data URL (safe)
function svgToDataUrl(svgText) {
  const encoded = encodeURIComponent(svgText)
    .replace(/'/g, "%27")
    .replace(/"/g, "%22");
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

 function CopyButton({
  textToCopy,
  size = 16,
  className = "",
  label = "Copy",
  copiedLabel = "Copied",
  iconOnly = false,
}) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef(null);

  async function handleCopy() {
    if (copied) return;

    try {
      await navigator.clipboard.writeText(String(textToCopy ?? ""));
      setCopied(true);

      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 1600);

      showToast("success", "Copied to clipboard");
    } catch (err) {
      console.error("Copy failed:", err);
      showToast("error", "Copy failed");
    }
  }

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  return (
    <motion.button
      onClick={handleCopy}
      whileTap={{ scale: 0.92 }}
      className={clsx(
        "inline-flex items-center gap-2 cursor-pointer rounded-lg border border-zinc-300 dark:border-zinc-700",
        "bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800",
        "px-3 py-1.5 transition-colors shadow-sm select-none relative",
        "focus:outline-none focus:ring focus:ring-zinc-400/40 dark:focus:ring-zinc-600/40",
        "disabled:opacity-60",
        className
      )}
      aria-pressed={copied}
      aria-label={copied ? copiedLabel : label}
      title={copied ? copiedLabel : label}
    >
      <AnimatePresence mode="popLayout">
        {!copied ? (
          <motion.span
            key="copy-state"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            transition={{ duration: 0.18 }}
            className="flex items-center gap-2 text-zinc-700 dark:text-zinc-200"
          >
            <Copy size={size} className="shrink-0" />
            {!iconOnly && <span className="text-sm">{label}</span>}
          </motion.span>
        ) : (
          <motion.span
            key="copied-state"
            initial={{ scale: 0.6, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            exit={{ scale: 0.6, opacity: 0, rotate: 15 }}
            transition={{ type: "spring", stiffness: 500, damping: 24 }}
            className="flex items-center gap-2 text-green-600 dark:text-green-400"
          >
            <Check size={size} className="shrink-0" />
            {!iconOnly && <span className="text-sm">{copiedLabel}</span>}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.button>
  );
}


/* SvgPreview renders raw SVG markup safely */
function SvgPreview({ svg, className = "" }) {
  if (!svg) return null;
  return (
    <div className={clsx("w-full h-full", className)} dangerouslySetInnerHTML={{ __html: svg }} />
  );
}

export default function DiceBearPage() {
  const { theme, setTheme } = useTheme?.() ?? { theme: "system", setTheme: () => {} };
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // form state
  const [style, setStyle] = useState(DEFAULT_STYLE);
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [params, setParams] = useState({});
  const [svgText, setSvgText] = useState(null);
  const [endpoint, setEndpoint] = useState(buildEndpoint(DEFAULT_STYLE, DEFAULT_SEED, {}));
  const [loading, setLoading] = useState(false);

  // suggestions / search
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const suggestTimer = useRef(null);

  // UI toggles
  const [rawVisible, setRawVisible] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  // update endpoint whenever style/seed/params change
  useEffect(() => {
    setEndpoint(buildEndpoint(style, seed, params));
  }, [style, seed, params]);

  // fetch avatar (SVG text)
  async function fetchAvatar(s = seed, st = style, extra = params) {
    setLoading(true);
    setSvgText(null);
    try {
      const url = buildEndpoint(st, s, extra);
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        showToast("error", `Avatar fetch failed (${res.status})`);
        setLoading(false);
        return;
      }
      const text = await res.text();
      setSvgText(text);
      setRawVisible(true); // show raw inspector after successful fetch
      showToast("success", "Avatar generated");
    } catch (err) {
      console.error("fetchAvatar err", err);
      showToast("error", "Failed to fetch avatar");
    } finally {
      setLoading(false);
    }
  }

  // initial load
  useEffect(() => {
    fetchAvatar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Suggestion generation (local) */
  async function fetchSuggestions(q) {
    const qTrim = (q || "").trim();
    if (!qTrim) {
      setSuggestions([]);
      setLoadingSuggest(false);
      return;
    }
    setLoadingSuggest(true);
    try {
      const lower = qTrim.toLowerCase();
      const styleMatches = STYLES.filter((s) => s.includes(lower)).map((s) => ({ type: "style", value: s }));
      const seedBase = qTrim.replace(/\s+/g, "-");
      const seedVariants = [
        seedBase,
        `${seedBase}-01`,
        `${seedBase}-${Math.floor(Math.random() * 99)}`,
        `${seedBase}-avatar`,
      ].map((v) => ({ type: "seed", value: v }));
      const combined = [...styleMatches, ...seedVariants].slice(0, 8);
      setTimeout(() => {
        setSuggestions(combined);
        setLoadingSuggest(false);
      }, 120);
    } catch (err) {
      console.error(err);
      setSuggestions([]);
      setLoadingSuggest(false);
    }
  }

  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      fetchSuggestions(v);
    }, 260);
  }

  function chooseSuggestion(s) {
    setShowSuggest(false);
    if (!s) return;
    if (s.type === "style") {
      setStyle(s.value);
      fetchAvatar(seed, s.value, params);
    } else if (s.type === "seed") {
      setSeed(s.value);
      fetchAvatar(s.value, style, params);
    }
    setQuery("");
  }

  async function copyEndpoint() {
    try {
      await navigator.clipboard.writeText(endpoint);
      showToast("success", "Endpoint copied");
    } catch {
      showToast("error", "Copy failed");
    }
  }

  async function downloadSVG() {
    if (!svgText) {
      showToast("info", "No SVG to download");
      return;
    }
    try {
      const blob = new Blob([svgText], { type: "image/svg+xml" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `dicebear_${style}_${seed}.svg`;
      a.click();
      URL.revokeObjectURL(a.href);
      showToast("success", "SVG downloaded");
    } catch (err) {
      console.error(err);
      showToast("error", "Download failed");
    }
  }

  async function downloadPNG() {
    if (!svgText) {
      showToast("info", "No SVG to convert");
      return;
    }
    try {
      const dataUrl = svgToDataUrl(svgText);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = dataUrl;

      await new Promise((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = (e) => reject(e);
      });

      const width = img.naturalWidth || 512;
      const height = img.naturalHeight || 512;
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      const png = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = png;
      a.download = `dicebear_${style}_${seed}.png`;
      a.click();
      showToast("success", "PNG downloaded");
    } catch (err) {
      console.error("PNG conversion failed", err);
      showToast("error", "PNG conversion failed");
    }
  }

  /* UI helpers */
  const containerBg = isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200";
  const panelBg = isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200";

  return (
    <div className={clsx("min-h-screen p-4 md:p-6 max-w-8xl pb-10 mx-auto")}>
      {/* Header */}
      <header className="flex items-center flex-wrap justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          {/* Mobile menu trigger */}
          <div className="lg:hidden">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <button
                  className="p-2 rounded-md bg-transparent  cursor-pointer"
                  aria-label="Open menu"
                >
                  <Menu />
                </button>
              </SheetTrigger>

              <SheetContent side="left" className="w-[92vw] overflow-y-auto no-scrollbar md:w-[380px] p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-semibold flex items-center gap-2"><Star /> Quick Tools</div>

                </div>
                        <aside className="lg:col-span-2 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border p-3", containerBg)}>
            <CardHeader className={clsx("p-2 pb-3", panelBg)}>
              <div>
                <CardTitle className="text-sm flex items-center gap-2"><Sliders /> Quick Presets</CardTitle>
                <div className="text-xs opacity-60">Tap to apply</div>
              </div>
            </CardHeader>

            <CardContent className="p-2">
              <ScrollArea className="h-100">
                <div className="grid gap-2">
                  {STYLES.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setStyle(s);
                        fetchAvatar(seed, s, params);
                      }}
                      className={clsx(
                        "w-full text-left rounded-md p-2 border hover:shadow-sm transition cursor-pointer",
                        style === s ? "bg-zinc-100 dark:bg-zinc-800" : "bg-transparent"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{s}</div>
                        <div className="text-xs opacity-60">Apply</div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

        </aside>

                <ScrollArea style={{ height: "70vh" }}>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <CopyButton textToCopy={endpoint} label="Copy Endpoint" className="w-full" />
                      <Button
                        className="w-full cursor-pointer"
                        variant="outline"
                        onClick={() => {
                          const tmpl = `fetch("${endpoint}").then(r=>r.text()).then(svg=>console.log(svg))`;
                          navigator.clipboard.writeText(tmpl);
                          showToast("success", "Example copied");
                        }}
                      >
                        <FileText /> Copy fetch example
                      </Button>
                      <Button className="w-full cursor-pointer" variant="outline" onClick={() => { setDialogOpen(true); setSheetOpen(false); }}><ImageIcon /> Open preview</Button>
                      <Button className="w-full cursor-pointer" variant="outline" onClick={() => { navigator.clipboard.writeText(`curl "${endpoint}"`); showToast("success", "cURL copied"); }}><List /> Copy cURL</Button>
                    </div>

                    <Separator />

                    <div>
                      <div className="text-sm font-semibold">Info</div>
                      <div className="text-xs opacity-60 mt-1">Style: <span className="font-medium">{style}</span> • Seed: <span className="font-medium">{seed}</span></div>
                      <div className="mt-2 text-sm">No API key is required. Returns raw SVG markup.</div>
                    </div>
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>

          <div>
            <h1 className="text-xl md:text-2xl font-extrabold flex items-center gap-2">
              <ImageIcon /> <span>DiceBear — Avatar Studio</span>
            </h1>
            <p className="mt-0.5 text-xs opacity-80 flex items-center gap-2">
              <Palette className="opacity-60" />
              Generate unique SVG avatars (no API key). Choose a style, provide a seed and tweak params.
            </p>
          </div>
        </div>

        {/* Search + controls (desktop & mobile responsive) */}
        <div className="flex-1 ml-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchAvatar(seed, style, params);
            }}
            className={clsx(
              "flex sm:flex-nowrap flex-wrap items-center gap-2 w-full rounded-lg px-3 py-2",
              isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200"
            )}
            role="search"
          >
           
            <Select className="flex" value={style} onValueChange={(v) => setStyle(v)}>
                
              <SelectTrigger className=" sm:w-auto w-full flex items-center justify-start cursor-pointer">
                 <Search className="opacity-60" />
                <SelectValue  />
              </SelectTrigger>
              <SelectContent >
                {STYLES.map((s) => (
                  <SelectItem className="cursor-pointer" key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              placeholder="Seed (e.g. 'John' or 'blue-cow')"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
            />

            <Input
              placeholder="Search suggestions (type style or seed)"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />

            <Button type="submit" variant="outline" className="px-3 cursor-pointer">
              <Loader2 className={loading ? "animate-spin" : ""} /> Generate
            </Button>

            <Button
              type="button"
              variant="ghost"
              className="cursor-pointer"
              onClick={() => {
                setSeed(DEFAULT_SEED);
                setStyle(DEFAULT_STYLE);
                setParams({});
                fetchAvatar(DEFAULT_SEED, DEFAULT_STYLE, {});
              }}
            >
              Reset
            </Button>
          </form>
        </div>
      </header>

      {/* Suggestions dropdown (synthesized) */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={clsx(
              "absolute z-50 left-4 right-4 md:left-[calc(50%_-_360px)] md:right-auto max-w-6xl rounded-xl overflow-hidden shadow-2xl",
              isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200"
            )}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Finding suggestions…</li>}

            {suggestions.map((s, idx) => (
              <li
                key={s.type + ":" + s.value + ":" + idx}
                className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer"
                onClick={() => chooseSuggestion(s)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-8 rounded-sm bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-xs font-medium">
                    {s.type === "style" ? "S" : "seed"}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{s.value}</div>
                    <div className="text-xs opacity-60">{s.type === "style" ? "Style" : "Seed suggestion"}</div>
                  </div>
                  <div className="text-xs opacity-60">Apply →</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* LEFT: quick presets */}
        <aside className="lg:col-span-2 hidden sm:block space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border p-3", containerBg)}>
            <CardHeader className={clsx("p-2 pb-3", panelBg)}>
              <div>
                <CardTitle className="text-sm flex items-center gap-2"><Sliders /> Quick Presets</CardTitle>
                <div className="text-xs opacity-60">Tap to apply</div>
              </div>
            </CardHeader>

            <CardContent className="p-2">
              <ScrollArea className="h-40">
                <div className="grid gap-2">
                  {STYLES.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setStyle(s);
                        fetchAvatar(seed, s, params);
                      }}
                      className={clsx(
                        "w-full text-left rounded-md p-2 border hover:shadow-sm transition cursor-pointer",
                        style === s ? "bg-zinc-100 dark:bg-zinc-800" : "bg-transparent"
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium">{s}</div>
                        <div className="text-xs opacity-60">Apply</div>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className={clsx("rounded-2xl overflow-hidden border p-3", containerBg)}>
            <div className="text-sm font-semibold flex items-center gap-2"><Database /> About</div>
            <div className="text-xs opacity-60 mt-1 break-words"><code>{buildEndpoint(style, seed, params)}</code></div>
            <div className="mt-3 text-sm">DiceBear provides various avatar styles returned as raw SVGs. No API key required.</div>
          </Card>
        </aside>

        {/* CENTER: preview + inspector */}
        <section className="lg:col-span-7 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", containerBg)}>
            <CardHeader className={clsx("p-5 flex items-center flex-wrap gap-3 justify-between", panelBg)}>
              <div>
                <CardTitle className="text-lg flex items-center gap-2"><ImageIcon /> Avatar Preview</CardTitle>
                <div className="text-xs opacity-70 flex items-center gap-3">
                  <Database className="opacity-60" /> <span className="font-medium">Style:</span> <span className="font-semibold">{style}</span>
                  <span className="mx-1">•</span>
                  <span className="font-medium">Seed:</span> <span className="font-semibold">{seed}</span>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-2">
                <Button className="cursor-pointer" variant="outline" onClick={() => fetchAvatar(seed, style, params)}><Loader2 className={loading ? "animate-spin" : ""} /> Generate</Button>
                <Button className="cursor-pointer" variant="ghost" onClick={() => { setRawVisible((v) => !v); }} disabled={!svgText}><List /> {rawVisible ? "Hide Raw" : "Raw"}</Button>
                <Button className="cursor-pointer" variant="ghost" onClick={() => setDialogOpen(true)} disabled={!svgText}><ImageIcon /> View Full</Button>

              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !svgText ? (
                <div className="py-12 text-center text-sm opacity-60">No avatar yet — hit Generate.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className={clsx("p-4 rounded-xl border flex flex-col items-center justify-center", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="w-full p-4 rounded-md bg-gradient-to-b from-white/5 to-transparent" style={{ minHeight: 240 }}>
                      <div className="mx-auto max-w-full  flex items-center justify-center">
                        <SvgPreview svg={svgText} />
                      </div>
                    </div>

                    <div className="mt-4 w-full flex flex-col gap-2">
                      <CopyButton textToCopy={svgText} label="Copy SVG" className="w-full justify-center" />
                      <Button className="w-full cursor-pointer" variant="outline" onClick={() => downloadSVG()}><Download /> Download SVG</Button>
                      <Button className="w-full cursor-pointer" variant="outline" onClick={() => downloadPNG()}><Download /> Download PNG</Button>
                      <CopyButton textToCopy={endpoint} label="Copy endpoint" className="w-full justify-center" />
                    </div>
                  </div>

                  <div className={clsx("p-4 rounded-xl border md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-sm font-semibold mb-2 flex items-center gap-2"><Box /> About this avatar</div>
                    <div className="text-sm leading-relaxed mb-3 flex items-start gap-3">
                      <div className="mt-1"><Code /></div>
                      <div>
                        This avatar is generated server-side by DiceBear and returned as raw SVG. Copy the endpoint, inspect markup, or download as SVG/PNG.
                        <div className="mt-2 text-xs opacity-60 flex items-center gap-2"><Info /> Server-rendered • Raw SVG • No auth</div>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="text-sm font-semibold mb-2 flex items-center gap-2"><Zap /> Query params</div>
                    <div className="text-xs opacity-60 mb-2 flex items-center gap-2"><Layers /> Optional parameters: background, radius, mood, etc. (depends on style)</div>

                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="background (eg. #ffffff)" value={params.background || ""} onChange={(e) => setParams((p) => ({ ...p, background: e.target.value || undefined }))} />
                      <Input placeholder="radius (0-50)" value={params.radius || ""} onChange={(e) => setParams((p) => ({ ...p, radius: e.target.value || undefined }))} />
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" className="cursor-pointer" onClick={() => fetchAvatar(seed, style, params)}><Zap /> Apply</Button>
                      <Button variant="ghost" className="cursor-pointer" onClick={() => { setParams({}); showToast("success", "Params cleared"); }}>Clear</Button>
                    </div>

                    <AnimatePresence>
                      {rawVisible && svgText && (
                        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("p-3 mt-4 rounded-md border overflow-hidden", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")} style={{ maxHeight: 340 }}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="text-sm font-semibold flex items-center gap-2"><FileText /> Raw SVG</div>
                            <div className="flex gap-2">
                              <CopyButton textToCopy={svgText} label="Copy raw" />
                              <Button variant="ghost" className="cursor-pointer" onClick={() => { const blob = new Blob([svgText], { type: "image/svg+xml" }); const url = URL.createObjectURL(blob); window.open(url, "_blank"); setTimeout(() => URL.revokeObjectURL(url), 1200); }}><ExternalLink /> Open</Button>
                            </div>
                          </div>

                          <ScrollArea style={{ height: 240 }}>
                            <pre className={clsx("text-xs overflow-auto p-2", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ whiteSpace: "pre-wrap" }}>{svgText}</pre>
                          </ScrollArea>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* RIGHT: quick actions / developer tools - desktop */}
        <aside className={clsx("hidden lg:block lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", containerBg)}>
          <div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold flex items-center gap-2"><Star /> Quick Actions</div>
                <div className="text-xs opacity-60">Developer tools</div>
              </div>
           
            </div>

            <div className="mt-3 space-y-2">
             
              <Button className="w-full cursor-pointer" variant="outline" onClick={() => { const tmpl = `fetch("${endpoint}").then(r=>r.text()).then(svg=>console.log(svg))`; navigator.clipboard.writeText(tmpl); showToast("success", "Example copied"); }}><FileText /> Copy fetch example</Button>
              <Button className="w-full cursor-pointer" variant="outline" onClick={() => { setDialogOpen(true); }}><ImageIcon /> Open preview</Button>
              <Button className="w-full cursor-pointer" variant="outline" onClick={() => { navigator.clipboard.writeText(`curl "${endpoint}"`); showToast("success", "cURL copied"); }}><List /> Copy cURL</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold">Info</div>
            <div className="text-xs opacity-60 mt-1">Style: <span className="font-medium">{style}</span> • Seed: <span className="font-medium">{seed}</span></div>
            <div className="mt-3 text-sm">No API key is required. The endpoint returns raw SVG markup. Use query params to customize output per style docs.</div>
          </div>
        </aside>
      </main>

      {/* Full-size dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{style} • {seed}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            {svgText ? (
              <SvgPreview svg={svgText} />
            ) : (
              <div className="h-full flex items-center justify-center text-sm opacity-60">No avatar to preview</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Rendered SVG</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="cursor-pointer"><X /></Button>
              <Button variant="outline" onClick={() => downloadSVG()} className="cursor-pointer"><Download /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
