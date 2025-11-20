// src/pages/AviationApiPage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper";

import {
  Search,
  MapPin,
  ExternalLink,
  Download,
  Copy,
  Loader2,
  ImageIcon,
  List,
  Globe,
  Eye,
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

import { useTheme } from "@/components/theme-provider";

/* ---------- Endpoint ---------- */
const BASE_ENDPOINT = "/aviation/v1/airports";

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

/**
 * Parse DMS coordinate formats like:
 *  "40-38-23.7400N"  or "073-46-43.2930W"
 * Returns decimal degrees (number) or null if parsing fails.
 */
function dmsToDecimal(dmsStr) {
  if (!dmsStr || typeof dmsStr !== "string") return null;
  // Remove whitespace
  const s = dmsStr.trim().replace(/\s+/g, "");
  // capture degrees-min-sec and direction
  const m = s.match(/^(\d+)[-:\s]?(\d+)[-:\s]?([\d.]+)([NnSsEeWw])$/);
  if (!m) {
    // try alternative like "40 38 23.7400N"
    const m2 = s.match(/^(\d+)\s+(\d+)\s+([\d.]+)([NSEWnsew])$/);
    if (!m2) return null;
    const deg = parseFloat(m2[1]), min = parseFloat(m2[2]), sec = parseFloat(m2[3]), dir = m2[4].toUpperCase();
    let dec = deg + min / 60 + sec / 3600;
    if (dir === "S" || dir === "W") dec = -dec;
    return dec;
  }
  const deg = parseFloat(m[1]), min = parseFloat(m[2]), sec = parseFloat(m[3]), dir = m[4].toUpperCase();
  let dec = deg + (min || 0) / 60 + (sec || 0) / 3600;
  if (dir === "S" || dir === "W") dec = -dec;
  return dec;
}

/* Try to read lat/lon fields from airport object. Many aviation API responses use latitude and longitude strings */
function extractLatLon(airport) {
  if (!airport || typeof airport !== "object") return { lat: null, lon: null };
  const latRaw = airport.latitude || airport.latitude_deg || airport.lat || airport.latitude_sec;
  const lonRaw = airport.longitude || airport.longitude_deg || airport.lon || airport.longitude_sec;

  // The dataset sample you provided uses "latitude":"40-38-23.7400N" and "longitude":"073-46-43.2930W"
  const lat = dmsToDecimal(latRaw);
  const lon = dmsToDecimal(lonRaw);
  if (!lat && !lon) {
    // fallback: some providers include lat/lon as decimal in other keys
    const latFloat = parseFloat(airport.latitude_decimal || airport.lat_decimal || airport.latitude_deg || "");
    const lonFloat = parseFloat(airport.longitude_decimal || airport.lon_decimal || airport.longitude_deg || "");
    return {
      lat: isFinite(latFloat) ? latFloat : null,
      lon: isFinite(lonFloat) ? lonFloat : null
    };
  }
  return { lat, lon };
}

export default function AviationApiPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // State
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]); // suggestion list: array of { code, records[] }
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [currentAirport, setCurrentAirport] = useState(null); // selected airport object
  const [rawResp, setRawResp] = useState(null);
  const [loadingAirport, setLoadingAirport] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const suggestTimer = useRef(null);

  /* Fetch helpers */
  async function fetchAirportByCode(code) {
    if (!code) return;
    setLoadingAirport(true);
    try {
      const url = `${BASE_ENDPOINT}?apt=${encodeURIComponent(code)}`;
      const res = await fetch(url);
      if (!res.ok) {
        showToast("error", `Airport fetch failed (${res.status})`);
        setLoadingAirport(false);
        return;
      }
      const json = await res.json();
      setRawResp(json);
      // json shape: { "JFK": [ { ... } ] } — pick the first key and first element
      const keys = Object.keys(json || {});
      if (keys.length === 0) {
        showToast("info", "No airport found for that code");
        setCurrentAirport(null);
      } else {
        const key = keys[0];
        const rec = (Array.isArray(json[key]) && json[key].length > 0) ? json[key][0] : null;
        if (rec) {
          setCurrentAirport({ ...rec, _code: key });
          showToast("success", `Loaded ${rec.facility_name || key}`);
        } else {
          setCurrentAirport(null);
          showToast("info", "No records returned for that code");
        }
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch airport");
      setCurrentAirport(null);
      setRawResp(null);
    } finally {
      setLoadingAirport(false);
    }
  }

  /**
   * Attempt suggestion lookup. Aviation API's simple endpoint mostly expects apt codes.
   * We will try to fetch using the typed string (uppercase). If an exact code matches,
   * response contains a key which we can list as suggestion.
   */
  async function searchSuggest(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);
    try {
      // If user typed 2-4 chars treat as possible code
      const attempt = q.trim().toUpperCase();
      const url = `${BASE_ENDPOINT}?apt=${encodeURIComponent(attempt)}`;
      const res = await fetch(url);
      if (!res.ok) {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      const json = await res.json();
      // json is an object mapping codes to arrays
      const keys = Object.keys(json || {});
      const newSugs = keys.map(k => {
        return {
          code: k,
          records: Array.isArray(json[k]) ? json[k] : [],
        };
      });
      // set suggestions — sometimes the API will return the match or empty
      setSuggestions(newSugs);
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
    // debounce for 300ms
    suggestTimer.current = setTimeout(() => {
      searchSuggest(v);
    }, 300);
  }

  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query || query.trim().length === 0) {
      showToast("info", "Type an IATA/ICAO code (e.g. JFK, KJFK) or city name");
      return;
    }
    await fetchAirportByCode(query.trim().toUpperCase());
    setShowSuggest(false);
  }

  function chooseSuggestion(s) {
    // s: {code, records[]}
    setShowSuggest(false);
    if (!s || !s.code) return;
    fetchAirportByCode(s.code);
  }

  function copyAirportToClipboard() {
    if (!currentAirport) return showToast("info", "No airport selected");
    navigator.clipboard.writeText(prettyJSON(currentAirport));
    showToast("success", "Airport JSON copied");
  }

  function downloadJSON() {
    if (!rawResp && !currentAirport) {
      showToast("info", "No data to download");
      return;
    }
    const payload = rawResp || currentAirport;
    const name = `airport_${(currentAirport?._code || "airport")}`.replace(/\s+/g, "_");
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${name}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  function openInMaps() {
    if (!currentAirport) return showToast("info", "No airport loaded");
    const { lat, lon } = extractLatLon(currentAirport);
    if (!lat || !lon) return showToast("info", "Coordinates not available");
    const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
    window.open(url, "_blank");
  }

  // initial example load: show JFK if available
  useEffect(() => {
    // optional: load JFK on mount as a friendly default (matches your sample)
    fetchAirportByCode("JFK");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* UI render */
  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>Aviation Explorer</h1>
          <p className="mt-1 text-sm opacity-70">Lookup airports — IATA / ICAO codes, metadata & coordinates. No API key required.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[560px] rounded-lg px-2 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              aria-label="Search airport by code"
              placeholder="Type IATA or ICAO code (e.g. JFK, KJFK)..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="submit" variant="outline" className="px-3 cursor-pointer" title="Search"><Search /></Button>
            <Button type="button" variant="outline" className="px-3 cursor-pointer" onClick={() => { setQuery(""); setSuggestions([]); setShowSuggest(false); }} title="Clear">Clear</Button>
          </form>
        </div>
      </header>

      {/* suggestions */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            role="listbox"
            aria-label="Airport suggestions"
            className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_280px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, idx) => (
              <li
                key={s.code || idx}
                className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer"
                role="option"
                aria-selected={false}
                onClick={() => chooseSuggestion(s)}
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 rounded-sm flex items-center justify-center bg-zinc-100 dark:bg-zinc-800/50 text-xs font-semibold">
                    {s.code}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{s.records?.[0]?.facility_name || `Airport ${s.code}`}</div>
                    <div className="text-xs opacity-60">{s.records?.[0]?.city ? `${s.records[0].city}, ${s.records[0].state}` : "—"}</div>
                  </div>
                  <div className="text-xs opacity-60">{s.records?.[0]?.state_full || s.records?.[0]?.region || "—"}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: summary (visual) */}
        <aside className={clsx("lg:col-span-3 space-y-4", isDark ? "bg-black/40 border border-zinc-800 rounded-2xl p-4" : "bg-white/90 border border-zinc-200 rounded-2xl p-4")}>
          <div className="flex flex-col items-start gap-3">
            <div className="w-full">
              <div className="h-36 w-full rounded-lg overflow-hidden flex items-center justify-center bg-zinc-100 dark:bg-zinc-900/50">
                <div className="flex flex-col items-center gap-2">
                  <ImageIcon className="w-8 h-8 opacity-60" />
                  <div className="text-xs opacity-60">No official image</div>
                  <div className="text-xs opacity-60">Map view available</div>
                </div>
              </div>
            </div>

            <div className="w-full">
              <div className="text-sm text-xs opacity-60">Airport</div>
              <div className="text-lg font-semibold">{currentAirport?.facility_name ?? "Select an airport"}</div>
              <div className="mt-1 text-xs opacity-60">{currentAirport?._code ? `${currentAirport._code} • ${currentAirport.icao_ident ?? ""}` : "IATA / ICAO code"}</div>
              <div className="mt-3 text-sm">
                <div className="text-xs opacity-60">Location</div>
                <div className="font-medium">{currentAirport ? `${currentAirport.city ?? "—"}, ${currentAirport.state_full ?? currentAirport.state ?? "—"}` : "—"}</div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                <div className="p-2 rounded-md border">
                  <div className="text-xs opacity-60">Region</div>
                  <div className="font-medium">{currentAirport?.region ?? "—"}</div>
                </div>
                <div className="p-2 rounded-md border">
                  <div className="text-xs opacity-60">Elevation (ft)</div>
                  <div className="font-medium">{currentAirport?.elevation ?? "—"}</div>
                </div>
                <div className="p-2 rounded-md border">
                  <div className="text-xs opacity-60">Owner</div>
                  <div className="font-medium">{currentAirport?.ownership ?? "—"}</div>
                </div>
                <div className="p-2 rounded-md border">
                  <div className="text-xs opacity-60">Control Tower</div>
                  <div className="font-medium">{currentAirport?.control_tower === "Y" ? "Yes" : currentAirport?.control_tower === "N" ? "No" : (currentAirport?.control_tower ?? "—")}</div>
                </div>
              </div>
            </div>

            <div className="w-full mt-2">
              <Button className="w-full" variant="outline" onClick={() => { if (currentAirport) setDialogOpen(true); else showToast("info", "No airport loaded"); }}><Eye /> View raw</Button>
            </div>
          </div>
        </aside>

        {/* Center: full details */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Airport Details</CardTitle>
                <div className="text-xs opacity-60">{currentAirport?.facility_name ?? "No airport selected"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => fetchAirportByCode("JFK")} title="Load sample (JFK)"><Globe /> Sample</Button>
                <Button variant="outline" onClick={() => { if (currentAirport) { navigator.clipboard.writeText(prettyJSON(currentAirport)); showToast("success", "Copied airport JSON"); } else showToast("info", "No airport loaded"); }}><Copy /></Button>
                <Button variant="outline" onClick={() => downloadJSON()}><Download /></Button>
              </div>
            </CardHeader>

            <CardContent>
              {loadingAirport ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !currentAirport ? (
                <div className="py-12 text-center text-sm opacity-60">Select an airport from suggestions, or type an IATA/ICAO code and press search.</div>
              ) : (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <div className="text-sm text-xs opacity-60">Name</div>
                      <div className="text-xl font-semibold">{currentAirport.facility_name}</div>

                      <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <div className="p-2 rounded-md border">
                          <div className="text-xs opacity-60">IATA / FAA</div>
                          <div className="font-medium">{currentAirport.faa_ident ?? currentAirport._code ?? "—"}</div>
                        </div>
                        <div className="p-2 rounded-md border">
                          <div className="text-xs opacity-60">ICAO</div>
                          <div className="font-medium">{currentAirport.icao_ident ?? "—"}</div>
                        </div>
                      </div>
                    </div>

                    <div className="w-40">
                      <div className="text-xs opacity-60">Coordinates</div>
                      <div className="font-medium break-words">{(currentAirport.latitude && currentAirport.longitude) ? `${currentAirport.latitude} , ${currentAirport.longitude}` : "—"}</div>
                      <div className="mt-2">
                        <Button className="mt-2 w-full" variant="outline" onClick={() => openInMaps()}><MapPin /> Open in Maps</Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Full fields */}
                  <div>
                    <div className="text-sm font-semibold mb-2">All fields</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.keys(currentAirport).map((k) => (
                        <div key={k} className="p-3 rounded-md border">
                          <div className="text-xs opacity-60">{k}</div>
                          <div className="text-sm font-medium break-words">{typeof currentAirport[k] === "object" ? JSON.stringify(currentAirport[k]) : (currentAirport[k] ?? "—")}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right: quick actions */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold mb-2">Quick actions</div>
            <div className="text-xs opacity-60 mb-3">Utilities for developers & operators</div>
            <div className="space-y-2">
              <Button className="w-full" variant="outline" onClick={() => { if (currentAirport) { const url = `${BASE_ENDPOINT}?apt=${encodeURIComponent(currentAirport._code || currentAirport.faa_ident || "")}`; navigator.clipboard.writeText(url); showToast("success", "Endpoint copied"); } else showToast("info", "No airport loaded"); }}><Copy /> Copy Endpoint</Button>

              <Button className="w-full" variant="outline" onClick={() => downloadJSON()}><Download /> Download JSON</Button>

              <Button className="w-full" variant="outline" onClick={() => { setDialogOpen((s) => !s); }}><List /> Toggle Raw</Button>

              <Button className="w-full" variant="ghost" onClick={() => { navigator.clipboard.writeText(query.trim().toUpperCase()); showToast("success", "Copied search term"); }}><Copy /> Copy Query</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Developer notes</div>
            <div className="text-xs opacity-60">This page uses <code className="rounded px-1 bg-zinc-100 dark:bg-zinc-900/50">https://api.aviationapi.com/v1/airports?apt=CODE</code>. Response is an object keyed by code (e.g. "JFK") containing an array of records.</div>
          </div>
        </aside>
      </main>

      {/* Raw JSON dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{currentAirport?.facility_name || "Raw JSON"}</DialogTitle>
          </DialogHeader>

          <div style={{ maxHeight: "60vh", overflow: "auto", padding: 16 }}>
            <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")}>
              {prettyJSON(rawResp || currentAirport || {})}
            </pre>
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Raw response</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
              <Button variant="outline" onClick={() => { copyAirportToClipboard(); }}><Copy /></Button>
              <Button variant="outline" onClick={() => { downloadJSON(); }}><Download /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

