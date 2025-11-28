// src/pages/OpenLibraryProPage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu,
  Search,
  ExternalLink,
  Download,
  Copy,
  Check,
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
  Info,
  RefreshCw,
  MenuSquare as Menu2
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
 * Improved Open Library explorer (mobile-friendly + animations)
 *
 * Notes:
 * - Uses Vite proxy path `/openlib/search.json?q=...` (configure vite.config.js proxy)
 * - Mobile uses a Sheet/drawer for results (shadcn-style). If your project uses a different Sheet API,
 *   swap imports for correct names.
 */

/* ---------- (Optional) Sheet components from shadcn UI ----------
   If your project exposes Sheet components at "@/components/ui/sheet", keep them.
   Otherwise replace with your Drawer/Sheet equivalent.
*/
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
  SheetClose
} from "@/components/ui/sheet";

/* ---------- Config ---------- */
const BASE_ENDPOINT_PROXY = "/openlib/search.json"; // configure vite proxy -> https://openlibrary.org"

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
function sampleFallbackDocs() {
  // small fallback set if no results yet (keeps UI lively)
  return new Array(10).fill(0).map((_, i) => ({
    key: `/works/OL${1000 + i}W`,
    title: `Sample Book ${i + 1}`,
    author_name: ["Sample Author"],
    cover_i: null,
    edition_count: Math.floor(Math.random() * 10) + 1,
    first_publish_year: 1990 + (i % 30),
  }));
}
function pickRandomTen(arr) {
  if (!arr || arr.length === 0) return sampleFallbackDocs();
  const copy = [...arr];
  const out = [];
  while (out.length < 10 && copy.length > 0) {
    const idx = Math.floor(Math.random() * copy.length);
    out.push(copy.splice(idx, 1)[0]);
  }
  // pad if fewer than 10
  while (out.length < 10) out.push(...sampleFallbackDocs().slice(0, 10 - out.length));
  return out.slice(0, 10);
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
  const [sidebarItems, setSidebarItems] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [selected, setSelected] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const [coverOpen, setCoverOpen] = useState(false);
  const [loadingSelected, setLoadingSelected] = useState(false);

  const [sheetOpen, setSheetOpen] = useState(false); // mobile sheet
  const [copyStatus, setCopyStatus] = useState("idle"); // idle | copying | copied

  const suggestTimer = useRef(null);
  const copyTimer = useRef(null);

  /* initial fetch */
  useEffect(() => {
    searchBooks(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // whenever suggestions change, refresh the sidebar random selection
    setSidebarItems(pickRandomTen(suggestions));
  }, [suggestions]);

  useEffect(() => {
    return () => {
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
      if (copyTimer.current) clearTimeout(copyTimer.current);
    };
  }, []);

  /* Search function */
  async function searchBooks(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      setSidebarItems(pickRandomTen([]));
      return;
    }
    setLoadingSuggest(true);
    try {
      const params = new URLSearchParams();
      params.set("q", q);
      params.set("fields", "*,availability,number_of_pages_median,first_sentence,ia_loaded_id,ebook_access,ebook_provider");
      params.set("limit", "40");
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
      setShowRaw(false);
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
    setSheetOpen(false); // close mobile sheet if open
    // scroll & minor polish could be added
  }

  function openOpenLibraryPage(doc) {
    if (!doc) return showToast("info", "Select a book.");
    const key = doc.key || (doc.edition_key && doc.edition_key[0]);
    if (!key) return showToast("info", "No Open Library key.");
    const path = key.startsWith("/works") || key.startsWith("/books") ? key : `/works/${key}`;
    window.open(`https://openlibrary.org${path}`, "_blank");
  }

  async function copyJSON(payload = null) {
    const p = payload || selected || rawResp;
    if (!p) return showToast("info", "Nothing to copy");

    try {
      setCopyStatus("copying");
      await navigator.clipboard.writeText(prettyJSON(p));
      setCopyStatus("copied");
      showToast("success", "JSON copied to clipboard");
      // reset after a short delay (animated)
      if (copyTimer.current) clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopyStatus("idle"), 2000);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to copy");
      setCopyStatus("idle");
    }
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
          <div className="font-semibold">{avg ? Number(avg).toFixed(2) : "—"}</div>
        </div>
        <div className="text-xs opacity-60">{count ? `${count} ratings` : "No ratings"}</div>
      </div>
    );
  }

  /* Sidebar refresh */
  function refreshSidebar() {
    setSidebarItems(pickRandomTen(suggestions));
  }

  return (
    <div className={clsx("min-h-screen pb-10 p-4 sm:p-6 max-w-9xl mx-auto")}>
      {/* Top header + search */}
      <header className="flex items-start flex-wrap sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          {/* Mobile menu trigger */}
          <div className="sm:hidden">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="p-2 rounded-md cursor-pointer">
                  <Menu2 />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className={clsx("w-[90%] sm:w-[420px] p-0", clsBgGlass(isDark))}>
                <SheetHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <SheetTitle className="text-lg font-bold">Search results</SheetTitle>
                 
                  </div>
                </SheetHeader>
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm opacity-70">Quick picks</div>
                    <Button size="sm" variant="ghost" className="cursor-pointer" onClick={refreshSidebar}>
                      <RefreshCw size={16} />
                    </Button>
                  </div>
                  <ScrollArea className="overflow-y-auto" style={{ maxHeight: "65vh" }}>
                    <div className="space-y-2">
                      {sidebarItems.map((s, i) => (
                        <div
                          key={s.key || s.cover_i || i}
                          onClick={() => chooseItem(s)}
                          className={clsx(
                            "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                            selected && selected.key === s.key ? "bg-zinc-100 dark:bg-zinc-800/50" : "hover:bg-zinc-50 dark:hover:bg-zinc-900/40"
                          )}
                        >
                          <img src={coverImageUrl(s.cover_i, "M") || "/api_previews/openlibrary.png"} alt={s.title} className="w-10 h-14 object-cover rounded-md flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{s.title}</div>
                            <div className="text-xs opacity-60 truncate">{(s.author_name && s.author_name.join(", ")) || s.first_publish_year || "—"}</div>
                          </div>
                          <div className="text-xs opacity-60">{s.edition_count ?? "-"}</div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div>
            <h1 className={clsx("text-2xl sm:text-3xl font-extrabold leading-tight truncate")}>Library Studio</h1>
            <p className="text-xs opacity-70 -mt-1">Ultra-professional Open Library explorer</p>
          </div>
        </div>

        {/* Search form */}
        <form onSubmit={handleSubmit} className={clsx("flex items-center gap-2 w-full sm:w-[720px] rounded-xl px-3 py-2", clsBgGlass(isDark), "border")}>
          <Search className="opacity-70" />
          <Input
            placeholder="Search books, authors, ISBNs, e.g. 'harry potter', 'tolkien', 'isbn:0451526538'..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="border-0 shadow-none bg-transparent outline-none"
            onFocus={() => setShowSuggest(true)}
          />
          <Button type="submit" variant="outline" className="px-3 cursor-pointer">
            <Search /> <span className="ml-2 hidden md:inline">Search</span>
          </Button>
          <Button variant="ghost" className="cursor-pointer" onClick={() => { setQuery(""); setSuggestions([]); setSidebarItems(pickRandomTen([])); }}>
            <RefreshCw />
          </Button>
        </form>
      </header>

      {/* Suggestions floating (desktop) */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={clsx(
              "hidden sm:block absolute z-50 left-6 right-6 md:left-[calc(50%_-_360px)] md:right-auto max-w-[1100px] rounded-2xl overflow-hidden shadow-2xl",
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
        {/* Left: Results list (desktop only) */}
        <aside className="hidden lg:block lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", clsBgGlass(isDark))}>
            <CardHeader className={clsx("p-4", clsBgGlass(isDark), "border-b")}>
              <div className="flex items-center justify-between w-full">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Users /> Search results
                </CardTitle>
                <div className="text-xs opacity-60 flex items-center gap-2">
                  <span>{suggestions.length} items</span>
                  <Button size="sm" variant="ghost" onClick={refreshSidebar} className="cursor-pointer p-1">
                    <RefreshCw />
                  </Button>
                </div>
              </div>
              <div className="text-xs opacity-60 mt-1">Select any result to view detailed metadata.</div>
            </CardHeader>

            <CardContent className="p-2">
              <ScrollArea className="overflow-y-auto" style={{ maxHeight: 720 }}>
                <div className="space-y-2">
                  {suggestions.length === 0 && !loadingSuggest ? (
                    <div className="p-4 text-sm opacity-60">No results — try a different query.</div>
                  ) : (
                    suggestions.slice(0, 50).map((s, i) => {
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
            <CardHeader className={clsx("p-6 flex flex-col flex-wrap sm:flex-row items-start sm:items-center justify-between gap-4", clsBgGlass(isDark), "border-b")}>
              <div className="">
                <h2 className="text-xl sm:text-2xl font-extrabold  flex items-center gap-3">
                  <BookOpen /> <span>{selected?.title || "Select a work to inspect"}</span>
                </h2>
                <div className="text-sm opacity-70 mt-1 flex items-center gap-3">
                  <span className="flex items-center gap-1"><Users className="opacity-70" /> {renderAuthors(selected?.author_name)}</span>
                  <span className="text-xs opacity-60">•</span>
                  <span className="text-xs opacity-60 flex items-center gap-1"><BarChart2 className="opacity-70" /> {selected?.first_publish_year ? `First: ${selected.first_publish_year}` : "Year unknown"}</span>
                </div>
                <div className="text-xs opacity-60 mt-2 flex items-center gap-3">
                  <span className="flex items-center gap-1"><MapPin className="opacity-70" /> {renderList(selected?.place, 3)}</span>
                  <span className="flex items-center gap-1"><Tags className="opacity-70" /> {renderList(selected?.subject, 3)}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => { if (selected) openOpenLibraryPage(selected); else showToast("info", "Select a book"); }} className="cursor-pointer">
                  <ExternalLink /> <span className="ml-2 hidden md:inline">Open</span>
                </Button>


                <Button variant="ghost" onClick={() => { if (selected?.cover_i) setCoverOpen(true); else showToast("info", "No cover available"); }} className="cursor-pointer">
                  <ImageIcon /> <span className="ml-2 hidden md:inline">Cover</span>
                </Button>

               
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {loadingSelected ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !selected ? (
                <div className="py-12 text-center text-sm opacity-60">No work selected. Use the search bar or choose a result on the left or mobile sheet.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* cover & quick stats */}
                  <div className={clsx("rounded-xl p-4 border flex flex-col items-stretch", clsBgGlass(isDark))}>
                    <div className="w-full h-72 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 rounded-md overflow-hidden">
                      <img
                        src={coverImageUrl(selected.cover_i, "L") || "/api_previews/openlibrary.png"}
                        alt={selected.title}
                        className="max-h-full max-w-full object-contain cursor-pointer"
                        onClick={() => { if (selected?.cover_i) setCoverOpen(true); }}
                      />
                    </div>

                    <div className="mt-4 w-full grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs opacity-60">Edition count</div>
                        <div className="font-medium">{selected.edition_count ?? "—"}</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60">Pages (median)</div>
                        <div className="font-medium">{selected.number_of_pages_median ?? "—"}</div>
                      </div>

                      <div className="col-span-2">
                        <div className="text-xs opacity-60">Availability</div>
                        <div className="text-sm font-medium mt-1">{selected.ebook_access ? `${selected.ebook_access} (${selected.ebook_provider?.join?.(", ") || "—"})` : "No ebook info"}</div>
                        <div className="text-xs opacity-60 mt-1">IA loaded: {selected.ia_loaded_id?.slice?.(0, 3)?.join?.(", ") || "—"}</div>
                      </div>
                        <div className="">
                        <RatingsBar avg={selected.ratings_average} count={selected.ratings_count} />
                        <div className="text-xs opacity-60 flex items-end  mt-2">Reading logs: {selected.readinglog_count ?? 0}</div>
                      </div>
                    </div>
                  </div>

                  {/* main metadata */}
                  <div className={clsx("p-4 rounded-xl border col-span-2", clsBgGlass(isDark))}>
                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div>
                        <div className="text-sm font-semibold flex items-center gap-2"><Info /> Description</div>
                        <div className="text-sm mt-2 leading-relaxed text-justify">
                          {selected.first_sentence ? (
                            <span className="italic opacity-90">{typeof selected.first_sentence === "string" ? selected.first_sentence : JSON.stringify(selected.first_sentence)}</span>
                          ) : (
                            <span className="opacity-70">No description in search results. Click "Open" to view the Open Library work page for full summary and editions.</span>
                          )}
                        </div>

                        <Separator className="my-4" />

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-3 rounded-md border">
                            <div className="text-xs opacity-60 flex items-center gap-2"><Layers /> Publishers</div>
                            <div className="text-sm font-medium break-words mt-1">{renderList(selected.publisher, 6)}</div>
                          </div>

                          <div className="p-3 rounded-md border">
                            <div className="text-xs opacity-60 flex items-center gap-2"><Database /> ISBNs</div>
                            <div className="text-sm font-medium break-words mt-1">{renderList(selected.isbn, 8)}</div>
                          </div>

                          <div className="p-3 rounded-md border">
                            <div className="text-xs opacity-60 flex items-center gap-2"><Tags /> Subjects</div>
                            <div className="text-sm font-medium break-words mt-1">{renderList(selected.subject, 8)}</div>
                          </div>

                          <div className="p-3 rounded-md border">
                            <div className="text-xs opacity-60 flex items-center gap-2"><BarChart2 /> DDC / LCC</div>
                            <div className="text-sm font-medium break-words mt-1">{renderList(selected.ddc || selected.lcc, 6)}</div>
                          </div>

                          <div className="p-3 rounded-md border">
                            <div className="text-xs opacity-60 flex items-center gap-2"><MapPin /> Places</div>
                            <div className="text-sm font-medium break-words mt-1">{renderList(selected.place, 8)}</div>
                          </div>

                          <div className="p-3 rounded-md border">
                            <div className="text-xs opacity-60 flex items-center gap-2"><Users /> Characters</div>
                            <div className="text-sm font-medium break-words mt-1">{renderList(selected.person, 8)}</div>
                          </div>

                          <div className="p-3 rounded-md border col-span-1 sm:col-span-2">
                            <div className="text-xs opacity-60 flex items-center gap-2"><Info /> Contributors / Illustrators</div>
                            <div className="text-sm font-medium break-words mt-1">{renderList(selected.contributor, 10)}</div>
                          </div>

                          <div className="p-3 rounded-md border col-span-1 sm:col-span-2">
                            <div className="text-xs opacity-60">Other metadata</div>
                            <div className="text-sm font-medium break-words mt-1">
                              Languages: {renderList(selected.language)} • Edition keys: {renderList(selected.edition_key, 6)}
                            </div>
                          </div>
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
                <div className="text-sm font-semibold flex items-center gap-2"><Info /> Quick actions</div>
                <div className="text-xs opacity-60">Operate on the selected work</div>
              </div>
            </div>

            <Separator className="my-3" />

            <div className="space-y-2">
              <Button className="w-full cursor-pointer" variant="outline" onClick={() => { if (!selected) return showToast("info", "Select a book"); openOpenLibraryPage(selected); }}>
                <ExternalLink /> <span className="ml-2">Open on OpenLibrary</span>
              </Button>

              <Button className="w-full cursor-pointer" variant="outline" onClick={() => { if (!selected) return showToast("info", "Select a book"); copyJSON(); }}>
                <Copy /> <span className="ml-2">Copy JSON</span>
              </Button>

              <Button className="w-full cursor-pointer" variant="outline" onClick={() => { if (!selected && !rawResp) return showToast("info", "Nothing to download"); downloadJSON(selected || rawResp); }}>
                <Download /> <span className="ml-2">Download JSON</span>
              </Button>

              <Button className="w-full cursor-pointer" variant="outline" onClick={() => { if (!selected || !selected.ebook_access) return showToast("info", "No ebook info"); window.open(`https://openlibrary.org/search?q=${encodeURIComponent(selected.title)}&mode=ebooks`, "_blank"); }}>
                <Database /> <span className="ml-2">Search ebooks</span>
              </Button>

              <Button className="w-full cursor-pointer" variant="ghost" onClick={() => { if (!selected) return showToast("info", "Select a book"); setCoverOpen(true); }}>
                <ImageIcon /> <span className="ml-2">View cover</span>
              </Button>

              <Button className="w-full cursor-pointer" variant="ghost" onClick={() => { if (!selected) return showToast("info", "Select a book"); window.open(`https://openlibrary.org/search?q=${encodeURIComponent(selected.title)}`, "_blank"); }}>
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
        <DialogContent className={clsx("max-w-4xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/95" : "bg-white")}>
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
              <Button variant="ghost" onClick={() => setCoverOpen(false)} className="cursor-pointer"><X /></Button>
              <Button variant="outline" onClick={() => { if (selected) openOpenLibraryPage(selected); }} className="cursor-pointer"><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
