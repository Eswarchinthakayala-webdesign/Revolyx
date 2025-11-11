// src/pages/FontsPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { Toaster, toast } from "sonner";
import {
  Search as SearchIcon,
  Copy,
  Link as LinkIcon,
  Save,
  Loader2,
  Maximize2,
  Minimize2,
  Trash2,
  Menu as MenuIcon,
  X,
  ExternalLink,
  Link,
  Inbox,
} from "lucide-react";

/* shadcn/ui components — adjust paths if needed */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

/* your fonts JSON */
import fontsData from "@/data/FontsData.json";


/* color themes you provided — used for text color / preview color */
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

const SAVED_KEY = "revolyx_fonts_saved_v1"; // localStorage key

// tiny utility: variant token -> weight & style
function parseVariantToken(token) {
  if (!token) return { weight: 400, style: "normal" };
  const t = String(token).toLowerCase();
  if (t === "regular" || t === "400") return { weight: 400, style: "normal" };
  if (t === "italic") return { weight: 400, style: "italic" };
  const m = t.match(/^(\d+)(italic)?$/);
  if (m) {
    return { weight: Number(m[1]), style: m[2] ? "italic" : "normal" };
  }
  return { weight: 400, style: "normal" };
}

// detect format for src() format(...)
function detectFontFormat(url) {
  if (!url) return "truetype";
  const u = url.split("?")[0].toLowerCase();
  if (u.endsWith(".woff2")) return "woff2";
  if (u.endsWith(".woff")) return "woff";
  if (u.endsWith(".ttf") || u.endsWith(".otf")) return "truetype";
  return "truetype";
}

// add @font-face dynamically for a single family + variant; caches loaded pairs
const loadedFonts = new Set();
function loadFontFace(family, variant, fileUrl) {
  const key = `${family}---${variant || "regular"}`;
  if (loadedFonts.has(key)) return key;
  try {
    const { weight, style } = parseVariantToken(variant);
    const format = detectFontFormat(fileUrl);
    const styleNode = document.createElement("style");
    styleNode.setAttribute("data-font-loader", key);
    // safe escaping for family (basic)
    const safeFamily = family.replace(/"/g, '\\"');
    styleNode.textContent = `
@font-face {
  font-family: "${safeFamily}";
  src: url("${fileUrl}") format("${format}");
  font-weight: ${weight};
  font-style: ${style};
  font-display: swap;
}`;
    document.head.appendChild(styleNode);
    loadedFonts.add(key);
    return key;
  } catch (e) {
    console.error("Failed to inject font-face:", e);
    return null;
  }
}

export default function FontsPage() {
  // fonts list from JSON
  const families = useMemo(() => (fontsData && fontsData.items ? fontsData.items : []), [fontsData]);

  // UI state
  const [query, setQuery] = useState("");
  const [selectedFamily, setSelectedFamily] = useState(() => (families[0]?.family || ""));
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState("regular");
  const [sampleText, setSampleText] = useState("The quick brown fox jumps over the lazy dog");
  const [fontSize, setFontSize] = useState(36);
  const [paletteKey, setPaletteKey] = useState("blue");
  const [subIdx, setSubIdx] = useState(0);
  const [textColor, setTextColor] = useState("#111111");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [isDarkPreview, setIsDarkPreview] = useState(false);
  const [loadingFont, setLoadingFont] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);

  // saved fonts (localStorage)
  const [saved, setSaved] = useState(() => {
    try {
      const raw = localStorage.getItem(SAVED_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // mobile sheet
  const [sheetOpen, setSheetOpen] = useState(false);

  // small refs
  const previewRef = useRef(null);

  // derived: family object
  const familyObj = useMemo(() => {
    if (!selectedFamily) return null;
    return families.find((f) => f.family === selectedFamily) || null;
  }, [families, selectedFamily]);

  // derived palette & subcolor
  const palette = COLOR_THEMES[paletteKey] || COLOR_THEMES.blue;
  const subColor = palette[subIdx % palette.length];

  // search / filtered families
  const filteredFamilies = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return families;
    return families.filter((f) => {
      if (f.family.toLowerCase().includes(q)) return true;
      if ((f.category || "").toLowerCase().includes(q)) return true;
      if ((f.tags || []).some((t) => (t.name || "").toLowerCase().includes(q))) return true;
      return false;
    });
  }, [families, query]);

  // when selected family changes: populate variants & set default variant
  useEffect(() => {
    if (!familyObj) {
      setVariants([]);
      setSelectedVariant("regular");
      return;
    }
    const v = Array.isArray(familyObj.variants) ? familyObj.variants.slice() : ["regular"];
    setVariants(v);
    // choose default variant if available
    const def = v.includes("regular") ? "regular" : v[0];
    setSelectedVariant((prev) => (v.includes(prev) ? prev : def));
  }, [familyObj]);

  // preload all variants for the selected family (so switching is instantaneous)
  useEffect(() => {
    async function preloadAll() {
      if (!familyObj) return;
      const files = familyObj.files || {};
      const entries = Object.entries(files);
      if (entries.length === 0) return;
      setLoadingFont(true);
      try {
        await Promise.all(
          entries.map(async ([variant, url]) => {
            try {
              loadFontFace(familyObj.family, variant, url);
              // small delay not necessary; loadFontFace injects @font-face which triggers browser fetch
            } catch (e) {
              console.warn("preload variant failed", variant, e);
            }
          })
        );
      } catch (e) {
        console.error("Preload fonts failed", e);
      } finally {
        // small wait to avoid flashing UI
        setTimeout(() => setLoadingFont(false), 120);
      }
    }
    preloadAll();
  }, [familyObj]);

  // ensure selected variant has a font-face injected (this is more of a safety in case a specific variant key doesn't map)
  useEffect(() => {
    async function ensureVariant() {
      if (!familyObj || !selectedVariant) return;
      const files = familyObj.files || {};
      const fileUrl = files[selectedVariant] || files[Object.keys(files)[0]];
      if (!fileUrl) {
        toast.error("No file URL available for selected variant");
        return;
      }
      try {
        loadFontFace(familyObj.family, selectedVariant, fileUrl);
      } catch (e) {
        console.error(e);
        toast.error("Failed to load font variant");
      }
    }
    ensureVariant();
  }, [familyObj, selectedVariant]);

  // persist saved whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(SAVED_KEY, JSON.stringify(saved));
    } catch {}
  }, [saved]);

  // generate embed code (CSS @font-face + usage snippet)
  const generateEmbedCSS = useCallback(() => {
    if (!familyObj) return { css: "", html: "" };
    const files = familyObj.files || {};
    const fileUrl = files[selectedVariant] || files[Object.keys(files)[0]];
    const { weight, style } = parseVariantToken(selectedVariant);
    const css = `/* Embed font via @font-face */
@font-face {
  font-family: "${familyObj.family}";
  src: url("${fileUrl}") format("${detectFontFormat(fileUrl)}");
  font-weight: ${weight};
  font-style: ${style};
  font-display: swap;
}

/* Usage */
.demo {
  font-family: "${familyObj.family}", system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial;
  font-size: ${fontSize}px;
  color: ${textColor};
}`;
    const html = `<p class="demo">${sampleText}</p>`;
    return { css, html };
  }, [familyObj, selectedVariant, fontSize, sampleText, textColor]);

  // copy embed code
  const copyEmbed = async () => {
    const code = generateEmbedCSS();
    try {
      await navigator.clipboard.writeText(code.css + "\n\n" + code.html);
      toast.success("Embed code copied");
    } catch {
      toast.error("Copy failed");
    }
  };

  // copy share link with URL params
  const copyShareLink = () => {
    const params = new URLSearchParams({
      family: selectedFamily,
      variant: selectedVariant,
      text: sampleText,
      size: String(fontSize),
      color: textColor.replace("#", ""),
    });
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url).then(() => toast.success("Share link copied"));
  };

  // Save current preview to localStorage (store metadata only)
  const handleSave = () => {
    if (!familyObj) return toast.error("Select a family first");
    const id = `font_${Date.now().toString(36)}`;
    const item = {
      id,
      family: familyObj.family,
      variant: selectedVariant,
      text: sampleText,
      fontSize,
      color: textColor,
      bgColor,
      createdAt: Date.now(),
    };
    setSaved((s) => [item, ...s].slice(0, 200));
    toast.success("Saved");
  };

  // open saved (load into preview)
  const openSaved = (s) => {
    setSelectedFamily(s.family);
    setSelectedVariant(s.variant);
    setSampleText(s.text);
    setFontSize(s.fontSize || 36);
    setTextColor(s.color || "#111111");
    setBgColor(s.bgColor || "#ffffff");
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success("Loaded saved preview");
  };

  // remove saved
  const removeSaved = (id) => {
    setSaved((arr) => arr.filter((x) => x.id !== id));
    toast.success("Removed");
  };

  // full screen toggle
  const toggleFullScreen = () => setFullScreen((f) => !f);

  // small "three dots" window control UI (yellow/green/red) for style
  const WindowControls = () => (
    <div className="flex items-center gap-2">
      <span className="w-3 h-3 rounded-full bg-red-400" />
      <span className="w-3 h-3 rounded-full bg-yellow-400" />
      <span className="w-3 h-3 rounded-full bg-green-400" />
    </div>
  );

  // variant display label
  const variantLabel = (v) => {
    if (v === "regular") return "Regular";
    if (v === "italic") return "Italic";
    return v;
  };

  // current parsed variant for preview use
  const currentVariantParsed = useMemo(() => parseVariantToken(selectedVariant), [selectedVariant]);

  // render
  return (
    <div className="min-h-screen p-6 md:p-10 overflow-hidden bg-background text-foreground">
      <Toaster richColors />

      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold">Revolyx Fonts</h1>
          <p className="text-sm opacity-70 mt-1">Inspired from the google fonts</p>
        </div>

        <div className="flex items-center gap-2">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="lg:hidden"><MenuIcon /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[320px] p-2">
              <div className="p-2">
                <div className="flex items-center justify-between mb-3">
                  <div className="font-medium">Families</div>
                </div>
                 <Input placeholder="Search families" value={query} onChange={(e) => setQuery(e.target.value)} />
                <ScrollArea className="h-[70vh]">
                  <div className="flex flex-col gap-2">
                    {filteredFamilies.map((f) => (
                      <button key={f.family} onClick={() => { setSelectedFamily(f.family); setSheetOpen(false); }} className={clsx("text-left p-2 rounded-md", f.family === selectedFamily ? "bg-indigo-50 dark:bg-zinc-800" : "hover:bg-muted")}>
                        <div className="font-medium">{f.family}</div>
                        <div className="text-xs opacity-60">{f.category}</div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2 border rounded-md px-2 py-1 bg-white dark:bg-zinc-900">
            <SearchIcon className="w-4 h-4 opacity-60" />
            <Input placeholder="Search families" value={query} onChange={(e) => setQuery(e.target.value)} className="border-0 shadow-none" />
          </div>

          <Button className='cursor-pointer' onClick={() => copyShareLink()}><LinkIcon className="w-4 h-4" />  <span className="hidden lg:flex">Share</span></Button>
          <Button className='cursor-pointer' onClick={copyEmbed}><Copy className="w-4 h-4" /><span className="hidden lg:flex">Embed</span></Button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left column: families list + filters */}
        <aside className="lg:col-span-1 max-h-screen hidden lg:block sticky top-6">
          <Card className="bg-white/80 dark:bg-black/80">
            <CardHeader>
              <CardTitle>Families</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Input placeholder="Search families" value={query} onChange={(e) => setQuery(e.target.value)} />
                <div className="space-y-1">
                  <div className="text-xs font-semibold opacity-70">Results</div>
                  <ScrollArea className="h-[60vh]">
                    <div className="space-y-2">
                      {filteredFamilies.map((f) => (
                        <button key={f.family} onClick={() => setSelectedFamily(f.family)} className={clsx("w-full cursor-pointer text-left p-2 rounded-md", f.family === selectedFamily ? "bg-indigo-50 dark:bg-zinc-800" : "hover:bg-muted")}>
                          <div className="font-medium">{f.family}</div>
                          <div className="text-xs opacity-60">{f.category} • {f.variants?.length || 0} variants</div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
                <Separator />
                <div className="flex items-center flex-wrap gap-4 justify-between">
                  <div className="text-xs opacity-60">Palette</div>
                  <div className="flex items-center  gap-2">
                    <Select value={paletteKey} onValueChange={(v) => setPaletteKey(v)} >
                      <SelectTrigger className="w-35 cursor-pointer"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Object.keys(COLOR_THEMES).map((k) => (
                          <SelectItem className="cursor-pointer" key={k} value={k}>
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-sm" style={{ background: `linear-gradient(90deg, ${COLOR_THEMES[k].join(",")})` }} />
                              <div className="text-sm">{k}</div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-1">
                      {palette.map((c, i) => (
                        <button key={c} title={c} onClick={() => { setSubIdx(i); setTextColor(c); }} className={clsx("w-6 h-6 cursor-pointer rounded-md border", subIdx === i ? "ring-2 ring-zinc-300" : "hover:scale-105")} style={{ background: c }} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Switch checked={isDarkPreview} className="cursor-pointer" onCheckedChange={setIsDarkPreview} />
                  <div className="text-xs opacity-70">Dark preview</div>
                </div>
                <Separator />
                <div className="flex gap-2">
                  <Button className="cursor-pointer" variant="secondary" onClick={() => { setQuery(""); setSelectedFamily(families[0]?.family || ""); }}>Reset</Button>
                  <Button className="cursor-pointer" variant="outline" onClick={() => { setSaved([]); toast.success("Cleared saved fonts"); }}>Clear saved</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Middle + Right: preview + variants + saved */}
        <section className="lg:col-span-3 space-y-4">
          {/* Preview + controls */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="md:col-span-3">
              <Card className="bg-white/80 dark:bg-black/80">
                <CardHeader className="flex items-start flex-wrap gap-5 justify-between">
                  <div >
                    
                    <CardTitle className="flex items-center gap-2">
                         <WindowControls />
                      <div className="text-lg font-semibold">{selectedFamily || "Select a family"}</div>
                      {familyObj?.category && <Badge>{familyObj.category}</Badge>}
                      <div className="text-xs opacity-60 ml-2">{familyObj?.version ? `v${familyObj.version}` : ""}</div>
                    </CardTitle>
                    <div className="text-xs opacity-60">{familyObj?.lastModified ? `Updated: ${familyObj.lastModified}` : ""}</div>
                   
                  </div>

                  <div className="flex items-center gap-2">
                    
                    <Button className="cursor-pointer" size="sm" variant="ghost" onClick={toggleFullScreen}>
                      {fullScreen ? <Minimize2 /> : <Maximize2 />}
                    </Button>
                    <Button  className="cursor-pointer" size="sm" onClick={copyEmbed}><Copy /></Button>
                    <Button  className="cursor-pointer" size="sm" variant="secondary" onClick={handleSave}><Save /></Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className={clsx("rounded-md p-4 transition-all", fullScreen ? "h-[80vh] w-full" : "h-[320px]") } style={{ background: isDarkPreview ? "#0b1220" : bgColor }}>
                    <div className="h-full w-full flex items-center justify-center">
                      {loadingFont ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="animate-spin w-8 h-8 text-indigo-500" />
                          <div className="text-sm opacity-70">Loading font…</div>
                        </div>
                      ) : (
                        <div
                          ref={previewRef}
                          style={{
                            fontFamily: selectedFamily || "system-ui",
                            fontWeight: currentVariantParsed.weight,
                            fontStyle: currentVariantParsed.style,
                            fontSize: `${fontSize}px`,
                            color: textColor,
                            padding: 8,
                            textAlign: "center",
                            maxWidth: "100%",
                            lineHeight: 1.05,
                            transition: "all 160ms ease",
                          }}
                        >
                          {sampleText}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <Label className="text-xs">Variant</Label>
                      <Select value={selectedVariant} onValueChange={(v) => setSelectedVariant(v)}>
                        <SelectTrigger className="w-full cursor-pointer"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {variants.map((v) => <SelectItem  className="cursor-pointer" key={v} value={v}>{variantLabel(v)}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-xs">Size</Label>
                      <div className="flex items-center gap-2">
                        <Slider className="cursor-pointer" value={[fontSize]} onValueChange={(val) => setFontSize(val[0])} min={12} max={65} step={1} />
                        <div className="w-12 text-right">{fontSize}px</div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Sample text</Label>
                      <Input value={sampleText} onChange={(e) => setSampleText(e.target.value)} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right column: variants list + quick actions */}
            <div>
              <Card className="bg-white/80 dark:bg-black/80" >
                <CardHeader><CardTitle>Variants & Quick Actions</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="text-xs font-semibold opacity-70 mb-2">Available variants</div>
                      <ScrollArea className=" max-h-100 overflow-y-auto gap-2">
                        {variants.map((v) => {
                          const parsed = parseVariantToken(v);
                          return (
                            <button key={v} onClick={() => setSelectedVariant(v)} className={clsx("p-2 w-full cursor-pointer rounded-md text-left", selectedVariant === v ? "bg-indigo-50 dark:bg-zinc-800" : "hover:bg-muted")}>
                              <div className="font-medium">{v}</div>
                              <div className="text-xs opacity-60">weight: {parsed.weight}, style: {parsed.style}</div>
                            </button>
                          );
                        })}
                      </ScrollArea>
                    </div>

                    <Separator />

                    <div className="flex flex-col gap-2">
                      <Button onClick={copyEmbed} className="flex cursor-pointer items-center gap-2"><Copy /> Copy embed</Button>
                      <Button onClick={copyShareLink} variant="outline" className="flex cursor-pointer items-center gap-2"><LinkIcon /> Copy link</Button>
                      <Button onClick={handleSave} variant="secondary" className="flex cursor-pointer items-center gap-2"><Save /> Save preview</Button>
                      <Button onClick={() => { setSaved([]); toast.success("Cleared saved"); }} variant="destructive" className="flex cursor-pointer items-center gap-2"><Trash2 /> Clear all</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

    <Card className="bg-white/70 dark:bg-zinc-900/60 backdrop-blur-xl border border-zinc-200/30 dark:border-zinc-800/40 shadow-lg transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg font-semibold">
          Saved Previews
          <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
            {saved.length} total
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[45vh] rounded-b-xl">
          {saved.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center justify-center h-[45vh] text-center px-4"
            >
              <div className="p-3 bg-zinc-100 dark:bg-zinc-800/70 rounded-full mb-3 shadow-sm">
                <Inbox className="w-8 h-8 text-zinc-400 dark:text-zinc-500" />
              </div>
              <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300">
                No saved previews yet
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-xs">
                Once you create or save a preview, it will appear here for quick access.
              </p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4">
              {saved.map((s) => (
                <motion.div
                  key={s.id}
                  whileHover={{ scale: 1.02, y: -2 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="p-4 rounded-xl border border-zinc-200/40 dark:border-zinc-800/50  shadow-sm hover:shadow-md transition-all duration-300 flex flex-col gap-2"
                >
                  <div className="flex items-start justify-between">
                    <div className="text-sm font-medium text-zinc-800 dark:text-zinc-100 truncate">
                      {s.family}
                    </div>
                    <div className="text-[10px] text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
                      {new Date(s.createdAt).toLocaleString()}
                    </div>
                  </div>

                  <div
                    style={{
                      fontFamily: s.family,
                      fontSize: `${Math.min(28, s.fontSize || 28)}px`,
                      color: s.color,
                      fontWeight: parseVariantToken(s.variant).weight,
                      fontStyle: parseVariantToken(s.variant).style,
                      background: isDarkPreview ? "#0b1220" : bgColor,
                    }}
                    
                    className="truncate border border-zinc-200/20 dark:border-zinc-800/40 rounded-md p-2 bg-zinc-50/50 dark:bg-zinc-950/40"
                  >
                    {s.text}
                  </div>

                  <div className="flex items-center justify-between mt-2">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => openSaved(s)}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="cursor-pointer"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.origin}${window.location.pathname}?family=${encodeURIComponent(
                              s.family
                            )}&variant=${encodeURIComponent(
                              s.variant
                            )}&text=${encodeURIComponent(s.text)}`
                          );
                          toast.success("Link copied!");
                        }}
                      >
                        <Link className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-400 cursor-pointer"
                      onClick={() => removeSaved(s.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>




    <Card className="bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl border border-zinc-200/30 dark:border-zinc-800/40 shadow-lg transition-all duration-300">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-lg font-semibold">
          Quick Previews (others)
          <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400">
            {families.length > 30 ? "Top 30 fonts" : `${families.length} fonts`}
          </span>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filteredFamilies.slice(0, 30).map((f) => (
            <motion.button
              key={f.family}
              onClick={() => {
                setSelectedFamily(f.family);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              whileHover={{ scale: 1.04, y: -2 }}
              transition={{ type: "spring", stiffness: 260, damping: 18 }}
              className="p-4 border border-zinc-200/40 dark:border-zinc-800/50 rounded-xl bg-white/60 dark:bg-zinc-900/60 hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300 cursor-pointer flex flex-col justify-between group"
            >
              <div>
                <div className="text-sm font-semibold text-zinc-800 dark:text-zinc-100 mb-1 truncate">
                  {f.family}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">
                  {f.category}
                </div>
              </div>

              {/* Live font preview */}
              <div
                style={{
                  fontFamily: f.family,
                  color:f.color,
                }}
                className="mt-3 text-center text-[15px] sm:text-[16px] text-zinc-700 dark:text-zinc-300 truncate transition-colors duration-200 group-hover:text-primary"
              >
                Aa Bb Cc
              </div>
            </motion.button>
          ))}
        </div>
      </CardContent>
    </Card>


        </section>
      </main>
    </div>
  );
}
