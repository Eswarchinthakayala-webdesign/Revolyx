// src/pages/GbifSpeciesProPage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  ExternalLink,
  Copy,
  Download,
  Loader2,
  ImageIcon,
  List,
  MapPin,
  BookOpen,
  Globe,
  Layers,
  Calendar,
  Hash,
   Database as LayersStack,
  Database
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { showToast } from "../lib/ToastHelper";
import { useTheme } from "@/components/theme-provider";

/**
 * GbifSpeciesProPage.jsx
 * Professional GBIF Species explorer page inspired by NewsApiPage.
 *
 * Features:
 * - Left / Center / Right responsive layout (mobile stacks)
 * - Search with debounced suggestions
 * - Intelligent parsing of GBIF species response
 * - Default sample response shown on first load (provided by user)
 * - Quick actions: open GBIF page, occurrences, copy JSON, download JSON
 * - Dark / Light theme parity (black / white surfaces like NewsApiPage)
 *
 * Notes:
 * - Uses lucide-react icons
 * - Uses your project's shadcn-like UI components
 * - No localStorage/favorites
 * - When selecting a suggestion that contains `key`, component fetches the full detail
 */

/* ---------- Constants & sample default ---------- */
const BASE = "https://api.gbif.org/v1/species";
const SAMPLE_DEFAULT = {
  key: 8,
  nubKey: 8,
  nameKey: 130323256,
  taxonID: "gbif:8",
  sourceTaxonKey: 170809368,
  kingdom: "Viruses",
  kingdomKey: 8,
  datasetKey: "d7dddbf4-2cf0-4f39-9b2a-bb099caae36c",
  constituentKey: "d7dddbf4-2cf0-4f39-9b2a-bb099caae36c",
  scientificName: "Viruses",
  canonicalName: "Viruses",
  vernacularName: "Viruses",
  authorship: "",
  nameType: "SCIENTIFIC",
  rank: "KINGDOM",
  origin: "SOURCE",
  taxonomicStatus: "ACCEPTED",
  nomenclaturalStatus: [],
  remarks: "",
  numDescendants: 19564,
  lastCrawled: "2023-08-22T23:20:59.545+00:00",
  lastInterpreted: "2023-08-22T23:18:56.817+00:00",
  issues: []
};

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function formatDateISO(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso || "—";
  }
}

export default function GbifSpeciesProPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // UI state
  const [query, setQuery] = useState("Viruses");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [selected, setSelected] = useState(SAMPLE_DEFAULT); // currently selected summary item
  const [detail, setDetail] = useState(SAMPLE_DEFAULT); // detailed species (fetched when possible)
  const [rawResp, setRawResp] = useState(SAMPLE_DEFAULT);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const debounceRef = useRef(null);

  useEffect(() => {
    // show the sample default initially (user-provided sample)
    setSelected(SAMPLE_DEFAULT);
    setDetail(SAMPLE_DEFAULT);
    setRawResp(SAMPLE_DEFAULT);
  }, []);

  /* ---------- API calls ---------- */
  async function searchSpecies(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);
    try {
      const url = `${BASE}?q=${encodeURIComponent(q)}&limit=12`;
      const res = await fetch(url);
      if (!res.ok) {
        showToast("error", `Search failed (${res.status})`);
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      const json = await res.json();
      const items = json.results || [];
      setSuggestions(items);
      setRawResp(json);
      // optionally set a preview selection
      if (items && items.length > 0) {
        setSelected(items[0]);
        // if the item has a key fetch full detail
        if (items[0].key) fetchSpeciesDetail(items[0].key);
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Search failed");
      setSuggestions([]);
    } finally {
      setLoadingSuggest(false);
    }
  }

  async function fetchSpeciesDetail(key) {
    if (!key) return;
    setLoadingDetail(true);
    try {
      const url = `${BASE}/${key}`;
      const res = await fetch(url);
      if (!res.ok) {
        showToast("error", `Detail fetch failed (${res.status})`);
        setDetail(null);
        return;
      }
      const json = await res.json();
      setDetail(json);
      setRawResp(json);
    } catch (err) {
      console.error(err);
      showToast("error", "Detail fetch failed");
      setDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  }

  /* ---------- Handlers ---------- */
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      searchSpecies(v);
    }, 350);
  }

  function onSubmitSearch(e) {
    e?.preventDefault?.();
    searchSpecies(query);
    setShowSuggest(true);
  }

  function selectSuggestion(item) {
    setSelected(item);
    setShowSuggest(false);
    if (item.key) fetchSpeciesDetail(item.key);
    else {
      setDetail(item);
      setRawResp(item);
    }
  }

  function openGbif(key) {
    if (!key) return showToast("info", "No GBIF key available");
    window.open(`https://www.gbif.org/species/${key}`, "_blank");
  }

  function openOccurrences(key) {
    if (!key) return showToast("info", "No GBIF key available");
    window.open(`https://www.gbif.org/occurrence/search?taxon_key=${key}`, "_blank");
  }

  function copyJSON() {
    const payload = detail || selected || rawResp;
    if (!payload) return showToast("info", "Nothing to copy");
    navigator.clipboard.writeText(prettyJSON(payload));
    showToast("success", "Copied JSON to clipboard");
  }

  function downloadJSON() {
    const payload = detail || selected || rawResp;
    if (!payload) return showToast("info", "Nothing to download");
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    const name = (payload.canonicalName || payload.scientificName || "gbif").replace(/\s+/g, "_");
    a.href = URL.createObjectURL(blob);
    a.download = `gbif_${name}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Download started");
  }

  /* ---------- Derived helpers ---------- */
  function primaryTitle(obj) {
    if (!obj) return "No selection";
    return obj.canonicalName || obj.scientificName || obj.vernacularName || `key:${obj.key}`;
  }

  function classificationList(d) {
    if (!d) return [];
    // prefer returned classification array if present
    if (Array.isArray(d.classification) && d.classification.length > 0) {
      return d.classification;
    }
    // otherwise assemble canonical fields
    const order = ["kingdom", "phylum", "class", "order", "family", "genus", "species"];
    return order
      .map((rank) => {
        if (d[rank]) return { rank, name: d[rank] };
        return null;
      })
      .filter(Boolean);
  }

  /* ---------- UI surfaces ---------- */
  const surface = isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200";
  const inner = isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200";

  return (
    <div className={clsx("min-h-screen p-6 max-w-9xl mx-auto")}>
      {/* HEADER */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">GBIF Pro — Species Explorer</h1>
          <p className="mt-1 text-sm opacity-70 max-w-2xl">A professional GBIF species inspector: search taxa, view taxonomy, inspect metadata and export clean JSON. Designed with a left → center → right workspace for serious analysis.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={onSubmitSearch} className={clsx("flex items-center gap-2 w-full md:w-[680px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search species, genus, or scientific name (e.g. 'Viruses', 'Panthera', 'Homo sapiens')"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onFocus={() => setShowSuggest(true)}
              className="border-0 shadow-none bg-transparent outline-none"
            />
            <Button type="submit" variant="outline" className="px-3">Search</Button>
          </form>
        </div>
      </header>

      {/* SUGGESTIONS DROPDOWN */}
      <AnimatePresence>
        {showSuggest && suggestions && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_340px)] md:right-auto max-w-6xl rounded-xl overflow-hidden shadow-2xl", surface)}
            style={{ maxHeight: 420, overflow: "auto" }}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, i) => (
              <li key={s.key ?? s.scientificName ?? i} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => selectSuggestion(s)}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-md flex items-center justify-center border shrink-0 bg-white/5">
                    <LayersStack className="opacity-70" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{s.canonicalName || s.scientificName || "Unnamed taxon"}</div>
                    <div className="text-xs opacity-60 truncate">{s.rank ? `${s.rank} • ${s.kingdom ?? "—"}` : (s.kingdom ?? "—")}</div>
                  </div>
                  <div className="text-xs opacity-60 whitespace-nowrap">key: {s.key ?? "—"}</div>
                </div>
              </li>
            ))}
            {(!suggestions || suggestions.length === 0) && !loadingSuggest && <li className="p-3 text-sm opacity-60">No results</li>}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* LAYOUT: LEFT / CENTER / RIGHT */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* LEFT: Visual + key metadata */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 h-fit", surface)}>
          <div className={clsx("rounded-xl border p-4", inner)}>
            {/* visual placeholder */}
            <div className="w-full h-44 rounded-md bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-black/20 dark:to-black/10 flex items-center justify-center mb-4 border">
              {detail?.vernacularName ? (
                <div className="text-center">
                  <div className="text-lg font-semibold">{detail?.vernacularName}</div>
                  <div className="text-xs opacity-60 mt-1">{detail?.canonicalName || detail?.scientificName}</div>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 opacity-70">
                  <ImageIcon />
                  <div className="text-xs">No image in species response</div>
                </div>
              )}
            </div>

            {/* compact metadata */}
            <div className="space-y-2 text-sm">
              <div>
                <div className="text-xs opacity-60">Scientific</div>
                <div className="font-medium break-words">{detail?.scientificName || "—"}</div>
              </div>
              <div>
                <div className="text-xs opacity-60">Canonical</div>
                <div className="font-medium">{detail?.canonicalName || "—"}</div>
              </div>
              <div>
                <div className="text-xs opacity-60">Rank</div>
                <div className="font-medium">{detail?.rank || "—"}</div>
              </div>
              <div>
                <div className="text-xs opacity-60">Status</div>
                <div className="font-medium">{detail?.taxonomicStatus || "—"}</div>
              </div>
              <div>
                <div className="text-xs opacity-60">GBIF key</div>
                <div className="font-medium">{detail?.key ?? "—"}</div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-2">
              <Button variant="outline" className="w-full" onClick={() => setDialogOpen(true)}><BookOpen /> Raw JSON</Button>
              <Button variant="ghost" className="w-full" onClick={() => copyJSON()}><Copy /> Copy JSON</Button>
            </div>
          </div>
        </aside>

        {/* CENTER: expanded details */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", surface)}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Taxon Overview</CardTitle>
                <div className="text-xs opacity-60">{primaryTitle(detail || selected)}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => { if (selected?.key) fetchSpeciesDetail(selected.key); else showToast("info", "No key to refresh"); }}>
                  <Loader2 className={loadingDetail ? "animate-spin" : ""} /> Refresh
                </Button>
                <Button variant="ghost" onClick={() => setShowRaw(s => !s)}><List /> {showRaw ? "Hide" : "Raw"}</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loadingDetail ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : (
                <>
                  {/* header title + authorship */}
                  <div className="mb-4">
                    <div className="text-2xl font-bold">{detail?.canonicalName || detail?.scientificName || "—"}</div>
                    <div className="text-sm opacity-60">{detail?.authorship || detail?.scientificNameAuthorship || ""}</div>
                  </div>

                  {/* large metrics row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                    <div className="p-3 rounded-md border">
                      <div className="text-xs opacity-60">Descendants</div>
                      <div className="text-lg font-semibold">{detail?.numDescendants ?? "—"}</div>
                    </div>
                    <div className="p-3 rounded-md border">
                      <div className="text-xs opacity-60">Kingdom</div>
                      <div className="text-lg font-semibold">{detail?.kingdom ?? "—"}</div>
                    </div>
                    <div className="p-3 rounded-md border">
                      <div className="text-xs opacity-60">Last crawled</div>
                      <div className="text-lg font-semibold">{detail?.lastCrawled ? formatDateISO(detail.lastCrawled) : "—"}</div>
                    </div>
                    <div className="p-3 rounded-md border">
                      <div className="text-xs opacity-60">Taxonomic status</div>
                      <div className="text-lg font-semibold">{detail?.taxonomicStatus ?? "—"}</div>
                    </div>
                  </div>

                  {/* overview / remarks */}
                  <div className="mb-4">
                    <div className="text-sm font-semibold mb-2">Overview</div>
                    <div className="text-sm leading-relaxed text-justify">
                      {detail?.remarks || detail?.vernacularName || "No descriptive remarks provided by GBIF for this taxon."}
                    </div>
                  </div>

                  <Separator className="my-3" />

                  {/* classification */}
                  <div className="mb-4">
                    <div className="text-sm font-semibold mb-2">Classification</div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {classificationList(detail || selected).length > 0 ? (
                        classificationList(detail || selected).map((c, i) => (
                          <div key={i} className="p-2 rounded-md border">
                            <div className="text-xs opacity-60">{(c.rank || c.rankParsed || c.rankLevel || c.rank) ?? "rank"}</div>
                            <div className="text-sm font-medium break-words">{c.name || c.canonicalName || c.scientificName}</div>
                          </div>
                        ))
                      ) : (
                        <div className="text-sm opacity-60">No classification data available</div>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* additional fields (cleanly presented) */}
                  <div className="mt-4">
                    <div className="text-sm font-semibold mb-2">Details</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Name type</div>
                        <div className="text-sm font-medium">{detail?.nameType ?? "—"}</div>
                      </div>
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Origin</div>
                        <div className="text-sm font-medium">{detail?.origin ?? "—"}</div>
                      </div>
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Dataset key</div>
                        <div className="text-sm font-medium break-words">{detail?.datasetKey ?? "—"}</div>
                      </div>
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Issues</div>
                        <div className="text-sm font-medium">{Array.isArray(detail?.issues) && detail.issues.length > 0 ? detail.issues.join(", ") : "—"}</div>
                      </div>
                    </div>
                  </div>

                  {/* raw JSON inline */}
                  <AnimatePresence>
                    {showRaw && rawResp && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("p-4 mt-4 rounded-md border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                        <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 320 }}>
                          {prettyJSON(rawResp)}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </CardContent>
          </Card>
        </section>

        {/* RIGHT: quick actions & developer tools */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 h-fit", surface)}>
          <div className={clsx("p-4 rounded-xl border space-y-3", inner)}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold">Quick actions</div>
                <div className="text-xs opacity-60 mt-1">Fast exports & external links</div>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-1 gap-2">
              <Button variant="outline" className="w-full" onClick={() => openGbif(detail?.key ?? selected?.key)}><Globe /> Open on GBIF</Button>
              <Button variant="outline" className="w-full" onClick={() => openOccurrences(detail?.key ?? selected?.key)}><MapPin /> View occurrences</Button>
              <Button variant="outline" className="w-full" onClick={() => copyJSON()}><Copy /> Copy JSON</Button>
              <Button variant="outline" className="w-full" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
              <Button variant="ghost" className="w-full" onClick={() => setShowRaw(s => !s)}><List /> Toggle raw</Button>
            </div>

            <Separator className="my-3" />

            <div className="text-xs opacity-60">Developer</div>
            <div className="text-xs break-words">Search endpoint: <code className="text-xs">{BASE}?q=QUERY</code></div>
            <div className="text-xs opacity-60 mt-2">Try: <code>fetch("{BASE}?q=Viruses").then(r=>r.json()).then(console.log)</code></div>
          </div>
        </aside>
      </main>

      {/* RAW JSON DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-4xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{primaryTitle(detail || selected)} — Raw JSON</DialogTitle>
          </DialogHeader>

          <div style={{ maxHeight: "70vh", overflow: "auto" }} className="p-4">
            <pre className={clsx("text-sm", isDark ? "text-zinc-200" : "text-zinc-900")}>
              {prettyJSON(detail || selected || rawResp)}
            </pre>
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">GBIF response</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>Close</Button>
              <Button variant="outline" onClick={() => downloadJSON()}><Download /> Download</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
