"use client";

import React, { useCallback, useEffect, useState } from "react";
import Barcode from "react-barcode"; // npm install react-barcode
import { Toaster, toast } from "sonner";
import {
  Barcode as BarcodeIcon,
  Download,
  Save,
  Trash2,
  Image as ImageIcon,
  Link as LinkIcon,
  Plus,
  LucideLockOpen,
  Settings2,
  List as ListIcon,
  Palette,
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
// Dummy import if you don't have the file, otherwise keep your path
import { useTheme } from "../components/theme-provider"; 
import { showToast } from "../lib/ToastHelper"; 

/* ---------------- CONSTANTS ---------------- */

const LOCAL_KEY = "revolyx_barcode_saves_v2"; // Unique key for local storage
const SAVE_CAP = 100;

const BARCODE_FORMATS = [
  { id: "CODE128", label: "CODE 128", desc: "Full ASCII (Default)", example: "Revolyx128" },
  { id: "CODE39", label: "CODE 39", desc: "Alphanumeric", example: "CODE39" },
  { id: "EAN13", label: "EAN-13", desc: "Retail (13 digits)", example: "978020137962" },
  { id: "UPC", label: "UPC-A", desc: "Retail US (12 digits)", example: "123456789012" },
  { id: "ITF14", label: "ITF-14", desc: "Packaging", example: "10012345678902" },
  { id: "MSI", label: "MSI", desc: "Warehouse/Inventory", example: "123456" },
  { id: "pharmacode", label: "Pharmacode", desc: "Pharmaceutical", example: "12345" },
];

/* ------------------------- COLOR THEMES ------------------------- */
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

/* ---------------- HELPERS ---------------- */

// Load data from LocalStorage safely
function loadSaves() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("Failed to load saves:", error);
    return [];
  }
}

// Save data to LocalStorage
function persistSaves(list) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list || []));
  } catch (error) {
    console.error("Failed to save data:", error);
  }
}

function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

/* ---------------- COMPONENT ---------------- */

export default function BarcodeGeneratorPage() {
  const { theme } = useTheme?.() || { theme: "light" };
  
  // URL Params Init
  const urlParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams();
  const initialText = urlParams.get("q") || "Revolyx128";

  // State
  const [text, setText] = useState(initialText);
  const [format, setFormat] = useState(urlParams.get("format") || "CODE128");
  const [width, setWidth] = useState(Number(urlParams.get("width") || 2));
  const [height, setHeight] = useState(Number(urlParams.get("height") || 100));
  const [displayValue, setDisplayValue] = useState(urlParams.get("showVal") !== "false");
  const [background, setBackground] = useState(urlParams.get("bg") || "#ffffff");
  
  // Color Theme State
  const [selectedThemeKey, setSelectedThemeKey] = useState("zinc");
  const [lineColor, setLineColor] = useState(urlParams.get("color") || "#000000");

  // Debounced Values for Rendering
  const debouncedText = useDebounced(text, 300);
  const debouncedWidth = useDebounced(width, 200);
  const debouncedHeight = useDebounced(height, 200);
  const debouncedBg = useDebounced(background, 300);
  const debouncedLine = useDebounced(lineColor, 300);

  // Saved Items - Initialized from LocalStorage
  const [saved, setSaved] = useState(() => loadSaves());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [svgRef, setSvgRef] = useState(null); 

  // Effect: Persist to LocalStorage whenever 'saved' changes
  useEffect(() => {
    persistSaves(saved);
  }, [saved]);

  // Sync URL (Optional UX improvement)
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const u = new URL(window.location.href);
        const params = u.searchParams;
        params.set("q", text || "");
        params.set("format", format);
        params.set("width", String(width));
        params.set("height", String(height));
        params.set("showVal", String(displayValue));
        params.set("bg", background);
        params.set("color", lineColor);
        u.search = params.toString();
        window.history.replaceState({}, "", u.toString());
      } catch {}
    }, 600);
    return () => clearTimeout(timer);
  }, [text, format, width, height, displayValue, background, lineColor]);

  // Actions
  const handleSave = useCallback(() => {
    if (!text) return;
    
    const newItem = {
      id: `bar_${Date.now().toString(36)}`,
      text,
      format,
      width,
      height,
      displayValue,
      background,
      lineColor,
      createdAt: Date.now(),
    };

    setSaved((prev) => [newItem, ...prev].slice(0, SAVE_CAP));
    showToast("success", "Barcode saved locally");
  }, [text, format, width, height, displayValue, background, lineColor]);

  const handleDownload = useCallback(async (type = "png") => {
    if (!svgRef) return showToast("error", "Barcode not rendered");
    
    const svgNode = svgRef.querySelector("svg");
    if (!svgNode) return showToast("error", "SVG not found");

    try {
      if (type === "svg") {
         const svgData = new XMLSerializer().serializeToString(svgNode);
         const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
         const url = URL.createObjectURL(blob);
         const a = document.createElement("a");
         a.href = url;
         a.download = `barcode-${text}-${Date.now()}.svg`;
         document.body.appendChild(a);
         a.click();
         a.remove();
         showToast("success", "SVG Downloaded");
      } else {
        // PNG via Canvas
        const svgData = new XMLSerializer().serializeToString(svgNode);
        const img = new Image();
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        img.onload = () => {
          canvas.width = img.width + 40;
          canvas.height = img.height + 40;
          
          if (background && background !== "transparent") {
             ctx.fillStyle = background;
             ctx.fillRect(0, 0, canvas.width, canvas.height);
          }

          ctx.drawImage(img, 20, 20);
          
          const pngUrl = canvas.toDataURL("image/png");
          const a = document.createElement("a");
          a.href = pngUrl;
          a.download = `barcode-${text}-${Date.now()}.png`;
          a.click();
          showToast("success", "PNG Downloaded");
        };
        img.src = "data:image/svg+xml;base64," + btoa(svgData);
      }
    } catch (e) {
      console.error(e);
      showToast("error", "Download failed");
    }
  }, [svgRef, text, background]);

  const loadSaved = (item) => {
    setText(item.text);
    setFormat(item.format);
    setWidth(item.width);
    setHeight(item.height);
    setDisplayValue(item.displayValue);
    setBackground(item.background);
    setLineColor(item.lineColor);
    showToast("info", "Loaded saved barcode");
    setSheetOpen(false);
  };

  const removeSaved = (id) => {
    setSaved((prev) => prev.filter((s) => s.id !== id));
    showToast("success", "Removed from storage");
  };

  // Mobile Sheet for Saved Items
  function MobileSheetSaved() {
    return (
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" className="lg:hidden cursor-pointer"><ListIcon /></Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[340px]">
          <div className="p-4">
            <h3 className="font-semibold mb-4">Saved Barcodes</h3>
            <ScrollArea className="h-[70vh]">
              <div className="flex flex-col gap-3">
                {saved.length === 0 && <div className="text-sm opacity-60">No saved items</div>}
                {saved.map((s) => (
                  <div key={s.id} className="border rounded p-3 flex justify-between items-center bg-card">
                    <div className="overflow-hidden">
                      <div className="font-mono text-sm font-bold truncate w-40">{s.text}</div>
                      <Badge variant="outline" className="text-[10px] mt-1">{s.format}</Badge>
                    </div>
                    <div className="flex gap-1">
                       <Button size="icon" variant="ghost" className="h-8 w-8 cursor-pointer" onClick={() => loadSaved(s)} title="Load">
                         <LucideLockOpen className="w-4 h-4" />
                       </Button>
                       <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive cursor-pointer" onClick={() => removeSaved(s.id)} title="Delete">
                         <Trash2 className="w-4 h-4" />
                       </Button>
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

  // --- RENDER ---
  return (
    <div className="min-h-screen max-w-8xl mx-auto overflow-hidden py-8 px-4 md:px-8">
      <Toaster richColors />
      
  {/* ===== HEADER ===== */}
<header
  className="
    flex flex-col gap-4
    sm:flex-row sm:items-center sm:justify-between
    mb-6
  "
>
  {/* Title Section */}
  <div className="space-y-1">
    <div className="flex items-center gap-3">


      <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100">
        Revolyx <span className="text-zinc-500 dark:text-zinc-400">Barcode</span>
      </h1>
    </div>

    <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md">
      Professional product & inventory codes
    </p>
  </div>

  {/* Actions */}
  <div
    className="
      flex items-center gap-2
      w-full sm:w-auto
    "
  >
    <MobileSheetSaved />

    <Button
      variant="outline"
      className="
        flex-1 sm:flex-none
        border-zinc-200 dark:border-zinc-800
        text-zinc-700 dark:text-zinc-300
        hover:bg-zinc-100 dark:hover:bg-zinc-900
      "
      onClick={() => {
        navigator.clipboard.writeText(window.location.href);
        toast.success("Page URL copied");
      }}
    >
      <LinkIcon className="w-4 h-4 mr-1.5" />
      Share
    </Button>

    <Button
      className="
        flex-1 sm:flex-none
        bg-zinc-900 text-white
        hover:bg-zinc-800
        dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200
      "
      onClick={() => setDialogOpen(true)}
    >
      <Plus className="w-4 h-4 mr-1.5" />
      New
    </Button>
  </div>
</header>


      <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* LEFT: CONTROLS */}
        <aside className="lg:col-span-1">
          <Card className="bg-white/60 dark:bg-black/60 sticky top-4">
            <CardHeader><CardTitle>Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-5">
              
              {/* Text Input */}
              <div className="space-y-2">
                <Label className="text-xs">Value / Content</Label>
                <Input 
                  value={text} 
                  onChange={(e) => setText(e.target.value)} 
                  placeholder="Enter value..." 
                  className="font-mono"
                />
              </div>

              {/* Format Select */}
              <div className="space-y-2">
                 <Label className="text-xs">Format</Label>
                 <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger className="cursor-pointer w-full"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BARCODE_FORMATS.map(f => (
                        <SelectItem key={f.id} value={f.id} className="cursor-pointer">
                          <span className="font-medium">{f.label}</span> 
                          <span className="ml-2 text-xs opacity-50">{f.desc}</span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                 </Select>
              </div>

              {/* Sliders */}
              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                   <div className="flex justify-between text-xs opacity-70">
                     <span>Bar Width</span>
                     <span>{width}px</span>
                   </div>
                   <Slider value={[width]} min={1} max={4} step={1} onValueChange={([v]) => setWidth(v)} />
                </div>

                <div className="space-y-1">
                   <div className="flex justify-between text-xs opacity-70">
                     <span>Height</span>
                     <span>{height}px</span>
                   </div>
                   <Slider value={[height]} min={30} max={150} step={5} onValueChange={([v]) => setHeight(v)} />
                </div>
              </div>

              <Separator />

              {/* Line Color Selection with Subpalettes */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs flex items-center gap-1"><Palette className="w-3 h-3"/> Line Theme</Label>
                  <div className="w-6 h-6 rounded border" style={{ backgroundColor: lineColor }} />
                </div>
                
                {/* 1. Theme Select */}
                <Select value={selectedThemeKey} onValueChange={setSelectedThemeKey}>
                  <SelectTrigger className="h-9 cursor-pointer">
                     <SelectValue placeholder="Select theme" />
                  </SelectTrigger>
                  <SelectContent className="h-100">
                    {Object.keys(COLOR_THEMES).map((key) => (
                      <SelectItem key={key} value={key} className="cursor-pointer">
                        <div className="flex items-center gap-2">
                           <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLOR_THEMES[key][2] }}></div>
                           <span className="capitalize">{key}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* 2. Subpalette Swatches */}
                <div className="grid grid-cols-5 gap-2 mt-2">
                  {COLOR_THEMES[selectedThemeKey]?.map((c) => (
                    <button
                      key={c}
                      onClick={() => setLineColor(c)}
                      className="w-full h-8 rounded-md border cursor-pointer hover:scale-105 transition-transform "
                      style={{ 
                        backgroundColor: c,
                        borderColor: lineColor === c ? 'var(--foreground)' : 'transparent',
                        transform: lineColor === c ? 'scale(1.1)' : 'scale(1)'
                      }}
                      title={c}
                    />
                  ))}
                </div>

                {/* 3. Custom Color Fallback */}
                <div className="pt-2">
                   <Label className="text-[10px] opacity-70 mb-1 block">Custom Hex</Label>
                   <div className="flex gap-2">
                      <Input 
                        type="color" 
                        className="w-10 h-8 p-0 border cursor-pointer" 
                        value={lineColor} 
                        onChange={e => setLineColor(e.target.value)} 
                      />
                      <Input 
                        className="h-8 text-xs font-mono" 
                        value={lineColor} 
                        onChange={e => setLineColor(e.target.value)} 
                        placeholder="#000000"
                      />
                   </div>
                </div>
              </div>
              
              <div className="space-y-2 mt-4">
                <Label className="text-xs">Background</Label>
                <div className="flex gap-2 items-center">
                    <Input type="color" className="w-8 h-8 p-0 border-0 cursor-pointer" value={background} onChange={e => setBackground(e.target.value)} />
                    <Input className="text-xs h-8 font-mono" value={background} onChange={e => setBackground(e.target.value)} />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                 <Label className="text-xs cursor-pointer" htmlFor="showVal">Show Text Value</Label>
                 <Switch id="showVal" checked={displayValue} onCheckedChange={setDisplayValue} />
              </div>

              <Separator />

              <div className="flex gap-2">
                 <Button className="flex-1 cursor-pointer" onClick={handleSave}>
                    <Save className="w-4 h-4 mr-2" /> Save Locally
                 </Button>
                 <Button variant="outline" className="cursor-pointer" onClick={() => { setText(""); toast.info("Cleared"); }}>
                    Clear
                 </Button>
              </div>

            </CardContent>
          </Card>
        </aside>


        {/* RIGHT: PREVIEW & LIST */}
        <section className="lg:col-span-3 space-y-4">
          
          {/* PREVIEW CARD */}
          <Card className="bg-white/60 dark:bg-black/60 min-h-[400px]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                 <CardTitle>Live Preview</CardTitle>
                 <Badge variant="secondary" className="font-mono text-[10px]">{format}</Badge>
              </div>
              <div className="flex gap-2">
                 <Button size="sm" variant="outline" className="cursor-pointer" onClick={() => handleDownload("svg")}>
                    <Download className="w-4 h-4 mr-1" /> SVG
                 </Button>
                 <Button size="sm" className="cursor-pointer" onClick={() => handleDownload("png")}>
                    <ImageIcon className="w-4 h-4 mr-1" /> PNG
                 </Button>
              </div>
            </CardHeader>
            <Separator />
            <CardContent className="flex items-center justify-center p-12 overflow-auto bg-gray-50/50 dark:bg-zinc-900/30">
              
              {/* Actual Barcode Render */}
              <div ref={setSvgRef} className="transition-all duration-300">
                {debouncedText ? (
                  <Barcode 
                    value={debouncedText}
                    format={format}
                    width={debouncedWidth}
                    height={debouncedHeight}
                    displayValue={displayValue}
                    background={debouncedBg}
                    lineColor={debouncedLine}
                    margin={10}
                  />
                ) : (
                   <div className="text-sm opacity-40 flex flex-col items-center gap-2">
                      <BarcodeIcon className="w-12 h-12 opacity-20" />
                      <div>Enter text to generate barcode</div>
                   </div>
                )}
              </div>

            </CardContent>
            <div className="px-6 py-3 text-xs opacity-60 flex justify-between border-t bg-white/40 dark:bg-black/40">
               <span>Preview auto-updates</span>
               <span>{debouncedText.length} chars</span>
            </div>
          </Card>

          {/* SAVED ITEMS LIST */}
          <Card className="bg-white/60 dark:bg-black/60">
             <CardHeader className="flex flex-row justify-between items-center">
               <CardTitle>Saved Barcodes (Local)</CardTitle>
               <span className="text-xs opacity-50">{saved.length} items</span>
             </CardHeader>
             <CardContent>
               <ScrollArea className="h-[40vh]">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {saved.length === 0 && <div className="p-4 text-center text-sm opacity-50 col-span-full">No saved barcodes</div>}
                    
                    {saved.map(s => (
                       <div key={s.id} className="border cursor-pointer rounded-lg p-3 bg-card flex flex-col gap-3 group relative hover:border-primary/50 transition-all">
                          
                          <div className="h-24 bg-white dark:bg-black rounded flex items-center justify-center overflow-hidden p-2">
                             <div className="scale-75 origin-center">
                               <Barcode 
                                  value={s.text} 
                                  format={s.format} 
                                  width={1} 
                                  height={40} 
                                  displayValue={false} 
                                  margin={12} 
                                  background="#ffffff" 
                                  lineColor={s.lineColor}
                               />
                             </div>
                          </div>

                          <div className="flex justify-between items-end">
                             <div className="overflow-hidden">
                                <div className="font-bold text-sm truncate w-40">{s.text}</div>
                                <div className="flex gap-2 text-[10px] opacity-60 mt-1">
                                   <Badge variant="secondary" className="text-[10px] h-4 px-1">{s.format}</Badge>
                                   <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                                </div>
                             </div>
                             
                             <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="icon" variant="ghost" className="h-7 w-7 cursor-pointer" onClick={() => loadSaved(s)} title="Load">
                                  <Settings2 className="w-3.5 h-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive cursor-pointer" onClick={() => removeSaved(s.id)} title="Delete">
                                  <Trash2 className="w-3.5 h-3.5" />
                                </Button>
                             </div>
                          </div>
                       </div>
                    ))}
                 </div>
               </ScrollArea>
             </CardContent>
          </Card>

        </section>
      </main>

      {/* NEW DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create New Barcode</DialogTitle></DialogHeader>
          <div className="py-4 text-sm opacity-80">
            This will clear your current workspace and reset to defaults.
          </div>
          <DialogFooter>
             <Button variant="outline" className="cursor-pointer" onClick={() => setDialogOpen(false)}>Cancel</Button>
             <Button className="cursor-pointer" onClick={() => { 
                setText(""); 
                setFormat("CODE128"); 
                setLineColor("#000000");
                setDialogOpen(false); 
                toast.success("Workspace cleared");
             }}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}