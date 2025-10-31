// BackgroundDesignPage.jsx
"use client";

import React, { useMemo, useState, useRef } from "react";
import clsx from "clsx";
import { Toaster, toast } from "sonner";
import {
  Search,
  Grid as GridIcon,
  Palette,
  Plus,
  Trash,
  ChevronDown,
  Filter,
  List,
  Copy,
  Heart,
  Menu,
  X,
  Zap,
  Layers
} from "lucide-react";

// Adjust these imports to your project structure for shadcn components
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { Label } from "@/components/ui/label";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Colour themes you provided
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

// At least 30 designs (gradients, radial, conic, dotted, grid, mesh, noise, patterns, etc.)
const DESIGNS = [
  { id: "d-01", name: "Linear Sunrise", category: "Gradient", css: "linear-gradient(135deg,#ff9a9e 0%,#fad0c4 100%)", tags: ["linear","warm"] },
  { id: "d-02", name: "Ocean Blue", category: "Gradient", css: "linear-gradient(90deg,#2BC0E4 0%,#EAECC6 100%)", tags: ["linear","cool"] },
  { id: "d-03", name: "Purple Rain", category: "Gradient", css: "linear-gradient(120deg,#8E2DE2 0%,#4A00E0 100%)", tags: ["purple"] },
  { id: "d-04", name: "Radial Glow", category: "Radial", css: "radial-gradient(circle at 10% 20%, #ffdde1 0%, #ee9ca7 40%, transparent 70%)", tags: ["radial"] },
  { id: "d-05", name: "Conic Prism", category: "Conic", css: "conic-gradient(from 90deg at 50% 50%, #f43f5e, #fb7185, #f472b6, #f43f5e)", tags: ["conic"] },
  { id: "d-06", name: "Duotone Green", category: "Gradient", css: "linear-gradient(45deg,#16a34a 0%,#86efac 100%)", tags: ["duotone"] },
  { id: "d-07", name: "Small Dots", category: "Dotted", css: "radial-gradient(#00000014 1px, transparent 1px), linear-gradient(#e6e6e6, #e6e6e6); background-size: 16px 16px, 100% 100%;", tags: ["dots"] },
  { id: "d-08", name: "Polka Pastel", category: "Dotted", css: "radial-gradient(circle,#ffffff 7%, transparent 8%) 0 0/38px 38px, linear-gradient(90deg,#fbc2eb,#a6c1ee)", tags: ["dots","pastel"] },
  { id: "d-09", name: "Halftone Pop", category: "Dotted", css: "radial-gradient(circle at 10% 10%, rgba(0,0,0,0.12) 1px, transparent 2px), linear-gradient(120deg,#f6d365,#fda085)", tags: ["halftone"] },
  { id: "d-10", name: "Soft Mesh", category: "Mesh", css: "radial-gradient(ellipse at 10% 10%, rgba(255,255,255,0.2), transparent 30%), linear-gradient(90deg,#667eea,#764ba2)", tags: ["mesh"] },
  { id: "d-11", name: "Thin Grid", category: "Grid", css: "linear-gradient(#00000008 1px, transparent 1px), linear-gradient(90deg,#00000008 1px, transparent 1px), linear-gradient(180deg,#f8fafc,#f8fafc)", tags: ["grid"] },
  { id: "d-12", name: "Bold Grid", category: "Grid", css: "linear-gradient(#00000014 2px, transparent 2px), linear-gradient(90deg,#00000014 2px, transparent 2px), linear-gradient(180deg,#fff,#fff)", tags: ["grid"] },
  { id: "d-13", name: "Diagonal Stripes", category: "Pattern", css: "repeating-linear-gradient(135deg,#ffffff 0 10px, #e6e6e6 10px 20px)", tags: ["stripes"] },
  { id: "d-14", name: "Soft Bands", category: "Pattern", css: "linear-gradient(90deg,#fdfbfb 0%,#ebedee 100%)", tags: ["bands"] },
  { id: "d-15", name: "Glass Frost", category: "Frost", css: "linear-gradient(180deg, rgba(255,255,255,0.6), rgba(255,255,255,0.2)), linear-gradient(90deg,#9be15d,#00e3ae)", tags: ["glass"] },
  { id: "d-16", name: "Hex Mesh", category: "Pattern", css: "linear-gradient(120deg,#f0f2f6,#e6edf3), repeating-linear-gradient(60deg, rgba(0,0,0,0.03) 0 1px, transparent 1px 20px)", tags: ["hex"] },
  { id: "d-17", name: "Paper Noise", category: "Texture", css: "linear-gradient(135deg,#f6f6f6,#ffffff), repeating-radial-gradient(#00000006 0 1px, transparent 1px 10px)", tags: ["noise"] },
  { id: "d-18", name: "Angled Blues", category: "Gradient", css: "linear-gradient(135deg,#0ea5e9 0%,#3b82f6 50%,#6366f1 100%)", tags: ["angled"] },
  { id: "d-19", name: "Sunset Blend", category: "Gradient", css: "linear-gradient(120deg,#f97316 0%,#fb7185 50%,#a78bfa 100%)", tags: ["sunset"] },
  { id: "d-20", name: "Metallic Sheen", category: "Gradient", css: "linear-gradient(90deg,#b8c6db 0%,#f5f7fa 50%,#b8c6db 100%)", tags: ["metallic"] },
  { id: "d-21", name: "Vaporwave", category: "Gradient", css: "linear-gradient(45deg,#f3c4fb 0%,#fecfef 50%,#a5f3fc 100%)", tags: ["retro"] },
  { id: "d-22", name: "Midnight", category: "Gradient", css: "linear-gradient(180deg,#0f172a,#020617)", tags: ["dark"] },
  { id: "d-23", name: "Checkerboard", category: "Pattern", css: "linear-gradient(45deg, #fff 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #fff 75%), linear-gradient(180deg,#e5e7eb,#e5e7eb); background-size: 20px 20px;", tags: ["checker"] },
  { id: "d-24", name: "Sparkle Gradient", category: "Gradient", css: "linear-gradient(90deg,#f8fafc 0%,#e6eef8 30%,#cfe8ff 100%)", tags: ["sparkle"] },
  { id: "d-25", name: "Aurora Flow", category: "Gradient", css: "linear-gradient(120deg,#34d399 0%,#60a5fa 40%,#a78bfa 100%)", tags: ["aurora"] },
  { id: "d-26", name: "Thermal Map", category: "Gradient", css: "linear-gradient(90deg,#ff4d4d 0%,#ffd166 40%,#06d6a0 100%)", tags: ["thermal"] },
  { id: "d-27", name: "Ink Bloom", category: "Radial", css: "radial-gradient(circle at 30% 40%, #6EE7B7, rgba(0,0,0,0) 40%), radial-gradient(circle at 70% 60%, #60A5FA, rgba(0,0,0,0) 40%), linear-gradient(180deg,#ffffff,#f8fafc)", tags: ["ink"] },
  { id: "d-28", name: "Isometric Lines", category: "Pattern", css: "repeating-linear-gradient(0deg,#00000008 0 1px, transparent 1px 22px), repeating-linear-gradient(60deg,#00000006 0 1px, transparent 1px 22px)", tags: ["isometric"] },
  { id: "d-29", name: "Soft Waves", category: "Pattern", css: "radial-gradient(circle at 50% 50%, rgba(0,0,0,0.03), transparent 40%), linear-gradient(90deg,#fef3c7,#fee2e2)", tags: ["waves"] },
  { id: "d-30", name: "Candy Stripe", category: "Gradient", css: "linear-gradient(135deg,#ff9a9e 0%,#fecfef 25%,#fdb99b 50%,#ffe29f 75%,#fce7f3 100%)", tags: ["colorful"] },
  { id: "d-31", name: "Sunburst", category: "Radial", css: "radial-gradient(circle at 50% 50%, #ffd27d 0%, rgba(255,210,125,0) 50%), linear-gradient(180deg,#fff7e6,#fff)", tags: ["sunburst"] },
  { id: "d-32", name: "Paper Fibers", category: "Texture", css: "linear-gradient(180deg,#fafafa,#fff), repeating-linear-gradient(0deg,#00000002 0 1px, transparent 1px 10px)", tags: ["paper"] },
];

// List of lucide icons (a small selection) to show in left sheet
const AVAILABLE_ICONS = [
  { id: "search", label: "Search", icon: Search },
  { id: "grid", label: "Grid", icon: GridIcon },
  { id: "palette", label: "Palette", icon: Palette },
  { id: "layers", label: "Layers", icon: Layers },
  { id: "zap", label: "Zap", icon: Zap },
  { id: "list", label: "List", icon: List },
];

// Helper: group designs alphabetically
function groupByLetter(list) {
  const groups = {};
  list.forEach((d) => {
    const letter = (d.name && d.name[0]) ? d.name[0].toUpperCase() : "#";
    if (!groups[letter]) groups[letter] = [];
    groups[letter].push(d);
  });
  // sort letters
  return Object.fromEntries(Object.entries(groups).sort(([a], [b]) => a.localeCompare(b)));
}

export default function BackgroundDesignPage() {
  // Page state
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false); // hidden by default
  const [category, setCategory] = useState("All");
  const [sortMode, setSortMode] = useState("asc");
  const [selectedId, setSelectedId] = useState(DESIGNS[0].id);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [palette, setPalette] = useState([...COLOR_THEMES.blue]); // user-editable palette
  const [applyPalette, setApplyPalette] = useState(false);
  const [favorites, setFavorites] = useState(new Set());

  const searchRef = useRef(null);

  // filter + sort designs
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = DESIGNS.filter((d) => {
      if (category !== "All" && d.category !== category) return false;
      if (!q) return true;
      return d.name.toLowerCase().includes(q) || d.tags.join(" ").includes(q);
    });
    list = list.sort((a, b) => (sortMode === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));
    return list;
  }, [query, category, sortMode]);

  const grouped = useMemo(() => groupByLetter(filtered), [filtered]);

  const selectedDesign = DESIGNS.find((d) => d.id === selectedId) || DESIGNS[0];

  // Build CSS for preview. If applyPalette and design is gradient, override with palette
  function computePreviewCss(design) {
    if (!design) return "#fff";
    if (applyPalette && design.category === "Gradient") {
      // linear gradient using palette colors
      const colors = palette.length ? palette.join(",") : "#ffffff";
      return `linear-gradient(90deg, ${colors})`;
    }
    return design.css;
  }

  const previewCss = computePreviewCss(selectedDesign);

  // Actions
  function copyCss() {
    const code = `background: ${previewCss};`;
    navigator.clipboard.writeText(code).then(() => {
      toast.success("CSS copied to clipboard");
    }).catch(() => {
      toast.error("Failed to copy");
    });
  }

  function addPaletteColor(hex) {
    if (!/^#([0-9A-F]{3}){1,2}$/i.test(hex)) {
      toast.error("Invalid color");
      return;
    }
    setPalette((p) => [...p, hex]);
    toast.success("Color added");
  }

  function deletePaletteColor(idx) {
    setPalette((p) => p.filter((_, i) => i !== idx));
  }

  function setThemePalette(key) {
    if (COLOR_THEMES[key]) {
      setPalette([...COLOR_THEMES[key]]);
      toast.success(`Applied palette: ${key}`);
    }
  }

  function toggleFavorite(id) {
    setFavorites((s) => {
      const copy = new Set(s);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  }

  // UI helpers
  const categories = ["All", ...Array.from(new Set(DESIGNS.map((d) => d.category)))];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 p-4">
      <Toaster position="top-right" richColors />

      <header className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold">Revolyx designs</h1>
          <p className="text-sm opacity-70 mt-1">A curated collection of gradients, grids, dotted patterns and more — preview, copy source and customize palettes.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile sheet trigger */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="lg:hidden">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-0">
              {/* Left sheet content (icons + quick actions) */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    <div className="font-semibold">Quick actions</div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setSheetOpen(false)}><X className="w-4 h-4" /></Button>
                </div>

                <div className="mb-3">
                  <Input
                    ref={searchRef}
                    value={query}
                    placeholder="Search designs or tags"
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                    className="pl-10"
                    aria-label="Search designs"
                  />
                  <Search className="absolute mt-3 ml-3 w-4 h-4 opacity-60" />
                </div>

                <div className="mb-3">
                  <Label className="text-xs">Categories</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {categories.map((c) => (
                      <Button key={c} size="sm" variant={category === c ? "default" : "outline"} onClick={() => setCategory(c)}>{c}</Button>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="mt-3">
                  <Label className="text-xs mb-2">Icons</Label>
                  <ScrollArea className="h-[40vh]">
                    <div className="grid gap-2">
                      {AVAILABLE_ICONS.map((ic) => {
                        const Icon = ic.icon;
                        return (
                          <button key={ic.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800" onClick={() => toast(`${ic.label} clicked`)}>
                            <Icon className="w-5 h-5" />
                            <div>{ic.label}</div>
                          </button>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          {/* Desktop quick controls */}
          <div className="hidden lg:flex gap-2 items-center">
            <div className="flex items-center border rounded-md px-2 py-1 bg-white dark:bg-zinc-900">
              <Search className="w-4 h-4 opacity-60 mr-2" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                placeholder="Search designs or tags"
                className="border-0 shadow-none"
              />
            </div>

            <Select onValueChange={(v) => setCategory(v)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => setSortMode((s) => (s === "asc" ? "desc" : "asc"))}>
              {sortMode === "asc" ? "A → Z" : "Z → A"} <ChevronDown className="ml-2 w-4 h-4" />
            </Button>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" onClick={() => { setShowSuggestions(true); searchRef.current?.focus(); }}>
                  <Filter className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Open search</TooltipContent>
            </Tooltip>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left column: categories & grouped list (desktop) */}
        <aside className="hidden lg:block col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <List className="w-4 h-4" />
                  <span>Designs</span>
                </div>
                <Badge>{filtered.length}</Badge>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="mb-3">
                <Label className="text-xs">Sub-palettes</Label>
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {Object.keys(COLOR_THEMES).slice(0, 9).map((k) => (
                    <button key={k} onClick={() => setThemePalette(k)} className="flex items-center gap-2 p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800">
                      <div className="w-10 flex gap-0.5">
                        {COLOR_THEMES[k].slice(0, 5).map((c, i) => <div key={i} style={{ background: c }} className="flex-1 h-4 rounded-sm" />)}
                      </div>
                      <div className="text-xs opacity-80">{k}</div>
                    </button>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="mt-3">
                <Label className="text-xs">Grouped</Label>
                <ScrollArea className="h-[60vh] mt-3">
                  <div className="space-y-3">
                    {Object.entries(grouped).map(([letter, list]) => (
                      <div key={letter}>
                        <div className="text-xs font-semibold mb-2 flex items-center justify-between">
                          <span>{letter}</span>
                          <span className="text-xs opacity-60">({list.length})</span>
                        </div>

                        <div className="grid gap-2">
                          {list.slice(0, 20).map((d) => (
                            <button
                              key={d.id}
                              onClick={() => setSelectedId(d.id)}
                              className={clsx("flex items-center gap-3 p-2 rounded-md w-full text-left", selectedId === d.id ? "bg-indigo-600/10" : "hover:bg-zinc-100 dark:hover:bg-zinc-800")}
                            >
                              <div className="w-10 h-8 rounded-sm shadow-inner" style={{ background: d.css }} />
                              <div className="flex-1">
                                <div className="font-medium text-sm">{d.name}</div>
                                <div className="text-xs opacity-60">{d.category}</div>
                              </div>
                              <div className="text-xs opacity-60">{d.tags[0]}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Middle: preview + controls (main) */}
        <section className="col-span-1 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div>
                  <div className="text-lg font-semibold">{selectedDesign.name}</div>
                  <div className="text-xs opacity-60">{selectedDesign.category} • {selectedDesign.tags.join(", ")}</div>
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => { copyCss(); }}><Copy className="w-4 h-4 mr-1" />Copy CSS</Button>
                  <Button size="sm" variant="outline" onClick={() => { toggleFavorite(selectedDesign.id); toast(selectedDesign.name + (favorites.has(selectedDesign.id) ? " removed from favorites" : " added to favorites")); }}>
                    <Heart className="w-4 h-4 mr-1" />{favorites.has(selectedDesign.id) ? "Unfavorite" : "Favorite"}
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <div className="mb-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Preview box */}
                <div className="rounded-lg shadow-lg overflow-hidden border" style={{ minHeight: 240 }}>
                  <div style={{ minHeight: 240, display: "flex", alignItems: "stretch", justifyContent: "stretch" }}>
                    <div style={{ flex: 1, minHeight: 240, background: previewCss, padding: 20 }}>
                      {/* Overlay demo content */}
                      <div className="h-full w-full flex flex-col justify-between">
                        <div className="flex justify-between items-start">
                          <div className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded">{selectedDesign.name}</div>
                          <div className="bg-white/10 px-2 py-1 rounded text-xs opacity-80">Revolyx</div>
                        </div>

                        <div className="flex justify-end">
                          <div className="bg-white/10 px-3 py-2 rounded text-sm">Preview</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Controls: palette editor & quick info */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-xs">Palette</Label>
                    <div className="flex gap-2 mt-2 items-center">
                      {palette.map((c, i) => (
                        <div key={i} className="flex items-center gap-1">
                          <div style={{ background: c }} className="w-10 h-10 rounded-md border" />
                          <input
                            type="color"
                            value={c}
                            onChange={(e) => setPalette((p) => p.map((col, idx) => idx === i ? e.target.value : col))}
                            className="w-10 h-10 p-0 border-0"
                            aria-label={`Color ${i + 1}`}
                          />
                          <Button size="sm" variant="ghost" onClick={() => deletePaletteColor(i)}><Trash className="w-4 h-4" /></Button>
                        </div>
                      ))}

                      <div className="flex items-center gap-2 ml-2">
                        <input type="color" id="newColor" defaultValue="#ffffff" className="w-10 h-10 p-0 border-0" />
                        <Button size="sm" onClick={() => {
                          const el = document.getElementById("newColor");
                          if (el) addPaletteColor(el.value);
                        }}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-3">
                      <Label className="text-xs flex items-center gap-2"><Toggle pressed={applyPalette} onPressedChange={(v) => setApplyPalette(Boolean(v))} /><span>Apply palette to gradient</span></Label>
                      <Select onValueChange={(v) => setThemePalette(v)} defaultValue="">
                        <SelectTrigger className="w-44">
                          <SelectValue placeholder="Pick theme" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(COLOR_THEMES).map((k) => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <Label className="text-xs">Design info</Label>
                    <div className="mt-2 text-sm">
                      <div><strong>Category:</strong> {selectedDesign.category}</div>
                      <div><strong>Tags:</strong> {selectedDesign.tags.join(", ")}</div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(selectedDesign.css); toast.success("Source copied"); }}>
                        <Copy className="w-4 h-4 mr-1" />Copy original CSS
                      </Button>

                      <Button size="sm" onClick={() => { setSelectedId(selectedDesign.id); toast.success("Selected design applied to preview"); }}>
                        <Zap className="w-4 h-4 mr-1" />Apply
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Source code view */}
              <div className="mt-4">
                <Label className="text-xs">Source code</Label>
                <div className="mt-2 bg-[#0b1220] text-white rounded-md p-4 overflow-auto text-sm">
                  <pre><code>{`/* CSS: ${selectedDesign.name} */
background: ${previewCss};
`}</code></pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Right column: gallery of remaining designs */}
        <aside className="col-span-1 hidden lg:block">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2"><GridIcon className="w-4 h-4" /> Gallery</span>
                <div className="flex items-center gap-2">
                  <Badge>{filtered.length}</Badge>
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent>
              <ScrollArea className="h-[70vh]">
                <div className="grid grid-cols-1 gap-3">
                  {filtered.map((d) => (
                    <div key={d.id} className={clsx("flex items-center gap-3 p-2 rounded-md border", selectedId === d.id ? "border-indigo-500" : "border-transparent hover:border-zinc-200")}>
                      <div className="w-16 h-12 rounded-sm shadow-inner" style={{ background: d.css }} />
                      <div className="flex-1">
                        <div className="font-medium">{d.name}</div>
                        <div className="text-xs opacity-70">{d.category}</div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setSelectedId(d.id); toast.success(`${d.name} previewed`); }}>
                          Preview
                        </Button>
                        <Button size="sm" onClick={() => { navigator.clipboard.writeText(`background: ${d.css};`); toast.success("Original CSS copied"); }}>
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </aside>
      </main>
    </div>
  );

  // local helpers inside component
  function addPaletteColor(hex) {
    if (!/^#([0-9A-F]{3}){1,2}$/i.test(hex)) {
      toast.error("Invalid color");
      return;
    }
    setPalette((p) => [...p, hex]);
    toast.success("Color added");
  }
  function deletePaletteColor(idx) {
    setPalette((p) => p.filter((_, i) => i !== idx));
  }
  function setThemePalette(key) {
    if (COLOR_THEMES[key]) {
      setPalette([...COLOR_THEMES[key]]);
      toast.success(`Applied palette: ${key}`);
    } else {
      toast.error("Theme not found");
    }
  }
  function copyCss() {
    const code = `background: ${previewCss};`;
    navigator.clipboard.writeText(code).then(() => {
      toast.success("CSS copied to clipboard");
    }).catch(() => {
      toast.error("Failed to copy");
    });
  }
  function toggleFavorite(id) {
    setFavorites((s) => {
      const copy = new Set(s);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  }
}
