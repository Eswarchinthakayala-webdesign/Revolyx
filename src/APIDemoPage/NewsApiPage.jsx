// src/pages/NewsApiPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper";

import {
  Search,
  Star,
  X,
  ExternalLink,
  Copy,
  Download,
  Loader2,
  ImageIcon,
  List,
  BookOpen,
  Menu,
  Loader,
  MapPin
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useTheme } from "@/components/theme-provider";

/* ---------- Endpoint ---------- */
/* Example NewsData.io endpoint format
   https://newsdata.io/api/1/news?apikey=YOUR_API_KEY&q=technology&language=en
*/
const BASE_ENDPOINT = "https://newsdata.io/api/1/news";
const API_KEY = "pub_282931e0d6e44b3ebc819ef4e554439b"; // replace with your key or load from env

/* ---------- Defaults ---------- */
const DEFAULT_MSG = "Search news by topic, e.g. 'AI', 'startup', 'space'...";

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

export default function NewsApiPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // State
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]); // suggested articles from search
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [currentArticle, setCurrentArticle] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [loadingArticle, setLoadingArticle] = useState(false);

  const [favorites, setFavorites] = useState([]);
  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const suggestTimer = useRef(null);
  const favLoadedRef = useRef(false);

  /* Persist favorites */
  useEffect(() => {
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem("news-favs") || "[]");
    } catch {
      saved = [];
    }
    setFavorites(Array.isArray(saved) ? saved : []);
    favLoadedRef.current = true;
  }, []);

  useEffect(() => {
    if (!favLoadedRef.current) return;
    localStorage.setItem("news-favs", JSON.stringify(favorites));
  }, [favorites]);

  /* Fetch helpers */
  async function fetchTopNews(q = "") {
    setLoadingArticle(true);
    try {
      const params = new URLSearchParams();
      params.set("apikey", API_KEY);
      if (q) params.set("q", q);
      params.set("language", "en");
      const url = `${BASE_ENDPOINT}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        showToast("error", `News fetch failed (${res.status})`);
        setLoadingArticle(false);
        return;
      }
      const json = await res.json();
      // NewsData returns `results` or `results` might be in `results` or `data.results` depending on provider
      const items = json.results || json?.results || json?.data?.results || json?.results || json?.articles || [];
      const first = (items && items.length > 0) ? items[0] : null;
      setCurrentArticle(first);
      setRawResp(json);
      if (first) showToast("success", `Loaded: ${first.title ?? first.description ?? "article"}`);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch news");
    } finally {
      setLoadingArticle(false);
    }
  }

  async function searchNews(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);
    try {
      const params = new URLSearchParams();
      params.set("apikey", API_KEY);
      params.set("q", q);
      params.set("language", "en");
      const url = `${BASE_ENDPOINT}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      const json = await res.json();
      const items = json.results || json?.articles || [];
      setSuggestions(items || []);
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
    suggestTimer.current = setTimeout(() => {
      searchNews(v);
    }, 350);
  }

  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query || query.trim().length === 0) {
      showToast("info", DEFAULT_MSG);
      return;
    }
    setLoadingSuggest(true);
    try {
      const params = new URLSearchParams();
      params.set("apikey", API_KEY);
      params.set("q", query);
      params.set("language", "en");
      const url = `${BASE_ENDPOINT}?${params.toString()}`;
      const res = await fetch(url);
      const json = await res.json();
      setLoadingSuggest(false);
      const items = json.results || json?.articles || [];
      if (items && items.length > 0) {
        setCurrentArticle(items[0]);
        setRawResp(json);
        setShowSuggest(false);
        showToast("success", `Found: ${items[0].title ?? "article"}`);
      } else {
        showToast("info", "No articles found — try another keyword");
      }
    } catch (err) {
      setLoadingSuggest(false);
      showToast("error", "Failed to search news");
    }
  }

  function saveFavorite() {
    if (!currentArticle) {
      showToast("info", "No article loaded to save");
      return;
    }
    const id = currentArticle.link || currentArticle.title || Date.now().toString();
    setFavorites(prev => {
      if (prev.some(f => f.id === id)) {
        showToast("info", "Already saved");
        return prev;
      }
      const next = [{ id, title: currentArticle.title, thumb: currentArticle.image_url || currentArticle.image || "" }, ...prev].slice(0, 100);
      showToast("success", `Saved ${currentArticle.title ?? "article"}`);
      return next;
    });
  }

  function removeFavorite(id) {
    setFavorites(prev => prev.filter(f => f.id !== id));
    showToast("info", "Removed favorite");
  }

  function chooseFavorite(f) {
    // Try to locate in recent rawResp if possible, otherwise just set current using stored data
    setCurrentArticle({ title: f.title, link: f.id, image_url: f.thumb });
    setRawResp(null);
  }

  function copyArticleToClipboard() {
    if (!currentArticle) return showToast("info", "No article to copy");
    navigator.clipboard.writeText(prettyJSON(currentArticle));
    showToast("success", "Article JSON copied");
  }

  function downloadJSON() {
    if (!rawResp && !currentArticle) {
      showToast("info", "No article to download");
      return;
    }
    const payload = rawResp || currentArticle;
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `news_${(currentArticle?.title || "article").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  useEffect(() => {
    // initial load: top headlines (no query)
    fetchTopNews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>Pulse — Tech News</h1>
          <p className="mt-1 text-sm opacity-70">Search news, save favorites, inspect raw response</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[560px] rounded-lg px-2 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search topics, e.g. 'AI', 'startups', 'blockchain'..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="outline" className="px-3 cursor-pointer" onClick={() => fetchTopNews()}>
              Top
            </Button>
            <Button type="submit" variant="outline" className="px-3 cursor-pointer"><Search /></Button>
          </form>
        </div>
      </header>

      {/* suggestions */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_280px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, idx) => (
              <li key={s.link || s.title || idx} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => { setCurrentArticle(s); setRawResp({ results: [s] }); setShowSuggest(false); }}>
                <div className="flex items-center gap-3">
                  {/* thumbnail may be at s.image_url or s.image */}
                  <img src={s.image_url || s.image || ""} alt={s.title || "thumb"} className="w-12 h-8 object-cover rounded-sm" />
                  <div className="flex-1">
                    <div className="font-medium">{s.title}</div>
                    <div className="text-xs opacity-60">{(s.source_id || s.source) ?? s.pubDate ?? "—"}</div>
                  </div>
                  <div className="text-xs opacity-60">{new Date(s.pubDate || s.pubDate_raw || Date.now()).toLocaleDateString()}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Center: article viewer */}
        <section className="lg:col-span-9 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center flex-wrap gap-3 justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Article</CardTitle>
                <div className="text-xs opacity-60">{currentArticle?.title || "Waiting for an article..."}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button className="cursor-pointer " variant="outline" onClick={() => fetchTopNews()}><Loader className={loadingArticle ? "animate-spin" : ""} /> Refresh</Button>
                <Button className="cursor-pointer" variant="ghost" onClick={() => setShowRaw(s => !s)}><List /> {showRaw ? "Hide" : "Raw"}</Button>
                <Button className="cursor-pointer" variant="ghost" onClick={() => setDialogOpen(true)}><ImageIcon /> View Image</Button>
               
              </div>
            </CardHeader>

            <CardContent>
              {loadingArticle ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !currentArticle ? (
                <div className="py-12 text-center text-sm opacity-60">No article loaded — try search or top headlines.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left: image + meta */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <img src={currentArticle.image_url || currentArticle.image || ""} alt={currentArticle.title} className="w-full rounded-md object-cover mb-3" />
                    <div className="text-lg font-semibold">{currentArticle.title}</div>
                    <div className="text-xs opacity-60">{currentArticle.source_id || currentArticle.source || "Unknown source"} • {new Date(currentArticle.pubDate || Date.now()).toLocaleString()}</div>

                    <div className="mt-3 space-y-2 text-sm">
                      <div>
                        <div className="text-xs opacity-60">Author</div>
                        <div className="font-medium">{currentArticle.creator?.join?.(", ") || currentArticle.creator || "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Link</div>
                        <div className="font-medium overflow-auto no-scrollbar">
                          {currentArticle.link ? (<a href={currentArticle.link} target="_blank" rel="noreferrer" className="underline">{currentArticle.link}</a>) : "—"}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Category</div>
                        <div className="font-medium">{currentArticle.category || currentArticle.topic || "—"}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      <Button className="cursor-pointer" variant="outline" onClick={() => { if (currentArticle.link) window.open(currentArticle.link, "_blank"); else showToast("info", "No article link"); }}><ExternalLink /> Read original</Button>
                    </div>
                  </div>

                  {/* Right: content and fields */}
                  <div className={clsx("p-4 rounded-xl border col-span-1 md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-sm font-semibold mb-2">Summary</div>
                    <div className="text-sm leading-relaxed mb-3">{currentArticle.description || currentArticle.content || "No summary available."}</div>

                    <Separator className="my-3" />

                    <div className="text-sm font-semibold mb-2">Full fields</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Render all keys present in article object */}
                      {Object.keys(currentArticle).map((k) => (
                        <div key={k} className="p-2 rounded-md border">
                          <div className="text-xs opacity-60">{k}</div>
                          <div className="text-sm font-medium break-words">{typeof currentArticle[k] === "object" ? JSON.stringify(currentArticle[k]) : (currentArticle[k] ?? "—")}</div>
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

        {/* Right: meta / saved list */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>


          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Developer</div>
            <div className="text-xs opacity-60">Endpoint examples & debugging</div>
            <div className="mt-2 space-y-2 grid grid-cols-1 gap-2">
              <Button className="cursor-pointer" variant="outline" onClick={() => { navigator.clipboard.writeText(`${BASE_ENDPOINT}?apikey=${API_KEY}&q=${encodeURIComponent(query || "")}`); showToast("success", "Endpoint copied"); }}><Copy /> Copy Endpoint</Button>
              <Button className="cursor-pointer" variant="outline" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
              <Button className="cursor-pointer" variant="outline" onClick={() => setShowRaw((s) => !s)}><List /> Toggle Raw</Button>
            </div>
          </div>
        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{currentArticle?.title || "Image"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {currentArticle?.image_url || currentArticle?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentArticle.image_url || currentArticle.image} alt={currentArticle?.title} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image from article</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
              <Button variant="outline" onClick={() => { if (currentArticle?.link) window.open(currentArticle.link, "_blank"); }}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
