// src/pages/DiceBearPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";

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
  Trash2,
  FileText,
  Zap
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTheme } from "@/components/theme-provider";

/*
  DiceBear Avatar Generator Page (fixed SVG rendering)
  - Default style: bottts
  - Default seed: John
  - Endpoint example: https://api.dicebear.com/7.x/bottts/svg?seed=John
*/

const DICEBEAR_BASE = "https://api.dicebear.com/7.x";
const DEFAULT_STYLE = "bottts";
const DEFAULT_SEED = "John";

const STYLES = [
  "bottts",
  "avataaars",
  "adventurer",
  "adventurer-neutral",
  "micah",
  "pixel-art",
  "identicon",
  "initials"
];

function buildEndpoint(style, seed, params = {}) {
  const url = new URL(`${DICEBEAR_BASE}/${style}/svg`);
  url.searchParams.set("seed", seed || "");
  // allow passing additional query params (like radius, background) if needed
  for (const k of Object.keys(params)) {
    if (params[k] != null && params[k] !== "") url.searchParams.set(k, params[k]);
  }
  return url.toString();
}

/* Clean and normalize SVG text so React can render it reliably with innerHTML.
   - remove XML declaration
   - ensure xmlns attribute present
   - ensure width/height exist (use viewBox if present, else fallback)
   - add preserveAspectRatio if missing
*/
function cleanSvgText(raw) {
  if (!raw) return raw;
  try {
    let s = String(raw);
    // remove XML header
    s = s.replace(/<\?xml.*?\?>\s*/i, "").trim();

    // ensure SVG tag exists
    const svgOpenMatch = s.match(/<svg\b([^>]*)>/i);
    if (!svgOpenMatch) return s;

    // ensure xmlns present
    if (!/xmlns=/.test(svgOpenMatch[1])) {
      s = s.replace(/<svg\b/, '<svg xmlns="http://www.w3.org/2000/svg"');
    }

    // extract viewBox
    const vbMatch = s.match(/viewBox="([\d.\s\-]+)"/);
    const hasWidth = /<svg[^>]*\bwidth=/.test(s);
    const hasHeight = /<svg[^>]*\bheight=/.test(s);

    if (vbMatch && (!hasWidth || !hasHeight)) {
      const parts = vbMatch[1].trim().split(/\s+/).map(Number);
      if (parts.length === 4 && parts.every((n) => !Number.isNaN(n))) {
        const [, , w, h] = parts;
        // inject width/height right after <svg
        s = s.replace(/<svg\b/, `<svg width="${Math.round(w)}" height="${Math.round(h)}"`);
      }
    } else if (!hasWidth && !hasHeight) {
      // fallback sizes
      s = s.replace(/<svg\b/, `<svg width="256" height="256"`);
    }

    // ensure preserveAspectRatio is present
    if (!/preserveAspectRatio=/.test(s)) {
      s = s.replace(/<svg\b/, '<svg preserveAspectRatio="xMidYMid meet"');
    }

    return s;
  } catch (e) {
    // if something goes wrong, return original raw string (best-effort)
    console.warn("cleanSvgText failed", e);
    return raw;
  }
}

/* Create a data URL for storing/download */
function svgToDataUrl(svgText) {
  const cleaned = cleanSvgText(svgText) || "";
  const encoded = encodeURIComponent(cleaned)
    .replace(/'/g, "%27")
    .replace(/"/g, "%22");
  return `data:image/svg+xml;charset=utf-8,${encoded}`;
}

/* decode stored data url back to svg markup */
function dataUrlToSvg(dataUrl) {
  try {
    return decodeURIComponent(String(dataUrl).replace(/^data:image\/svg\+xml;charset=utf-8,/, ""));
  } catch (e) {
    console.warn("dataUrlToSvg decode failed", e);
    // fallback: strip prefix and return remainder
    return String(dataUrl).replace(/^data:image\/svg\+xml;charset=utf-8,/, "");
  }
}

export default function DiceBearPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // state
  const [style, setStyle] = useState(DEFAULT_STYLE);
  const [seed, setSeed] = useState(DEFAULT_SEED);
  const [params, setParams] = useState({}); // optional extra params
  const [svgText, setSvgText] = useState(null); // cleaned svg markup (string)
  const [loading, setLoading] = useState(false);
  const [rawVisible, setRawVisible] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const favLoadedRef = useRef(false);

  // persist favorites (data URLs)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("dice-favs") || "[]");
      setFavorites(Array.isArray(saved) ? saved : []);
    } catch {
      setFavorites([]);
    }
    favLoadedRef.current = true;
  }, []);

  useEffect(() => {
    if (!favLoadedRef.current) return;
    localStorage.setItem("dice-favs", JSON.stringify(favorites));
  }, [favorites]);

  // fetch avatar
  async function fetchAvatar(s = seed, st = style, extraParams = params) {
    setLoading(true);
    setSvgText(null);
    try {
      const url = buildEndpoint(st, s, extraParams);
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) {
        toast && toast.error && toast.error(`Avatar fetch failed: ${res.status}`);
        setLoading(false);
        return;
      }
      const text = await res.text();
      const cleaned = cleanSvgText(text);
      setSvgText(cleaned);
      toast && toast.success && toast.success("Avatar generated");
    } catch (err) {
      console.error(err);
      toast && toast.error && toast.error("Failed to fetch avatar");
    } finally {
      setLoading(false);
    }
  }

  // initial load
  useEffect(() => {
    fetchAvatar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // actions
  function copyEndpointToClipboard() {
    const url = buildEndpoint(style, seed, params);
    navigator.clipboard.writeText(url);
    toast && toast.success && toast.success("Endpoint copied");
  }

  function copySVGToClipboard() {
    if (!svgText) return toast && toast("No SVG to copy");
    navigator.clipboard.writeText(svgText);
    toast && toast.success && toast.success("SVG copied to clipboard");
  }

  function saveFavorite() {
    if (!svgText) return toast && toast("Nothing to save");
    const id = `${style}::${seed}::${Date.now()}`;
    const dataUrl = svgToDataUrl(svgText);
    const meta = { id, style, seed, svg: dataUrl, endpoint: buildEndpoint(style, seed, params), createdAt: Date.now() };
    setFavorites(prev => [meta, ...prev].slice(0, 100));
    toast && toast.success && toast.success("Saved to favorites");
  }

  function removeFavorite(id) {
    setFavorites(prev => prev.filter(f => f.id !== id));
    toast && toast.success && toast.success("Removed favorite");
  }

  function chooseFavorite(f) {
    setStyle(f.style);
    setSeed(f.seed);
    // decode stored data-url back to cleaned SVG markup
    setSvgText(dataUrlToSvg(f.svg));
    setRawVisible(true);
  }

  async function downloadSVG() {
    if (!svgText) return toast && toast("No SVG");
    const blob = new Blob([svgText], { type: "image/svg+xml" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `dicebear_${style}_${seed}.svg`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast && toast.success && toast.success("SVG downloaded");
  }

  async function downloadPNG() {
    if (!svgText) return toast && toast("No SVG");
    // convert SVG to PNG via canvas
    try {
      const svgDataUrl = svgToDataUrl(svgText);
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = svgDataUrl;
      await new Promise((res, rej) => {
        img.onload = () => res();
        img.onerror = (e) => rej(e);
      });

      // compute size from svgText (viewBox or width/height), fallback 512
      let width = 512, height = 512;
      try {
        const viewBoxMatch = svgText.match(/viewBox="([\d\s.]+)"/);
        if (viewBoxMatch) {
          const vb = viewBoxMatch[1].split(/\s+/).map(Number);
          if (vb.length === 4) { width = vb[2]; height = vb[3]; }
        } else {
          const wMatch = svgText.match(/<svg[^>]*\bwidth="([\d.]+)"/);
          const hMatch = svgText.match(/<svg[^>]*\bheight="([\d.]+)"/);
          if (wMatch) width = Number(wMatch[1]);
          if (hMatch) height = Number(hMatch[1]);
        }
      } catch (e) { /* ignore */ }

      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(width));
      canvas.height = Math.max(1, Math.round(height));
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const pngData = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = pngData;
      a.download = `dicebear_${style}_${seed}.png`;
      a.click();
      toast && toast.success && toast.success("PNG downloaded");
    } catch (err) {
      console.error(err);
      toast && toast.error && toast.error("PNG conversion failed");
    }
  }

  // small helper to render svg content safely
  function SvgPreview({ svg }) {
    if (!svg) return null;
    // Render cleaned SVG markup. To ensure proper sizing in the preview container,
    // we keep the cleaned width/height injected earlier; additionally, use CSS to
    // make the SVG responsive within the container.
    const wrapped = `
      <div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;">
        ${svg}
        <style>
          /* ensure svg scales nicely inside container */
          svg { max-width:100%; height:auto; display:block; }
        </style>
      </div>
    `;
    return <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: wrapped }} />;
  }

  // UI render
  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>DiceBear — Avatar Studio</h1>
          <p className="mt-1 text-sm opacity-70">Generate, inspect, save and export avatars from DiceBear API (SVG). No API key required.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={(e) => { e.preventDefault(); fetchAvatar(); }} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Palette className="opacity-60" />
            <Select onValueChange={(v) => setStyle(v)} defaultValue={style}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Style" />
              </SelectTrigger>
              <SelectContent>
                {STYLES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>

            <Input
              placeholder="Seed (e.g. 'John' or 'blue-cow')"
              value={seed}
              onChange={(e) => setSeed(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
            />

            <Button type="button" variant="outline" className="px-3" onClick={() => { setSeed(DEFAULT_SEED); setStyle(DEFAULT_STYLE); fetchAvatar(DEFAULT_SEED, DEFAULT_STYLE); }}>
              Reset
            </Button>

            <Button type="submit" variant="outline" className="px-3"><Search /></Button>
          </form>
        </div>
      </header>

      {/* Main layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Center: preview / details */}
        <section className="lg:col-span-9 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center flex-wrap gap-3 justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Avatar Preview</CardTitle>
                <div className="text-xs opacity-60">Style: <span className="font-medium">{style}</span> • Seed: <span className="font-medium">{seed}</span></div>
              </div>

              <div className="flex items-center gap-2">
                <Button className="cursor-pointer" variant="outline" onClick={() => fetchAvatar()}><Loader2 className={loading ? "animate-spin" : ""} /> Generate</Button>
                <Button className="cursor-pointer" variant="ghost" onClick={() => setRawVisible(v => !v)}><List /> {rawVisible ? "Hide Raw" : "Show Raw"}</Button>
                <Button className="cursor-pointer" variant="ghost" onClick={() => setDialogOpen(true)}><ImageIcon /> View Full</Button>
                <Button className="cursor-pointer" variant="outline" onClick={() => saveFavorite()}><Star /> Save</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !svgText ? (
                <div className="py-12 text-center text-sm opacity-60">No avatar yet — hit Generate or change seed/style.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left: preview & actions */}
                  <div className={clsx("p-4 rounded-xl border flex flex-col items-center", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="w-full flex items-center justify-center p-4 rounded-md bg-gradient-to-b from-white/5 to-transparent" style={{ minHeight: 220 }}>
                      <div className="max-w-full max-h-[220px] w-full flex items-center justify-center">
                        <SvgPreview svg={svgText} />
                      </div>
                    </div>

                    <div className="mt-4 w-full space-y-2">
                      <Button className="w-full" variant="outline" onClick={() => copySVGToClipboard()}><Copy /> Copy SVG</Button>
                      <Button className="w-full" variant="outline" onClick={() => downloadSVG()}><Download /> Download SVG</Button>
                      <Button className="w-full" variant="outline" onClick={() => downloadPNG()}><Download /> Download PNG</Button>
                      <Button className="w-full" variant="ghost" onClick={() => copyEndpointToClipboard()}><Copy /> Copy endpoint</Button>
                    </div>
                  </div>

                  {/* Right: info & fields */}
                  <div className={clsx("p-4 rounded-xl border col-span-1 md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-sm font-semibold mb-2">About this avatar</div>
                    <div className="text-sm leading-relaxed mb-3">
                      This avatar is generated by the DiceBear API. The API returns raw SVG markup. You can copy, inspect, download as SVG or convert to PNG. Try different styles and seeds to create unique avatars.
                    </div>

                    <Separator className="my-3" />

                    <div className="text-sm font-semibold mb-2">Metadata</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Style</div>
                        <div className="text-sm font-medium">{style}</div>
                      </div>
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Seed</div>
                        <div className="text-sm font-medium break-words">{seed}</div>
                      </div>
                      <div className="p-2 rounded-md border col-span-2">
                        <div className="text-xs opacity-60">Endpoint</div>
                        <div className="text-sm font-medium break-words">{buildEndpoint(style, seed, params)}</div>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="text-sm font-semibold mb-2">Editor / tweaks</div>
                    <div className="text-xs opacity-60 mb-2">Add optional DiceBear query params (e.g., background, radius). Each param will be appended to the endpoint.</div>

                    <div className="grid grid-cols-2 gap-2">
                      <Input placeholder="background (e.g., #ffffff)" value={params.background || ""} onChange={(e) => setParams(p => ({ ...p, background: e.target.value || undefined }))} />
                      <Input placeholder="radius (0-50)" value={params.radius || ""} onChange={(e) => setParams(p => ({ ...p, radius: e.target.value || undefined }))} />
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" onClick={() => fetchAvatar(seed, style, params)}><Zap /> Apply</Button>
                      <Button variant="ghost" onClick={() => { setParams({}); toast && toast.success && toast.success("Params cleared"); }}>Clear</Button>
                    </div>
                  </div>
                </div>
              )}

              <AnimatePresence>
                {rawVisible && svgText && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("p-4 mt-3 border-t", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                    <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 300, whiteSpace: "pre-wrap" }}>
                      {svgText}
                    </pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </section>

        {/* Right: favorites / developer */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Favorites</div>
                <div className="text-xs opacity-60">Saved avatars (client-side)</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => { setFavorites([]); toast && toast.success && toast.success("Cleared favorites"); }}><Trash2 /></Button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {favorites.length === 0 && <div className="col-span-2 text-xs opacity-60">No favorites saved yet. Click Save to store an avatar.</div>}
              {favorites.map(f => (
                <div key={f.id} className="p-2 rounded-md border flex flex-col items-center gap-2">
                  <div
                    className="w-full aspect-square rounded-md overflow-hidden bg-white/10"
                    onClick={() => chooseFavorite(f)}
                    style={{ cursor: "pointer" }}
                    dangerouslySetInnerHTML={{ __html: dataUrlToSvg(f.svg) }}
                  />
                  <div className="text-xs font-medium truncate w-full text-center">{f.seed}</div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => chooseFavorite(f)}><ExternalLink /></Button>
                    <Button size="sm" variant="ghost" onClick={() => removeFavorite(f.id)}><Trash2 /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Developer</div>
            <div className="text-xs opacity-60">Endpoint examples & quick tools</div>
            <div className="mt-2 space-y-2 grid grid-cols-1 gap-2">
              <Button className="cursor-pointer" variant="outline" onClick={() => { navigator.clipboard.writeText(buildEndpoint(style, seed, params)); toast && toast.success && toast.success("Endpoint copied"); }}><Copy /> Copy Endpoint</Button>

              <Button className="cursor-pointer" variant="outline" onClick={() => { const template = `fetch("${buildEndpoint(style, seed, params)}").then(res => res.text()).then(svg => console.log(svg));`; navigator.clipboard.writeText(template); toast && toast.success && toast.success("Example code copied"); }}><FileText /> Copy fetch example</Button>

              <Button className="cursor-pointer" variant="outline" onClick={() => { setDialogOpen(true); }}><ImageIcon /> Open full preview</Button>
            </div>
          </div>
        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>Avatar Preview — {style} • {seed}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
            {svgText ? (
              <div style={{ maxHeight: "100%", maxWidth: "100%" }} dangerouslySetInnerHTML={{ __html: svgText }} />
            ) : (
              <div className="h-full flex items-center justify-center">No avatar</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Rendered SVG</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
              <Button variant="outline" onClick={() => { if (svgText) downloadSVG(); }}><Download /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
