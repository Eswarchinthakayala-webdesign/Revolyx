// src/pages/RandomFoxPage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper";

import {
  RefreshCw,
  Image as ImageIcon,
  ExternalLink,
  Download,
  Copy,
  List,
  Loader2,
  Star,
  X,
  Link as LinkIcon,
  Menu,
  Check,
  Grid,
  Plus,
  Heart,
  Clock,
  FileText,
  Layers,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"; // shadcn-like sheet

/* ---------- Endpoint ---------- */
const ENDPOINT = "https://randomfox.ca/floof/";

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

/* Safe extractor (RandomFox typically returns {image: "...", link: "..."}) */
function extractImageUrl(resp) {
  if (!resp) return "";
  if (typeof resp === "string") return resp;
  if (resp.image) return resp.image;
  if (resp.url) return resp.url;
  if (resp.link) return resp.link;
  return "";
}

export default function RandomFoxPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [current, setCurrent] = useState(null); // object: {imageUrl, raw, fetchedAt}
  const [rawResp, setRawResp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  // session history & gallery (in-memory only)
  const [history, setHistory] = useState([]);
  const [gallery, setGallery] = useState([]); // accumulated gallery items
  const [galleryLoading, setGalleryLoading] = useState(false);

  // small "search-like" input (keeps header consistent with News page design)
  const [query, setQuery] = useState(""); // not used by API but preserves layout
  const suggestTimer = useRef(null);

  // mobile sheet (sidebar)
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    // load one default fox on mount
    fetchRandomFox();
    // and prefill a small gallery (10)
    fetchGallery(10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchRandomFox() {
    setLoading(true);
    try {
      const res = await fetch(ENDPOINT);
      if (!res.ok) {
        showToast("error", `Fetch failed (${res.status})`);
        setLoading(false);
        return;
      }
      const json = await res.json();
      const imageUrl = extractImageUrl(json);
      const payload = { imageUrl, raw: json, fetchedAt: new Date().toISOString() };
      setCurrent(payload);
      setRawResp(json);
      // add to session history (keep last 50)
      setHistory((prev) => [payload, ...prev].slice(0, 50));
      // also add to gallery front if not exist
      setGallery((prev) => {
        const exists = prev.some((p) => p.imageUrl === payload.imageUrl);
        return exists ? prev : [payload, ...prev].slice(0, 500);
      });
      showToast("success", "Loaded a fox!");
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch fox image");
    } finally {
      setLoading(false);
    }
  }

  async function fetchGallery(count = 50) {
    // fetch `count` images (parallel with Promise.all but guard in case of rate limits)
    setGalleryLoading(true);
    try {
      const promises = Array.from({ length: count }, () => fetch(ENDPOINT).then((r) => r.json()).catch(() => null));
      const results = await Promise.all(promises);
      const items = results
        .filter(Boolean)
        .map((json) => ({ imageUrl: extractImageUrl(json), raw: json, fetchedAt: new Date().toISOString() }));
      setGallery((prev) => {
        // merge and dedupe by URL
        const combined = [...prev, ...items];
        const seen = new Set();
        return combined.filter((i) => {
          if (!i?.imageUrl) return false;
          if (seen.has(i.imageUrl)) return false;
          seen.add(i.imageUrl);
          return true;
        }).slice(0, 1000);
      });
      showToast("success", `Loaded ${items.length} images to gallery`);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to load gallery images");
    } finally {
      setGalleryLoading(false);
    }
  }

  // copy animations
  const [copied, setCopied] = useState(false);
  async function copyImageLink() {
    if (!current?.imageUrl) return showToast("info", "No image to copy");
    try {
      await navigator.clipboard.writeText(current.imageUrl);
      setCopied(true);
      showToast("success", "Image link copied");
      // reset after animation
      setTimeout(() => setCopied(false), 2200);
    } catch (e) {
      showToast("error", "Copy failed");
    }
  }

  function downloadJSON() {
    const payload = rawResp || current?.raw;
    if (!payload) return showToast("info", "Nothing to download");
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `randomfox_${new Date().toISOString().replace(/[:.]/g, "-")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  function copyEndpoint() {
    navigator.clipboard.writeText(ENDPOINT);
    showToast("success", "Endpoint copied");
  }

  // mimic suggestion UX: when typing, show tip items (not real suggestions; API doesn't support search)
  const [suggestTips, setSuggestTips] = useState([]);
  function onQueryChange(v) {
    setQuery(v);
    // simple debounced "faux suggestion" that suggests previous history by fuzzy match
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      if (!v) {
        setSuggestTips([]);
        return;
      }
      const lower = v.toLowerCase();
      const matches = history.filter((h) => (h.imageUrl || "").toLowerCase().includes(lower)).slice(0, 6);
      setSuggestTips(matches);
    }, 200);
  }

  // helpful derived values
  const gallery50 = gallery.slice(0, 50);
  const leftSidebarData = (gallery.length >= 10 ? gallery : history).slice(0, 10);

  return (
    <div className={clsx("min-h-screen p-4 pb-10 sm:p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex items-center flex-wrap justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetContent side="left" className="lg:hidden p-0">
              <SheetHeader className="p-4 border-b">
                <SheetTitle className="flex items-center gap-2 text-lg font-semibold">Menu</SheetTitle>
              </SheetHeader>
              <div className="p-4">
                <div className="space-y-3">
                  <Button variant="ghost" className="w-full justify-start cursor-pointer" onClick={() => setSheetOpen(false)}>
                    <List className="mr-2" /> Recent
                  </Button>
                  <Button variant="ghost" className="w-full justify-start cursor-pointer" onClick={() => { fetchGallery(50); setSheetOpen(false); }}>
                    <Grid className="mr-2" /> Load 50
                  </Button>
                  <Separator />
                  <div className="text-sm opacity-70">Session items</div>
                  <ScrollArea className="h-48 mt-2">
                    <div className="space-y-2">
                      {history.length === 0 && <div className="text-sm opacity-60">No items yet</div>}
                      {history.map((h, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/50" onClick={() => { setCurrent(h); setRawResp(h.raw); setSheetOpen(false); }}>
                          <img src={h.imageUrl} alt={`thumb-${idx}`} className="w-10 h-10 rounded object-cover" />
                          <div className="text-xs truncate">Fox • {new Date(h.fetchedAt).toLocaleTimeString()}</div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </SheetContent>

            <Button variant="ghost" className="lg:hidden p-2 rounded-md cursor-pointer" onClick={() => setSheetOpen(true)}>
              <Menu />
            </Button>
          </Sheet>

          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold leading-tight">Floof — Random Fox</h1>
            <div className="text-xs sm:text-sm opacity-70 flex items-center gap-2 mt-1">
              <Star className="h-4 w-4" /> Random fox images, previews & developer utilities
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full max-w-[560px]">
          <form onSubmit={(e) => { e?.preventDefault?.(); fetchRandomFox(); }} className={clsx("flex items-center gap-2 w-full rounded-lg px-3 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <ImageIcon className="opacity-60" />
            <Input
              placeholder="Type to filter history (press Enter to fetch new fox)"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setSuggestTips(history.slice(0, 6))}
            />
            <Tooltip content="Refresh">
              <Button type="button" variant="outline" className="px-3 cursor-pointer" onClick={() => fetchRandomFox()}>
                <RefreshCw className={loading ? "animate-spin" : ""} />
              </Button>
            </Tooltip>
            <Tooltip content="Fetch">
              <Button type="submit" variant="outline" className="px-3 cursor-pointer"><ImageIcon /></Button>
            </Tooltip>
          </form>
        </div>

       
      </header>

      {/* suggestions (faux suggestions from history) */}
      <AnimatePresence>
        {suggestTips.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={clsx("absolute z-50 left-4 right-4 md:left-[calc(50%_-_280px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {suggestTips.map((t, i) => (
              <li key={i} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => { setCurrent(t); setRawResp(t.raw); setSuggestTips([]); setQuery(""); }}>
                <div className="flex items-center gap-3">
                  <img src={t.imageUrl} alt={`fox-${i}`} className="w-12 h-8 object-cover rounded-sm" />
                  <div className="flex-1">
                    <div className="font-medium">Fox image</div>
                    <div className="text-xs opacity-60">{new Date(t.fetchedAt).toLocaleString()}</div>
                  </div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        {/* Left sidebar (desktop) */}
        <aside className={clsx("hidden lg:block lg:col-span-3 rounded-2xl p-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-semibold">Quick data</div>
            <div className="text-xs opacity-60">10 random</div>
          </div>

          <ScrollArea className="h-80">
            <div className="space-y-3">
              {leftSidebarData.length === 0 && <div className="text-sm opacity-60">No data yet</div>}
              {leftSidebarData.map((d, idx) => (
                <div key={idx} className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => { setCurrent(d); setRawResp(d.raw); }}>
                  <img src={d.imageUrl} alt={`s-${idx}`} className="w-12 h-12 rounded-md object-cover" />
                  <div className="flex-1 text-sm min-w-0">
                    <div className="font-medium truncate">Fox • {new Date(d.fetchedAt).toLocaleTimeString()}</div>
                    <div className="text-xs opacity-60 truncate">{d.imageUrl}</div>
                  </div>
                  <div className="text-xs opacity-60">{idx === 0 ? "latest" : `${idx+1}`}</div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <Separator className="my-3" />

          <div className="space-y-2">
            <Button variant="outline" className="w-full cursor-pointer" onClick={() => fetchGallery(50)}>{galleryLoading ? <Loader2 className="animate-spin" /> : <><Grid className="mr-2"/> Load 50</>}</Button>
            <Button variant="ghost" className="w-full cursor-pointer" onClick={() => { setGallery([]); showToast('success', 'Cleared gallery'); }}>Clear Gallery</Button>
          </div>
        </aside>

        {/* Center: viewer */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4 flex items-start flex-wrap gap-3 justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-md border flex items-center justify-center" style={{ background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)' }}>
                  <ImageIcon />
                </div>
                <div>
                  <CardTitle className="text-lg">Random Fox — Preview</CardTitle>
                  <div className="text-xs opacity-60 flex items-center gap-2"><Clock className="h-3 w-3" /> {current?.fetchedAt ? new Date(current.fetchedAt).toLocaleString() : 'No image yet'}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button className="cursor-pointer" variant="outline" onClick={() => fetchRandomFox()}><RefreshCw className={loading ? "animate-spin" : ""} /> Refresh</Button>
                <Button className="cursor-pointer" variant="ghost" onClick={() => setShowRaw((s) => !s)}><List /> {showRaw ? "Hide" : "Raw"}</Button>
                <Button className="cursor-pointer" variant="ghost" onClick={() => setDialogOpen(true)}><ExternalLink /> View</Button>
              </div>
            </CardHeader>

            <CardContent>
              {!current ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left: image */}
                  <div className={clsx("p-3 h-fit rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="w-full h-72 bg-zinc-100 dark:bg-zinc-900 rounded-md overflow-hidden flex items-center justify-center mb-3">
                      <img src={current.imageUrl} alt="random-fox" className="w-full h-full object-cover" />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-semibold">Random Fox</div>
                        <div className="text-xs opacity-60">Source: randomfox.ca</div>
                      </div>
                      <Badge>{current.imageUrl ? 'floof' : '—'}</Badge>
                    </div>

                    <div className="mt-3 space-y-2 text-sm">
                      <div>
                        <div className="text-xs opacity-60 flex items-center gap-2"><FileText className="h-3 w-3"/> Fetched At</div>
                        <div className="font-medium">{current.fetchedAt ? new Date(current.fetchedAt).toLocaleString() : "—"}</div>
                      </div>
                      <div>
                        <div className="text-xs opacity-60 flex items-center gap-2"><LinkIcon className="h-3 w-3"/> Image URL</div>
                        <div className="font-medium overflow-auto no-scrollbar break-words"><a href={current.imageUrl} target="_blank" rel="noreferrer" className="underline">{current.imageUrl}</a></div>
                      </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                      <motion.button whileTap={{ scale: 0.96 }} onClick={() => { if (current.imageUrl) window.open(current.imageUrl, "_blank"); else showToast("info", "No image link"); }} className="btn inline-flex items-center gap-2 rounded-md px-3 py-2 border cursor-pointer">
                        <ExternalLink /> Open
                      </motion.button>
                    </div>
                  </div>

                  {/* Right: details */}
                  <div className={clsx("p-3 rounded-xl border col-span-1 md:col-span-2 overflow-hidden", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-semibold mb-2 flex items-center gap-2"><Layers className="h-4 w-4"/> Description</div>
                        <div className="text-sm leading-relaxed mb-3">The Random Fox API returns a randomly chosen fox image. Use refresh to fetch another adorable floof. Gallery below shows the latest images loaded into memory.</div>
                      </div>

                      <div className="text-right text-xs opacity-60">
                        <div className="mb-1">History: <strong className="font-medium">{history.length}</strong></div>
                        <div>Gallery: <strong className="font-medium">{gallery.length}</strong></div>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="text-sm font-semibold mb-2 flex items-center gap-2"><Grid className="h-4 w-4"/> Gallery (showing {gallery50.length})</div>
                    <ScrollArea className="h-100 overflow-y-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {gallery50.length === 0 && <div className="text-sm opacity-60 col-span-full">Gallery is empty — load some images</div>}
                      {gallery50.map((g, i) => (
                        <div key={i} className="rounded-md overflow-hidden relative cursor-pointer" onClick={() => { setCurrent(g); setRawResp(g.raw); }}>
                          <img src={g.imageUrl} alt={`g-${i}`} className="w-full h-28 object-cover" loading="lazy" />
                          <div className="absolute left-2 bottom-2 bg-black/50 text-white text-xs px-2 py-1 rounded">{new Date(g.fetchedAt).toLocaleTimeString()}</div>
                        </div>
                      ))}
                    </div>
                    </ScrollArea>

                    <div className="mt-3 flex items-center gap-2">
                      <Button variant="outline" className="cursor-pointer" onClick={() => fetchGallery(50)}>{galleryLoading ? <Loader2 className="animate-spin" /> : <><Plus className="mr-2"/> +50</>}</Button>
                      <Button variant="ghost" className="cursor-pointer" onClick={() => setGallery((prev) => prev.slice(0,50))}>Show 50</Button>
                      <Button variant="ghost" className="cursor-pointer" onClick={() => setGallery([])}>Clear</Button>
                    </div>

                    <AnimatePresence>
                      {showRaw && rawResp && (
                        <motion.pre initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("text-xs overflow-auto mt-3 p-2 rounded border", isDark ? "text-zinc-200 bg-black/20 border-zinc-800" : "text-zinc-900 bg-white/60 border-zinc-200")} style={{ maxHeight: 220 }}>
                          {prettyJSON(rawResp)}
                        </motion.pre>
                      )}
                    </AnimatePresence>

                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right: developer tools + session history (mobile sheet already used) */}
        <aside className={clsx("hidden lg:block lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold mb-2">Developer</div>
            <div className="text-xs opacity-60">Endpoint & quick utilities</div>
            <div className="mt-2 space-y-2 grid grid-cols-1 gap-2">
              <Button variant="outline" onClick={() => copyEndpoint()} className="cursor-pointer"><Copy /> Copy Endpoint</Button>
              <Button variant="outline" onClick={() => downloadJSON()} className="cursor-pointer"><Download /> Download JSON</Button>
              <Button variant="outline" onClick={() => setShowRaw((s) => !s)} className="cursor-pointer"><List /> Toggle Raw</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Session History</div>
              <div className="text-xs opacity-60">recent</div>
            </div>

            <ScrollArea className="max-h-64 mt-2 rounded-md border p-2">
              <div className="space-y-2">
                {history.length === 0 && <div className="text-sm opacity-60">No images in this session yet.</div>}
                {history.map((h, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => { setCurrent(h); setRawResp(h.raw); }}>
                    <img src={h.imageUrl} alt={`fox-${idx}`} className="w-12 h-12 rounded-md object-cover" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">Fox — {new Date(h.fetchedAt).toLocaleTimeString()}</div>
                      <div className="text-xs opacity-60 truncate">{h.imageUrl}</div>
                    </div>
                    <div className="text-xs opacity-60">{idx === 0 ? "latest" : `${idx+1}`}</div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>Fox Image</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {current?.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={current.imageUrl} alt="fox-full" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image from randomfox.ca</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="cursor-pointer"><X /></Button>
              {current?.imageUrl && <Button variant="outline" onClick={() => window.open(current.imageUrl, "_blank")} className="cursor-pointer"><ExternalLink /></Button>}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
