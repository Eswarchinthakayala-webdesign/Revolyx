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
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/**
 * OpenBreweryPage
 * - Uses Open Brewery DB (no API key)
 * - Suggestions: /breweries/autocomplete?query=
 * - Search / details: /breweries/{id} or /breweries?by_name=...
 *
 * Drop this file into your pages or components folder.
 * Requires: lucide-react, framer-motion, Tailwind + your ui components (Button/Input/Card/Dialog/Separator).
 */

const API_BASE = "https://api.openbrewerydb.org/v1";
const DEFAULT_QUERY = "dog"; // a common brewery substring — will load a default list / first result
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

  const suggestTimer = useRef(null);
  const latestSuggestAbort = useRef(null);

  // build endpoints
  const autocompleteUrl = (q) => `${API_BASE}/breweries/autocomplete?query=${encodeURIComponent(q)}`;
  const searchByNameUrl = (q) => `${API_BASE}/breweries?by_name=${encodeURIComponent(q)}`; // returns array
  const lookupByIdUrl = (id) => `${API_BASE}/breweries/${encodeURIComponent(id)}`;

  // --- fetch helpers
  async function fetchSuggestions(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    // debounce handled by caller; use AbortController to cancel stale requests
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
      const json = await res.json(); // array of { id, name, brewery_type }
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
        // choose the first item
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

  // initial load
  useEffect(() => {
    // load a default brewery by performing a search
    fetchFirstByName(DEFAULT_QUERY);
    // cleanup on unmount
    return () => {
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
      if (latestSuggestAbort.current) latestSuggestAbort.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- interactions
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
    // Autocomplete items: { id, name, brewery_type }
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
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`, "_blank");
    } else {
      showToast("info", "Coordinates not available for this brewery.");
    }
  }

  function copyDetails() {
    if (!brewery) return showToast("info", "No brewery loaded.");
    const text = `${brewery.name}\n${brewery.street ?? ""}\n${brewery.city ?? ""}, ${brewery.state ?? ""} ${brewery.postal_code ?? ""}\n${brewery.phone ?? ""}\n${brewery.website_url ?? ""}`;
    navigator.clipboard.writeText(text);
    showToast("success", "Brewery details copied.");
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

  const mapPreviewSrc = useMemo(() => {
    // Simple static Google Maps preview (no API key) — note: may be blocked in some environments
    if (!brewery?.latitude || !brewery?.longitude) return null;
    const lat = brewery.latitude;
    const lon = brewery.longitude;
    // Using Google static maps without key may produce a blocked image; show placeholder instead if needed
    return `https://maps.google.com/maps?q=${lat},${lon}&z=15&output=embed`;
  }, [brewery]);

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto", isDark ? "bg-black text-zinc-100" : "bg-white text-zinc-900")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>BrewFinder — Open Brewery DB</h1>
          <p className="mt-1 text-sm opacity-70">Search breweries, view full details, open maps and developer tools.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
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
            <Button type="submit" variant="outline" className="px-3"><Search /></Button>
          </form>
        </div>
      </header>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
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

      {/* Layout: left (meta), center (main), right (quick actions) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: compact meta */}
        <aside className={clsx("lg:col-span-3 space-y-4", isDark ? "bg-black/30 border border-zinc-800 p-4 rounded-2xl" : "bg-white/90 border border-zinc-200 p-4 rounded-2xl")}>
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
              <Glass className="w-8 h-8 opacity-80" />
            </div>
            <div>
              <div className="text-xs opacity-60">Brewery</div>
              <div className="text-lg font-semibold">{brewery?.name ?? "—"}</div>
              <div className="text-xs opacity-60 mt-1">{brewery?.brewery_type ? brewery.brewery_type.toUpperCase() : "—"}</div>
            </div>
          </div>

          <Separator />

          <div className="text-sm">
            <div className="text-xs opacity-60">Address</div>
            <div className="font-medium mt-1">{fullAddress}</div>

            <div className="mt-3 text-xs opacity-60">Contact</div>
            <div className="mt-1 text-sm space-y-1">
              <div className="flex items-center gap-2"><Phone className="w-4 h-4 opacity-70" /><span>{brewery?.phone ?? "—"}</span></div>
              <div className="flex items-center gap-2"><Globe className="w-4 h-4 opacity-70" />{brewery?.website_url ? (<a href={brewery.website_url} target="_blank" rel="noreferrer" className="underline">{brewery.website_url}</a>) : "—"}</div>
            </div>

            <div className="mt-3 text-xs opacity-60">Coordinates</div>
            <div className="mt-1 text-sm">{brewery?.latitude && brewery?.longitude ? `${brewery.latitude}, ${brewery.longitude}` : "—"}</div>
          </div>

          <Separator />

          <div>
            <div className="text-xs opacity-60">Metadata</div>
            <div className="mt-2 text-sm opacity-70">
              <div><span className="opacity-60 text-[11px]">Updated</span><div className="text-sm">{brewery?.updated_at ? new Date(brewery.updated_at).toLocaleString() : "—"}</div></div>
              <div className="mt-2"><span className="opacity-60 text-[11px]">Created</span><div className="text-sm">{brewery?.created_at ? new Date(brewery.created_at).toLocaleString() : "—"}</div></div>
            </div>
          </div>
        </aside>

        {/* Center: full brewery details */}
        <section className={clsx("lg:col-span-6")}>
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-6 flex items-start justify-between gap-4", isDark ? "bg-black/40 border-b border-zinc-800" : "bg-white/95 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-2xl">{brewery?.name ?? "—"}</CardTitle>
                <div className="text-xs opacity-60 mt-1">{brewery?.brewery_type ? brewery.brewery_type.charAt(0).toUpperCase() + brewery.brewery_type.slice(1) : "—"}</div>
              </div>

              <div className="flex gap-2 items-center">
                <Button variant="ghost" onClick={() => setShowRaw(s => !s)}><List /> {showRaw ? "Hide" : "Raw"}</Button>
                <Button variant="ghost" onClick={() => imageOpen ? setImageOpen(false) : setImageOpen(true)}><ExternalLink /></Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {loadingBrewery ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !brewery ? (
                <div className="py-12 text-center text-sm opacity-60">No brewery selected — search or pick a suggestion.</div>
              ) : (
                <div className="space-y-6">
                  {/* description / details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs opacity-60">Full Address</div>
                      <div className="mt-1 text-sm font-medium">{fullAddress}</div>

                      <div className="mt-4 text-xs opacity-60">Type</div>
                      <div className="mt-1 text-sm">{brewery.brewery_type ?? "—"}</div>

                      <div className="mt-4 text-xs opacity-60">Phone</div>
                      <div className="mt-1 text-sm">{brewery.phone ?? "—"}</div>

                      <div className="mt-4 text-xs opacity-60">Website</div>
                      <div className="mt-1 text-sm">
                        {brewery.website_url ? <a href={brewery.website_url} target="_blank" rel="noreferrer" className="underline">{brewery.website_url}</a> : "—"}
                      </div>
                    </div>

                    <div>
                      <div className="text-xs opacity-60">Coordinates</div>
                      <div className="mt-1 text-sm">{brewery.latitude && brewery.longitude ? `${brewery.latitude}, ${brewery.longitude}` : "—"}</div>

                      <div className="mt-4 text-xs opacity-60">Region</div>
                      <div className="mt-1 text-sm">{brewery.city ? `${brewery.city}, ${brewery.state}` : "—"}</div>

                      <div className="mt-4 text-xs opacity-60">Postal / Country</div>
                      <div className="mt-1 text-sm">{brewery.postal_code ?? brewery.country ?? "—"}</div>
                    </div>
                  </div>

                  <Separator />

                  {/* extra fields rendered dynamically */}
                  <div>
                    <div className="text-xs opacity-60 mb-2">Full fields</div>
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
        <aside className={clsx("lg:col-span-3 space-y-4", isDark ? "bg-black/30 border border-zinc-800 p-4 rounded-2xl" : "bg-white/90 border border-zinc-200 p-4 rounded-2xl")}>
          <div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Quick Actions</div>
              <div className="text-xs opacity-60">Utilities</div>
            </div>

            <div className="mt-3 space-y-2">
              <Button className="w-full" onClick={() => { if (brewery?.website_url) window.open(brewery.website_url, "_blank"); else showToast("info", "No website available"); }}>
                <ExternalLink className="mr-2" /> Visit Website
              </Button>

              <Button className="w-full" onClick={() => openMaps()}>
                <MapPin className="mr-2" /> Open in Maps
              </Button>

              <Button className="w-full" onClick={() => copyDetails()}>
                <Copy className="mr-2" /> Copy Details
              </Button>

              <Button className="w-full" onClick={() => downloadJSON()}>
                <Download className="mr-2" /> Download JSON
              </Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Developer</div>
            <div className="text-xs opacity-60">Endpoint examples</div>
            <div className="mt-2 text-sm break-words">{lookupByIdUrl(brewery?.id ?? "[id]")}</div>
            <div className="mt-3 flex gap-2">
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(lookupByIdUrl(brewery?.id ?? "")); showToast("success", "Endpoint copied"); }}>Copy</Button>
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(prettyJSON(brewery || rawResp || {})); showToast("success", "JSON copied"); }}>Copy JSON</Button>
            </div>
          </div>
        </aside>
      </main>

      {/* Image dialog (placeholder image) */}
      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{brewery?.name || "Image"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {/* Open Brewery DB has no images; show a decorative placeholder */}
            <div className="w-full h-full flex items-center justify-center bg-zinc-100 dark:bg-zinc-900">
              <Glass className="w-24 h-24 opacity-80" />
            </div>
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Decorative placeholder</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setImageOpen(false)}><X /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
