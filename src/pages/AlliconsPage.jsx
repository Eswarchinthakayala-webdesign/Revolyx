// src/pages/AllIconsPage.jsx
"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

import * as LucideIcons from "lucide-react";
import { Icon } from "@iconify/react";
import CollectionData from "../IconData/collections.json";
import { motion } from "framer-motion";
import clsx from "clsx";

import { Toaster, toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

import {
  Search as SearchIcon,
  List as ListIcon,
  Copy as CopyIcon,
  Filter as FilterIcon,
  ArrowDown as ArrowDownIcon,
  ArrowUp as ArrowUpIcon,
  Palette as PaletteIcon,
  Menu as MenuIcon,
  X as XIcon,
  Maximize2
} from "lucide-react";

import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Code, CodeBlock, CodeHeader } from "../components/animate-ui/components/animate/code";
import { showToast } from "../lib/ToastHelper";

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

/* ------------------------- LUCIDE ICON NAMES ------------------------- */
const allValidLucideIcons = Object.keys(LucideIcons)
  .filter((name) => !name.endsWith("Icon"))
  .slice(0, 3730);

/* ------------------------- ICONIFY LIBRARIES (metadata) ------------------------- */
const iconifyLibraries = Object.keys(CollectionData).reduce((acc, key) => {
  acc[`Iconify-${key}`] = { __iconify: true, prefix: key };
  return acc;
}, {});

const libraries = {
  Lucide: Object.fromEntries(allValidLucideIcons.map((n) => [n, LucideIcons[n]])),
  ...iconifyLibraries,
};

/* helper to get icon names for each library */
function getIconListForLib(libKey) {
  const lib = libraries[libKey];
  if (!lib) return [];
  // If it's an Iconify collection, try to return known icons from CollectionData if available
  if (lib.__iconify) {
    const meta = CollectionData[lib.prefix];
    if (meta && meta.icons) {
      return Object.keys(meta.icons).map((n) => `${lib.prefix}:${n}`);
    }
    // fallback to empty array (we don't have the full json loaded here)
    return [];
  }
  // For simple object libraries (like Lucide) keys are icon component names
  return Object.keys(lib).filter((n) => /^[A-Za-z0-9_-]/.test(n));
}

/* ------------------------- UI Component ------------------------- */
export default function AllIconsPage() {
    const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [activeLib, setActiveLib] = useState(searchParams.get("lib") || "Lucide");
  const [selectedIcon, setSelectedIcon] = useState(
    searchParams.get("icon")
      ? { lib: searchParams.get("lib") || "Lucide", name: searchParams.get("icon") }
      : null
  );
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [paletteKey, setPaletteKey] = useState("blue");
  const [subPaletteIndex, setSubPaletteIndex] = useState(0);
  const [sortAsc, setSortAsc] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [icons, setIcons] = useState([]);
  const ITEMS_PER_PAGE = 120;
  const iconNames = useMemo(() => getIconListForLib(activeLib), [activeLib]);
  
  useEffect(() => {
  const libParam = searchParams.get("lib");
  const iconParam = searchParams.get("icon");

  if (libParam && libParam !== activeLib) {
    setActiveLib(libParam);
  }

  if (iconParam && (!selectedIcon || selectedIcon.name !== iconParam)) {
    setSelectedIcon({ lib: libParam || "Lucide", name: iconParam });
  }
}, [searchParams]);


  useEffect(() => {
    const loadIcons = async () => {
      const lib = libraries[activeLib];
      if (!lib) return;

      // 🔹 If it’s a normal React icon lib (like Lucide)
      if (!lib.__iconify) {
        const libIcons = Object.keys(lib).filter((n) => /^[A-Za-z]/.test(n));
        setIcons(libIcons.map((name) => ({ lib: activeLib, name })));
        return;
      }

      // 🔹 If it’s an Iconify collection (dynamically import the JSON bundle if present)
      try {
        // NOTE: your data path was ../IconData/json/json/${prefix}.json in the original file.
        // keep the same path to avoid layout changes — if your actual path differs, update here.
        const data = await import(`../IconData/json/json/${lib.prefix}.json`);
        // imported module might be { default: { icons: {...}, prefix: '...', ... } } or the object itself
        const payload = data?.default || data;
        const names = Object.keys(payload.icons || {}).map((n) => ({ lib: activeLib, name: `${payload.prefix || lib.prefix}:${n}` }));
        setIcons(names);
      } catch (e) {
        console.error("❌ Failed to load Iconify collection:", lib.prefix, e);
        // fall back to using CollectionData meta (names might not be present)
        const meta = CollectionData[lib.prefix];
        if (meta && meta.icons) {
          const names = Object.keys(meta.icons).map((n) => ({ lib: activeLib, name: `${lib.prefix}:${n}` }));
          setIcons(names);
        } else {
          setIcons([]);
        }
      }
    };

    loadIcons();
  }, [activeLib]);

  // filter / search / sort
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    // 🔍 Filter icons by search
    let arr = icons.filter((i) => {
      const cleanName = i.name.includes(":")
        ? i.name.split(":")[1] // remove library prefix
        : i.name;
      return q ? cleanName.toLowerCase().includes(q) : true;
    });

    // 🔠 Sort alphabetically
    arr.sort((a, b) => {
      const nameA = a.name.includes(":") ? a.name.split(":")[1] : a.name;
      const nameB = b.name.includes(":") ? b.name.split(":")[1] : b.name;
      return sortAsc
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    });

    // 🧱 Add firstLetter for quick jump and cleanName
    return arr.map((icon) => {
      const cleanName = icon.name.includes(":")
        ? icon.name.split(":")[1]
        : icon.name;
      const firstLetter = cleanName && cleanName[0]
        ? (cleanName[0].toUpperCase().match(/[A-Z]/) ? cleanName[0].toUpperCase() : "_")
        : "_"; // non-alphabetic group
      return {
        ...icon,
        cleanName,
        firstLetter,
      };
    });
  }, [icons, search, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));
  useEffect(() => {
    if (page > totalPages) setPage(1);
  }, [totalPages, page]);

  const paginated = useMemo(() => {
    const start = (page - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, page]);

  // grouped alphabetically for quick categories (based on filtered.cleanName)
  const grouped = useMemo(() => {
    const map = {};

    filtered.forEach((it) => {
      const cleanName = it.cleanName || (it.name.includes(":") ? it.name.split(":")[1] : it.name);
      const letter = cleanName && cleanName[0] ? cleanName[0].toUpperCase() : "#";
      if (!map[letter]) map[letter] = [];
      map[letter].push({
        ...it,
        cleanName,
      });
    });

    // 🔡 Sort alphabetically (A → Z)
    return Object.fromEntries(
      Object.entries(map).sort(([a], [b]) => a.localeCompare(b))
    );
  }, [filtered]);

  /* palette helpers */
  const palette = COLOR_THEMES[paletteKey] || COLOR_THEMES.blue;
  const subColor = palette[subPaletteIndex % palette.length];

  /* render icon safely */
  function renderIconPreview(iconObj, size = 28, color = "currentColor") {
    if (!iconObj) return null;
    const { lib, name } = iconObj;

    // Iconify collections: lib like "Iconify-prefix"
    if (lib && lib.startsWith("Iconify-")) {
      // name is expected to be "prefix:iconname"
      return <Icon icon={name} width={size} height={size} color={color} />;
    }

    // Lucide case (React component)
    if (lib === "Lucide") {
      const IconComp = LucideIcons[name];
      return IconComp ? <IconComp size={size} color={color} /> : null;
    }

    // fallback: try treating as Iconify string
    try {
      return <Icon icon={name} width={size} height={size} color={color} />;
    } catch (e) {
      return null;
    }
  }

  /* preview & code panel actions */
function handleSelect(icon) {
  setSelectedIcon(icon);
  showToast("success", `Selected ${icon.lib}: ${icon.name}`);

  // 🆕 Update URL
  setSearchParams({ lib: icon.lib, icon: icon.name });
  navigate(`?lib=${icon.lib}&icon=${icon.name}`);
}


  function copySource(icon) {
    if (!icon) return;
    const isIconify = icon.lib === "Iconify" || icon.lib.startsWith("Iconify-");
    const snippet = isIconify
      ? `<Icon icon="${icon.name}" width={24} height={24} color="${subColor}" />`
      : `<${icon.lib} icon="${icon.name}" size={24} color="${subColor}" />`;
    navigator.clipboard.writeText(snippet);
    showToast("success", "Icon JSX copied!");
  }

  // keyboard: quick open suggestions on slash or ctrl+k
  useEffect(() => {
    function onKey(e) {
      if ((e.key === "/" && !e.metaKey && !e.ctrlKey) || (e.key === "k" && (e.ctrlKey || e.metaKey))) {
        setShowSuggestions(true);
        const el = document.getElementById("icon-search-input");
        if (el) el.focus();
        e.preventDefault();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /* mobile sheet ref */
  const searchRef = useRef(null);

  /* small UI helpers */
  function renderPaletteSwatches() {
    return (
      <div className="flex gap-2 items-center flex-wrap">
        {palette.map((c, i) => (
          <button
            key={c + i}
            title={c}
            className={clsx(
              "w-8 h-8 rounded-md border cursor-pointer shadow-sm transition-transform",
              i === subPaletteIndex ? "ring-2 ring-offset-1 ring-zinc-400/30 scale-105" : "hover:scale-105"
            )}
            style={{ background: c }}
            onClick={() => {
              setSubPaletteIndex(i);
              showToast("success", <div className="max-w-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md flex-shrink-0"
                    style={{ background: c }} />
                  <div>{`Color set to ${c}`}</div>
                </div>
              </div>);
            }}
          />
        ))}
      </div>
    );
  }

  /* responsive sheet for mobile */
  const SidebarSheet = (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" className="lg:hidden cursor-pointer">
          <MenuIcon className="w-5 h-5" />
        </Button>
      </SheetTrigger>

      <SheetContent side="left" className="w-[300px] p-0">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ListIcon className="w-4 h-4" />
              <div className="font-medium">Icons</div>
            </div>
          </div>

          <ScrollArea className="h-[68vh] pr-2">
            <div className="flex flex-col gap-2">
              {Object.keys(libraries).sort().map((libKey) => {
                const lib = libraries[libKey];
                const displayName = libKey.startsWith("Iconify-")
                  ? libKey.replace("Iconify-", "")
                  : libKey;

                const count =
                  lib.__iconify && CollectionData[lib.prefix]
                    ? CollectionData[lib.prefix].total || 0
                    : getIconListForLib(libKey).length;

                return (
                  <button
                    key={libKey}
                    onClick={() => {
                      setActiveLib(libKey);
                      setPage(1);
                      setSearch("");
                      showToast("success", `Selected Library: ${displayName}`);
                      setSearchParams({ lib: libKey });
                      navigate(`?lib=${libKey}`);
                      setSelectedIcon(null);
                    }}
                    className={clsx(
                      "w-full text-left cursor-pointer px-3 py-2 rounded-md transition-colors flex items-center justify-between",
                      activeLib === libKey
                        ? "bg-zinc-200/80 dark:bg-zinc-500/30 border border-indigo-500/10"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800/30"
                    )}
                  >
                    <span>{displayName}</span>
                    <span className="text-xs opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </SheetContent>
    </Sheet>
  );

  return (
    <div className="min-h-screen max-w-8xl mx-auto py-8 px-4 md:px-8">
      <Toaster richColors />

      {/* header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3">
            Revolyx Icons
          </h1>
          <p className="text-sm opacity-70 mt-1">Browse, preview and copy icon JSX with palettes & code.</p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* mobile sheet trigger */}
          {SidebarSheet}

          <div className="flex items-center gap-2 border rounded-md px-2 py-1 bg-white/60 dark:bg-zinc-900">
            <SearchIcon className="w-4 h-4 opacity-60" />
            <Input
              id="icon-search-input"
              ref={searchRef}
              placeholder="Search icons (click to show suggestions)"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 120)}
              className="border-0 shadow-none"
            />
          </div>

          <Select value={paletteKey} onValueChange={(v) => { setPaletteKey(v); setSubPaletteIndex(0); }}>
            <SelectTrigger className="w-40 cursor-pointer">
              <SelectValue placeholder="Palette" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(COLOR_THEMES).map((k) => (
                <SelectItem className="cursor-pointer" key={k} value={k}>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-sm" style={{ background: `linear-gradient(90deg, ${COLOR_THEMES[k].join(",")})` }} />
                    <div className="text-sm">{k}</div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="hidden md:flex items-center gap-2 ml-2">
            <Button size="sm" className='cursor-pointer' variant="outline" onClick={() => setSortAsc((s) => !s)}>
              {sortAsc ? <><ArrowDownIcon className="w-4 h-4 mr-1" /> A→Z</> : <><ArrowUpIcon className="w-4 h-4 mr-1" /> Z→A</>}
            </Button>

            <Button size="sm" className="cursor-pointer" variant="ghost" onClick={() => { setPage(1); setSearch(""); toast("Filters reset"); }}>
              <FilterIcon className="w-4 h-4 mr-1" /> Reset
            </Button>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* left sidebar (desktop) */}
        <aside className="lg:col-span-1 hidden lg:block border rounded-xl p-4 bg-white/70 dark:bg-zinc-950/60">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold">Libraries</div>
            <Badge>{Object.keys(libraries).length}</Badge>
          </div>

          <ScrollArea className="h-[68vh] pr-2">
            <div className="flex flex-col gap-2">
              {Object.keys(libraries).sort().map((libKey) => {
                const lib = libraries[libKey];
                const displayName = libKey.startsWith("Iconify-")
                  ? libKey.replace("Iconify-", "")
                  : libKey;

                const count =
                  lib.__iconify && CollectionData[lib.prefix]
                    ? CollectionData[lib.prefix].total || 0
                    : getIconListForLib(libKey).length;

                return (
                  <button
                    key={libKey}
                    onClick={() => {
                      setActiveLib(libKey);
                      setPage(1);
                      setSearch("");
                      showToast("success", `Selected Library: ${displayName}`);
                      setSearchParams({ lib: libKey });
                       navigate(`?lib=${libKey}`);
                       setSelectedIcon(null);
                    }}
                    className={clsx(
                      "w-full text-left cursor-pointer px-3 py-2 rounded-md transition-colors flex items-center justify-between",
                      activeLib === libKey
                        ? "bg-zinc-200/80 dark:bg-zinc-500/30 border border-indigo-500/10"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800/30"
                    )}
                  >
                    <span>{displayName}</span>
                    <span className="text-xs opacity-60">{count}</span>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </aside>

        {/* center + right */}
        <section className="lg:col-span-3 space-y-4">
          {/* top row: preview + actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* big preview */}
            <Card className="lg:col-span-2 overflow-hidden border bg-white/70 dark:bg-zinc-950/60">
              <CardHeader className="flex items-center justify-between p-4">
                <CardTitle className="flex items-center gap-2">
                  <ListIcon className="w-5 h-5" /> Preview
                </CardTitle>

                <div className="flex items-end flex-col  gap-2">
                  {renderPaletteSwatches()}
                  <div className="mt-3 text-xs  text-wrap text-zinc-500 dark:text-zinc-400">
                    Click swatch to change color
                  </div>
                </div>

              </CardHeader>

              <CardContent className="p-4">
                {selectedIcon ? (
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-none w-full md:w-50 h-50 rounded-lg border flex items-center justify-center">
                      <div style={{ color: subColor }}>
                        {renderIconPreview(selectedIcon, 48, subColor) || <div className="text-xs opacity-60">Preview unavailable</div>}
                      </div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="secondary"
                            className="absolute cursor-pointer bottom-3 right-3 text-xs flex items-center gap-1 px-2 py-1.5 bg-white/40 dark:bg-zinc-800/60 backdrop-blur-md border border-zinc-300/50 dark:border-zinc-700/50 hover:scale-105 transition-all"
                          >
                            <Maximize2 className="w-3.5 h-3.5" />
                            View Full
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px] md:max-w-[700px] bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-2xl">
                          <DialogHeader>
                            <DialogTitle className="text-center text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                              Full Icon Preview
                            </DialogTitle>
                          </DialogHeader>
                          <div className="flex items-center justify-center p-6">
                            <motion.div
                              key={`icon-full-${selectedIcon.lib}-${selectedIcon.name}-${subColor}`}
                              initial={{ opacity: 0, scale: 0.9 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ duration: 0.35 }}
                            >
                              {renderIconPreview(selectedIcon, 100, subColor) || <div className="text-xs opacity-60">Preview unavailable</div>}
                            </motion.div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>

                    <div className="overflow-auto">
                      <div className="flex items-center flex-wrap justify-between">
                        <div>
                          <div className="text-lg font-semibold">{selectedIcon.name}</div>
                          <div className="text-sm opacity-60">{selectedIcon.lib}</div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button size="sm" className="cursor-pointer" onClick={() => copySource(selectedIcon)}><CopyIcon className="w-4 h-4 mr-1 cursor-pointer" /> Copy JSX</Button>

                        </div>
                      </div>

                      <div className="mt-4 flex  text-sm opacity-80">
                        <Code
                          key={`${0.1}-${10}-${true}-${true}`}
                          className="w-full h-full"
                          code={selectedIcon.lib === "Iconify" || selectedIcon.lib.startsWith("Iconify-")
                            ? `<Icon icon="${selectedIcon.name}" width={24} height={24} color="${subColor}" />`
                            : `<${selectedIcon.lib} icon="${selectedIcon.name}" size={24} color="${subColor}" />`}
                        >
                          <CodeHeader copyButton>
                            Demo.jsx
                          </CodeHeader>

                          <CodeBlock
                            cursor={true}
                            lang="js"
                            writing={true}
                            duration={10}
                            delay={0.1}
                          />
                        </Code>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center text-sm opacity-60">Select an icon from the list to preview</div>
                )}
              </CardContent>
            </Card>

            {/* quick stats / filters */}
            <Card className="overflow-hidden border bg-white/70 dark:bg-zinc-950/60">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>

              <CardContent>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs">Selected palette</Label>
                    <div className="text-sm font-medium">{paletteKey}</div>
                  </div>

                  <div>
                    <Label className="text-xs">Subcolor</Label>
                    <div className="mt-2">{renderPaletteSwatches()}</div>
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button className="cursor-pointer" onClick={() => { setSearch(""); setPage(1); setSelectedLetter(null); showToast("success", "Search cleared"); }} size="sm">Clear Search</Button>
                    <Button className='cursor-pointer' onClick={() => { setSelectedIcon(null); showToast("success", "Selection cleared"); }} size="sm" variant="outline">Clear Selection</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* gallery grid */}
          <Card className="overflow-hidden border bg-white/70 dark:bg-zinc-950/60">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ListIcon className="w-4 h-4" /> Gallery
                </div>

                <div className="flex items-center gap-2">
                  <Badge>{filtered.length}</Badge>
                  <div className="text-xs opacity-60">Page {page} / {totalPages}</div>
                </div>
              </CardTitle>
            </CardHeader>

            <CardContent>
              {/* grid of icons */}
              <ScrollArea className="h-[60vh]">
                <div className="grid grid-cols-4 sm:grid-cols-8 md:grid-cols-10 p-2 gap-3">
                  {paginated.map((ic) => (
                    <motion.div
                      key={`${ic.lib}:${ic.name}`}
                      onClick={() => handleSelect(ic)}
                      whileHover={{ scale: 1.02 }}
                      className={clsx(
                        `flex flex-col relative group items-center justify-center  p-3  group cursor-pointer rounded-2xl border transition-all duration-300 hover:shadow-lg hover:scale-[1.03]
                       bg-white/80 backdrop-blur-sm border-zinc-200
                          dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-950 dark:border-zinc-800
                         hover:border-zinc-400 dark:hover:border-zinc-600`,
                        selectedIcon && selectedIcon.lib === ic.lib && selectedIcon.name === ic.name ? "ring-2 ring-zinc-400/20" : "hover:bg-zinc-100 dark:hover:bg-zinc-800/40"
                      )}
                    >
                      <div className="absolute inset-0 flex items-end justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                        <div
                          className="bg-black text-white text-xs px-2 py-1 rounded-md mb-2"
                          style={{ background: subColor }}
                        >
                          {ic.name.includes(":") ? ic.name.split(":")[1] : ic.name}
                        </div>
                      </div>
                      <div className="w-10 h-10 flex items-center justify-center mb-2" style={{ color: subColor }}>
                        {renderIconPreview(ic, 20, subColor) || <div className="w-6 h-6 bg-zinc-200 dark:bg-zinc-700 rounded animate-pulse" />}
                      </div>
                      <div className="text-[10px] text-center opacity-80 group-hover:opacity-0 truncate w-full"> {ic.name.includes(":") ? ic.name.split(":")[1] : ic.name}</div>
                    </motion.div>
                  ))}
                </div>
              </ScrollArea>

              {/* pagination */}
              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                  <Button size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Next</Button>
                </div>

                <div className="text-xs opacity-70">Showing {paginated.length} icons</div>
              </div>
            </CardContent>
          </Card>

          {/* alphabetized quick jump */}
          <div className="flex flex-wrap gap-2 items-center">
            {Object.keys(grouped).map((letter) => (
              <button
                key={letter}
                onClick={() => {
                  setSelectedLetter(letter);
                  // find by cleanName's first letter (previous bug: used name[0] which could contain prefix)
                  const idx = filtered.findIndex(
                    (f) => (f.cleanName && f.cleanName[0] && f.cleanName[0].toUpperCase()) === letter
                  );
                  if (idx >= 0) {
                    setPage(Math.floor(idx / ITEMS_PER_PAGE) + 1);
                  }
                }}
                className={clsx(
                  "px-2 py-1 rounded cursor-pointer text-sm transition-colors",
                  selectedLetter === letter
                    ? "bg-red-500 text-white dark:bg-red-600"
                    : "bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700"
                )}
              >
                {letter}
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
