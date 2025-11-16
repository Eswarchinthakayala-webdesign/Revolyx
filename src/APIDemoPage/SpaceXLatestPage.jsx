// SpaceXSearchPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  Loader2,
  ExternalLink,
  ImageIcon,
  Calendar,
  Activity,
  Copy,
  Download,
  X,
  FileText
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
 * SpaceXSearchPage
 * - Uses POST /v5/launches/query to search launches by name (regex) and other filters
 * - Debounced search, shows paginated results, detailed professional view
 * - No local-save logic
 */

const QUERY_ENDPOINT = "https://api.spacexdata.com/v5/launches/query";

function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

export default function SpaceXSearchPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // search UI
  const [q, setQ] = useState("");
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [results, setResults] = useState([]); // current page docs
  const [pageInfo, setPageInfo] = useState({ page: 1, limit: 10, totalDocs: 0, hasNextPage: false });
  const [selected, setSelected] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [showRaw, setShowRaw] = useState(false);

  // images modal
  const [imageOpen, setImageOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const debounceRef = useRef(null);

  // Helper: build POST body for the query endpoint
  function buildQueryBody({ text, page = 1, limit = 10, startDate, endDate, upcoming }) {
    const query = {};

    if (text && text.trim() !== "") {
      // case-insensitive regex on mission name
      query.name = { $regex: text.trim(), $options: "i" };
    }

    if (typeof upcoming === "boolean") {
      query.upcoming = upcoming;
    }

    if (startDate || endDate) {
      query.date_utc = {};
      if (startDate) query.date_utc.$gte = new Date(startDate).toISOString();
      if (endDate) query.date_utc.$lte = new Date(endDate).toISOString();
    }

    return {
      query,
      options: {
        page,
        limit,
        sort: { date_unix: -1 } // newest first by default
      }
    };
  }

  async function doSearch({ text, page = 1, limit = 10, append = false }) {
    setLoadingSearch(true);
    try {
      const body = buildQueryBody({ text, page, limit });
      const res = await fetch(QUERY_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        showToast("error", `Search failed (${res.status})`);
        setLoadingSearch(false);
        return;
      }
      const json = await res.json();
      // SpaceX query returns docs + pagination (docs array)
      const docs = json.docs || json;
      setRawResp(json);
      setPageInfo({
        page: json.page ?? page,
        limit: json.limit ?? limit,
        totalDocs: json.totalDocs ?? (docs.length || 0),
        hasNextPage: json.hasNextPage ?? false
      });

      setResults(prev => (append ? [...prev, ...docs] : docs));
      if (!append && docs && docs.length > 0) setSelected(docs[0]);
      if (docs.length === 0) showToast("info", "No launches match your search.");
    } catch (err) {
      console.error(err);
      showToast("error", "Search error");
    } finally {
      setLoadingSearch(false);
    }
  }

  // debounce searching
  function onChangeQ(v) {
    setQ(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch({ text: v, page: 1, limit: pageInfo.limit });
    }, 350);
  }

  // initial load: load recent launches (no text)
  useEffect(() => {
    doSearch({ text: "", page: 1, limit: 10 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function loadMore() {
    if (!pageInfo.hasNextPage) return;
    const nextPage = (pageInfo.page || 1) + 1;
    doSearch({ text: q, page: nextPage, limit: pageInfo.limit, append: true });
  }

  function openImage(img) {
    setSelectedImage(img);
    setImageOpen(true);
  }

  function copyEndpoint() {
    navigator.clipboard.writeText(QUERY_ENDPOINT);
    showToast("success", "Endpoint copied");
  }

  function downloadSelectedJSON() {
    if (!selected) return showToast("info", "No launch selected");
    const blob = new Blob([prettyJSON(selected)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `spacex_launch_${(selected.name || selected.id).replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded selected launch JSON");
  }

  // helper to pick best image
  function pickPatch(l) {
    return l?.links?.patch?.small || l?.links?.patch?.large || l?.links?.flickr?.original?.[0] || null;
  }

  return (
    <div className={clsx("min-h-screen p-6 max-w-9xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">SpaceX — Launch Search</h1>
          <p className="mt-1 text-sm opacity-70">Search SpaceX launches by mission name, date range, or upcoming status</p>
        </div>

        <div className="w-full md:w-auto">
          <div className={clsx("flex items-center gap-2 rounded-lg px-2 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input placeholder="Search launches (e.g. 'Starlink', 'Falcon', 'Crew')..." value={q} onChange={(e) => onChangeQ(e.target.value)} className="border-0 shadow-none bg-transparent outline-none" />
            <Button onClick={() => doSearch({ text: q, page: 1, limit: pageInfo.limit })} variant="outline">Search</Button>
          </div>
        </div>
      </header>

      {/* layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: results list */}
        <aside className="lg:col-span-4 space-y-4">
          <Card className="rounded-2xl overflow-hidden">
            <CardHeader className="p-4 flex items-center justify-between">
              <CardTitle className="text-base">Matches</CardTitle>
              <div className="text-xs opacity-60">{pageInfo.totalDocs ?? 0} results</div>
            </CardHeader>

            <CardContent className="p-0">
              <ScrollArea style={{ maxHeight: 640 }}>
                {loadingSearch && <div className="p-4 text-center"><Loader2 className="animate-spin mx-auto" /></div>}

                {!loadingSearch && results.length === 0 && (
                  <div className="p-6 text-sm opacity-60">No results yet — try another keyword or click Search.</div>
                )}

                <ul className="divide-y">
                  {results.map((r) => (
                    <li key={r.id} className="p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900 cursor-pointer flex gap-3" onClick={() => setSelected(r)}>
                      <img src={pickPatch(r) || ""} alt={r.name} className="w-16 h-12 object-cover rounded-md bg-zinc-100" />
                      <div className="flex-1">
                        <div className="font-medium">{r.name}</div>
                        <div className="text-xs opacity-60">{r.details ? r.details.slice(0, 80) + (r.details.length > 80 ? "…" : "") : (r.payloads?.length ? `${r.payloads.length} payload(s)` : "—")}</div>
                      </div>
                      <div className="text-xs opacity-60">{new Date(r.date_utc).toLocaleDateString()}</div>
                    </li>
                  ))}
                </ul>

                {pageInfo.hasNextPage && (
                  <div className="p-4 text-center">
                    <Button variant="outline" onClick={loadMore}>Load more</Button>
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </aside>

        {/* Center: detailed launch view */}
        <section className="lg:col-span-5 space-y-4">
          <Card className="rounded-2xl overflow-hidden">
            <CardHeader className="p-4 flex items-center justify-between">
              <div>
                <CardTitle className="text-base">{selected?.name ?? "Select a launch"}</CardTitle>
                <div className="text-xs opacity-60">{selected ? new Date(selected.date_utc).toLocaleString() : "—"}</div>
              </div>

              <div className="flex gap-2 items-center">
                <Button variant="outline" onClick={() => { if (selected?.links?.webcast) window.open(selected.links.webcast, "_blank"); else showToast("info", "No webcast link"); }}><ExternalLink /></Button>
                <Button variant="outline" onClick={() => { if (selected?.links?.article) window.open(selected.links.article, "_blank"); else showToast("info", "No article"); }}><FileText /></Button>
                <Button variant="ghost" onClick={() => copyEndpoint()}><Copy /></Button>
                <Button variant="ghost" onClick={() => downloadSelectedJSON()}><Download /></Button>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              {!selected ? (
                <div className="py-12 text-center text-sm opacity-60">Pick a launch from the left to see full details.</div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="col-span-1">
                      <img src={pickPatch(selected) || ""} alt={selected.name} className="w-full rounded-md object-contain" />
                      <div className="mt-3 text-sm opacity-70">{selected.tbd ? "TBD / upcoming" : (selected.success === true ? "Success" : selected.success === false ? "Failed" : "Unknown")}</div>
                      <div className="mt-2 text-sm">
                        <div className="text-xs opacity-60">Flight</div>
                        <div className="font-medium">{selected.flight_number ?? "—"}</div>
                      </div>
                    </div>

                    <div className="col-span-2">
                      <div className="text-sm leading-relaxed whitespace-pre-line">{selected.details ?? "No mission details provided."}</div>

                      <Separator className="my-3" />

                      <div className="text-sm font-semibold mb-2">Cores</div>
                      <div className="space-y-2">
                        {selected.cores && selected.cores.length > 0 ? selected.cores.map((c, i) => (
                          <div key={i} className="p-2 rounded-md border">
                            <div className="text-xs opacity-60">Core</div>
                            <div className="font-medium">{c.core ?? "—"}</div>
                            <div className="text-xs opacity-60">Landing: {c.landing_success === true ? "Success" : c.landing_success === false ? "Failed" : "—"}</div>
                          </div>
                        )) : <div className="text-sm opacity-60">No core info</div>}
                      </div>
                    </div>
                  </div>

                  <Separator className="my-3" />

                  <div>
                    <div className="text-sm font-semibold mb-2">Payloads</div>
                    <div className="grid grid-cols-1 gap-2">
                      {selected.payloads && selected.payloads.length > 0 ? selected.payloads.map(pid => (
                        <div key={pid} className="p-3 rounded-md border flex items-center justify-between">
                          <div>
                            <div className="font-medium">{pid}</div>
                            <div className="text-xs opacity-60">(load payload details by ID if needed)</div>
                          </div>
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline" onClick={() => showToast("info", `Payload ID: ${pid}`)}>Info</Button>
                          </div>
                        </div>
                      )) : <div className="text-sm opacity-60">No payloads</div>}
                    </div>
                  </div>
                </>
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

        {/* Right: developer / advanced filters */}
        <aside className="lg:col-span-3 space-y-4">
          <Card className="rounded-2xl overflow-hidden">
            <CardHeader className="p-4">
              <CardTitle className="text-base">Developer & Filters</CardTitle>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              <div className="text-xs opacity-60">Query endpoint</div>
              <div className="font-mono text-xs break-all">{QUERY_ENDPOINT}</div>

              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => copyEndpoint()}><Copy /> Copy</Button>
                <Button size="sm" variant="outline" onClick={() => setShowRaw(s => !s)}><FileText /> Raw</Button>
                <Button size="sm" variant="outline" onClick={() => downloadSelectedJSON()}><Download /> Download</Button>
              </div>

              <Separator className="my-3" />

              <div>
                <div className="text-xs opacity-60">Advanced tip</div>
                <div className="text-sm opacity-70">You can search by date range or set <code>upcoming: true</code> in the query object. The component uses a regex on <code>name</code> for text search.</div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>

      {/* image modal */}
      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent className="max-w-4xl w-full p-0 rounded-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle>Image</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {selectedImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={selectedImage} alt="selected" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="py-20 text-center opacity-60">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Images from SpaceX</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setImageOpen(false)}><X /></Button>
              <Button variant="outline" onClick={() => { if (selectedImage) window.open(selectedImage, "_blank"); }}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
