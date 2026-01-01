import React, { useState, useEffect, useMemo, useRef } from "react";
import { Icon } from "@iconify/react";
import { 
  Search, Code, Copy, ArrowLeft, LayoutGrid, 
  Loader2, Check, X, Filter, Info, ShieldCheck, User, Palette, Droplet,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// UI Components
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Slider } from "@/components/ui/slider";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import CollectionData from "../IconData/collections.json";

// --- Constants ---
const ITEMS_PER_PAGE = 500;

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

// --- Utility ---
function cn(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function ProfessionalIconsPage() {
  // Global State
  const [activeLibKey, setActiveLibKey] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [globalSearch, setGlobalSearch] = useState("");
  
  // Color Theme State
  const [activeTheme, setActiveTheme] = useState("zinc"); // The selected family (e.g. "orange")
  const [globalColor, setGlobalColor] = useState(null); // The specific selected hex (e.g. "#f97316")

  // Library State
  const [libIcons, setLibIcons] = useState([]);
  const [visibleCount, setVisibleCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingLib, setIsLoadingLib] = useState(false);
  
  // Modal State
  const [selectedIcon, setSelectedIcon] = useState(null);

  // --- 1. Data Processing for Libraries ---
  const { sortedLibraries, uniqueCategories } = useMemo(() => {
    const libs = Object.entries(CollectionData).map(([key, data]) => ({
      key,
      ...data,
      category: data.category || "General",
      author: data.author || { name: "Unknown" },
      license: data.license || { title: "Open Source", spdx: "MIT" }
    }));
    libs.sort((a, b) => a.name.localeCompare(b.name));
    const cats = new Set(["All"]);
    libs.forEach(l => cats.add(l.category));
    return { sortedLibraries: libs, uniqueCategories: Array.from(cats).sort() };
  }, []);

  const filteredLibraries = useMemo(() => {
    return sortedLibraries.filter(lib => {
      const matchesCategory = selectedCategory === "All" || lib.category === selectedCategory;
      const matchesSearch = lib.name.toLowerCase().includes(globalSearch.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [sortedLibraries, selectedCategory, globalSearch]);

  // --- 2. Load Specific Library ---
  useEffect(() => {
    const loadLibrary = async () => {
      if (!activeLibKey) {
        setLibIcons([]);
        return;
      }
      setIsLoadingLib(true);
      try {
        const data = await import(`../IconData/json/json/${activeLibKey}.json`);
        const payload = data?.default || data;
        const icons = Object.keys(payload.icons || {}).map((n) => ({
          fullName: `${payload.prefix || activeLibKey}:${n}`,
          shortName: n,
        }));
        setLibIcons(icons);
        setVisibleCount(ITEMS_PER_PAGE);
      } catch (e) {
        console.error("Failed to load library:", e);
      } finally {
        setIsLoadingLib(false);
      }
    };
    loadLibrary();
  }, [activeLibKey]);

  const filteredIcons = useMemo(() => {
    if (!globalSearch) return libIcons;
    return libIcons.filter(i => i.shortName.toLowerCase().includes(globalSearch.toLowerCase()));
  }, [libIcons, globalSearch]);

  const displayedIcons = filteredIcons.slice(0, visibleCount);
  const searchSuggestions = useMemo(() => {
    if (!globalSearch || activeLibKey) return [];
    return sortedLibraries.filter(l => l.name.toLowerCase().includes(globalSearch.toLowerCase())).slice(0, 5);
  }, [globalSearch, sortedLibraries, activeLibKey]);

  return (
    <div className="min-h-screen  overflow-hidden text-slate-900 dark:text-slate-100 font-sans selection:bg-zinc-100 dark:selection:bg-zinc-900/30">
      
      {/* Header Section */}
      <header className=" w-full   border-b border-slate-200 dark:border-zinc-800 transition-colors duration-300">
        <div className="max-w-8xl mx-auto px-6  flex items-center flex-wrap justify-between gap-6">
          
          {/* Logo / Back Button */}
          <div className="flex items-center gap-4 min-w-fit">
            {activeLibKey ? (
              <Button 
                variant="outline" 
                onClick={() => { setActiveLibKey(null); setGlobalSearch(""); }}
                className="group pl-2 pr-4 cursor-pointer hover:bg-slate-100 dark:hover:bg-zinc-800"
              >
                <ArrowLeft className="mr-2 h-4 w-4 text-slate-500 group-hover:text-slate-900 dark:text-slate-400 dark:group-hover:text-white transition-colors" />
                <span className="font-semibold">Back</span>
              </Button>
            ) : (
              <div className="flex items-center gap-2">
                <div>
                <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3">
                   Icon Engine
                </h1>
                <p className="text-sm opacity-70 mt-1">Browse, preview and copy code and download svg & png</p>
                </div>  
                 </div>
            )}
          </div>
           <div className="flex items-center flex-wrap gap-2">
          {/* Search Bar */}
          <div className="flex-1 max-w-xl relative group">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-zinc-500" size={18} />
              <input 
                className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-slate-100 dark:bg-zinc-900 border border-transparent focus:border-zinc-500/50 focus:bg-white dark:focus:bg-zinc-950 focus:ring-4 focus:ring-zinc-500/10 outline-none transition-all text-sm font-medium placeholder:text-slate-400 dark:placeholder:text-zinc-600"
                placeholder={activeLibKey ? `Search ${CollectionData[activeLibKey].name}...` : "Search libraries..."}
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
              />
              {globalSearch && (
                <button onClick={() => setGlobalSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                  <X size={14} />
                </button>
              )}
            </div>
            {/* Search Suggestions */}
            {!activeLibKey && searchSuggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl z-50">
                {searchSuggestions.map(lib => (
                  <button key={lib.key} onClick={() => { setActiveLibKey(lib.key); setGlobalSearch(""); }} className="w-full text-left px-3 py-2.5 rounded-lg text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-zinc-800 flex justify-between group/item">
                    <span>{lib.name}</span>
                    <ArrowLeft className="rotate-180 opacity-0 group-hover/item:opacity-100 transition-opacity text-slate-400" size={14} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Controls: Filters or Color Picker */}
          {!activeLibKey ? (
            <div className="min-w-[160px] ">
               <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full rounded-xl border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                  <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                    <Filter size={14} />
                    <SelectValue placeholder="Category" />
                  </div>
                </SelectTrigger>
                <SelectContent className="dark:bg-zinc-900 dark:border-zinc-800">
                  {uniqueCategories.map(cat => (
                    <SelectItem key={cat} value={cat} className="dark:focus:bg-zinc-800 cursor-pointer">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            /* UNIVERSAL COLOR PICKER (Visible inside library) */
            <div className="flex items-center gap-3 w-full sm:w-fit bg-slate-100 dark:bg-zinc-900 p-1.5 rounded-full pr-4 border border-slate-200 dark:border-zinc-800">
              
              {/* Theme Family Selector */}
              <Select value={activeTheme} onValueChange={setActiveTheme}>
                <SelectTrigger className="h-8 border-none bg-white dark:bg-zinc-800  rounded-xl shadow-sm text-xs font-semibold w-[100px] focus:ring-0">
                  <div className="flex items-center gap-2">
                    <Palette size={12} />
                    <span className="capitalize">{activeTheme}</span>
                  </div>
                </SelectTrigger>
                <SelectContent className="dark:bg-zinc-900 h-150 dark:border-zinc-800">
                  {Object.keys(COLOR_THEMES).map(theme => (
                    <SelectItem key={theme} value={theme} className="capitalize cursor-pointer dark:focus:bg-zinc-800">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ background: COLOR_THEMES[theme][2] }} />
                        {theme}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Subpalette (Radio Swatches) */}
              <div className="flex items-center  gap-1.5 border-l border-slate-300 dark:border-zinc-700 pl-3">
                 <TooltipProvider>
                  {COLOR_THEMES[activeTheme].map((hex) => (
                    <Tooltip key={hex}>
                      <TooltipTrigger asChild>
                        <button
                          onClick={() => setGlobalColor(hex)}
                          className={cn(
                            "w-5 h-5 rounded-full border cursor-pointer border-slate-200 dark:border-zinc-700 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 dark:focus:ring-offset-zinc-900",
                            globalColor === hex ? "ring-2 ring-offset-1 ring-slate-900 dark:ring-white scale-110" : ""
                          )}
                          style={{ backgroundColor: hex }}
                        />
                      </TooltipTrigger>
                      <TooltipContent><p className="font-mono">{hex}</p></TooltipContent>
                    </Tooltip>
                  ))}
                </TooltipProvider>

                {/* Reset Button */}
                {globalColor && (
                   <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                         <button 
                            onClick={() => setGlobalColor(null)}
                            className="ml-1 w-6 h-6 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400 transition-colors"
                         >
                            <Droplet size={14} className="stroke-[3]" />
                         </button>
                      </TooltipTrigger>
                      <TooltipContent><p>Reset Color</p></TooltipContent>
                    </Tooltip>
                   </TooltipProvider>
                )}
              </div>
            </div>
          )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-8xl mx-auto p-6 md:p-8">
        <AnimatePresence mode="wait">
          {!activeLibKey ? (
            /* LIBRARY LIST VIEW */
            <motion.div key="library-list" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
               {/* ... (Existing Library List Code) ... */}
                <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                  {selectedCategory === "All" ? "All Libraries" : `${selectedCategory} Icons`}
                  <span className="ml-3 text-sm font-normal text-slate-400 dark:text-zinc-500 bg-slate-100 dark:bg-zinc-900 px-3 py-1 rounded-full">
                    {filteredLibraries.length} Collections
                  </span>
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredLibraries.map((lib) => (
                  <LibraryCard key={lib.key} lib={lib} onClick={() => setActiveLibKey(lib.key)} />
                ))}
              </div>
            </motion.div>
          ) : (
            /* ICON GRID VIEW */
            <motion.div key="icon-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
              {/* Library Header Info */}
              <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 border border-slate-200 dark:border-zinc-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                   <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-2">{CollectionData[activeLibKey].name}</h2>
                   <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1.5"><LayoutGrid size={14}/> {CollectionData[activeLibKey].total} Icons</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"/>
                      <span className="flex items-center gap-1.5"><User size={14}/> {CollectionData[activeLibKey].author?.name}</span>
                      <span className="w-1 h-1 bg-slate-300 rounded-full"/>
                      <span className="flex items-center gap-1.5"><ShieldCheck size={14}/> {CollectionData[activeLibKey].license?.title}</span>
                   </div>
                </div>
                <div className="flex gap-2">
                   <Badge variant="outline" className="px-4 py-1.5 text-xs uppercase tracking-widest dark:border-zinc-700">
                      {CollectionData[activeLibKey].category}
                   </Badge>
                </div>
              </div>

              {isLoadingLib ? (
                <div className="h-64 flex flex-col items-center justify-center text-slate-400">
                  <Loader2 className="animate-spin mb-4 text-zinc-500" size={32} />
                  <p>Loading Assets...</p>
                </div>
              ) : (
                <div className="space-y-10">
                  <div className="grid grid-cols-5 sm:grid-cols-[repeat(auto-fill,minmax(90px,1fr))] gap-4">
                    {displayedIcons.map((icon) => (
                      <button
                        key={icon.fullName}
                        onClick={() => setSelectedIcon({...icon, author: CollectionData[activeLibKey].author?.name})}
                        className="group cursor-pointer relative aspect-square bg-white dark:bg-zinc-900/50 border border-slate-200 dark:border-zinc-800/80 rounded-2xl flex flex-col items-center justify-center gap-3 hover:border-zinc-500 dark:hover:border-zinc-500 hover:shadow-lg hover:shadow-zinc-500/10 hover:-translate-y-1 transition-all duration-300"
                      >
                        {/* Here we apply the Universal Color.
                           If globalColor is set, we use inline style.
                           If not, we fallback to Tailwind classes.
                        */}
                        <Icon 
                          icon={icon.fullName} 
                          className={cn(
                            "text-3xl transition-transform duration-300 group-hover:scale-110",
                            !globalColor && "text-slate-700 dark:text-slate-300" // Fallback color
                          )}
                          style={{ color: globalColor || undefined }} // Universal Color
                        />
                        <span className={cn("absolute bottom-2 text-[10px]  p-1 rounded-2xl  opacity-0 group-hover:opacity-100 transition-opacity w-11/12 truncate text-center font-medium")}
                        style={{ backgroundColor: globalColor || undefined }}
                        >
                          {icon.shortName}
                        </span>
                      </button>
                    ))}
                  </div>
                  {visibleCount < filteredIcons.length && (
                    <div className="flex justify-center pb-10">
                      <Button size="lg" variant="outline" onClick={() => setVisibleCount(p => p + ITEMS_PER_PAGE)} className="rounded-full px-8 dark:bg-zinc-900 dark:border-zinc-800 dark:text-slate-300 dark:hover:bg-zinc-800">
                        Load More ({filteredIcons.length - visibleCount} remaining)
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Details Modal - Passing the globalColor as initial prop if needed */}
      <IconDetailDialog 
        icon={selectedIcon} 
        isOpen={!!selectedIcon} 
        onClose={() => setSelectedIcon(null)}
        initialColor={globalColor} // Pass the global color to the modal
      />
    </div>
  );
}

// --- Library Card Component (Shadcn-Level) ---
function LibraryCard({ lib, onClick }) {
  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      onClick={onClick}
      className="
        group relative cursor-pointer
        rounded-2xl border border-zinc-200 dark:border-zinc-800
        bg-white dark:bg-zinc-900
        p-4 sm:p-5
        transition-all duration-300
        hover:border-zinc-400 dark:hover:border-zinc-600
        hover:shadow-lg hover:shadow-zinc-900/5
        focus-within:ring-2 focus-within:ring-zinc-900 dark:focus-within:ring-zinc-100
        h-full flex flex-col
      "
    >
      {/* ===== Header ===== */}
      <div className="flex items-start justify-between gap-3">
        <span className="inline-flex items-center rounded-full border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-600 dark:text-zinc-400">
          {lib.category}
        </span>

        <span className="text-xs font-semibold tabular-nums text-zinc-400 dark:text-zinc-600">
          {lib.total}
        </span>
      </div>

      {/* ===== Title ===== */}
      <div className="mt-3">
        <h3
          className="
            text-base sm:text-lg font-semibold tracking-tight
            text-zinc-900 dark:text-zinc-100
            group-hover:text-zinc-700 dark:group-hover:text-zinc-300
            transition-colors
          "
        >
          {lib.name}
        </h3>
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-500 truncate">
          by {lib.author?.name}
        </p>
      </div>

      {/* ===== Spacer ===== */}
      <div className="flex-1" />

      {/* ===== Icon Preview ===== */}
      <div className="mt-4 grid grid-cols-5 gap-2">
        {lib.samples?.slice(0, 5).map((s) => (
          <div
            key={s}
            className="
              aspect-square rounded-lg
              border border-zinc-200 dark:border-zinc-800
              bg-zinc-50 dark:bg-zinc-950
              flex items-center justify-center
              transition-colors
              group-hover:bg-white dark:group-hover:bg-zinc-900
            "
          >
            <Icon
              icon={`${lib.key}:${s}`}
              className="h-5 w-5 sm:h-6 sm:w-6 text-zinc-700 dark:text-zinc-300"
            />
          </div>
        ))}
      </div>

      {/* ===== Hover Overlay (Desktop Hint) ===== */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-zinc-900/5 dark:ring-zinc-100/5 opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}

 function IconDetailDialog({
  icon,
  isOpen,
  onClose,
  initialColor,
}) {
  const [size, setSize] = useState([128]);
  const [color, setColor] = useState(initialColor || "currentColor");
  const [copied, setCopied] = useState(null);
  const iconRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setSize([128]);
      setColor(initialColor || "currentColor");
      setCopied(null);
    }
  }, [isOpen, initialColor]);

  if (!icon) return null;

  /* --------------------------------------------
   * COPY HANDLERS
   * ------------------------------------------ */
  const copySVG = async () => {
    const svg = iconRef.current?.querySelector("svg");
    if (!svg) return;

    const clone = svg.cloneNode(true);
    clone.setAttribute("width", size[0]);
    clone.setAttribute("height", size[0]);
    if (color !== "currentColor") {
      clone.setAttribute("fill", color);
    }

    await navigator.clipboard.writeText(clone.outerHTML);
    triggerCopied("svg");
  };

  const copyJSX = async () => {
    const jsx = `<Icon icon="${icon.fullName}" width={${size[0]}} height={${size[0]}} color="${color}" />`;
    await navigator.clipboard.writeText(jsx);
    triggerCopied("jsx");
  };

  const triggerCopied = (type) => {
    setCopied(type);
    setTimeout(() => setCopied(null), 1800);
  };

const triggerDownload = (blob, format, fileName) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = `${fileName}.${format}`;

  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};



  /* --------------------------------------------
   * DOWNLOAD LOGIC (SVG + PNG) — FIXED
   * ------------------------------------------ */
const downloadSVG = () => {
  const svg = iconRef.current?.querySelector("svg");
  if (!svg) return;

  const clone = svg.cloneNode(true);

  clone.setAttribute("width", size[0]);
  clone.setAttribute("height", size[0]);

  // Apply color correctly
  clone.style.color = color === "#currentColor" ? "currentColor" : color;

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);

  const blob = new Blob([svgString], { type: "image/svg+xml" });

  const fileName = `${icon.shortName}-${size[0]}px`;
  triggerDownload(blob, "svg", fileName);
};


const downloadPNG = () => {
  const svg = iconRef.current?.querySelector("svg");
  if (!svg) return;

  const clone = svg.cloneNode(true);

  clone.setAttribute("width", size[0]);
  clone.setAttribute("height", size[0]);

  // IMPORTANT: PNG needs a real color
  clone.style.color = color === "#currentColor" ? "#000000" : color;

  const serializer = new XMLSerializer();
  const svgString = serializer.serializeToString(clone);

  const svgBlob = new Blob([svgString], {
    type: "image/svg+xml;charset=utf-8",
  });

  const url = URL.createObjectURL(svgBlob);
  const img = new Image();

  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = size[0];
    canvas.height = size[0];

    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, size[0], size[0]);

    canvas.toBlob((blob) => {
      const fileName = `${icon.shortName}-${size[0]}px`;
      triggerDownload(blob, "png", fileName);
      URL.revokeObjectURL(url);
    });
  };

  img.src = url;
};



  /* --------------------------------------------
   * RENDER
   * ------------------------------------------ */
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="
          p-0 overflow-hidden
          max-w-[95vw] md:max-w-4xl
          bg-white dark:bg-zinc-900
          border border-zinc-200 dark:border-zinc-800
          rounded-2xl 
        "
      >
        <div className="flex flex-col md:flex-row h-[85vh] md:h-[600px]">
          {/* PREVIEW */}
          <div className="flex-1 flex flex-col items-center justify-center bg-zinc-50 dark:bg-zinc-950 relative">
            <div
              ref={iconRef}
              style={{ width: size[0], height: size[0], color }}
              className="transition-all"
            >
              <Icon
                icon={icon.fullName}
                width="100%"
                height="100%"
              />
            </div>
          </div>

          {/* CONTROLS */}
          <div className="w-full md:w-[380px] border-t md:border-t-0 md:border-l border-zinc-200 dark:border-zinc-800 flex flex-col">
            {/* HEADER */}
            <div className="p-5 border-b border-zinc-200 dark:border-zinc-800 flex justify-between">
              <div>
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-white break-all">
                  {icon.shortName}
                </h2>
                <p className="text-xs text-zinc-500">
                  {icon.fullName}
                </p>
              </div>
              
            </div>

            {/* BODY */}
            <ScrollArea className="flex-1 p-5 space-y-6">
              {/* SIZE */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-zinc-500">
                  <span>Size</span>
                  <span className="font-mono">{size[0]}px</span>
                </div>
                <Slider
                  value={size}
                  onValueChange={setSize}
                  min={16}
                  max={200}
                  step={4}
                />
              </div>

              {/* COLOR */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-500">
                  Color
                </label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={color === "currentColor" ? "#000000" : color}
                    onChange={(e) => setColor(e.target.value)}
                    className="h-10 w-10 rounded-md border"
                  />
                  <input
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 px-3 py-2 text-sm rounded-md border bg-zinc-50 dark:bg-zinc-950"
                  />
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          className="cursor-pointer"
                          variant="outline"
                          size="icon"
                          onClick={() => setColor("currentColor")}
                        >
                          <Droplet />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Reset</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </ScrollArea>

            {/* ACTIONS */}
            <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 space-y-2">
              <Button onClick={copySVG} className="w-full cursor-pointer">
                {copied === "svg" ? <Check /> : <Code />}
                <span className="ml-2">
                  {copied === "svg" ? "Copied SVG" : "Copy SVG"}
                </span>
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button className="cursor-pointer" variant="outline" onClick={downloadSVG}>
                  <Download className="mr-2 h-4 w-4" /> SVG
                </Button>
                <Button className="cursor-pointer" variant="outline" onClick={downloadPNG}>
                  <Download className="mr-2 h-4 w-4" /> PNG
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
