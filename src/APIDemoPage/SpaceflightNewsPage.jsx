// SpaceflightNewsPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  ExternalLink,
  ImageIcon,
  List,
  Loader2,
  Calendar,
  Globe,
  Copy,
  Download,
  User,
  Clock,
  Tag,
  FileText,
  Share2,
  ChevronsRight
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/**
 * SpaceflightNewsPage.jsx
 * - Presents Spaceflight News articles (spaceflightnewsapi.net)
 * - Uses sample article as default (image uses uploaded file path)
 *
 * Uploaded sample image path used as sample image:
 * /mnt/data/381e618b-3bdb-461f-b3dd-6a4ce4fa8eed.png
 */

const API_BASE = "https://api.spaceflightnewsapi.net/v4/articles";
const DEFAULT_FETCH_LIMIT = 12;
const DEBOUNCE_MS = 300;

// Sample / default article (uses user-provided JSON + uploaded image path)
const DEFAULT_SAMPLE_ARTICLE = {
  id: 34037,
  title: "NASA Telescopes View Spiral Galaxy",
  authors: [{ name: "NASA", socials: null }],
  url: "https://www.nasa.gov/image-article/nasa-telescopes-view-spiral-galaxy/",
  image_url: "/mnt/data/381e618b-3bdb-461f-b3dd-6a4ce4fa8eed.png", // <-- uploaded file path used here
  news_site: "NASA",
  summary:
    "NGC 1068, a relatively nearby spiral galaxy, appears in this image released on July 23, 2025. The galaxy contains a black hole at its center that is twice as massive as the Milky Way’s. NASA’s Chandra X-ray Observatory data shows a million-mile-per-hour wind is being driven from NGC 1068’s black hole and lighting up the […]",
  published_at: "2025-11-18T17:45:46Z",
  updated_at: "2025-11-18T17:50:06.530478Z",
  featured: false,
  launches: [],
  events: []
};

function prettyJSON(obj) {
  try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
}

function formatDate(iso) {
  if (!iso) return "Unknown date";
  try { return new Date(iso).toLocaleString(); } catch { return iso; }
}

export default function SpaceflightNewsPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // UI state
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [articlesCache, setArticlesCache] = useState([]);
  const [currentArticle, setCurrentArticle] = useState(DEFAULT_SAMPLE_ARTICLE);
  const [rawResp, setRawResp] = useState(DEFAULT_SAMPLE_ARTICLE);
  const [loadingArticle, setLoadingArticle] = useState(false);

  const [showRaw, setShowRaw] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  const debounceRef = useRef(null);
  const controllerRef = useRef(null);
  const suggestActiveIdx = useRef(-1);

  // Fetch batch of articles (with AbortController)
  async function fetchArticles(limit = DEFAULT_FETCH_LIMIT) {
    if (controllerRef.current) {
      try { controllerRef.current.abort(); } catch {}
    }
    const ctrl = new AbortController();
    controllerRef.current = ctrl;
    setLoadingSuggest(true);
    try {
      const res = await fetch(`${API_BASE}?_limit=${limit}`, { signal: ctrl.signal });
      if (!res.ok) {
        setLoadingSuggest(false);
        showToast?.("error", `Failed to fetch articles (${res.status})`);
        return [];
      }
      const json = await res.json();
      const arr = Array.isArray(json) ? json : (json?.results || []);
      setArticlesCache(arr);
      setLoadingSuggest(false);
      return arr;
    } catch (err) {
      if (err.name === "AbortError") return [];
      console.error("fetchArticles:", err);
      setLoadingSuggest(false);
      showToast?.("error", "Network error while fetching articles");
      return [];
    }
  }

  // On mount: optionally populate cache & keep default article visible
  useEffect(() => {
    (async () => {
      // fetch a small batch to power suggestions
      await fetchArticles(30);
    })();

    return () => {
      if (controllerRef.current) controllerRef.current.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounced local suggestion filtering (client-side)
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    suggestActiveIdx.current = -1;
    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      const q = v.trim().toLowerCase();
      if (!q) {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      // ensure we have a reasonable cache
      let list = articlesCache;
      if (!list || list.length < 50) list = await fetchArticles(100);

      const matches = (list || []).filter(a => {
        const t = (a.title || "").toLowerCase();
        const s = (a.summary || "").toLowerCase();
        const site = (a.news_site || "").toLowerCase();
        return t.includes(q) || s.includes(q) || site.includes(q);
      }).slice(0, 12);

      setSuggestions(matches);
      setLoadingSuggest(false);
    }, DEBOUNCE_MS);
  }

  // Submit search: prefer cache; fallback to fresh fetch
  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query || !query.trim()) {
      showToast?.("info", "Try searching for 'rocket', 'Artemis', or 'James Webb'.");
      return;
    }
    setLoadingArticle(true);
    const q = query.trim().toLowerCase();
    const list = articlesCache.length >= 150 ? articlesCache : await fetchArticles(200);
    const found = (list || []).find(a => (a.title || "").toLowerCase().includes(q) || (a.summary || "").toLowerCase().includes(q));
    if (found) {
      setCurrentArticle(found);
      setRawResp(found);
      setShowSuggest(false);
      setLoadingArticle(false);
      return;
    }
    // fallback: fetch some and try match
    const fresh = await fetchArticles(50);
    const picked = (fresh || []).find(a => (a.title || "").toLowerCase().includes(q) || (a.summary || "").toLowerCase().includes(q));
    if (picked) {
      setCurrentArticle(picked);
      setRawResp(picked);
    } else {
      showToast?.("info", "No match found — try a broader term.");
    }
    setShowSuggest(false);
    setLoadingArticle(false);
  }

  function pickSuggestion(item) {
    if (!item) return;
    setCurrentArticle(item);
    setRawResp(item);
    setQuery(item.title || "");
    setShowSuggest(false);
  }

  // Keyboard navigation for suggestions
  function onKeyDownInput(e) {
    if (!showSuggest) return;
    const max = suggestions.length - 1;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      suggestActiveIdx.current = Math.min(suggestActiveIdx.current + 1, max);
      scrollSuggestionIntoView();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      suggestActiveIdx.current = Math.max(suggestActiveIdx.current - 1, 0);
      scrollSuggestionIntoView();
    } else if (e.key === "Enter") {
      if (suggestActiveIdx.current >= 0 && suggestions[suggestActiveIdx.current]) {
        e.preventDefault();
        pickSuggestion(suggestions[suggestActiveIdx.current]);
      }
    } else if (e.key === "Escape") {
      setShowSuggest(false);
    }
  }

  function scrollSuggestionIntoView() {
    try {
      const el = document.querySelector(`[data-suggest-idx="${suggestActiveIdx.current}"]`);
      if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
    } catch {}
  }

  // Quick actions
  function openOriginal() {
    if (!currentArticle?.url) return showToast?.("info", "No original link available");
    window.open(currentArticle.url, "_blank", "noopener");
  }
  function copyLink() {
    if (!currentArticle?.url) return showToast?.("info", "No link to copy");
    navigator.clipboard.writeText(currentArticle.url);
    showToast?.("success", "Article link copied");
  }
  function downloadArticleJSON() {
    const payload = rawResp || currentArticle || {};
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `space_article_${(currentArticle?.id || "article")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast?.("success", "Article JSON downloaded");
  }

  // Derived
  const relatedLaunches = useMemo(() => currentArticle?.launches || [], [currentArticle]);
  const relatedEvents = useMemo(() => currentArticle?.events || [], [currentArticle]);

  // Image error fallback
  function handleImgError(e) {
    e.currentTarget.src = "/placeholder.png";
  }

  return (
    <div className={clsx("min-h-screen p-6 max-w-9xl mx-auto", isDark ? "bg-black text-zinc-100" : "bg-white text-zinc-900")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">Orbit — Spaceflight News</h1>
          <p className="mt-1 text-sm opacity-70">Latest launches, missions, and space industry updates — searchable and developer-friendly.</p>
        </div>

        <div className="w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-3 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              aria-label="Search spaceflight news"
              placeholder="Search by keyword (e.g. 'Artemis', 'James Webb', 'Starlink')"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={onKeyDownInput}
              onFocus={() => setShowSuggest(true)}
              className="border-0 shadow-none bg-transparent outline-none"
            />
            <Button type="submit" variant="outline" className="px-3">Search</Button>
          </form>
        </div>
      </header>

      {/* Suggestions */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, idx) => (
              <li
                key={s.id || idx}
                data-suggest-idx={idx}
                onClick={() => pickSuggestion(s)}
                className={clsx("px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/40 cursor-pointer flex items-center gap-3", suggestActiveIdx.current === idx ? "bg-zinc-100 dark:bg-zinc-800/50" : "")}
              >
                <img src={s.image_url || s.imageUrl || ""} alt={s.title} className="w-14 h-10 object-cover rounded-sm" onError={handleImgError} />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{s.title}</div>
                  <div className="text-xs opacity-60 truncate">{s.news_site || s.newsSite} • {formatDate(s.published_at || s.publishedAt)}</div>
                </div>
                <div className="text-xs opacity-60">{s.featured ? "Featured" : ""}</div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: image + meta */}
        <div className="lg:col-span-3">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardContent>
              <div className="w-full h-[240px] rounded-md overflow-hidden bg-zinc-900/10">
                {currentArticle?.image_url || currentArticle?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={currentArticle.image_url || currentArticle.imageUrl}
                    alt={currentArticle.title || "article image"}
                    className="w-full h-full object-cover"
                    onError={handleImgError}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ImageIcon />
                  </div>
                )}
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs opacity-60">Publisher</div>
                    <div className="font-semibold">{currentArticle?.news_site || currentArticle?.newsSite || "—"}</div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs opacity-60">Published</div>
                    <div className="font-medium text-sm">{formatDate(currentArticle?.published_at || currentArticle?.publishedAt)}</div>
                  </div>
                </div>

                <div className="mt-4 text-xs opacity-60">
                  {currentArticle?.featured ? <span className="inline-block px-2 py-1 rounded bg-yellow-500/20 text-yellow-300 text-xs">Featured</span> : <span className="text-xs opacity-60">Regular</span>}
                </div>

                <Separator className="my-4" />

                <div className="text-sm">
                  <div className="text-xs opacity-60">Authors</div>
                  {Array.isArray(currentArticle?.authors) && currentArticle.authors.length > 0 ? (
                    <div className="mt-2 space-y-2">
                      {currentArticle.authors.map((a, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <User className="w-4 h-4 opacity-70" />
                          <div>
                            <div className="font-medium">{a.name}</div>
                            <div className="text-xs opacity-60">{a.socials ? JSON.stringify(a.socials) : "—"}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-2 opacity-60">—</div>
                  )}
                </div>

                <div className="mt-4 text-sm">
                  <div className="text-xs opacity-60">Related launches</div>
                  {relatedLaunches.length === 0 ? <div className="opacity-60 text-sm">—</div> : relatedLaunches.map((l, i) => (
                    <div key={i} className="text-sm font-medium">{l.provider || l.id || l}</div>
                  ))}
                </div>

                <div className="mt-3 text-sm">
                  <div className="text-xs opacity-60">Related events</div>
                  {relatedEvents.length === 0 ? <div className="opacity-60 text-sm">—</div> : relatedEvents.map((e, i) => (
                    <div key={i} className="text-sm font-medium">{e.provider || e.id || e}</div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Center: details */}
        <div className="lg:col-span-6">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className="p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="text-2xl font-extrabold leading-tight">{currentArticle?.title || "Select article or search"}</h2>
                  <div className="mt-2 text-sm opacity-60">{currentArticle?.news_site || currentArticle?.newsSite ? `${currentArticle.news_site || currentArticle.newsSite} • ${formatDate(currentArticle?.published_at || currentArticle?.publishedAt)}` : "—"}</div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <Button variant="ghost" onClick={() => setShowRaw(s => !s)}><List /> {showRaw ? "Hide" : "Raw"}</Button>
                  <Button variant="outline" onClick={() => setImageOpen(true)}><ImageIcon /></Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="prose max-w-none dark:prose-invert">
                <p className="text-base leading-relaxed">{currentArticle?.summary || "No summary available."}</p>

                <Separator className="my-4" />

                <div>
                  <div className="text-xs opacity-60 mb-2">All fields (formatted)</div>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="p-3 rounded border">
                      <div className="text-xs opacity-60">ID</div>
                      <div className="font-medium">{String(currentArticle?.id ?? "—")}</div>
                    </div>

                    <div className="p-3 rounded border">
                      <div className="text-xs opacity-60">URL</div>
                      <a className="text-sm underline font-medium break-all" href={currentArticle?.url} target="_blank" rel="noreferrer">{currentArticle?.url || "—"}</a>
                    </div>

                    <div className="p-3 rounded border">
                      <div className="text-xs opacity-60">Published / Updated</div>
                      <div className="font-medium">{formatDate(currentArticle?.published_at || currentArticle?.publishedAt)} — <span className="text-xs opacity-60">Updated: {formatDate(currentArticle?.updated_at || currentArticle?.updatedAt)}</span></div>
                    </div>

                    <div className="p-3 rounded border">
                      <div className="text-xs opacity-60">Featured</div>
                      <div className="font-medium">{currentArticle?.featured ? "Yes" : "No"}</div>
                    </div>

                    <div className="p-3 rounded border">
                      <div className="text-xs opacity-60">Raw JSON (preview)</div>
                      <pre className="text-xs overflow-auto" style={{ maxHeight: 280 }}>{prettyJSON(rawResp)}</pre>
                    </div>
                  </div>

                  <div className="mt-4">
                    <a href={currentArticle?.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium underline">
                      Read original <ChevronsRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                <AnimatePresence>
                  {showRaw && rawResp && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-6 p-3 border rounded">
                      <pre className="text-xs overflow-auto" style={{ maxHeight: 420 }}>{prettyJSON(rawResp)}</pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: quick actions */}
        <div className="lg:col-span-3">
          <div className={clsx(" space-y-4")}>
            <Card className={clsx("rounded-2xl overflow-hidden border p-4", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Quick actions</div>
                  <div className="text-xs opacity-60">Operate on the active article</div>
                </div>
              </div>

              <Separator className="my-3" />

              <div className="flex flex-col gap-2">
                <Button onClick={openOriginal} variant="outline"><ExternalLink className="mr-2" /> Open original</Button>
                <Button onClick={copyLink} variant="outline"><Copy className="mr-2" /> Copy link</Button>
                <Button onClick={downloadArticleJSON} variant="outline"><Download className="mr-2" /> Download JSON</Button>
                <Button onClick={() => navigator.clipboard.writeText(window.location.href)} variant="outline"><Share2 className="mr-2" /> Copy page link</Button>
              </div>

              <Separator className="my-3" />

              <div>
                <div className="text-sm font-semibold mb-2">Developer</div>
                <div className="text-xs opacity-60">Endpoint & debug</div>

                <div className="mt-2 text-xs break-all">{API_BASE}</div>
                <div className="mt-3 flex gap-2">
                  <Button variant="ghost" onClick={() => { navigator.clipboard.writeText(API_BASE); showToast?.("success", "Endpoint copied"); }}><Copy /></Button>
                  <Button variant="ghost" onClick={() => setShowRaw(true)}><List /></Button>
                </div>
              </div>
            </Card>

            <Card className={clsx("rounded-2xl overflow-hidden border p-4", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
              <div className="text-sm font-semibold">Related</div>
              <div className="text-xs opacity-60 mt-2">Quick links & resources</div>

              <div className="mt-3 flex flex-col gap-2">
                <a className="text-sm underline" target="_blank" rel="noreferrer" href="https://www.nasa.gov">NASA</a>
                <a className="text-sm underline" target="_blank" rel="noreferrer" href="https://spaceflightnow.com">Spaceflight Now</a>
                <a className="text-sm underline" target="_blank" rel="noreferrer" href="https://spacenews.com">SpaceNews</a>
              </div>
            </Card>
          </div>
        </div>
      </main>

      {/* Image viewer */}
      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className={clsx("max-w-4xl w-full p-0 rounded-2xl overflow-hidden")}>
          <DialogHeader>
            <DialogTitle>{currentArticle?.title || "Image"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {currentArticle?.image_url || currentArticle?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentArticle.image_url || currentArticle.imageUrl} alt={currentArticle?.title} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} onError={(e) => { e.currentTarget.src = "/placeholder.png"; }} />
            ) : (
              <div className="h-full flex items-center justify-center">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image from the article</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setImageOpen(false)}>Close</Button>
              <Button variant="outline" onClick={() => { if (currentArticle?.image_url || currentArticle?.imageUrl) window.open(currentArticle.image_url || currentArticle.imageUrl, "_blank"); }}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
