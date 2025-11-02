// src/pages/IconsPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import * as LucideIcons from "lucide-react";
import clsx from "clsx";
import * as RadixIcons from "@radix-ui/react-icons";
/* shadcn/ui imports (adjust paths if necessary) */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";

/* notifications */
import { Toaster, toast } from "sonner";

/* syntax highlighter (Prism) */
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

/* framer motion */
import { motion } from "framer-motion";

/* theme hook (user requested) */
import { useTheme } from "../components/theme-provider";
import IconSidebar from "../components/IconSidebar";
import { IconShowcase } from "../components/IconShowcase";
import { showToast } from "../lib/ToastHelper";

/* --- color themes (from user) --- */
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

/* --- constants --- */
const ICONS_PER_PAGE = 500;

/* --- generate source code string for an icon --- */
function generateIconSource(name, color, size) {
  const c = color || "#3b82f6";
  const s = size || 32;
  return `import { ${name} } from "lucide-react";

function Demo() {
  return <${name} size={${s}} color="${c}" />;
}

export default Demo;`;
}

/* --- small spinner / skeleton --- */
function SmallSpinner({ size = 18 }) {
  return (
    <div className="inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <div className="animate-spin rounded-full border border-transparent border-t-[2px] border-current w-3 h-3" />
    </div>
  );
}

/* --- LazyIcon: shows placeholder until icon is in view --- */
function LazyIcon({ name, size = 24, color, className = "", onHoverTitle = true }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const obs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      });
    });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const Icon = LucideIcons[name];

  return (
    <div ref={ref} className={clsx("relative", className)} title={onHoverTitle ? name : undefined}>
      {!visible && (
        <div className="w-full h-full flex items-center justify-center p-2">
          <div className="w-6 h-6 rounded-full animate-pulse bg-zinc-700/30" />
        </div>
      )}
      {visible && Icon ? <Icon size={size} color={color} /> : visible && <div className="text-xs opacity-60">?</div>}
    </div>
  );
}

/* --- Palette preview component --- */
function PalettePreview({ paletteArr, selectedIndex, onSelect }) {
  return (
    <div className="flex items-center gap-3">
      {paletteArr.map((c, i) => (
        <button
          key={c}
          onClick={() => onSelect(i)}
          className={clsx(
            "w-8 h-6 rounded-sm ring-1 ring-black/10",
            i === selectedIndex ? "ring-2 ring-offset-1" : ""
          )}
          style={{ background: c }}
          aria-label={`palette-${i}`}
        />
      ))}
    </div>
  );
}

/* --- Main page component --- */
export default function IconsPage() {
  const allValidIcons = Object.keys(LucideIcons)
    .filter((name) => !name.endsWith("Icon"))
    .slice(0, 3730);
const allValidRadixIcons = Object.keys(RadixIcons)
  .filter((name) => name.endsWith("Icon")) // ✅ keep only icons
  .slice(0, 4030);
 // not necessary but okay

console.log(allValidRadixIcons.length); // should show 50+ icons

  const usableIcons = allValidIcons.slice(0, 3730);

  const { theme } = useTheme();
  // compute isDark per user instruction (note: uses window.matchMedia so only runs in browser)
  const getIsDark = useCallback(() => {
    try {
      return (
        theme === "dark" ||
        (theme === "system" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches)
      );
    } catch (e) {
      return theme === "dark";
    }
  }, [theme]);

  const [isDark, setIsDark] = useState(() => (typeof window === "undefined" ? true : getIsDark()));

  useEffect(() => {
    setIsDark(getIsDark());
  }, [theme, getIsDark]);

  const [paletteName, setPaletteName] = useState("blue");
  const [subPaletteIdx, setSubPaletteIdx] = useState(0);
  const [size, setSize] = useState(48);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortMode, setSortMode] = useState("asc");
  const [selectedIconKey, setSelectedIconKey] = useState(usableIcons[0] || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [showSource, setShowSource] = useState(true);

  const inputRef = useRef(null);

  useEffect(() => {

    const accent = (COLOR_THEMES[paletteName] || COLOR_THEMES.blue)[subPaletteIdx % (COLOR_THEMES[paletteName] || COLOR_THEMES.blue).length];
  }, [isDark, paletteName, subPaletteIdx]);

  /* filter & sort icons */
  const filtered = useMemo(() => {
    let arr = usableIcons.filter((name) => name.toLowerCase().includes(searchTerm.toLowerCase()));
    arr = arr.sort((a, b) => (sortMode === "asc" ? a.localeCompare(b) : b.localeCompare(a)));
    return arr;
  }, [usableIcons, searchTerm, sortMode]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / ICONS_PER_PAGE));
  const paginatedIcons = filtered.slice((currentPage - 1) * ICONS_PER_PAGE, currentPage * ICONS_PER_PAGE);

  const palette = COLOR_THEMES[paletteName] || COLOR_THEMES.blue;
  const accent = palette[subPaletteIdx % palette.length];

  function handleSelectIcon(key) {
    setSelectedIconKey(key);
    setLoadingPreview(true);
    // update URL without full reload
    try {
      const newUrl = `${window.location.pathname}?icon=${encodeURIComponent(key)}&page=${currentPage}`;
      window.history.pushState({}, "", newUrl);
    } catch (e) {}

    // simulate a short load for preview to show skeleton
    setTimeout(() => {
      setLoadingPreview(false);
  showToast("success",`${key} selected`);
    }, 240);
  }

  function renderIconPreview(key, sizePx = size) {
    if (!key) return <div className="p-6">No icon</div>;
    const Icon = LucideIcons[key];
    if (!Icon) return <div className="p-6">Unavailable</div>;
    return (
      <div className="flex items-center justify-center p-6">
        <Icon size={sizePx} color={accent} />
      </div>
    );
  }

  function renderThumbnail(key) {
    return (
      <div className="w-full h-18 flex items-center justify-center">
        <LazyIcon name={key} size={20} color={accent} />
      </div>
    );
  }

  function copySource() {
    const src = generateIconSource(selectedIconKey, accent, size);
    navigator.clipboard?.writeText(src).then(() => showToast("success","Source copied to clipboard"));
  }

  /* quick page navigation helpers */
  function goToPage(n) {
    const p = Math.min(Math.max(1, n), totalPages);
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, sortMode]);

  // ensure clicking a remaining icon scrolls to top and selects
  function onClickRemaining(name) {
    handleSelectIcon(name);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="pb-20" >
        
      <Toaster richColors />
      <div className="overflow-hidden max-w-8xl px-4 py-8 sm:px-6 md:px-8 mx-auto ">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3">

              Revolyx Icons
            </h1>
            <p className="text-sm opacity-80 mt-1">Explore 3,730 Lucide icons</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <Select value={paletteName} onValueChange={(v) => setPaletteName(v)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Palette" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(COLOR_THEMES).map((k) => (
                  <SelectItem key={k} value={k}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-4 rounded-sm" style={{ background: `linear-gradient(90deg, ${COLOR_THEMES[k].join(",")})` }} />
                      <div className="text-sm">{k}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>



            {/* mobile sheet trigger for sidebar */}
 

          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left sheet: icon list (visible on lg+) */}
          <aside className=" lg:block lg:col-span-1">
            <IconSidebar
            currentPage={currentPage}
            totalPages={totalPages}
            paginatedIcons={paginatedIcons}
            usableIcons={usableIcons}
            selectedIconKey={selectedIconKey}
            handleSelectIcon={handleSelectIcon}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            showSuggestions={showSuggestions}
            setShowSuggestions={setShowSuggestions}
            setSortMode={setSortMode}
            goToPage={goToPage}
            inputRef={inputRef}
            renderThumbnail={renderThumbnail}
            />
          </aside>

          {/* Middle+Right: preview and controls */}
          <section className="lg:col-span-3 space-y-4">
      <IconShowcase
          selectedIconKey={selectedIconKey}
          renderIconPreview={renderIconPreview}
          generateIconSource={generateIconSource}
          palette={palette}
          subPaletteIdx={subPaletteIdx}
          setSubPaletteIdx={setSubPaletteIdx}
          paletteName={paletteName}
          isDark={isDark}
          size={size}
          setSize={setSize}
        />

            {/* Remaining icons grid (current page only) */}
            <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 gap-3">
              {paginatedIcons.map((name) => (
                <Card key={name} className="group cursor-pointer rounded-2xl border transition-all duration-300 hover:shadow-lg hover:scale-[1.03]
                bg-white/80 backdrop-blur-sm border-zinc-200
                dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-950 dark:border-zinc-800
                hover:border-zinc-400 dark:hover:border-zinc-600"  onClick={() => onClickRemaining(name)}>
                  <CardContent className="">
                    <div className="flex flex-col items-center">
                      <div className="w-full flex items-center justify-center relative">
                        <div className="group w-full h-full flex items-center justify-center">
                          {/* lazy loaded icon */}
                          <LazyIcon name={name} size={24} color={accent} />

                          {/* hover overlay showing name */}
                          <div className="absolute inset-0 flex items-end justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            <div className="bg-black text-white text-xs px-2 py-1 rounded-md mb-2" style={{background:palette[2]}}>{name}</div>

                          </div>
                           <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="absolute inset-0 rounded-xl blur-lg bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 dark:from-cyan-500/10 dark:to-fuchsia-500/10" />
                  </div>
                        </div>
                      </div>
                      
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* page controls */}
            <div className="flex items-center justify-center gap-3 mt-2">
              <Button size="sm" className="cursor-pointer" onClick={() => goToPage(1)} disabled={currentPage === 1}>First</Button>
              <Button size="sm" className="cursor-pointer" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>Prev</Button>
              <div className="text-sm">Page {currentPage} of {totalPages}</div>
              <Button size="sm" className="cursor-pointer" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>Next</Button>
              <Button size="sm" className="cursor-pointer" onClick={() => goToPage(totalPages)} disabled={currentPage === totalPages}>Last</Button>
            </div>
          </section>
        </main>

       
      </div>
    </div>
  );
}
