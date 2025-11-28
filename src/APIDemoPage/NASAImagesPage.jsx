// src/pages/NASAImagesPage.jsx
"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Menu,
  Search,
  Image as ImageIcon,
  ExternalLink,
  Download,
  Copy,
  Loader2,
  List,
  X,
  ArrowRightCircle,
  Info,
  Check,
  Clock,
  MapPin,
  Tag,
  Calendar,
  User,
  FileText,
  RefreshCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

// shadcn sheet components (mobile sidebar)
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";

/* ---------- Constants ---------- */
const NASA_ENDPOINT = "https://images-api.nasa.gov/search";
const DEFAULT_QUERY = "earth";
const SUGGEST_DEBOUNCE_MS = 300;

/* ---------- Helpers ---------- */
function safeDate(d) {
  try {
    const dd = new Date(d);
    if (isNaN(dd.getTime())) return String(d ?? "—");
    return dd.toLocaleString();
  } catch {
    return String(d ?? "—");
  }
}

function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

function normalizeNasaItems(collectionJson) {
  if (!collectionJson?.collection?.items) return [];
  const items = collectionJson.collection.items;
  return items.map((it, idx) => {
    const data = Array.isArray(it.data) ? it.data[0] : {};
    const links = Array.isArray(it.links) ? it.links : [];
    const thumbLink = links.find((l) => (l.rel && l.rel.toLowerCase().includes("preview")) || (l.render === "image")) || links[0] || null;
    const hrefs = (links || []).map((l) => l.href).filter(Boolean);
    return {
      id: data?.nasa_id || (data?.title?.slice(0, 30) + "-" + idx),
      title: data?.title || "Untitled",
      description: data?.description || data?.photographer || data?.secondary_creator || "No description",
      date_created: data?.date_created,
      center: data?.center,
      keywords: data?.keywords || [],
      photographer: data?.photographer || data?.secondary_creator || null,
      thumb: thumbLink?.href || null,
      hrefs,
      raw: it,
      metadata: data,
    };
  });
}

/* pick up to n random elements from an array deterministically (but shuffled) */
function pickRandom(arr = [], n = 10) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a.slice(0, n);
}

/* ---------- Component ---------- */
export default function NASAImagesPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // State
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [current, setCurrent] = useState(null); // normalized item
  const [rawResp, setRawResp] = useState(null);
  const [loadingItem, setLoadingItem] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogImage, setDialogImage] = useState(null);
  const [showRaw, setShowRaw] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false);

  // copy animation state
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef(null);

  const debounceRef = useRef(null);
  const suggestionsListRef = useRef(null);
  const inputRef = useRef(null);

  /* ---------- Fetching ---------- */
  async function fetchNasa(q = DEFAULT_QUERY, limit = 25) {
    setLoadingItem(true);
    try {
      const params = new URLSearchParams({ q: q || DEFAULT_QUERY, media_type: "image", page: "1" });
      const url = `${NASA_ENDPOINT}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        showToast("error", `NASA API error (${res.status})`);
        setLoadingItem(false);
        return;
      }
      const json = await res.json();
      const normalized = normalizeNasaItems(json).slice(0, limit);
      setRawResp(json);
      setSuggestions(normalized);
      if (normalized.length > 0) {
        setCurrent(normalized[0]);
      } else {
        setCurrent(null);
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch NASA images");
    } finally {
      setLoadingItem(false);
    }
  }

  async function querySuggestions(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);
    try {
      const params = new URLSearchParams({ q, media_type: "image", page: "1" });
      const res = await fetch(`${NASA_ENDPOINT}?${params.toString()}`);
      if (!res.ok) {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      const json = await res.json();
      const normalized = normalizeNasaItems(json);
      setSuggestions(normalized.slice(0, 10));
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
    }
  }

  useEffect(() => {
    fetchNasa(DEFAULT_QUERY);
    // cleanup copy timer on unmount
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- UI helpers ---------- */
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      querySuggestions(v);
    }, SUGGEST_DEBOUNCE_MS);
  }

  function onSelectSuggestion(item) {
    setCurrent(item);
    setShowSuggest(false);
    setRawResp(item.raw ? { collection: { items: [item.raw] } } : null);
    // close sheet on mobile
    setSheetOpen(false);
  }

  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query || query.trim().length === 0) {
      showToast("info", "Try searching for 'moon', 'earth', 'apollo', 'jupiter'...");
      return;
    }
    await fetchNasa(query, 50);
    setShowSuggest(false);
  }

  /* ---------- Actions ---------- */
  function openImageInDialog(href) {
    if (!href) return showToast("info", "No image available");
    setDialogImage(href);
    setDialogOpen(true);
  }

  function openOriginal() {
    if (!current) return showToast("info", "No item selected");
    const first = current.hrefs && current.hrefs[0];
    if (first) window.open(first, "_blank");
    else showToast("info", "No image URL available");
  }

  async function copyJSON() {
    if (!current) return showToast("info", "No item selected");
    try {
      navigator.clipboard.writeText(prettyJSON(current.metadata || current));
      setCopied(true);
      showToast("success", "Metadata copied to clipboard");
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to copy");
    }
  }

  function downloadJSON() {
    if (!current) return showToast("info", "No item to download");
    const payload = current.raw || current;
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `nasa_${(current.id || "item").replace(/[^a-z0-9_\-]/gi, "_")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  /* ---------- Keyboard: basic suggestion navigation ---------- */
  function onInputKeyDown(e) {
    if (!showSuggest || !suggestions.length) return;
    const active = suggestionsListRef.current?.querySelector("[data-active='true']");
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!active) {
        const first = suggestionsListRef.current?.querySelector("[data-suggestion-index='0']");
        first?.focus();
        first?.setAttribute("data-active", "true");
      }
    } else if (e.key === "Escape") {
      setShowSuggest(false);
    }
  }

  /* ---------- Derived content ---------- */
  const detailsGrid = useMemo(() => {
    if (!current) return [];
    const md = current.metadata || {};
    return [
      { label: "Title", value: current.title, icon: FileText },
      { label: "Center", value: md.center || "—", icon: MapPin },
      { label: "Date created", value: safeDate(md.date_created), icon: Calendar },
      { label: "Photographer", value: md.photographer || "—", icon: User },
      { label: "Keywords", value: (md.keywords || []).join(", ") || "—", icon: Tag },
      { label: "Description", value: md.description || "—", icon: Info },
      { label: "NASA ID", value: md.nasa_id || "—", icon: Clock },
      { label: "Location", value: md.location || "—", icon: MapPin },
    ];
  }, [current]);

  // 10 random items for sidebar (prefer suggestions; fallback to normalized from rawResp)
  const sidebarItems = useMemo(() => {
    const source = suggestions.length ? suggestions : (normalizeNasaItems(rawResp) || []);
    return pickRandom(source, 10);
  }, [suggestions, rawResp]);

  /* ---------- Render ---------- */
  return (
    <div className={clsx("min-h-screen pb-10 p-4 md:p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex items-center flex-wrap justify-between gap-4 mb-4 md:mb-6">
        <div className="flex items-center gap-3">
          {/* Mobile menu / sheet trigger */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="p-2 md:hidden cursor-pointer" aria-label="Open results">
                <Menu />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className="w-[320px] p-3 overflow-y-auto">
              <SheetHeader>
                <SheetTitle>Results</SheetTitle>
              </SheetHeader>

              <div className="mt-2">
                <div className="text-xs opacity-60 mb-2">Tap any thumbnail to select</div>
                <ScrollArea className="overflow-y-auto" style={{ maxHeight: "60vh" }}>
                  <div className="grid grid-cols-1 gap-2">
                    {sidebarItems.map((s) => (
                      <button
                        key={s.id}
                        onClick={() => onSelectSuggestion(s)}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer"
                      >
                        {s.thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={s.thumb} alt={s.title} className="w-14 h-10 object-cover rounded-sm" />
                        ) : (
                          <div className="w-14 h-10 bg-zinc-100 dark:bg-zinc-900/30 flex items-center justify-center"><ImageIcon /></div>
                        )}
                        <div className="text-sm text-left min-w-0">
                          <div className="font-medium truncate">{s.title}</div>
                          <div className="text-xs opacity-60 truncate">{safeDate(s.date_created)}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>

                <SheetFooter className="mt-4">
                  <Button variant="outline" className="w-full cursor-pointer" onClick={() => { fetchNasa(query || DEFAULT_QUERY); setSheetOpen(false); }}>
                    <RefreshCw className="mr-2" /> Refresh
                  </Button>
                </SheetFooter>
              </div>
            </SheetContent>
          </Sheet>

          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">NASA Images & Data</h1>
            <p className="text-xs opacity-70">Search NASA's public image library — preview, inspect metadata, and download.</p>
          </div>
        </div>

        {/* Search bar (responsive) */}
        <div className="flex-1 md:flex-none">
          <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              ref={inputRef}
              aria-label="Search NASA images"
              placeholder="Search NASA images, e.g. 'moon', 'apollo 11', 'earth'..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onFocus={() => setShowSuggest(true)}
              onKeyDown={onInputKeyDown}
              className="border-0 shadow-none bg-transparent outline-none"
            />
            <Button type="button" variant="ghost" className="px-3 hidden md:inline-flex cursor-pointer" onClick={() => { setQuery(DEFAULT_QUERY); fetchNasa(DEFAULT_QUERY); }}>
              <ArrowRightCircle className="mr-2" /> Default
            </Button>
            <Button type="submit" variant="outline" className="px-3 cursor-pointer"><Search /></Button>
          </form>
        </div>
      </header>

      {/* Suggestions (absolute for desktop input) */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={clsx("absolute z-50 left-4 right-4 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
            role="listbox"
            aria-label="Search suggestions"
            ref={suggestionsListRef}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.slice(0, 12).map((s, idx) => (
              <li
                key={s.id}
                tabIndex={0}
                data-suggestion-index={idx}
                className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer flex gap-3 items-center"
                role="option"
                onClick={() => onSelectSuggestion(s)}
                onKeyDown={(e) => { if (e.key === "Enter") onSelectSuggestion(s); }}
              >
                {s.thumb ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.thumb} alt={s.title} className="w-14 h-10 object-cover rounded-sm flex-shrink-0" />
                ) : (
                  <div className="w-14 h-10 rounded-sm bg-zinc-100 dark:bg-zinc-800/40 flex items-center justify-center"><ImageIcon /></div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{s.title}</div>
                  <div className="text-xs opacity-60 truncate">{s.photographer || s.center || safeDate(s.date_created)}</div>
                </div>
                <div className="text-xs opacity-60 whitespace-nowrap">{safeDate(s.date_created)}</div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left sidebar (desktop) */}
        <aside className={clsx("hidden lg:block lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold">Results</div>
              <div className="text-xs opacity-60">10 quick thumbnails</div>
            </div>
            <Button variant="ghost" className="cursor-pointer" onClick={() => fetchNasa(query || DEFAULT_QUERY)}><RefreshCw /></Button>
          </div>

          <ScrollArea style={{ maxHeight: 520 }} className="rounded-md overflow-y-auto border p-2">
            <div className="grid grid-cols-1 gap-2">
              {sidebarItems.map((s) => (
                <button key={s.id} onClick={() => onSelectSuggestion(s)} className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer">
                  {s.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.thumb} alt={s.title} className="w-14 h-10 object-cover rounded-sm" />
                  ) : (
                    <div className="w-14 h-10 bg-zinc-100 dark:bg-zinc-900/30 flex items-center justify-center"><ImageIcon /></div>
                  )}
                  <div className="text-sm text-left min-w-0">
                    <div className="font-medium truncate">{s.title}</div>
                    <div className="text-xs opacity-60 truncate">{safeDate(s.date_created)}</div>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* Middle: preview (primary) */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4 flex items-start justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon />
                  Preview
                </CardTitle>
                <div className="text-xs opacity-60 mt-1">{current?.title ?? "No image selected"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => fetchNasa(query || DEFAULT_QUERY)} className="cursor-pointer">
                  <RefreshCw className={loadingItem ? "animate-spin" : ""} /> Refresh
                </Button>

                <Button variant="ghost" onClick={() => setShowRaw((s) => !s)} className="cursor-pointer">
                  <List /> {showRaw ? "Hide raw" : "Show raw"}
                </Button>

                <Button variant="ghost" onClick={() => openImageInDialog(current?.thumb)} className="cursor-pointer">
                  <ImageIcon /> View
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {loadingItem ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !current ? (
                <div className="py-12 text-center text-sm opacity-60">No item selected — search or pick a suggestion.</div>
              ) : (
                <div className="space-y-4">
                  {/* image with overlay info */}
                  <div className="relative rounded-xl overflow-hidden border">
                    {current.thumb ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={current.thumb} alt={current.title} className="w-full h-[52vh] md:h-[48vh] object-cover" />
                    ) : (
                      <div className="w-full h-[48vh] flex items-center justify-center bg-zinc-100 dark:bg-zinc-900/30">
                        <ImageIcon />
                      </div>
                    )}

                    <div className="absolute left-4 bottom-4 bg-white/80 dark:bg-black/70 backdrop-blur-md rounded-md p-3 flex items-start gap-3 border" style={{ maxWidth: "min(92%, 680px)" }}>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs opacity-60">Title</div>
                        <div className="font-semibold truncate">{current.title}</div>
                        <div className="text-xs opacity-60 mt-1">{current.photographer ? `By ${current.photographer}` : (current.center ? current.center : "")} • {safeDate(current.date_created)}</div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button variant="outline" onClick={() => openImageInDialog(current.hrefs?.[0] || current.thumb)} className="cursor-pointer">
                          <ExternalLink />
                        </Button>
                        <Button variant="outline" onClick={downloadJSON} className="cursor-pointer">
                          <Download />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={clsx("col-span-2 p-4 rounded-lg border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-semibold flex items-center gap-2">
                            <Info /> Description
                          </div>
                          <div className="text-sm mt-2 text-zinc-700 dark:text-zinc-200 leading-relaxed">
                            {current.description || "No description available."}
                          </div>
                        </div>

                        <div className="ml-4 flex flex-col items-end gap-2">
                       

                          <Button variant="ghost" onClick={() => setDialogImage(current.hrefs?.[0] || current.thumb) || setDialogOpen(true)} className="cursor-pointer">
                            <ImageIcon /> Preview
                          </Button>
                        </div>
                      </div>

                      <Separator className="my-4" />

                    </div>

                    <div className={clsx("p-4 rounded-lg border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                      <div className="text-sm font-semibold mb-2 flex items-center gap-2"><Tag /> Details</div>
                      <div className="grid grid-cols-1 gap-2">
                        {detailsGrid.slice(0, 5).map((d) => {
                          const Icon = d.icon || Info;
                          return (
                            <div key={d.label} className="flex items-start gap-3">
                              <div className="p-2 rounded-md bg-zinc-100 dark:bg-zinc-900/30"><Icon /></div>
                              <div>
                                <div className="text-xs opacity-60">{d.label}</div>
                                <div className="text-sm font-medium break-words">{d.value ?? "—"}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <AnimatePresence>
              {showRaw && rawResp && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("p-4 border-t", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                  <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 240 }}>
                    {prettyJSON(rawResp)}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* Right: quick actions & compact results (desktop) */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Quick Actions</div>
                <div className="text-xs opacity-60">Useful operations for the selected item</div>
              </div>

              <Button variant="ghost" className="cursor-pointer" onClick={() => setShowRaw((s) => !s)}><List /></Button>
            </div>

            <div className="space-y-2 mt-3">
              <Button className="w-full justify-start cursor-pointer" variant="outline" onClick={openOriginal}><ExternalLink /> <span className="ml-2">Open original</span></Button>
              <Button className="w-full justify-start cursor-pointer" variant="outline" onClick={() => openImageInDialog(current?.thumb)}><ImageIcon /> <span className="ml-2">Open preview</span></Button>
              <Button className="w-full justify-start cursor-pointer" variant="outline" onClick={copyJSON}><Copy /> <span className="ml-2">Copy metadata</span></Button>
              <Button className="w-full justify-start cursor-pointer" variant="outline" onClick={downloadJSON}><Download /> <span className="ml-2">Download JSON</span></Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Results (compact)</div>
            <div className="text-xs opacity-60 mb-2">Click a thumbnail to make it primary</div>
            <div className="grid grid-cols-1 gap-2">
              {suggestions.slice(0, 6).map((s) => (
                <button key={s.id} onClick={() => onSelectSuggestion(s)} className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer">
                  {s.thumb ? (<img src={s.thumb} alt={s.title} className="w-14 h-10 object-cover rounded-sm" />) : (<div className="w-14 h-10 bg-zinc-100 dark:bg-zinc-900/30 flex items-center justify-center"><ImageIcon /></div>)}
                  <div className="text-sm text-left">
                    <div className="font-medium truncate w-36">{s.title}</div>
                    <div className="text-xs opacity-60">{safeDate(s.date_created)}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-4xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{current?.title || "Image"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {dialogImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={dialogImage} alt={current?.title} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image from NASA</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="cursor-pointer"><X /></Button>
              <Button variant="outline" onClick={() => { if (dialogImage) window.open(dialogImage, "_blank"); }} className="cursor-pointer"><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
