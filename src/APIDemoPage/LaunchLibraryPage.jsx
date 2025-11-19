// src/pages/LaunchLibraryPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper";

import {
  Search,
  ExternalLink,
  Copy,
  Download,
  Loader2,
  ImageIcon,
  List,
  MapPin,
  Calendar,
  Rocket,
  Globe,
  X,
  Loader
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useTheme } from "@/components/theme-provider";

/* ---------- Endpoint ---------- */
const BASE_ENDPOINT = "https://ll.thespacedevs.com/2.2.0/launch/upcoming/";
/* Launch Library supports search via `search=` param and page/limit etc. We'll use `search` for suggestions. */

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

/* Safe getter with fallback */
function safe(obj, path, fallback = "—") {
  try {
    const parts = path.split(".");
    let cur = obj;
    for (const p of parts) {
      if (!cur) return fallback;
      cur = cur[p];
    }
    return cur ?? fallback;
  } catch {
    return fallback;
  }
}

export default function LaunchLibraryPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // State
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [currentLaunch, setCurrentLaunch] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [loadingLaunch, setLoadingLaunch] = useState(false);

  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const suggestTimer = useRef(null);

  /* ---------- Fetch helpers ---------- */
  async function fetchUpcoming(params = {}) {
    // params: { search, limit, ... }
    setLoadingLaunch(true);
    try {
      const urlParams = new URLSearchParams();
      if (params.search) urlParams.set("search", params.search);
      if (params.limit) urlParams.set("limit", params.limit);
      // default fields: we won't restrict fields to be safe
      const url = `${BASE_ENDPOINT}?${urlParams.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        showToast("error", `LaunchLibrary request failed (${res.status})`);
        setLoadingLaunch(false);
        return null;
      }
      const json = await res.json();
      setRawResp(json);
      const items = json.results || [];
      const first = items.length > 0 ? items[0] : null;
      if (first) setCurrentLaunch(first);
      return json;
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch launches");
      return null;
    } finally {
      setLoadingLaunch(false);
    }
  }

  async function searchLaunches(q) {
    if (!q || q.trim().length === 0) {
      setSuggestions([]);
      return;
    }
    setLoadingSuggest(true);
    try {
      const urlParams = new URLSearchParams();
      urlParams.set("search", q);
      urlParams.set("limit", "12");
      const url = `${BASE_ENDPOINT}?${urlParams.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        setSuggestions([]);
        setLoadingSuggest(false);
        return;
      }
      const json = await res.json();
      const items = json.results || [];
      setSuggestions(items || []);
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
      searchLaunches(v);
    }, 350);
  }

  async function handleSearchSubmit(e) {
    e?.preventDefault?.();
    if (!query || query.trim().length === 0) {
      showToast("info", "Search launches by name, pad, rocket or mission...");
      return;
    }
    setLoadingSuggest(true);
    try {
      const urlParams = new URLSearchParams();
      urlParams.set("search", query);
      urlParams.set("limit", "20");
      const url = `${BASE_ENDPOINT}?${urlParams.toString()}`;
      const res = await fetch(url);
      const json = await res.json();
      setLoadingSuggest(false);
      const items = json.results || [];
      if (items && items.length > 0) {
        setCurrentLaunch(items[0]);
        setRawResp(json);
        setShowSuggest(false);
        showToast("success", `Loaded: ${items[0].name || items[0].mission?.name || "launch"}`);
      } else {
        showToast("info", "No launches found — try another keyword");
      }
    } catch (err) {
      setLoadingSuggest(false);
      console.error(err);
      showToast("error", "Failed to search launches");
    }
  }

  function selectSuggestion(item) {
    setCurrentLaunch(item);
    setRawResp({ results: [item] });
    setShowSuggest(false);
  }

  function copyLaunchToClipboard() {
    if (!currentLaunch) return showToast("info", "No launch to copy");
    navigator.clipboard.writeText(prettyJSON(currentLaunch));
    showToast("success", "Launch JSON copied");
  }

  function downloadJSON() {
    if (!rawResp && !currentLaunch) {
      showToast("info", "No launch to download");
      return;
    }
    const payload = rawResp || currentLaunch;
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const name = currentLaunch?.name ? currentLaunch.name.replace(/\s+/g, "_") : "launch";
    a.download = `launch_${name}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  useEffect(() => {
    // initial load: upcoming launches
    fetchUpcoming({ limit: 10 });
    // cleanup timer on unmount
    return () => {
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Render helpers ---------- */

  function renderPrimaryImage(launch) {
    // Launch Library sometimes returns image or rocket configuration images. Try multiple fields.
    const img = launch?.image || launch?.mission?.orbit && null || launch?.rocket?.configuration?.image || "";
    // If no image, use provider profile?
    return img || "";
  }

  function formatDate(str) {
    if (!str) return "TBD";
    try {
      const d = new Date(str);
      return d.toLocaleString();
    } catch {
      return str;
    }
  }

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>Launchbook — Upcoming Launches</h1>
          <p className="mt-1 text-sm opacity-70">Browse upcoming rocket launches. Search by vehicle, pad, mission or provider.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={handleSearchSubmit} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-2 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Search launches (e.g. 'Falcon 9', 'Vandenberg', 'Artemis')"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
              aria-label="Search launches"
            />
            <Button type="button" variant="outline" className="px-3 cursor-pointer" onClick={() => fetchUpcoming({ limit: 10 })}>
              Upcoming
            </Button>
            <Button type="submit" variant="outline" className="px-3 cursor-pointer"><Search /></Button>
          </form>
        </div>
      </header>

      {/* suggestions dropdown */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Searching…</li>}
            {suggestions.map((s, idx) => {
              const key = s.id || s.name || idx;
              const date = s.net || s.net; // net is "No Earlier Than" in Launch Library
              return (
                <li key={key} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => selectSuggestion(s)}>
                  <div className="flex items-center gap-3">
                    <img src={s.image || s.rocket?.configuration?.image || ""} alt={s.name || "thumb"} className="w-14 h-10 object-cover rounded-md" />
                    <div className="flex-1">
                      <div className="font-medium">{s.name}</div>
                      <div className="text-xs opacity-60">{safe(s, "launch_service_provider.name", s.launch_service_provider ?? "—")}</div>
                    </div>
                    <div className="text-xs opacity-60">{formatDate(date)}</div>
                  </div>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Main layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Center: launch viewer */}
        <section className="lg:col-span-9 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center flex-wrap gap-3 justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Launch</CardTitle>
                <div className="text-xs opacity-60">{currentLaunch?.name || "Waiting for a launch..."}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button className="cursor-pointer " variant="outline" onClick={() => fetchUpcoming({ limit: 10 })}><Loader className={loadingLaunch ? "animate-spin" : ""} /> Refresh</Button>
                <Button className="cursor-pointer" variant="ghost" onClick={() => setShowRaw(s => !s)}><List /> {showRaw ? "Hide" : "Raw"}</Button>
                <Button className="cursor-pointer" variant="ghost" onClick={() => setDialogOpen(true)}><ImageIcon /> View Image</Button>
              </div>
            </CardHeader>

            <CardContent>
              {loadingLaunch ? (
                <div className="py-12 text-center"><Loader2 className="animate-spin mx-auto" /></div>
              ) : !currentLaunch ? (
                <div className="py-12 text-center text-sm opacity-60">No launch loaded — try search or Upcoming.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Left: image + key meta */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <img src={renderPrimaryImage(currentLaunch) || currentLaunch.image || ""} alt={currentLaunch.name} className="w-full rounded-md object-cover mb-3" />
                    <div className="text-lg font-semibold">{currentLaunch.name}</div>
                    <div className="text-xs opacity-60">{safe(currentLaunch, "launch_service_provider.name", "Unknown provider")} • {formatDate(currentLaunch.net)}</div>

                    <div className="mt-3 space-y-2 text-sm">
                      <div>
                        <div className="text-xs opacity-60">Status</div>
                        <div className="font-medium">{safe(currentLaunch, "status.name", currentLaunch.status || "—")}</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60">Rocket</div>
                        <div className="font-medium">{safe(currentLaunch, "rocket.configuration.name", safe(currentLaunch, "rocket.name", "—"))}</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60">Pad</div>
                        <div className="font-medium">{safe(currentLaunch, "pad.name", safe(currentLaunch, "pad", "—"))}</div>
                        <div className="text-xs opacity-60">{safe(currentLaunch, "pad.location.name", safe(currentLaunch, "pad.location", ""))}</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60">Mission</div>
                        <div className="font-medium">{safe(currentLaunch, "mission.name", safe(currentLaunch, "mission", "—"))}</div>
                        <div className="text-xs opacity-60">{safe(currentLaunch, "mission.description", "")}</div>
                      </div>

                      <div>
                        <div className="text-xs opacity-60">Window</div>
                        <div className="font-medium">{formatDate(currentLaunch.net)} {currentLaunch.window_start ? `— ${formatDate(currentLaunch.window_end)}` : ""}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      <Button className="cursor-pointer" variant="outline" onClick={() => { if (currentLaunch?.url) window.open(currentLaunch.url, "_blank"); else showToast("info", "No external URL"); }}><ExternalLink /> View on Launch Library</Button>
                    </div>
                  </div>

                  {/* Right: content and full fields */}
                  <div className={clsx("p-4 rounded-xl border col-span-1 md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-semibold mb-2">Overview</div>
                        <div className="text-sm leading-relaxed mb-3">
                          {currentLaunch.mission?.description || currentLaunch.summary || currentLaunch.name || "No mission summary available."}
                        </div>
                        <div className="text-xs opacity-60 flex items-center gap-2">
                          <Calendar className="w-4 h-4" /> {formatDate(currentLaunch.net)}
                          <Rocket className="w-4 h-4 ml-3" /> {safe(currentLaunch, "rocket.configuration.name", safe(currentLaunch, "rocket.name", "—"))}
                          <MapPin className="w-4 h-4 ml-3" /> {safe(currentLaunch, "pad.location.name", safe(currentLaunch, "pad.name", "—"))}
                        </div>
                      </div>

                      <div className="ml-4 flex flex-col gap-2">
                        <Button variant="ghost" onClick={() => copyLaunchToClipboard()}><Copy /></Button>
                        <Button variant="ghost" onClick={() => downloadJSON()}><Download /></Button>
                        <Button variant="ghost" onClick={() => setShowRaw(s => !s)}><List /></Button>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    <div className="text-sm font-semibold mb-2">Full fields</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.keys(currentLaunch).map((k) => (
                        <div key={k} className="p-2 rounded-md border break-words">
                          <div className="text-xs opacity-60">{k}</div>
                          <div className="text-sm font-medium">{typeof currentLaunch[k] === "object" ? prettyJSON(currentLaunch[k]) : (currentLaunch[k] ?? "—")}</div>
                        </div>
                      ))}
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

        {/* Right: quick actions */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold mb-2">Developer</div>
            <div className="text-xs opacity-60">Endpoint & quick actions</div>
            <div className="mt-2 space-y-2 grid grid-cols-1 gap-2">
              <Button className="cursor-pointer" variant="outline" onClick={() => { navigator.clipboard.writeText(`${BASE_ENDPOINT}`); showToast("success", "Endpoint copied"); }}><Copy /> Copy Endpoint</Button>
              <Button className="cursor-pointer" variant="outline" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
              <Button className="cursor-pointer" variant="outline" onClick={() => setShowRaw((s) => !s)}><List /> Toggle Raw</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Quick info</div>
            <div className="text-xs opacity-60">Primary fields shown: name, provider, rocket, pad, mission, window</div>
          </div>
        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{currentLaunch?.name || "Image"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {currentLaunch?.image || currentLaunch?.rocket?.configuration?.image ? (
              <img src={currentLaunch.image || currentLaunch.rocket?.configuration?.image} alt={currentLaunch?.name} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image from Launch Library</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
              <Button variant="outline" onClick={() => { if (currentLaunch?.url) window.open(currentLaunch.url, "_blank"); }}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
