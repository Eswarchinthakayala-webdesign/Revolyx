// OpenBreweryPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  MapPin,
  ExternalLink,
  Copy,
  Download,
  Loader2,
  Layers as Glass,
  List,
  Phone,
  Globe,
  Clock,
  Info,
  Layers,
  X,
  Menu,
  RefreshCw,
  Check,
  Map,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";
// shadcn UI sheet + scroll area
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";


/**
 * OpenBreweryPage - Redesigned
 * - Adds OpenStreetMap embed preview
 * - Website iframe preview
 * - 10 random items in sidebar + refresh
 * - Mobile sheet for sidebar (Dialog used as sheet)
 * - Animated copy button with tick
 * - Improved UI layout & icons
 */

const API_BASE = "https://api.openbrewerydb.org/v1";
const DEFAULT_QUERY = "dog";
const DEBOUNCE_MS = 300;

function prettyJSON(obj) {
  try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
}

export default function OpenBreweryPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // UI state
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [brewery, setBrewery] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [loadingBrewery, setLoadingBrewery] = useState(false);

  const [showRaw, setShowRaw] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  // sidebar / random list
  const [randomList, setRandomList] = useState([]);
  const [loadingRandom, setLoadingRandom] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // copy animation state
  const [copied, setCopied] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  const suggestTimer = useRef(null);
  const latestSuggestAbort = useRef(null);

  // endpoints
  const autocompleteUrl = (q) => `${API_BASE}/breweries/autocomplete?query=${encodeURIComponent(q)}`;
  const searchByNameUrl = (q) => `${API_BASE}/breweries?by_name=${encodeURIComponent(q)}`;
  const lookupByIdUrl = (id) => `${API_BASE}/breweries/${encodeURIComponent(id)}`;
  const allBreweriesUrl = (perPage = 50) => `${API_BASE}/breweries?per_page=${perPage}`;

  // --- fetch helpers
  async function fetchSuggestions(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    if (latestSuggestAbort.current) {
      latestSuggestAbort.current.abort();
      latestSuggestAbort.current = null;
    }
    const controller = new AbortController();
    latestSuggestAbort.current = controller;
    setLoadingSuggest(true);
    try {
      const res = await fetch(autocompleteUrl(q), { signal: controller.signal });
      if (!res.ok) {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      const json = await res.json();
      setSuggestions(Array.isArray(json) ? json : []);
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error("suggestions error", err);
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
      latestSuggestAbort.current = null;
    }
  }

  async function fetchFirstByName(q) {
    setLoadingBrewery(true);
    try {
      const res = await fetch(searchByNameUrl(q));
      const json = await res.json();
      if (Array.isArray(json) && json.length > 0) {
        const item = json[0];
        setBrewery(item);
        setRawResp(json);
      } else {
        setBrewery(null);
        setRawResp(json);
        showToast("info", "No breweries found for that name.");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to search breweries.");
    } finally {
      setLoadingBrewery(false);
    }
  }

  async function fetchById(id) {
    if (!id) return;
    setLoadingBrewery(true);
    try {
      const res = await fetch(lookupByIdUrl(id));
      if (!res.ok) {
        showToast("error", `Lookup failed (${res.status})`);
        setLoadingBrewery(false);
        return;
      }
      const json = await res.json();
      setBrewery(json);
      setRawResp(json);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch brewery.");
    } finally {
      setLoadingBrewery(false);
    }
  }

  // fetch and pick 10 random breweries for sidebar
  async function loadRandomList() {
    setLoadingRandom(true);
    try {
      // fetch a bunch and pick random 10
      const res = await fetch(allBreweriesUrl(50));
      const arr = await res.json();
      if (!Array.isArray(arr)) {
        setRandomList([]);
        return;
      }
      const picked = [];
      const clon = [...arr];
      while (picked.length < 10 && clon.length) {
        const idx = Math.floor(Math.random() * clon.length);
        picked.push(clon.splice(idx, 1)[0]);
      }
      setRandomList(picked);
    } catch (err) {
      console.error("random list failed", err);
      setRandomList([]);
    } finally {
      setLoadingRandom(false);
    }
  }

  // initial load
  useEffect(() => {
    fetchFirstByName(DEFAULT_QUERY);
    loadRandomList();

    return () => {
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
      if (latestSuggestAbort.current) latestSuggestAbort.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // interactions
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      fetchSuggestions(v);
    }, DEBOUNCE_MS);
  }

  async function onSubmit(e) {
    e?.preventDefault?.();
    if (!query || query.trim().length === 0) {
      showToast("info", "Try searching for 'Stone', 'Lagunitas', or a city name.");
      return;
    }
    setShowSuggest(false);
    await fetchFirstByName(query);
  }

  function pickSuggestion(item) {
    if (!item) return;
    if (item.id) {
      fetchById(item.id);
      setShowSuggest(false);
    } else {
      fetchFirstByName(item.name || query);
      setShowSuggest(false);
    }
  }

  // quick actions
  function openMaps() {
    if (!brewery) return;
    const lat = brewery.latitude;
    const lon = brewery.longitude;
    if (lat && lon) {
      window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`, "_blank");
    } else {
      showToast("info", "Coordinates not available for this brewery.");
    }
  }

  async function copyDetails() {
    if (!brewery) return showToast("info", "No brewery loaded.");
    const text = `${brewery.name}\n${brewery.street ?? ""}\n${brewery.city ?? ""}, ${brewery.state ?? ""} ${brewery.postal_code ?? ""}\n${brewery.phone ?? ""}\n${brewery.website_url ?? ""}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      showToast("success", "Brewery details copied.");
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      showToast("error", "Copy failed.");
    }
  }

  async function copyJSON() {
    if (!brewery && !rawResp) return showToast("info", "No data to copy.");
    const payload = rawResp || brewery;
    try {
      await navigator.clipboard.writeText(prettyJSON(payload));
      setCopiedJson(true);
      showToast("success", "JSON copied to clipboard");
      setTimeout(() => setCopiedJson(false), 1500);
    } catch (err) {
      showToast("error", "Copy JSON failed.");
    }
  }

  function downloadJSON() {
    if (!brewery && !rawResp) return showToast("info", "No data to download.");
    const payload = rawResp || brewery;
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `brewery_${(brewery?.name || "brewery").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  // derived values
  const fullAddress = useMemo(() => {
    if (!brewery) return "—";
    const parts = [];
    if (brewery.street) parts.push(brewery.street);
    const cityLine = [brewery.city, brewery.state, brewery.postal_code].filter(Boolean).join(", ");
    if (cityLine) parts.push(cityLine);
    if (brewery.country) parts.push(brewery.country);
    return parts.join(" • ");
  }, [brewery]);

  const osmEmbedSrc = useMemo(() => {
    if (!brewery?.latitude || !brewery?.longitude) return null;
    const lat = brewery.latitude;
    const lon = brewery.longitude;
    // Use OSM embed page (works without API key)
    return `https://www.openstreetmap.org/export/embed.html?bbox=${Number(lon)-0.01},${Number(lat)-0.01},${Number(lon)+0.01},${Number(lat)+0.01}&layer=mapnik&marker=${lat},${lon}`;
  }, [brewery]);

  const websiteIframeSrc = useMemo(() => {
    if (!brewery?.website_url) return null;
    // For safety: load the URL directly; sandbox in iframe restricts some operations
    return brewery.website_url.startsWith("http") ? brewery.website_url : `https://${brewery.website_url}`;
  }, [brewery]);

  // small helper for list item click
  function handleListPick(item) {
    if (!item) return;
    fetchById(item.id);
    // if on mobile, close the sheet
    setMobileSidebarOpen(false);
  }

  // UI pieces
  const headerBg = isDark ? "bg-black/40 border-b border-zinc-800" : "bg-white/95 border-b border-zinc-200";
  const panelBg = isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200";

  return (
    <div className={clsx("min-h-screen p-4 pb-10 md:p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className={clsx("flex flex-wrap items-center justify-between gap-3 mb-4", "rounded-2xl p-3")}>
        <div className="flex items-center gap-3">
          {/* Mobile menu to open sidebar */}
          <button
            aria-label="Open menu"
            onClick={() => setMobileSidebarOpen(true)}
            className="md:hidden p-2 rounded-lg hover:bg-zinc-100/30 dark:hover:bg-zinc-800 cursor-pointer"
            title="Open breweries list"
          >
            <Menu />
          </button>

          <div>
            <h1 className="text-lg md:text-2xl font-extrabold leading-tight">BrewFinder</h1>
            <div className="text-xs opacity-70">Open Brewery DB — search & preview</div>
          </div>
        </div>

        <div className="flex sm:w-auto w-full  justify-center">
          <form onSubmit={onSubmit} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-3 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search breweries by name or city (e.g. 'Lagunitas', 'San Diego')"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
              aria-label="Search breweries"
            />
            <Button type="submit" variant="outline" className="px-3 cursor-pointer"><Search /></Button>
          </form>
        </div>

     

    
      </header>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={clsx("absolute z-50 left-4 right-4 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, idx) => (
              <li key={s.id ?? `${s.name}-${idx}`} onClick={() => pickSuggestion(s)} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center">
                    <Glass className="w-5 h-5 opacity-75" />
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs opacity-60">{s.brewery_type ?? "—"}</div>
                  </div>
                  <div className="text-xs opacity-60">id: {s.id}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left sidebar - desktop */}
        <aside className={clsx("hidden h-fit lg:block lg:col-span-3 space-y-4 p-4 rounded-2xl border", panelBg)}>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Nearby / Random</div>
            <div className="text-xs opacity-60">Quick list</div>
          </div>

          <div className="mt-2 flex gap-2">
            <Button className="flex-1 cursor-pointer" onClick={() => { loadRandomList(); showToast("success", "Refreshed list"); }}>
              <RefreshCw className="mr-2" /> Refresh
            </Button>
            <Button className="cursor-pointer" onClick={() => { setRandomList([]); setTimeout(() => loadRandomList(), 60); }}>
              <Layers />
            </Button>
          </div>

          <Separator />

          <div className="space-y-2 max-h-[58vh] overflow-auto">
            {loadingRandom ? (
              <div className="py-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>
            ) : randomList.length === 0 ? (
              <div className="text-xs opacity-60">No breweries loaded.</div>
            ) : (
              <ul className="space-y-2">
                {randomList.map((r) => (
                  <li key={r.id} onClick={() => handleListPick(r)} className="p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{r.name}</div>
                        <div className="text-xs opacity-60">{r.city}, {r.state}</div>
                      </div>
                      <div className="text-xs opacity-60">{r.brewery_type ?? "—"}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Center: preview / details */}
        <section className={clsx("lg:col-span-6")}>
          <Card className={clsx("rounded-2xl overflow-hidden border", panelBg)}>
            <CardHeader className={clsx("p-4 flex items-start justify-between gap-4", isDark ? "bg-black/40 border-b border-zinc-800" : "bg-white/95 border-b border-zinc-200")}>
              <div>
                <div className="flex items-center gap-2">
                  <CardTitle className="text-xl md:text-2xl flex items-center gap-2">
                    <Glass /> {brewery?.name ?? "—"}
                  </CardTitle>
                </div>
                <div className="text-xs opacity-70 mt-1 flex items-center gap-3">
                  <div className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {brewery?.brewery_type ? brewery.brewery_type.charAt(0).toUpperCase() + brewery.brewery_type.slice(1) : "—"}</div>
                  <div className="flex items-center gap-1"><Clock className="w-4 h-4" /> {brewery?.updated_at ? new Date(brewery.updated_at).toLocaleString() : "—"}</div>
                </div>
              </div>

              <div className="flex gap-2 items-center">
                <Button variant="ghost" onClick={() => setShowRaw(s => !s)} className="cursor-pointer"><List /> {showRaw ? "Hide" : "Raw"}</Button>

               

                <Button variant="ghost" onClick={() => { downloadJSON(); }} className="cursor-pointer">
                  <Download />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              {loadingBrewery ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !brewery ? (
                <div className="py-12 text-center text-sm opacity-60">No brewery selected — search or pick a suggestion.</div>
              ) : (
                <div className="space-y-4">
                  {/* top cards: address + website + map toggle */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg border cursor-default">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MapPin />
                          <div>
                            <div className="text-xs opacity-60">Address</div>
                            <div className="font-medium">{fullAddress}</div>
                          </div>
                        </div>

                        <div className="text-xs opacity-60">{brewery.country ?? "—"}</div>
                      </div>

                      <div className="mt-3 text-sm">
                        <div className="flex items-center gap-2"><Phone className="w-4 h-4" /><span>{brewery.phone ?? "—"}</span></div>
                        <div className="mt-2 flex items-center gap-2"><Globe className="w-4 h-4" />{
                          brewery.website_url ? (
                            <a href={brewery.website_url} target="_blank" rel="noreferrer" className="underline break-all">{brewery.website_url}</a>
                          ) : "—"
                        }</div>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Map className="w-5 h-5" />
                        <div>
                          <div className="text-xs opacity-60">Map preview</div>
                          <div className="text-sm">{brewery.latitude && brewery.longitude ? `${brewery.latitude}, ${brewery.longitude}` : "Coordinates not available"}</div>
                        </div>
                      </div>

                      <div className="mt-3 h-40 rounded-md overflow-hidden border">
                        {osmEmbedSrc ? (
                          <iframe
                            title="map-preview"
                            src={osmEmbedSrc}
                            className="w-full h-full border-0"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs opacity-60">No coords</div>
                        )}
                      </div>

                      <div className="mt-3 flex gap-2">
                        <Button className="flex-1 cursor-pointer" onClick={() => openMaps()}><MapPin className="mr-2" /> Open full map</Button>
                        <Button variant="outline" className="cursor-pointer" onClick={() => { setImageOpen(true); }}><ExternalLink /></Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* website iframe & details */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2 p-3 rounded-lg border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2"><Globe /> <div className="text-sm font-medium">Website preview</div></div>
                        <div className="text-xs opacity-60">{brewery.website_url ? "Live" : "—"}</div>
                      </div>

                      <div className="mt-3 h-[42vh] md:h-64 rounded-md overflow-hidden border">
                        {websiteIframeSrc ? (
                          // sandbox for safety
                          <iframe
                            title="website-preview"
                            src={websiteIframeSrc}
                            className="w-full h-full border-0"
                            loading="lazy"
                            sandbox="allow-forms allow-same-origin allow-scripts allow-popups"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs opacity-60">No website available</div>
                        )}
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border">
                      <div className="flex items-center gap-2">
                        <Info />
                        <div>
                          <div className="text-xs opacity-60">Metadata</div>
                          <div className="text-sm font-medium mt-1">ID: {brewery.id}</div>
                        </div>
                      </div>

                      <div className="mt-3 text-sm space-y-2">
                        <div><span className="text-xs opacity-60">Created</span><div>{brewery.created_at ? new Date(brewery.created_at).toLocaleString() : "—"}</div></div>
                        <div><span className="text-xs opacity-60">Updated</span><div>{brewery.updated_at ? new Date(brewery.updated_at).toLocaleString() : "—"}</div></div>
                        <div><span className="text-xs opacity-60">Type</span><div>{brewery.brewery_type ?? "—"}</div></div>
                      </div>

                      <div className="mt-4 flex flex-col gap-2">
                        <motion.button
                          whileTap={{ scale: 0.98 }}
                          onClick={() => { copyJSON(); }}
                          className="inline-flex items-center gap-2 px-3 py-2 rounded-md border cursor-pointer"
                        >
                          {copiedJson ? <Check className="text-green-400" /> : <Copy />}
                          <span className="text-sm">{copiedJson ? "JSON copied" : "Copy JSON"}</span>
                        </motion.button>

                        <Button variant="outline" className="cursor-pointer" onClick={() => downloadJSON()}>
                          <Download className="mr-2" /> Download
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* full fields list */}
                  <Separator />
                  <div>
                    <div className="text-xs opacity-60 mb-2 flex items-center gap-2"><Layers /> Full fields</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                      {Object.keys(brewery || {}).map((k) => (
                        <div key={k} className="p-3 rounded-md border">
                          <div className="text-[11px] opacity-60">{k}</div>
                          <div className="font-medium mt-1 break-words">{typeof brewery[k] === "object" ? JSON.stringify(brewery[k]) : (brewery[k] ?? "—")}</div>
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
                  <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 320 }}>
                    {prettyJSON(rawResp)}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* Right: quick actions */}
        <aside className={clsx("lg:col-span-3 h-fit space-y-4 p-4 rounded-2xl border", panelBg)}>
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Quick Actions</div>
            <div className="text-xs opacity-60">Utilities</div>
          </div>

          <div className="mt-3 space-y-2">
            <Button variant="outline" className="w-full cursor-pointer" onClick={() => { if (brewery?.website_url) window.open(brewery.website_url, "_blank"); else showToast("info", "No website available"); }}>
              <ExternalLink className="mr-2" /> Visit Website
            </Button>

            <Button variant="outline" className="w-full cursor-pointer" onClick={() => openMaps()}>
              <MapPin className="mr-2" /> Open in Maps
            </Button>

            <Button variant="outline" className="w-full cursor-pointer" onClick={() => copyDetails()}>
              <Copy className="mr-2" /> Copy Details
            </Button>

            <Button variant="outline" className="w-full cursor-pointer" onClick={() => downloadJSON()}>
              <Download className="mr-2" /> Download JSON
            </Button>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Developer</div>
            <div className="text-xs opacity-60">Endpoint examples</div>
            <div className="mt-2 text-sm break-words">{lookupByIdUrl(brewery?.id ?? "[id]")}</div>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(lookupByIdUrl(brewery?.id ?? "")); showToast("success", "Endpoint copied"); }} className="cursor-pointer">Copy</Button>
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(prettyJSON(brewery || rawResp || {})); showToast("success", "JSON copied"); }} className="cursor-pointer">Copy JSON</Button>
            </div>
          </div>
        </aside>
      </main>

      {/* Image dialog (placeholder image) */}
      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{brewery?.name || "Image / Map"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "stretch", justifyContent: "stretch" }}>
            {/* Show map larger if coords exist, otherwise decorative */}
            {osmEmbedSrc ? (
              <iframe title="map-large" src={osmEmbedSrc} className="w-full h-full border-0" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
                <Glass className="w-24 h-24 opacity-80" />
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Map / placeholder</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setImageOpen(false)} className="cursor-pointer"><X /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mobile sheet for random list (Dialog used as sheet) */}
{/* Mobile sheet for random list (shadcn Sheet + ScrollArea) */}
<Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
  <SheetContent
    side="left"
    className={clsx("rounded-t-2xl p-0 m-0", isDark ? "bg-black/90" : "bg-white")}
  >
    <div className="p-4 border-b flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Menu />
        <div className="font-semibold">Breweries</div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          onClick={() => { loadRandomList(); showToast("success", "Refreshed"); }}
          className="cursor-pointer"
        >
          <RefreshCw />
        </Button>

        <Button variant="ghost" onClick={() => setMobileSidebarOpen(false)} className="cursor-pointer">
          <X />
        </Button>
      </div>
    </div>

    <div className="p-3">
      <ScrollArea style={{ maxHeight: "60vh" }} className="rounded-md overflow-y-auto">
        {loadingRandom ? (
          <div className="py-8 text-center"><Loader2 className="animate-spin mx-auto" /></div>
        ) : randomList.length === 0 ? (
          <div className="text-xs opacity-60 p-4">No breweries loaded.</div>
        ) : (
          <ul className="space-y-3">
            {randomList.map((r) => (
              <li
                key={r.id}
                onClick={() => handleListPick(r)}
                className="p-3 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{r.name}</div>
                    <div className="text-xs opacity-60">{r.city}, {r.state}</div>
                  </div>
                  <div className="text-xs opacity-60">{r.brewery_type ?? "—"}</div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </ScrollArea>
    </div>

    <SheetFooter className="p-3 border-t flex items-center justify-between">
      <div className="text-xs opacity-60">Showing up to 10 random breweries</div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => { loadRandomList(); showToast("success", "Refreshed"); }} className="cursor-pointer">
          <RefreshCw className="mr-2" /> Refresh
        </Button>
        <Button onClick={() => setMobileSidebarOpen(false)} className="cursor-pointer">Close</Button>
      </div>
    </SheetFooter>
  </SheetContent>
</Sheet>

    </div>
  );
}
