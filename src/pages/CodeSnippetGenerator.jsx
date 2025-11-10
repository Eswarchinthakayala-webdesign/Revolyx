// RevolyxSnippetPage.jsx
"use client"; // if using Next.js app router; remove if plain CRA
import React, { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import * as prismThemes from "react-syntax-highlighter/dist/esm/styles/prism";
import { toPng, toSvg } from "html-to-image";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { showToast } from "../lib/ToastHelper";
import { Save, Download, Expand, FileCode, Trash2,  X, Maximize2,Loader2, Minimize2, ImageDown, Sparkles, FileDown, Search } from "lucide-react";

/*
  Notes:
  - prismThemes is an object with many built-in themes (e.g., okaidia, atomDark, tomorrow, materialLight, oneDark).
  - html-to-image handles SVG/PNG conversion of DOM nodes (works for most browsers).
  - Tailwind classes used for layout and responsive design.
*/

/* ---------- Color palettes (user provided) ---------- */
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

/* ---------- Language templates ---------- */
const TEMPLATES = {
  javascript: `// JavaScript example
const greet = (name) => {
  console.log(\`Hello, \${name}!\`);
};

greet("Revolyx");`,
  typescript: `// TypeScript example
function add(a: number, b: number): number {
  return a + b;
}
console.log(add(2, 3));`,
  python: `# Python example
def greet(name):
    print(f"Hello, {name}!")

greet("Revolyx")`,
  java: `// Java example
public class Hello {
  public static void main(String[] args) {
    System.out.println("Hello, Revolyx!");
  }
}`,
  cpp: `// C++ example
#include <iostream>
int main() {
  std::cout << "Hello, Revolyx!" << std::endl;
  return 0;
}`,
  html: `<!-- HTML example -->
<!doctype html>
<html>
  <head><meta charset="utf-8"><title>Snippet</title></head>
  <body>
    <h1>Hello Revolyx</h1>
  </body>
</html>`,
  css: `/* CSS example */
body {
  background: linear-gradient(135deg, #f0f4f8 0%, #dbeafe 100%);
  font-family: system-ui, sans-serif;
}`,
  sql: `-- SQL example
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) NOT NULL
);`,
};

/* ---------- Helper utils ---------- */
const STORAGE_KEY = "revolyx:snippets:v1";

function readSavedSnippets() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn("failed read snippets", e);
    return [];
  }
}
function writeSavedSnippets(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("failed write snippets", e);
  }
}

/* ---------- Small UI bits ---------- */
const PrismThemeNames = Object.keys(prismThemes).filter(Boolean);
/* keep a small curated set for preview thumbnails */
const PREVIEW_THEMES = Object.keys(prismThemes).filter(Boolean);

/* ---------- Main component ---------- */
export default function RevolyxSnippetPage() {
  // form state
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(TEMPLATES.javascript);
  const [title, setTitle] = useState("My Snippet");
  const [filename, setFilename] = useState("snippet.js");
  const [themeKey, setThemeKey] = useState("oneDark"); // prism theme
  const [colorThemeKey, setColorThemeKey] = useState("slate"); // background/palette
  const [customBg, setCustomBg] = useState(""); // if set, overrides palette background
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewExpanded, setIsPreviewExpanded] = useState(true);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [savedSnippets, setSavedSnippets] = useState(() => readSavedSnippets());
  const [selectedSavedId, setSelectedSavedId] = useState(null);
  const [searchSaved, setSearchSaved] = useState("");
  const previewRef = useRef(null);
  const previewContainerRef = useRef(null);
   const [isThumbnailsVisible, setIsThumbnailsVisible] = useState(true);
  /* URL sync: update query params when main fields change */
  useEffect(() => {
    // Debounced-ish pushState to keep URL in sync
    const qs = new URLSearchParams();
    qs.set("lang", language);
    qs.set("theme", themeKey);
    qs.set("palette", colorThemeKey);
    if (customBg) qs.set("bg", customBg);
    qs.set("title", title);
    const url = `${location.pathname}?${qs.toString()}`;
    window.history.replaceState({}, "", url);
  }, [language, themeKey, colorThemeKey, customBg, title]);

  /* on mount: load possible query params into state */
  useEffect(() => {
    const qs = new URLSearchParams(location.search);
    const qLang = qs.get("lang");
    const qTheme = qs.get("theme");
    const qPalette = qs.get("palette");
    const qBg = qs.get("bg");
    const qTitle = qs.get("title");
    if (qLang && TEMPLATES[qLang]) setLanguage(qLang);
    if (qTheme && prismThemes[qTheme]) setThemeKey(qTheme);
    if (qPalette && COLOR_THEMES[qPalette]) setColorThemeKey(qPalette);
    if (qBg) setCustomBg(qBg);
    if (qTitle) setTitle(qTitle);
  }, []);

  /* Save snippet to localStorage */
  const handleSave = useCallback(() => {
    const item = {
      id: Date.now().toString(),
      title: title || "Untitled",
      filename: filename || `snippet.${language}`,
      language,
      code,
      themeKey,
      colorThemeKey,
      customBg,
      createdAt: new Date().toISOString(),
    };
    const newList = [item, ...savedSnippets].slice(0, 200); // cap to avoid huge storage
    setSavedSnippets(newList);
    writeSavedSnippets(newList);
    setSelectedSavedId(item.id);
  }, [title, filename, language, code, themeKey, colorThemeKey, customBg, savedSnippets]);

  /* Load a saved snippet into editor */
  const handleLoadSaved = useCallback((id) => {
    const s = savedSnippets.find((x) => x.id === id);
    if (!s) return;
    setTitle(s.title);
    setFilename(s.filename);
    setLanguage(s.language);
    setCode(s.code);
    setThemeKey(s.themeKey || themeKey);
    setColorThemeKey(s.colorThemeKey || colorThemeKey);
    setCustomBg(s.customBg || "");
    setSelectedSavedId(id);
  }, [savedSnippets, themeKey, colorThemeKey]);

  /* Delete saved */
  const handleDeleteSaved = useCallback((id) => {
    const newList = savedSnippets.filter((x) => x.id !== id);
    setSavedSnippets(newList);
    writeSavedSnippets(newList);
    if (selectedSavedId === id) setSelectedSavedId(null);
  }, [savedSnippets, selectedSavedId]);

  /* Quick action: generate snippet from template */
  const applyTemplate = (lang) => {
    setLanguage(lang);
    setCode(TEMPLATES[lang] || "");
    setFilename(`snippet.${lang === "javascript" ? "js" : lang}`);
  };

  /* Loader simulation (for UX) */
  const simulateLoad = async (cb) => {
    setIsLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 600)); // small delay to show loader
      cb && cb();
    } finally {
      setIsLoading(false);
    }
  };

  /* Export functions */
  const exportToPng = async (name = filename || "snippet.png") => {
    if (!previewRef.current) return;
    try {
      setIsLoading(true);
      // scale up for better DPI
      const dataUrl = await toPng(previewRef.current, { cacheBust: true, pixelRatio: 2 });
      const blob = await (await fetch(dataUrl)).blob();
      saveAs(blob, name.endsWith(".png") ? name : `${name}.png`);
    } catch (e) {
      console.error("export to png failed", e);
      alert("Export to PNG failed: " + (e.message || e));
    } finally {
      setIsLoading(false);
    }
  };

  const exportToSvg = async (name = filename || "snippet.svg") => {
    if (!previewRef.current) return;
    try {
      setIsLoading(true);
      const svgData = await toSvg(previewRef.current, { cacheBust: true });
      const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
      saveAs(blob, name.endsWith(".svg") ? name : `${name}.svg`);
    } catch (e) {
      console.error("export to svg failed", e);
      alert("Export to SVG failed: " + (e.message || e));
    } finally {
      setIsLoading(false);
    }
  };

  /* theme palette preview */
  const palette = COLOR_THEMES[colorThemeKey] || COLOR_THEMES.slate;
  const previewBackground = customBg || palette[4] || "#0f172a";

  /* filtered saved list searching */
  const filteredSaved = savedSnippets.filter((s) =>
    s.title.toLowerCase().includes(searchSaved.toLowerCase()) ||
    (s.filename || "").toLowerCase().includes(searchSaved.toLowerCase()) ||
    (s.language || "").toLowerCase().includes(searchSaved.toLowerCase())
  );

  /* small theme preview component */
  const ThemeThumb = ({ tKey, onClick }) => {
    const p = COLOR_THEMES[tKey];
    return (
      <button
        onClick={() => {onClick(tKey); window.scrollTo({ top: 0, behavior: "smooth" });}}
        className="w-20 h-12 cursor-pointer rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-700 shadow-sm"
        title={tKey}
      >
        <div className="h-full w-full flex">
          {p.map((c, i) => (
            <div key={i} style={{ background: c }} className="flex-1" />
          ))}
        </div>
      </button>
    );
  };

  /* small code preview for theme thumbnails (tiny) */
  const TinyCodePreview = ({ themeName, sample }) => (
    <div className="flex flex-col gap-1 overflow-hidden items-start">
     
      <div className="w-full  rounded-md overflow-hidden border dark:border-zinc-700">
        <SyntaxHighlighter
          language={language}
          style={prismThemes[themeName] || prismThemes.oneDark}
          customStyle={{ margin: 0, padding: "8px", height: "100%" }}
        >
          {sample}
        </SyntaxHighlighter>
      </div>
    </div>
  );

  /* small helper to render top-left mac-style dots */
  const WindowDots = () => (
    <div className="flex gap-2 items-center">
      <span className="w-3 h-3 rounded-full bg-amber-400 shadow-[0_0_0_4px_rgba(234,179,8,0.06)]" />
      <span className="w-3 h-3 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.06)]" />
      <span className="w-3 h-3 rounded-full bg-sky-400 shadow-[0_0_0_4px_rgba(14,165,233,0.06)]" />
    </div>
  );

  /* keyboard shortcut: save with ctrl/cmd+s */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSave]);

  /* Render */
  return (
    <div className="p-4 md:p-6 lg:p-8 overflow-hidden max-w-8xl mx-auto">
      <div className="max-w-8xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Controls & saved snippets (cols 1-4 on lg) */}
        <div className="lg:col-span-3 space-y-4">
<motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5 bg-gradient-to-b from-white/70 to-zinc-50/30 dark:from-zinc-900/60 dark:to-zinc-950/40 border border-zinc-200/70 dark:border-zinc-800/60 shadow-lg backdrop-blur-md"
      >
        <div className="flex items-start flex-wrap justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <FileCode className="w-4 h-4 " /> Snippet Controls
            </h2>
         
          </div>
          <div className="flex items-center gap-2">
            <Button
            className="cursor-pointer"
              variant="outline"
              size="sm"
              onClick={() => setIsPreviewExpanded((s) => !s)}
            >
              <Expand className="w-4 h-4 mr-1" />
              {isPreviewExpanded ? "Collapse" : "Expand"}
            </Button>
            <Button className="cursor-pointer" size="sm" onClick={() => setIsFullScreen(true)}>
              Fullscreen
            </Button>
          </div>
        </div>

        {/* INPUT CONTROLS */}
        <div className="mt-5 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Snippet title..."
            />
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="space-y-1 w-full">
              <label className="text-xs font-medium text-zinc-500">
                Language
              </label>
              <Select
              className="w-full"
                value={language}
                onValueChange={(v) => applyTemplate(v)}
              >
                <SelectTrigger className="cursor-pointer w-full">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent className="w-full">
                  {Object.keys(TEMPLATES).map((k) => (
                    <SelectItem className="cursor-pointer" key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500">
                Filename
              </label>
              <Input
                value={filename}
                onChange={(e) => setFilename(e.target.value)}
                placeholder="snippet.js"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">
              Syntax Theme
            </label>
            <Select value={themeKey} onValueChange={setThemeKey}>
              <SelectTrigger className="cursor-pointer w-full">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                {PrismThemeNames.map((t) => (
                  <SelectItem className="cursor-pointer" key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500">
                Palette
              </label>
              <Select
                value={colorThemeKey}
                onValueChange={setColorThemeKey}
              >
                <SelectTrigger className="cursor-pointer w-full">
                  <SelectValue placeholder="Select palette" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(COLOR_THEMES).map((k) => (
                    <SelectItem className="cursor-pointer" key={k} value={k}>
                      {k}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-zinc-500">
                Custom BG (hex)
              </label>
              <Input
                value={customBg}
                onChange={(e) => setCustomBg(e.target.value)}
                placeholder="#0f172a"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-zinc-500">Code</label>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              rows={8}
              className="w-full rounded-md border border-zinc-200 dark:border-zinc-700 bg-transparent px-3 py-2 font-mono text-sm"
              placeholder="// paste your code here"
            />
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-wrap items-center gap-2">
            <Button className='cursor-pointer' onClick={() => simulateLoad(handleSave)}>
              <Save className="w-4 h-4 mr-1" /> Save
            </Button>
            <Button
            className='cursor-pointer'
              variant="outline"
              onClick={() => simulateLoad(() => applyTemplate(language))}
            >
              Reset Template
            </Button>
            <Button
             className='cursor-pointer' 
              variant="outline"
              onClick={() =>
                simulateLoad(() => setCode((c) => c + "\n// note: appended"))
              }
            >
              Quick Append
            </Button>

            <div className="ml-auto flex gap-2">
              <Button className='cursor-pointer' onClick={() => exportToPng()}>
                <Download className="w-4 h-4 mr-1" /> PNG
              </Button>
              <Button className='cursor-pointer' variant="outline" onClick={() => exportToSvg()}>
                SVG
              </Button>
            </div>
          </div>

          {/* COLOR PREVIEWS */}
          <div className="mt-4">
            <label className="text-xs font-medium text-zinc-500">
              Palette Previews
            </label>
            <div className="mt-2  flex flex-wrap gap-2">
              {Object.keys(COLOR_THEMES)
                
                .map((k) => (
                  <ThemeThumb key={k} tKey={k} onClick={setColorThemeKey} />
                ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* SAVED SNIPPETS */}
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5 bg-gradient-to-b from-white/70 to-zinc-50/30 dark:from-zinc-900/60 dark:to-zinc-950/40 border border-zinc-200/70 dark:border-zinc-800/60 shadow-lg backdrop-blur-md"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Save className="w-4 h-4 text-emerald-500" /> Saved Snippets
          </h3>
          <div className="flex items-center  gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 w-4 h-4 text-zinc-400" />
              <Input
                className="pl-8"
                value={searchSaved}
                onChange={(e) => setSearchSaved(e.target.value)}
                placeholder="Search..."
              />
            </div>
            <Button
             className='cursor-pointer'
              variant="destructive"
              size="sm"
              onClick={() => {
                setSavedSnippets([]);
                writeSavedSnippets([]);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-2 max-h-[280px] overflow-auto">
          {filteredSaved.length === 0 ? (
            <div className="text-xs text-zinc-500">
              No saved snippets yet — save one to get started.
            </div>
          ) : (
            filteredSaved.map((s) => (
              <motion.div
                key={s.id}
                
                className={clsx(
                  "p-3 rounded-lg border flex items-start gap-3 transition-all",
                  selectedSavedId === s.id
                    ? "border-zinc-500/70 bg-zinc-50/30 dark:bg-zinc-500/10"
                    : "border-zinc-200/70 dark:border-zinc-700/60"
                )}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium truncate">{s.title}</div>
                    <Badge variant="secondary" className="text-xs">
                      {s.filename}
                    </Badge>
                  </div>
                  <div className="text-xs text-zinc-400 mt-1 line-clamp-2">
                    {(s.code || "").slice(0, 100)}
                  </div>
                  <div className="mt-2 flex  gap-2">
                    <Button
                    className='cursor-pointer'
                      variant="outline"
                      size="sm"
                      onClick={() => handleLoadSaved(s.id)}
                    >
                      Load
                    </Button>
                    <Button
                    className='cursor-pointer'
                      size="sm"
                      onClick={() => {
                        handleLoadSaved(s.id);
                        setTimeout(() => exportToPng(s.filename), 200);
                      }}
                    >
                      Export PNG
                    </Button>
                    <Button
                    className='cursor-pointer'
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteSaved(s.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                <div className="text-[10px] text-zinc-500">
                  {new Date(s.createdAt).toLocaleString()}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </motion.div>
        </div>

        {/* Right: Live Preview (cols 5-12 on lg) */}
        <div className="lg:col-span-9 space-y-4">
<AnimatePresence>
  {isFullScreen && (
    <motion.div
      initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
      animate={{ opacity: 1, backdropFilter: "blur(12px)" }}
      exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 dark:bg-black/80 backdrop-blur-xl p-4 sm:p-8"
      onClick={() => setIsFullScreen(false)}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ scale: 0.96, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.94, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="relative w-full max-w-[1400px] max-h-[90vh] overflow-auto rounded-2xl"
      >
        <Card
          className={`
            rounded-2xl overflow-hidden shadow-2xl border
            border-zinc-200/60 dark:border-zinc-800/60
            bg-gradient-to-b from-white/90 to-zinc-50/80
            dark:from-zinc-900/80 dark:to-zinc-950/80
            backdrop-blur-xl transition-colors duration-300
            flex flex-col
          `}
        >
          {/* Header */}
          <CardHeader
            className={`
              flex items-center justify-between border-b
              border-zinc-200/60 dark:border-zinc-800/60
              px-5 py-3 sticky top-0 z-10
              bg-white/70 dark:bg-zinc-900/70 backdrop-blur-lg
            `}
          >
            <div className="flex items-center gap-3">
              <WindowDots />
              <h2 className="text-sm sm:text-base font-semibold text-zinc-800 dark:text-zinc-100 tracking-wide">
                Snippet Preview — {title}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border border-zinc-300/70 dark:border-zinc-700/70 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 transition-all"
                onClick={() => exportToPng(filename)}
              >
                <FileDown className="h-4 w-4 mr-2" /> PNG
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="border border-zinc-300/70 dark:border-zinc-700/70 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-100 transition-all"
                onClick={() => exportToSvg(filename)}
              >
                <Download className="h-4 w-4 mr-2" /> SVG
              </Button>

              <Button
                variant="destructive"
                size="icon"
                className="rounded-full shadow-md hover:scale-105 transition-transform"
                onClick={() => setIsFullScreen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          {/* Content */}
          <CardContent
            className={`
              p-4 sm:p-6 overflow-auto
              bg-gradient-to-b from-zinc-50 to-white
              dark:from-zinc-950 dark:to-zinc-900
              transition-colors duration-300
            `}
          >
            <motion.div
              ref={previewRef}
              whileHover={{ scale: 1.01 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="mx-auto w-full"
            >
              <SnippetCard
                title={title}
                filename={filename}
                code={code}
                language={language}
                prismTheme={prismThemes[themeKey]}
                palette={palette}
                bg={previewBackground}
              />
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>


    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 18 }}
    >
      <Card className="relative overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-gradient-to-br from-white/70 to-zinc-50/40 dark:from-zinc-900/80 dark:to-zinc-900/50 backdrop-blur-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-center flex-wrap gap-5 justify-between">
            <div className="flex items-center gap-3">
              <WindowDots />
              <div>
                <h3 className="font-semibold text-sm md:text-base">{title}</h3>
                <p className="text-xs text-muted-foreground">
                  {filename} • {language}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              <div className="hidden md:flex items-center gap-2 pr-2 border-r border-zinc-300/50 dark:border-zinc-700/50">
                {PREVIEW_THEMES.slice(0,5).map((t) => (
                  <Button
                    key={t}
                    size="sm"
                    variant={themeKey === t ? "default" : "secondary"}
                    onClick={() => setThemeKey(t)}
                    className="text-xs capitalize cursor-pointer"
                  >
                    {t}
                  </Button>
                ))}
              </div>

              <Button
                size="sm"
                variant="ghost"
               onClick={() => setIsThumbnailsVisible((s) => !s)}
                className="text-xs cursor-pointer"
              >
                {isThumbnailsVisible ? (
                  <>
                    <Minimize2 className="w-4 h-4 mr-1" /> Minimize
                  </>
                ) : (
                  <>
                    <Expand className="w-4 h-4 mr-1" /> Expand
                  </>
                )}
              </Button>

              <Button size="sm" onClick={()=>exportToPng()} className="text-xs bg-zinc-600 hover:bg-zinc-700 cursor-pointer text-white">
                <ImageDown className="w-4 h-4 mr-1" /> PNG
              </Button>
              <Button className="cursor-pointer text-xs" size="sm" variant="secondary" onClick={exportToSvg} >
                <FileDown className="w-4 h-4 mr-1" /> SVG
              </Button>
                 {/* Loader animation */}
          <AnimatePresence>
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.25 }}
                className="absolute max-h-screen inset-0 flex items-center justify-center  z-20 rounded-lg"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                  className="p-3 rounded-full border-t-2 border-b-2 border-zinc-500"
                >
                  <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
                </motion.div>
                <div className="ml-3 text-sm font-medium text-white">Rendering snippet…</div>
              </motion.div>
            )}
          </AnimatePresence>
            </div>
          </div>
        </CardHeader>

        <CardContent className=" pt-2">
       

          {/* Expandable preview section */}
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: isPreviewExpanded ? 1 : 0, height: isPreviewExpanded ? "auto" : 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="w-full overflow-auto mt-3">
               <motion.div
              ref={previewRef}
             
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="mx-auto w-full"
            >
              <SnippetCard
                title={title}
                filename={filename}
                code={code}
                language={language}
                prismTheme={prismThemes[themeKey]}
                palette={palette}
                bg={previewBackground}
              />
            </motion.div>
            </div>

            {/* Theme thumbnails */}
            <AnimatePresence>
  {isThumbnailsVisible && (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.4 }}
      className="mt-8"
    >
      {/* Section Heading */}
      <motion.h3
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-sm font-medium tracking-wide text-zinc-700 dark:text-zinc-300 mb-3 flex items-center gap-2"
      >
        <span className="w-1.5 h-4 bg-zinc-600 rounded-sm" />
        Theme Thumbnails
      </motion.h3>
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
              {PREVIEW_THEMES.map((t) => (
                <motion.div
                  key={t}
                 
                  className="rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/40 p-3 hover:border-zinc-500/25 transition-all cursor-pointer"
                  onClick={() => {setThemeKey(t);  window.scrollTo({ top: 0, behavior: "smooth" });}}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium capitalize">{t}</span>
                    <Sparkles className="w-3.5 h-3.5 text-zinc-500" />
                  </div>
                  <TinyCodePreview themeName={t} sample={(code || "").slice(0, 150)} />
                </motion.div>
              ))}
            </div>
            </motion.div>
            )}
            </AnimatePresence>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>


        </div>
      </div>
    </div>
  );
}

 function SnippetCard({ title, filename, code, language, prismTheme, palette, bg }) {
  return (
    <div
      className="mx-auto w-fit max-w-full md:max-w-[1000px] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-white/60 dark:bg-zinc-900/60 backdrop-blur-xl transition-all duration-300 hover:shadow-zinc-500/20"
      style={{
        background: `linear-gradient(180deg, ${transparentize(bg || "#111", 0.04)} 0%, ${transparentize(bg || "#111", 0.08)} 100%)`,
      }}
    >
      {/* Header */}
      <div className="p-3 border-b border-white/10 bg-white dark:bg-zinc-900/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
          </div>
          <div className="flex flex-col leading-tight">
            <div className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</div>
            <div className="text-xs text-zinc-500">{filename}</div>
          </div>
        </div>
        <div className="text-xs text-zinc-400 uppercase tracking-wide">{language}</div>
      </div>

      {/* Code Block */}
      <div
        className="p-4 overflow-x-auto"
        style={{
          background: bg || "linear-gradient(to bottom right, #0d0d0d, #1a1a1a)",
        }}
      >
        <div className="inline-block text-left">
          <SyntaxHighlighter
            language={language}
            style={prismTheme || prismThemes.oneDark}
            showLineNumbers
            wrapLongLines
            customStyle={{
              margin: 0,
              padding: "16px",
              borderRadius: "0.5rem",
              background: "transparent",
              fontSize: 14,
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', monospace",
              whiteSpace: "pre",
              minWidth: "min-content",
            }}
          >
            {code.trim() || "// Write your snippet here..."}
          </SyntaxHighlighter>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-white/10 flex items-center justify-between text-xs  text-zinc-500 dark:text-zinc-400 bg-white/60 dark:bg-zinc-900/60">
        <div>Revolyx • {new Date().toLocaleDateString()}</div>
        <div>Theme Preview</div>
      </div>
    </div>
  );
}


/* ---------- small utility to blend/transparentize hex color ---------- */
function transparentize(hex, alpha = 0.1) {
  try {
    if (!hex) return `rgba(15,23,42,${alpha})`;
    const c = hex.replace("#", "");
    const bigint = parseInt(c, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch (e) {
    return `rgba(15,23,42,${alpha})`;
  }
}
