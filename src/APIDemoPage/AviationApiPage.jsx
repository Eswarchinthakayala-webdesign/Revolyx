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
  List,
  Globe,
  Eye,
  X,
  Building,
  Landmark,
  Plane,
  TowerControl,
  Ruler,
  Globe2,
  Navigation,
  Signature,
  Hash,
  Server,
  Building2,
  Compass,
  Info,
  CircleCheck,
  CircleHelp,
  DotSquare
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
 * Convert DMS coordinate strings like:
 * "40-38-23.7400N"  ->  40.6399
 */
function dmsToDecimal(dmsStr) {
  if (!dmsStr || typeof dmsStr !== "string") return null;
  const s = dmsStr.trim().replace(/\s+/g, "");
  const m = s.match(/^(\d+)[-:\s]?(\d+)[-:\s]?([\d.]+)([NnSsEeWw])$/);
  if (!m) return null;

  const deg = parseFloat(m[1]);
  const min = parseFloat(m[2]);
  const sec = parseFloat(m[3]);
  const dir = m[4].toUpperCase();

  let dec = deg + min / 60 + sec / 3600;
  if (dir === "S" || dir === "W") dec = -dec;
  return dec;
}

function extractLatLon(airport) {
  if (!airport) return { lat: null, lon: null };
  const lat = dmsToDecimal(airport.latitude);
  const lon = dmsToDecimal(airport.longitude);
  return { lat, lon };
}

/* ---------- ICON MAP for dynamic rendering ---------- */
const fieldIcons = {
  facility_name: Plane,
  city: Building,
  state: Landmark,
  state_full: Landmark,
  region: Globe2,
  ownership: Building2,
  elevation: Ruler,
  faa_ident: Signature,
  icao_ident: Navigation,
  latitude: Compass,
  longitude: Compass,
  control_tower: TowerControl,
};

/* fallback icon */
const DefaultIcon = DotSquare;

export default function AviationApiPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)")?.matches);

  // State
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [currentAirport, setCurrentAirport] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [loadingAirport, setLoadingAirport] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const suggestTimer = useRef(null);

  /* ---------- Fetch Airport ---------- */
  async function fetchAirportByCode(code) {
    if (!code) return;
    setLoadingAirport(true);

    try {
      const url = `${BASE_ENDPOINT}?apt=${encodeURIComponent(code)}`;
      const res = await fetch(url);

      if (!res.ok) {
        showToast("error", `API error: ${res.status}`);
        setLoadingAirport(false);
        return;
      }

      const json = await res.json();
      setRawResp(json);

      const keys = Object.keys(json);
      if (keys.length === 0) {
        showToast("info", "No airport found");
        setCurrentAirport(null);
      } else {
        const data = json[keys[0]][0];
        setCurrentAirport({ ...data, _code: keys[0] });
        showToast("success", `Loaded ${data.facility_name || keys[0]}`);
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Network error");
    } finally {
      setLoadingAirport(false);
    }
  }

  /* ---------- Suggestions ---------- */
  async function searchSuggest(q) {
    if (!q) return setSuggestions([]);

    setLoadingSuggest(true);
    try {
      const code = q.trim().toUpperCase();
      const url = `${BASE_ENDPOINT}?apt=${code}`;
      const res = await fetch(url);

      if (!res.ok) {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }

      const json = await res.json();
      const keys = Object.keys(json || {});
      const sug = keys.map((k) => ({
        code: k,
        airport: json[k]?.[0] || null,
      }));

      setSuggestions(sug);
    } catch {
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
    }, 250);
  }

  function chooseSuggestion(s) {
    setShowSuggest(false);
    fetchAirportByCode(s.code);
  }

  async function handleSearchSubmit(e) {
    e.preventDefault();
    const code = query.trim().toUpperCase();
    if (!code) return showToast("info", "Enter a code");

    fetchAirportByCode(code);
    setShowSuggest(false);
  }

  /* ---------- Copy / Download / Maps ---------- */
  function copyAirport() {
    if (!currentAirport) return showToast("info", "No airport");
    navigator.clipboard.writeText(prettyJSON(currentAirport));
    showToast("success", "Copied airport JSON");
  }

  function copyEndpoint() {
    if (!currentAirport) return showToast("info", "No airport selected");
    const url = `${BASE_ENDPOINT}?apt=${currentAirport._code}`;
    navigator.clipboard.writeText(url);
    showToast("success", "Copied endpoint");
  }

  function downloadJSON() {
    if (!rawResp) return showToast("info", "Nothing to download");
    const blob = new Blob([prettyJSON(rawResp)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "airport.json";
    a.click();
    showToast("success", "Downloaded JSON");
  }

  function openMaps() {
    if (!currentAirport) return;
    const { lat, lon } = extractLatLon(currentAirport);
    if (!lat || !lon) return showToast("info", "No coordinates");

    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lon}`, "_blank");
  }

  /* ---------- Initial Load (JFK) ---------- */
  useEffect(() => {
    fetchAirportByCode("JFK");
  }, []);

  /* ---------- UI ---------- */
  return (
    <div className="min-h-screen p-6 max-w-8xl mx-auto">

      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-2">
            <Plane className="w-7 h-7" /> Aviation Explorer
          </h1>
          <p className="mt-1 text-sm opacity-70">Search US airports using FAA / ICAO codes.</p>
        </div>

        {/* SEARCH BAR */}
        <form
          onSubmit={handleSearchSubmit}
          className={clsx(
            "flex items-center gap-2 rounded-xl px-3 py-2 w-full md:w-[540px] border",
            isDark
              ? "bg-black/60 border-zinc-800"
              : "bg-white border-zinc-300 shadow-sm"
          )}
        >
          <Search className="opacity-60" />
          <Input
            placeholder="Enter airport code (JFK, LAX, KJFK)..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => setShowSuggest(true)}
            className="border-0 shadow-none bg-transparent outline-none"
          />
          <Button type="submit" variant="default" className="cursor-pointer">
            {loadingAirport ? <Loader2 className="animate-spin" /> : <Search />}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={() => {
              setQuery("");
              setSuggestions([]);
              setShowSuggest(false);
            }}
          >
            Clear
          </Button>
        </form>
      </header>

      {/* SUGGESTIONS */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className={clsx(
              "absolute left-6 right-6 max-w-3xl rounded-xl shadow-xl border z-50",
              isDark ? "bg-black border-zinc-800" : "bg-white border-zinc-300"
            )}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-70">Searching…</li>}

            {suggestions.map((s, i) => (
              <li
                key={i}
                onClick={() => chooseSuggestion(s)}
                className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="rounded-md h-9 w-12 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center font-semibold">
                    {s.code}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-medium">
                      {s.airport?.facility_name || "Unknown Airport"}
                    </div>
                    <div className="text-xs opacity-60">
                      {s.airport?.city || "Unknown"}, {s.airport?.state || ""}
                    </div>
                  </div>

                  <div className="opacity-60 text-xs">{s.airport?.region || "—"}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* LAYOUT */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8">

        {/* LEFT PANEL — MAIN INFO */}
        <aside
          className={clsx(
            "lg:col-span-3 h-fit rounded-2xl p-5 space-y-5 border",
            isDark ? "bg-black/40 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
          )}
        >
          {!currentAirport ? (
            <div className="text-center opacity-60 text-sm">No airport selected</div>
          ) : (
            <>
              {/* Airport Title */}
              <div>
                <div className="text-xs opacity-60">Airport</div>
                <div className="text-xl font-semibold">{currentAirport.facility_name}</div>
                <div className="text-xs opacity-60">{currentAirport.city}, {currentAirport.state}</div>
              </div>

              {/* Quick Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-md border">
                  <div className="text-xs opacity-60 flex items-center gap-1"><Signature /> IATA/FAA</div>
                  <div className="font-medium">{currentAirport.faa_ident || currentAirport._code}</div>
                </div>

                <div className="p-3 rounded-md border">
                  <div className="text-xs opacity-60 flex items-center gap-1"><Navigation /> ICAO</div>
                  <div className="font-medium">{currentAirport.icao_ident || "—"}</div>
                </div>

                <div className="p-3 rounded-md border">
                  <div className="text-xs opacity-60 flex items-center gap-1"><Globe2 /> Region</div>
                  <div className="font-medium">{currentAirport.region}</div>
                </div>

                <div className="p-3 rounded-md border">
                  <div className="text-xs opacity-60 flex items-center gap-1"><Ruler /> Elevation</div>
                  <div className="font-medium">{currentAirport.elevation || "—"} ft</div>
                </div>

                <div className="p-3 rounded-md border">
                  <div className="text-xs opacity-60 flex items-center gap-1"><Building2 /> Ownership</div>
                  <div className="font-medium">{currentAirport.ownership || "—"}</div>
                </div>

                <div className="p-3 rounded-md border">
                  <div className="text-xs opacity-60 flex items-center gap-1"><TowerControl /> Tower</div>
                  <div className="font-medium">
                    {currentAirport.control_tower === "Y" ? "Yes" :
                     currentAirport.control_tower === "N" ? "No" : "—"}
                  </div>
                </div>
              </div>

              {/* Coordinates */}
              <div className="mt-2">
                <div className="text-xs opacity-60 flex items-center gap-1"><Compass /> Coordinates</div>
                <div className="font-medium text-sm">
                  {currentAirport.latitude || "—"} , {currentAirport.longitude || "—"}
                </div>

                <Button
                  className="cursor-pointer mt-3 w-full"
                  variant="outline"
                  onClick={openMaps}
                >
                  <MapPin /> Open in Maps
                </Button>
              </div>

              {/* View Raw */}
              <Button
                variant="secondary"
                className="mt-1 w-full cursor-pointer"
                onClick={() => setDialogOpen(true)}
              >
                <Eye /> View Raw JSON
              </Button>
            </>
          )}
        </aside>

        {/* CENTER PANEL — FULL DETAILS */}
        <section
          className={clsx(
            "lg:col-span-6 rounded-2xl border",
            isDark ? "bg-black/40 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
          )}
        >
          <Card className="bg-white dark:bg-black">
            <CardHeader className="flex justify-between  items-center">
              <div>
                <CardTitle>Airport Details</CardTitle>
                <div className="text-xs opacity-60">
                  {currentAirport?.facility_name || "No airport selected"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" className="cursor-pointer" onClick={() => fetchAirportByCode("JFK")}>
                  <Globe /> Sample
                </Button>

                <Button variant="outline" className="cursor-pointer" onClick={copyAirport}>
                  <Copy />
                </Button>

                <Button variant="outline" className="cursor-pointer" onClick={downloadJSON}>
                  <Download />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {loadingAirport ? (
                <div className="py-14 text-center">
                  <Loader2 className="animate-spin mx-auto" />
                </div>
              ) : !currentAirport ? (
                <div className="py-14 text-center text-sm opacity-60">
                  Search an airport code above.
                </div>
              ) : (
                <div className="space-y-6">

                  {/* Primary Summary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Left summary card */}
                    <div className="p-4 rounded-lg border shadow-sm flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-sm opacity-60">
                        <Plane /> Name
                      </div>
                      <div className="font-semibold text-lg">{currentAirport.facility_name}</div>

                      <div className="flex flex-col gap-1 mt-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Signature className="w-4 h-4" /> {currentAirport.faa_ident || currentAirport._code}
                        </div>
                        <div className="flex items-center gap-2">
                          <Navigation className="w-4 h-4" /> {currentAirport.icao_ident || "—"}
                        </div>
                      </div>
                    </div>

                    {/* Right summary card */}
                    <div className="p-4 rounded-lg border shadow-sm flex flex-col gap-2">
                      <div className="text-xs opacity-60 flex items-center gap-1"><Compass /> Coordinates</div>
                      <div className="font-medium text-sm">
                        {currentAirport.latitude}, {currentAirport.longitude}
                      </div>

                      <Button variant="outline" className="cursor-pointer mt-3" onClick={openMaps}>
                        <MapPin /> Open in Maps
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* ALL FIELDS */}
                  <div>
                    <div className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <List /> All Fields
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.entries(currentAirport).map(([key, value]) => {
                        if (key.startsWith("_")) return null;

                        const Icon = fieldIcons[key] || DefaultIcon;

                        return (
                          <div key={key} className="p-3 rounded-md border">
                            <div className="text-xs opacity-60 flex items-center gap-1">
                              <Icon className="w-4 h-4" />
                              {key}
                            </div>

                            <div className="text-sm font-medium break-words mt-1">
                              {typeof value === "object" ? JSON.stringify(value) : value || "—"}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* RIGHT PANEL — QUICK ACTIONS */}
        <aside
          className={clsx(
            "lg:col-span-3 h-fit rounded-2xl p-5 space-y-4 border",
            isDark ? "bg-black/40 border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
          )}
        >
          <div>
            <div className="text-sm font-semibold mb-2">Quick Actions</div>

            <Button className="cursor-pointer w-full mb-2" variant="outline" onClick={copyEndpoint}>
              <Copy /> Copy Endpoint
            </Button>

            <Button className="cursor-pointer w-full mb-2" variant="outline" onClick={downloadJSON}>
              <Download /> Download JSON
            </Button>

            <Button className="cursor-pointer w-full mb-2" variant="outline" onClick={() => setDialogOpen(true)}>
              <List /> Raw JSON
            </Button>

            <Button
              className="cursor-pointer w-full mb-2"
              variant="ghost"
              onClick={() => {
                navigator.clipboard.writeText(query.trim());
                showToast("success", "Query copied");
              }}
            >
              <Copy /> Copy Search Term
            </Button>
          </div>

          <Separator />

          <div className="text-xs opacity-60">
            Uses: <code>/v1/airports?apt=CODE</code>.  
            API returns objects keyed by airport code (e.g., `"JFK"`).
          </div>
        </aside>
      </main>

      {/* RAW JSON DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full rounded-2xl p-3 overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Server />
              Raw JSON — {currentAirport?.facility_name || "Airport"}
            </DialogTitle>
          </DialogHeader>

          <div className="p-4" style={{ maxHeight: "60vh", overflowY: "auto" }}>
            <pre className={clsx("text-xs", isDark ? "text-zinc-200" : "text-zinc-900")}>
              {prettyJSON(rawResp || currentAirport || {})}
            </pre>
          </div>

          <DialogFooter className="p-4 border-t flex justify-between items-center">
            <div className="text-xs opacity-60">Full API response</div>

            <div className="flex gap-2">
              <Button className="cursor-pointer" variant="ghost" onClick={() => setDialogOpen(false)}>
                <X />
              </Button>

              <Button className="cursor-pointer" variant="outline" onClick={copyAirport}>
                <Copy />
              </Button>

              <Button className="cursor-pointer" variant="outline" onClick={downloadJSON}>
                <Download />
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
