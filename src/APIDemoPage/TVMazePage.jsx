// src/pages/TVMazePage.jsx
"use client";

import React, { useEffect, useRef, useState, useMemo } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  ExternalLink,
  ImageIcon,
  Loader2,
  List,
  Copy,
  Download,
  Star,
  X,
  Calendar
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/**
 * TVMazePage
 * - Left + Center + Right layout
 * - Search box with suggestions (keyboard accessible)
 * - Center: large detail view of selected show (summary rendered; sanitized)
 * - Right: quick actions (open official site, copy JSON, download JSON, view episodes)
 *
 * API:
 * - Search: https://api.tvmaze.com/search/shows?q=:query -> returns [{ score, show }]
 * - Show by id: https://api.tvmaze.com/shows/:id -> show object
 * - Episodes: https://api.tvmaze.com/shows/:id/episodes
 *
 * This implementation intentionally does NOT persist favorites to localStorage (as requested).
 */

/* ---------- Constants ---------- */
const BASE_API = "https://api.tvmaze.com";
const DEFAULT_SHOW_ID = 1; // Under the Dome (as in your sample)
const DEBOUNCE_MS = 350;

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

/**
 * Minimal sanitization of HTML summary returned by TVMaze.
 * This uses DOMParser in the browser to whitelist a small set of tags
 * (p, br, strong, b, em, i, ul, ol, li, a). It strips script/style and unknown tags.
 * This is not a replacement for a robust sanitizer (DOMPurify) on untrusted content,
 * but it's safer than directly injecting raw HTML.
 */
function sanitizeHtml(html) {
  if (!html) return "";
  if (typeof document === "undefined") return html;
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const allowed = new Set(["P","BR","STRONG","B","EM","I","UL","OL","LI","A","SPAN"]);
  // remove script/style
  doc.querySelectorAll("script,style").forEach((n) => n.remove());

  function walk(node) {
    const children = Array.from(node.childNodes);
    for (const child of children) {
      if (child.nodeType === Node.ELEMENT_NODE) {
        if (!allowed.has(child.tagName)) {
          // unwrap element: replace node with its children
          const frag = document.createDocumentFragment();
          while (child.firstChild) frag.appendChild(child.firstChild);
          child.parentNode.replaceChild(frag, child);
          // continue walking within frag
        } else {
          // for links, ensure no javascript: href
          if (child.tagName === "A") {
            const href = child.getAttribute("href") || "";
            if (href.trim().toLowerCase().startsWith("javascript:")) {
              child.removeAttribute("href");
            } else {
              child.setAttribute("rel", "noopener noreferrer");
              child.setAttribute("target", "_blank");
            }
          }
          walk(child);
        }
      } else if (child.nodeType === Node.COMMENT_NODE) {
        child.remove();
      }
    }
  }

  walk(doc.body);
  return doc.body.innerHTML;
}

/* ---------- Component ---------- */
export default function TVMazePage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark = theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // search & suggestions state
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]); // array of { show, score }
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [showSuggest, setShowSuggest] = useState(false);

  // selection & details
  const [selectedShow, setSelectedShow] = useState(null); // show object
  const [rawResp, setRawResp] = useState(null);
  const [loadingShow, setLoadingShow] = useState(false);
  const [episodes, setEpisodes] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  // keyboard navigation for suggestions
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const abortRef = useRef(null);
  const suggestTimer = useRef(null);

  /* ---------- Fetch helpers ---------- */
  async function searchShows(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);
    if (abortRef.current) abortRef.current.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    try {
      const res = await fetch(`${BASE_API}/search/shows?q=${encodeURIComponent(q)}`, { signal: ac.signal });
      if (!res.ok) {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      const json = await res.json();
      // json is [{score, show}, ...]
      setSuggestions(json || []);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Search error", err);
        setSuggestions([]);
      }
    } finally {
      setLoadingSuggest(false);
      abortRef.current = null;
    }
  }

  async function fetchShowById(id, { loadEpisodes=false } = {}) {
    if (!id) return;
    setLoadingShow(true);
    setEpisodes(null);
    try {
      const res = await fetch(`${BASE_API}/shows/${id}`);
      if (!res.ok) {
        showToast("error", `Failed to load show (${res.status})`);
        setLoadingShow(false);
        return;
      }
      const json = await res.json();
      setSelectedShow(json);
      setRawResp(json);
      if (loadEpisodes) {
        fetchEpisodesForShow(id);
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch show");
    } finally {
      setLoadingShow(false);
    }
  }

  async function fetchEpisodesForShow(id) {
    if (!id) return;
    try {
      setEpisodes(null);
      const res = await fetch(`${BASE_API}/shows/${id}/episodes`);
      if (!res.ok) {
        showToast("error", "Failed to load episodes");
        return;
      }
      const json = await res.json();
      setEpisodes(json || []);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to load episodes");
    }
  }

  /* ---------- Handlers ---------- */
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    setActiveIndex(-1);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      searchShows(v);
    }, DEBOUNCE_MS);
  }

  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query || query.trim().length === 0) {
      showToast("info", "Try searching a show name, e.g. 'Breaking Bad'");
      return;
    }
    setLoadingSuggest(true);
    try {
      // search then select the first show if any
      const res = await fetch(`${BASE_API}/search/shows?q=${encodeURIComponent(query)}`);
      const json = await res.json();
      setLoadingSuggest(false);
      if (json && json.length > 0) {
        const first = json[0].show;
        await fetchShowById(first.id, { loadEpisodes: true });
        setShowSuggest(false);
        showToast("success", `Loaded: ${first.name}`);
      } else {
        showToast("info", "No shows found");
      }
    } catch (err) {
      setLoadingSuggest(false);
      console.error(err);
      showToast("error", "Search failed");
    }
  }

  function chooseSuggestionAt(index) {
    const item = suggestions[index];
    if (!item) return;
    const show = item.show;
    setSelectedShow(show);
    setRawResp(show);
    setShowSuggest(false);
    fetchEpisodesForShow(show.id);
  }

  function handleKeyDown(e) {
    if (!showSuggest || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIndex >= 0 && activeIndex < suggestions.length) {
        chooseSuggestionAt(activeIndex);
      } else {
        handleSearchSubmit();
      }
    } else if (e.key === "Escape") {
      setShowSuggest(false);
    }
  }

  function copyJSON() {
    if (!selectedShow) return showToast("info", "No show selected");
    navigator.clipboard.writeText(prettyJSON(selectedShow));
    showToast("success", "Show JSON copied");
  }

  function downloadJSON() {
    if (!rawResp && !selectedShow) return showToast("info", "Nothing to download");
    const payload = rawResp || selectedShow;
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${(selectedShow?.name || "show").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  /* ---------- Initial load ---------- */
  useEffect(() => {
    // load a default show so the page isn't empty
    fetchShowById(DEFAULT_SHOW_ID, { loadEpisodes: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Memoized sanitized summary ---------- */
  const sanitizedSummary = useMemo(() => sanitizeHtml(selectedShow?.summary || ""), [selectedShow?.summary]);

  /* ---------- Render ---------- */
  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>TVHub — TVMaze Browser</h1>
          <p className="mt-1 text-sm opacity-70">Search shows, inspect details, view episodes — professional viewing for TV data.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form
            onSubmit={handleSearchSubmit}
            className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-3 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}
            onKeyDown={handleKeyDown}
            role="search"
            aria-label="Search TV shows"
          >
            <Search className="opacity-60" />
            <Input
              ref={inputRef}
              placeholder="Search shows, e.g. 'The Office', 'Stranger Things'..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onFocus={() => setShowSuggest(true)}
              className="border-0 shadow-none bg-transparent outline-none"
              aria-autocomplete="list"
              aria-controls="tv-suggestions"
            />
            <Button type="button" variant="outline" className="px-3 cursor-pointer" onClick={() => { fetchShowById(DEFAULT_SHOW_ID); }}>
              Default
            </Button>
            <Button type="submit" variant="outline" className="px-3 cursor-pointer"><Search /></Button>
          </form>
        </div>
      </header>

      {/* suggestion dropdown */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            id="tv-suggestions"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
            role="listbox"
            aria-label="Show suggestions"
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, idx) => {
              const show = s.show;
              const key = show.id || show.name || idx;
              const isActive = idx === activeIndex;
              return (
                <li
                  key={key}
                  role="option"
                  aria-selected={isActive}
                  className={clsx("px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer", isActive ? "bg-zinc-100 dark:bg-zinc-800/50" : "")}
                  onMouseEnter={() => setActiveIndex(idx)}
                  onMouseLeave={() => setActiveIndex(-1)}
                  onClick={() => {
                    setSelectedShow(show);
                    setRawResp(show);
                    setShowSuggest(false);
                    fetchEpisodesForShow(show.id);
                    inputRef.current?.blur();
                  }}
                >
                  <div className="flex items-center gap-3">
                    <img src={show.image?.medium || ""} alt={show.name || "thumb"} className="w-12 h-8 object-cover rounded-sm" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{show.name}</div>
                      <div className="text-xs opacity-60 truncate">{(show.type ? `${show.type} • ${show.language}` : show.language) || "—"}</div>
                    </div>
                    <div className="text-xs opacity-60">{(show.premiered ? new Date(show.premiered).getFullYear() : "—")}</div>
                  </div>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Center: show viewer */}
        <section className="lg:col-span-9 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center flex-wrap gap-3 justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Show Details</CardTitle>
                <div className="text-xs opacity-60">{selectedShow?.name || "Select a show to view details"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button className="cursor-pointer" variant="outline" onClick={() => { if (selectedShow) fetchShowById(selectedShow.id, { loadEpisodes: false }); }}>
                  <Loader2 className={loadingShow ? "animate-spin" : ""} /> Refresh
                </Button>
                <Button className="cursor-pointer" variant="ghost" onClick={() => setShowRaw(s => !s)}><List /> {showRaw ? "Hide" : "Raw"}</Button>
                <Button className="cursor-pointer" variant="ghost" onClick={() => setDialogOpen(true)}><ImageIcon /> View Image</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loadingShow ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !selectedShow ? (
                <div className="py-12 text-center text-sm opacity-60">No show loaded — try searching above.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left: image + meta */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <img src={selectedShow.image?.original || selectedShow.image?.medium || ""} alt={selectedShow.name} className="w-full rounded-md object-cover mb-3" />
                    <div className="text-lg font-semibold">{selectedShow.name}</div>
                    <div className="text-xs opacity-60">{selectedShow.type || "—"} • {selectedShow.language || "—"}</div>

                    <div className="mt-3 space-y-2 text-sm">
                      <div>
                        <div className="text-xs opacity-60">Genres</div>
                        <div className="font-medium">{(selectedShow.genres && selectedShow.genres.length > 0) ? selectedShow.genres.join(", ") : "—"}</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60">Status</div>
                        <div className="font-medium">{selectedShow.status || "—"}</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60">Runtime</div>
                        <div className="font-medium">{selectedShow.runtime ? `${selectedShow.runtime} min` : "—"}</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60">Premiered</div>
                        <div className="font-medium">{selectedShow.premiered || "—"}</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60">Official</div>
                        <div className="font-medium">
                          {selectedShow.officialSite ? (
                            <a href={selectedShow.officialSite} target="_blank" rel="noreferrer" className="underline flex items-center gap-1"><ExternalLink className="w-4 h-4 inline" /> Visit</a>
                          ) : "—"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Center/right: content */}
                  <div className={clsx("p-4 rounded-xl border col-span-1 md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-sm font-semibold mb-2">Summary</div>
                    <div className="text-sm leading-relaxed mb-3 prose max-w-none" dangerouslySetInnerHTML={{ __html: sanitizedSummary || "<p>No summary available.</p>" }} />

                    <Separator className="my-3" />

                    <div className="text-sm font-semibold mb-2">Show fields</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.keys(selectedShow).map((k) => (
                        <div key={k} className="p-2 rounded-md border break-words">
                          <div className="text-xs opacity-60">{k}</div>
                          <div className="text-sm font-medium">
                            {typeof selectedShow[k] === "object" ? (Array.isArray(selectedShow[k]) ? selectedShow[k].slice(0,3).join(", ") + (selectedShow[k].length>3 ? "…" : "") : JSON.stringify(selectedShow[k])) : (selectedShow[k] ?? "—")}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <AnimatePresence>
              {showRaw && rawResp && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("p-4 border-t", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                  <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 300 }}>
                    {prettyJSON(rawResp)}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* Right: quick actions and episodes */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold mb-2">Quick actions</div>
            <div className="text-xs opacity-60 mb-2">Inspect, open or export the selected show</div>
            <div className="mt-2 space-y-2 grid grid-cols-1 gap-2">
              <Button className="cursor-pointer" variant="outline" onClick={() => { if (selectedShow?.officialSite) window.open(selectedShow.officialSite, "_blank"); else showToast("info","No official site"); }}>
                <ExternalLink /> Open Official
              </Button>
              <Button className="cursor-pointer" variant="outline" onClick={() => copyJSON()}><Copy /> Copy JSON</Button>
              <Button className="cursor-pointer" variant="outline" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
              <Button className="cursor-pointer" variant="outline" onClick={() => { if (selectedShow) fetchEpisodesForShow(selectedShow.id); else showToast("info","No show selected"); }}>
                <Calendar /> Load Episodes
              </Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Episodes</div>
            <div className="text-xs opacity-60 mb-2">Quick list (click to open details)</div>
            <div className={clsx("space-y-2 max-h-72 overflow-auto no-scrollbar")}>
              {episodes === null ? (
                <div className="text-xs opacity-60">No episodes loaded</div>
              ) : episodes.length === 0 ? (
                <div className="text-xs opacity-60">No episodes available</div>
              ) : (
                episodes.slice(0, 30).map((ep) => (
                  <div key={ep.id} className="p-2 rounded-md border flex justify-between items-center">
                    <div className="text-sm">{ep.number ? `S${String(ep.season).padStart(2,"0")}E${String(ep.number).padStart(2,"0")} — ${ep.name}` : ep.name}</div>
                    <div className="text-xs opacity-60">{ep.airdate || "—"}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{selectedShow?.name || "Image"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {selectedShow?.image?.original || selectedShow?.image?.medium ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedShow.image?.original || selectedShow.image?.medium} alt={selectedShow?.name} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image from TVMaze</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
              <Button variant="outline" onClick={() => { if (selectedShow?.officialSite) window.open(selectedShow.officialSite, "_blank"); }}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
