// src/pages/CityBikesPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper"; // keep your toast wrapper
import {
  Search,
  MapPin,
  ExternalLink,
  Loader2,
  Copy,
  Download,
  List,
  ImageIcon,
  X,
  Star,
  Loader,
  Map as MapIcon,
  Grid,
  Menu,
  ChevronLeft
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";

/* sheet (mobile sidebar) — shadcn style */
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

/* Mapping: react-leaflet + leaflet (OpenStreetMap tiles) */
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

/* ---------- CityBikes API ---------- */
const BASE_ENDPOINT = "https://api.citybik.es/v2/networks";

/* ---------- Helper ---------- */
function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

/* Fix Leaflet default icon path issue (for most bundlers) */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

/* Helper component to programmatically move map center */
function MapCenterer({ center, zoom = 5 }) {
  const map = useMap();
  useEffect(() => {
    if (!center) return;
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

/* ---------- Main Page ---------- */
export default function CityBikesPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-color-scheme: dark)")?.matches);

  // Search state
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]); // networks matching query
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  // Data
  const [networks, setNetworks] = useState([]); // all networks from API
  const [rawResp, setRawResp] = useState(null);
  const [loadingNetworks, setLoadingNetworks] = useState(false);

  // UI / selection
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [mapDialogOpen, setMapDialogOpen] = useState(false); // map-in-dialog
  const [rawDialogOpen, setRawDialogOpen] = useState(false); // raw JSON dialog
  const [sheetOpen, setSheetOpen] = useState(false); // mobile sheet for networks

  const suggestTimer = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    // initial load
    fetchNetworks();
    // cleanup on unmount
    return () => {
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
    };
  }, []);

  /* Fetch all networks once */
  async function fetchNetworks() {
    setLoadingNetworks(true);
    try {
      const res = await fetch(BASE_ENDPOINT);
      if (!res.ok) {
        showToast("error", `Failed to load networks (${res.status})`);
        setLoadingNetworks(false);
        return;
      }
      const json = await res.json();
      const items = json.networks || [];
      setNetworks(items);
      setRawResp(json);
      if (items.length > 0) {
        setSelectedNetwork(items[0]);
      }
      showToast("success", `Loaded ${items.length} networks`);
    } catch (err) {
      console.error(err);
      showToast("error", "Error fetching CityBikes networks");
    } finally {
      setLoadingNetworks(false);
    }
  }

  async function searchNetworks(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);
    try {
      const low = q.trim().toLowerCase();
      // local client-side search across networks
      const matches = networks.filter((n) => {
        const name = (n.name || "").toLowerCase();
        const city = (n.location?.city || "").toLowerCase();
        const country = (n.location?.country || "").toLowerCase();
        return (
          name.includes(low) ||
          city.includes(low) ||
          country.includes(low) ||
          (n.id || "").toLowerCase().includes(low)
        );
      });
      setSuggestions(matches.slice(0, 50)); // cap suggestions
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
      searchNetworks(v);
    }, 250);
  }

  function handleSelectNetwork(n, openMap = false, openSheetClose = true) {
    setSelectedNetwork(n);
    setShowSuggest(false);
    if (openMap) {
      setMapDialogOpen(true);
    }
    if (openSheetClose) setSheetOpen(false);
  }

  function copyEndpoint() {
    navigator.clipboard.writeText(BASE_ENDPOINT);
    showToast("success", "Endpoint copied");
  }

  function downloadJSON() {
    const payload = rawResp || networks;
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `citybikes_networks.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  /* Derived: map center */
  const mapCenter = useMemo(() => {
    if (selectedNetwork?.location?.latitude && selectedNetwork?.location?.longitude) {
      return [selectedNetwork.location.latitude, selectedNetwork.location.longitude];
    }
    // fallback to world view
    return [20, 0];
  }, [selectedNetwork]);

  /* Ensure map shows properly when dialog opens:
     invalidateSize and optionally setView */
  useEffect(() => {
    if (!mapDialogOpen) return;
    // small timeout to wait for dialog animation/layout
    const t = setTimeout(() => {
      try {
        if (mapRef.current) {
          mapRef.current.invalidateSize && mapRef.current.invalidateSize();
          mapRef.current.setView && mapRef.current.setView(mapCenter, selectedNetwork ? 10 : 2, { animate: true });
        }
      } catch (err) {
        // ignore
      }
    }, 260); // matches typical dialog animation; adjust as needed
    return () => clearTimeout(t);
  }, [mapDialogOpen, mapCenter, selectedNetwork]);

  /* helper to render country badge text */
  function countryBadgeText(n) {
    const country = n?.location?.country;
    const city = n?.location?.city;
    if (country) return country.slice(0, 2).toUpperCase();
    if (city) return city.slice(0, 2).toUpperCase();
    return "NB";
  }

  return (
    <div className={clsx("min-h-screen p-4 md:p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-2xl md:text-3xl lg:text-4xl font-extrabold flex items-center gap-3")}>
            <MapIcon className="opacity-80" />
            <span>CityBikes — Networks Explorer</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground max-w-2xl">
            Browse public bike-sharing networks worldwide — search, open network API, view details and explore on the map.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Mobile menu trigger (Sheet) */}
          <div className="md:hidden">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="px-2 h-10  cursor-pointer">
                  <Menu />
                </Button>
              </SheetTrigger>
              <SheetContent className="z-999" position="left" size="full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ChevronLeft className="cursor-pointer" onClick={() => setSheetOpen(false)} />
                    <h3 className="text-lg font-semibold">Networks</h3>
                  </div>
        
                </div>
                <ScrollArea className="h-[80vh]">
                  <div className="space-y-2">
                    {(suggestions.length > 0 ? suggestions : networks).slice(0, 1000).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleSelectNetwork(n, true)}
                        className="flex items-center gap-3 p-3 rounded-md hover:bg-muted cursor-pointer"
                        role="button"
                      >
                        <div className="w-10 h-10 rounded-md flex items-center justify-center bg-muted text-xs font-medium">
                          {countryBadgeText(n)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium truncate">{n.name}</div>
                          <div className="text-xs opacity-60 truncate">{n.location?.city || "—"}, {n.location?.country || "—"}</div>
                        </div>
                        <div className="text-xs opacity-60">{n.id}</div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>

          {/* Search */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              searchNetworks(query);
            }}
            className={clsx(
              "flex items-center gap-2 w-full md:w-[640px] rounded-lg px-3 py-2",
              isDark ? "bg-zinc-900/60 border border-zinc-800" : "bg-white border border-zinc-200"
            )}
            role="search"
          >
            <Search className="opacity-60" />
            <Input
              aria-label="Search bike networks"
              placeholder="Search networks, city, country — e.g. 'Paris', 'PBSC', 'Oslo'..."
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="outline" className="px-3 cursor-pointer" onClick={() => { setQuery(""); setSuggestions([]); setShowSuggest(false); }}>Clear</Button>
            <Button type="submit" variant="outline" className="px-3 cursor-pointer" aria-label="Search">
              <Search />
            </Button>
          </form>
        </div>
      </header>

      {/* Suggestions (desktop) */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={clsx(
              "absolute z-50 left-4 right-4 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl",
              isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-200"
            )}
          >
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.slice(0, 40).map((s, idx) => (
              <li
                key={s.id || idx}
                className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer"
                onClick={() => handleSelectNetwork(s)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === "Enter") handleSelectNetwork(s); }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-xs font-medium">
                    {countryBadgeText(s)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs opacity-60">{s.location?.city || "—"} • {s.location?.country || "—"}</div>
                  </div>
                  <div className="text-xs opacity-60">{s.id}</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: list of networks (desktop) */}
        <section className="hidden lg:block lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4 flex items-center justify-between", isDark ? "bg-zinc-900/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg flex items-center gap-2"><Grid /> Networks</CardTitle>
                <div className="text-xs opacity-60">Search or scroll the full list</div>
              </div>
              <div className="text-xs opacity-60">{loadingNetworks ? "Loading…" : `${networks.length} total`}</div>
            </CardHeader>

            <CardContent>
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="text-sm opacity-60">Showing {suggestions.length > 0 ? suggestions.length : networks.length} networks</div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="cursor-pointer" onClick={() => { setSelectedNetwork(networks[0] || null); showToast("success", "Reset to first network"); }}>
                    <Loader2 className={loadingNetworks ? "animate-spin" : ""} /> Reset
                  </Button>
                </div>
              </div>

              <div className="h-[60vh] overflow-auto">
                <ScrollArea className="h-full">
                  <div className="space-y-2 p-1">
                    {(suggestions.length > 0 ? suggestions : networks).slice(0, 500).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleSelectNetwork(n)}
                        className="flex items-center gap-3  p-2 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800/40 cursor-pointer"
                      >
                        <div className="w-10 h-10 rounded-md flex items-center justify-center bg-zinc-100 dark:bg-zinc-800 text-xs font-medium">
                          {countryBadgeText(n)}
                        </div>
                        <div className="flex flex-col items-start">
                        <div className="">
                          <div className="font-medium ">{n.name}</div>
                          <div className="text-xs opacity-60">{n.location?.city || "—"}, {n.location?.country || "—"}</div>
                        </div>
                        <div className="text-xs opacity-60">{n.id}</div>
                        </div>
                      </div>
                    ))}
                    {(!networks || networks.length === 0) && (
                      <div className="p-4 text-sm opacity-60">No networks loaded.</div>
                    )}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Center: map + details */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-zinc-900/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4 flex items-center justify-between", isDark ? "bg-zinc-900/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg flex items-center gap-2"><MapIcon /> Map & Details</CardTitle>
                <div className="text-xs opacity-60">{selectedNetwork ? selectedNetwork.name : "Select a network to view details"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => { setSelectedNetwork(networks[0] || null); showToast("success", "Reset to first network"); }} className="cursor-pointer">
                  <Loader className={loadingNetworks ? "animate-spin" : ""} /> Reset
                </Button>

                {/* Image -> opens map dialog */}
                <Button variant="ghost" onClick={() => setMapDialogOpen(true)} className="cursor-pointer">
                  <ImageIcon /> View map
                </Button>

                {/* Raw */}
                <Button variant="ghost" onClick={() => setRawDialogOpen(true)} className="cursor-pointer">
                  <List /> Raw
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {/* Map preview */}
              <div style={{ height: "52vh", width: "100%" }}>
                <MapContainer
                  center={mapCenter}
                  zoom={selectedNetwork ? 10 : 2}
                  style={{ height: "100%", width: "100%" }}
                  whenCreated={(mapInstance) => {
                    mapRef.current = mapInstance;
                  }}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <MapCenterer center={mapCenter} zoom={selectedNetwork ? 10 : 2} />
                  {/* Markers for visible networks (reduce to a few hundred for performance) */}
                  {networks.slice(0, 1000).map((n) => {
                    const lat = n.location?.latitude;
                    const lon = n.location?.longitude;
                    if (!lat || !lon) return null;
                    return (
                      <Marker key={n.id} position={[lat, lon]} eventHandlers={{ click: () => handleSelectNetwork(n) }}>
                        <Popup>
                          <div className="min-w-[200px]">
                            <div className="font-medium">{n.name}</div>
                            <div className="text-xs opacity-60">{n.location?.city || "—"} • {n.location?.country || "—"}</div>
                            <div className="mt-2 flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleSelectNetwork(n)}>Open</Button>
                              <Button variant="ghost" size="sm" onClick={() => { setSelectedNetwork(n); setMapDialogOpen(true); }}>View</Button>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                </MapContainer>
              </div>

              {/* Details */}
              <div className={clsx("p-4", isDark ? "bg-zinc-900/30 border-t border-zinc-800" : "bg-white/60 border-t border-zinc-200")}>
                {!selectedNetwork ? (
                  <div className="py-6 text-sm opacity-60">Select a network from the list or the map.</div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={clsx("p-3 rounded-xl border col-span-1 md:col-span-1", isDark ? "bg-zinc-900/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                      <div className="text-lg font-semibold mb-1 flex items-center justify-between">
                        <div>{selectedNetwork.name}</div>
                        <div className="text-sm opacity-60">{countryBadgeText(selectedNetwork)}</div>
                      </div>
                      <div className="text-xs opacity-60">{selectedNetwork.location?.city || "—"} • {selectedNetwork.location?.country || "—"}</div>
                      <div className="mt-3 text-sm">
                        <div className="text-xs opacity-60">Company</div>
                        <div className="font-medium">{Array.isArray(selectedNetwork.company) ? selectedNetwork.company.join(", ") : (selectedNetwork.company || "—")}</div>
                      </div>

                      <div className="mt-3 space-y-2">
                        <div className="text-xs opacity-60">Coordinates</div>
                        <div className="font-medium">{selectedNetwork.location?.latitude ?? "—"}, {selectedNetwork.location?.longitude ?? "—"}</div>
                      </div>

                      <div className="mt-4 flex flex-col gap-2">
                        <Button variant="outline" onClick={() => { if (selectedNetwork.href) window.open(`https://api.citybik.es${selectedNetwork.href}`, "_blank"); else showToast("info", "No API href"); }} className="cursor-pointer"><ExternalLink /> API</Button>
                        <Button variant="outline" onClick={() => { window.open(`https://www.google.com/maps/search/?api=1&query=${selectedNetwork.location?.latitude},${selectedNetwork.location?.longitude}`, "_blank"); }} className="cursor-pointer"><MapPin /> Open in Maps</Button>
                      </div>
                    </div>

                    <div className={clsx("p-3 rounded-xl border col-span-1 md:col-span-2", isDark ? "bg-zinc-900/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                      <div className="text-sm font-semibold mb-2">Description / Fields</div>
                      <div className="text-sm mb-3">
                        {selectedNetwork.extra?.info || selectedNetwork.location?.city ? (
                          <span>{selectedNetwork.extra?.info || `Bike network in ${selectedNetwork.location.city}`}</span>
                        ) : "No description available."}
                      </div>

                      <Separator className="my-3" />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-auto">
                        {Object.keys(selectedNetwork).map((k) => (
                          <div key={k} className="p-2 rounded-md border">
                            <div className="text-xs opacity-60">{k}</div>
                            <div className="text-sm font-medium break-words">{typeof selectedNetwork[k] === "object" ? JSON.stringify(selectedNetwork[k]) : (selectedNetwork[k] ?? "—")}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Right: quick actions / developer */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-zinc-900/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold mb-2 flex items-center gap-2"><List /> Quick Actions</div>
            <div className="text-xs opacity-60">Utilities for data & developer</div>
            <div className="mt-3 flex flex-wrap gap-1 space-y-2">
              <Button variant="outline" onClick={() => copyEndpoint()} className="cursor-pointer"><Copy /> Copy Endpoint</Button>
              <Button variant="outline" onClick={() => downloadJSON()} className="cursor-pointer"><Download /> Download JSON</Button>
              <Button variant="outline" onClick={() => setRawDialogOpen(true)} className="cursor-pointer"><List /> Toggle Raw</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Selected network</div>
            {selectedNetwork ? (
              <div className="text-sm opacity-70">
                <div className="font-medium">{selectedNetwork.name}</div>
                <div className="text-xs opacity-60">{selectedNetwork.location?.city}, {selectedNetwork.location?.country}</div>
                <div className="mt-2 flex gap-2">
                  <Button variant="ghost" onClick={() => { navigator.clipboard.writeText(prettyJSON(selectedNetwork)); showToast("success", "Copied network JSON"); }} className="cursor-pointer"><Copy /> Copy JSON</Button>
                  <Button variant="outline" onClick={() => { window.open(`https://api.citybik.es${selectedNetwork.href}`, "_blank"); }} className="cursor-pointer"><ExternalLink /> Open API</Button>
                </div>
              </div>
            ) : (
              <div className="text-sm opacity-60">No network selected</div>
            )}
          </div>

          <Separator />

          <div>
            <div className="text-xs opacity-60">Developer notes</div>
            <div className="text-sm opacity-70 mt-2">This view loads the full citybik.es networks endpoint and plots available coordinates. For large data sets consider server-side paging or an index API.</div>
          </div>
        </aside>
      </main>

      {/* Map Dialog (shows same map but in a dialog container) */}
      <Dialog open={mapDialogOpen} onOpenChange={setMapDialogOpen}>
        <DialogContent className={clsx("max-w-6xl w-full p-3 z-999 rounded-2xl overflow-hidden", isDark ? "bg-zinc-900" : "bg-white")}>
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapIcon /> {selectedNetwork ? selectedNetwork.name : "World map"}
                <div className="text-xs opacity-60 ml-2">{selectedNetwork ? `${selectedNetwork.location?.city || ""} • ${selectedNetwork.location?.country || ""}` : ""}</div>
              </div>
             
            </DialogTitle>
          </DialogHeader>

          <div style={{ height: "70vh", width: "100%" }}>
            <MapContainer
              center={mapCenter}
              zoom={selectedNetwork ? 10 : 2}
              style={{ height: "100%", width: "100%" }}
              whenCreated={(mapInstance) => {
                mapRef.current = mapInstance;
              }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapCenterer center={mapCenter} zoom={selectedNetwork ? 10 : 2} />
              {networks.slice(0, 1000).map((n) => {
                const lat = n.location?.latitude;
                const lon = n.location?.longitude;
                if (!lat || !lon) return null;
                return (
                  <Marker key={n.id} position={[lat, lon]} eventHandlers={{ click: () => handleSelectNetwork(n, false, true) }}>
                    <Popup>
                      <div className="min-w-[200px]">
                        <div className="font-medium">{n.name}</div>
                        <div className="text-xs opacity-60">{n.location?.city || "—"} • {n.location?.country || "—"}</div>
                        <div className="mt-2 flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleSelectNetwork(n)}>Open</Button>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MapContainer>
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Map — data from citybik.es</div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => { if (mapRef.current && selectedNetwork) { mapRef.current.setView([selectedNetwork.location.latitude, selectedNetwork.location.longitude], 12, { animate: true }); } }} className="cursor-pointer"><MapPin /> Center</Button>
              <Button variant="ghost" onClick={() => setMapDialogOpen(false)} className="cursor-pointer"><X /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Raw JSON dialog */}
      <Dialog open={rawDialogOpen} onOpenChange={setRawDialogOpen}>
        <DialogContent className={clsx("max-w-4xl w-full p-3 z-999 rounded-2xl overflow-hidden", isDark ? "bg-zinc-900" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{selectedNetwork ? `${selectedNetwork.name} — JSON` : "Raw Data"}</DialogTitle>
          </DialogHeader>

          <div style={{ maxHeight: "60vh", overflow: "auto", padding: 16 }}>
            <pre className={clsx("text-xs", isDark ? "text-zinc-200" : "text-zinc-900")}>
              {selectedNetwork ? prettyJSON(selectedNetwork) : prettyJSON(rawResp)}
            </pre>
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Data from citybik.es</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => { setRawDialogOpen(false); }} className="cursor-pointer"><X /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
