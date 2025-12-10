// src/pages/BorderRadiusPlayground.jsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Toaster } from "sonner";
import { Copy, Check, Download, Shuffle, RotateCcw, Maximize2, Minimize2, Image as ImageIcon, GlassWater } from "lucide-react";
import { toPng } from "html-to-image";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { showToast } from "../lib/ToastHelper";
import { useTheme } from "../components/theme-provider";

// small helper to encode state into url
const serialize = (o) => encodeURIComponent(JSON.stringify(o));
const deserialize = (s) => {
  try {
    return JSON.parse(decodeURIComponent(s));
  } catch {
    return null;
  }
};

const DEFAULT = {
  unit: "px", // or '%'
  tl: 24,
  tr: 24,
  br: 24,
  bl: 24,
  // elliptical (X / Y pairs)
  adv: false,
  tlY: 24,
  trY: 24,
  brY: 24,
  blY: 24,
  width: 320,
  height: 200,
  bg: "#06b6d4",
  borderColor: "#0f172a",
  borderWidth: 2,
  shadow: true,
  watermark: true,
  scaleExport: 2,
};

export default function BorderRadiusPlayground() {
  const { theme } = useTheme?.() ?? { theme: "light" };
  const isDark = theme === "dark" || (theme === "system" && typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // router
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // read initial state from URL (gstate param)
  const initial = (() => {
    try {
      const s = searchParams.get("gstate");
      if (!s) return null;
      return deserialize(s);
    } catch {
      return null;
    }
  })();

  // state
  const [unit, setUnit] = useState(initial?.unit ?? DEFAULT.unit);
  const [tl, setTl] = useState(initial?.tl ?? DEFAULT.tl);
  const [tr, setTr] = useState(initial?.tr ?? DEFAULT.tr);
  const [br, setBr] = useState(initial?.br ?? DEFAULT.br);
  const [bl, setBl] = useState(initial?.bl ?? DEFAULT.bl);

  const [adv, setAdv] = useState(initial?.adv ?? DEFAULT.adv);
  const [tlY, setTlY] = useState(initial?.tlY ?? DEFAULT.tlY);
  const [trY, setTrY] = useState(initial?.trY ?? DEFAULT.trY);
  const [brY, setBrY] = useState(initial?.brY ?? DEFAULT.brY);
  const [blY, setBlY] = useState(initial?.blY ?? DEFAULT.blY);

  const [width, setWidth] = useState(initial?.width ?? DEFAULT.width);
  const [height, setHeight] = useState(initial?.height ?? DEFAULT.height);
  const [bg, setBg] = useState(initial?.bg ?? DEFAULT.bg);
  const [borderColor, setBorderColor] = useState(initial?.borderColor ?? DEFAULT.borderColor);
  const [borderWidth, setBorderWidth] = useState(initial?.borderWidth ?? DEFAULT.borderWidth);
  const [shadow, setShadow] = useState(initial?.shadow ?? DEFAULT.shadow);
  const [watermark, setWatermark] = useState(initial?.watermark ?? DEFAULT.watermark);
  const [scaleExport, setScaleExport] = useState(initial?.scaleExport ?? DEFAULT.scaleExport);

  // UI
  const [copiedCss, setCopiedCss] = useState(false);
  const [copiedTailwind, setCopiedTailwind] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const wrapperRef = useRef(null);

  // Compose border-radius CSS
  // If adv=false, use shorthand "tl tr br bl" single values (or percent)
  // If adv=true, use elliptical form "tlX tlY / tlY trY ..." (we'll build per spec)
  const cssBorderRadius = useMemo(() => {
    if (!adv) {
      return `${tl}${unit} ${tr}${unit} ${br}${unit} ${bl}${unit}`;
    }
    // elliptical: format "tlX tlY trX trY / tlY trY brY blY" is tricky,
    // correct order: "tlX trX brX blX / tlY trY brY blY"
    return `${tl}${unit} ${tr}${unit} ${br}${unit} ${bl}${unit} / ${tlY}${unit} ${trY}${unit} ${brY}${unit} ${blY}${unit}`;
  }, [adv, tl, tr, br, bl, tlY, trY, brY, blY, unit]);

  // CSS snippet & Tailwind suggestion
  const cssSnippet = useMemo(() => {
    return `/* Border radius */\n.box {\n  width: ${width}px;\n  height: ${height}px;\n  background: ${bg};\n  border: ${borderWidth}px solid ${borderColor};\n  border-radius: ${cssBorderRadius};\n  ${shadow ? "box-shadow: 0 8px 24px rgba(2,6,23,0.3);" : ""}\n}`;
  }, [width, height, bg, borderWidth, borderColor, cssBorderRadius, shadow]);

  const tailwindSnippet = useMemo(() => {
    // Tailwind arbitrary: use style attr or class like `rounded-[<value>]`
    // If values include spaces we need bracketed literal; use bg and border
    const rad = cssBorderRadius.replace(/\s+/g, " ");
    return `className="w-[${width}px] h-[${height}px] bg-[${bg}] border-[${borderWidth}px] border-[${borderColor}] rounded-[${rad}]"`;
  }, [width, height, bg, borderWidth, borderColor, cssBorderRadius]);

  // push url state
  const pushUrl = useCallback(() => {
    try {
      const state = { unit, tl, tr, br, bl, adv, tlY, trY, brY, blY, width, height, bg, borderColor, borderWidth, shadow, watermark, scaleExport };
      setSearchParams({ gstate: serialize(state) }, { replace: true });
    } catch {
      // ignore
    }
  }, [setSearchParams, unit, tl, tr, br, bl, adv, tlY, trY, brY, blY, width, height, bg, borderColor, borderWidth, shadow, watermark, scaleExport]);

  useEffect(() => {
    pushUrl();
  }, [pushUrl]);

  // handle copy css / tailwind
  const copyCss = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cssSnippet);
      setCopiedCss(true);
      showToast("success", "Copied CSS");
      setTimeout(() => setCopiedCss(false), 1400);
    } catch {
      showToast("error", "Copy failed");
    }
  }, [cssSnippet]);

  const copyTailwind = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(tailwindSnippet);
      setCopiedTailwind(true);
      showToast("success", "Copied Tailwind");
      setTimeout(() => setCopiedTailwind(false), 1400);
    } catch {
      showToast("error", "Copy failed");
    }
  }, [tailwindSnippet]);

  // export PNG with watermark handling similar to Grid page
  const exportPng = useCallback(
    async ({ withWatermark = true, scale = 2, fileName = "border-radius.png" } = {}) => {
      try {
        if (!wrapperRef.current) return showToast("error", "Preview not available");
        const nodes = wrapperRef.current.querySelectorAll("[data-br-watermark]");
        const saved = [];
        nodes.forEach((n) => {
          saved.push({ node: n, style: n.getAttribute("style") || "" });
          n.style.transition = "opacity 120ms ease";
          n.style.opacity = withWatermark ? "0.95" : "0";
          n.style.zIndex = 9999;
          n.style.pointerEvents = "none";
        });

        await new Promise((r) => requestAnimationFrame(r));
        const dataUrl = await toPng(wrapperRef.current, { cacheBust: true, pixelRatio: Math.max(1, scale) });

        // restore
        saved.forEach(({ node, style }) => node.setAttribute("style", style));

        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showToast("success", "PNG downloaded");
      } catch (err) {
        console.error(err);
        showToast("error", "PNG export failed");
      }
    },
    []
  );

  // presets & random
  const PRESETS = [
    { name: "Soft", values: { tl: 24, tr: 24, br: 24, bl: 24, adv: false } },
    { name: "Pill", values: { tl: 999, tr: 999, br: 999, bl: 999, adv: false } },
    { name: "Ticket", values: { tl: 8, tr: 24, br: 8, bl: 24, adv: false } },
    { name: "Blob", values: { tl: 50, tr: 20, br: 60, bl: 30, adv: true, tlY: 40, trY: 60, brY: 30, blY: 70 } },
    { name: "Cut Corners", values: { tl: 0, tr: 0, br: 0, bl: 0, adv: false } },
  ];

  const applyPreset = (p) => {
    const v = p.values;
    setAdv(Boolean(v.adv));
    if (v.tl !== undefined) setTl(v.tl);
    if (v.tr !== undefined) setTr(v.tr);
    if (v.br !== undefined) setBr(v.br);
    if (v.bl !== undefined) setBl(v.bl);
    if (v.tlY !== undefined) setTlY(v.tlY);
    if (v.trY !== undefined) setTrY(v.trY);
    if (v.brY !== undefined) setBrY(v.brY);
    if (v.blY !== undefined) setBlY(v.blY);
    showToast("success", `Preset ${p.name} applied`);
  };

  const randomize = () => {
    const rnd = (max) => Math.round(Math.random() * max);
    setAdv(Math.random() > 0.6);
    setTl(rnd(100));
    setTr(rnd(100));
    setBr(rnd(100));
    setBl(rnd(100));
    setTlY(rnd(100));
    setTrY(rnd(100));
    setBrY(rnd(100));
    setBlY(rnd(100));
    showToast("success", "Randomized");
  };

  // helper to format CSS border-radius property string used in inline style
  const styleBorderRadius = useMemo(() => {
    return adv
      ? `${tl}${unit} ${tr}${unit} ${br}${unit} ${bl}${unit} / ${tlY}${unit} ${trY}${unit} ${brY}${unit} ${blY}${unit}`
      : `${tl}${unit} ${tr}${unit} ${br}${unit} ${bl}${unit}`;
  }, [adv, tl, tr, br, bl, tlY, trY, brY, blY, unit]);

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        exportPng({ withWatermark: false, scale: scaleExport });
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "d") {
        e.preventDefault();
        copyCss();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [exportPng, scaleExport, copyCss]);

  return (
    <div className="min-h-screen max-w-8xl overflow-hidden mx-auto py-8 px-4 md:px-8">
      <Toaster richColors />
      <header className="mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">Fancy Border Radius Generator</h1>
          <p className="text-sm text-muted-foreground mt-1">Create fancy border-radius shapes, export CSS, Tailwind classes or PNG previews.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button className="cursor-pointer" variant="secondary" onClick={() => {
            // reset
            setUnit(DEFAULT.unit);
            setTl(DEFAULT.tl);
            setTr(DEFAULT.tr);
            setBr(DEFAULT.br);
            setBl(DEFAULT.bl);
            setAdv(DEFAULT.adv);
            setTlY(DEFAULT.tlY);
            setTrY(DEFAULT.trY);
            setBrY(DEFAULT.brY);
            setBlY(DEFAULT.blY);
            setWidth(DEFAULT.width);
            setHeight(DEFAULT.height);
            setBg(DEFAULT.bg);
            setBorderColor(DEFAULT.borderColor);
            setBorderWidth(DEFAULT.borderWidth);
            setShadow(DEFAULT.shadow);
            setWatermark(DEFAULT.watermark);
            setScaleExport(DEFAULT.scaleExport);
            showToast("success", "Defaults restored");
          }}>
            <RotateCcw className="w-4 h-4" />Defaults
          </Button>

          <div className="flex items-center gap-2">
            <Button className="cursor-pointer" onClick={() => setFullscreen(true)}><Maximize2 className="w-4 h-4 " />Preview</Button>
            <Button className="cursor-pointer" variant="outline" onClick={() => exportPng({ withWatermark: watermark, scale: scaleExport })}><ImageIcon className="w-4 h-4" />Export PNG</Button>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls */}
        <aside className="lg:col-span-3">
          <Card className="shadow dark:bg-black/80 bg-white/80">
            <CardHeader><CardTitle>Radius Controls</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Unit</Label>
                  <Select value={unit} onValueChange={(v) => setUnit(v)}>
                    <SelectTrigger className="w-full cursor-pointer"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem className="cursor-pointer" value="px">px</SelectItem>
                      <SelectItem className="cursor-pointer" value="%">%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs">Top-left</Label>
                  <div className="flex items-center gap-3">
                    <Slider value={[tl]} onValueChange={(v) => setTl(v[0])} min={0} max={500} className="flex-1 cursor-pointer" />
                    <div className="w-14 text-right text-sm">{tl}{unit}</div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Top-right</Label>
                  <div className="flex items-center gap-3">
                    <Slider value={[tr]} onValueChange={(v) => setTr(v[0])} min={0} max={500} className="flex-1 cursor-pointer" />
                    <div className="w-14 text-right text-sm">{tr}{unit}</div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Bottom-right</Label>
                  <div className="flex items-center gap-3">
                    <Slider value={[br]} onValueChange={(v) => setBr(v[0])} min={0} max={500} className="flex-1 cursor-pointer" />
                    <div className="w-14 text-right text-sm">{br}{unit}</div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Bottom-left</Label>
                  <div className="flex items-center gap-3">
                    <Slider value={[bl]} onValueChange={(v) => setBl(v[0])} min={0} max={500} className="flex-1 cursor-pointer" />
                    <div className="w-14 text-right text-sm">{bl}{unit}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Checkbox className="cursor-pointer" id="adv" checked={adv} onCheckedChange={(v) => setAdv(Boolean(v))} />
                  <label htmlFor="adv" className="text-sm">Advanced (elliptical X/Y radii)</label>
                </div>

                {adv && (
                  <>
                    <Separator />
                    <div>
                      <Label className="text-xs">Top-left Y</Label>
                      <div className="flex items-center gap-3">
                        <Slider value={[tlY]} onValueChange={(v) => setTlY(v[0])} min={0} max={500} className="flex-1 cursor-pointer" />
                        <div className="w-14 text-right text-sm">{tlY}{unit}</div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Top-right Y</Label>
                      <div className="flex items-center gap-3">
                        <Slider value={[trY]} onValueChange={(v) => setTrY(v[0])} min={0} max={500} className="flex-1 cursor-pointer" />
                        <div className="w-14 text-right text-sm">{trY}{unit}</div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Bottom-right Y</Label>
                      <div className="flex items-center gap-3">
                        <Slider value={[brY]} onValueChange={(v) => setBrY(v[0])} min={0} max={500} className="flex-1 cursor-pointer" />
                        <div className="w-14 text-right text-sm">{brY}{unit}</div>
                      </div>
                    </div>

                    <div>
                      <Label className="text-xs">Bottom-left Y</Label>
                      <div className="flex items-center gap-3">
                        <Slider value={[blY]} onValueChange={(v) => setBlY(v[0])} min={0} max={500} className="flex-1 cursor-pointer" />
                        <div className="w-14 text-right text-sm">{blY}{unit}</div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="shadow mt-4 dark:bg-black/80 bg-white/80">
            <CardHeader><CardTitle>Appearance</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Width</Label>
                  <div className="flex items-center gap-3">
                    <Slider value={[width]} onValueChange={(v) => setWidth(v[0])} min={40} max={1200} className="flex-1 cursor-pointer" />
                    <div className="w-14 text-right text-sm">{width}px</div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Height</Label>
                  <div className="flex items-center gap-3">
                    <Slider value={[height]} onValueChange={(v) => setHeight(v[0])} min={40} max={1200} className="flex-1 cursor-pointer" />
                    <div className="w-14 text-right text-sm">{height}px</div>
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Background</Label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={bg} onChange={(e) => setBg(e.target.value)} className="w-12 h-8 p-0 border rounded" />
                    <Input value={bg} onChange={(e) => setBg(e.target.value)} />
                  </div>
                </div>

                        <div className="space-y-2">
            <Label className="text-xs">Border color & width</Label>

            <div className="
                flex   items-center gap-3 
                flex-wrap sm:gap-4
            ">
                {/* Color Picker */}
                <input
                type="color"
                value={borderColor}
                onChange={(e) => setBorderColor(e.target.value)}
                className="w-12 h-10 p-0 border rounded cursor-pointer"
                />

                {/* Hex Input */}
                <Input
                value={borderColor}
                onChange={(e) => setBorderColor(e.target.value)}
                className="flex-1 min-w-[150px]"
                />

                {/* Slider + Value */}
                <div className="flex items-center gap-2 sm:ml-2 w-full sm:w-auto">
                <Slider
                    value={[borderWidth]}
                    onValueChange={(v) => setBorderWidth(v[0])}
                    min={0}
                    max={16}
                    className="flex-1 sm:w-28 cursor-pointer"
                />
                <div className="w-12 text-right text-sm whitespace-nowrap">
                    {borderWidth}px
                </div>
                </div>
            </div>
            </div>


                <div className="flex items-center gap-3">
                  <Checkbox className="cursor-pointer" id="shadow" checked={shadow} onCheckedChange={(v) => setShadow(Boolean(v))} />
                  <label htmlFor="shadow" className="text-sm">Box shadow</label>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow mt-4 dark:bg-black/80 bg-white/80">
            <CardHeader><CardTitle>Actions</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                <Button className="cursor-pointer" variant="outline" onClick={randomize}><Shuffle className="w-4 h-4 " />Random</Button>
                <Button  onClick={() => {
                  setTl(999); setTr(999); setBr(999); setBl(999); setAdv(false);
                  showToast("success", "Pill applied");
                }} variant="outline">Pill</Button>
                <Button className="cursor-pointer" variant="outline" onClick={() => applyPreset(PRESETS[0])}>Soft</Button>
                <Button className="cursor-pointer" variant="destructive" onClick={() => {
                  setTl(0); setTr(0); setBr(0); setBl(0); setAdv(false);
                  showToast("success", "Sharp corners");
                }}>Sharp</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow mt-4 dark:bg-black/80 bg-white/80">
            <CardHeader><CardTitle>Export</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox className="cursor-pointer" id="wm" checked={watermark} onCheckedChange={(v) => setWatermark(Boolean(v))} />
                  <label htmlFor="wm" className="text-sm">Watermark on export</label>
                </div>

                <div>
                  <Label className="text-xs mb-1">Export scale</Label>
                  <Select value={String(scaleExport)} onValueChange={(v) => setScaleExport(Number(v))}>
                    <SelectTrigger className="w-full cursor-pointer"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem className="cursor-pointer" value="1">1×</SelectItem>
                      <SelectItem className="cursor-pointer" value="2">2×</SelectItem>
                      <SelectItem className="cursor-pointer" value="3">3×</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button className="cursor-pointer" onClick={() => exportPng({ withWatermark: watermark, scale: scaleExport })}><ImageIcon className="w-4 h-4 mr-2" />Export PNG</Button>
                  <Button className="cursor-pointer" variant="outline" onClick={() => exportPng({ withWatermark: false, scale: scaleExport })}>PNG (no watermark)</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Preview & code */}
        <section className="lg:col-span-9 space-y-4">
          <Card className="shadow dark:bg-black/80 bg-white/80">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>Live Preview
                 <Badge className="ml-2 backdrop-blur-md bg-orange-500/10 border border-orange-500/20 text-orange-700 dark:text-orange-300">{adv ? "elliptical" : "uniform"}</Badge>
              </CardTitle>
              <div className="flex items-center gap-2">
               
                <Button className="cursor-pointer" variant="ghost" size="sm" onClick={() => setFullscreen(true)}><Maximize2 className="w-4 h-4" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              <div ref={wrapperRef} className="rounded-lg border p-6 bg-white/60 dark:bg-black/60 flex items-center justify-center relative" style={{ minHeight: 360 }}>
                <div
                  style={{
                    width: width,
                    height: height,
                    background: bg,
                    border: `${borderWidth}px solid ${borderColor}`,
                    borderRadius: styleBorderRadius,
                    boxShadow: shadow ? "0 12px 32px rgba(2,6,23,0.25)" : "none",
                    transition: "border-radius 160ms ease, background 120ms ease",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: isDark ? "#0b1220" : "#fff",
                    fontWeight: 700,
                    pointerEvents: "none"
                  }}
                >
                  <div style={{ textAlign: "center", pointerEvents: "none" }}>
                    <div style={{ fontSize: 18 }}>{`border-radius: ${cssBorderRadius}`}</div>
                    <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>{`${width}px × ${height}px`}</div>
                  </div>
                </div>

                {/* watermark (absolute, doesn't influence layout) */}
                <div data-br-watermark style={{
                  position: "absolute",
                  bottom: 18,
                  right: 18,
                  padding: "6px 8px",
                  background: isDark ? "#fff4" : "#0004",
                  color: isDark ? "#000" : "#fff",
                  borderRadius: 6,
                  opacity: watermark ? 0.95 : 0,
                  pointerEvents: "none",
                  transition: "opacity 120ms ease",
                }}>
                  Revolyx
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow dark:bg-black/80 bg-white/80">
            <CardHeader><CardTitle>CSS</CardTitle></CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="rounded border p-3 bg-white/60 dark:bg-zinc-900/60 font-mono text-sm overflow-auto max-h-44 whitespace-pre-wrap">{cssSnippet}</pre>
                <button
                  onClick={copyCss}
                  className="absolute top-2 right-2 cursor-pointer p-1.5 rounded-md bg-zinc-200/70 dark:bg-zinc-800/70 border border-zinc-300 dark:border-zinc-700"
                  aria-label="Copy CSS"
                >
                  {copiedCss ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>

              </div>
            </CardContent>
          </Card>
             <Card className="shadow dark:bg-black/80 bg-white/80">
            <CardHeader><CardTitle>Tailwind</CardTitle></CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="rounded border  p-3 bg-white/60 dark:bg-zinc-900/60 font-mono text-sm overflow-auto max-h-44 whitespace-pre-wrap">{tailwindSnippet}</pre>
                <button
                  onClick={copyTailwind}
                  className="absolute top-2 right-2 cursor-pointer p-1.5 rounded-md bg-zinc-200/70 dark:bg-zinc-800/70 border border-zinc-300 dark:border-zinc-700"
                  aria-label="Copy Tailwind"
                >
                  {copiedTailwind ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                </button>

              </div>
            </CardContent>
          </Card>

            <Card className="shadow dark:bg-black/80 bg-white/80">
            <CardHeader><CardTitle>Share</CardTitle></CardHeader>
            <CardContent>
              <div className="text-sm mb-2">Share a link to this design (state saved in URL)</div>
              <div className="flex gap-2">
                <Button className="cursor-pointer" onClick={() => { navigator.clipboard.writeText(window.location.href); showToast("success", "Copied share URL"); }}>Copy URL</Button>
                <Button className="cursor-pointer" variant="ghost" onClick={() => { setSearchParams({}, { replace: true }); navigate(window.location.pathname, { replace: true }); showToast("success", "Cleared URL"); }}>Clear URL</Button>
              </div>
            </CardContent>
          </Card>
        </section>


      </main>

      {/* Fullscreen */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6">
          <div className="absolute bottom-6  sm:top-6 right-6 flex gap-2">
            <Button className="cursor-pointer" size="sm" onClick={() => exportPng({ withWatermark: watermark, scale: scaleExport })}><Download className="w-4 h-4 " /></Button>
            <Button className="cursor-pointer" size="sm" variant="outline" onClick={() => exportPng({ withWatermark: false, scale: scaleExport })}><GlassWater/></Button>
            <Button className="cursor-pointer" size="sm" onClick={() => setFullscreen(false)}><Minimize2 className="w-4 h-4" />Close</Button>
          </div>

          <div className="w-full h-full max-w-4xl max-h-full rounded overflow-hidden p-6 flex items-center justify-center">
            <div style={{
              width,
              height,
              background: bg,
              border: `${borderWidth}px solid ${borderColor}`,
              borderRadius: styleBorderRadius,
              boxShadow: shadow ? "0 16px 48px rgba(2,6,23,0.35)" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: isDark ? "#0b1220" : "#fff",
              fontWeight: 800,
            }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22 }}>{`border-radius: ${cssBorderRadius}`}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
