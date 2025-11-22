// src/pages/ArticPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper";

import {
  Search,
  ImageIcon,
  ExternalLink,
  X,
  Loader2,
  List,
  ChevronLeft,
  ChevronRight,
  MapPin,
  BookOpen,
  Info,
  Grid
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from "@/components/ui/select";


import { useTheme } from "@/components/theme-provider";

/* ---------- Endpoint ---------- */
const BASE_ENDPOINT = "https://api.artic.edu/api/v1/artworks";

/* ---------- Defaults ---------- */
const DEFAULT_MSG = "Search artworks, artists or keywords (e.g. 'Monet', 'landscape', 'portrait')";

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

function buildIIIFUrl(iiif_base, image_id, size = 843) {
  if (!iiif_base || !image_id) return null;
  // standard IIIF full width with size limit
  return `${iiif_base}/${image_id}/full/${size},/0/default.jpg`;
}

export default function ArticPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // UI state
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [items, setItems] = useState([]); // list of artworks shown in gallery
  const [rawResp, setRawResp] = useState(null);
  const [currentArtwork, setCurrentArtwork] = useState(null);
  const [loading, setLoading] = useState(false);

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(24);
  const [totalPages, setTotalPages] = useState(null);

  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const suggestTimer = useRef(null);

  /* ---------- Fetch helpers ---------- */
  async function fetchArtworks({ q = "", page = 1, limit = 24 } = {}) {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));
      if (q && q.trim().length > 0) params.set("q", q.trim());
      // fields param to reduce payload, but still include many fields for detail
      params.set("fields", [
        "id",
        "title",
        "artist_title",
        "artist_display",
        "date_display",
        "image_id",
        "thumbnail",
        "medium_display",
        "dimensions",
        "place_of_origin",
        "credit_line",
        "department_title",
        "is_public_domain",
        "inscriptions",
        "publication_history",
        "provenance_text",
        "exhibition_history"
      ].join(","));

      const url = `${BASE_ENDPOINT}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        showToast("error", `API error ${res.status}`);
        setLoading(false);
        return;
      }
      const json = await res.json();
      const data = json.data || [];
      setItems(data);
      setRawResp(json);
      // pagination: json.pagination.limit, json.pagination.total or total_pages
      if (json.pagination) {
        const total = json.pagination.total || null;
        const psize = json.pagination.limit || limit;
        if (total && psize) {
          setTotalPages(Math.ceil(total / psize));
        } else {
          setTotalPages(null);
        }
      } else {
        setTotalPages(null);
      }

      // choose first as default if none selected
      if (data.length > 0 && !currentArtwork) {
        setCurrentArtwork(data[0]);
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch artworks");
    } finally {
      setLoading(false);
    }
  }

  async function searchSuggest(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);
    try {
      // Use the same endpoint with a very small limit to produce suggestions
      const params = new URLSearchParams();
      params.set("q", q.trim());
      params.set("limit", "8");
      params.set("fields", "id,title,artist_title,image_id,thumbnail");
      const url = `${BASE_ENDPOINT}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      const json = await res.json();
      setSuggestions(json.data || []);
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
      searchSuggest(v);
    }, 350);
  }

  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query || query.trim().length === 0) {
      showToast("info", DEFAULT_MSG);
      return;
    }
    setPage(1);
    await fetchArtworks({ q: query, page: 1, limit });
    setShowSuggest(false);
  }

  function selectSuggestion(art) {
    setShowSuggest(false);
    setQuery(art.title || "");
    setCurrentArtwork(art);
    // optionally, fetch single artwork details? The API also offers /artworks/{id}, but the list gives many fields already.
    // We'll set rawResp to a wrapper to keep the raw inspector useful.
    setRawResp({ data: [art] });
  }

function openImage(art) {
  // make sure the detail panel sees this artwork too
  setCurrentArtwork(art);

  // keep a useful rawResp wrapper so raw inspector & iiif base can read it,
  // but do not overwrite an existing config if present
  setRawResp(prev => {
    if (prev && prev.config) return { ...prev, data: [art] };
    return { data: [art], config: prev?.config || {} };
  });

  setDialogOpen(true);
}


  function gotoPage(p) {
    if (p < 1) return;
    if (totalPages && p > totalPages) return;
    setPage(p);
  }

  useEffect(() => {
    // fetch on mount and when page or limit changes, or when no query
    fetchArtworks({ q: query, page, limit });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  useEffect(() => {
    // if query cleared, reload first page
    if (!query) {
      setPage(1);
      fetchArtworks({ q: "", page: 1, limit });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query === ""]);

  /* ---------- render ---------- */
  const iiif_base = rawResp?.config?.iiif_url || rawResp?.config?.iiif_url || "https://www.artic.edu/iiif/2";

  return (
    <div className={clsx("min-h-screen p-6 overflow-hidden max-w-9xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>Artic — Artworks Explorer</h1>
          <p className="mt-1 text-sm opacity-70">Explore the Art Institute of Chicago's collection — large gallery, deep metadata and high-quality IIIF images.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[720px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search artworks, artists, keywords (e.g. 'Matisse', 'landscape', 'ceramic')"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
             <Button className="cursor-pointer px-3"type="submit" variant="outline" >Search</Button>
             <Button className="cursor-pointer"type="button" variant="ghost" onClick={() => { setQuery(""); fetchArtworks({ q: "", page: 1, limit }); }}>Clear</Button>
          </form>
        </div>
      </header>

      {/* suggestions */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          
          <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_360px)] md:right-auto max-w-6xl rounded-xl overflow-hidden shadow-2xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            
            {items.map((s, idx) => (
              <li key={s.id || idx} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => selectSuggestion(s)}>
                <div className="flex items-center gap-3">
                  <img src={s.image_id ? buildIIIFUrl(iiif_base, s.image_id, 800) : null} alt={s.title || "thumb"} className="w-14 h-10 object-cover rounded-sm" />
                  <div className="flex-1">
                    <div className="font-medium">{s.title}</div>
                    <div className="text-xs opacity-60">{s.artist_title || s.artist_display || "Unknown artist"}</div>
                  </div>
                  <div className="text-xs opacity-60">{s.date_display || "—"}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Gallery + controls (left / center) */}
        <section className="lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="text-sm font-semibold">Gallery</div>
              <div className="text-xs opacity-60">Page {page}{totalPages ? ` of ${totalPages}` : ""} • {items.length} items</div>
            </div>
            <div className="flex items-center gap-2">
               <Button className="cursor-pointer" variant="outline" onClick={() => gotoPage(page - 1)} disabled={page <= 1}><ChevronLeft /></Button>
               <Button className="cursor-pointer" variant="outline" onClick={() => gotoPage(page + 1)} disabled={totalPages ? page >= totalPages : false}><ChevronRight /></Button>
              <div className="text-xs opacity-60 hidden sm:block">Limit</div>
            <Select
  value={String(limit)}
  onValueChange={(v) => setLimit(Number(v))}
>
  <SelectTrigger className="w-[100px] cursor-pointer">
    <SelectValue className="cursor-pointer" placeholder="Limit" />
  </SelectTrigger>

  <SelectContent>
    <SelectItem className="cursor-pointer" value="12">12</SelectItem>
    <SelectItem className="cursor-pointer" value="24">24</SelectItem>
    <SelectItem className="cursor-pointer" value="48">48</SelectItem>
  </SelectContent>
</Select>

            </div>
          </div>

          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardContent className="h-200 overflow-y-auto no-scrollbar">
              {loading ? (
                <div className="py-20 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : items.length === 0 ? (
                <div className="py-20 text-center text-sm opacity-60">No artworks found — try a broader search.</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {items.map((art) => {
                    const thumb = art.thumbnail?.lqip || buildIIIFUrl(iiif_base, art.image_id, 400) || "";
                    const hiRes = art.image_id ? buildIIIFUrl(iiif_base, art.image_id, 800) : null;
                    return (
                      <div key={art.id} className="rounded-lg overflow-hidden border hover:shadow-lg transition cursor-pointer" onClick={() => setCurrentArtwork(art)}>
                        <div className="relative">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={hiRes} alt={art.title} className="w-full h-44 object-cover" />
                          <div className="absolute left-2 top-2 px-2 py-1 rounded-md text-xs bg-white/80 dark:bg-black/60">
                            <div className="font-medium">{art.artist_title || "Unknown"}</div>
                          </div>
                        </div>
                        <div className="p-3 bg-transparent">
                          <div className="text-sm font-semibold">{art.title}</div>
                          <div className="text-xs opacity-60">{art.date_display || art.medium_display || "—"}</div>
                          <div className="mt-2 flex items-center justify-between">
                            <div className="text-xs opacity-60">ID {art.id}</div>
                             <Button className="cursor-pointer" size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); openImage(art); }}><ImageIcon /></Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right: detail panel */}
        <aside className={clsx("lg:col-span-4 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold">Artwork details</div>
              <div className="text-xs opacity-60">Select an artwork to see full metadata</div>
            </div>
            <div className="flex gap-2">
               <Button className="cursor-pointer" variant="ghost" onClick={() => setShowRaw((s) => !s)}><List /> {showRaw ? "Hide Raw" : "Raw"}</Button>
               <Button className="cursor-pointer" variant="ghost" onClick={() => {
                // copy current IIIF image or artwork JSON to clipboard
                if (currentArtwork) {
                  navigator.clipboard.writeText(prettyJSON(currentArtwork));
                  showToast("success", "Artwork JSON copied");
                } else {
                  showToast("info", "No artwork selected");
                }
              }}><ExternalLink /></Button>
            </div>
          </div>

          {!currentArtwork ? (
            <div className="text-sm opacity-60 p-3">No artwork selected. Click a gallery item to view its metadata and image.</div>
          ) : (
            <>
              <div className={clsx("rounded-lg overflow-hidden border p-0", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                <div className="relative">
                  {/* main image using IIIF; fall back to thumbnail if needed */}
                  <img
                    src={buildIIIFUrl(iiif_base, currentArtwork.image_id, 1200) || currentArtwork.thumbnail?.lqip || ""}
                    alt={currentArtwork.title}
                    className="w-full h-64 object-contain bg-zinc-100 dark:bg-zinc-900"
                    onClick={() => setDialogOpen(true)}
                    style={{ cursor: "zoom-in" }}
                  />
                </div>

                <div className="p-4">
                  <div className="text-xl font-semibold">{currentArtwork.title}</div>
                  <div className="text-sm opacity-70">{currentArtwork.artist_display || currentArtwork.artist_title || "Unknown artist"}</div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-xs opacity-60">Date</div>
                      <div className="font-medium">{currentArtwork.date_display || "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs opacity-60">Medium</div>
                      <div className="font-medium">{currentArtwork.medium_display || "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs opacity-60">Dimensions</div>
                      <div className="font-medium">{currentArtwork.dimensions || "—"}</div>
                    </div>
                    <div>
                      <div className="text-xs opacity-60">Origin</div>
                      <div className="font-medium">{currentArtwork.place_of_origin || "—"}</div>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div className="text-sm">
                    <div className="text-xs opacity-60">Department</div>
                    <div className="font-medium">{currentArtwork.department_title || "—"}</div>

                    <div className="mt-2 text-xs opacity-60">Credit line</div>
                    <div className="text-sm">{currentArtwork.credit_line || "—"}</div>

                    {currentArtwork.provenance_text && (
                      <>
                        <div className="mt-2 text-xs opacity-60">Provenance</div>
                        <div className="text-sm">{currentArtwork.provenance_text}</div>
                      </>
                    )}

                    {currentArtwork.publication_history && (
                      <>
                        <div className="mt-2 text-xs opacity-60">Publication history</div>
                        <div className="text-sm">{currentArtwork.publication_history}</div>
                      </>
                    )}

                    {currentArtwork.exhibition_history && (
                      <>
                        <div className="mt-2 text-xs opacity-60">Exhibition history</div>
                        <div className="text-sm">{currentArtwork.exhibition_history}</div>
                      </>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                     <Button className="cursor-pointer" variant="outline" onClick={() => openImage(currentArtwork)}><ImageIcon /> View Image</Button>
                     <Button className="cursor-pointer" variant="outline" onClick={() => {
                      if (currentArtwork.id) window.open(`https://www.artic.edu/artworks/${currentArtwork.id}`, "_blank");
                    }}><ExternalLink /> Open at AIC website</Button>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {showRaw && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-3 p-3 rounded-md border overflow-auto">
                    <pre style={{ maxHeight: 280 }} className="text-xs whitespace-pre-wrap">{prettyJSON(currentArtwork)}</pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </>
          )}

          <Separator />

          <div>
            <div className="text-sm font-semibold">API Response (developer)</div>
            <div className="text-xs opacity-60">You can inspect full HTTP response to see additional fields and pagination.</div>
            <div className="mt-2">
               <Button className="cursor-pointer" variant="outline" onClick={() => {
                if (!rawResp) {
                  showToast("info", "No raw response cached yet; perform a search first.");
                  return;
                }
                navigator.clipboard.writeText(prettyJSON(rawResp));
                showToast("success", "Raw response copied");
              }}><List /> Copy full response</Button>
            </div>
          </div>
        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-5xl w-full p-3  rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle className="truncate w-100">{currentArtwork?.title || "Artwork image"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "75vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {currentArtwork?.image_id ? (
              <img
                src={buildIIIFUrl(iiif_base, currentArtwork.image_id, 2000)}
                alt={currentArtwork?.title}
                style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }}
              />
            ) : currentArtwork?.thumbnail?.lqip ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={currentArtwork.thumbnail.lqip} alt={currentArtwork?.title} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center">No image available</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image provided by the Art Institute of Chicago (IIIF)</div>
            <div className="flex gap-2">
               <Button className="cursor-pointer"variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
               <Button className="cursor-pointer"variant="outline" onClick={() => {
                if (currentArtwork?.image_id) {
                  const url = buildIIIFUrl(iiif_base, currentArtwork.image_id, 2000);
                  window.open(url, "_blank");
                } else if (currentArtwork?.thumbnail?.lqip) {
                  window.open(currentArtwork.thumbnail.lqip, "_blank");
                } else {
                  showToast("info", "No image to open");
                }
              }}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
