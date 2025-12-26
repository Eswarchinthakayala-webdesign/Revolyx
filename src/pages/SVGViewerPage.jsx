"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import * as LucideIcons from "lucide-react";
import { 
  Search, RotateCw, FlipHorizontal, Download, 
  Upload, Settings2, Eye, FileCode, Layers, 
  Palette, Share2, Sparkles, Pipette, Maximize2,
  Command, Copy, Check, Menu, X, ChevronDown, Info,
  Wand2, AlignLeft
} from "lucide-react";
import { renderToStaticMarkup } from "react-dom/server";

import { Icon } from "@iconify/react";
import CollectionData from "../IconData/collections.json";

import Editor from "@monaco-editor/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Slider } from "@/components/ui/slider";
import { Toaster, toast } from "sonner";
import clsx from "clsx";
import { useTheme } from "../components/theme-provider";

/* ------------------------- CONSTANTS ------------------------- */
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
}

const BG_THEMES = {
  transparent: "repeating-conic-gradient(#80808033 0% 25%, transparent 0% 50%) 50% / 16px 16px",
  white: "#ffffff",
  dark: "#09090b",
  slate: "#1e293b",
};

const INITIAL_SVG = `<svg width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <circle cx="12" cy="12" r="10"></circle>
  <path d="M12 8v4l3 3"></path>
</svg>`;

const allValidLucideIcons = Object.keys(LucideIcons)
  .filter((name) => /^[A-Z]/.test(name) && (typeof LucideIcons[name] === 'function' || typeof LucideIcons[name] === 'object'));

const iconifyLibraries = Object.keys(CollectionData).reduce((acc, key) => {
  acc[`Iconify-${key}`] = { __iconify: true, prefix: key, label: CollectionData[key].name || key };
  return acc;
}, {});

const libraries = {
  LucideReact: { label: "Lucide React", icons: allValidLucideIcons },
  ...iconifyLibraries,
};

export default function ProSVGStudio() {

  const { theme } = useTheme?.() ?? { theme: "system" };  
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [svgCode, setSvgCode] = useState(INITIAL_SVG);
  const [activeLib, setActiveLib] = useState("LucideReact");
  const [libSearch, setLibSearch] = useState("");
  const [icons, setIcons] = useState([]);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [bgKey, setBgKey] = useState("transparent");
  const [activeTheme, setActiveTheme] = useState("indigo");
  const [rotation, setRotation] = useState(0);
  const [flip, setFlip] = useState(false);
  const [scale, setScale] = useState([1]); // Scale for preview
  const [isCopied, setIsCopied] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 300, height: 300 });
  const [sortOrder, setSortOrder] = useState("asc"); // asc | desc
const [currentPage, setCurrentPage] = useState(1);
const ITEMS_PER_PAGE = 120;

const [showLibSuggestions, setShowLibSuggestions] = useState(false);


  const fileInputRef = useRef(null);

  useEffect(() => {
    const loadIcons = async () => {
      const libData = libraries[activeLib];
      if (!libData) return;
      if (!libData.__iconify) {
        setIcons(libData.icons.map(name => ({ lib: "LucideReact", name })));
      } else {
        try {
          const data = await import(`../IconData/json/json/${libData.prefix}.json`);
          const payload = data?.default || data;
          const names = Object.keys(payload.icons || {}).map((n) => ({ 
            lib: activeLib, 
            name: `${payload.prefix || libData.prefix}:${n}` 
          }));
          setIcons(names);
        } catch (e) {
          const meta = CollectionData[libData.prefix];
          if (meta?.icons) {
            setIcons(Object.keys(meta.icons).map(n => ({ lib: activeLib, name: `${libData.prefix}:${n}` })));
          }
        }
      }
    };
    loadIcons();
  }, [activeLib]);

  const handleIconSelect = async (iconObj) => {
    setShowSuggestions(false);
    if (iconObj.lib === "LucideReact") {
       const IconComponent = LucideIcons[iconObj.name];
       if (IconComponent) {
        // Convert React Component to static SVG string
        const staticSvg = renderToStaticMarkup(<IconComponent size={24} />);
        // Add xmlns and standardize
        const fullSvg = staticSvg.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
        setSvgCode(fullSvg);
        toast.success(`Generated code for ${iconObj.name}`);
      }
    } else {
      try {
        const response = await fetch(`https://api.iconify.design/${iconObj.name}.svg`);
        const svgText = await response.text();
        setSvgCode(svgText);
        toast.success(`Loaded ${iconObj.name}`);
      } catch (e) {
        toast.error("Failed to fetch SVG");
      }
    }
  };

const allLibraries = Object.keys(libraries);

const filteredLibs = useMemo(() => {
  return allLibraries.filter(key =>
    libraries[key].label
      .toLowerCase()
      .includes(libSearch.toLowerCase())
  );
}, [libSearch]);

const topLibSuggestions = filteredLibs.slice(0, 6);


  const filteredIcons = useMemo(() => {
    return icons.filter(icon => icon.name.toLowerCase().includes(sidebarSearch.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [sidebarSearch, icons]);

  const topSuggestions = useMemo(() => {
    if (!sidebarSearch) return [];
    return filteredIcons.slice(0, 6);
  }, [sidebarSearch, filteredIcons]);

  const applyColor = (color) => {
    let newCode = svgCode;
    if (newCode.includes('stroke="') && !newCode.includes('stroke="none"')) {
      newCode = newCode.replace(/stroke="[^"]*"/g, `stroke="${color}"`);
    } else if (newCode.includes('fill="') && !newCode.includes('fill="none"')) {
      newCode = newCode.replace(/fill="[^"]*"/g, `fill="${color}"`);
    } else {
      newCode = newCode.replace('<svg', `<svg stroke="${color}"`);
    }
    setSvgCode(newCode);
  };

  const optimizeSVG = () => {
    const optimized = svgCode
      .replace("//g", "") // Remove comments
      .replace(/>\s+</g, '><') // Remove whitespace between tags
      .replace(/\s+/g, " ") // Collapse spaces
      .trim();
    setSvgCode(optimized);
    toast.success("SVG Optimized");
  };

  const prettifySVG = () => {
    let formatted = "";
    let indent = "";
    svgCode.split(/>\s*</).forEach((char) => {
      if (char.match(/^\/\w/)) indent = indent.substring(2);
      formatted += indent + "<" + char + ">\r\n";
      if (char.match(/^<?\w[^>]*[^\/]$/) && !char.startsWith("input")) indent += "  ";
    });
    setSvgCode(formatted.substring(1, formatted.length - 3));
    toast.success("Code Beautified");
  };

  function renderIconPreview(iconObj, size = 20) {
    const { lib, name } = iconObj;
    if (lib === "LucideReact") {
      const IconComp = LucideIcons[name];
      return IconComp ? React.createElement(IconComp, { size }) : <Info size={size} />;
    }
    return <Icon icon={name} width={size} height={size} />;
  }
  const sortedIcons = useMemo(() => {
  const list = [...filteredIcons];
  list.sort((a, b) =>
    sortOrder === "asc"
      ? a.name.localeCompare(b.name)
      : b.name.localeCompare(a.name)
  );
  return list;
}, [filteredIcons, sortOrder]);

const totalPages = Math.ceil(sortedIcons.length / ITEMS_PER_PAGE);

const paginatedIcons = useMemo(() => {
  const start = (currentPage - 1) * ITEMS_PER_PAGE;
  return sortedIcons.slice(start, start + ITEMS_PER_PAGE);
}, [sortedIcons, currentPage]);

const normalizeSVG = (svg) =>
  svg
    .replace(/width="[^"]*"/, 'width="100%"')
    .replace(/height="[^"]*"/, 'height="100%"');


  return (
    <div className="flex flex-col min-h-screen pb-10 sm:pb-0 overflow-hidden text-zinc-900 dark:text-zinc-100 ">
      {/* HEADER */}
<header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 ">
  <div className="h-14 flex items-center justify-between px-4 sm:px-6">

    {/* LEFT – BRAND */}
    <div className="flex items-center gap-3 min-w-0">
      <div className="flex flex-col leading-tight">
        <h1 className="text-lg sm:text-xl lg:text-2xl font-extrabold tracking-tight flex items-center gap-2 truncate">
          SVG
          <span className="text-zinc-500 font-medium">
            Studio Pro
          </span>
        </h1>
        <span className="hidden sm:block text-[10px] uppercase tracking-widest text-zinc-400">
          Vector Editor & Icon Workspace
        </span>
      </div>
    </div>

    {/* RIGHT – ACTIONS */}
    <div className="flex items-center gap-2 sm:gap-3 shrink-0">

      {/* IMPORT */}
      <Button
        variant="outline"
        size="sm"
        className="h-9 px-2 sm:px-3"
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-4 h-4 sm:mr-2" />
        <span className="hidden sm:inline">Import</span>
      </Button>

      <input
        type="file"
        ref={fileInputRef}
        hidden
        accept=".svg"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          const reader = new FileReader();
          reader.onload = (ev) => setSvgCode(ev.target.result);
          reader.readAsText(file);
        }}
      />

      {/* EXPORT */}
      <Button
        size="sm"
        className="h-9 px-2 sm:px-3"
        onClick={() => {
          const blob = new Blob([svgCode], {
            type: "image/svg+xml",
          });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "icon.svg";
          a.click();
          URL.revokeObjectURL(url);
        }}
      >
        <Download className="w-4 h-4 sm:mr-2" />
        <span className="hidden sm:inline">Export</span>
      </Button>
    </div>
  </div>
</header>


      <main className="flex-1 flex flex-col sm:flex-row ">
        
        {/* LEFT PANEL */}
        <aside className="sm:w-72 border-r border-zinc-200 dark:border-zinc-800 flex flex-col ">
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-zinc-400">Library</label>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-400" />
               <Input 
                placeholder="Search libraries..." 
                className="pl-8 h-9 text-xs bg-white dark:bg-zinc-950" 
                value={libSearch}
                onFocus={() => setShowLibSuggestions(true)}
                onChange={(e) => {
                    setLibSearch(e.target.value);
                    setShowLibSuggestions(true);
                }}
                />
                {showLibSuggestions && topLibSuggestions.length > 0 && (
                <div className="absolute top-10 left-0 right-0 z-[100] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl p-1">
                    <div className="px-2 py-1 text-[9px] font-bold text-zinc-400 uppercase">
                    Libraries
                    </div>
                    {topLibSuggestions.map(key => (
                    <button
                        key={key}
                        onClick={() => {
                        setActiveLib(key);
                        setShowLibSuggestions(false);
                        }}
                        className="w-full text-left px-2 py-1.5 text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md"
                    >
                        {libraries[key].label}
                    </button>
                    ))}
                </div>
                )}


              </div>
              <div className="flex items-center gap-2 justify-between flex-wrap">
             <Select value={activeLib} onValueChange={setActiveLib}>
                <SelectTrigger className="h-10 sm:w-40 cursor-pointer text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filteredLibs.map(key => (
                    <SelectItem key={key} value={key} className="text-xs cursor-pointer">{libraries[key].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
                    <Badge  className="text-[9px] backdrop-blur-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300">
            {sortedIcons.length} icons
            </Badge>
            </div>
            </div>
         

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-zinc-400" />
              <Input 
                placeholder="Search icons..." 
                className="pl-8 h-9 text-xs"
                value={sidebarSearch}
                onFocus={() => setShowSuggestions(true)}
                onChange={(e) => {
                  setSidebarSearch(e.target.value);
                  setShowSuggestions(true);
                }}
              />
              {/* SEARCH SUGGESTIONS */}
              {showSuggestions && topSuggestions.length > 0 && (
                <div className="absolute top-10 left-0 right-0 z-[100] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-2xl p-1">
                  <div className="px-2 py-1 text-[9px] font-bold text-zinc-400 uppercase">Top Matches</div>
                  {topSuggestions.map((icon, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleIconSelect(icon)}
                      className="w-full flex items-center gap-3 px-2 py-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-md text-xs transition-colors"
                    >
                      {renderIconPreview(icon, 14)}
                      <span className="truncate">{icon.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase text-zinc-400">Icons</span>
            <Button
                variant="ghost"
                size="xs"
                onClick={() => setSortOrder(o => o === "asc" ? "desc" : "asc")}
                className="text-[10px]"
            >
                {sortOrder === "asc" ? "A–Z" : "Z–A"}
            </Button>
            </div>

          </div>

          <ScrollArea className="flex-1 pb-4  px-4">
         

            <TooltipProvider>
              <div className="grid grid-cols-5 sm:grid-cols-4 gap-2 h-60 pb-6 ">
                {paginatedIcons.map((icon, idx) => (
                  <Tooltip key={idx}>
                    <TooltipTrigger asChild>
                      <button onClick={() => handleIconSelect(icon)} className="aspect-square  cursor-pointer flex items-center justify-center rounded-md border border-zinc-200 dark:border-zinc-800 hover:bg-white dark:hover:bg-zinc-800 transition-all p-1">
                        {renderIconPreview(icon, 25)}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-[10px]">{icon.name}</TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </TooltipProvider>
          </ScrollArea>
          <div className="flex items-center justify-between px-4 py-2 border-t border-zinc-200 dark:border-zinc-800">
            <Button
                variant="outline"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="cursor-pointer"
            >
                Prev
            </Button>

            <span className="text-[10px] text-zinc-500">
                Page {currentPage} / {totalPages}
            </span>

            <Button
                variant="outline"
               
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="cursor-pointer"
            >
                Next
            </Button>
            </div>

        </aside>

        {/* CENTER: EDITOR */}
{/* CENTER: EDITOR */}
<section className="flex-1 flex flex-col min-w-0 min-h-0">

  {/* TOP BAR */}
  <div className="h-10 shrink-0 flex items-center justify-between px-3 sm:px-4 border-b border-zinc-800">
    <div className="flex items-center gap-2">
      <FileCode className="w-3.5 h-3.5 text-zinc-500" />
      <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest">
        SVG Source
      </span>
    </div>

    <div className="flex gap-1 sm:gap-2">
      <Button
        variant="outline"
        className="h-7 px-2 text-[10px]"
        onClick={prettifySVG}
      >
        <AlignLeft className="w-3 h-3 sm:mr-1" />
        <span className="hidden sm:inline">Prettify</span>
      </Button>

      <Button
        variant="outline"
        className="h-7 px-2 text-[10px]"
        onClick={optimizeSVG}
      >
        <Wand2 className="w-3 h-3 sm:mr-1" />
        <span className="hidden sm:inline">Optimize</span>
      </Button>
    </div>
  </div>

  {/* EDITOR WRAPPER — FIX HERE */}
  <div className="flex-1 min-h-screen ">
    <Editor
      height="100vh"
      theme={isDark ? "vs-dark" : "vs"}
      defaultLanguage="xml"
      value={svgCode}
      onChange={(v) => setSvgCode(v || "")}
      options={{
        minimap: { enabled: false },
        fontSize: 12,
        wordWrap: "on",
        scrollBeyondLastLine: false,
        automaticLayout: true,
        padding: { top: 12, bottom: 12 },
      }}
    />
  </div>

</section>



        {/* RIGHT PANEL */}
        <aside className="sm:w-80 border-l border-zinc-200 dark:border-zinc-800 flex flex-col shrink-0 overflow-y-auto bg-zinc-50/30 dark:bg-zinc-950">
          <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Preview</span>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="h-8 gap-2 cursor-pointer text-xs">
                  <Maximize2 className="w-3.5 h-3.5" /> View Large
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl h-[80vh] flex flex-col  border-zinc-800">
                <DialogHeader>
                  <DialogTitle className="">High Fidelity Preview</DialogTitle>
                </DialogHeader>
                <div
                className="flex-1 rounded-lg flex items-center justify-center overflow-hidden"
                style={{
                    background:
                    bgKey === "transparent"
                        ? BG_THEMES.transparent
                        : BG_THEMES[bgKey],
                }}
                >
                <div
                    className="preview-svg-wrapper"
                    dangerouslySetInnerHTML={{ __html: normalizeSVG(svgCode) }}

                />
                </div>

              </DialogContent>
            </Dialog>
          </div>

          {/* MAIN PREVIEW AREA */}
          <div className="p-4 space-y-6">
            <div 
              className="aspect-square rounded-xl border border-zinc-200 dark:border-zinc-800 relative overflow-hidden flex items-center justify-center group bg-white dark:bg-zinc-900 shadow-xl"
              style={{ background: bgKey === 'transparent' ? BG_THEMES.transparent : BG_THEMES[bgKey] }}
            >
              <div 
                style={{ 
                  transform: `rotate(${rotation}deg) scaleX(${flip ? -1 : 1}) scale(${scale[0]})`,
                  width: '100%', height: '100%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }} 
                className="transition-transform duration-200"
                dangerouslySetInnerHTML={{ __html: svgCode }}
              />
            </div>
            
            {/* TRANSFORM TOOLS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                 <span className="text-[10px] font-bold uppercase text-zinc-400">Transforms</span>
                 <div className="flex gap-1">
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setRotation(r => (r + 90) % 360)}>
                      <RotateCw className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setFlip(!flip)}>
                      <FlipHorizontal className="w-3.5 h-3.5" />
                    </Button>
                 </div>
              </div>
            </div>
            {/* SIZE CONTROL SLIDER */}
            <div className="space-y-3 px-1">
               <div className="flex justify-between items-center">
                 <span className="text-[10px] font-bold text-zinc-500 uppercase">Zoom Scale</span>
                 <Badge variant="secondary" className="text-[10px]">{Math.round(scale[0] * 100)}%</Badge>
               </div>
               <Slider 
                value={scale} 
                onValueChange={setScale} 
                max={4} 
                min={0.5} 
                step={0.1} 
                className="cursor-pointer"
               />
            </div>

            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase text-zinc-400">Background</span>
              <div className="flex gap-2">
                {Object.keys(BG_THEMES).map(k => (
                  <button
                    key={k}
                    onClick={() => setBgKey(k)}
                    className={clsx(
                      "w-8 h-8 cursor-pointer rounded-md border",
                      bgKey === k ? "border-dotted border-black dark:border-white" : "border-zinc-200 dark:border-zinc-800"
                    )}
                    style={{ background: k === 'transparent' ? '#eee' : BG_THEMES[k] }}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <span className="text-[10px] font-bold uppercase text-zinc-400">Colors</span>
              <div className="grid grid-cols-5 gap-2">
                {COLOR_THEMES[activeTheme].map(color => (
                  <button
                    key={color}
                    onClick={() => applyColor(color)}
                    className="h-8 rounded-md hover:scale-105 cursor-pointer transition-transform"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <Select value={activeTheme} onValueChange={setActiveTheme}>
                <SelectTrigger className="h-8 text-[10px] cursor-pointer uppercase font-bold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="h-100 overflow-y-auto">
                  {Object.keys(COLOR_THEMES).map(t => (
                    <SelectItem key={t} value={t} className="text-xs cursor-pointer uppercase">{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
            variant="outline"
            className="w-full h-11 cursor-pointer font-bold" onClick={() => {
                 navigator.clipboard.writeText(svgCode);
                 setIsCopied(true);
                 setTimeout(() => setIsCopied(false), 2000);
                 toast.success("Code Copied!");
              }}>
              {isCopied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />} 
              Copy SVG Code
            </Button>
          </div>
        </aside>
      </main>
    </div>
  );
}