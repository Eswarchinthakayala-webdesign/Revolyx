// IconHorseProPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  Globe,
  ExternalLink,
  Copy,
  Download,
  ImageIcon,
  Loader2,
  List,
  Info,
  CheckCircle,
  X,
  ChevronDown,
  Code,
  Layers,
  Zap
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
 * IconHorseProPage
 * - Advanced, professional UI for fetching favicons via icon.horse
 * - Uses a local uploaded placeholder at /mnt/data/381e618b-3bdb-461f-b3dd-6a4ce4fa8eed.png
 */

const DEFAULT_PLACEHOLDER = "/mnt/data/381e618b-3bdb-461f-b3dd-6a4ce4fa8eed.png";
const ICON_BASE = "https://icon.horse/icon";

function buildIconUrl(domain) {
  return `${ICON_BASE}/${encodeURIComponent(domain)}`;
}

function prettyBytes(n) {
  if (n == null) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

export default function IconHorseProPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Search / suggestions
  const [query, setQuery] = useState("google.com");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [activeSuggestIdx, setActiveSuggestIdx] = useState(-1);
  const suggestTimer = useRef(null);

  // Selected / fetch state
  const [selectedDomain, setSelectedDomain] = useState("google.com");
  const [directPreviewUrl, setDirectPreviewUrl] = useState(buildIconUrl("google.com")); // always valid direct icon.horse URL
  const [blobPreviewUrl, setBlobPreviewUrl] = useState(null); // objectURL when blob fetched
  const [mimeType, setMimeType] = useState(null);
  const [blobSize, setBlobSize] = useState(null);
  const [fetchStatus, setFetchStatus] = useState(null);
  const [rawHeaders, setRawHeaders] = useState(null);
  const [rawResponseJson, setRawResponseJson] = useState(null); // here we store header/meta as structured JSON
  const [loadingFetch, setLoadingFetch] = useState(false);
  const lastFetchAbort = useRef(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showRawJson, setShowRawJson] = useState(false);

  // suggestions helpers
  const COMMON_SUFFIXES = [".com", ".org", ".io", ".net", ".co", ".in"];
  const POPULAR = ["google.com", "github.com", "twitter.com", "youtube.com", "wikipedia.org", "amazon.com", "apple.com"];

  // Build smart suggestions (small, deterministic)
  function buildSuggestions(q) {
    const t = (q || "").trim();
    if (!t) return POPULAR.map((d) => ({ domain: d }));
    const out = [];
    const hasDot = t.includes(".");
    if (hasDot) {
      out.push({ domain: t });
      if (!t.startsWith("www.")) out.push({ domain: `www.${t}` });
    } else {
      for (const s of COMMON_SUFFIXES) out.push({ domain: `${t}${s}` });
      out.push({ domain: `www.${t}.com` });
    }
    POPULAR.forEach((d) => { if (d.includes(t) && !out.find(o => o.domain === d)) out.push({ domain: d }); });
    return out.slice(0, 8);
  }

  // --- keyboard / suggestion handlers
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);
    setLoadingSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      setSuggestions(buildSuggestions(v));
      setLoadingSuggest(false);
      setActiveSuggestIdx(-1);
    }, 180);
  }

  function onKeyDownInput(e) {
    if (!showSuggest || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveSuggestIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveSuggestIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      if (activeSuggestIdx >= 0) {
        chooseDomain(suggestions[activeSuggestIdx].domain);
        e.preventDefault();
      } else {
        chooseDomain(query);
      }
    } else if (e.key === "Escape") {
      setShowSuggest(false);
    }
  }

  // cleanup for timers and objectURLs
  useEffect(() => {
    return () => {
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
      if (lastFetchAbort.current) lastFetchAbort.current.abort();
      if (blobPreviewUrl && blobPreviewUrl.startsWith("blob:")) URL.revokeObjectURL(blobPreviewUrl);
    };
  }, [blobPreviewUrl]);

  // Fetch behavior: update direct preview URL immediately; then attempt to fetch blob for high-fidelity preview
  async function fetchFavicon(domain) {
    if (!domain) return;
    const liveUrl = buildIconUrl(domain);
    setDirectPreviewUrl(liveUrl);

    // abort previous
    if (lastFetchAbort.current) {
      try { lastFetchAbort.current.abort(); } catch {}
    }
    const controller = new AbortController();
    lastFetchAbort.current = controller;

    // reset metadata
    setLoadingFetch(true);
    setFetchStatus(null);
    setRawHeaders(null);
    setRawResponseJson(null);
    setMimeType(null);
    setBlobSize(null);

    // revoke old blob
    if (blobPreviewUrl?.startsWith("blob:")) {
      try { URL.revokeObjectURL(blobPreviewUrl); } catch {}
      setBlobPreviewUrl(null);
    }

    try {
      const res = await fetch(liveUrl, { signal: controller.signal, cache: "no-store" });
      setFetchStatus(res.status);
      // capture headers
      const headerObj = {};
      for (const [k, v] of res.headers.entries()) headerObj[k] = v;
      setRawHeaders(headerObj);
      // build raw structured info (so we can display "all fields")
      const raw = {
        url: liveUrl,
        status: res.status,
        statusText: res.statusText,
        headers: headerObj
      };
      setRawResponseJson(raw);

      if (!res.ok) {
        showToast("info", `Icon fetch returned ${res.status}. Showing the live URL preview.`);
        setLoadingFetch(false);
        return;
      }

      const blob = await res.blob();
      const objURL = URL.createObjectURL(blob);
      setBlobPreviewUrl(objURL);
      setMimeType(blob.type || headerObj["content-type"] || "unknown");
      setBlobSize(blob.size ?? (headerObj["content-length"] ? Number(headerObj["content-length"]) : null));
      setRawResponseJson({ ...raw, blob: { size: blob.size, type: blob.type } });
      showToast("success", `Fetched favicon for ${domain}`);
    } catch (err) {
      if (err.name === "AbortError") {
        // ignore
      } else {
        console.error("fetchFavicon error:", err);
        showToast("error", "Failed fetching favicon; using live icon.horse URL as fallback");
      }
    } finally {
      setLoadingFetch(false);
    }
  }

  async function chooseDomain(domain) {
    setSelectedDomain(domain);
    setQuery(domain);
    setShowSuggest(false);
    await fetchFavicon(domain);
  }

  // initial load
  useEffect(() => {
    chooseDomain(selectedDomain);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Quick actions
  function copyIconUrl() {
    navigator.clipboard.writeText(buildIconUrl(selectedDomain));
    showToast("success", "Icon URL copied");
  }

  function openIconInNewTab() {
    window.open(buildIconUrl(selectedDomain), "_blank", "noopener");
  }

  async function downloadFavicon() {
    // if blob preview exists, download that; otherwise try to fetch blob again
    try {
      let url = blobPreviewUrl || directPreviewUrl;
      if (!url) return showToast("info", "No icon to download");
      const res = await fetch(url);
      if (!res.ok) return showToast("error", `Download failed (${res.status})`);
      const blob = await res.blob();
      const ext = (blob.type && blob.type.split("/")[1]) || "png";
      const a = document.createElement("a");
      const obj = URL.createObjectURL(blob);
      a.href = obj;
      a.download = `${selectedDomain.replace(/[^a-z0-9]/gi, "_")}_favicon.${ext}`;
      a.click();
      URL.revokeObjectURL(obj);
      showToast("success", "Downloaded favicon");
    } catch (err) {
      console.error(err);
      showToast("error", "Download failed");
    }
  }

  function downloadRawJson() {
    if (!rawResponseJson) return showToast("info", "No raw metadata to download");
    const blob = new Blob([JSON.stringify(rawResponseJson, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${selectedDomain.replace(/\W+/g, "_")}_icon_metadata.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  // UI derived helpers
  const previewSrc = blobPreviewUrl || directPreviewUrl || DEFAULT_PLACEHOLDER;
  const headerBg = isDark ? "bg-black/30 border border-zinc-800" : "bg-white/95 border border-zinc-200";
  const cardBg = isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200";
  const muted = isDark ? "text-zinc-300" : "text-zinc-600";

  return (
    <div className={clsx("min-h-screen p-6 max-w-9xl mx-auto", isDark ? "bg-black text-zinc-100" : "bg-white text-zinc-900")}>
      {/* HEADER: left title, right search on desktop */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-start gap-4">
          <div className="rounded-lg p-2 border" style={{ background: isDark ? "#0b0b0b" : "#fff" }}>
            <ImageIcon className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold leading-tight">IconFetch Pro</h1>
            <p className="mt-1 text-sm opacity-70 max-w-xl">
              Professional favicon inspector — preview, inspect headers & metadata, download original icons, and view raw response.
            </p>
            <div className="mt-3 hidden md:flex items-center gap-3">
              <span className="text-xs opacity-60">Example:</span>
              <div className="text-xs px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-900">{`github.com`}</div>
              <div className="text-xs px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-900">{`wikipedia.org`}</div>
              <div className="text-xs px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-900">{`openai.com`}</div>
            </div>
          </div>
        </div>

        {/* Search (aligned right on desktop) */}
        <div className="w-full md:w-2/5">
          <form
            onSubmit={(e) => { e.preventDefault(); chooseDomain(query); }}
            className={clsx("flex items-center gap-2 rounded-xl p-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}
          >
            <Search className="opacity-60" />
            <Input
              aria-label="Search domain"
              placeholder="Enter domain (e.g. google.com)"
              value={query}
              onChange={(e) => onQueryChange(e.target.value)}
              onKeyDown={onKeyDownInput}
              onFocus={() => { setShowSuggest(true); setSuggestions(buildSuggestions(query)); }}
              className="border-0 bg-transparent outline-none"
            />
            <Button type="submit" variant="outline" className="whitespace-nowrap">Inspect</Button>
            <Button type="button" variant="ghost" onClick={() => chooseDomain("google.com")} title="Quick default"><Globe /></Button>
          </form>

          {/* Suggestions overlay (full width of search) */}
          <AnimatePresence>
            {showSuggest && suggestions.length > 0 && (
              <motion.ul
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                role="listbox"
                className={clsx("mt-2 rounded-xl overflow-hidden shadow-lg z-50", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}
              >
                {loadingSuggest && <li className="p-3 text-sm opacity-60">Generating suggestions…</li>}
                {suggestions.map((s, i) => {
                  const active = i === activeSuggestIdx;
                  return (
                    <li
                      key={s.domain + i}
                      role="option"
                      aria-selected={active}
                      onMouseEnter={() => setActiveSuggestIdx(i)}
                      onMouseLeave={() => setActiveSuggestIdx(-1)}
                      onClick={() => chooseDomain(s.domain)}
                      className={clsx("cursor-pointer px-4 py-3 flex items-center gap-3", active ? "bg-zinc-100 dark:bg-zinc-800" : "hover:bg-zinc-50 dark:hover:bg-zinc-900/40")}
                    >
                      <img src={buildIconUrl(s.domain)} alt={s.domain} className="w-9 h-9 object-contain rounded" />
                      <div className="flex-1">
                        <div className="font-medium">{s.domain}</div>
                        <div className="text-xs opacity-60">{s.domain.replace(/^www\./, "")}</div>
                      </div>
                      <div className="text-xs opacity-60">{i === 0 ? "Top" : `Suggestion ${i + 1}`}</div>
                    </li>
                  );
                })}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* MAIN GRID: left preview (3), center details (6), right quick actions (3) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT: preview card */}
        <aside className="lg:col-span-3">
          <Card className={clsx("rounded-2xl overflow-hidden", headerBg)}>
            <CardHeader className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5" />
                <CardTitle className="text-sm">Preview</CardTitle>
              </div>
              <div className="text-xs opacity-60">Live / Blob</div>
            </CardHeader>

            <CardContent className="p-4 space-y-4">
              <div className={clsx("rounded-xl p-4 border flex flex-col items-center justify-center", cardBg)}>
                <div className="w-full h-40 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 rounded-md overflow-hidden">
                  {loadingFetch ? (
                    <Loader2 className="animate-spin w-12 h-12" />
                  ) : (
                    <img
                      src={previewSrc}
                      alt={`${selectedDomain} favicon`}
                      className="w-20 h-20 object-contain"
                      onError={(e) => { e.currentTarget.src = DEFAULT_PLACEHOLDER; }}
                    />
                  )}
                </div>

                <div className="w-full mt-3 grid grid-cols-1 gap-2">
                  <div className="flex items-center justify-between">
                    <div className="text-xs opacity-60">Domain</div>
                    <div className="font-medium break-all">{selectedDomain}</div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="text-xs opacity-60">Status</div>
                    <div className="font-medium">{fetchStatus ?? (loadingFetch ? "Loading…" : "—")}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs mt-1">
                    <div>
                      <div className="opacity-60 text-[11px]">MIME</div>
                      <div className="font-medium text-sm">{mimeType || "—"}</div>
                    </div>
                    <div>
                      <div className="opacity-60 text-[11px]">Size</div>
                      <div className="font-medium text-sm">{blobSize ? prettyBytes(blobSize) : "—"}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" onClick={copyIconUrl}><Copy /> Copy URL</Button>
                <Button variant="outline" onClick={openIconInNewTab}><ExternalLink /> Open</Button>
              </div>

              <Separator />

              <div className="text-xs opacity-60">Quick note</div>
              <div className="text-sm opacity-70">icon.horse returns normalized favicons. If embedding fails, use a server proxy to fetch and serve images.</div>
            </CardContent>
          </Card>
        </aside>

        {/* CENTER: details + raw */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden", headerBg)}>
            <CardHeader className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Code className="w-5 h-5" />
                <CardTitle className="text-sm">Response & Metadata</CardTitle>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setShowRawJson((s) => !s)}><List /> Raw</Button>
                <Button variant="outline" onClick={() => downloadRawJson()}><Download /> Download JSON</Button>
              </div>
            </CardHeader>

            <CardContent className="p-4">
              <div className={clsx("rounded-md p-3 border mb-3", cardBg)}>
                <div className="text-xs opacity-60">Request URL</div>
                <div className="font-medium text-sm break-all mt-1">{buildIconUrl(selectedDomain)}</div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className={clsx("p-3 rounded-md border", cardBg)}>
                  <div className="text-xs opacity-60">Status</div>
                  <div className="font-medium mt-1">{fetchStatus ?? "—"}</div>

                  <div className="mt-3 text-xs opacity-60">Headers</div>
                  <div className="mt-2 text-sm overflow-auto" style={{ maxHeight: 180 }}>
                    {rawHeaders ? Object.entries(rawHeaders).map(([k, v]) => (
                      <div key={k} className="flex justify-between py-1 border-b last:border-b-0">
                        <div className="opacity-60">{k}</div>
                        <div className="ml-2 break-all">{v}</div>
                      </div>
                    )) : <div className="opacity-60">No headers available</div>}
                  </div>
                </div>

                <div className={clsx("p-3 rounded-md border", cardBg)}>
                  <div className="text-xs opacity-60">Blob info</div>
                  <div className="mt-2 text-sm">
                    <div className="flex justify-between"><div className="opacity-60">MIME</div><div>{mimeType || "—"}</div></div>
                    <div className="flex justify-between mt-1"><div className="opacity-60">Size</div><div>{blobSize ? prettyBytes(blobSize) : "—"}</div></div>
                  </div>

                  <div className="mt-3 text-xs opacity-60">Preview</div>
                  <div className="mt-2">
                    <img src={previewSrc} alt="preview" className="w-12 h-12 object-contain rounded" onError={(e) => { e.currentTarget.src = DEFAULT_PLACEHOLDER; }} />
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {showRawJson && rawResponseJson && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-4 rounded-md p-3 border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm font-semibold">Raw JSON (all fields)</div>
                      <div className="text-xs opacity-60">Structured</div>
                    </div>
                    <ScrollArea style={{ maxHeight: 360 }}>
                      <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(rawResponseJson, null, 2)}</pre>
                    </ScrollArea>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </section>

        {/* RIGHT: quick actions & advanced */}
        <aside className="lg:col-span-3">
          <Card className={clsx("rounded-2xl overflow-hidden", headerBg)}>
            <CardHeader className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-2"><Layers className="w-5 h-5" /><CardTitle className="text-sm">Actions</CardTitle></div>
              <div className="text-xs opacity-60">Utilities</div>
            </CardHeader>

            <CardContent className="p-4 space-y-3">
              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={copyIconUrl}><Copy /> Copy icon.horse URL</Button>
                <Button variant="outline" onClick={openIconInNewTab}><ExternalLink /> Open icon.horse</Button>
                <Button variant="outline" onClick={downloadFavicon}><Download /> Download favicon</Button>
                <Button variant="ghost" onClick={() => setDialogOpen(true)}><ImageIcon /> View large</Button>
                <Button variant="ghost" onClick={() => setShowRawJson(s => !s)}><Code /> Toggle raw</Button>
              </div>

              <Separator />

              <div>
                <div className="text-xs opacity-60">Preview Source</div>
                <div className="text-sm mt-2 break-all">{previewSrc}</div>
              </div>

              <Separator />

              <div>
                <div className="text-xs opacity-60">Tips</div>
                <ul className="text-sm mt-2 list-disc pl-5 space-y-1 opacity-70">
                  <li>Use the Inspect button to quickly fetch & preview.</li>
                  <li>Download saves the icon in original format when possible.</li>
                  <li>If embedding is blocked by remote host, use a server proxy.</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>

      {/* Image modal */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/95" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{selectedDomain} — Favicon</DialogTitle>
          </DialogHeader>

          <div style={{ height: "50vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <img src={previewSrc} alt={`${selectedDomain} favicon`} style={{ height: "200px",width: "200px", objectFit: "cover" }} onError={(e) => { e.currentTarget.src = DEFAULT_PLACEHOLDER; }} />
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Source: icon.horse</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
              <Button variant="outline" onClick={openIconInNewTab}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
