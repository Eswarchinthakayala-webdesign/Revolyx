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
  Menu,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";

// OPTIONAL: If your shadcn UI includes a Sheet component for mobile sidebars
// create/import it at the path below. If you don't have it, replace with Dialog or a simple div.
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";

/* ----------------------------------------
  Endpoints
---------------------------------------- */
const GRAPHQL_ENDPOINT = "https://geodb-free-service.wirefreethought.com/graphql";
const REST_BASE = "https://geodb-free-service.wirefreethought.com/v1/geo";

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

/* Build a GraphQL fetch helper with graceful fallback handling */
async function runGraphQL(query, variables = {}) {
  const res = await fetch(GRAPHQL_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`GraphQL request failed (${res.status}) ${text}`);
  }
  const json = await res.json();
  if (json.errors) {
    // bubble GraphQL errors as an Error object so calling code can switch to fallback
    const msg = json.errors.map((e) => e.message).join(", ");
    const err = new Error(msg);
    err.graphql = true;
    throw err;
  }
  return json.data;
}

/* Build a small REST fetch helper for fallback */
async function runREST(path, params = {}) {
  const url = new URL(`${REST_BASE}${path}`);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString(), {
    headers: { "content-type": "application/json" },
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`REST request failed (${res.status}) ${txt}`);
  }
  return await res.json();
}

/* Helper to build OSM embed */
function buildOSMEmbed(lat, lon, zoom = 10) {
  if (typeof lat !== "number" || typeof lon !== "number") return null;
  const latPad = 0.05;
  const lonPad = 0.05;
  const bbox = `${lon - lonPad},${lat - latPad},${lon + lonPad},${lat + latPad}`;
  return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`;
}

/* ----------------------------------------
  GraphQL queries (primary and fallback)
---------------------------------------- */
const SUGGEST_QUERY = `
query CitiesByPrefix($namePrefix: String!, $limit: Int!) {
  cities(namePrefix: $namePrefix, limit: $limit) {
    id
    name
    country {
      name
      code
    }
    region { name }
    latitude
    longitude
    population
  }
}
`;

/* alternate GraphQL query for schemas that don't expose "cities" */
const SUGGEST_QUERY_ALT = `
query CitiesByPrefix($namePrefix: String!, $limit: Int!) {
  populatedPlaces(namePrefix: $namePrefix, limit: $limit) {
    id
    name
    country {
      name
      code
    }
    region { name }
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
    country { name code }
    region { name }
    population
    elevationMeters
    latitude
    longitude
    timezone
    wikiDataId
  }
}
`;

/* fallback details query (if `city` not present) */
const DETAILS_QUERY_ALT = `
query CityDetails($id: ID!) {
  populatedPlace(id: $id) {
    id
    name
    country { name code }
    region { name }
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

  // mobile sheet state
  const [sheetOpen, setSheetOpen] = useState(false);

  const suggestTimer = useRef(null);

  /* try to load defaults (delhi) on mount */
  useEffect(() => {
    (async () => {
      try {
        setLoadingSuggest(true);
        const items = await fetchSuggestionsInternal("delhi", 6);
        setSuggestions(items);
        if (items.length > 0) await fetchDetails(items[0].id);
      } catch (err) {
        console.error(err);
        showToast("error", "Failed to load default city");
      } finally {
        setLoadingSuggest(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* small internal function that tries GraphQL (primary -> alt) then REST */
  async function fetchSuggestionsInternal(namePrefix, limit = 8) {
    // try GraphQL primary
    try {
      const data = await runGraphQL(SUGGEST_QUERY, { namePrefix, limit });
      if (data?.cities) return Array.isArray(data.cities) ? data.cities : [];
    } catch (err) {
      // if GraphQL returned "FieldUndefined" for cities, try the alternate query
      console.warn("primary suggest query failed, trying alternate", err?.message ?? err);
      try {
        const dataAlt = await runGraphQL(SUGGEST_QUERY_ALT, { namePrefix, limit });
        if (dataAlt?.populatedPlaces) return Array.isArray(dataAlt.populatedPlaces) ? dataAlt.populatedPlaces : [];
      } catch (err2) {
        console.warn("alternate suggest query failed, trying REST fallback", err2?.message ?? err2);
      }
    }

    // final fallback: REST endpoint
    try {
      const rest = await runREST("/cities", { namePrefix, limit });
      // REST response shape: data (array) or data.data depending on server; be defensive
      const arr = rest?.data ?? rest?.data?.data ?? rest?.items ?? rest;
      // Many GeoDB REST responses use .data as array, or { data: [cities], metadata: {...} }
      if (Array.isArray(arr)) return arr;
      // If object with data array
      if (arr && Array.isArray(arr.data)) return arr.data;
      // If response directly contains items in `data` field
      if (rest?.data && Array.isArray(rest.data)) return rest.data;
      return [];
    } catch (restErr) {
      console.error("REST fallback failed", restErr);
      return [];
    }
  }

  /* Fetch details for chosen city — GraphQL primary -> alt -> REST */
  async function fetchDetails(id) {
    if (!id) return;
    setLoadingDetails(true);
    try {
      // Try GraphQL primary
      try {
        const data = await runGraphQL(DETAILS_QUERY, { id });
        const c = data?.city ?? null;
        if (c) {
          setSelectedCity(c);
          setRawResp(c);
          setShowRaw(false);
          showToast("success", `Loaded: ${c?.name}`);
          return;
        }
      } catch (gErr) {
        console.warn("DETAILS_QUERY failed, trying alternative or REST", gErr?.message ?? gErr);
        // Try alternate GraphQL field
        try {
          const dataAlt = await runGraphQL(DETAILS_QUERY_ALT, { id });
          const cAlt = dataAlt?.populatedPlace ?? null;
          if (cAlt) {
            setSelectedCity(cAlt);
            setRawResp(cAlt);
            setShowRaw(false);
            showToast("success", `Loaded: ${cAlt?.name}`);
            return;
          }
        } catch (gErr2) {
          console.warn("DETAILS_QUERY_ALT failed; will try REST", gErr2?.message ?? gErr2);
        }
      }

      // REST fallback: GET /cities/{id}
      try {
        // The REST id can be a geo DB id (e.g., Q...); endpoint: /v1/geo/cities/{id}
        const rest = await runREST(`/cities/${encodeURIComponent(id)}`);
        // rest.data may contain the city details
        const payload = rest?.data ?? rest;
        setSelectedCity(payload);
        setRawResp(payload);
        setShowRaw(false);
        showToast("success", `Loaded: ${payload?.name || id}`);
      } catch (restErr) {
        console.error(restErr);
        showToast("error", "Failed to load city details via REST");
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to load city details");
    } finally {
      setLoadingDetails(false);
    }
  }

  /* Debounced suggestions from UI */
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
        const items = await fetchSuggestionsInternal(v, 8);
        setSuggestions(items);
      } catch (err) {
        console.error(err);
        setSuggestions([]);
      } finally {
        setLoadingSuggest(false);
      }
    }, 300);
  }

  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query || query.trim().length === 0) {
      showToast("info", "Search cities by name (e.g. 'delhi')");
      return;
    }
    setLoadingSuggest(true);
    try {
      const items = await fetchSuggestionsInternal(query, 10);
      setSuggestions(items);
      if (items.length > 0) {
        await fetchDetails(items[0].id);
        setShowSuggest(false);
        setSheetOpen(false);
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
    <div className={clsx("min-h-screen p-4 md:p-6 overflow-hidden max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-row items-start md:items-center justify-between gap-4 mb-4">
        <div>
          <h1 className={clsx("text-2xl md:text-4xl font-extrabold")}>Atlas — City Explorer</h1>
          <p className="mt-1 text-sm opacity-70">Search global cities via GeoDB (GraphQL/REST). Click a suggestion to view details and map.</p>
        </div>

        {/* Mobile: open sheet */}
        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-[560px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
              <Search className="opacity-60" />
              <Input
                placeholder="Search city names, e.g. 'delhi', 'london'..."
                value={query}
                onChange={(e) => onQueryChange(e.target.value)}
                className="border-0 shadow-none bg-transparent"
                onFocus={() => setShowSuggest(true)}
              />
              <Button className="cursor-pointer" type="submit" variant="outline" aria-label="Search">
                <Search />
              </Button>
            </form>
          </div>

          {/* Small-screen: open sheet trigger */}
          <div className="md:hidden">
            {/* If you have SheetTrigger, use it — otherwise use a Button that toggles sheetOpen */}
            <Button className="cursor-pointer" variant="outline" onClick={() => setSheetOpen(true)} aria-label="Open search">
              <Menu />
            </Button>
          </div>
        </div>
      </header>

      {/* suggestions (absolute dropdown on desktop) */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={clsx(
              "absolute z-50 left-4 right-4 md:left-[calc(50%_-_280px)] md:right-auto max-w-4xl rounded-xl overflow-hidden shadow-xl",
              isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200"
            )}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s) => (
              <li
                key={s.id}
                className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer"
                onClick={() => {
                  fetchDetails(s.id);
                  setShowSuggest(false);
                  setSheetOpen(false);
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => (e.key === "Enter" ? fetchDetails(s.id) : null)}
              >
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

      {/* Mobile Sheet for search & suggestions */}
      {/* If your project doesn't have Sheet, the imported components will fail — swap with Dialog/Modal */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className=" p-4">
          <div className="flex items-center gap-2 mb-3 mr-10">
            <Input
              placeholder="Search city names, e.g. 'delhi'"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none"
              onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit(e)}
            />
            <Button className="cursor-pointer" variant="outline" onClick={handleSearchSubmit}><Search /></Button>

          </div>
          <div className="space-y-2">
            <div className="text-xs opacity-60">Suggestions</div>
            <ScrollArea className="h-64 overflow-y-auto p-2 rounded border">
              {loadingSuggest && <div className="text-sm opacity-60">Searching…</div>}
              {!loadingSuggest && suggestions.length === 0 && <div className="text-sm opacity-60">No suggestions</div>}
              {suggestions.map((s) => (
                <div
                  key={s.id}
                  className="py-2 px-2 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer"
                  onClick={() => {
                    fetchDetails(s.id);
                    setSheetOpen(false);
                    setShowSuggest(false);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs opacity-60">{s.region?.name || "—"} • {s.country?.name || "—"}</div>
                    </div>
                    <div className="text-xs opacity-60">{s.population ? `${s.population.toLocaleString()}` : "—"}</div>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>
        </SheetContent>
      </Sheet>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Center viewer */}
        <section className="lg:col-span-9 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center flex-wrap gap-3 justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg flex items-center gap-2"><Map /> City Details</CardTitle>
                <div className="text-xs opacity-60">{selectedCity?.name || "Select a city from suggestions..."}</div>
              </div>

              <div className="flex items-center flex-wrap gap-2">
                <Button className="cursor-pointer" variant="outline" onClick={() => { if (selectedCity?.id) fetchDetails(selectedCity.id); else handleSearchSubmit(); }}>
                  <Loader2 className={loadingDetails ? "animate-spin" : ""} /> Refresh
                </Button>

                <Button className="cursor-pointer" variant="ghost" onClick={() => setShowRaw((s) => !s)}><List /> {showRaw ? "Hide" : "Raw"}</Button>

                <Button className="cursor-pointer" variant="ghost" onClick={() => setDialogOpen(true)}><MapPin /> View Map</Button>

                <Button className="cursor-pointer" variant="outline" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loadingDetails ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !selectedCity ? (
                <div className="py-12 text-center text-sm opacity-60">No city selected — try the search above.</div>
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

                    <div className="text-lg font-semibold flex items-center gap-2">
                      <span>{selectedCity.name}</span>
                      <span className="text-xs opacity-60">• {selectedCity.country?.code}</span>
                    </div>
                    <div className="text-xs opacity-60">{selectedCity.region?.name || "—"} • {selectedCity.country?.name || "—"}</div>

                    <div className="mt-3 space-y-2 text-sm">
                      <div>
                        <div className="text-xs opacity-60 flex items-center gap-2"><Users className="w-4 h-4" /> Population</div>
                        <div className="font-medium">{selectedCity.population ? selectedCity.population.toLocaleString() : "—"}</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60 flex items-center gap-2"><Map className="w-4 h-4" /> Coordinates</div>
                        <div className="font-medium">{selectedCity.latitude ?? "—"}, {selectedCity.longitude ?? "—"}</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60 flex items-center gap-2"><Globe className="w-4 h-4" /> Timezone</div>
                        <div className="font-medium">{selectedCity.timezone || "—"}</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60 flex items-center gap-2"><Flag className="w-4 h-4" /> Elevation (m)</div>
                        <div className="font-medium">{selectedCity.elevationMeters ?? "—"}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      {selectedCity.wikiDataId ? (
                        <Button className="cursor-pointer" variant="outline" onClick={() => window.open(`https://www.wikidata.org/wiki/${selectedCity.wikiDataId}`, "_blank")}><ExternalLink /> WikiData</Button>
                      ) : (
                        <Button className="cursor-pointer" variant="outline" onClick={() => showToast("info", "No WikiData id")}>WikiData</Button>
                      )}
                    </div>
                  </div>

                  {/* Right: details */}
                  <div className={clsx("p-4 rounded-xl border col-span-1 md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-sm font-semibold mb-2">Overview</div>
                    <div className="text-sm leading-relaxed mb-3">
                      <strong>{selectedCity.name}</strong> — region: {selectedCity.region?.name || "—"}, country: {selectedCity.country?.name || "—"}.
                    </div>

                    <Separator className="my-3" />

                    <div className="text-sm font-semibold mb-2">Key Facts</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div className="p-2 rounded-md border flex items-center gap-2">
                        <Flag className="w-4 h-4 opacity-70" />
                        <div>
                          <div className="text-xs opacity-60">Country</div>
                          <div className="text-sm font-medium">{selectedCity.country?.name || "—"}</div>
                        </div>
                      </div>

                      <div className="p-2 rounded-md border flex items-center gap-2">
                        <Map className="w-4 h-4 opacity-70" />
                        <div>
                          <div className="text-xs opacity-60">Region</div>
                          <div className="text-sm font-medium">{selectedCity.region?.name || "—"}</div>
                        </div>
                      </div>

                      <div className="p-2 rounded-md border flex items-center gap-2">
                        <Users className="w-4 h-4 opacity-70" />
                        <div>
                          <div className="text-xs opacity-60">Population</div>
                          <div className="text-sm font-medium">{selectedCity.population ? selectedCity.population.toLocaleString() : "—"}</div>
                        </div>
                      </div>

                      <div className="p-2 rounded-md border flex items-center gap-2">
                        <MapPin className="w-4 h-4 opacity-70" />
                        <div>
                          <div className="text-xs opacity-60">Coordinates</div>
                          <div className="text-sm font-medium">{selectedCity.latitude ?? "—"}, {selectedCity.longitude ?? "—"}</div>
                        </div>
                      </div>

                      <div className="p-2 rounded-md border flex items-center gap-2">
                        <Globe className="w-4 h-4 opacity-70" />
                        <div>
                          <div className="text-xs opacity-60">Timezone</div>
                          <div className="text-sm font-medium">{selectedCity.timezone || "—"}</div>
                        </div>
                      </div>

                      <div className="p-2 rounded-md border flex items-center gap-2">
                        <Info className="w-4 h-4 opacity-70" />
                        <div>
                          <div className="text-xs opacity-60">Elevation (m)</div>
                          <div className="text-sm font-medium">{selectedCity.elevationMeters ?? "—"}</div>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="text-sm font-semibold mb-2">Developer / Meta</div>
                    <div className="text-xs opacity-60 mb-2">GraphQL/REST fields returned</div>
                    <div className="grid grid-cols-1 gap-2">
                      <div className="p-2 rounded-md border flex items-center justify-between">
                        <div className="flex items-center gap-2"><Database className="w-4 h-4" /><div className="text-xs opacity-60">City ID</div></div>
                        <div className="text-sm font-medium">{selectedCity.id}</div>
                      </div>

                      <div className="p-2 rounded-md border flex items-center justify-between">
                        <div className="flex items-center gap-2"><List className="w-4 h-4" /><div className="text-xs opacity-60">Raw response (toggle)</div></div>
                        <div>
                          {selectedCity ? <Button className="cursor-pointer" variant="ghost" onClick={() => setShowRaw((s) => !s)}><Database /> Toggle raw</Button> : "—"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            <AnimatePresence>
              {showRaw && rawResp && (
                <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("p-4 border-t", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                  <ScrollArea className="h-72 p-2">
                    <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")}>
                      {prettyJSON(rawResp)}
                    </pre>
                  </ScrollArea>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* Right: developer/tools panel */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold mb-1">Developer</div>
              <div className="text-xs opacity-60">GraphQL / REST endpoint & samples</div>
            </div>
            <div className="hidden md:flex gap-2">
              <Button className="cursor-pointer" variant="ghost" onClick={() => setShowRaw((s) => !s)} title="Toggle raw"><List /></Button>
            </div>
          </div>

          <div className="space-y-2 flex gap-1">
            <Button className="cursor-pointer" variant="outline" onClick={() => copyEndpoint()}><Copy /> Copy sample</Button>
            <Button className="cursor-pointer" variant="outline" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
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
        </aside>
      </main>

      {/* Map dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-4xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
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
              <Button className="cursor-pointer" variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
              {selectedCity?.wikiDataId && <Button className="cursor-pointer" variant="outline" onClick={() => window.open(`https://www.wikidata.org/wiki/${selectedCity.wikiDataId}`, "_blank")}><ExternalLink /></Button>}
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
