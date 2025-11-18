// src/pages/OpenLibraryProPage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ExternalLink,
  Download,
  Copy,
  Loader2,
  ImageIcon,
  Star,
  BookOpen,
  Users,
  MapPin,
  Tags,
  Layers,
  X,
  Database,
  BarChart2,
  Info
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";

import { showToast } from "../lib/ToastHelper";

/**
 * Ultra professional Open Library explorer
 *
 * Notes:
 * - Uses Vite proxy path `/openlib/search.json?q=...` (configure vite.config.js proxy)
 * - Designed to mirror the "Pulse — Tech News" theme but upgraded with glass + gradient
 * - Remove local storage/favorites intentionally
 */

/* ---------- Config ---------- */
const BASE_ENDPOINT_PROXY = "/openlib/search.json"; // configure vite proxy -> https://openlibrary.org

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}
function coverImageUrl(coverId, size = "L") {
  if (!coverId) return null;
  return `https://covers.openlibrary.org/b/id/${coverId}-${size}.jpg`;
}
function clsBgGlass(isDark) {
  return isDark ? "bg-black/50 backdrop-blur-md border-zinc-800" : "bg-white/75 backdrop-blur-sm border-zinc-200";
}

/* ---------- Component ---------- */
export default function OpenLibraryProPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // state
  const [query, setQuery] = useState("harry potter");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [selected, setSelected] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const [coverOpen, setCoverOpen] = useState(false);
  const [loadingSelected, setLoadingSelected] = useState(false);

  const suggestTimer = useRef(null);

  /* initial fetch */
  useEffect(() => {
    searchBooks(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Search function */
  async function searchBooks(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);
    try {
      const params = new URLSearchParams();
      params.set("q", q);
      // fields=*,availability gives lots of details; limit keep sane
      params.set("fields", "*,availability,number_of_pages_median");
      params.set("limit", "30");
      const url = `${BASE_ENDPOINT_PROXY}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        showToast("error", `Search failed (${res.status})`);
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      const json = await res.json();
      setRawResp(json);
      const docs = Array.isArray(json.docs) ? json.docs : [];
      setSuggestions(docs);
      // default select first for nicer UX
      if (docs.length > 0) setSelected(docs[0]);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to query Open Library (CORS or network?)");
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
    }
  }

  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      searchBooks(v);
    }, 350);
  }

  function handleSubmit(e) {
    e?.preventDefault?.();
    if (!query || query.trim().length === 0) {
      showToast("info", "Try: 'harry potter', 'tolkien', 'isbn:0451526538'");
      return;
    }
    setShowSuggest(true);
    searchBooks(query);
  }

  function chooseItem(doc) {
    setSelected(doc);
    setShowSuggest(false);
    // smooth scroll to top of center container? leaving to layout
  }

  function openOpenLibraryPage(doc) {
    if (!doc) return showToast("info", "Select a book.");
    const key = doc.key || (doc.edition_key && doc.edition_key[0]);
    if (!key) return showToast("info", "No Open Library key.");
    const path = key.startsWith("/works") || key.startsWith("/books") ? key : `/works/${key}`;
    window.open(`https://openlibrary.org${path}`, "_blank");
  }

  function copyJSON(payload = null) {
    const p = payload || selected || rawResp;
    if (!p) return showToast("info", "Nothing to copy");
    navigator.clipboard.writeText(prettyJSON(p));
    showToast("success", "JSON copied to clipboard");
  }

  function downloadJSON(payload = null) {
    const p = payload || selected || rawResp;
    if (!p) return showToast("info", "Nothing to download");
    const blob = new Blob([prettyJSON(p)], { type: "application/json" });
    const fn = `openlibrary_${(selected?.title || "export").replace(/\s+/g, "_").slice(0, 80)}.json`;
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fn;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  /* Field helpers */
  function renderAuthors(a) {
    if (!a) return "—";
    if (Array.isArray(a)) return a.join(", ");
    return a;
  }
  function renderList(list, limit = 8) {
    if (!list || list.length === 0) return "—";
    return list.slice(0, limit).join(", ");
  }

  /* Ratings bar small helper */
  function RatingsBar({ avg, count }) {
    return (
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Star className="text-amber-400" />
          <div className="font-semibold">{avg ? avg.toFixed(2) : "—"}</div>
        </div>
        <div className="text-xs opacity-60">{count ? `${count} ratings` : "No ratings"}</div>
      </div>
    );
  }

  return (
    <div className={clsx("min-h-screen p-6 max-w-9xl mx-auto")}>
      {/* Top header + search */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold tracking-tight")}>Library Studio — Book Explorer</h1>
          <p className="mt-1 text-sm opacity-70 max-w-2xl">
            Ultra-professional Open Library explorer — search works, inspect rich metadata, view cover art, availability and editions.
          </p>
        </div>

        <form onSubmit={handleSubmit} className={clsx("flex items-center gap-2 w-full md:w-[720px] rounded-xl px-4 py-2", clsBgGlass(isDark), "border")}>
          <Search className="opacity-70" />
          <Input
            placeholder="Search books, authors, ISBNs, e.g. 'harry potter', 'tolkien', 'isbn:0451526538'..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="border-0 shadow-none bg-transparent outline-none"
            onFocus={() => setShowSuggest(true)}
          />
          <Button type="submit" variant="outline" className="px-4">
            <Search /> <span className="ml-2 hidden md:inline">Search</span>
          </Button>
        </form>
      </header>

      {/* Suggestions floating */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={clsx(
              "absolute z-50 left-6 right-6 md:left-[calc(50%_-_360px)] md:right-auto max-w-[1100px] rounded-2xl overflow-hidden shadow-2xl",
              clsBgGlass(isDark),
              "border"
            )}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            <ScrollArea style={{ maxHeight: 380 }}>
              {suggestions.map((s, i) => {
                const title = s.title || "Untitled";
                const sub = (s.author_name && s.author_name.join(", ")) || s.first_publish_year || "—";
                const cover = coverImageUrl(s.cover_i, "M");
                return (
                  <li
                    key={s.key || s.cover_i || i}
                    className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-900/40 cursor-pointer"
                    onClick={() => chooseItem(s)}
                  >
                    <div className="flex items-center gap-4">
                      <img src={cover || "/api_previews/openlibrary.png"} alt={title} className="w-14 h-20 object-cover rounded-md flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold truncate">{title}</div>
                        <div className="text-xs opacity-60 truncate">{sub}</div>
                        <div className="text-xs opacity-60 mt-1">{s.edition_count ? `${s.edition_count} editions` : ""}</div>
                      </div>
                      <div className="text-xs opacity-60 text-right">{s.language ? (Array.isArray(s.language) ? s.language.join(", ") : s.language) : "—"}</div>
                    </div>
                  </li>
                );
              })}
            </ScrollArea>
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout: left results | center details | right quick actions */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: Results list */}
        <aside className="lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", clsBgGlass(isDark))}>
            <CardHeader className={clsx("p-4", clsBgGlass(isDark), "border-b")}>
              <div className="flex items-center justify-between w-full">
                <CardTitle className="text-sm font-semibold">Search results</CardTitle>
                <div className="text-xs opacity-60">{suggestions.length} items</div>
              </div>
              <div className="text-xs opacity-60 mt-1">Select any result to view detailed metadata.</div>
            </CardHeader>

            <CardContent className="p-2">
              <ScrollArea style={{ maxHeight: 720 }}>
                <div className="space-y-2">
                  {suggestions.length === 0 && !loadingSuggest ? (
                    <div className="p-4 text-sm opacity-60">No results — try a different query.</div>
                  ) : (
                    suggestions.map((s, i) => {
                      const title = s.title || "Untitled";
                      const author = (s.author_name && s.author_name.join(", ")) || "Unknown";
                      const cover = coverImageUrl(s.cover_i, "M");
                      const active = selected && selected.key === s.key;
                      return (
                        <div
                          key={s.key || i}
                          onClick={() => chooseItem(s)}
                          className={clsx(
                            "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                            active ? (isDark ? "bg-zinc-800/50" : "bg-zinc-100") : "hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                          )}
                        >
                          <img src={cover || "/api_previews/openlibrary.png"} alt={title} className="w-12 h-16 object-cover rounded-md flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{title}</div>
                            <div className="text-xs opacity-60 truncate">{author}</div>
                            <div className="text-xs opacity-60 mt-1">{s.first_publish_year ? `First: ${s.first_publish_year}` : ""}</div>
                          </div>
                          <div className="text-xs opacity-60">{s.edition_count ?? "-"}</div>
                        </div>
                      );
                    })
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card className={clsx("rounded-2xl overflow-hidden border p-4", clsBgGlass(isDark))}>
            <div className="text-sm font-semibold mb-2">Search tips</div>
            <div className="text-xs opacity-70">
              Use queries like: <span className="font-medium">'harry potter'</span>, <span className="font-medium">'tolkien'</span>, or <span className="font-medium">'isbn:0451526538'</span>.
            </div>
            <Separator className="my-3" />
            <div className="text-xs opacity-60">This interface surfaces ratings, subjects, places, contributors and availability where provided by Open Library.</div>
          </Card>
        </aside>

        {/* Center: Details */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", "relative", clsBgGlass(isDark))}>
            <CardHeader className={clsx("p-6 flex items-start justify-between gap-4", clsBgGlass(isDark), "border-b")}>
              <div className="min-w-0">
                <h2 className="text-xl font-extrabold leading-tight truncate">{selected?.title || "Select a work to inspect"}</h2>
                <div className="text-sm opacity-70 mt-1">{renderAuthors(selected?.author_name)}</div>
                <div className="text-xs opacity-60 mt-1">
                  {selected?.first_publish_year ? `First published ${selected.first_publish_year}` : "Publication year unknown"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => { if (selected) openOpenLibraryPage(selected); else showToast("info", "Select a book"); }}>
                  <ExternalLink /> <span className="ml-2 hidden md:inline">Open</span>
                </Button>

                <Button variant="ghost" onClick={() => setShowRaw((s) => !s)}>
                  <BookOpen /> <span className="ml-2 hidden md:inline">{showRaw ? "Hide Raw" : "Raw"}</span>
                </Button>

                <Button variant="ghost" onClick={() => { if (selected?.cover_i) setCoverOpen(true); else showToast("info", "No cover available"); }}>
                  <ImageIcon /> <span className="ml-2 hidden md:inline">Cover</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {loadingSelected ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !selected ? (
                <div className="py-12 text-center text-sm opacity-60">No work selected. Use the search bar or choose a result on the left.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* cover & stats */}
                  <div className={clsx("rounded-xl p-4 border", clsBgGlass(isDark))}>
                    <img
                      src={coverImageUrl(selected.cover_i, "L") || "/api_previews/openlibrary.png"}
                      alt={selected.title}
                      className="w-full h-72 object-contain rounded-md mb-4 bg-zinc-50 dark:bg-zinc-900"
                      style={{ cursor: selected?.cover_i ? "pointer" : "default" }}
                      onClick={() => { if (selected?.cover_i) setCoverOpen(true); }}
                    />

                    <div className="flex items-center justify-between mt-2">
                      <div>
                        <div className="text-xs opacity-60">Edition count</div>
                        <div className="font-medium">{selected.edition_count ?? "—"}</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60">Pages (median)</div>
                        <div className="font-medium">{selected.number_of_pages_median ?? "—"}</div>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="space-y-2">
                      <div className="text-xs opacity-60">Availability</div>
                      <div className="text-sm font-medium">{selected.ebook_access ? `${selected.ebook_access} (${selected.ebook_provider?.join?.(", ") || "—"})` : "No ebook info"}</div>
                      <div className="text-xs opacity-60 mt-1">IA loaded: {selected.ia_loaded_id?.slice?.(0, 3)?.join?.(", ") || "—"}</div>
                    </div>
                  </div>

                  {/* main metadata */}
                  <div className={clsx("p-4 rounded-xl border col-span-2", clsBgGlass(isDark))}>
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold">Description</div>
                        <div className="text-sm mt-2 leading-relaxed">
                          {/* search.json often lacks long descriptions; show first_sentence or hint */}
                          {selected.first_sentence ? (
                            <span className="italic opacity-90">{typeof selected.first_sentence === "string" ? selected.first_sentence : JSON.stringify(selected.first_sentence)}</span>
                          ) : (
                            <span className="opacity-70">No description in search results. Click "Open" to view the Open Library work page for full summary and editions.</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <RatingsBar avg={selected.ratings_average} count={selected.ratings_count} />
                        <div className="text-xs opacity-60 mt-2">Reading logs: {selected.readinglog_count ?? 0}</div>
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Publishers</div>
                        <div className="text-sm font-medium break-words">{renderList(selected.publisher, 6)}</div>
                      </div>

                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">ISBNs</div>
                        <div className="text-sm font-medium break-words">{renderList(selected.isbn, 8)}</div>
                      </div>

                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Subjects</div>
                        <div className="text-sm font-medium break-words">{renderList(selected.subject, 8)}</div>
                      </div>

                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">DDC / LCC</div>
                        <div className="text-sm font-medium break-words">{renderList(selected.ddc || selected.lcc, 6)}</div>
                      </div>

                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Places</div>
                        <div className="text-sm font-medium break-words">{renderList(selected.place, 8)}</div>
                      </div>

                      <div className="p-3 rounded-md border">
                        <div className="text-xs opacity-60">Core people (characters)</div>
                        <div className="text-sm font-medium break-words">{renderList(selected.person, 8)}</div>
                      </div>

                      <div className="p-3 rounded-md border col-span-1 sm:col-span-2">
                        <div className="text-xs opacity-60">Contributors / Illustrators</div>
                        <div className="text-sm font-medium break-words">{renderList(selected.contributor, 10)}</div>
                      </div>

                      <div className="p-3 rounded-md border col-span-1 sm:col-span-2">
                        <div className="text-xs opacity-60">Other metadata</div>
                        <div className="text-sm font-medium break-words">
                          Languages: {renderList(selected.language)} • Edition keys: {renderList(selected.edition_key, 6)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <AnimatePresence>
              {showRaw && rawResp && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={clsx("p-4 border-t", clsBgGlass(isDark))}>
                  <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 300 }}>
                    {prettyJSON(selected || rawResp)}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* Right: Quick actions */}
        <aside className="lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border p-4", clsBgGlass(isDark))}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Quick actions</div>
                <div className="text-xs opacity-60">Operate on the selected work</div>
              </div>
              <Info className="opacity-60" />
            </div>

            <Separator className="my-3" />

            <div className="space-y-2">
              <Button className="w-full" variant="outline" onClick={() => { if (!selected) return showToast("info", "Select a book"); openOpenLibraryPage(selected); }}>
                <ExternalLink /> <span className="ml-2">Open on OpenLibrary</span>
              </Button>

              <Button className="w-full" variant="outline" onClick={() => { if (!selected) return showToast("info", "Select a book"); copyJSON(); }}>
                <Copy /> <span className="ml-2">Copy JSON</span>
              </Button>

              <Button className="w-full" variant="outline" onClick={() => { if (!selected && !rawResp) return showToast("info", "Nothing to download"); downloadJSON(selected || rawResp); }}>
                <Download /> <span className="ml-2">Download JSON</span>
              </Button>

              <Button className="w-full" variant="outline" onClick={() => { if (!selected || !selected.ebook_access) return showToast("info", "No ebook info"); window.open(`https://openlibrary.org/search?q=${encodeURIComponent(selected.title)}&mode=ebooks`, "_blank"); }}>
                <Database /> <span className="ml-2">Search ebooks</span>
              </Button>

              <Button className="w-full" variant="ghost" onClick={() => { if (!selected) return showToast("info", "Select a book"); setCoverOpen(true); }}>
                <ImageIcon /> <span className="ml-2">View cover</span>
              </Button>

              <Button className="w-full" variant="ghost" onClick={() => { if (!selected) return showToast("info", "Select a book"); window.open(`https://openlibrary.org/search?q=${encodeURIComponent(selected.title)}`, "_blank"); }}>
                <Layers /> <span className="ml-2">More editions</span>
              </Button>
            </div>

            <Separator className="my-3" />

            <div className="text-xs opacity-60">
              Powered by Open Library — this interface surfaces enriched search fields (availability, ratings, metadata) and presents them in a professional UI.
            </div>
          </Card>
        </aside>
      </main>

      {/* Cover dialog */}
      <Dialog open={coverOpen} onOpenChange={setCoverOpen}>
        <DialogContent className={clsx("max-w-4xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/95" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{selected?.title || "Cover"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {selected?.cover_i ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={coverImageUrl(selected.cover_i, "L")} alt={selected?.title} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center">No cover available</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image: Open Library Covers</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setCoverOpen(false)}><X /></Button>
              <Button variant="outline" onClick={() => { if (selected) openOpenLibraryPage(selected); }}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
