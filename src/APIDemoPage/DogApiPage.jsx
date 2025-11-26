// src/pages/DogAPIPage.jsx
"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper";

import {
  Menu,
  X,
  Copy,
  RefreshCw,
  Download,
  Eye,
  Image as ImageIcon,
  Link as LinkIcon,
  Info,
  Check,
  Tag,
  Layers,
  Clock,
  Heart,
  Sliders,
} from "lucide-react";

/* shadcn-ui */
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

/* Syntax Highlighter */
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

/* Theme provider */
import { useTheme } from "@/components/theme-provider";

const ENDPOINT = "https://dog.ceo/api/breeds/image/random";
const SIDEBAR_COUNT = 10;
const COPY_RESET_MS = 1400;

export default function DogAPIPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // main states
  const [dogUrl, setDogUrl] = useState("");
  const [rawData, setRawData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  // sidebar & mobile sheet
  const [sidebarDogs, setSidebarDogs] = useState([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  // copy statuses for animated feedback
  const [endpointCopyStatus, setEndpointCopyStatus] = useState("idle"); // 'idle' | 'copied'
  const [jsonCopyStatus, setJsonCopyStatus] = useState("idle");

  // refs to clear timeouts on unmount
  const endpointResetTimeoutRef = useRef(null);
  const jsonResetTimeoutRef = useRef(null);

  /* ---- Helpers ---- */
  const parseBreedFromUrl = useCallback((url = "") => {
    // Dog CEO URL shape: .../breeds/{breedName}/...
    try {
      const parts = url.split("/");
      const idx = parts.findIndex((p) => p === "breeds");
      if (idx >= 0 && parts[idx + 1]) {
        // breed may have dash like "hound-afghan" or nested "hound/afghan"
        const breedPart = parts[idx + 1];
        return breedPart.includes("-") ? breedPart.replace(/-/g, " ") : breedPart;
      }
    } catch (err) {
      // ignore
    }
    return "Unknown";
  }, []);

  /* ---- Fetch single dog and sidebar list ---- */
  async function fetchDog(withToast = true) {
    try {
      setLoading(true);
      const res = await fetch(ENDPOINT);
      const json = await res.json();
      if (!json?.message) {
        if (withToast) showToast("error", "Invalid response from API");
        return;
      }
      setDogUrl(json.message);
      setRawData(json);
      if (withToast) showToast("success", "Random dog fetched");
    } catch (err) {
      console.error(err);
      if (withToast) showToast("error", "Failed to fetch dog");
    } finally {
      setLoading(false);
    }
  }

  async function fetchDogList(count = SIDEBAR_COUNT) {
    try {
      // optimistic thumbnails
      setSidebarDogs((prev) => (prev.length ? prev : Array.from({ length: count }).map(() => null)));
      const promises = Array.from({ length: count }).map(() =>
        fetch(ENDPOINT).then((r) => r.json()).catch(() => null)
      );
      const results = await Promise.all(promises);
      const urls = results.map((r) => (r && r.message) ? r.message : null);
      // fill in where we got results
      setSidebarDogs((prev) => {
        const copy = Array.from({ length: count }).map((_, i) => prev[i] ?? urls[i] ?? null);
        // if we have more urls than null slots, replace sequentially
        urls.forEach((u, idx) => { if (u) copy[idx] = u; });
        return copy;
      });

      // ensure main selected
      if (!dogUrl) {
        const first = urls.find(Boolean);
        if (first) {
          setDogUrl(first);
          setRawData({ message: first, status: "success" });
        }
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch sidebar dogs");
    }
  }

  useEffect(() => {
    // initial load: fetch main + sidebar
    fetchDog(false);
    fetchDogList(SIDEBAR_COUNT);
    return () => {
      clearTimeout(endpointResetTimeoutRef.current);
      clearTimeout(jsonResetTimeoutRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---- Copy Animations ---- */
  const handleCopyEndpoint = async () => {
    try {
      await navigator.clipboard.writeText(ENDPOINT);
      setEndpointCopyStatus("copied");
      showToast("success", "Endpoint copied");
      clearTimeout(endpointResetTimeoutRef.current);
      endpointResetTimeoutRef.current = setTimeout(() => setEndpointCopyStatus("idle"), COPY_RESET_MS);
    } catch (err) {
      showToast("error", "Failed to copy endpoint");
    }
  };

  const handleCopyJSON = async () => {
    try {
      const text = rawData ? JSON.stringify(rawData, null, 2) : "";
      await navigator.clipboard.writeText(text);
      setJsonCopyStatus("copied");
      showToast("success", "JSON copied");
      clearTimeout(jsonResetTimeoutRef.current);
      jsonResetTimeoutRef.current = setTimeout(() => setJsonCopyStatus("idle"), COPY_RESET_MS);
    } catch (err) {
      showToast("error", "Failed to copy JSON");
    }
  };

  const handleDownloadJSON = () => {
    try {
      const blob = new Blob([JSON.stringify(rawData, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "dog-api.json";
      a.click();
      URL.revokeObjectURL(a.href);
      showToast("success", "JSON downloaded");
    } catch (err) {
      showToast("error", "Failed to download JSON");
    }
  };

  const handleRefreshAll = async () => {
    await Promise.all([fetchDog(), fetchDogList(SIDEBAR_COUNT)]);
  };

  /* ---- UI helpers ---- */
  const BreedTag = ({ url }) => {
    const breed = parseBreedFromUrl(url);
    return (
      <div className={clsx("text-xs px-2 py-1 rounded-full text-[11px] font-medium inline-flex items-center gap-2", isDark ? "bg-white/6 text-zinc-100" : "bg-black/6 text-zinc-900")}>
        <Tag className="w-3 h-3" />
        <span>{breed}</span>
      </div>
    );
  };

  /* ---- Small helper for buttons to keep pointer style consistent ---- */
  const btnCommon = "cursor-pointer";

  /* ---- Render ---- */
  return (
    <div className={clsx("min-h-screen p-4 sm:p-6 max-w-8xl pb-10 overflow-hidden mx-auto transition-colors", isDark ? "bg-black" : "bg-white")}>
      {/* HEADER */}
      <header className={clsx("mb-6 flex items-center justify-between gap-4")}>
        <div className="flex items-center gap-3">
          {/* Mobile: open sheet */}
          <div className="md:hidden">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className={clsx(btnCommon, "p-2") } aria-label="Open menu">
                  <Menu />
                </Button>
              </SheetTrigger>

              <SheetContent side="left" className={clsx("w-[320px] p-4")}>
                <div className="flex items-center justify-between mb-4">
                  <div className="text-lg font-semibold">Dogs</div>
                  <Button variant="ghost" onClick={() => setSheetOpen(false)} className={clsx(btnCommon, "p-2")}>
                    <X />
                  </Button>
                </div>

                <div className="flex gap-2 mb-3">
                  <Button onClick={handleRefreshAll} variant="outline" className={clsx("w-full justify-center", btnCommon)}>
                    <RefreshCw /> Refresh
                  </Button>
                </div>

                <Separator className="my-2" />

                <div className="text-sm font-medium mb-2">Thumbnails</div>
                <ScrollArea className="h-[60vh]">
                  <div className="grid grid-cols-2 gap-3">
                    {sidebarDogs.length ? (
                      sidebarDogs.map((url, i) => (
                        <button
                          key={String(url) + i}
                          onClick={() => { setDogUrl(url); setRawData({ message: url, status: "success" }); setSheetOpen(false); }}
                          className="rounded-lg overflow-hidden border hover:scale-[1.02] transition-transform cursor-pointer"
                        >
                          {url ? (
                            <img src={url} alt={`dog-${i}`} className="w-full h-28 object-cover" />
                          ) : (
                            <div className={clsx("w-full h-28 bg-zinc-200/40 animate-pulse")} />
                          )}
                        </button>
                      ))
                    ) : (
                      <div className="text-sm opacity-70">No thumbnails yet</div>
                    )}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>

          {/* Title (responsive) */}
          <div>
            <h1 className={clsx("text-lg md:text-2xl font-bold", isDark ? "text-zinc-50" : "text-zinc-900")}>
              Revolyx <span className="text-indigo-400">·</span> Dog Generator
            </h1>
            <p className={clsx("text-xs md:text-sm mt-0.5", isDark ? "text-zinc-400" : "text-zinc-600")}>
              Random dog images • API demo • click a thumbnail to preview
            </p>
          </div>
        </div>

        {/* Actions (desktop) */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="ghost" onClick={handleRefreshAll} className={clsx(btnCommon, "p-2")} title="Refresh dogs">
            <motion.span animate={{ rotate: loading ? 360 : 0 }} transition={{ duration: loading ? 1 : 0 }}>
              <RefreshCw className={clsx(loading ? "animate-spin" : "")} />
            </motion.span>
          </Button>

          <Button variant="outline" onClick={handleCopyEndpoint} className={clsx(btnCommon, "flex items-center gap-2")} title="Copy endpoint">
            <motion.span
              key={endpointCopyStatus}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
            >
              {endpointCopyStatus === "copied" ? <Check /> : <LinkIcon />}
            </motion.span>
            <span className="text-xs">{endpointCopyStatus === "copied" ? "Endpoint copied" : "Copy endpoint"}</span>
          </Button>

          <Button variant="outline" onClick={handleCopyJSON} className={clsx(btnCommon, "flex items-center gap-2")} title="Copy JSON">
            <motion.span
              key={jsonCopyStatus}
              initial={{ scale: 0.7, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 18 }}
            >
              {jsonCopyStatus === "copied" ? <Check /> : <Copy />}
            </motion.span>
            <span className="text-xs">{jsonCopyStatus === "copied" ? "JSON copied" : "Copy JSON"}</span>
          </Button>

          <Button variant="ghost" onClick={handleDownloadJSON} className={clsx(btnCommon, "p-2")} title="Download JSON">
            <Download />
          </Button>
        </div>
      </header>

      {/* MAIN GRID */}
      <main className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* LEFT SIDEBAR - desktop */}
        <aside
          className={clsx(
            "hidden lg:block h-[78vh] w-full p-4 rounded-xl border",
            isDark ? "bg-black/40 border-zinc-800" : "bg-white/70 border-zinc-200"
          )}
        >
          <div className="flex items-center justify-between mb-3">
            <div className={clsx("text-sm font-semibold", isDark ? "text-zinc-100" : "text-zinc-800")}>Dogs</div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" onClick={handleRefreshAll} className={clsx(btnCommon, "p-2")} title="Refresh thumbnails">
                <RefreshCw />
              </Button>
            </div>
          </div>

          <Separator className="my-3" />

          <ScrollArea className="h-[calc(78vh-86px)]">
            <div className="grid grid-cols-2 gap-3">
              {sidebarDogs.length ? (
                sidebarDogs.map((url, i) => (
                  <button
                    key={String(url) + i}
                    onClick={() => { setDogUrl(url); setRawData({ message: url, status: "success" }); }}
                    className="rounded-lg overflow-hidden border hover:scale-[1.02] transition-transform cursor-pointer shadow-sm"
                    aria-label={`Preview dog ${i + 1}`}
                  >
                    {url ? (
                      <img src={url} alt={`dog-${i}`} className="w-full h-28 object-cover" />
                    ) : (
                      <div className="w-full h-28 bg-zinc-200/40 animate-pulse" />
                    )}
                  </button>
                ))
              ) : (
                <div className="text-sm opacity-70">No thumbnails yet</div>
              )}
            </div>
          </ScrollArea>

          <Separator className="my-4" />

          <Card className={clsx("p-3 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/60 border-zinc-200")}>
            <div className="text-xs opacity-70">Current Dog Image URL</div>
            <div className="text-[11px] mt-1 break-all">
              {dogUrl ? dogUrl : "—"}
            </div>
          </Card>
        </aside>

        {/* RIGHT CONTENT (main dashboard area) */}
        <section className="lg:col-span-3 space-y-6">
          {/* PREVIEW + ACTIONS CARD */}
          <Card className={clsx("rounded-2xl border overflow-hidden", isDark ? "bg-black/40 border-zinc-800" : "bg-white/80 border-zinc-200")}>
            <CardHeader className={clsx("p-4 border-b flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3", isDark ? "bg-black/60 border-zinc-800" : "bg-white/80 border-zinc-200")}>
              <div className="flex items-start gap-3">
                <div className="rounded-full p-2" aria-hidden>
                  <ImageIcon className={clsx("w-6 h-6", isDark ? "text-zinc-100" : "text-zinc-900")} />
                </div>

                <div>
                  <CardTitle className={clsx(isDark ? "text-zinc-100" : "text-zinc-900", "text-lg")}>Dog Image</CardTitle>
                  <div className={clsx("text-xs mt-1 flex items-center gap-2", isDark ? "text-zinc-400" : "text-zinc-600")}>
                    <Info className="w-4 h-4" />
                    <span>Random dog from Dog CEO API • Click image to enlarge</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={fetchDog} className={clsx(btnCommon, "p-2")} disabled={loading} title="Fetch new dog">
                  <RefreshCw className={loading ? "animate-spin" : ""} />
                </Button>

                <Button variant="outline" onClick={() => setImageOpen(true)} className={clsx(btnCommon, "p-2")} title="Open image">
                  <Eye />
                </Button>

                <Button variant="ghost" onClick={() => setShowRaw((s) => !s)} className={clsx(btnCommon, "flex items-center gap-2 px-3")}>
                  <Layers />
                  <span className="text-xs">{showRaw ? "Hide Raw" : "Show Raw"}</span>
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* LEFT: Large preview + overlay metadata */}
                <div className="lg:col-span-2 flex flex-col gap-4">
                  <div className={clsx("rounded-xl border overflow-hidden relative", isDark ? "bg-black/20 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                    {loading || !dogUrl ? (
                      <div className="w-full h-[420px] flex items-center justify-center">
                        <div className="text-sm opacity-60">Loading image…</div>
                      </div>
                    ) : (
                      <img
                        src={dogUrl}
                        alt="Random Dog"
                        className="w-full max-h-[420px] object-cover cursor-pointer"
                        onClick={() => setImageOpen(true)}
                      />
                    )}

                    {/* bottom overlay */}
                    <div className={clsx("absolute left-4 right-4 bottom-4 flex items-center justify-between p-3 rounded-xl drop-shadow-md", isDark ? "bg-black/60" : "bg-white/90")}>
                      <div className="flex items-center gap-3">
                        <BreedTag url={dogUrl} />
                        <div className={clsx("text-xs", isDark ? "text-zinc-200" : "text-zinc-800")}>
                          {dogUrl ? parseBreedFromUrl(dogUrl) : "—"}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={() => { navigator.clipboard.writeText(dogUrl || ""); showToast("success", "Image URL copied"); }} className={clsx(btnCommon, "flex items-center gap-2")}>
                          <LinkIcon /> <span className="ml-1 text-xs">Copy URL</span>
                        </Button>

                        <Button variant="outline" onClick={() => { const a = document.createElement("a"); a.href = dogUrl; a.download = "dog.jpg"; a.click(); }} className={clsx(btnCommon)}>
                          <Download />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Details / metadata */}
                  <div className={clsx("rounded-lg p-4 border flex flex-col gap-3", isDark ? "bg-black/20 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={clsx("rounded-full p-2", isDark ? "bg-white/5" : "bg-black/5")}>
                          <Sliders className="w-4 h-4" />
                        </div>
                        <div>
                          <div className={clsx("text-sm font-semibold", isDark ? "text-zinc-100" : "text-zinc-900")}>
                            Image Details
                          </div>
                          <div className={clsx("text-xs mt-1 flex items-center gap-2", isDark ? "text-zinc-400" : "text-zinc-600")}>
                            <Clock className="w-3 h-3" />
                            <span>Fetched from Dog CEO • lightweight demo</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-xs opacity-70">{rawData ? `Status: ${rawData.status ?? "ok"}` : "No data"}</div>
                    </div>

                    <Separator className="my-2" />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <div className="text-[11px] opacity-70">Source</div>
                        <div className={clsx("text-xs mt-1 break-all")}>{dogUrl ?? "—"}</div>
                      </div>

                      <div>
                        <div className="text-[11px] opacity-70">Breed</div>
                        <div className="text-xs mt-1 flex items-center gap-2">
                          <Heart className="w-3 h-3" />
                          <span>{parseBreedFromUrl(dogUrl)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT: action / quick info panel */}
                <aside className="space-y-4">
                  <div className={clsx("rounded-lg p-3 border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                    <div className="flex items-center justify-between">
                      <div className={clsx("text-sm font-semibold flex items-center gap-2", isDark ? "text-zinc-100" : "text-zinc-900")}>
                        <LinkIcon className="w-4 h-4" />
                        Quick Actions
                      </div>
                      <div className="text-xs opacity-60">API</div>
                    </div>

                    <Separator className="my-3" />

                    <div className="flex flex-col gap-2">
                      <Button variant="outline" onClick={handleRefreshAll} className={clsx("w-full justify-start", btnCommon)}>
                        <RefreshCw /> <span className="ml-2 text-sm">Refresh</span>
                      </Button>

                      <Button variant="outline" onClick={handleCopyEndpoint} className={clsx("w-full justify-start", btnCommon)}>
                        <div className="flex items-center gap-2">
                          <motion.span key={endpointCopyStatus} initial={{ scale: 0.7 }} animate={{ scale: endpointCopyStatus === "copied" ? 1.1 : 1 }}>
                            {endpointCopyStatus === "copied" ? <Check /> : <LinkIcon />}
                          </motion.span>
                          <span className="ml-1">{endpointCopyStatus === "copied" ? "Endpoint copied" : "Copy endpoint"}</span>
                        </div>
                      </Button>

                      <Button variant="outline" onClick={handleCopyJSON} className={clsx("w-full justify-start", btnCommon)}>
                        <div className="flex items-center gap-2">
                          <motion.span key={jsonCopyStatus} initial={{ scale: 0.7 }} animate={{ scale: jsonCopyStatus === "copied" ? 1.1 : 1 }}>
                            {jsonCopyStatus === "copied" ? <Check /> : <Copy />}
                          </motion.span>
                          <span className="ml-1">{jsonCopyStatus === "copied" ? "JSON copied" : "Copy JSON"}</span>
                        </div>
                      </Button>

                      <Button variant="outline" onClick={handleDownloadJSON} className={clsx("w-full justify-start", btnCommon)}>
                        <Download /> <span className="ml-2">Download JSON</span>
                      </Button>
                    </div>
                  </div>

                  <div className={clsx("rounded-lg p-3 border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                    <div className="text-sm font-semibold flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Thumbnail Preview
                    </div>
                    <Separator className="my-3" />
                    <div className="grid grid-cols-3 gap-2">
                      {sidebarDogs.slice(0, 6).map((url, i) => (
                        <button key={String(url) + i} onClick={() => { setDogUrl(url); setRawData({ message: url, status: "success" }); }} className="rounded overflow-hidden cursor-pointer">
                          {url ? <img src={url} alt={`mini-${i}`} className="w-full h-16 object-cover" /> : <div className="w-full h-16 bg-zinc-200/40 animate-pulse" />}
                        </button>
                      ))}
                    </div>
                  </div>
                </aside>
              </div>

              {/* RAW JSON block (expandable animated) */}
              <AnimatePresence>
                {showRaw && rawData && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={clsx("mt-6 rounded-lg border p-3 overflow-auto", isDark ? "bg-black/20 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                    <div className="flex items-center justify-between mb-2">
                      <div className={clsx("text-sm font-semibold", isDark ? "text-zinc-100" : "text-zinc-900")}>Response JSON</div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" onClick={handleCopyJSON} className={clsx(btnCommon)}>
                          <Copy />
                        </Button>
                        <Button variant="ghost" onClick={handleDownloadJSON} className={clsx(btnCommon)}>
                          <Download />
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-lg overflow-auto p-2 max-h-[280px]">
                      <SyntaxHighlighter language="json" style={isDark ? oneDark : oneLight} >
                        {JSON.stringify(rawData, null, 2)}
                      </SyntaxHighlighter>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* small footer or helpful info */}
          <div className={clsx("text-xs opacity-70 flex items-center gap-3", isDark ? "text-zinc-400" : "text-zinc-600")}>
            <Clock className="w-4 h-4" />
            <span>Data from Dog CEO • Demo only • Not rate-limited for this example</span>
          </div>
        </section>
      </main>

      {/* IMAGE DIALOG */}
      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className={clsx("max-w-3xl w-full rounded-xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle className={clsx(isDark ? "text-zinc-100" : "text-zinc-900")}>Dog Image</DialogTitle>
          </DialogHeader>

          <div className="flex justify-center p-4">
            <img src={dogUrl} alt="Dog" className="rounded-xl border shadow-lg max-w-full object-contain" />
          </div>

          <DialogFooter className="flex justify-end p-3 border-t">
            <Button variant="outline" className={clsx(btnCommon)} onClick={() => setImageOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
