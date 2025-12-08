// src/pages/ResourcesFinderPage.jsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { Toaster, toast } from "sonner";
import {
  Search as SearchIcon,
  Loader2,
  Save,
  Trash2,
  Copy,
  Sparkles,
  List,
  Filter,
  ChevronDown,
  LucideMessageCircleQuestionMark,
  LockKeyholeOpen,
  Info,
  ExternalLink,
  FileSearch,
  Bookmark,
  Download,
  ArrowUpRight,
  LoaderPinwheelIcon,
} from "lucide-react";

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

/* ------------------ palettes (kept from original) ------------------ */
const COLOR_THEMES = {
  zinc: ["#71717a", "#a1a1aa", "#27272a", "#52525b", "#3f3f46"],
  blue: ["#3b82f6", "#60a5fa", "#2563eb", "#93c5fd", "#bfdbfe"],
  indigo: ["#6366f1", "#818cf8", "#4f46e5", "#a5b4fc", "#c7d2fe"],
  violet: ["#8b5cf6", "#a78bfa", "#7c3aed", "#c4b5fd", "#ddd6fe"],
  emerald: ["#10b981", "#34d399", "#059669", "#6ee7b7", "#a7f3d0"],
  orange: ["#f97316", "#fb923c", "#ea580c", "#fdba74", "#ffedd5"],
  rose: ["#f43f5e", "#fb7185", "#e11d48", "#fecdd3", "#ffe4e6"],
  green: ["#22c55e", "#4ade80", "#16a34a", "#86efac", "#dcfce7"],
  teal: ["#14b8a6", "#2dd4bf", "#0d9488", "#5eead4", "#99f6e4"],
};

/* ------------------ constants + localStorage helpers ------------------ */
const LOCAL_KEY = "revolyx_resources_v1";
const SAVE_CAP = 500;

function loadSavedResources() {
  try {
    const raw = localStorage.getItem(LOCAL_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.warn("loadSavedResources failed", e);
    return [];
  }
}
function persistSavedResources(list) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn("persistSavedResources failed", e);
  }
}

/* ------------------ small debounce hook ------------------ */
function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

/* ------------------ fallback data ------------------ */
const FALLBACK_RESOURCES = [
  { id: "r1", title: "MDN Web Docs", url: "https://developer.mozilla.org", tags: ["web", "docs"], description: "Comprehensive docs for web APIs & standards." },
  { id: "r2", title: "React Official", url: "https://react.dev", tags: ["react", "library"], description: "React documentation and tutorial." },
  { id: "r3", title: "freeCodeCamp", url: "https://www.freecodecamp.org", tags: ["learning", "tutorials"], description: "Free coding curriculum and projects." },
  { id: "r4", title: "Stack Overflow", url: "https://stackoverflow.com", tags: ["community", "qa"], description: "Developer Q&A." },
  { id: "r5", title: "CSS-Tricks", url: "https://css-tricks.com", tags: ["css", "design"], description: "Articles and patterns for front-end development." },
  { id: "r6", title: "Smashing Magazine", url: "https://smashingmagazine.com", tags: ["ux", "design"], description: "Design, UX and front-end insights." },
];

/* ------------------ robust model-output JSON parser ------------------ */
function extractJsonArrayFromText(text) {
  if (!text) return null;
  const start = text.indexOf("[");
  const end = text.lastIndexOf("]");
  if (start >= 0 && end > start) {
    const slice = text.slice(start, end + 1);
    try {
      const parsed = JSON.parse(slice);
      if (Array.isArray(parsed)) return parsed;
    } catch (e) {
      // continue below
    }
  }
  // fallback: try to find JSON object per-line and combine into array
  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    try {
      const maybe = JSON.parse(line);
      if (Array.isArray(maybe)) return maybe;
    } catch {}
  }
  return null;
}

/* ------------------ AI call helper (returns raw text) ------------------ */
async function generateResourcesWithAI(prompt) {
  const key = "AIzaSyBOUPRZxmhfO_HH6GCZK71UnIrrTeaEQ_g";
  if (!key) throw new Error("Missing VITE_GEMINI_API_KEY");
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;

  const body = {
    contents: [
      {
        role: "user",
        parts: [{ text: prompt }],
      },
    ],
  };

  const r = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    const text = await r.text();
    throw new Error(`Gemini failed: ${r.status} ${r.statusText} ${text}`);
  }
  const data = await r.json();


  const txt = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return txt;
}

/* ------------------ helper to map parsed model objects -> resource items ------------------ */
function normalizeModelResources(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map((it, i) => ({
    id: it.id || `ai_${Date.now().toString(36)}_${i}`,
    title: it.title || it.name || `Result ${i + 1}`,
    url: it.url || it.link || null,
    description: it.summary || it.description || "",
    tags: Array.isArray(it.tags) ? it.tags : (it.tags ? [it.tags] : []),
    source: it.source || "ai",
  }));
}

/* ------------------ main page ------------------ */
export default function ResourcesFinderPage() {
  // basic UI state
  const [query, setQuery] = useState(() => {
    try {
      const u = new URL(window.location.href);
      return u.searchParams.get("q") || "";
    } catch {
      return "";
    }
  });
  const debouncedQuery = useDebounced(query, 420);

  const [paletteKey, setPaletteKey] = useState("blue");
  const [subIdx, setSubIdx] = useState(0);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [sortMode, setSortMode] = useState("asc");

  const [loading, setLoading] = useState(false);
  const [resources, setResources] = useState([]);
  const [saved, setSaved] = useState(() => loadSavedResources());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [selectedResource, setSelectedResource] = useState(null);
  const [autoSave, setAutoSave] = useState(true);

  const [aiPrompt, setAiPrompt] = useState(""); // controlled dialog input

  const palette = COLOR_THEMES[paletteKey] || COLOR_THEMES.blue;
  const subColor = palette[subIdx % palette.length];

  const isDark = typeof window !== "undefined" && document.documentElement.classList.contains("dark");
  const GEMINI_KEY = "AIzaSyBOUPRZxmhfO_HH6GCZK71UnIrrTeaEQ_g"

  /* sync ?q= in url (debounced-ish) */
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const u = new URL(window.location.href);
        if (query) u.searchParams.set("q", query);
        else u.searchParams.delete("q");
        window.history.replaceState({}, "", u.toString());
      } catch {}
    }, 600);
    return () => clearTimeout(t);
  }, [query]);

  /* local fallback search (fast) */
  const localSearch = useCallback((q) => {
    if (!q || !q.trim()) return FALLBACK_RESOURCES.slice(0, 12);
    const ql = String(q).toLowerCase();
    return FALLBACK_RESOURCES.filter(r => (
      (r.title || "").toLowerCase().includes(ql) ||
      (r.description || "").toLowerCase().includes(ql) ||
      (r.tags || []).some(t => String(t).toLowerCase().includes(ql))
    ));
  }, []);

  /* central search function: tries AI (if key) and falls back to local search */
  const performSearch = useCallback(async (q, options = { saveSearch: false }) => {
    setLoading(true);
    setResources([]);
    setSelectedResource(null);
    try {
      let results = [];
      if (GEMINI_KEY) {
        // instruct model to output strict JSON array; we still parse defensively
        const prompt = `You are an expert curator. For the query: "${q}". Return a JSON array (only JSON) of up to 8 resources. Each item should be an object with keys: title, url (or null), summary, tags (array) and source. Example: [{"title":"...","url":"...","summary":"...","tags":["..."],"source":"web"}]`;
        const raw = await generateResourcesWithAI(prompt);
        const parsed = extractJsonArrayFromText(raw);
        if (parsed && Array.isArray(parsed) && parsed.length > 0) {
          results = normalizeModelResources(parsed);
        } else {
          // parsing failed — fallback to naive heuristics: try lines with " - " split or fallback local
          console.warn("AI produced unparsable output; falling back to local search");
          results = localSearch(q);
        }
      } else {
        results = localSearch(q);
      }

      setResources(results);

      if (options.saveSearch && results.length > 0) {
        const searchItem = {
          id: `search_${Date.now().toString(36)}`,
          query: q,
          paletteKey,
          subIdx,
          results,
          createdAt: Date.now(),
        };
        setSaved(prev => {
          const next = [searchItem, ...prev].slice(0, SAVE_CAP);
          persistSavedResources(next);
          return next;
        });
        showToast("success","Search saved locally");
      } else {
        if (results.length > 0) showToast("success",`Found ${results.length} resources`);
        else showToast("info","No results");
      }
    } catch (err) {
      console.error("performSearch error", err);
      showToast("error",err?.message || "Search failed");
      setResources([]);
    } finally {
      setLoading(false);
    }
  }, [GEMINI_KEY, localSearch, paletteKey, subIdx]);

  /* auto-run on debouncedQuery when query typed */
//   useEffect(() => {
//     if (!debouncedQuery) return;
//     performSearch(debouncedQuery, { saveSearch: false }).catch(() => {});
//   }, [debouncedQuery, performSearch]);

 /* Remove or comment out this part:
useEffect(() => {
  if (!debouncedQuery) return;
  performSearch(debouncedQuery, { saveSearch: false }).catch(() => {});
}, [debouncedQuery, performSearch]);
*/

/* ✅ New manual trigger: only when pressing Enter or Search button */
const handleSearch = useCallback(() => {
  if (!query.trim()) {
    showToast("error", "Please enter a search term first");
    return;
  }
  performSearch(query, { saveSearch: autoSave });
}, [query, autoSave, performSearch]);

  /* derived: tags available and filtered list */
  const tagsAvailable = useMemo(() => {
    const s = new Set();
    (resources || []).forEach(r => (r.tags || []).forEach(t => s.add(t)));
    return Array.from(s);
  }, [resources]);

  const filteredResources = useMemo(() => {
    let arr = (resources || []).slice();
    if (categoryFilter !== "all") arr = arr.filter(r => (r.tags || []).includes(categoryFilter));
    arr.sort((a, b) => sortMode === "asc" ? (a.title || "").localeCompare(b.title || "") : (b.title || "").localeCompare(a.title || ""));
    return arr;
  }, [resources, categoryFilter, sortMode]);

  function groupAlphabetically(list) {
    const map = {};
    list.forEach(it => {
      const letter = ((it.title && it.title[0]) || "#").toUpperCase();
      if (!map[letter]) map[letter] = [];
      map[letter].push(it);
    });
    return Object.fromEntries(Object.entries(map).sort(([a], [b]) => a.localeCompare(b)));
  }
  const grouped = useMemo(() => groupAlphabetically(filteredResources), [filteredResources]);

  /* save a single resource (use functional update) */
  const saveResource = useCallback((res) => {
    const thumbnail = { text: (res.description || res.title || "").slice(0, 120), url: res.url || "" };
    const item = { id: `res_${Date.now().toString(36)}`, title: res.title, url: res.url, tags: res.tags || [], description: res.description || "", thumbnail, createdAt: Date.now() };
    setSaved(prev => {
      const next = [item, ...prev].slice(0, SAVE_CAP);
      persistSavedResources(next);
      return next;
    });
    showToast("success","Saved resource");
  }, []);
 
  useEffect(() => {
  const clean = saved.filter(Boolean).filter((s) => s?.id);
  if (clean.length !== saved.length) {
    setSaved(clean);
    persistSavedResources(clean);
  }
}, []);

  const removeSaved = useCallback((id) => {
    setSaved(prev => {
      const next = prev.filter(s => s.id !== id);
      persistSavedResources(next);
      return next;
    });
    showToast("success","Removed");
  }, []);

  const openResource = (res) => {
    setSelectedResource(res);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const downloadJson = useCallback((payload, name = "revolyx-resources") => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${name}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("success","Downloaded JSON");
  }, []);

  /* simple loader component */
  function LoaderInline() {
    return <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />;
  }

  /* UI */
  return (
    <div className="min-h-screen max-w-8xl overflow-hidden mx-auto py-8 px-4 md:px-8">
      <Toaster richColors />
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-3">Revolyx Resources Finder</h1>
          <p className="text-sm opacity-70 mt-1">Discover  developer resources</p>
        </div>

        <div className="flex items-center gap-3">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button  variant="ghost" className="lg:hidden cursor-pointer"><List /></Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[320px] p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="font-medium">Saved resources</div>
                <Button size="sm" className="cursor-pointer" variant="ghost" onClick={() => setSheetOpen(false)}><ChevronDown /></Button>
              </div>
              <ScrollArea className="h-[70vh]">
                <div className="space-y-2">
                  {saved.length === 0 && <div className="text-sm opacity-60">No saved items</div>}
             {saved.map(s => (
            <div key={s.id} className="flex items-start gap-3 p-2 border rounded">
                <div className="flex-1">
                <div className="font-medium text-sm">{s.title}</div>
                {s.thumbnail?.text || s.description || "No description"}
                </div>
                <div className="flex flex-col items-end gap-4 p-4">
                <button className="cursor-pointer h-4 w-5 p-2"  onClick={() => openResource(s)}><LockKeyholeOpen /></button>
                <button className="cursor-pointer h-5 w-5 text-red-500 hover:text-red-400 p-2"   onClick={() => removeSaved(s.id)}><Trash2 /></button>
                </div>
            </div>
            ))}

                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          <div className="hidden lg:flex items-center gap-2">
            <Button variant="outline" onClick={() => { setQuery(""); setResources([]); showToast("success","Cleared search"); }}><Filter /></Button>
            <Button variant="secondary" onClick={() => { setDialogOpen(true); setAiPrompt(""); }}><Sparkles className="w-4 h-4 mr-1" /> Generate</Button>
            <Button onClick={() => { navigator.clipboard.writeText(window.location.href); showToast("success","URL copied"); }}>Share</Button>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* left controls */}
        <aside className="lg:col-span-1">
          <Card className="bg-white/60 dark:bg-black/60">
            <CardHeader><CardTitle>Search & Filters</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-3 w-4 h-4 opacity-60" />
                  <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleSearch();
                    }}
                    placeholder="Search topics, libraries, articles..."
                    className="pl-10"
                    />

                    {/* <Button onClick={handleSearch} className="flex-1 cursor-pointer">
                    {loading ? <LoaderPinwheelIcon /> : <SearchIcon className="w-4 h-4 mr-2" />} Search
                    </Button> */}

                </div>

      

                <div className="flex gap-2">
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger className="w-full cursor-pointer"><SelectValue placeholder="Category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem className="cursor-pointer" value="all">All</SelectItem>
                      {tagsAvailable.map(t => <SelectItem className="cursor-pointer" key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>

                  <Select value={sortMode} onValueChange={setSortMode}>
                    <SelectTrigger className="w-32 cursor-pointer"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem className="cursor-pointer" value="asc">A → Z</SelectItem>
                      <SelectItem className="cursor-pointer" value="desc">Z → A</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Switch id="autosave" className="cursor-pointer" checked={autoSave} onCheckedChange={(v) => setAutoSave(!!v)} />
                  <Label className="text-xs">Auto save searches</Label>
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => performSearch(query, { saveSearch: autoSave })} className="flex-1 cursor-pointer">
                    {loading ? <LoaderInline /> : <SearchIcon className="w-4 h-4 mr-2" />} Search
                  </Button>
                  <Button className="cursor-pointer" variant="outline" onClick={() => { setQuery(""); setResources([]); }}>Clear</Button>
                </div>

                <Separator />

    
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* right content */}
        <section className="lg:col-span-3 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
<Card className="lg:col-span-2 bg-white/60 dark:bg-black/60 backdrop-blur-sm border border-border/50 shadow-sm transition-all">
  <CardHeader className="flex items-center justify-between pb-3">
    <CardTitle className="flex items-center gap-2 text-base font-semibold">
      <LucideMessageCircleQuestionMark className="w-5 h-5 text-primary" />
      Results
    </CardTitle>
    <div className="flex items-center gap-3">
      <Badge variant="secondary" className="px-2 py-0.5 text-xs">
        {filteredResources.length}
      </Badge>
      <span className="text-xs text-muted-foreground font-medium">
        {query || "Recommendations"}
      </span>
    </div>
  </CardHeader>

  <CardContent>
    {loading ? (
      <div className="flex flex-col items-center justify-center py-12">
   <motion.div
  animate={{ rotate: 360 }}
  transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
  className="
    w-12 h-12 rounded-full shadow-lg flex items-center justify-center
    bg-gradient-to-r from-zinc-300 to-black
    dark:from-zinc-700 dark:to-black
  "
>
  <Loader2 className="w-6 h-6 text-white animate-spin" />
</motion.div>

        <p className="mt-4 text-sm text-muted-foreground">Fetching resources...</p>
      </div>
    ) : (
      <ScrollArea className="h-[70vh] pr-3 space-y-5">
        {Object.entries(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-2">
            <LucideMessageCircleQuestionMark className="w-8 h-8 opacity-60" />
            <p className="text-sm font-medium">No results found</p>
            <p className="text-xs opacity-70">Try refining your query or check spelling.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([letter, list]) => (
            <div key={letter} className="space-y-3">
              <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wide">
                {letter}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {list.map((res) => (
                  <div
                    key={res.id}
                    className="p-4 rounded-lg border border-border/40 hover:border-primary/40 hover:shadow-md transition-all duration-200 bg-muted/10 hover:bg-muted/20"
                  >
                    <div className="flex items-start flex-col justify-between">
                      <div className="font-medium text-sm w-full truncate">{res.title}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {(res.tags || []).slice(0, 2).join(", ")}
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground mt-2 line-clamp-3">
                      {res.description || "No description available."}
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        size="sm"
                        className="cursor-pointer flex items-center gap-1"
                        onClick={() => openResource(res)}
                      >
                        <ExternalLink className="w-4 h-4" />
                        Open
                      </Button>

                      <Button
                        size="sm"
                        variant="ghost"
                        className="cursor-pointer flex items-center gap-1"
                        onClick={() => saveResource(res)}
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="cursor-pointer flex items-center gap-1"
                        onClick={() => {
                          navigator.clipboard.writeText(res.url || res.title || "");
                        showToast("success","Copied link to clipboard!");
                        }}
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </ScrollArea>
    )}
  </CardContent>
</Card>

            {/* side preview + saved */}
            <div className="space-y-4">
              <Card className="bg-white/60 dark:bg-black/60">
                <CardHeader><CardTitle>Preview</CardTitle></CardHeader>
                <CardContent className="p-6 space-y-4">
  {selectedResource ? (
    <div className="space-y-3">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center  gap-2">
          <FileSearch className="" />
          {selectedResource.title}
        </h3>
      </div>

      {/* URL Section */}
      <p className="text-xs text-muted-foreground truncate hover:underline cursor-pointer"
         onClick={() => window.open(selectedResource.url, "_blank")}>
        {selectedResource.url}
      </p>

      {/* Description */}
      <p className="text-sm text-muted-foreground leading-relaxed">
        {selectedResource.description}
      </p>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-2">
        <Button 
          className="flex cursor-pointer items-center gap-2" 
          onClick={() => saveResource(selectedResource)}
        >
          <Bookmark className="w-4 h-4" /> Save
        </Button>

        <Button 
          variant="outline" 
          className="flex cursor-pointer items-center gap-2"
          onClick={() => window.open(selectedResource.url, "_blank")}
        >
          <ExternalLink className="w-4 h-4" /> Open
        </Button>

        <Button 
          variant="ghost" 
          className="flex cursor-pointer items-center gap-2"
          onClick={() => downloadJson(selectedResource, selectedResource.title || "resource")}
        >
          <Download className="w-4 h-4" /> JSON
        </Button>
      </div>
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-3">
      <Info className="w-10 h-10 text-primary/70" />
      <p className="text-base font-medium">No resource selected</p>
      <p className="text-sm text-muted-foreground">
        Select a resource from the list to preview its details here.
      </p>
    </div>
  )}
</CardContent>
              </Card>

             <Card className="bg-white/60 dark:bg-black/60 backdrop-blur-sm border border-border/50 shadow-sm transition-colors">
  <CardHeader className="flex items-center justify-between pb-3">
    <CardTitle className="text-base font-semibold flex items-center gap-2">
      <Bookmark className="w-4 h-4 text-primary" />
      Saved Resources
    </CardTitle>
    <Badge variant="secondary" className="px-2 py-0.5 text-xs">
      {saved.length}
    </Badge>
  </CardHeader>

  <CardContent className="px-2">
    <ScrollArea className="h-[40vh] ">
      <div className="space-y-2 pr-4">
        {saved.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-2">
            <Bookmark className="w-8 h-8 opacity-60" />
            <p className="text-sm font-medium">No saved resources yet</p>
            <p className="text-xs opacity-70">Save your favorite items to access them quickly.</p>
          </div>
        ) : (
          saved.map((s) => (
            <div
              key={s.id}
              className="flex items-start justify-between p-3 rounded-lg border dark:border-zinc-800 hover:bg-muted/30 transition-colors"
            >
              {/* Left content */}
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{s.title}</div>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                  {s.thumbnail?.text || s.description || "No description"}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex items-center flex-col gap-2 ml-2 pr-2">
                <button
                  className="p-2 cursor-pointer rounded-md hover:bg-primary/10 transition-colors"
                  title="Open Resource"
                  onClick={() => openResource(s)}
                >
                  <ExternalLink className="w-4 h-4 text-primary" />
                </button>
                <button
                  className="p-2 cursor-pointer rounded-md hover:bg-red-500/10 transition-colors"
                  title="Remove"
                  onClick={() => removeSaved(s.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  </CardContent>
</Card>
            </div>
          </div>

          {/* more suggestions grid */}


<Card className="bg-gradient-to-br from-white/70 to-white/30 dark:from-zinc-900/60 dark:to-zinc-800/30 backdrop-blur-xl border border-border/40 shadow-lg hover:shadow-primary/10 transition-all">
  <CardHeader className="flex items-center justify-between pb-3">
    <CardTitle className="flex items-center gap-2 text-base font-semibold">
      <Sparkles className="w-5 h-5 text-primary animate-pulse" />
      More Suggestions
    </CardTitle>
  </CardHeader>

  <CardContent>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4  gap-3">
      {(resources || []).slice(0, 12).map((r, index) => (
        <motion.button
          key={r.id}
          whileHover={{
            scale: 1.05,
            boxShadow: "0px 0px 12px rgba(99,102,241,0.4)",
          }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 250, damping: 15 }}
          className="group relative p-4 border border-zinc-800/20 dark:border-zinc-100/20 rounded-2xl cursor-pointer flex flex-col justify-between text-left bg-white/50 dark:bg-zinc-900/40 hover:border-primary/50 hover:bg-white/70 dark:hover:bg-zinc-900/60 transition-all duration-300 overflow-hidden"
          onClick={() => openResource(r)}
        >
          {/* Glow backdrop */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-pink-500/10 opacity-0 group-hover:opacity-100 blur-xl transition duration-500" />

          {/* Content */}
          <div className="relative z-10 space-y-2">
            <div className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {r.title}
            </div>
            <div className="text-xs text-muted-foreground/80 leading-snug line-clamp-3">
              {(r.description || "").slice(0, 140) || "No description available"}
            </div>
          </div>

          {/* Hover icon */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            whileHover={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-3 right-3 text-primary/70 group-hover:text-primary"
          >
            <ArrowUpRight className="w-4 h-4" />
          </motion.div>
        </motion.button>
      ))}
    </div>
  </CardContent>
</Card>

        </section>
      </main>

      {/* AI dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Generate Resources (AI)</DialogTitle></DialogHeader>

          <div className="space-y-3">
            <Label className="text-sm">Describe topic (e.g. "best frontend testing tools 2025")</Label>
            <Input placeholder="Enter prompt for AI generation..." value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} />
            <div className="flex justify-end gap-2 mt-3">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button onClick={async () => {
                const val = aiPrompt || query || "frontend resources";
                setDialogOpen(false);
                setQuery(val);
                // trigger AI search and save
                await performSearch(val, { saveSearch: true });
              }}>
                {GEMINI_KEY ? "Generate" : "Use fallback"}
              </Button>
            </div>
          </div>

          <DialogFooter />
        </DialogContent>
      </Dialog>
    </div>
  );
}
