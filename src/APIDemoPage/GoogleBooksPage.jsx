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
  Hash
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

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

  const suggestTimer = useRef(null);

  /* fetch helpers */
  async function fetchBooks(q = DEFAULT_QUERY) {
    setLoadingVolume(true);
    try {
      const params = new URLSearchParams({ q });
      // request some fields for smaller payload if you want
      // params.set("projection", "full");
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
      const params = new URLSearchParams({ q, maxResults: "10" });
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

  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => searchBooks(v), 350);
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
  }

  function copyVolumeToClipboard() {
    if (!currentVolume) return showToast("info", "No book loaded");
    navigator.clipboard.writeText(prettyJSON(currentVolume));
    showToast("success", "Book JSON copied");
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
    // initial fetch
    fetchBooks(DEFAULT_QUERY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* derived */
  const volumeInfo = currentVolume ? get(currentVolume, "volumeInfo", {}) : null;
  const saleInfo = currentVolume ? get(currentVolume, "saleInfo", {}) : null;
  const accessInfo = currentVolume ? get(currentVolume, "accessInfo", {}) : null;

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>Bibliotheca — Books Search</h1>
          <p className="mt-1 text-sm opacity-70">Powerful Google Books search — previews, downloads, and full metadata inspection.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-3 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search titles, authors, ISBN, or keywords..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="outline" className="px-3" onClick={() => fetchBooks(DEFAULT_QUERY)}>Default</Button>
            <Button type="submit" variant="ghost" className="px-3"><Search /></Button>
          </form>
        </div>
      </header>

      {/* suggestions */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, idx) => {
              const vi = get(s, "volumeInfo", {});
              return (
                <li key={s.id ?? idx} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => chooseSuggestion(s)}>
                  <div className="flex items-center gap-3">
                    <img src={get(vi, "imageLinks.thumbnail", "")} alt={get(vi, "title", "thumb")} className="w-12 h-16 object-cover rounded-sm" />
                    <div className="flex-1">
                      <div className="font-medium">{get(vi, "title", "Untitled")}</div>
                      <div className="text-xs opacity-60">{(get(vi, "authors", []) || []).slice(0, 2).join(", ") || "Unknown author"}</div>
                    </div>
                    <div className="text-xs opacity-60">{get(vi, "publishedDate", "—")}</div>
                  </div>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Center: book viewer */}
        <section className="lg:col-span-9 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center flex-wrap gap-3 justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Book Details</CardTitle>
                <div className="text-xs opacity-60">{get(volumeInfo, "title", "Waiting for a book...")}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => fetchBooks(query)}><Loader2 className={loadingVolume ? "animate-spin" : ""} /></Button>
                <Button variant="ghost" onClick={() => setShowRaw(s => !s)}><List /> {showRaw ? "Hide JSON" : "Show JSON"}</Button>
                <Button variant="ghost" onClick={() => setDialogOpen(true)}><ImageIcon /> Cover</Button>
                <Button variant="outline" onClick={openBookResource}><BookOpen /> Read / Download</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loadingVolume ? (
                <div className="py-16 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !currentVolume ? (
                <div className="py-12 text-center text-sm opacity-60">No book selected — search or choose a suggestion.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Left: Cover & basic meta */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <img src={get(volumeInfo, "imageLinks.thumbnail", "")} alt={get(volumeInfo, "title", "")} className="w-full rounded-md object-contain mb-3" />
                    <div className="text-lg font-semibold">{get(volumeInfo, "title", "Untitled")}</div>
                    {get(volumeInfo, "subtitle") && <div className="text-sm opacity-70">{get(volumeInfo, "subtitle")}</div>}
                    <div className="text-xs opacity-60 mt-2">{(get(volumeInfo, "authors", []) || []).join(", ") || "Unknown author"}</div>

                    <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Publisher</div>
                        <div className="font-medium">{get(volumeInfo, "publisher", "—")}</div>
                      </div>
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Published</div>
                        <div className="font-medium">{get(volumeInfo, "publishedDate", "—")}</div>
                      </div>
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Pages</div>
                        <div className="font-medium">{get(volumeInfo, "pageCount", "—")}</div>
                      </div>
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Language</div>
                        <div className="font-medium">{get(volumeInfo, "language", "—")}</div>
                      </div>
                    </div>

                    <div className="mt-4 space-y-2">
                      <Button variant="outline" onClick={() => { const link = get(volumeInfo, "previewLink") || get(volumeInfo, "infoLink"); if (link) window.open(link, "_blank"); else showToast("info", "No preview available"); }}><ExternalLink /> Preview</Button>
                      <Button variant="outline" onClick={() => { const pdf = get(accessInfo, "pdf.acsTokenLink"); if (pdf) window.open(pdf, "_blank"); else showToast("info", "No PDF sample available"); }}><Download /> Download Sample</Button>
                    </div>
                  </div>

                  {/* Right: description and metadata */}
                  <div className={clsx("p-4 rounded-xl border col-span-1 md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <div className="text-xs opacity-60">Title</div>
                        <div className="text-lg font-semibold">{get(volumeInfo, "title", "Untitled")}</div>
                        {get(volumeInfo, "subtitle") && <div className="text-sm opacity-70">{get(volumeInfo, "subtitle")}</div>}
                      </div>

                      <div className="text-right">
                        <div className="text-xs opacity-60">Rating</div>
                        <div className="font-medium">{get(volumeInfo, "averageRating", "—")} {get(volumeInfo, "ratingsCount") ? <span className="text-xs opacity-60">({get(volumeInfo,"ratingsCount")})</span> : null}</div>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="prose max-w-none mb-4 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: (get(volumeInfo, "description", "No description available.")).replace(/\n/g, "<br/>") }} />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Categories</div>
                        <div className="font-medium">{(get(volumeInfo, "categories", []) || []).join(", ") || "—"}</div>
                      </div>
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Identifiers</div>
                        <div className="text-sm font-medium">
                          {((get(volumeInfo, "industryIdentifiers", []) || []).length > 0) ? ((get(volumeInfo, "industryIdentifiers") || []).map(id => `${id.type}: ${id.identifier}`).join(", ")) : "—"}
                        </div>
                      </div>
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Access</div>
                        <div className="font-medium">{get(accessInfo, "accessViewStatus", "—")} {get(accessInfo,"embeddable") ? " • Embeddable" : ""}</div>
                      </div>
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Saleability</div>
                        <div className="font-medium">{get(saleInfo, "saleability", "—")} {get(saleInfo, "isEbook") ? " • eBook" : ""}</div>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="text-xs opacity-60 mb-2">Search snippet</div>
                    <div className="text-sm italic">{get(currentVolume, "searchInfo.textSnippet", "—")}</div>

                    <div className="mt-4 flex gap-2">
                      <Button variant="ghost" onClick={() => copyVolumeToClipboard()}><Copy /> Copy JSON</Button>
                      <Button variant="ghost" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <AnimatePresence>
              {showRaw && rawResp && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("p-4 border-t", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                  <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 320 }}>
                    {prettyJSON(rawResp)}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* Right: metadata / dev quick links */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
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

            <div className="text-sm font-semibold mb-2">Developer</div>
            <div className="text-xs opacity-60">Endpoint & quick actions</div>
            <div className="mt-2 space-y-2">
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(`${BASE_ENDPOINT}?q=${encodeURIComponent(query || DEFAULT_QUERY)}`); showToast("success","Endpoint copied"); }}><Copy /> Copy Endpoint</Button>
              <Button variant="outline" onClick={()=>downloadJSON()}><Download /> Download JSON</Button>
              <Button variant="outline" onClick={() => setShowRaw(s => !s)}><List /> Toggle Raw</Button>
            </div>
          </div>
        </aside>
      </main>

      {/* Cover dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
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
              <Button variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
              <Button variant="outline" onClick={() => { const info = get(volumeInfo,"infoLink"); if (info) window.open(info,"_blank"); }}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
