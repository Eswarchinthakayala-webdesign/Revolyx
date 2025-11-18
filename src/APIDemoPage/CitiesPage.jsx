// src/pages/CitiesPage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper";

import {
  Search,
  MapPin,
  Globe,
  List,
  ExternalLink,
  Copy,
  Download,
  Loader2,
  Info,
  X,
  Database,
  Flag,
  Map,
  Users,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";

/* ----------------------------------------
  GeoDB GraphQL endpoint (free)
  ---------------------------------------- */
const GRAPHQL_ENDPOINT = "https://geodb-free-service.wirefreethought.com/graphql";

/* ----------------------------------------
  Helpers
  ---------------------------------------- */
function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function ensureArray(v) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

/* Build a GraphQL fetch helper */
async function runGraphQL(query, variables = {}) {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`GraphQL request failed (${res.status})`);
  const json = await res.json();
  if (json.errors) throw new Error(json.errors.map((e) => e.message).join(", "));
  return json.data;
}

/* Build an OpenStreetMap embed url given lat/lon */
function buildOSMEmbed(lat, lon, zoom = 10) {
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  // bbox small box around coordinates
  const latPad = 0.05;
  const lonPad = 0.05;
  const bbox = `${lon - lonPad},${lat - latPad},${lon + lonPad},${lat + latPad}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
}

/* Some queries we will use */
const SUGGEST_QUERY = `
query CitiesByPrefix($namePrefix: String!, $limit: Int!) {
  cities(namePrefix: $namePrefix, limit: $limit) {
    id
    name
    country {
      name
      code
    }
    region {
      name
    }
    latitude
    longitude
    population
  }
}
`;

const DETAILS_QUERY = `
query CityDetails($id: ID!) {
  city(id: $id) {
    id
    name
    country {
      name
      code
    }
    region {
      name
    }
    population
    elevationMeters
    latitude
    longitude
    timezone
    wikiDataId
  }
}
`;

/* ----------------------------------------
  Component
  ---------------------------------------- */
export default function CitiesPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [selectedCity, setSelectedCity] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const suggestTimer = useRef(null);

  // default: load "delhi" suggestions and pick first on mount
  useEffect(() => {
    (async () => {
      try {
        setLoadingSuggest(true);
        const data = await runGraphQL(SUGGEST_QUERY, { namePrefix: "delhi", limit: 6 });
        const items = data?.cities || [];
        setSuggestions(items);
        if (items.length > 0) await fetchDetails(items[0].id);
      } catch (err) {
        console.error(err);
        showToast("error", "Failed to load default city");
      } finally {
        setLoadingSuggest(false);
      }
    })();
  }, []);

  /* Debounced suggestions */
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(async () => {
      if (!v || v.trim().length === 0) {
        setSuggestions([]);
        return;
      }
      setLoadingSuggest(true);
      try {
        const data = await runGraphQL(SUGGEST_QUERY, { namePrefix: v, limit: 8 });
        setSuggestions(data?.cities || []);
      } catch (err) {
        console.error(err);
        setSuggestions([]);
      } finally {
        setLoadingSuggest(false);
      }
    }, 350);
  }

  /* Fetch details for chosen city */
  async function fetchDetails(id) {
    if (!id) return;
    setLoadingDetails(true);
    try {
      const data = await runGraphQL(DETAILS_QUERY, { id });
      const c = data?.city || null;
      setSelectedCity(c);
      setRawResp(c);
      setShowRaw(false);
      showToast("success", `Loaded: ${c?.name}`);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to load city details");
    } finally {
      setLoadingDetails(false);
    }
  }

  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query || query.trim().length === 0) {
      showToast("info", "Search cities by name (e.g. 'delhi')");
      return;
    }
    setLoadingSuggest(true);
    try {
      const data = await runGraphQL(SUGGEST_QUERY, { namePrefix: query, limit: 10 });
      const items = data?.cities || [];
      setSuggestions(items);
      if (items.length > 0) {
        await fetchDetails(items[0].id);
        setShowSuggest(false);
      } else {
        showToast("info", "No cities found");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Search failed");
    } finally {
      setLoadingSuggest(false);
    }
  }

  function copyEndpoint() {
    // show the endpoint and a sample query
    const sample = `POST ${GRAPHQL_ENDPOINT}\n\n{\n  "query": "query { cities(namePrefix: \\"del\\", limit: 5) { id name country { name } region { name } } }"\n}`;
    navigator.clipboard.writeText(sample);
    showToast("success", "GraphQL sample copied");
  }

  function downloadJSON() {
    const payload = rawResp || selectedCity;
    if (!payload) return showToast("info", "Nothing to download");
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `city_${(selectedCity?.name || "city").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  const osmSrc = (selectedCity?.latitude && selectedCity?.longitude)
    ? buildOSMEmbed(Number(selectedCity.latitude), Number(selectedCity.longitude))
    : null;

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>Atlas — City Explorer</h1>
          <p className="mt-1 text-sm opacity-70">Search global cities via GeoDB (GraphQL). Click a suggestion to view details and map.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search city names, e.g. 'delhi', 'london'..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="submit" variant="outline"> <Search /> </Button>
          </form>
        </div>
      </header>

      {/* suggestions */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_320px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s) => (
              <li key={s.id} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => { fetchDetails(s.id); setShowSuggest(false); }}>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-8 rounded bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-xs opacity-70">
                    {s.country?.code || s.region?.name?.[0] || "—"}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs opacity-60">{s.region?.name || "—"} • {s.country?.name || "—"}</div>
                  </div>
                  <div className="text-xs opacity-60">{s.population ? `${s.population.toLocaleString()} people` : "—"}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">

        {/* Center viewer */}
        <section className="lg:col-span-9 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center flex-wrap gap-3 justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">City Details</CardTitle>
                <div className="text-xs opacity-60">{selectedCity?.name || "Select a city from suggestions..."}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => { if (selectedCity?.id) fetchDetails(selectedCity.id); else handleSearchSubmit(); }}><Loader2 className={loadingDetails ? "animate-spin" : ""} /> Refresh</Button>
                <Button variant="ghost" onClick={() => setShowRaw((s) => !s)}><List /> {showRaw ? "Hide" : "Raw"}</Button>
                <Button variant="ghost" onClick={() => setDialogOpen(true)}><MapPin /> View Map</Button>
                <Button variant="outline" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loadingDetails ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !selectedCity ? (
                <div className="py-12 text-center text-sm opacity-60">No city selected — try search above.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left: map + meta */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="w-full h-48 bg-zinc-100 dark:bg-zinc-900 rounded-md overflow-hidden mb-3">
                      {osmSrc ? (
                        <iframe
                          title="map"
                          src={osmSrc}
                          style={{ width: "100%", height: "100%", border: 0 }}
                          loading="lazy"
                        />
                      ) : (
                        <div className="h-full flex items-center justify-center text-sm opacity-60">No coordinates available</div>
                      )}
                    </div>

                    <div className="text-lg font-semibold">{selectedCity.name}</div>
                    <div className="text-xs opacity-60">{selectedCity.region?.name || "—"} • {selectedCity.country?.name || "—"}</div>

                    <div className="mt-3 space-y-2 text-sm">
                      <div>
                        <div className="text-xs opacity-60">Population</div>
                        <div className="font-medium">{selectedCity.population ? selectedCity.population.toLocaleString() : "—"}</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60">Coordinates</div>
                        <div className="font-medium">{selectedCity.latitude ?? "—"}, {selectedCity.longitude ?? "—"}</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60">Timezone</div>
                        <div className="font-medium">{selectedCity.timezone || "—"}</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60">Elevation (m)</div>
                        <div className="font-medium">{selectedCity.elevationMeters ?? "—"}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      {selectedCity.wikiDataId ? (
                        <Button variant="outline" onClick={() => window.open(`https://www.wikidata.org/wiki/${selectedCity.wikiDataId}`, "_blank")}><ExternalLink /> WikiData</Button>
                      ) : (
                        <Button variant="outline" onClick={() => showToast("info", "No WikiData id")}>WikiData</Button>
                      )}
                    </div>
                  </div>

                  {/* Right: details */}
                  <div className={clsx("p-4 rounded-xl border col-span-1 md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-sm font-semibold mb-2">Overview</div>
                    <div className="text-sm leading-relaxed mb-3">
                      {selectedCity.name} — region: {selectedCity.region?.name || "—"}, country: {selectedCity.country?.name || "—"}.
                    </div>

                    <Separator className="my-3" />

                    <div className="text-sm font-semibold mb-2">Key Facts</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Country</div>
                        <div className="text-sm font-medium">{selectedCity.country?.name || "—"}</div>
                      </div>

                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Region</div>
                        <div className="text-sm font-medium">{selectedCity.region?.name || "—"}</div>
                      </div>

                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Population</div>
                        <div className="text-sm font-medium">{selectedCity.population ? selectedCity.population.toLocaleString() : "—"}</div>
                      </div>

                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Coordinates</div>
                        <div className="text-sm font-medium">{selectedCity.latitude ?? "—"}, {selectedCity.longitude ?? "—"}</div>
                      </div>

                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Timezone</div>
                        <div className="text-sm font-medium">{selectedCity.timezone || "—"}</div>
                      </div>

                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Elevation (m)</div>
                        <div className="text-sm font-medium">{selectedCity.elevationMeters ?? "—"}</div>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="text-sm font-semibold mb-2">Developer / Meta</div>
                    <div className="text-xs opacity-60 mb-2">GraphQL fields returned</div>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">City ID</div>
                        <div className="text-sm font-medium">{selectedCity.id}</div>
                      </div>

                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60">Raw response (toggle)</div>
                        <div className="text-sm font-medium">{selectedCity ? <Button variant="ghost" onClick={() => setShowRaw((s) => !s)}><Database /> Toggle raw</Button> : "—"}</div>
                      </div>
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

        {/* Right: developer/tools panel */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <Separator />
          <div>
            <div className="text-sm font-semibold mb-2">Developer</div>
            <div className="text-xs opacity-60 mb-3">GraphQL endpoint & sample queries</div>

            <div className="space-y-2">
              <Button variant="outline" onClick={() => copyEndpoint()}><Copy /> Copy sample</Button>
              <Button variant="outline" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
              <Button variant="outline" onClick={() => setShowRaw((s) => !s)}><List /> Toggle Raw</Button>
            </div>

            <Separator className="my-3" />

            <div>
              <div className="text-xs opacity-60 mb-2">Sample Suggest Query</div>
              <ScrollArea className="h-28 p-2 rounded border">
                <pre className="text-xs">
{`query {
  cities(namePrefix: "del", limit: 5) {
    id
    name
    country { name code }
    region { name }
    latitude
    longitude
    population
  }
}`}
                </pre>
              </ScrollArea>
            </div>
            <div className="mt-3">
              <div className="text-xs opacity-60 mb-2">Sample Details Query</div>
              <ScrollArea className="h-28 p-2 rounded border">
                <pre className="text-xs">
{`query {
  city(id: "CITY_ID") {
    id name country { name code } region { name } latitude longitude population timezone elevationMeters wikiDataId
  }
}`}
                </pre>
              </ScrollArea>
            </div>
          </div>
        </aside>
      </main>

      {/* Map dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-4xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{selectedCity?.name || "Map"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "65vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {osmSrc ? (
              <iframe
                title="city-map"
                src={osmSrc}
                style={{ width: "100%", height: "100%", border: 0 }}
                loading="lazy"
              />
            ) : (
              <div className="h-full flex items-center justify-center">No coordinates available for map</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Map provided by OpenStreetMap</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
              {selectedCity?.wikiDataId && <Button variant="outline" onClick={() => window.open(`https://www.wikidata.org/wiki/${selectedCity.wikiDataId}`, "_blank")}><ExternalLink /></Button>}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
