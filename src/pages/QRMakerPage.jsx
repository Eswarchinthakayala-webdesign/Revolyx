// src/pages/QRGeneratorPage.jsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { Toaster, toast } from "sonner";
import { toPng } from "html-to-image";
import * as qs from "qs";

import {
  Copy,
  Loader2,
  Download,
  Save,
  Trash2,
  Image as ImageIcon,
  Palette,
  Link as LinkIcon,
  Plus,
  Share2,
  Check,
  X,
  List as ListIcon,
  Link2,
  LucideLockOpen,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useTheme } from "../components/theme-provider";
import { showToast } from "../lib/ToastHelper";

//
// COLOR THEMES (same as yours)
//
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
  lime: ["#84cc16", "#a3e635", "#65a30d", "#bef264", "#ecfccb"],
  mint: ["#3eb489", "#70e1a1", "#1f9f75", "#a8f5c3", "#e0fff1"],
  turquoise: ["#14c8c8", "#3be0e0", "#089b9b", "#88eded", "#ccffff"],
  aqua: ["#00ffff", "#33ffff", "#00cccc", "#66ffff", "#ccffff"],
  sapphire: ["#0f52ba", "#2563eb", "#1e40af", "#60a5fa", "#93c5fd"],
  lavender: ["#b57edc", "#c084fc", "#a855f7", "#d8b4fe", "#f3e8ff"],
  magenta: ["#d946ef", "#e879f9", "#a21caf", "#f0abfc", "#fae8ff"],
  coral: ["#fb6f5f", "#fca5a5", "#dc2626", "#fecaca", "#fee2e2"],
  peach: ["#ffb997", "#ff9478", "#ff6f61", "#ffc9b9", "#ffe5dc"],
  gold: ["#facc15", "#fbbf24", "#ca8a04", "#fde68a", "#fef9c3"],
  bronze: ["#b08d57", "#cd9a6d", "#8c6239", "#e0b589", "#f4e1c1"],
  brown: ["#92400e", "#b45309", "#78350f", "#f59e0b", "#ffedd5"],
  midnight: ["#1e1b4b", "#312e81", "#1e3a8a", "#4338ca", "#6366f1"],
  neutral: ["#737373", "#a3a3a3", "#525252", "#d4d4d4", "#f5f5f5"],
  neon: ["#39ff14", "#7fff00", "#00ffcc", "#cc00ff", "#ff00aa"],
  navy: ["#1e3a8a", "#1d4ed8", "#172554", "#3b82f6", "#93c5fd"],
  copper: ["#b87333", "#c87a4b", "#a65e2e", "#d29572", "#f1d3b2"],
  silver: ["#c0c0c0", "#d1d5db", "#9ca3af", "#e5e7eb", "#f9fafb"],
    neonGreen: ["#39ff14", "#66ff66", "#00ff00", "#aaffaa", "#ccffcc"],
  neonBlue: ["#00f0ff", "#33ffff", "#009dff", "#80eaff", "#ccf7ff"],
  neonPink: ["#ff00ff", "#ff66ff", "#ff33cc", "#ff99ff", "#ffe6ff"],
  neonPurple: ["#b026ff", "#c266ff", "#8a2be2", "#d6a6ff", "#f0e6ff"],
  neonCyan: ["#00ffff", "#40e0d0", "#00bfff", "#80ffff", "#e0ffff"],
  neonOrange: ["#ff6e00", "#ff9933", "#ff4500", "#ffbb66", "#ffe0cc"],
  neonYellow: ["#faff00", "#ffff66", "#e6ff00", "#ffff99", "#ffffe6"],
  neonRed: ["#ff073a", "#ff3366", "#ff0040", "#ff8099", "#ffd6dd"],
  neonAqua: ["#00ffee", "#00ffcc", "#00e6b8", "#66fff0", "#ccfffa"],
  neonLime: ["#aaff00", "#ccff33", "#99e600", "#ddff99", "#f4ffe0"],
  neonTeal: ["#00ffbf", "#33ffd6", "#00cc99", "#99ffee", "#e6fffa"],
  neonRose: ["#ff1493", "#ff66b2", "#ff3385", "#ffa6cc", "#ffe6f0"],
  neonViolet: ["#bf00ff", "#d966ff", "#9900cc", "#e6b3ff", "#f7e6ff"],
  neonGold: ["#ffd700", "#ffef5a", "#ffcc00", "#fff27a", "#fff9cc"],
};

const LOCAL_KEY = "revolyx_qr_saves_v2";
const SAVE_CAP = 200;

// lazy qrcode generation helper (dynamic import)
async function qrcodeToSvg(text, opts = {}) {
  const QRCode = await import("qrcode");
  return new Promise((resolve, reject) => {
    const options = {
      errorCorrectionLevel: opts.ecLevel || "M",
      margin: Number(opts.margin ?? 2),
      color: {
        dark: opts.darkColor || "#111827",
        light: opts.lightColor || "#ffffff",
      },
      width: opts.size || 300,
    };
    QRCode.toString(text || " ", { ...options, type: "svg" }, (err, svg) => {
      if (err) return reject(err);
      resolve(svg);
    });
  });
}

// convert svg -> blob url
function svgToBlobUrl(svg) {
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  return URL.createObjectURL(blob);
}

// load saves safely
function loadSaves() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}
function persistSaves(list) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list || []));
  } catch {}
}

// small debounce hook
function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

export default function QRGeneratorPage() {
  // init from URL query string if present
  const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const initialText = urlParams.get("q") || "https://revolyx.app";

  // form state
  const [text, setText] = useState(initialText);
  const [size, setSize] = useState(Number(urlParams.get("size") || 300));
  const [margin, setMargin] = useState(Number(urlParams.get("margin") || 2));
  const [ecLevel, setEcLevel] = useState(urlParams.get("ec") || "M");
  const [format, setFormat] = useState(urlParams.get("format") || "svg"); // svg | png
  const [paletteKey, setPaletteKey] = useState(urlParams.get("palette") || "blue");
  const [subIdx, setSubIdx] = useState(Number(urlParams.get("sub") || 0));
  const [darkColor, setDarkColor] = useState("#111827");
  const [lightColor, setLightColor] = useState("#ffffff");
  const [autoSave, setAutoSave] = useState(true);

  // derived states
  const palette = COLOR_THEMES[paletteKey] || COLOR_THEMES.blue;
  const subColor = palette[subIdx % palette.length];

  // saved list
  const [saved, setSaved] = useState(() => loadSaves());
  const [svgString, setSvgString] = useState("");
  const svgRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // debounce live text & color changes for dynamic live preview
  const debouncedText = useDebounced(text, 350);
  const debouncedSize = useDebounced(size, 220);
  const debouncedDark = useDebounced(darkColor, 250);
  const debouncedLight = useDebounced(lightColor, 250);
  // store mini QR previews (cached SVG strings)
const [themeQrPreviews, setThemeQrPreviews] = useState({});

const {theme}=useTheme()
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

// generate small previews for themes (once per session)




  // sync url query (debounced to avoid excessive history churn)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const u = new URL(window.location.href);
        const params = u.searchParams;
        params.set("q", text || "");
        params.set("size", String(size));
        params.set("margin", String(margin));
        params.set("ec", ecLevel);
        params.set("format", format);
        params.set("palette", paletteKey);
        params.set("sub", String(subIdx));
        params.set("dark", darkColor.replace("#", ""));
        params.set("light", lightColor.replace("#", ""));
        u.search = params.toString();
        window.history.replaceState({}, "", u.toString());
      } catch {}
    }, 600);
    return () => clearTimeout(timer);
  }, [text, size, margin, ecLevel, format, paletteKey, subIdx, darkColor, lightColor]);

  // auto-generate when debounced inputs change (live preview) — only if debouncedText is non-empty
  useEffect(() => {
    let cancelled = false;
    async function gen() {
      if (!debouncedText || !debouncedText.trim()) {
        setSvgString("");
        return;
      }
      setLoading(true);
      try {
        const svg = await qrcodeToSvg(debouncedText, {
          ecLevel,
          margin,
          size: debouncedSize,
          darkColor: debouncedDark || subColor,
          lightColor: debouncedLight,
        });
        if (cancelled) return;
        setSvgString(svg);
      } catch (err) {
        console.error("QR generate error", err);
        showToast("error","Failed to generate preview");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    gen();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedText, debouncedSize, debouncedDark, debouncedLight, ecLevel, margin, subColor]);

  // keyboard shortcut: Ctrl/Cmd+Enter to generate + save
  useEffect(() => {
    function onKey(e) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleGenerate(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, size, margin, ecLevel, darkColor, lightColor, paletteKey, subIdx, format]);

  // persist saved list when changed
  useEffect(() => {
    persistSaves(saved);
  }, [saved]);

  // Generate function (explicit)
const handleGenerate = useCallback(
  async (saveAfter = true) => {
    if (!text || !text.trim()) {
      showToast("error","Enter a URL or text first");
      return;
    }

    setLoading(true);
    try {
      // 1️⃣ Generate full-size SVG for the main preview
      const fullSvg = await qrcodeToSvg(text, {
        ecLevel,
        margin,
        size, // user-selected or default full size
        darkColor: darkColor || subColor,
        lightColor,
      });

      setSvgString(fullSvg);

      // 2️⃣ If saving locally → also generate a small thumbnail version
      if (autoSave && saveAfter) {
        const thumbSvg = await qrcodeToSvg(text, {
          ecLevel,
          margin,
          size: 100, // 👈 smaller for saved view
          darkColor: darkColor || subColor,
          lightColor,
        });

        const item = {
          id: `qr_${Date.now().toString(36)}`,
          text,
          margin,
          ecLevel,
          paletteKey,
          subIdx,
          darkColor,
          lightColor,
          format,
          createdAt: Date.now(),
          svg: thumbSvg, // ✅ store the smaller one
        };

        const next = [item, ...saved].slice(0, SAVE_CAP);
        setSaved(next);
        showToast("success","QR generated and saved locally");
      } else {
        showToast("success","QR generated");
      }
    } catch (err) {
      console.error(err);
      showToast("error","Failed to generate QR");
    } finally {
      setLoading(false);
    }
  },
  [
    text,
    ecLevel,
    margin,
    size,
    darkColor,
    lightColor,
    autoSave,
    saved,
    paletteKey,
    subIdx,
    format,
    subColor,
  ]
);


  // Download handler
  const handleDownload = useCallback(
    async (as = "svg") => {
      if (!svgString) {
        showToast("error","Generate a QR first");
        return;
      }
      try {
        if (as === "svg") {
          const url = svgToBlobUrl(svgString);
          const a = document.createElement("a");
          a.href = url;
          a.download = `revolyx-qr-${Date.now()}.svg`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
          showToast("success","SVG downloaded");
        } else {
          // PNG
          // try direct DOM conversion if svg rendered, else convert from string via temporary DOM
          const node = svgRef.current?.querySelector("svg");
          if (node) {
            const png = await toPng(node, { cacheBust: true, pixelRatio: 2 });
            const a = document.createElement("a");
            a.href = png;
            a.download = `revolyx-qr-${Date.now()}.png`;
            a.click();
            showToast("success","PNG downloaded");
          } else {
            // fallback: place svg in hidden node and convert
            const wrapper = document.createElement("div");
            wrapper.style.position = "fixed";
            wrapper.style.left = "-9999px";
            wrapper.innerHTML = svgString;
            document.body.appendChild(wrapper);
            const svgNode = wrapper.querySelector("svg");
            if (!svgNode) throw new Error("SVG missing");
            const png = await toPng(svgNode, { cacheBust: true, pixelRatio: 2 });
            const a = document.createElement("a");
            a.href = png;
            a.download = `revolyx-qr-${Date.now()}.png`;
            a.click();
            document.body.removeChild(wrapper);
            showToast("success","PNG downloaded");
          }
        }
      } catch (err) {
        console.error(err);
        showToast("error","Download failed");
      }
    },
    [svgString]
  );

  const handleCopySvg = useCallback(async () => {
    if (!svgString) return showToast("error","Generate first");
    try {
      await navigator.clipboard.writeText(svgString);
      showToast("success","SVG markup copied");
    } catch {
      showToast("error","Copy failed");
    }
  }, [svgString]);

  const openSaved = useCallback((it) => {
    if (!it) return;
    setText(it.text || "");
    setSize(it.size || 300);
    setMargin(it.margin || 2);
    setEcLevel(it.ecLevel || "M");
    setPaletteKey(it.paletteKey || "blue");
    setSubIdx(it.subIdx || 0);
    setDarkColor(it.darkColor || "#111827");
    setLightColor(it.lightColor || "#ffffff");
    setFormat(it.format || "svg");
    setSvgString(it.svg || "");
    showToast("info",`Loaded saved QR (${new Date(it.createdAt).toLocaleString()})`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const removeSaved = useCallback((id) => {
    const next = saved.filter((s) => s.id !== id);
    setSaved(next);
    showToast("success","Saved removed");
  }, [saved]);

  const applyTheme = useCallback((k) => {
    setPaletteKey(k);
    setSubIdx(0);
    setDarkColor(COLOR_THEMES[k][0] || "#111827");
    window.scrollTo({ top: 0, behavior: "smooth" });
    showToast("success",`${k} theme loaded`);
  }, []);

  const clearAllSaved = useCallback(() => {
    if (!confirm("Clear all saved QRs? This cannot be undone.")) return;
    setSaved([]);
    persistSaves([]);
    showToast("success","All saved QRs cleared");
  }, []);

  // remaining theme previews
  const themeList = useMemo(() => Object.keys(COLOR_THEMES), []);
  const remainingThemePreviews = useMemo(
    () => themeList.map((k) => ({ key: k, dark: COLOR_THEMES[k][0], palette: COLOR_THEMES[k] })),
    [themeList]
  );

const previousTheme = useRef(isDark);

useEffect(() => {
  if (previousTheme.current === isDark && Object.keys(themeQrPreviews).length > 0) return;
  previousTheme.current = isDark;

  const generatePreviews = async () => {
    const previews = {};
    for (const { key, dark } of remainingThemePreviews) {
      try {
        const svg = await qrcodeToSvg("https://revolyx.app", {
          ecLevel: "M",
          margin: 1,
          size: 100,
          darkColor: dark,
          lightColor: isDark ? "#000000" : "#ffffff",
        });
        previews[key] = svg;
      } catch (err) {
        console.warn("Preview generation failed for", key, err);
      }
    }
    setThemeQrPreviews(previews);
  };

  generatePreviews();
}, [isDark, remainingThemePreviews]);


  // Mobile sheet component for saved items (simple)
  function MobileSheetSaved() {
    return (
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button  variant="ghost" className="lg:hidden cursor-pointer"><ListIcon /></Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[340px]">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold">Saved QRs</div>
              
            </div>

            <ScrollArea className="h-[70vh]">
              <div className="flex flex-col gap-3">
                {saved.length === 0 && <div className="text-sm opacity-60">No saved QRs</div>}
                {saved.map((s) => (
                 <div key={s.id} className="flex items-center  justify-between gap-3 border rounded p-4">
                        <div className="flex items-start flex-col gap-3">
                          <div dangerouslySetInnerHTML={{ __html: s.svg }}  />
                          <div className="w-50">
                            <div className="font-medium truncate">{s.text}</div>
                            <div className="text-xs opacity-60">{new Date(s.createdAt).toLocaleString()}</div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <button className="cursor-pointer" onClick={() => openSaved(s)}><LucideLockOpen className="w-4 h-4"/></button>
                          <button className="cursor-pointer"  onClick={() => { navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?q=${encodeURIComponent(s.text)}`); toast.success("Share link copied"); }}><Link2 className="w-4 h-4"/></button>
                          <button className="cursor-pointer hover:text-red-500 text-red-600"  onClick={() => removeSaved(s.id)}><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // small palette swatches renderer
  function PaletteSwatches({ onSelect }) {
    return (
      <div className="flex gap-2 flex-wrap">
        {palette.map((c, i) => (
          <button
            key={c}
            title={c}
            className={clsx("w-8 h-8 rounded-md border cursor-pointer transition-transform", subIdx === i ? "ring-2 ring-offset-1 ring-zinc-400/30 scale-105" : "hover:scale-105")}
            style={{ background: c }}
            onClick={() => {
              setSubIdx(i);
              setDarkColor(c);
              if (typeof onSelect === "function") onSelect(c, i);
            }}
          />
        ))}
      </div>
    );
  }

  // Preview card component
  function PreviewCard() {
    return (
      <div className="rounded-lg border p-3 bg-white/80 dark:bg-zinc-900/60">
        <div className="flex items-center flex-wrap gap-6 justify-between mb-3">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold">Preview</h3>
            <Badge>{format.toUpperCase()}</Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button className="cursor-pointer" size="sm" variant="ghost" onClick={() => handleGenerate(false)} aria-label="Regenerate small">
              <Loader2 className={clsx("w-4 h-4", loading ? "animate-spin" : "")} />
            </Button>
            <Button className="cursor-pointer" size="sm" onClick={() => handleDownload("svg")}><Download className="w-4 h-4 mr-1" />SVG</Button>
            <Button className="cursor-pointer" size="sm" onClick={() => handleDownload("png")}><ImageIcon className="w-4 h-4 mr-1" />PNG</Button>
            <Button className="cursor-pointer" size="sm" onClick={handleCopySvg}><Copy className="w-4 h-4 mr-1" />Copy</Button>
          </div>
        </div>

        <div className="w-full h-[360px] flex items-center justify-center bg-white/60 dark:bg-black/60 rounded-md overflow-auto p-4">
          {loading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="animate-spin w-8 h-8 text-zinc-500" />
              <div className="text-sm opacity-70">Generating…</div>
            </div>
          ) : svgString ? (
            <div ref={svgRef} dangerouslySetInnerHTML={{ __html: svgString }} />
          ) : (
            <div className="text-sm opacity-60">Preview will appear here. Type a URL/text or click Generate.</div>
          )}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="text-xs opacity-70">Tip: Ctrl/Cmd + Enter to generate and save</div>
          <div className="flex items-center gap-2">
            <Button className="cursor-pointer" size="sm" onClick={() => { navigator.clipboard.writeText(window.location.href); showToast("success","Page link copied"); }}>
              <Share2 className="w-4 h-4 mr-1" /> Share
            </Button>
            <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => { setSvgString(""); showToast("success","Cleared preview"); }}>
              Clear
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // UI Render
  return (
    <div className="min-h-screen max-w-8xl mx-auto overflow-hidden py-8 px-4 md:px-8">
      <Toaster richColors />
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">Revolyx QR Maker</h1>
          <p className="text-sm opacity-70 mt-1">Professional QR generation </p>
        </div>

        <div className="flex items-center gap-2">
          <MobileSheetSaved />
          <Button className="cursor-pointer" onClick={() => { navigator.clipboard.writeText(window.location.href); toast.success("Page URL copied"); }}><LinkIcon className="w-4 h-4 mr-1" />Share</Button>
          <Button className="cursor-pointer" variant="secondary" onClick={() => setDialogOpen(true)}><Plus className="w-4 h-4 mr-1" />New</Button>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left: controls */}
        <aside className="lg:col-span-1">
          <Card className="bg-white/60 dark:bg-black/60">
            <CardHeader><CardTitle>Options</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Label className="text-xs pb-2">Text / URL</Label>
                <Input placeholder="https://example.com" value={text} onChange={(e) => setText(e.target.value)} aria-label="QR text" />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs pb-2">Size (px)</Label>
                    <Input value={size} type="number" onChange={(e) => setSize(Number(e.target.value || 0))} />
                  </div>
                  <div>
                    <Label className="text-xs pb-2">Margin</Label>
                    <Input value={margin} type="number" onChange={(e) => setMargin(Number(e.target.value || 0))} />
                  </div>
                </div>

                <div>
                  <Label className="text-xs pb-2">Error correction</Label>
                  <Select value={ecLevel} onValueChange={(v) => setEcLevel(v)}>
                    <SelectTrigger className="w-full cursor-pointer"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem className="cursor-pointer" value="L">L (Low)</SelectItem>
                      <SelectItem className="cursor-pointer" value="M">M (Medium)</SelectItem>
                      <SelectItem className="cursor-pointer" value="Q">Q (Quartile)</SelectItem>
                      <SelectItem className="cursor-pointer" value="H">H (High)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs pb-2">Format</Label>
                  <Select value={format} onValueChange={(v) => setFormat(v)}>
                    <SelectTrigger className="w-full cursor-pointer"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem className="cursor-pointer" value="svg">SVG</SelectItem>
                      <SelectItem className="cursor-pointer" value="png">PNG</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div>
                  <Label className="text-xs pb-2">Palette</Label>
                  <Select value={paletteKey} onValueChange={(v) => { setPaletteKey(v); setSubIdx(0); }}>
                    <SelectTrigger className="w-full cursor-pointer"><SelectValue /></SelectTrigger>
                    <SelectContent className="h-120">
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
                  <div className="mt-5"><PaletteSwatches /></div>
                </div>

                <div>
                  <Label className="text-xs">Colors (manual)</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[11px]">Dark (QR)</Label>
                      <Input value={darkColor} onChange={(e) => setDarkColor(e.target.value)} />
                    </div>
                    <div>
                      <Label className="text-[11px]">Light (BG)</Label>
                      <Input value={lightColor} onChange={(e) => setLightColor(e.target.value)} />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Switch id="autosave" checked={autoSave} onCheckedChange={(v) => setAutoSave(!!v)} />
                  <Label className="text-xs">Auto save generated</Label>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => handleGenerate(true)} className="flex-1 cursor-pointer">
                    {loading ? <Loader2 className="animate-spin w-4 h-4 mr-1" /> : <Plus className="w-4 h-4 mr-1" />} Generate
                  </Button>
                  <Button className="cursor-pointer" variant="outline" onClick={() => { setSvgString(""); toast("Preview cleared"); }}>Clear</Button>
                </div>

                <div className="text-xs opacity-70">
                  <div>Quick actions:</div>
                  <div className="flex gap-2 mt-2">
                    <Button className="cursor-pointer" size="sm" variant="ghost" onClick={() => { handleDownload("svg"); }}><Download className="w-4 h-4" /></Button>
                    <Button className="cursor-pointer" size="sm" variant="ghost" onClick={() => { handleDownload("png"); }}><ImageIcon className="w-4 h-4" /></Button>
                    <Button className="cursor-pointer" size="sm" variant="ghost" onClick={() => { handleCopySvg(); }}><Copy className="w-4 h-4" /></Button>
                    <Button className="cursor-pointer" size="sm" variant="destructive" onClick={clearAllSaved}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Right: preview + saved + theme previews */}
        <section className="lg:col-span-3 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="bg-white/60 dark:bg-black/60">
              <CardHeader><CardTitle>Live Preview</CardTitle></CardHeader>
              <CardContent>
                <PreviewCard />
              </CardContent>
            </Card>

            <Card className="bg-white/60 dark:bg-black/60">
              <CardHeader className="flex items-center justify-between">
                <CardTitle>Saved QRs</CardTitle>
                <div className="text-xs opacity-60">{saved.length} saved</div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[56vh]">
                  <div className="space-y-3">
                    {saved.length === 0 ? (
                      <div className="text-sm opacity-60">No saved QRs</div>
                    ) : saved.map((s) => (
                      <div key={s.id} className="flex items-center  justify-between gap-3 border rounded p-4">
                        <div className="flex items-start flex-col gap-3">
                          <div dangerouslySetInnerHTML={{ __html: s.svg }}  />
                          <div className="w-50">
                            <div className="font-medium truncate">{s.text}</div>
                            <div className="text-xs opacity-60">{new Date(s.createdAt).toLocaleString()}</div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <button className="cursor-pointer" onClick={() => openSaved(s)}><LucideLockOpen className="w-4 h-4"/></button>
                          <button className="cursor-pointer"  onClick={() => { navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?q=${encodeURIComponent(s.text)}`); toast.success("Share link copied"); }}><Link2 className="w-4 h-4"/></button>
                          <button className="cursor-pointer hover:text-red-500 text-red-600"  onClick={() => removeSaved(s.id)}><Trash2 className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

         <Card className="bg-white/60 dark:bg-black/60">
  <CardHeader><CardTitle>Theme Previews</CardTitle></CardHeader>
  <CardContent>
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
      {remainingThemePreviews.map((t) => (
        <motion.button
          key={t.key}
          whileHover={{ scale: 1.04 }}
          className="p-3 border rounded-lg cursor-pointer flex flex-col items-center gap-2 hover:shadow-md transition"
          onClick={() => applyTheme(t.key)
          }
        >
          <div className="w-full h-24 rounded-md  flex items-center justify-center overflow-hidden">
            {themeQrPreviews[t.key] ? (
              <div
                dangerouslySetInnerHTML={{ __html: themeQrPreviews[t.key] }}
              
              />
            ) : (
              <Loader2 className="animate-spin w-6 h-6 text-zinc-500" />
            )}
          </div>
          <div className="text-xs font-medium">{t.key}</div>
          <div className="text-[11px] opacity-60 truncate w-full text-center">
            {t.palette.slice(0, 3).join(", ")}
          </div>
        </motion.button>
      ))}
    </div>
  </CardContent>
</Card>

        </section>
      </main>

      {/* New dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New QR</DialogTitle></DialogHeader>
          <div className="py-2">
            <Label>Start a new QR (this will clear preview)</Label>
            <div className="mt-4 flex gap-2 justify-end">
              <Button className="cursor-pointer" onClick={() => { setText(""); setSvgString(""); setDialogOpen(false); }}>Clear & Close</Button>
              <Button className="cursor-pointer" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            </div>
          </div>
          <DialogFooter />
        </DialogContent>
      </Dialog>
    </div>
  );
}


