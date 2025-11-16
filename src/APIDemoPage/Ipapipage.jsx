// src/pages/IpaApiPage.jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "sonner";
import {
  RefreshCw,
  Copy,
  MapPin,
  Globe,
  Server,
  Clock,
  Hash,
  ExternalLink,
  Menu,
  X,
  Map as MapIcon,
  Download,
  Eye,
} from "lucide-react";

/* Shadcn/UI components (adjust imports if your project differs) */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

/* Syntax highlighter */
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

/* Theme provider (if available) */
import { useTheme } from "@/components/theme-provider";

/* ---------- Constants ---------- */
const ENDPOINT = "https://ipapi.co/json";

/* ---------- Helpers ---------- */
const pretty = (obj) => {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
};

function bboxFromLatLon(lat, lon, delta = 0.05) {
  // bbox expects: left_lon, bottom_lat, right_lon, top_lat
  const left = lon - delta;
  const right = lon + delta;
  const bottom = lat - delta;
  const top = lat + delta;
  return `${left},${bottom},${right},${top}`;
}

/* ---------- Page ---------- */
export default function IpaApiPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false); // mobile menu
  const [mapOpen, setMapOpen] = useState(false); // map dialog open
  const [queryIp, setQueryIp] = useState(""); // optional override IP
  const [showRaw, setShowRaw] = useState(false);

  /* Fetch function */
  async function fetchIP(ip = "") {
    try {
      setLoading(true);
      const url = ip ? `https://ipapi.co/${encodeURIComponent(ip)}/json` : ENDPOINT;
      const res = await fetch(url);
      const json = await res.json();
      setData(json);
      toast.success("IP data loaded");
    } catch (err) {
      console.error(err);
      toast.error("Failed to load IP data");
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchIP();
  }, []);

  /* Derived fields / safe access */
  const fields = useMemo(() => {
    if (!data) return [];
    // choose important fields to display first
    const order = [
      "ip",
      "network",
      "city",
      "region",
      "region_code",
      "country",
      "country_name",
      "postal",
      "latitude",
      "longitude",
      "timezone",
      "utc_offset",
      "asn",
      "org",
      "country_calling_code",
      "languages",
      "continent_code",
    ];
    const items = [];
    const keys = Array.from(new Set([...order, ...Object.keys(data)]));

    keys.forEach((k) => {
      if (typeof data[k] !== "undefined") {
        items.push({ k, v: data[k] });
      }
    });
    return items;
  }, [data]);

  /* Quick action handlers */
  function handleCopyEndpoint() {
    navigator.clipboard.writeText(ENDPOINT);
    toast.success("Endpoint copied");
  }
  function handleCopyJSON() {
    navigator.clipboard.writeText(pretty(data));
    toast.success("JSON copied");
  }
  function handleDownloadJSON() {
    const blob = new Blob([pretty(data)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ipapi-${(data && data.ip) || "result"}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Downloaded JSON");
  }

  /* Map iframe URL (OpenStreetMap embed) */
  const mapUrl = (() => {
    if (!data || !data.latitude || !data.longitude) return null;
    const lat = Number(data.latitude);
    const lon = Number(data.longitude);
    const bb = bboxFromLatLon(lat, lon, 0.08);
    // embed.html?bbox=left,bottom,right,top&layer=mapnik&marker=lat,lon
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bb}&layer=mapnik&marker=${lat},${lon}`;
  })();

  /* Render */
  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto transition-colors", isDark ? "dark:bg-black bg-black" : "bg-white")}>
      <Toaster richColors />

      {/* Header */}
      <header className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold leading-tight", isDark ? "text-zinc-50" : "text-zinc-900")}>
            Revolyx · IP Lookup
          </h1>
          <p className={clsx("mt-1 text-sm", isDark ? "text-zinc-300" : "text-zinc-600")}>
            Live IP data from <span className={clsx(isDark ? "text-zinc-100" : "text-zinc-800")}>ipapi.co</span>. Map preview uses OpenStreetMap
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className={clsx("hidden md:flex items-center gap-2 rounded-lg px-3 py-2 border", isDark ? "bg-black/60 border-zinc-800" : "bg-white/70 border-zinc-200")}>
            <Input
              value={queryIp}
              placeholder="Enter IP (optional)"
              onChange={(e) => setQueryIp(e.target.value)}
              className={clsx("w-52 border-0 shadow-none bg-transparent", isDark ? "text-zinc-100" : "text-zinc-900")}
            />
            <Button
              
              size="sm"
              variant="outline"
              onClick={() => fetchIP(queryIp)}
              className={clsx("flex cursor-pointer items-center gap-2")}
            >
              <RefreshCw className={clsx(loading ? "animate-spin" : "")} />
              Refresh
            </Button>
          </div>

          {/* Mobile menu button */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className={clsx("md:hidden cursor-pointer")}>
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px] p-4">
              <div className="flex items-center justify-between mb-4">
                <div className={clsx("text-lg font-semibold", isDark ? "text-zinc-50" : "text-zinc-900")}>Navigation</div>
               
              </div>
              <div className="space-y-3">
                <Button variant="ghost" onClick={() => fetchIP()} className={clsx("justify-start cursor-pointer")}>
                  <RefreshCw className="mr-2" /> Refresh
                </Button>
                <Button variant="ghost" onClick={handleCopyEndpoint} className="justify-start cursor-pointer">
                  <Copy className="mr-2" /> Copy Endpoint
                </Button>
                <Button variant="ghost" onClick={() => setMapOpen(true)} className="justify-start cursor-pointer">
                  <MapIcon className="mr-2" /> Open Map Preview
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* LEFT: Sidebar */}
        <aside className={clsx("hidden lg:block h-[88vh] rounded-xl p-4 border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/70 border-zinc-200")}>
          <div className="mb-4">
            <h3 className={clsx("text-sm font-semibold", isDark ? "text-zinc-100" : "text-zinc-800")}>Quick Actions</h3>
            <p className={clsx("text-xs mt-1", isDark ? "text-zinc-300" : "text-zinc-600")}>Useful operations for the endpoint & response</p>
          </div>

          <div className="grid grid-cols-2 gap-3 space-y-3">
            <Button variant="outline" className="w-full justify-start cursor-pointer flex items-center gap-3" onClick={() => fetchIP()}>
              <RefreshCw /> Refresh data
            </Button>

            <Button variant="outline" className="w-full justify-start cursor-pointer flex items-center gap-3" onClick={handleCopyEndpoint}>
              <Copy /> Copy endpoint
            </Button>

            <Button variant="outline" className="w-full justify-start cursor-pointer flex items-center gap-3" onClick={() => setMapOpen(true)}>
              <MapIcon /> Map preview
            </Button>

            <Button variant="outline" className="w-full justify-start cursor-pointer flex items-center gap-3" onClick={handleCopyJSON}>
              <Copy /> Copy JSON
            </Button>

            <Button variant="outline" className="w-full justify-start cursor-pointer flex items-center gap-3" onClick={handleDownloadJSON}>
              <Download /> Download JSON
            </Button>
          </div>

          <Separator className="my-4" />

          <div>
            <h4 className={clsx("text-xs font-semibold mb-2", isDark ? "text-zinc-100" : "text-zinc-800")}>Quick info</h4>

            <div className="grid grid-cols-2 gap-3">
              {/* show some key values */}
              <Card className={clsx("p-3 rounded-lg border ", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                <div className="text-xs opacity-70">IP</div>
                <div className="font-medium mt-1 overflow-auto no-scrollbar">{data?.ip ?? "—"}</div>
              </Card>

              <Card className={clsx("p-3 rounded-lg border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                <div className="text-xs opacity-70">City</div>
                <div className="font-medium mt-1">{data?.city ?? "—"}</div>
              </Card>

              <Card className={clsx("p-3 rounded-lg border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                <div className="text-xs opacity-70">Country</div>
                <div className="font-medium mt-1">{data?.country_name ?? "—"}</div>
              </Card>

              <Card className={clsx("p-3 rounded-lg border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                <div className="text-xs opacity-70">Org</div>
                <div className="font-medium mt-1">{data?.org ?? "—"}</div>
              </Card>
            </div>
          </div>
        </aside>

        {/* MIDDLE + MAIN PREVIEW */}
        <section className={clsx("lg:col-span-3 space-y-6")}>
          <Card className={clsx("rounded-2xl border overflow-hidden", isDark ? "bg-black/40 border-zinc-800" : "bg-white/80 border-zinc-200")}>
            {/* Top preview header */}
            <div className={clsx("p-5 flex flex-col md:flex-row md:items-start md:justify-between gap-4", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <h2 className={clsx("text-xl font-semibold", isDark ? "text-zinc-50" : "text-zinc-900")}>IP Details</h2>
                <p className={clsx("text-sm mt-1", isDark ? "text-zinc-300" : "text-zinc-600")}>All fields returned by ipapi</p>
              </div>

              <div className="flex items-center flex-wrap gap-3">
                <Button variant="outline" onClick={() => fetchIP()} disabled={loading} className="flex cursor-pointer items-center gap-2">
                  <RefreshCw className={loading ? "animate-spin" : ""} /> Refresh
                </Button>

                <Button variant="ghost" onClick={handleCopyEndpoint} className="flex cursor-pointer items-center gap-2">
                  <Copy /> Endpoint
                </Button>

                <Button variant="secondary" onClick={() => setMapOpen(true)} className="flex cursor-pointer items-center gap-2">
                  <MapIcon /> Map
                </Button>

                <Button variant="outline" onClick={() => setShowRaw((s) => !s)} className="flex  cursor-pointer items-center gap-2">
                  <Eye /> {showRaw ? "Hide Raw" : "Show Raw"}
                </Button>
              </div>
            </div>

            <CardContent>
              {/* Main info row */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left column: prominent fields + map thumbnail */}
                <div className={clsx("space-y-4")}>
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-xs opacity-70">IP Address</div>
                    <div className="font-semibold mt-1 text-lg overflow-auto no-scrollbar">{data?.ip ?? "—"}</div>

                    <div className="flex items-center gap-2 mt-3">
                      <div className="text-xs opacity-70">Country</div>
                      <div className="font-medium">{data?.country_name ?? "—"}</div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      <div className="text-xs opacity-70">Region / City</div>
                      <div className="font-medium">{(data?.region ? `${data.region}, ` : "") + (data?.city ?? "") || "—"}</div>
                    </div>

                    {/* small map thumbnail */}
                    {mapUrl ? (
                      <div className="mt-4 rounded-md overflow-hidden border">
                        <iframe
                          title="mini-map"
                          src={mapUrl}
                          style={{ width: "100%", height: 160, border: 0 }}
                        />
                      </div>
                    ) : (
                      <div className="mt-4 rounded-md p-4 border text-sm opacity-70">No coordinates available</div>
                    )}
                  </div>

                  {/* Network info */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-xs opacity-70">Organization (ISP)</div>
                    <div className="font-medium mt-1">{data?.org ?? "—"}</div>

                    <div className="text-xs opacity-70 mt-3">ASN</div>
                    <div className="font-medium mt-1">{data?.asn ?? "—"}</div>

                    <div className="text-xs opacity-70 mt-3">Network</div>
                    <div className="font-medium mt-1">{data?.network ?? "—"}</div>
                  </div>
                </div>

                {/* Middle column: table of fields */}
                <div className="col-span-1 md:col-span-1">
                  <div className={clsx("p-4 rounded-xl border overflow-auto max-h-[420px]", isDark ? "bg-black/30 border-zinc-800" : "bg-white/80 border-zinc-200")}>
                    <h4 className={clsx("text-sm font-semibold mb-3", isDark ? "text-zinc-100" : "text-zinc-900")}>All Fields</h4>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      {fields.map(({ k, v }) => (
                        <div key={k} className={clsx("p-2 rounded-md", isDark ? "bg-black/20" : "bg-white/60")}>
                          <div className="text-xs opacity-60">{k}</div>
                          <div className="font-medium mt-1 break-words text-[13px]">{String(v)}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right column: timezone, calling, languages, raw JSON toggle */}
                <div className="space-y-4">
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-xs opacity-70">Timezone</div>
                    <div className="font-medium mt-1">{data?.timezone ?? "—"}</div>
                    <div className="text-xs opacity-60 mt-2">UTC offset: {data?.utc_offset ?? "—"}</div>
                    <div className="text-xs opacity-60 mt-1">UTC time: {data?.utc_time ?? "—"}</div>
                  </div>

                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-xs opacity-70">Calling Code</div>
                    <div className="font-medium mt-1">{data?.country_calling_code ?? "—"}</div>

                    <div className="text-xs opacity-70 mt-3">Languages</div>
                    <div className="font-medium mt-1 overflow-auto no-scrollbar">{data?.languages ?? "—"}</div>
                  </div>

                  {showRaw && (
                    <div className={clsx("p-3 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                      <div className="text-xs opacity-60 mb-2">Raw Response</div>
                      <div className="text-xs font-mono max-h-48 overflow-auto">{pretty(data)}</div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Raw JSON viewer / code block */}
          <Card className={clsx("rounded-2xl border overflow-hidden", isDark ? "bg-black/40 border-zinc-800" : "bg-white/80 border-zinc-200")}>
            <CardHeader>
              <CardTitle className={clsx(isDark ? "text-zinc-50" : "text-zinc-900")}>Response JSON</CardTitle>
              <div className="flex items-center gap-2">
                <Button className="cursor-pointer" variant="ghost" onClick={handleCopyJSON}><Copy /></Button>
                <Button className="cursor-pointer" variant="ghost" onClick={handleDownloadJSON}><Download /></Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md overflow-auto no-scrollbar border p-2" style={{ maxHeight: 420 }}>
                <SyntaxHighlighter wrapLongLines wrapLines language="json" style={isDark ? oneDark : oneLight} >
                  {pretty(data)}
                </SyntaxHighlighter>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* Map dialog */}
      <Dialog open={mapOpen} onOpenChange={setMapOpen}>
        <DialogContent className={clsx("max-w-4xl w-full p-0 rounded-xl overflow-hidden", isDark ? "bg-black/80" : "bg-white")}>
          <DialogHeader>
            <DialogTitle className={clsx(isDark ? "text-zinc-50" : "text-zinc-900")}>Map Preview</DialogTitle>
          </DialogHeader>

          <div className="w-full h-[60vh] bg-zinc-800/10">
            {mapUrl ? (
              <iframe
                title="OpenStreetMap"
                src={mapUrl}
                style={{ width: "100%", height: "100%", border: 0 }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-sm opacity-60">Coordinates not available for map preview.</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Map: OpenStreetMap embed</div>
            <div className="flex gap-2">
              <Button className="cursor-pointer" variant="ghost" onClick={() => setMapOpen(false)}><X /></Button>
              <Button className="cursor-pointer" onClick={() => {
                if (data?.latitude && data?.longitude) {
                  const lat = data.latitude;
                  const lon = data.longitude;
                  const url = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=12/${lat}/${lon}`;
                  window.open(url, "_blank");
                } else {
                  toast.error("No coordinates");
                }
              }}>
                Open in OSM <ExternalLink className="ml-2" />
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
