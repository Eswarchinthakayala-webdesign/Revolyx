// IDigBioPage.jsx
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
  Copy,
  Download,
  MapPin,
  Database,
  Tag,
  Calendar,
  Box,
  Eye,
  X,
  Info,
  Layers,
  Users
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
 * IDigBioPage
 *
 * Behavior:
 * - Search (v1) -> receive `idigbio:items` (summary objects)
 * - For sidebar/suggestions: fetch lightweight full records for top N items to extract names & thumbs
 * - When user clicks an item: fetch full record (v1 /records/{uuid}) and fetch its mediarecord[] URIs
 *
 * Notes:
 * - If provider `links.record` are HTTP and your page is HTTPS, or if the provider blocks CORS,
 *   you must use a proxy (vite dev proxy or express proxy). See previous messages for proxy examples.
 */

const API_SEARCH = "https://api.idigbio.org/v1/records"; // search
const API_RECORD_BASE = "https://api.idigbio.org/v1/records/"; // record by uuid
const API_MEDIARECORD_BASE = "https://api.idigbio.org/v1/mediarecord/"; // mediarecord by uuid

const DEFAULT_QUERY = "Panthera tigris";
const DEBOUNCE_MS = 360;
const SUMMARY_PREFETCH_LIMIT = 8; // how many items to prefetch full records for sidebar/suggestions

function prettyJSON(obj) {
  try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
}

function safeFirst(v, fallback = "—") {
  if (v == null) return fallback;
  if (Array.isArray(v)) return v.length ? v[0] : fallback;
  return String(v);
}

// small sleep util (optional)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default function IDigBioPage() {
  // theme
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // UI & data state
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResp, setSearchResp] = useState(null); // raw search response
  const [items, setItems] = useState([]); // list of summary items (idigbio:items)
  const [summaries, setSummaries] = useState({}); // uuid -> {name, country, date, thumb}
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [selectedSummary, setSelectedSummary] = useState(null); // original item selected
  const [fullRecord, setFullRecord] = useState(null); // full record JSON
  const [recordMedia, setRecordMedia] = useState([]); // array of resolved media URLs
  const [loadingRecord, setLoadingRecord] = useState(false);

  const [showRaw, setShowRaw] = useState(false);

  const [imageOpen, setImageOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState(null);

  // refs for debounce and aborts
  const searchTimerRef = useRef(null);
  const searchControllerRef = useRef(null);
  const summaryControllersRef = useRef({}); // map uuid -> controller for summary fetches
  const recordControllerRef = useRef(null);

  // ------------------ Helper extractors ------------------
  // Extract safely through nested objects using multiple path options
  function extractSafe(obj, ...paths) {
    if (!obj) return null;
    for (const p of paths) {
      const segs = Array.isArray(p) ? p : p.split(".");
      let cur = obj;
      let ok = true;
      for (const s of segs) {
        if (cur == null) { ok = false; break; }
        cur = cur[s];
      }
      if (ok && cur != null) return cur;
    }
    return null;
  }

  // Parse scientific name / title to display
  function nameFromRecord(rec) {
    // rec could be full record (idigbio:data.*) or a search item with nested data
    const dwc = extractSafe(rec, "idigbio:data", "data", "idigbio:data");
    const sc = extractSafe(dwc || rec, "dwc:scientificName", "dwc.scientificName", "scientificName", "data.dwc.scientificName");
    if (sc) return sc;
    // fallback: try genus + specific epithet
    const genus = extractSafe(dwc || rec, "dwc:genus", "dwc.genus", "genus");
    const specific = extractSafe(dwc || rec, "dwc:specificEpithet", "dwc.specificEpithet", "specificEpithet");
    if (genus && specific) return `${genus} ${specific}`;
    // fallback: uuid
    return extractSafe(rec, "idigbio:uuid", "uuid", "id") || "Record";
  }

  // Attempt to find a thumbnail from either the item or the full record
  function thumbFromRecord(rec) {
    // possible places: rec.data.media, rec["idigbio:links"].mediarecord (requires additional fetch), etc.
    // If rec includes a media object (rare in search), try it; otherwise we'll fetch mediarecord separately.
    const cand = extractSafe(rec, "data.media", "media", "associatedMedia", "data.images");
    if (Array.isArray(cand) && cand.length > 0) {
      // if items are strings or objects with url
      const first = cand[0];
      if (typeof first === "string") return first;
      return first.url || first.href || first.identifier || null;
    }
    // fallback null
    return null;
  }

  // ------------------ Network helpers ------------------
  function buildSearchUrl(q = "") {
    const url = new URL(API_SEARCH);
    if (q && q.trim()) url.searchParams.set("q", q.trim());
    url.searchParams.set("limit", "30");
    url.searchParams.set("start", "0");
    return url.toString();
  }

  // fetch search results
  async function doSearch(q) {
    if (!q || q.trim().length === 0) {
      setItems([]);
      setSearchResp(null);
      return;
    }

    setSearchLoading(true);
    setLoadingSuggest(true);
    setItems([]);
    setSearchResp(null);
    setSummaries({});

    // cancel previous search
    if (searchControllerRef.current) {
      try { searchControllerRef.current.abort(); } catch {}
    }
    searchControllerRef.current = new AbortController();
    const sig = searchControllerRef.current.signal;

    try {
      const url = buildSearchUrl(q);
      const res = await fetch(url, { signal: sig });
      if (!res.ok) {
        showToast("error", `Search failed (${res.status})`);
        setSearchLoading(false);
        setLoadingSuggest(false);
        return;
      }
      const json = await res.json();
      setSearchResp(json);

      // v1 uses "idigbio:items"
      const list = json["idigbio:items"] || json.items || [];
      setItems(Array.isArray(list) ? list : []);

      // Pre-fetch small summaries for top N items (to show names instead of UUIDs)
      const top = (Array.isArray(list) ? list.slice(0, SUMMARY_PREFETCH_LIMIT) : []);
      prefetchSummaries(top);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Search error", err);
        showToast("error", "Search failed");
      }
    } finally {
      setSearchLoading(false);
      setLoadingSuggest(false);
      searchControllerRef.current = null;
    }
  }

  // Prefetch full-record minimal summaries for list items (concurrent, limited)
  async function prefetchSummaries(itemArray = []) {
    if (!Array.isArray(itemArray) || itemArray.length === 0) return;
    const newSummaries = {};

    // Limit concurrency by sequential batches to avoid flooding the API
    for (const it of itemArray) {
      const uuid = extractSafe(it, "idigbio:uuid") || extractSafe(it, "uuid");
      if (!uuid) continue;

      // skip if already fetched
      if (summaries[uuid] || newSummaries[uuid]) continue;

      // build record url (prefer links.record if present)
      const recLink = extractSafe(it, "idigbio:links.record", "links.record");
      const recordUrl = recLink || `${API_RECORD_BASE}${uuid}`;

      // abort controller per summary fetch
      const c = new AbortController();
      summaryControllersRef.current[uuid] = c;
      try {
        const r = await fetch(recordUrl, { signal: c.signal });
        if (!r.ok) continue;
        const j = await r.json();
        // extract name, country, date, thumbnail
        const name = nameFromRecord(j) || nameFromRecord(it);
        const country = extractSafe(j, "idigbio:data.dwc:country", "idigbio:data.dwc.country", "idigbio:data.dwc.country", "data.dwc.country", "dwc:country") || extractSafe(it, "idigbio:data.dwc:country") || "";
        const date = extractSafe(j, "idigbio:data.dwc:eventDate", "idigbio:data.dwc.eventDate", "data.dwc.eventDate") || "";
        let thumb = thumbFromRecord(j) || thumbFromRecord(it);

        // if no thumb, attempt to fetch mediarecord to get accessURI
        const mediaLinks = extractSafe(j, "idigbio:links.mediarecord", "idigbio:links.mediarecord") || extractSafe(it, "idigbio:links.mediarecord");
        if ((!thumb || thumb === "") && Array.isArray(mediaLinks) && mediaLinks.length > 0) {
          try {
            // fetch first mediarecord
            const mrUrl = mediaLinks[0];
            const mr = await fetch(mrUrl);
            if (mr.ok) {
              const mrJson = await mr.json();
              // common fields: ac:accessURI or mediaUri or accessURI
              const access = extractSafe(mrJson, "ac:accessURI", "accessURI", "data.ac:accessURI", "data.accessURI", "mediaUri", "data.mediaUri");
              if (access) thumb = access;
            }
          } catch (e) { /* ignore */ }
        }

        newSummaries[uuid] = { name, country, date, thumb, uuid };
      } catch (err) {
        // ignore summary fetch errors (rare)
      } finally {
        try { delete summaryControllersRef.current[uuid]; } catch {}
      }
      // small pause to be polite (optional)
      await sleep(40);
    }

    // merge
    setSummaries((s) => ({ ...s, ...newSummaries }));
  }

  // Fetch full record when user selects an item
  async function loadFullRecordForItem(item) {
    if (!item) return;
    setSelectedSummary(item);
    setFullRecord(null);
    setRecordMedia([]);
    setShowRaw(false);
    setLoadingRecord(true);

    // cancel prior record fetch
    if (recordControllerRef.current) {
      try { recordControllerRef.current.abort(); } catch {}
    }
    recordControllerRef.current = new AbortController();
    const sig = recordControllerRef.current.signal;

    // determine record url
    const uuid = extractSafe(item, "idigbio:uuid") || extractSafe(item, "uuid");
    const recLink = extractSafe(item, "idigbio:links.record", "links.record");
    const recordUrl = recLink || (uuid ? `${API_RECORD_BASE}${uuid}` : null);

    if (!recordUrl) {
      showToast("error", "Cannot determine record URL");
      setLoadingRecord(false);
      return;
    }

    try {
      const r = await fetch(recordUrl, { signal: sig });
      if (!r.ok) {
        showToast("error", `Failed to load record (${r.status})`);
        setLoadingRecord(false);
        return;
      }
      const j = await r.json();
      setFullRecord(j);

      // Resolve media URLs by fetching each mediarecord link if present
      setRecordMedia([]); // clear first
      const mediaLinks = extractSafe(j, "idigbio:links.mediarecord", "idigbio:links.mediarecord") || extractSafe(j, "idigbio:links.mediarecord") || extractSafe(j, "links.mediarecord");
      // mediaLinks could be array of URLs or single url
      const mediaUrls = Array.isArray(mediaLinks) ? mediaLinks : (mediaLinks ? [mediaLinks] : []);
      const resolved = [];

      // fetch each mediarecord sequentially (limited)
      for (const mlink of mediaUrls.slice(0, 12)) {
        try {
          const mr = await fetch(mlink);
          if (!mr.ok) continue;
          const mrj = await mr.json();
          // many mediarecord objects contain ac:accessURI or data.ac:accessURI or media resource fields
          const access = extractSafe(mrj, "ac:accessURI", "data.ac:accessURI", "accessURI", "data.accessURI", "mediaUri", "identifier", "url");
          if (access) {
            resolved.push(access);
            continue;
          }
          // try nested media array
          const mediaArr = extractSafe(mrj, "media", "data.media", "associatedMedia");
          if (Array.isArray(mediaArr) && mediaArr.length > 0) {
            const first = mediaArr[0];
            if (typeof first === "string") resolved.push(first);
            else if (first.url || first.href) resolved.push(first.url || first.href);
          }
        } catch (err) {
          // ignore media fetch error
        }
      }

      setRecordMedia(resolved);
    } catch (err) {
      console.error("loadFullRecord error", err);
      showToast("error", "Failed to fetch full record (possible CORS/proxy issue).");
    } finally {
      setLoadingRecord(false);
      recordControllerRef.current = null;
    }
  }

  // ------------------ interactions ------------------
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    searchTimerRef.current = setTimeout(() => {
      doSearch(v);
    }, DEBOUNCE_MS);
  }

  async function onSubmit(e) {
    e?.preventDefault?.();
    if (!query || query.trim().length === 0) {
      showToast("info", "Please enter a taxon, locality, or specimen id.");
      return;
    }
    await doSearch(query);
    setShowSuggest(false);
  }

  function openImage(src) {
    if (!src) return showToast("info", "No image available");
    setImageSrc(src);
    setImageOpen(true);
  }

  function copyPayload() {
    const payload = fullRecord || selectedSummary || searchResp;
    if (!payload) return showToast("info", "Nothing to copy");
    navigator.clipboard.writeText(prettyJSON(payload));
    showToast("success", "Copied JSON to clipboard");
  }

  function downloadPayload() {
    const payload = fullRecord || selectedSummary || searchResp || {};
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    const uuid = extractSafe(selectedSummary, "idigbio:uuid") || extractSafe(fullRecord, "idigbio:uuid") || "idigbio";
    a.href = URL.createObjectURL(blob);
    a.download = `idigbio_${String(uuid).slice(0, 12)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  // lifecycle: initial search
  useEffect(() => {
    doSearch(DEFAULT_QUERY);

    return () => {
      if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
      if (searchControllerRef.current) try { searchControllerRef.current.abort(); } catch {}
      // abort any summary fetches
      for (const k in summaryControllersRef.current) {
        try { summaryControllersRef.current[k].abort(); } catch {}
      }
      if (recordControllerRef.current) try { recordControllerRef.current.abort(); } catch {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const itemList = useMemo(() => items || [], [items]);
  const summaryMap = useMemo(() => summaries || {}, [summaries]);

  // helper to build OSM link if coordinates found inside fullRecord
  function osmLinkFromFull(rec) {
    if (!rec) return null;
    const lat = extractSafe(rec, "idigbio:data.dwc:decimalLatitude", "data.dwc.decimalLatitude", "dwc:decimalLatitude", "data.decimalLatitude", "decimalLatitude");
    const lon = extractSafe(rec, "idigbio:data.dwc:decimalLongitude", "data.dwc.decimalLongitude", "dwc:decimalLongitude", "data.decimalLongitude", "decimalLongitude");
    if (!lat || !lon) return null;
    return `https://www.openstreetmap.org/?mlat=${encodeURIComponent(lat)}&mlon=${encodeURIComponent(lon)}#map=12/${encodeURIComponent(lat)}/${encodeURIComponent(lon)}`;
  }

  // ------------------ Render ------------------
  return (
    <div className={clsx("min-h-screen p-5 max-w-8xl mx-auto", isDark ? "bg-black text-zinc-100" : "bg-white text-zinc-900")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">SpecimenVault — iDigBio</h1>
          <p className="mt-1 text-sm opacity-70">Search museum specimen records and view rich Darwin Core metadata. Click a result to load the full record.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={onSubmit} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-3 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search by taxon, locality, collector, or specimen id (e.g. Panthera tigris)"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
              aria-label="Search iDigBio"
            />
            <Button type="button" variant="outline" onClick={() => doSearch(DEFAULT_QUERY)}>Default</Button>
            <Button type="submit" variant="outline" className="px-3"><Search /></Button>
          </form>
        </div>
      </header>

      {/* Suggestion dropdown */}
      <AnimatePresence>
        {showSuggest && itemList && itemList.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={clsx("absolute z-50 left-4 right-4 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {itemList.slice(0, 12).map((it, idx) => {
              const uuid = extractSafe(it, "idigbio:uuid") || extractSafe(it, "uuid") || `rec-${idx}`;
              const s = summaryMap[uuid];
              const title = s?.name || nameFromRecord(it) || uuid;
              const country = s?.country || extractSafe(it, "idigbio:data.dwc:country") || "";
              const date = s?.date || extractSafe(it, "idigbio:dateModified") || "";
              const thumb = s?.thumb || null;
              return (
                <li key={idx} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => { loadFullRecordForItem(it); setShowSuggest(false); }}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-md bg-zinc-100 flex items-center justify-center overflow-hidden">
                      {thumb ? <img src={thumb} alt={title} className="w-full h-full object-cover" /> : <ImageIcon className="opacity-60" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{title}</div>
                      <div className="text-xs opacity-60">{country} {country && date ? "•" : ""} {date}</div>
                    </div>
                    <div className="text-xs opacity-60">{safeFirst(extractSafe(it, "idigbio:version"), "")}</div>
                  </div>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: results list */}
        <aside className="lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 opacity-80" />
                  <CardTitle className="text-sm">Results</CardTitle>
                </div>
                <div className="text-xs opacity-60">{searchResp ? `${safeFirst(searchResp["idigbio:itemCount"], 0)} matches` : "—"}</div>
              </div>
              <div className="text-xs opacity-60 mt-1">Showing top results — click to view full record</div>
            </CardHeader>

            <CardContent>
              <ScrollArea style={{ maxHeight: 520 }}>
                <div className="space-y-2">
                  {itemList && itemList.length > 0 ? itemList.map((it, idx) => {
                    const uuid = extractSafe(it, "idigbio:uuid") || `rec-${idx}`;
                    const s = summaryMap[uuid];
                    const title = s?.name || nameFromRecord(it) || uuid;
                    const date = s?.date || extractSafe(it, "idigbio:dateModified") || "";
                    const thumb = s?.thumb;
                    return (
                      <button
                        key={uuid}
                        onClick={() => loadFullRecordForItem(it)}
                        className={clsx("w-full text-left p-3 rounded-md border flex items-center gap-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/40")}
                      >
                        <div className="w-12 h-12 overflow-hidden rounded-md bg-zinc-100 flex items-center justify-center">
                          {thumb ? <img src={thumb} alt={title} className="w-full h-full object-cover" /> : <ImageIcon className="opacity-60" />}
                        </div>

                        <div className="flex-1">
                          <div className="font-medium text-sm">{title}</div>
                          <div className="text-xs opacity-60">{extractSafe(it, "idigbio:data.dwc:country") || ""} {date ? `• ${date}` : ""}</div>
                        </div>

                        <div className="text-xs opacity-60">{safeFirst(extractSafe(it, "idigbio:version"), "-")}</div>
                      </button>
                    );
                  }) : (
                    <div className="p-3 text-sm opacity-60">No results. Try searching for a taxon or locality.</div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </aside>

        {/* Center: full detail */}
        <section className="lg:col-span-6">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-6 flex items-start justify-between gap-4", isDark ? "bg-black/40 border-b border-zinc-800" : "bg-white/95 border-b border-zinc-200")}>
              <div className="flex items-start gap-4">
                <div className="w-28 h-28 rounded-lg overflow-hidden bg-zinc-900/10 border flex items-center justify-center">
                  {recordMedia && recordMedia.length > 0 ? (
                    <img src={recordMedia[0]} alt="media" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = ""; }} />
                  ) : (
                    <ImageIcon />
                  )}
                </div>

                <div>
                  <h2 className="text-2xl font-extrabold">{selectedSummary ? (nameFromRecord(fullRecord || selectedSummary) || nameFromRecord(selectedSummary)) : "Select a record"}</h2>
                  <div className="text-xs opacity-60 mt-1">{extractSafe(fullRecord, "idigbio:data.dwc:family", "idigbio:data.dwc:genus", "data.dwc.family") || ""}</div>
                  <div className="mt-3 text-sm opacity-70">{extractSafe(fullRecord, "idigbio:data.dwc:verbatimLocality", "idigbio:data.dwc.locality", "data.dwc.locality") || "Locality not available"}</div>
                </div>
              </div>

              <div className="flex flex-col gap-2 items-end">
                <div className="text-xs opacity-60">UUID</div>
                <div className="text-sm font-medium">{extractSafe(fullRecord, "idigbio:uuid") || extractSafe(selectedSummary, "idigbio:uuid") || "—"}</div>
                <div className="mt-3 text-xs opacity-60">{extractSafe(fullRecord, "idigbio:dateModified") || extractSafe(selectedSummary, "idigbio:dateModified") || ""}</div>
                <div className="mt-3">
                  <Button variant="outline" onClick={() => { const src = recordMedia[0]; openImage(src); }}><Eye /> View</Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {loadingRecord ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !fullRecord ? (
                <div className="py-12 text-center text-sm opacity-60">Select a result to load the full record.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left column: occurrence / location / collection */}
                  <div className="space-y-3">
                    <div className="rounded-xl p-4 border">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 opacity-70" />
                        <div className="text-xs font-medium opacity-80">Occurrence</div>
                      </div>
                      <div className="mt-2 text-sm">
                        <div><span className="opacity-60 text-xs">Event Date</span><div className="font-medium">{extractSafe(fullRecord, "idigbio:data.dwc:eventDate", "idigbio:data.dwc:verbatimEventDate", "data.dwc.eventDate") || "—"}</div></div>
                        <div className="mt-2"><span className="opacity-60 text-xs">Basis</span><div className="font-medium">{extractSafe(fullRecord, "idigbio:data.dwc:basisOfRecord") || "—"}</div></div>
                        <div className="mt-2"><span className="opacity-60 text-xs">Locality</span><div className="font-medium">{extractSafe(fullRecord, "idigbio:data.dwc:verbatimLocality", "idigbio:data.dwc:locality") || "—"}</div></div>
                      </div>
                    </div>

                    <div className="rounded-xl p-4 border">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 opacity-70" />
                        <div className="text-xs font-medium opacity-80">Location</div>
                      </div>
                      <div className="mt-2 text-sm">
                        <div><span className="opacity-60 text-xs">Country</span><div className="font-medium">{extractSafe(fullRecord, "idigbio:data.dwc:country") || "—"}</div></div>
                        <div className="mt-2"><span className="opacity-60 text-xs">State / Province</span><div className="font-medium">{extractSafe(fullRecord, "idigbio:data.dwc:stateProvince", "idigbio:data.dwc:county") || "—"}</div></div>
                        <div className="mt-2"><span className="opacity-60 text-xs">Coordinates</span><div className="font-medium">{`${extractSafe(fullRecord, "idigbio:data.dwc:decimalLatitude") || "—"} • ${extractSafe(fullRecord, "idigbio:data.dwc:decimalLongitude") || "—"}`}</div></div>
                        <div className="mt-3">
                          {osmLinkFromFull(fullRecord) ? (
                            <a className="text-xs underline" href={osmLinkFromFull(fullRecord)} target="_blank" rel="noreferrer"><MapPin className="inline-block w-3 h-3 mr-1" /> View on map</a>
                          ) : <div className="text-xs opacity-60">No coordinates</div>}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl p-4 border">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 opacity-70" />
                        <div className="text-xs font-medium opacity-80">Collection</div>
                      </div>
                      <div className="mt-2 text-sm">
                        <div><span className="opacity-60 text-xs">Institution</span><div className="font-medium">{extractSafe(fullRecord, "idigbio:data.dwc:institutionCode") || "—"}</div></div>
                        <div className="mt-2"><span className="opacity-60 text-xs">Collection</span><div className="font-medium">{extractSafe(fullRecord, "idigbio:data.dwc:collectionCode") || "—"}</div></div>
                        <div className="mt-2"><span className="opacity-60 text-xs">Catalog #</span><div className="font-medium">{extractSafe(fullRecord, "idigbio:data.dwc:catalogNumber") || "—"}</div></div>
                      </div>
                    </div>
                  </div>

                  {/* Right column: taxonomy / identifications / media / raw */}
                  <div className="space-y-3">
                    <div className="rounded-xl p-4 border">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 opacity-70" />
                        <div className="text-xs font-medium opacity-80">Taxonomy</div>
                      </div>
                      <div className="mt-2 text-sm">
                        <div><span className="opacity-60 text-xs">Scientific name</span><div className="font-medium">{extractSafe(fullRecord, "idigbio:data.dwc:scientificName") || "—"}</div></div>
                        <div className="mt-2"><span className="opacity-60 text-xs">Family</span><div className="font-medium">{extractSafe(fullRecord, "idigbio:data.dwc:family") || "—"}</div></div>
                        <div className="mt-2"><span className="opacity-60 text-xs">Rank</span><div className="font-medium">{extractSafe(fullRecord, "idigbio:data.dwc:taxonRank") || "—"}</div></div>
                      </div>
                    </div>

                    <div className="rounded-xl p-4 border">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 opacity-70" />
                        <div className="text-xs font-medium opacity-80">Identifications</div>
                      </div>
                      <div className="mt-2 text-sm space-y-2">
                        {Array.isArray(extractSafe(fullRecord, "idigbio:data.dwc:Identification")) ? (
                          extractSafe(fullRecord, "idigbio:data.dwc:Identification").map((idObj, i) => (
                            <div key={i} className="p-2 rounded-md bg-zinc-50 dark:bg-zinc-900/20">
                              <div className="text-xs opacity-60">Scientific name</div>
                              <div className="font-medium">{idObj["dwc:scientificName"] || idObj["dwc:scientificName"] || "—"}</div>
                              <div className="text-xs opacity-60 mt-1">Remarks: {idObj["dwc:identificationRemarks"] || "—"}</div>
                            </div>
                          ))
                        ) : (
                          <div className="text-xs opacity-60">No identification entries</div>
                        )}
                      </div>
                    </div>

                    <div className="rounded-xl p-4 border">
                      <div className="flex items-center gap-2">
                        <ImageIcon className="w-4 h-4 opacity-70" />
                        <div className="text-xs font-medium opacity-80">Media</div>
                      </div>

                      <div className="mt-2 grid grid-cols-3 gap-2">
                        {recordMedia && recordMedia.length > 0 ? recordMedia.map((m, i) => (
                          <button key={i} onClick={() => openImage(m)} className="w-full h-20 overflow-hidden rounded-md bg-zinc-100 border flex items-center justify-center">
                            {m ? <img src={m} alt={`media-${i}`} className="w-full h-full object-cover" /> : <ImageIcon />}
                          </button>
                        )) : (
                          <div className="text-xs opacity-60">No media available</div>
                        )}
                      </div>
                    </div>

                    <AnimatePresence>
                      {showRaw && fullRecord && (
                        <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="rounded-xl p-4 border">
                          <div className="flex items-center justify-between">
                            <div className="text-sm opacity-70">Raw JSON</div>
                            <div className="text-xs opacity-60">Response</div>
                          </div>
                          <div className="mt-3 text-xs overflow-auto" style={{ maxHeight: 300 }}>
                            <pre className="whitespace-pre-wrap text-xs">{prettyJSON(fullRecord)}</pre>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right: actions */}
        <aside className={clsx("lg:col-span-3 space-y-4", isDark ? "bg-black/30 border border-zinc-800 p-4 rounded-2xl" : "bg-white/90 border border-zinc-200 p-4 rounded-2xl")}>
          <div>
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold">Quick actions</div>
              <div className="text-xs opacity-60">Tools</div>
            </div>

            <div className="mt-3 space-y-2">
              <Button variant="outline" onClick={() => { navigator.clipboard.writeText(buildSearchUrl(query)); showToast("success", "Search endpoint copied"); }}><Copy /> Copy endpoint</Button>
              <Button variant="outline" onClick={() => downloadPayload()}><Download /> Download JSON</Button>
              <Button variant="outline" onClick={() => setShowRaw(s => !s)}><List /> Toggle Raw</Button>
              <Button variant="outline" onClick={() => {
                const recLink = extractSafe(selectedSummary, "idigbio:links.record", "links.record") || (extractSafe(fullRecord, "idigbio:links.record") || null);
                if (recLink) window.open(recLink, "_blank");
                else showToast("info", "No provider record link available");
              }}><ExternalLink /> Open provider record</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">About this dataset</div>
            <div className="text-xs opacity-60">iDigBio aggregates specimen data from museums and collections. This viewer shows Darwin Core metadata, identifications, and media. If you encounter CORS errors when fetching provider record or media endpoints, use a dev proxy (vite or express).</div>
          </div>
        </aside>
      </main>

      {/* Image modal */}
      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className={clsx("max-w-4xl w-full p-0 rounded-2xl overflow-hidden")}>
          <DialogHeader>
            <DialogTitle>Media viewer</DialogTitle>
          </DialogHeader>

          <div style={{ height: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {imageSrc ? <img src={imageSrc} alt="media" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} /> : <div className="h-full flex items-center justify-center">No image</div>}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Media from provider record</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setImageOpen(false)}><X /></Button>
              <Button variant="outline" onClick={() => { if (imageSrc) window.open(imageSrc, "_blank"); }}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
