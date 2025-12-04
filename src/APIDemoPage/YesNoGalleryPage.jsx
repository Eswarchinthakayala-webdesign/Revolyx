// src/pages/YesNoGalleryPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion } from "framer-motion";
import {
  Search,
  ExternalLink,
  Download,
  Copy,
  Loader2,
  List,
  X,
  FileText,
  Menu,
  Check,
  Plus,
  ImageIcon,
  RefreshCw,
} from "lucide-react";

// shadcn UI components - adjust import paths to your codebase
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip } from "@/components/ui/tooltip";

const API_URL = "https://yesno.wtf/api";
const INITIAL_LOAD = 20;
const LOAD_MORE = 20;

// Helper: fetch one random YesNo item
async function fetchOne() {
  const r = await fetch(API_URL);
  if (!r.ok) throw new Error(`API ${r.status}`);
  return r.json(); // { answer: "yes"/"no"/"maybe", forced: boolean, image: "url" }
}

// Helper: fetch many in parallel (with basic error resilience)
async function fetchMany(count = 10) {
  const promises = Array.from({ length: count }, () =>
    fetch(API_URL)
      .then((r) => {
        if (!r.ok) return null;
        return r.json();
      })
      .catch(() => null)
  );
  const results = await Promise.all(promises);
  // filter out nulls
  return results.filter(Boolean);
}

export default function YesNoGalleryPage() {
  const [gifs, setGifs] = useState([]); // array of {answer, forced, image}
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const [query, setQuery] = useState(""); // for suggestion/filtering
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);

  const [selected, setSelected] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copyState, setCopyState] = useState({ copying: false, success: false });

  const [showRaw, setShowRaw] = useState(false);

  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  const suggestionRef = useRef(null);
  const copyTimerRef = useRef(null);

  // initial load
  useEffect(() => {
    loadInitial();
    // cleanup timer
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadInitial() {
    setLoading(true);
    try {
      const arr = await fetchMany(INITIAL_LOAD);
      setGifs(arr);
    } catch (e) {
      console.error("initial load failed", e);
    } finally {
      setLoading(false);
    }
  }

  async function loadMore() {
    setLoadingMore(true);
    try {
      const arr = await fetchMany(LOAD_MORE);
      setGifs((s) => [...s, ...arr]);
    } catch (e) {
      console.error("load more failed", e);
    } finally {
      setLoadingMore(false);
    }
  }

  // suggestions (simple): if user types "y", "ye", "yes" -> offer "yes", similar for "no"/"maybe"
  useEffect(() => {
    const q = (query || "").trim().toLowerCase();
    if (!q) {
      setSuggestions([]);
      setShowSuggest(false);
      return;
    }
    const candidates = ["yes", "no", "maybe"].filter((x) => x.startsWith(q));
    setSuggestions(candidates);
    setShowSuggest(candidates.length > 0);
  }, [query]);

  function applyFilter(filter) {
    setQuery(filter);
    setShowSuggest(false);
  }

  function filteredGifs() {
    const q = (query || "").trim().toLowerCase();
    if (!q) return gifs;
    return gifs.filter((g) => (g.answer || "").toLowerCase() === q);
  }

  async function handleSelectGif(item) {
    setSelected(item);
    setDialogOpen(true);
    setShowRaw(false);
  }

  async function handleCopyUrl(url) {
    if (!url) return;
    try {
      setCopyState({ copying: true, success: false });
      await navigator.clipboard.writeText(url);
      setCopyState({ copying: false, success: true });
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopyState({ copying: false, success: false }), 1800);
    } catch (e) {
      console.error("copy failed", e);
      setCopyState({ copying: false, success: false });
    }
  }

  async function handleDownload(url, name = "yesno.gif") {
    // simple download by creating a link
    try {
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      console.error("download failed", e);
    }
  }

  // small visual helper for glassy badge
  const GlassBadge = ({ children }) => (
    <Badge className="glass-badge px-2 py-0.5 text-xs">{children}</Badge>
  );

  // grid items to render
  const visible = filteredGifs();

  return (
    <div className="min-h-screen  transition-colors">
      <div className="max-w-8xl overflow-hidden mx-auto px-4 sm:px-6 pb-10 py-6">
        {/* Header */}
        <header className="flex items-start md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
              <SheetTrigger asChild>
                <button className="md:hidden p-2 rounded-md hover:bg-muted/10 cursor-pointer" aria-label="open menu">
                  <Menu size={20} />
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] p-3">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-semibold">YesNo — Menu</h3>
                    <div className="text-xs opacity-70">Search & quick actions</div>
                  </div>
                  
                </div>

                {/* Mobile menu: search + load more */}
                <div className="space-y-3">
                  <div>
                    <label className="text-xs opacity-70">Filter by answer</label>
                    <div className="mt-2 flex gap-2">
                      <Input placeholder="yes / no / maybe" value={query} onChange={(e) => setQuery(e.target.value)} />
                      <Button onClick={() => applyFilter(query)} className="cursor-pointer">Apply</Button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={() => loadMore()} className="cursor-pointer" variant="outline"><Plus size={14} /> +20</Button>
                    <Button onClick={() => { setQuery(""); setShowSuggest(false); }} className="cursor-pointer" variant="ghost">Clear</Button>
                  </div>

                  <Separator />

                  <div>
                    <Button onClick={() => { setGifs([]); loadInitial(); }} className="cursor-pointer" variant="ghost"><RefreshCw /> Reload</Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold">YesNo GIF Gallery</h1>
              <div className="mt-1 text-sm opacity-70 max-w-lg">
                Random animated responses from <code className="rounded px-1 bg-muted/5">yesno.wtf</code>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
         

            <div className="hidden sm:flex gap-2">
              <Input
                placeholder="Filter by answer (yes / no / maybe)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowSuggest(true)}
                onBlur={() => setTimeout(() => setShowSuggest(false), 120)}
                className="max-w-[320px]"
                aria-label="Filter answers"
              />
              <Button onClick={() => applyFilter(query)} className="cursor-pointer">Filter</Button>
              <Button variant="outline" onClick={() => { setQuery(""); setShowSuggest(false); }} className="cursor-pointer">Clear</Button>
            </div>

            <div className="ml-2 hidden sm:flex items-center gap-2">
              <Button variant="ghost" className="cursor-pointer" onClick={() => { setGifs([]); loadInitial(); }}>
                <RefreshCw /> Reload
              </Button>
            </div>
          </div>
        </header>

        {/* Suggestions dropdown (simple) */}
        <div className="relative">
          {showSuggest && suggestions.length > 0 && (
            <div ref={suggestionRef} className={clsx("absolute z-50 mt-1  right-150 w-50  rounded-md border bg-white dark:bg-zinc-900 shadow-lg")}>
              <ScrollArea style={{ height: 160 }}>
                <div className="p-2">
                  {suggestions.map((s) => (
                    <button key={s} onClick={() => applyFilter(s)} className="w-full text-left px-3 py-2 rounded hover:bg-muted/10 cursor-pointer">
                      <div className="flex items-center gap-2">
                        <List size={14} />
                        <span className="font-medium">{s}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          )}
        </div>

        <Separator className="my-6" />

        {/* Main layout: left (controls), center (gallery), right (actions) */}
        <main className="grid grid-cols-1 lg:grid-cols-[280px_1fr_320px] gap-6">
          {/* LEFT: Controls / Info */}
          <aside className="rounded-2xl p-4 h-fit border bg-white/90 dark:bg-zinc-950 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Controls</div>
                <div className="text-xs opacity-60">Filter & load</div>
              </div>
              <GlassBadge>Gallery</GlassBadge>
            </div>

            <Separator className="my-3" />

            <div className="space-y-3">
           

              <div>
                <label className="text-xs opacity-70">Gallery actions</label>
                <div className="mt-2 flex gap-2">
                  <Button onClick={() => loadMore()} className="cursor-pointer" variant="outline"><Plus /> +20</Button>
                  <Button onClick={() => { setGifs([]); loadInitial(); }} className="cursor-pointer" variant="ghost"><RefreshCw /> Reload</Button>
                </div>
              </div>

              <div>
                <label className="text-xs opacity-70">Status</label>
                <div className="mt-2 text-sm">
                  <div className="flex items-center gap-2"><GlassBadge>{gifs.length}</GlassBadge> GIFs loaded</div>
                  <div className="text-xs opacity-60 mt-1">{loading ? "Loading initial set…" : loadingMore ? "Loading more…" : "Ready"}</div>
                </div>
              </div>
            </div>
          </aside>

          {/* CENTER: Gallery */}
          <section>
            <div className="rounded-2xl p-2 border bg-white/90 dark:bg-zinc-950 shadow-sm">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-semibold flex items-center gap-2"><ImageIcon /> GIF Gallery</h2>
                  <div className="text-xs opacity-60">{visible.length} visible</div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => { setQuery(""); setShowSuggest(false); }} className="cursor-pointer"><X /> Clear</Button>
                  <Button onClick={() => loadMore()} className="cursor-pointer" variant="outline">{loadingMore ? <Loader2 className="animate-spin" /> : <><Plus /> +20</>}</Button>
                </div>
              </div>

              <Separator />

              <div className="p-4">
                {loading ? (
                  <div className="py-20 text-center"><Loader2 className="animate-spin" size={24} /></div>
                ) : visible.length === 0 ? (
                  <div className="py-16 text-center text-sm opacity-60">No GIFs match that filter.</div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                    {visible.map((g, i) => (
                      <button
                        key={`${g.image}-${i}`}
                        onClick={() => handleSelectGif(g)}
                        className="group rounded-md overflow-hidden border bg-white dark:bg-zinc-900 hover:shadow-md transition-transform transform hover:-translate-y-1 cursor-pointer"
                        title={`${g.answer} ${g.forced ? "(forced)" : ""}`}
                      >
                        <div className="relative aspect-[4/3] bg-black/5">
                          <img src={g.image} alt={`${g.answer} gif`} className="w-full h-full object-cover" loading="lazy" />
                          <div className="absolute left-2 top-2">
                            <GlassBadge>{g.answer?.toUpperCase()}</GlassBadge>
                          </div>
                          <div className="absolute right-2 bottom-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex gap-2">
                              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleCopyUrl(g.image); }} className="cursor-pointer"><Copy size={14} /></Button>
                              <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); handleDownload(g.image, `yesno-${g.answer}-${i}.gif`); }} className="cursor-pointer"><Download size={14} /></Button>
                            </div>
                          </div>
                        </div>

                        <div className="p-2">
                          <div className="text-sm font-medium truncate">{g.answer?.toUpperCase()}</div>
                          <div className="text-xs opacity-60">forced: {String(g.forced)}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* RIGHT: Quick actions / Selected detail */}
          <aside className="rounded-2xl p-4 h-fit border bg-white/90 dark:bg-zinc-950 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold">Selected</div>
                <div className="text-xs opacity-60">Quick actions</div>
              </div>
              <GlassBadge>Item</GlassBadge>
            </div>

            <Separator className="my-3" />

            {!selected ? (
              <div className="py-8 text-center text-sm opacity-70">No selection. Click a GIF to view details and actions.</div>
            ) : (
              <div className="space-y-3">
                <div className="rounded-md overflow-hidden border">
                  <img src={selected.image} alt={`${selected.answer} gif`} className="w-full object-cover" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold capitalize">{selected.answer}</div>
                    {selected.forced && <Badge className="glass-badge">forced</Badge>}
                  </div>
                  <div className="text-xs opacity-60 mt-1">Animated GIF — source: yesno.wtf</div>
                </div>

                <div className="flex gap-2">
                  <Tooltip content="Open GIF">
                    <Button onClick={() => window.open(selected.image, "_blank")} className="cursor-pointer" variant="ghost"><ExternalLink /></Button>
                  </Tooltip>

                  <Tooltip content="Copy GIF URL">
                    <motion.button
                      whileTap={{ scale: 0.96 }}
                      onClick={() => handleCopyUrl(selected.image)}
                      className={clsx("p-2 rounded-md border flex items-center justify-center cursor-pointer", copyState.success ? "bg-emerald-600 text-white border-emerald-600" : "hover:bg-muted/10")}
                    >
                      {copyState.copying ? <Loader2 className="animate-spin" size={16} /> : copyState.success ? <Check size={16} /> : <Copy size={16} />}
                    </motion.button>
                  </Tooltip>

                  <Tooltip content="Download GIF">
                    <button onClick={() => handleDownload(selected.image, `yesno-${selected.answer}.gif`)} className="p-2 rounded-md border hover:bg-muted/10 cursor-pointer"><Download /></button>
                  </Tooltip>

                  <Button variant="outline" onClick={() => setShowRaw((s) => !s)} className="ml-auto cursor-pointer">{showRaw ? "Hide raw" : "Raw"}</Button>
                </div>

                {showRaw && (
                  <div className="rounded-md p-3 border bg-muted/5 text-xs overflow-auto max-h-48">
                    <pre>{JSON.stringify(selected, null, 2)}</pre>
                  </div>
                )}

                <Divider />
                <div className="text-xs opacity-60">
                  Tip: click any GIF in the gallery to quickly preview. Use filters on the left to narrow by answer.
                </div>
              </div>
            )}
          </aside>
        </main>

        {/* full-screen dialog for selected image */}
        <Dialog open={dialogOpen} onOpenChange={(v) => setDialogOpen(v)}>
          <DialogContent className="max-w-4xl w-full p-3 rounded-2xl overflow-hidden bg-black">
            <DialogHeader>
              <DialogTitle className="text-white">{selected?.answer?.toUpperCase() ?? ""}</DialogTitle>
            </DialogHeader>
            <div style={{ height: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
              {selected ? <img src={selected.image} alt={`${selected.answer} gif`} style={{ maxWidth: "100%", maxHeight: "100%" }} /> : <Loader2 className="animate-spin text-white" />}
            </div>
            <DialogFooter className="flex justify-between items-center p-4 border-t">
              <div className="text-xs opacity-60 text-white">Image from yesno.wtf</div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setDialogOpen(false)} className="cursor-pointer"><X /></Button>
                <Button onClick={() => window.open(selected?.image, "_blank")} className="cursor-pointer"><ExternalLink /></Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>


    </div>
  );
}

/* small Divider component (kept inline to avoid import) */
function Divider() {
  return <div className="h-px bg-zinc-100 dark:bg-zinc-800 my-3" />;
}
