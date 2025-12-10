// src/pages/GridLayoutPlayground.jsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Toaster } from "sonner";
import {
  Copy,
  Check,
  Download,
  Maximize2,
  Minimize2,
  Image as ImageIcon,
  Shuffle,
  RotateCcw,
  GlassWater,
} from "lucide-react";
import { toPng } from "html-to-image";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { showToast } from "../lib/ToastHelper";
import { useTheme } from "../components/theme-provider";
import { useNavigate, useSearchParams } from "react-router-dom";

// helper
const uid = () => Math.random().toString(36).slice(2, 9);

// default config
const DEFAULT = {
  columns: 4,
  rows: 3,
  gap: 12,
  colSize: "1fr",
  rowSize: "auto",
  autoFit: false,
  minColWidth: 160,
  itemCount: 8,
  dense: false,
  justify: "stretch",
  align: "stretch",
  showIndices: true,
  watermark: true,
  scaleExport: 2,
  masonryMode: false,
};

// presets
const GRID_PRESETS = [
  { name: "Dashboard (3x)", state: { columns: 3, rows: 3, gap: 12, itemCount: 9 } },
  { name: "Photo Gallery (fit)", state: { autoFit: true, minColWidth: 220, gap: 8, itemCount: 12, masonryMode: true } },
  { name: "Masonry like", state: { columns: 4, gap: 8, itemCount: 10, dense: true, masonryMode: true } },
  { name: "Editor layout", state: { columns: 12, gap: 12, itemCount: 6 } },
  { name: "Cards (auto-fit)", state: { autoFit: true, minColWidth: 180, gap: 10, itemCount: 8 } },
];

// utility for serializing state to URL & back
function serializeState(s) {
  return encodeURIComponent(JSON.stringify(s));
}
function deserializeState(q) {
  try {
    return JSON.parse(decodeURIComponent(q));
  } catch {
    return null;
  }
}

export default function GridLayoutPlayground() {
  const { theme } = useTheme?.() ?? { theme: "light" };
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // react-router hooks
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // read encoded state from URL (if present)
  const initialUrlState = useMemo(() => {
    try {
      const s = searchParams.get("gstate");
      return s ? deserializeState(s) : null;
    } catch {
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // only on mount

  // core state (initialized from URL if present)
  const [columns, setColumns] = useState(initialUrlState?.columns ?? DEFAULT.columns);
  const [rows, setRows] = useState(initialUrlState?.rows ?? DEFAULT.rows);
  const [gap, setGap] = useState(initialUrlState?.gap ?? DEFAULT.gap);
  const [colSize, setColSize] = useState(initialUrlState?.colSize ?? DEFAULT.colSize);
  const [rowSize, setRowSize] = useState(initialUrlState?.rowSize ?? DEFAULT.rowSize);
  const [autoFit, setAutoFit] = useState(initialUrlState?.autoFit ?? DEFAULT.autoFit);
  const [minColWidth, setMinColWidth] = useState(initialUrlState?.minColWidth ?? DEFAULT.minColWidth);
  const [itemCount, setItemCount] = useState(initialUrlState?.itemCount ?? DEFAULT.itemCount);
  const [dense, setDense] = useState(initialUrlState?.dense ?? DEFAULT.dense);
  const [justify, setJustify] = useState(initialUrlState?.justify ?? DEFAULT.justify);
  const [align, setAlign] = useState(initialUrlState?.align ?? DEFAULT.align);
  const [showIndices, setShowIndices] = useState(initialUrlState?.showIndices ?? DEFAULT.showIndices);
  const [masonryMode, setMasonryMode] = useState(initialUrlState?.masonryMode ?? DEFAULT.masonryMode);

  // UI state
  const [watermark, setWatermark] = useState(initialUrlState?.watermark ?? DEFAULT.watermark);
  const [scaleExport, setScaleExport] = useState(initialUrlState?.scaleExport ?? DEFAULT.scaleExport);
  const [fullscreen, setFullscreen] = useState(false);
  const [copiedCss, setCopiedCss] = useState(false);
  const [copiedTailwind, setCopiedTailwind] = useState(false);

  // refs
  const previewWrapRef = useRef(null);

  // derived
  const gridTemplateColumns = useMemo(() => {
    if (autoFit) return `repeat(auto-fit, minmax(${minColWidth}px, 1fr))`;
    if (colSize === "1fr") return `repeat(${columns}, 1fr)`;
    return `repeat(${columns}, ${colSize})`;
  }, [autoFit, minColWidth, columns, colSize]);

  const gridTemplateRows = useMemo(() => {
    if (rowSize === "auto") return `repeat(${rows}, auto)`;
    return `repeat(${rows}, ${rowSize})`;
  }, [rows, rowSize]);

  // CSS & Tailwind snippets
  const cssSnippet = useMemo(() => {
    return `/* Grid: ${columns} cols ${rows} rows gap ${gap}px */\n.container { display: grid; grid-template-columns: ${gridTemplateColumns}; grid-template-rows: ${gridTemplateRows}; gap: ${gap}px; justify-items: ${justify}; align-items: ${align}; }\n.container > .item { background: linear-gradient(135deg, rgba(255,255,255,0.06), rgba(0,0,0,0.06)); padding: 12px; border-radius: 8px; }`;
  }, [columns, rows, gap, gridTemplateColumns, gridTemplateRows, justify, align]);

  const tailwindSnippet = useMemo(() => {
    const gapCls = `gap-[${gap}px]`;
    const cols = autoFit ? `grid-cols-[repeat(auto-fit,minmax(${minColWidth}px,1fr))]` : `grid-cols-${columns}`;
    return `className="grid ${cols} ${gapCls} justify-items-${justify} items-${align}"`;
  }, [gap, autoFit, minColWidth, columns, justify, align]);

  // update URL state using react-router's setSearchParams
  const pushUrlState = useCallback(
    (s) => {
      try {
        const q = serializeState(s);
        // set only gstate param (preserves other params if needed)
        setSearchParams({ gstate: q }, { replace: true });
      } catch (e) {
        // ignore
      }
    },
    [setSearchParams]
  );

  // when core state changes update URL (debounce not added — immediate)
  useEffect(() => {
    const s = {
      columns,
      rows,
      gap,
      colSize,
      rowSize,
      autoFit,
      minColWidth,
      itemCount,
      dense,
      justify,
      align,
      showIndices,
      watermark,
      scaleExport,
      masonryMode,
    };
    pushUrlState(s);
  }, [
    columns,
    rows,
    gap,
    colSize,
    rowSize,
    autoFit,
    minColWidth,
    itemCount,
    dense,
    justify,
    align,
    showIndices,
    watermark,
    scaleExport,
    masonryMode,
    pushUrlState,
  ]);

  // export PNG (html-to-image) with improved watermark logic
  const capturePng = useCallback(
    async ({ withWatermark = true, fileName = `grid-layout.png`, scale = 2 } = {}) => {
      try {
        if (!previewWrapRef.current) return showToast("error", "Preview not available");

        // find watermark nodes inside preview wrapper
        const wnodes = previewWrapRef.current.querySelectorAll("[data-grid-watermark]");

        // Save current inline styles so we can restore
        const savedStyles = [];
        wnodes.forEach((n) => {
          savedStyles.push({ node: n, style: n.getAttribute("style") || "" });
          // Make watermark visible (opacity), ensure it's above content
          // Use transform / z-index / opacity so there is no layout reflow
          n.style.transition = "opacity 120ms ease";
          n.style.opacity = withWatermark ? "1" : "0";
          n.style.zIndex = 9999;
          n.style.pointerEvents = "none";
        });

        // Wait a tick for styles to apply (ensures correct capture)
        await new Promise((res) => requestAnimationFrame(res));

        const dataUrl = await toPng(previewWrapRef.current, { cacheBust: true, pixelRatio: Math.max(1, scale) });

        // restore styles
        savedStyles.forEach(({ node, style }) => {
          node.setAttribute("style", style);
        });

        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast("success", "PNG downloaded");
      } catch (err) {
        console.error("export error", err);
        showToast("error", "PNG export failed");
      }
    },
    []
  );

  // copy helpers
  const handleCopyCss = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cssSnippet);
      setCopiedCss(true);
      showToast("success", "Copied CSS");
      setTimeout(() => setCopiedCss(false), 1400);
    } catch {
      showToast("error", "Copy failed");
    }
  }, [cssSnippet]);

  const handleCopyTailwind = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(tailwindSnippet);
      setCopiedTailwind(true);
      showToast("success", "Copied Tailwind");
      setTimeout(() => setCopiedTailwind(false), 1400);
    } catch {
      showToast("error", "Copy failed");
    }
  }, [tailwindSnippet]);

  // grid items generator
  const items = useMemo(() => {
    return Array.from({ length: Math.max(1, itemCount) }).map((_, i) => ({ id: i + 1, span: 1 }));
  }, [itemCount]);

  // small presets
  const applyPreset = (p) => {
    const s = p.state;
    if (s.columns !== undefined) setColumns(s.columns);
    if (s.rows !== undefined) setRows(s.rows);
    if (s.gap !== undefined) setGap(s.gap);
    if (s.minColWidth !== undefined) setMinColWidth(s.minColWidth);
    if (s.autoFit !== undefined) setAutoFit(s.autoFit);
    if (s.itemCount !== undefined) setItemCount(s.itemCount);
    if (s.masonryMode !== undefined) setMasonryMode(Boolean(s.masonryMode));
    showToast("success", `Loaded ${p.name}`);
  };

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        capturePng({ withWatermark: false, scale: scaleExport });
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        handleCopyCss();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [capturePng, scaleExport, handleCopyCss]);

  // helper: clear URL state
  const clearUrlState = () => {
    setSearchParams({}, { replace: true });
    navigate(window.location.pathname, { replace: true });
    showToast("success", "Cleared URL state");
  };

  // small inline styles for masonry items (so they don't break layout)
  const masonryItemStyle = (i, isDarkMode) => {
    const base = {
      display: "inline-block",
      width: "100%",
      marginBottom: `${gap}px`,
      borderRadius: 8,
      overflow: "hidden",
      boxSizing: "border-box",
    };
    // pseudo-random heights for demo brick look
    const h = 80 + ((i * 47) % 220);
    const bg = isDarkMode ? "linear-gradient(135deg, rgba(255,255,255,0.02), rgba(0,0,0,0.06))" : "linear-gradient(135deg, rgba(0,0,0,0.02), rgba(255,255,255,0.02))";
    return { ...base, height: h, background: bg };
  };

  return (
    <div className="min-h-screen max-w-8xl overflow-hidden mx-auto py-8 px-4 md:px-8">
      <Toaster richColors />
      <header className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">
      
            Grid Layout Playground
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Design responsive CSS Grid layouts visually 
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
           className="cursor-pointer"
            variant="secondary"
            onClick={() => {
              setColumns(DEFAULT.columns);
              setRows(DEFAULT.rows);
              setGap(DEFAULT.gap);
              setItemCount(DEFAULT.itemCount);
              setAutoFit(DEFAULT.autoFit);
              setMasonryMode(DEFAULT.masonryMode);
              showToast("success", "Defaults restored");
            }}
          >
            <RotateCcw className="w-4 h-4" /> Defaults
          </Button>

          <div className="flex items-center gap-2">
            <Button className="cursor-pointer" onClick={() => setFullscreen(true)}>
              <Maximize2 className="w-4 h-4" />Preview
            </Button>
            <Button className="cursor-pointer" variant="outline" onClick={() => capturePng({ withWatermark: watermark, scale: scaleExport })}>
              <ImageIcon className="w-4 h-4" />Export PNG
            </Button>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <aside className="lg:col-span-3">
          <Card className="shadow dark:bg-black/80 bg-white/80">
            <CardHeader>
              <CardTitle>Grid Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label className="text-xs">Columns</Label>
                <div className="flex items-center gap-2">
                  <Slider value={[columns]} onValueChange={(v) => setColumns(v[0])} min={1} max={12} step={1} className="flex-1 cursor-pointer" />
                  <div className="w-12 text-right text-sm">{columns}</div>
                </div>

                <Label className="text-xs">Rows</Label>
                <div className="flex items-center gap-2">
                  <Slider value={[rows]} onValueChange={(v) => setRows(v[0])} min={1} max={12} step={1} className="flex-1 cursor-pointer" />
                  <div className="w-12 text-right text-sm">{rows}</div>
                </div>

                <Label className="text-xs">Gap (px)</Label>
                <div className="flex items-center gap-2">
                  <Slider value={[gap]} onValueChange={(v) => setGap(v[0])} min={0} max={64} step={1} className="flex-1 cursor-pointer" />
                  <div className="w-12 text-right text-sm">{gap}px</div>
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-2 items-center">
                  <div>
                    <Label className="text-xs mb-1">Col size</Label>
                    <Select value={colSize} onValueChange={(v) => setColSize(v)}>
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem className="cursor-pointer" value="1fr">Equal (1fr)</SelectItem>
                        <SelectItem className="cursor-pointer" value="auto">Auto</SelectItem>
                        <SelectItem className="cursor-pointer" value="200px">Fixed (200px)</SelectItem>
                        <SelectItem className="cursor-pointer" value="minmax(100px,1fr)">Minmax(100px,1fr)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-xs mb-1">Row size</Label>
                    <Select value={rowSize} onValueChange={(v) => setRowSize(v)}>
                      <SelectTrigger className="w-full cursor-pointer">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem className="cursor-pointer" value="auto">Auto</SelectItem>
                        <SelectItem className="cursor-pointer" value="1fr">1fr</SelectItem>
                        <SelectItem className="cursor-pointer" value="120px">Fixed (120px)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox className="cursor-pointer" id="masonry" checked={masonryMode} onCheckedChange={(v) => setMasonryMode(Boolean(v))} />
                  <label htmlFor="masonry" className="text-sm">
                    Masonry (brick) mode
                  </label>
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox className="cursor-pointer" id="autofit" checked={autoFit} onCheckedChange={(v) => setAutoFit(Boolean(v))} />
                  <label htmlFor="autofit" className="text-sm">
                    Auto-fit columns (min width)
                  </label>
                </div>

                {autoFit && (
                  <div>
                    <Label className="text-xs">Min column width (px)</Label>
                    <div className="flex items-center gap-2">
                      <Slider value={[minColWidth]} onValueChange={(v) => setMinColWidth(v[0])} min={80} max={400} step={1} className="flex-1 cursor-pointer" />
                      <div className="w-14 text-right text-sm">{minColWidth}px</div>
                    </div>
                  </div>
                )}

                <Separator />

                <Label className="text-xs">Items</Label>
                <div className="flex items-center gap-2">
                  <Slider value={[itemCount]} onValueChange={(v) => setItemCount(v[0])} min={1} max={48} step={1} className="flex-1 cursor-pointer" />
                  <div className="w-14 text-right text-sm">{itemCount}</div>
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox className="cursor-pointer" id="dense" checked={dense} onCheckedChange={(v) => setDense(Boolean(v))} />
                  <label htmlFor="dense" className="text-sm">
                    Dense packing
                  </label>
                </div>

                <Separator />

                <div>
                  <Label className="text-xs mb-1">Justify Items</Label>
                  <Select value={justify} onValueChange={(v) => setJustify(v)}>
                    <SelectTrigger className="w-full cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem className="cursor-pointer" value="stretch">stretch</SelectItem>
                      <SelectItem className="cursor-pointer" value="start">start</SelectItem>
                      <SelectItem className="cursor-pointer" value="center">center</SelectItem>
                      <SelectItem className="cursor-pointer" value="end">end</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs mb-1">Align Items</Label>
                  <Select value={align} onValueChange={(v) => setAlign(v)}>
                    <SelectTrigger className="w-full cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem className="cursor-pointer" value="stretch">stretch</SelectItem>
                      <SelectItem className="cursor-pointer" value="start">start</SelectItem>
                      <SelectItem className="cursor-pointer" value="center">center</SelectItem>
                      <SelectItem className="cursor-pointer" value="end">end</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow mt-4 dark:bg-black/80 bg-white/80">
            <CardHeader>
              <CardTitle>Presets</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {GRID_PRESETS.map((p) => (
                  <button key={p.name} onClick={() => applyPreset(p)} className="px-3 py-2 rounded border cursor-pointer">
                    {p.name}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow mt-4 dark:bg-black/80 bg-white/80">
            <CardHeader>
              <CardTitle>Export options</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Checkbox className="cursor-pointer" id="wm" checked={watermark} onCheckedChange={(v) => setWatermark(Boolean(v))} />
                  <label htmlFor="wm" className="text-sm mb-1">
                    Watermark on export
                  </label>
                </div>

                <div>
                  <Label className="text-xs">Export scale</Label>
                  <Select value={String(scaleExport)} onValueChange={(v) => setScaleExport(Number(v))}>
                    <SelectTrigger className="w-full cursor-pointer">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem className="cursor-pointer" value="1">1× (screen)</SelectItem>
                      <SelectItem className="cursor-pointer" value="2">2× (high-res)</SelectItem>
                      <SelectItem className="cursor-pointer" value="3">3× (super)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button className="cursor-pointer" onClick={() => capturePng({ withWatermark: true, scale: scaleExport })}>Export PNG</Button>
                  <Button className="cursor-pointer" variant="outline" onClick={() => capturePng({ withWatermark: false, scale: scaleExport })}>
                    Export (no watermark)
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Preview + controls */}
        <section className="lg:col-span-6 space-y-4">
          <Card className="shadow dark:bg-black/80 bg-white/80">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Live Preview 
                <Badge className="ml-2 backdrop-blur-md bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300">{masonryMode ? "masonry" : autoFit ? "auto-fit" : `${columns} col`}</Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
                
                <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => setShowIndices((s) => !s)}>
                  {showIndices ? "Hide indices" : "Show indices"}
                </Button>
                <Button className="cursor-pointer" variant="ghost" size="sm" onClick={() => setFullscreen(true)}>
                  <Maximize2 className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div ref={previewWrapRef} className="rounded-lg border p-4 bg-white/60 dark:bg-black/60" style={{ minHeight: 420, position: "relative" }}>
                {/* Masonry mode uses CSS columns (no deps) */}
                {masonryMode ? (
                  <div
                    className="masonry-container"
                    style={{
                      columnCount: columns,
                      columnGap: `${gap}px`,
                      width: "100%",
                    }}
                  >
                    {items.map((_, i) => (
                      <div key={i} className="masonry-item border" style={masonryItemStyle(i, isDark)}>
                        <div style={{ position: "relative", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 600, color: isDark ? "#fff" : "#111" }}>
                          {showIndices && <div style={{ position: "absolute", top: 8, left: 8, fontSize: 12, opacity: 0.75 }}>{i + 1}</div>}
                          <div>Item {i + 1}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  // Standard CSS Grid preview
                  <div
                    className="w-full h-full rounded overflow-hidden"
                    style={{
                      display: "grid",
                      gridTemplateColumns,
                      gridTemplateRows,
                      gap: `${gap}px`,
                      justifyItems: justify,
                      alignItems: align,
                    }}
                  >
                    {items.map((it, i) => (
                      <div
                        key={i}
                        className="p-3 rounded border bg-gradient-to-br from-white/5 to-black/5 flex items-center justify-center"
                        style={{
                          minHeight: 80,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontWeight: 600,
                          color: isDark ? "#fff" : "#111",
                          position: "relative",
                        }}
                      >
                        {showIndices && <div style={{ position: "absolute", top: 6, left: 8, fontSize: 12, opacity: 0.75 }}>{i + 1}</div>}
                        <div>Item {i + 1}</div>
                      </div>
                    ))}
                  </div>
                )}

                {/* watermark element inside preview wrapper for export
                    Positioned absolutely so it never affects layout.
                    We toggle opacity during export (no layout reflow).
                */}
                <div
                  data-grid-watermark
                  style={{
                    position: "absolute",
                    bottom: 14,
                    right: 14,
                    padding: "6px 8px",
                    borderRadius: 6,
                    background: isDark ? "#fff7" : "#0007",
                    color: isDark ? "#000" : "#fff",
                    opacity: watermark ? 0.95 : 0, // hidden visually when watermark = false
                    pointerEvents: "none",
                    transition: "opacity 120ms ease",
                    zIndex: 1,
                  }}
                >
                  Grid Playground
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow dark:bg-black/80 bg-white/80">
            <CardHeader>
              <CardTitle>Item Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Add item</Label>
                  <div className="flex gap-2 mt-2">
                    <Button className="cursor-pointer" onClick={() => setItemCount((c) => c + 1)}>Add</Button>
                    <Button className="cursor-pointer" variant="outline" onClick={() => setItemCount((c) => Math.max(1, c - 1))}>
                      Remove
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Randomize layout</Label>
                  <div className="mt-2">
                    <Button
                      className="cursor-pointer"
                      variant="outline"
                      onClick={() => {
                        setColumns(1 + Math.floor(Math.random() * 8));
                        setRows(1 + Math.floor(Math.random() * 6));
                        setGap(4 + Math.floor(Math.random() * 16));
                        setItemCount(4 + Math.floor(Math.random() * 20));
                        showToast("success", "Random layout");
                      }}
                    >
                      Shuffle
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* right side: css & tailwind */}
        <aside className="lg:col-span-3 space-y-4">
          <Card className="shadow dark:bg-black/80 bg-white/80">
            <CardHeader>
              <CardTitle>CSS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="rounded border p-3 bg-white/60 dark:bg-zinc-900/60 font-mono text-sm overflow-auto max-h-44 whitespace-pre-wrap">{cssSnippet}</pre>

                <button
                  onClick={handleCopyCss}
                  className="absolute top-2 right-2 p-1.5 cursor-pointer rounded-md bg-zinc-200/70 dark:bg-zinc-800/70 border border-zinc-300 dark:border-zinc-700"
                  aria-label="Copy CSS"
                  type="button"
                >
                  {copiedCss ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>

                <div className="flex gap-2 mt-3">
                  <Button className="cursor-pointer" onClick={handleCopyCss}>
                    <Copy className="w-4 h-4" />Copy
                  </Button>

                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow dark:bg-black/80 bg-white/80">
            <CardHeader>
              <CardTitle>Tailwind</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="rounded border p-3 bg-white/60 dark:bg-zinc-900/60 font-mono text-sm overflow-auto max-h-44 whitespace-pre-wrap">{tailwindSnippet}</pre>

                <button
                  onClick={handleCopyTailwind}
                  className="absolute top-2 cursor-pointer right-2 p-1.5 rounded-md bg-zinc-200/70 dark:bg-zinc-800/70 border border-zinc-300 dark:border-zinc-700"
                  aria-label="Copy Tailwind"
                  type="button"
                >
                  {copiedTailwind ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>

                <div className="flex gap-2 mt-3">
                  <Button onClick={handleCopyTailwind}>
                    <Copy className="w-4 h-4 mr-2" />Copy Tailwind
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow dark:bg-black/80 bg-white">
            <CardHeader>
              <CardTitle>Share</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm mb-2">Share a link to this layout (state encoded in URL)</div>
              <div className="flex gap-2">
                <Button
                className="cursor-pointer"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    showToast("success", "Copied share URL");
                  }}
                >
                  Copy URL
                </Button>
                <Button
                className="cursor-pointer"
                  variant="ghost"
                  onClick={() => {
                    clearUrlState();
                  }}
                >
                  Clear URL
                </Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>

      {/* Fullscreen overlay */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-white/90 border-zinc-900/60  dark:border-zinc-200/50 dark:bg-black/90 flex items-center justify-center p-6">
          <div className="absolute bottom-10 sm:top-6 right-7 flex z-10 gap-2">
            <Button className="cursor-pointer" size="sm" onClick={() => capturePng({ withWatermark: watermark, scale: scaleExport })}>
              <Download className="w-4 h-4" />
            </Button>
            <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => capturePng({ withWatermark: false, scale: scaleExport })}>
              <GlassWater/>
            </Button>
            <Button className="cursor-pointer" size="sm" onClick={() => setFullscreen(false)}>
              <Minimize2 className="w-4 h-4" />Close
            </Button>
          </div>

          <div className="w-full h-full max-w-6xl max-h-full rounded overflow-hidden  border p-6">
            {/* Reuse either masonry or grid in fullscreen */}
            <div
              className="w-full h-full rounded-lg relative"
              style={{
                display: masonryMode ? "block" : "grid",
                gridTemplateColumns: masonryMode ? undefined : gridTemplateColumns,
                gridTemplateRows: masonryMode ? undefined : gridTemplateRows,
                gap: masonryMode ? undefined : `${gap}px`,
                justifyItems: justify,
                alignItems: align,
                background: isDark ? "#0007" : "#fff7",
                padding: 16,
              }}
            >
              {masonryMode ? (
                <div style={{ columnCount: columns, columnGap: `${gap}px`, height: "100%", width: "100%" }}>
                  {items.map((_, i) => (
                    <div key={i} style={masonryItemStyle(i, isDark)} className="mb-3 border">
                      <div style={{ padding: 16, textAlign: "center", fontWeight: 700 }}>{`Item ${i + 1}`}</div>
                    </div>
                  ))}
                </div>
              ) : (
                items.map((_, i) => (
                  <div
                    key={i}
                    className="rounded border p-4 flex items-center justify-center text-xl font-bold"
                    style={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)" }}
                  >
                    Item {i + 1}
                  </div>
                ))
              )}

              <div
                data-grid-watermark
                style={{
                  position: "absolute",
                  bottom: 18,
                  right: 18,
                  background: "rgba(0,0,0,0.4)",
                  color: "#fff",
                  padding: "8px 12px",
                  borderRadius: 8,
                  opacity: watermark ? 0.95 : 0,
                  pointerEvents: "none",
                  transition: "opacity 120ms ease",
                }}
              >
                Grid Playground
              </div>
            </div>
          </div>
        </div>
      )}
      {/* small CSS for masonry items to avoid column breaks (inlined here for convenience) */}
      <style>{`
        .masonry-item {
          break-inside: avoid;
          -webkit-column-break-inside: avoid;
          -moz-column-break-inside: avoid;
        }
      `}</style>
    </div>
  );
}
