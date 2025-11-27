// src/pages/BooksPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  BookOpen,
  ExternalLink,
  Download,
  Copy,
  ImageIcon,
  List,
  Loader2,
  Star,
  X,
  Info,
  Tag,
  Calendar,
  Users,
  Hash,
  Menu,
  Check,
  ChevronRight
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

// shadcn sheet - ensure you have this component available in your codebase
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  SheetTrigger
} from "@/components/ui/sheet";

/* ---------- Endpoint ---------- */
const BASE_ENDPOINT = "https://www.googleapis.com/books/v1/volumes";

/* ---------- Defaults ---------- */
const DEFAULT_QUERY = "harry potter";
const DEFAULT_MSG = "Search books by title, author, ISBN or keywords...";

/* ---------- Utilities ---------- */
function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

/* safe accessor */
const get = (obj, path, fallback = undefined) => {
  if (!obj) return fallback;
  try {
    return path.split(".").reduce((a, k) => (a && a[k] !== undefined ? a[k] : undefined), obj) ?? fallback;
  } catch {
    return fallback;
  }
};

export default function BooksPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // state
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [currentVolume, setCurrentVolume] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [loadingVolume, setLoadingVolume] = useState(false);

  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // mobile sheet state (shadcn Sheet)
  const [sheetOpen, setSheetOpen] = useState(false);

  // copy animation state
  const [copied, setCopied] = useState(false);

  // random books state
  const [randomBooks, setRandomBooks] = useState([]);
  const [loadingRandom, setLoadingRandom] = useState(false);

  const suggestTimer = useRef(null);

  /* ---------- Fetch helpers ---------- */
  async function fetchBooks(q = DEFAULT_QUERY) {
    setLoadingVolume(true);
    try {
      const params = new URLSearchParams({ q, maxResults: "20" }); // fetch more and pick
      const url = `${BASE_ENDPOINT}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        showToast("error", `Books fetch failed (${res.status})`);
        setLoadingVolume(false);
        return;
      }
      const json = await res.json();
      const items = json.items || [];
      setRawResp(json);
      const first = items.length > 0 ? items[0] : null;
      if (first) {
        setCurrentVolume(first);
        showToast("success", `Loaded: ${get(first, "volumeInfo.title", "book")}`);
        // preload thumbnail
        const thumb = get(first, "volumeInfo.imageLinks.thumbnail");
        if (thumb) new Image().src = thumb;
      } else {
        setCurrentVolume(null);
        showToast("info", "No results found");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch books");
    } finally {
      setLoadingVolume(false);
    }
  }

  async function searchBooks(q) {
    if (!q || q.trim() === "") {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);
    try {
      const params = new URLSearchParams({ q, maxResults: "8" });
      const url = `${BASE_ENDPOINT}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      const json = await res.json();
      setSuggestions(json.items || []);
    } catch (err) {
      console.error(err);
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
    }
  }

  async function fetchRandomBooks() {
    // try multiple popular subjects and choose 10 random items
    setLoadingRandom(true);
    try {
      const queries = ["fiction", "bestsellers", "history", "science", "fantasy", "biography"];
      const q = queries[Math.floor(Math.random() * queries.length)];
      const params = new URLSearchParams({ q, maxResults: "20" });
      const url = `${BASE_ENDPOINT}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        setRandomBooks([]);
        setLoadingRandom(false);
        return;
      }
      const json = await res.json();
      const items = json.items || [];
      // pick up to 10 random unique
      const shuffled = items.sort(() => 0.5 - Math.random());
      setRandomBooks(shuffled.slice(0, 10));
    } catch (err) {
      console.error(err);
      setRandomBooks([]);
    } finally {
      setLoadingRandom(false);
    }
  }

  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => searchBooks(v), 300);
  }

  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query || query.trim() === "") {
      showToast("info", DEFAULT_MSG);
      return;
    }
    await fetchBooks(query);
    setShowSuggest(false);
  }

  function chooseSuggestion(item) {
    setCurrentVolume(item);
    setRawResp({ items: [item] });
    setShowSuggest(false);
    showToast("success", `Selected: ${get(item, "volumeInfo.title", "book")}`);
  }

  function copyVolumeToClipboard() {
    if (!currentVolume) return showToast("info", "No book loaded");
    navigator.clipboard.writeText(prettyJSON(currentVolume));
    setCopied(true);
    showToast("success", "Book JSON copied");
    // reset animation after 2s
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadJSON() {
    const payload = rawResp || currentVolume;
    if (!payload) return showToast("info", "Nothing to download");
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const name = (get(currentVolume, "volumeInfo.title", "book") + "").replace(/\s+/g, "_").slice(0, 100);
    a.download = `book_${name}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  function openBookResource() {
    if (!currentVolume) return showToast("info", "No book loaded");
    // prefer pdf acsTokenLink if available, else webReaderLink (preview), else infoLink
    const pdfLink = get(currentVolume, "accessInfo.pdf.acsTokenLink");
    const webReader = get(currentVolume, "accessInfo.webReaderLink");
    const preview = get(currentVolume, "volumeInfo.previewLink");
    const info = get(currentVolume, "volumeInfo.infoLink");
    const link = pdfLink || webReader || preview || info;
    if (link) window.open(link, "_blank");
    else showToast("info", "No direct resource available");
  }

  useEffect(() => {
    // initial fetch and randoms
    fetchBooks(DEFAULT_QUERY);
    fetchRandomBooks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* derived */
  const volumeInfo = currentVolume ? get(currentVolume, "volumeInfo", {}) : null;
  const saleInfo = currentVolume ? get(currentVolume, "saleInfo", {}) : null;
  const accessInfo = currentVolume ? get(currentVolume, "accessInfo", {}) : null;

  return (
    <div className={clsx("min-h-screen p-4 md:p-6 max-w-8xl pb-10 mx-auto")}>
      {/* Top bar */}
      <header className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          {/* Mobile sheet trigger */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" className="p-2 md:hidden cursor-pointer"><Menu /></Button>
            </SheetTrigger>

            <SheetContent side="left" className={clsx("w-[320px] p-4", isDark ? "bg-black/90" : "bg-white")}>
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>

              <div className="space-y-4 mt-2">
                <Card className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-sm font-semibold">Quick Actions</div>
                      <div className="text-xs opacity-60">Endpoint & tools</div>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(`${BASE_ENDPOINT}?q=${encodeURIComponent(query || DEFAULT_QUERY)}`); showToast("success","Endpoint copied"); }} className="cursor-pointer"><Copy /></Button>
                  </div>

                  <Separator className="my-3" />
                  <div className="flex flex-col gap-2">
                    <Button variant="ghost" onClick={() => { setQuery(DEFAULT_QUERY); fetchBooks(DEFAULT_QUERY); setSheetOpen(false); }} className="justify-start cursor-pointer">Default search</Button>
                    <Button variant="ghost" onClick={() => { fetchRandomBooks(); }} className="justify-start cursor-pointer">Refresh random picks</Button>
                    <Button variant="ghost" onClick={() => { setShowRaw(s => !s); setSheetOpen(false); }} className="justify-start cursor-pointer">Toggle Raw</Button>
                  </div>
                </Card>

                <div>
                  <div className="text-sm font-semibold mb-2">Random picks</div>
                  <ScrollArea style={{ height: 260 }}>
                    <div className="space-y-2">
                      {loadingRandom ? (
                        <div className="text-sm opacity-60">Loading…</div>
                      ) : randomBooks.length === 0 ? (
                        <div className="text-sm opacity-60">No random picks</div>
                      ) : (
                        randomBooks.map((b, i) => {
                          const vi = get(b, "volumeInfo", {});
                          return (
                            <div key={b.id ?? i} className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => { chooseSuggestion(b); setSheetOpen(false); }}>
                              <img src={get(vi, "imageLinks.thumbnail", "")} alt={get(vi, "title", "")} className="w-10 h-14 object-cover rounded-sm" />
                              <div className="flex-1 text-sm">
                                <div className="font-medium truncate">{get(vi, "title", "Untitled")}</div>
                                <div className="text-xs opacity-60 truncate">{(get(vi, "authors", []) || []).slice(0,1).join(", ") || "Unknown"}</div>
                              </div>
                              <ChevronRight className="opacity-50" />
                            </div>
                          );
                        })
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>

              
            </SheetContent>
          </Sheet>

          <div>
            <h1 className={clsx("text-2xl md:text-3xl font-extrabold")}>Bibliotheca</h1>
            <p className="text-xs opacity-60">Search books, inspect metadata, preview & download</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 rounded-lg px-3 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search titles, authors, ISBN, or keywords..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none w-[360px]"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="outline" onClick={() => fetchBooks(DEFAULT_QUERY)} className="px-3 cursor-pointer">Default</Button>
            <Button type="submit" variant="ghost" className="px-3 cursor-pointer"><Search /></Button>
                      <Button variant="ghost" onClick={() => fetchRandomBooks()} className="hidden md:inline-flex cursor-pointer"><Tag /> Picks</Button>
          </form>
        </div>

     
      </header>

      {/* Suggestions - visible on top when typing (desktop & mobile) */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("absolute left-4 right-4 md:left-[calc(50%_-_360px)] md:right-auto z-50 max-w-[720px] rounded-xl overflow-hidden shadow-lg", isDark ? "bg-black/90 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <ScrollArea className="overflow-y-auto " style={{ maxHeight: 320 }}>
              <ul>
                {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
                {suggestions.map((s, idx) => {
                  const vi = get(s, "volumeInfo", {});
                  return (
                    <li key={s.id ?? idx} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => chooseSuggestion(s)}>
                      <div className="flex items-center gap-3">
                        <img src={get(vi, "imageLinks.thumbnail", "")} alt={get(vi, "title", "thumb")} className="w-12 h-16 object-cover rounded-sm" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{get(vi, "title", "Untitled")}</div>
                          <div className="text-xs opacity-60 truncate">{(get(vi, "authors", []) || []).slice(0, 2).join(", ") || "Unknown author"}</div>
                        </div>
                        <div className="text-xs opacity-60">{get(vi, "publishedDate", "—")}</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        {/* Middle preview (main) */}
        <section className="lg:col-span-8 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4 flex flex-wrap items-center justify-between gap-3", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg flex items-center gap-2"><BookOpen /> Book Details</CardTitle>
                <div className="text-xs opacity-60">{get(volumeInfo, "title", "Waiting for a book...")}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => fetchBooks(query)} className="cursor-pointer" title="Reload">
                  <Loader2 className={loadingVolume ? "animate-spin" : ""} />
                </Button>

                <Button variant="ghost" onClick={() => setDialogOpen(true)} className="cursor-pointer"><ImageIcon /> Cover</Button>

                <Button variant="outline" onClick={openBookResource} className="cursor-pointer"><BookOpen /> Read / Download</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loadingVolume ? (
                <div className="py-16 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !currentVolume ? (
                <div className="py-12 text-center text-sm opacity-60">No book selected — search or choose a suggestion.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                  {/* left - cover */}
                  <div className="md:col-span-4 p-4 rounded-xl border flex flex-col items-center gap-3" style={{ minHeight: 260 }}>
                    <img src={get(volumeInfo, "imageLinks.thumbnail", "")} alt={get(volumeInfo, "title", "")} className="w-full h-64 object-contain rounded-md" />
                    <div className="text-lg font-semibold text-center">{get(volumeInfo, "title", "Untitled")}</div>
                    <div className="text-sm opacity-60">{(get(volumeInfo, "authors", []) || []).join(", ") || "Unknown author"}</div>

                    <div className="w-full mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 rounded-md border text-center">
                        <div className="text-xs opacity-60">Pages</div>
                        <div className="font-medium">{get(volumeInfo, "pageCount", "—")}</div>
                      </div>
                      <div className="p-2 rounded-md border text-center">
                        <div className="text-xs opacity-60">Language</div>
                        <div className="font-medium">{get(volumeInfo, "language", "—")}</div>
                      </div>
                      <div className="p-2 rounded-md border text-center">
                        <div className="text-xs opacity-60">Published</div>
                        <div className="font-medium">{get(volumeInfo, "publishedDate", "—")}</div>
                      </div>
                      <div className="p-2 rounded-md border text-center">
                        <div className="text-xs opacity-60">Rating</div>
                        <div className="font-medium">{get(volumeInfo, "averageRating", "—")} {get(volumeInfo, "ratingsCount") ? <span className="text-xs opacity-60">({get(volumeInfo,"ratingsCount")})</span> : null}</div>
                      </div>
                    </div>

                    <div className="w-full mt-3 flex gap-2">
                      <Button variant="outline" onClick={() => { const link = get(volumeInfo, "previewLink") || get(volumeInfo, "infoLink"); if (link) window.open(link, "_blank"); else showToast("info", "No preview available"); }} className="flex-1 cursor-pointer"><ExternalLink /> Preview</Button>
                      <Button variant="outline" onClick={() => { const pdf = get(accessInfo, "pdf.acsTokenLink"); if (pdf) window.open(pdf, "_blank"); else showToast("info", "No PDF sample available"); }} className="flex-1 cursor-pointer"><Download /> Sample</Button>
                    </div>
                  </div>

                  {/* middle - description & metadata */}
                  <div className="md:col-span-5 p-4 rounded-xl border">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-lg font-semibold">{get(volumeInfo, "title", "Untitled")}</h2>
                          {get(volumeInfo, "subtitle") && <div className="text-sm opacity-60">{get(volumeInfo, "subtitle")}</div>}
                        </div>
                        <div className="text-xs opacity-60 mt-1 flex items-center gap-3">
                          <Users /> <span>{(get(volumeInfo, "authors", []) || []).join(", ") || "Unknown author"}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs opacity-60">Identifiers</div>
                        <div className="font-medium text-sm">{((get(volumeInfo, "industryIdentifiers", []) || []).map(id => id.identifier).join(", ")) || "—"}</div>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="prose max-w-none text-sm leading-relaxed mb-3" dangerouslySetInnerHTML={{ __html: (get(volumeInfo, "description", "No description available.")).replace(/\n/g, "<br/>") }} />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60 flex items-center gap-2"><Tag /> Categories</div>
                        <div className="font-medium">{(get(volumeInfo, "categories", []) || []).join(", ") || "—"}</div>
                      </div>
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60 flex items-center gap-2"><Hash /> Access</div>
                        <div className="font-medium">{get(accessInfo, "accessViewStatus", "—")} {get(accessInfo,"embeddable") ? " • Embeddable" : ""}</div>
                      </div>
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60 flex items-center gap-2"><Calendar /> Published</div>
                        <div className="font-medium">{get(volumeInfo, "publishedDate", "—")}</div>
                      </div>
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60 flex items-center gap-2"><Info /> Saleability</div>
                        <div className="font-medium">{get(saleInfo, "saleability", "—")} {get(saleInfo, "isEbook") ? " • eBook" : ""}</div>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="text-xs opacity-60 mb-2">Search snippet</div>
                    <div className="text-sm italic">{get(currentVolume, "searchInfo.textSnippet", "—")}</div>
                  </div>

                  {/* right - actions & raw toggle */}
                  <div className="md:col-span-3 p-4 rounded-xl border flex flex-col gap-3">
                    <div className="text-sm font-semibold">Actions</div>

                    <div className="flex flex-col gap-2">
                   

                      <Button variant="outline" onClick={() => downloadJSON()} className="cursor-pointer"><Download /> Download JSON</Button>
                      <Button variant="ghost" onClick={() => setShowRaw(s => !s)} className="cursor-pointer"><List /> {showRaw ? "Hide Raw" : "Show Raw"}</Button>
                      <Button variant="ghost" onClick={() => openBookResource()} className="cursor-pointer"><ExternalLink /> Open Resource</Button>
                      <Button variant="ghost" onClick={() => setDialogOpen(true)} className="cursor-pointer"><ImageIcon /> View Cover</Button>
                    </div>

                    <Separator />

                   
                  </div>
                </div>
              )}
            </CardContent>

            {/* raw response */}
            <AnimatePresence>
              {showRaw && rawResp && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("p-4 border-t", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm font-medium">Raw Response</div>
                    <div className="text-xs opacity-60">JSON</div>
                  </div>
                  <ScrollArea style={{ maxHeight: 320 }}>
                    <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")}>
                      {prettyJSON(rawResp)}
                    </pre>
                  </ScrollArea>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* Right: metadata / random books */}
        <aside className={clsx("lg:col-span-4 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold">Book Snapshot</div>
              <div className="text-xs opacity-60">Live metadata</div>
            </div>

            {currentVolume ? (
              <div className="space-y-3">
                <div className="text-sm font-medium">{get(volumeInfo, "title")}</div>
                <div className="text-xs opacity-60">{(get(volumeInfo,"authors",[])||[]).join(", ")}</div>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="text-xs opacity-60">Pages</div><div className="text-sm">{get(volumeInfo,"pageCount","—")}</div>
                  <div className="text-xs opacity-60">Language</div><div className="text-sm">{get(volumeInfo,"language","—")}</div>
                  <div className="text-xs opacity-60">Published</div><div className="text-sm">{get(volumeInfo,"publishedDate","—")}</div>
                  <div className="text-xs opacity-60">ISBN</div><div className="text-sm">{(get(volumeInfo,"industryIdentifiers",[])||[]).map(i=>i.identifier).join(", ")||"—"}</div>
                </div>
              </div>
            ) : (
              <div className="text-sm opacity-60">Select a book to see a snapshot</div>
            )}

            <Separator className="my-3" />

            <div className="text-sm font-semibold mb-2">10 Random Picks</div>
            <ScrollArea style={{ height: 320 }}>
              <div className="space-y-2">
                {loadingRandom ? (
                  <div className="text-sm opacity-60">Loading…</div>
                ) : randomBooks.length === 0 ? (
                  <div className="text-sm opacity-60">No picks yet</div>
                ) : (
                  randomBooks.map((b, i) => {
                    const vi = get(b, "volumeInfo", {});
                    return (
                      <div key={b.id ?? i} className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-50 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => chooseSuggestion(b)}>
                        <img src={get(vi, "imageLinks.thumbnail", "")} alt={get(vi, "title", "")} className="w-10 h-14 object-cover rounded-sm" />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium w-50 truncate">{get(vi, "title", "Untitled")}</div>
                          <div className="text-xs opacity-60 truncate">{(get(vi, "authors", []) || []).slice(0, 1).join(", ") || "Unknown"}</div>
                        </div>
                        <div className="text-xs opacity-60">{get(vi, "publishedDate", "—")}</div>
                      </div>
                    );
                  })
                )}
              </div>
            </ScrollArea>

            <Separator className="my-3" />

         
          </div>
        </aside>
      </main>

      {/* Cover dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{get(volumeInfo, "title", "Cover")}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {get(volumeInfo, "imageLinks.thumbnail") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={get(volumeInfo, "imageLinks.thumbnail")} alt={get(volumeInfo, "title", "")} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center text-sm opacity-60">No cover image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image provided by Google Books API</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="cursor-pointer"><X /></Button>
              <Button variant="outline" onClick={() => { const info = get(volumeInfo,"infoLink"); if (info) window.open(info,"_blank"); }} className="cursor-pointer"><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
