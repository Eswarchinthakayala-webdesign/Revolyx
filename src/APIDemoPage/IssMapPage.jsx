// IssMapPage.jsx
"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  MapPin,
  Loader2,
  RefreshCw,
  ExternalLink,
  Download,
  Copy,
  Globe,
  Eye,
  Satellite,
  Star,
  Menu,
  X,
  Map,
  Compass,
  Pin,
  Info,
  Orbit
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

// Map
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

/* API */
const ISS_ENDPOINT = "/api/iss/iss-now.json";

/* Static City Suggestions */
const CITY_SUGGESTIONS = [
  { id: "new_york", name: "New York, USA", lat: 40.7128, lon: -74.006 },
  { id: "london", name: "London, UK", lat: 51.5074, lon: -0.1278 },
  { id: "delhi", name: "New Delhi, India", lat: 28.6139, lon: 77.209 },
  { id: "tokyo", name: "Tokyo, Japan", lat: 35.6895, lon: 139.6917 },
  { id: "sydney", name: "Sydney, Australia", lat: -33.8688, lon: 151.2093 },
  { id: "cape_town", name: "Cape Town, SA", lat: -33.9249, lon: 18.4241 },
];

const defaultCenter = [20, 0];

/* Custom ISS Marker */
const createIssIcon = () =>
  new L.DivIcon({
    html: `<div class="rounded-full p-1 shadow-md" style="background:linear-gradient(135deg,#0ea5e9,#7c3aed);width:34px;height:34px;display:flex;align-items:center;justify-content:center;color:white;font-size:14px;">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24">
         <path d="M12 2v4M20 7l-4 1M4 7l4 1M12 22v-4M7 7l10 10"/>
      </svg>
    </div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });

/* ---------------------------- MAIN COMPONENT ---------------------------- */

export default function IssMapPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [iss, setIss] = useState(null);
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState(true);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [selectedCity, setSelectedCity] = useState(CITY_SUGGESTIONS[0]);

  const [query, setQuery] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [copyAnimated, setCopyAnimated] = useState(false);

  const mapRef = useRef(null);
  const pollRef = useRef(null);

  /* Fetch ISS Position */
  const fetchIss = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(ISS_ENDPOINT, { cache: "no-store" });
      const json = await res.json();

      const pos = json.iss_position || {};
      const latitude = parseFloat(pos.latitude);
      const longitude = parseFloat(pos.longitude);

      const next = {
        latitude,
        longitude,
        timestamp: Number(json.timestamp) || Date.now(),
        raw: json,
      };

      setIss(next);

      if (following && mapRef.current) {
        mapRef.current.setView([latitude, longitude], mapRef.current.getZoom(), {
          animate: true,
        });
      }
      setLoading(false);
    } catch (error) {
      console.error(error);
      showToast("error", "Failed to fetch ISS position");
      setLoading(false);
    }
  }, [following]);

  useEffect(() => {
    fetchIss();
    pollRef.current = setInterval(fetchIss, 5000);
    return () => clearInterval(pollRef.current);
  }, [fetchIss]);

  /* Search Suggestions */
  useEffect(() => {
    if (!query.trim()) return setSuggestions([]);
    const q = query.toLowerCase();
    setSuggestions(CITY_SUGGESTIONS.filter((c) => c.name.toLowerCase().includes(q)));
  }, [query]);

  const chooseCity = (city) => {
    setSelectedCity(city);
    setQuery(city.name);
    setShowSuggest(false);
    setFollowing(false);

    if (mapRef.current) {
      mapRef.current.setView([city.lat, city.lon], 5, { animate: true });
    }
  };

  /* Copy with animation */
  const copyCoords = async () => {
    if (!iss) return;

    const text = `${iss.latitude}, ${iss.longitude}`;
    await navigator.clipboard.writeText(text);

    setCopyAnimated(true);
    setTimeout(() => setCopyAnimated(false), 1200);
  };

  const downloadJson = () => {
    const blob = new Blob([JSON.stringify(iss?.raw ?? {}, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `iss_${Date.now()}.json`;
    a.click();
  };

  const openExternal = () => {
    if (!iss) return;
    const { latitude, longitude } = iss;
    window.open(
      `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=6/${latitude}/${longitude}`,
      "_blank"
    );
  };

  /* Haversine Distance Function */
  const haversineDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371;

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) ** 2;

    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  };

  const onMapReady = (map) => (mapRef.current = map);

  /* ---------------------------- UI ---------------------------- */

  return (
    <div
      className={clsx(
        "min-h-screen p-4 md:p-6 max-w-9xl mx-auto relative",
      )}
    >
      {/* HEADER */}
      <header className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-extrabold flex items-center gap-2">
            <Orbit className="text-zinc-500" /> Aurora — ISS Tracker
          </h1>
          <p className="text-sm opacity-70">
            Real-time position of the International Space Station.
          </p>
        </div>

        {/* MOBILE MENU BUTTON */}
        <Sheet open={mobileMenu} onOpenChange={setMobileMenu}>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="outline" size="icon">
              <Menu />
            </Button>
          </SheetTrigger>

          <SheetContent side="right" className="w-[310px] p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle className="flex items-center gap-2">
                <Menu /> Menu
              </SheetTitle>
            </SheetHeader>

            <ScrollArea className="h-full p-4">
              <div className="flex flex-col gap-4">
                {/* reuse left + right card content */}
                <div className="space-y-4">
                  {/* Mobile copies of left side cards */}
                  <Button onClick={copyCoords} className="w-full" variant="outline">
                    <Copy /> Copy Coordinates
                  </Button>
                  <Button onClick={downloadJson} className="w-full" variant="outline">
                    <Download /> Download JSON
                  </Button>
                  <Button onClick={openExternal} className="w-full" variant="outline">
                    <ExternalLink /> Open in OSM
                  </Button>
                </div>
              </div>
            </ScrollArea>
          </SheetContent>
        </Sheet>

        {/* DESKTOP SEARCH */}
        <form
          className={clsx(
            "hidden lg:flex items-center gap-2 px-3 py-2 rounded-xl border shadow-sm w-[420px]",
            isDark ? "bg-black/40 border-zinc-800" : "bg-white"
          )}
          onSubmit={(e) => {
            e.preventDefault();
            if (suggestions.length > 0) chooseCity(suggestions[0]);
          }}
        >
          <Search className="opacity-70" />
          <Input
            placeholder="Search cities..."
            className="border-0 outline-none bg-transparent"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShowSuggest(true);
            }}
          />
          <Button type="submit" variant="outline">
            <Search />
          </Button>
        </form>
      </header>

      {/* SEARCH SUGGEST LIST */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -7 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -7 }}
            className={clsx(
              "absolute z-50 left-4 right-4 max-w-3xl mx-auto rounded-xl overflow-hidden shadow-xl",
              isDark ? "bg-black/90 border border-zinc-800" : "bg-white border"
            )}
          >
            {suggestions.map((s) => (
              <li
                key={s.id}
                onClick={() => chooseCity(s)}
                className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer flex items-center gap-3"
              >
                <MapPin />
                <div className="flex-1">
                  <div className="font-medium">{s.name}</div>
                  <div className="text-xs opacity-60">
                    Lat: {s.lat} — Lon: {s.lon}
                  </div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* MAIN LAYOUT */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT SECTION */}
        <section className="lg:col-span-3 space-y-4 hidden lg:block cursor-pointer">
          <Card
            className={clsx(
              "rounded-2xl border shadow",
              isDark ? "bg-black/40 border-zinc-800" : "bg-white"
            )}
          >
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Compass className="text-zinc-500" /> Location
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-3">
              <div>
                <div className="text-xs opacity-60 flex items-center gap-1">
                  <Pin /> City
                </div>
                <div className="font-medium">{selectedCity.name}</div>
              </div>

              <Separator />

              {iss ? (
                <div>
                  <div className="text-xs opacity-60 flex items-center gap-1">
                    <Satellite /> ISS Coordinates
                  </div>
                  <div className="font-medium">
                    {iss.latitude.toFixed(5)}, {iss.longitude.toFixed(5)}
                  </div>
                  <div className="text-xs opacity-60">
                    Updated: {new Date(iss.timestamp * 1000).toLocaleString()}
                  </div>

                  <div className="mt-2 text-sm">
                    Distance from {selectedCity.name}:{" "}
                    <span className="font-semibold">
                      {haversineDistance(
                        selectedCity.lat,
                        selectedCity.lon,
                        iss.latitude,
                        iss.longitude
                      ).toFixed(1)}{" "}
                      km
                    </span>
                  </div>
                </div>
              ) : (
                <div className="opacity-60 text-sm">Waiting for ISS data…</div>
              )}

              <Separator />

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setFollowing((v) => !v);
                  }}
                >
                  <Eye /> {following ? "Unfollow" : "Follow"}
                </Button>

                <Button variant="outline" onClick={fetchIss}>
                  <RefreshCw /> Refresh
                </Button>

                <Button variant="outline" onClick={() => setDialogOpen(true)}>
                  <Info /> Raw JSON
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* ABOUT CARD */}
          <Card
            className={clsx(
              "rounded-2xl border shadow",
              isDark ? "bg-black/40 border-zinc-800" : "bg-white"
            )}
          >
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Map className="text-zinc-500" /> About
              </CardTitle>
            </CardHeader>

            <CardContent>
              <p className="text-sm opacity-80 leading-relaxed">
                This tracker displays the live ISS position using the Open Notify
                API. Inspect, zoom, center on cities, and check distance in real time.
              </p>

              <Separator className="my-3" />

              <div className="flex flex-col gap-2">
                <Button
                  variant="ghost"
                  onClick={() => navigator.clipboard.writeText(ISS_ENDPOINT)}
                >
                  <Copy /> Copy Endpoint
                </Button>

                <Button variant="ghost" onClick={downloadJson}>
                  <Download /> Download JSON
                </Button>

                <Button variant="ghost" onClick={openExternal}>
                  <ExternalLink /> Open in OSM
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* CENTER — IMPROVED MAP UI */}
        <section className="lg:col-span-6 h-[70vh] md:h-[80vh] cursor-pointer">
          <Card
            className={clsx(
              "rounded-2xl overflow-hidden border shadow-xl h-full backdrop-blur",
              isDark ? "bg-black/40 border-zinc-800" : "bg-white"
            )}
          >
            <CardHeader className="p-4 flex items-center justify-between border-b">
              <div className="flex items-center gap-3">
                <MapPin className="text-zinc-500" />
                <div>
                  <div className="text-sm font-medium flex items-center gap-1">
                    Live ISS Map
                  </div>
                  <div className="text-xs opacity-60">
                    Drag, zoom, inspect satellite position
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {iss && (
                  <div className="text-xs opacity-60">
                    ISS: {iss.latitude.toFixed(2)}, {iss.longitude.toFixed(2)}
                  </div>
                )}
                {loading && <Loader2 className="animate-spin" />}

                {/* FOLLOW BUTTON */}
                <Button
                  variant={following ? "default" : "outline"}
                  onClick={() => setFollowing((f) => !f)}
                  className="cursor-pointer"
                >
                  {following ? <Eye /> : <Eye />} {following ? "Following" : "Follow"}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-0 h-full">
              <MapContainer
                center={mapCenter}
                zoom={3}
                scrollWheelZoom
                whenCreated={onMapReady}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  url={
                    isDark
                      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                      : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  }
                />

                {iss && (
                  <>
                    <Marker
                      position={[iss.latitude, iss.longitude]}
                      icon={createIssIcon()}
                    >
                      <Popup>
                        <div className="text-sm">
                          <strong>International Space Station</strong>
                          <div className="text-xs opacity-60">
                            Updated:{" "}
                            {new Date(iss.timestamp * 1000).toLocaleString()}
                          </div>
                          <Button variant="link" size="sm" onClick={openExternal}>
                            <ExternalLink className="mr-1" /> Open in OSM
                          </Button>
                        </div>
                      </Popup>
                    </Marker>

                    <Circle
                      center={[iss.latitude, iss.longitude]}
                      radius={200000}
                      pathOptions={{ opacity: 0.2, color: "#60a5fa" }}
                    />
                  </>
                )}
              </MapContainer>
            </CardContent>
          </Card>
        </section>

        {/* RIGHT ACTIONS */}
        <aside className="lg:col-span-3 space-y-4 hidden lg:block">
          <Card
            className={clsx(
              "rounded-2xl border shadow",
              isDark ? "bg-black/40 border-zinc-800" : "bg-white"
            )}
          >
            <CardHeader className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Star className="text-zinc-500" /> Quick Actions
              </CardTitle>
            </CardHeader>

            <CardContent className="flex flex-col gap-3">
              {/* Copy with animation */}
              <Button variant="outline" onClick={copyCoords} disabled={!iss}>
                {copyAnimated ? (
                  <motion.span
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1.1 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center gap-2 text-green-500"
                  >
                    ✓ Copied
                  </motion.span>
                ) : (
                  <>
                    <Copy /> Copy Coordinates
                  </>
                )}
              </Button>

              <Button variant="outline" onClick={downloadJson} disabled={!iss}>
                <Download /> Download JSON
              </Button>

              <Button variant="outline" onClick={openExternal} disabled={!iss}>
                <ExternalLink /> Open in OSM
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  if (iss)
                    window.open(
                      `https://www.google.com/maps/@${iss.latitude},${iss.longitude},6z`
                    );
                }}
                disabled={!iss}
              >
                <Globe /> Open in Google Maps
              </Button>
            </CardContent>
          </Card>
        </aside>
      </main>

      {/* RAW JSON DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className={clsx(
            "max-w-3xl w-full p-0 rounded-2xl overflow-hidden",
            isDark ? "bg-black/90" : "bg-white"
          )}
        >
          <DialogHeader className="p-4 border-b">
            <DialogTitle className="flex items-center gap-2">
              <Info className="text-zinc-500" /> Raw ISS Response
            </DialogTitle>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] p-4">
            <pre
              className={clsx(
                "text-xs rounded-xl p-4",
                isDark
                  ? "bg-zinc-900 text-zinc-200 border border-zinc-700"
                  : "bg-zinc-100 text-zinc-900 border"
              )}
            >
              {JSON.stringify(iss?.raw ?? {}, null, 2)}
            </pre>
          </ScrollArea>

          <DialogFooter className="p-4 border-t flex justify-between">
            <div className="text-xs opacity-60">Open Notify API</div>

            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                Close
              </Button>

              <Button variant="outline" onClick={downloadJson}>
                <Download /> Download
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
