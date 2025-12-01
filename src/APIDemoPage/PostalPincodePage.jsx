// src/pages/PostalPincodePage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Search,
  Loader2,
  MapPin,
  Copy,
  Download,
  ExternalLink,
  List as MenuIcon,
  BookOpen,
  Check,
  RefreshCw,
  Tag,
  Map,
  Info,
  ChevronRight,
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/* ------------------------ CONFIG ------------------------ */
const DEFAULT_PINCODE = "110001";
const API_ENDPOINT = (pincode) =>
  `https://api.postalpincode.in/pincode/${encodeURIComponent(pincode)}`;

function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function getInitials(name = "") {
  const words = name.trim().split(" ").filter(Boolean);
  if (words.length === 0) return "--";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

/* small helper to build a Google Maps embed URL */
function mapsEmbedUrl(ofc) {
  if (!ofc) return "";
  const q = encodeURIComponent(
    `${ofc.Name}, ${ofc.District}, ${ofc.State}, India`
  );
  // use the Maps Embed search URL
  return `https://www.google.com/maps?q=${q}&output=embed`;
}

/* ============================================================
   MAIN COMPONENT
   ============================================================ */
export default function PostalPincodePage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [pincode, setPincode] = useState(DEFAULT_PINCODE);
  const [loading, setLoading] = useState(false);
  const [rawResp, setRawResp] = useState(null);
  const [postOffices, setPostOffices] = useState([]);
  const [selected, setSelected] = useState(null);
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestFilter, setSuggestFilter] = useState("");
  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);

  // copy animation state
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef(null);

  const suggestTimer = useRef(null);

  /* ------------------- FETCH API ------------------- */
  async function fetchPincode(pin) {
    if (!pin || pin.trim() === "") {
      showToast("info", "Enter a valid PIN.");
      return;
    }

    setLoading(true);
    setRawResp(null);
    setPostOffices([]);
    setSelected(null);

    try {
      const res = await fetch(API_ENDPOINT(pin));
      const json = await res.json();

      const entry = Array.isArray(json) && json.length > 0 ? json[0] : json;
      setRawResp(entry);

      if (!entry?.PostOffice || entry.Status === "Error") {
        showToast("info", entry?.Message || "No results found.");
        setPostOffices([]);
        return;
      }

      setPostOffices(entry.PostOffice);
      setSelected(entry.PostOffice[0]);
      showToast("success", `Found ${entry.PostOffice.length} post offices`);
    } catch (e) {
      showToast("error", "Failed fetching PIN details");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  /* ------------------- Utilities ------------------- */
  function copyJSON() {
    const text = prettyJSON(selected || rawResp || {});
    navigator.clipboard.writeText(text);
    setCopied(true);
    showToast("success", "JSON copied");

    if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
    copyTimeoutRef.current = setTimeout(() => {
      setCopied(false);
    }, 1600);
  }

  function downloadJSON() {
    const data = selected || rawResp;
    if (!data) return showToast("info", "Nothing to download");

    const blob = new Blob([prettyJSON(data)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    const name = (selected?.Name || pincode).replace(/\s+/g, "_");
    a.download = `postal_${name}.json`;
    a.href = url;
    a.click();
    URL.revokeObjectURL(url);

    showToast("success", "Downloaded JSON");
  }

  function openMaps(ofc) {
    if (!ofc) return showToast("info", "Select a post office");
    const q = encodeURIComponent(
      `${ofc.Name}, ${ofc.District}, ${ofc.State}, India`
    );
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, "_blank");
  }

  /* ------------------- Suggestion Filter ------------------- */
  function handleTyping(val) {
    setSuggestFilter(val);
    setShowSuggest(true);

    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => {
      setShowSuggest(true);
    }, 120);
  }

  const filteredSuggestions = useMemo(() => {
    const q = suggestFilter.toLowerCase();
    if (!q) return postOffices;
    return postOffices.filter(
      (p) =>
        (p.Name || "").toLowerCase().includes(q) ||
        (p.District || "").toLowerCase().includes(q) ||
        (p.State || "").toLowerCase().includes(q)
    );
  }, [postOffices, suggestFilter]);

  /* ------------------- 10 Random / Fallback list ------------------- */
  const sidebarList = useMemo(() => {
    // show up to 10 items — if fewer, replicate or make lightweight items
    if (postOffices && postOffices.length >= 10) {
      return postOffices;
    }
    // fallback: create placeholders from available offices or generate synthetic
    const items = [];
    const source = postOffices.length ? postOffices : [{ Name: "Sample Office", District: "Sample", State: "Delhi", Pincode: pincode, BranchType: "Sub Office" }];
    for (let i = 0; i < 10; i++) {
      items.push(source[i % source.length]);
    }
    return items;
  }, [postOffices, pincode]);

  /* ------------------- INITIAL LOAD ------------------- */
  useEffect(() => {
    fetchPincode(DEFAULT_PINCODE);
    return () => {
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      if (suggestTimer.current) clearTimeout(suggestTimer.current);
    };
  }, []);

  /* ------------------- UI Helper ------------------- */
  const fieldRow = (icon, label, val) => (
    <div className="flex items-start gap-3 p-3 rounded-lg border">
      <div className="w-8 h-8 rounded-md flex items-center justify-center text-sm font-semibold bg-zinc-100 dark:bg-zinc-800">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-xs opacity-70">{label}</div>
        <div className="text-sm font-medium">{val ?? "—"}</div>
      </div>
    </div>
  );

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="min-h-screen p-4 md:p-6 pb-10 max-w-8xl mx-auto relative">

      {/* ---------------- HEADER ---------------- */}
      <header className="flex items-center flex-wrap justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          {/* Mobile menu for sheet */}
          <div className="md:hidden">
            <Sheet open={mobileSheetOpen} onOpenChange={setMobileSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="cursor-pointer">
                  <MenuIcon />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] p-3">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Tag />
                    <div>
                      <div className="text-sm font-semibold">Offices</div>
                      <div className="text-xs opacity-60">{postOffices.length} results</div>
                    </div>
                  </div>
                
                </div>

                <ScrollArea className="h-[70vh]">
                  <div className="space-y-2">
                    {sidebarList.map((po, i) => (
                      <div
                        key={i}
                        onClick={() => { setSelected(po); setMobileSheetOpen(false); }}
                        className={clsx(
                          "flex items-center gap-3 p-3 rounded-lg cursor-pointer",
                          selected === po ? "bg-zinc-100 dark:bg-zinc-800" : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                        )}
                      >
                        <div className="w-10 h-10 rounded-md flex items-center justify-center bg-zinc-200 dark:bg-zinc-900 font-bold">
                          {getInitials(po.Name)}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium">{po.Name}</div>
                          <div className="text-xs opacity-60">{po.BranchType} • {po.District}</div>
                        </div>
                        <div className="text-xs opacity-60">{po.Pincode}</div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          </div>

          <div>
            <h1 className="text-2xl md:text-4xl font-extrabold leading-tight">Indian Postal PIN Lookup</h1>
            <p className="text-xs md:text-sm opacity-70 mt-0.5">Find Post Office details quickly — map, raw JSON & download.</p>
          </div>
        </div>

        {/* Search Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchPincode(pincode);
          }}
          className={clsx(
            "flex items-center gap-2 rounded-xl px-3 py-2 w-full md:w-[520px] max-w-[720px]",
            isDark
              ? "bg-black/60 border border-zinc-800"
              : "bg-white border border-zinc-200"
          )}
        >
          <Search className="opacity-60" />
          <Input
            placeholder="Enter PIN (e.g., 110001)"
            value={pincode}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
            className="bg-transparent border-0"
          />
          <Button
            variant="ghost"
            type="submit"
            className="cursor-pointer"
            title="Search PIN"
          >
            {loading ? <Loader2 className="animate-spin" /> : <Search />}
          </Button>
        </form>
      </header>

      {/* ---------------- SUGGESTIONS (floating) ---------------- */}
      <AnimatePresence>
        {showSuggest && filteredSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={clsx(
              "absolute left-4 right-4 md:left-1/2 md:-translate-x-1/2 top-[96px] max-w-2xl rounded-2xl overflow-hidden shadow-xl z-50",
              isDark ? "bg-black/80 border border-zinc-800" : "bg-white"
            )}
          >
            <div className="flex justify-between items-center px-4 py-2 border-b border-zinc-700/20">
              <div className="text-xs opacity-70">{postOffices.length} offices for PIN {pincode}</div>
              <Input
                placeholder="Filter by name/district/state…"
                value={suggestFilter}
                onChange={(e) => handleTyping(e.target.value)}
                className="w-52 text-xs"
              />
            </div>

            <div className="max-h-80 overflow-auto">
              {filteredSuggestions.map((po, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/40 cursor-pointer transition"
                  onClick={() => {
                    setSelected(po);
                    setShowSuggest(false);
                  }}
                >
                  <div className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-sm" style={{ background: isDark ? "#111" : "#f3f3f3" }}>
                    {getInitials(po.Name)}
                  </div>

                  <div className="flex-1">
                    <div className="font-medium">{po.Name}</div>
                    <div className="text-xs opacity-60">{po.BranchType} • {po.District}, {po.State}</div>
                  </div>

                  <div className="text-xs opacity-60">{po.Pincode}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- LAYOUT GRID ---------------- */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">

        {/* -------- LEFT LIST (desktop) -------- */}
        <aside className="hidden lg:block lg:col-span-3">
          <Card className={clsx("rounded-2xl border p-0", isDark ? "bg-black/50 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className="p-4 border-b flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">Post Offices</CardTitle>
                <div className="text-xs opacity-60">{postOffices.length} results</div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="cursor-pointer" onClick={() => fetchPincode(pincode)} title="Refresh">
                  <RefreshCw className={clsx(loading ? "animate-spin" : "")} />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-3 max-h-[70vh] overflow-auto">
              <div className="space-y-2">
                {sidebarList.map((po, i) => (
                  <motion.div
                    key={i}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.14, delay: i * 0.02 }}
                    onClick={() => setSelected(po)}
                    className={clsx(
                      "flex items-center gap-3 p-3 rounded-lg cursor-pointer",
                      selected === po ? "bg-zinc-100 dark:bg-zinc-800" : "hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    )}
                  >
                    <div className="w-10 h-10 rounded-md flex items-center justify-center bg-zinc-200 dark:bg-zinc-900 font-bold">
                      {getInitials(po.Name)}
                    </div>

                    <div className="flex-1">
                      <div className="text-sm font-medium">{po.Name}</div>
                      <div className="text-xs opacity-60">{po.BranchType} • {po.District}</div>
                    </div>

                    <div className="text-xs opacity-60">{po.Pincode}</div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* -------- CENTER DETAILS -------- */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl border overflow-hidden", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className="p-6 border-b">
              <div className="flex flex-wrap items-start gap-4">
                {selected ? (
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-bold border dark:border-zinc-300/20 border-zinc-200 shadow-sm" style={{ background: isDark ? "#0b0b0b" : "#efefef" }}>
                      {getInitials(selected.Name)}
                    </div>

                    <div>
                      <CardTitle className="text-xl font-bold mb-1">{selected?.Name}</CardTitle>
                      <div className="flex items-center gap-3">
                        <Badge variant="secondary" className="text-xs">{selected.BranchType}</Badge>
                        <div className="text-sm opacity-70">PIN {selected.Pincode}</div>
                      </div>
                      <p className="text-xs opacity-70 mt-1">{selected.District}, {selected.State}</p>
                    </div>
                  </div>
                ) : (
                  <div className="w-full">
                    <CardTitle className="text-xl font-bold">Select a Post Office</CardTitle>
                    <p className="text-sm opacity-60 mt-1">Choose one from the list or search a PIN to load offices.</p>
                  </div>
                )}

                {/* actions */}
                <div className="ml-auto flex items-center gap-2">
                  <Button variant="outline" onClick={() => setShowRaw(!showRaw)} className="flex items-center gap-2 cursor-pointer">
                    <BookOpen size={16} /> Raw JSON
                  </Button>
                  <Button variant="outline" onClick={() => setDialogOpen(true)} className="flex items-center gap-2 cursor-pointer">
                    <MapPin size={16} /> Map
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {selected ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {fieldRow(<MapPin size={16} />, "District", selected.District)}
                    {fieldRow(<Tag size={16} />, "State", selected.State)}
                    {fieldRow(<Map size={16} />, "Region", selected.Region)}
                    {fieldRow(<Info size={16} />, "Division", selected.Division)}
                    {fieldRow(<Info size={16} />, "Block", selected.Block)}
                    {fieldRow(<Info size={16} />, "Country", selected.Country)}
                    {fieldRow(<Tag size={16} />, "Type", selected.BranchType)}
                    {fieldRow(<Info size={16} />, "Delivery", selected.DeliveryStatus)}
                  </div>

                  {/* small action row */}
                  <div className="flex items-center gap-2 mt-4">
                    <motion.button
                      onClick={copyJSON}
                      whileTap={{ scale: 0.96 }}
                      className={clsx(
                        "flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer",
                        isDark ? "bg-black/60 border-zinc-700" : "bg-white border-zinc-200"
                      )}
                      title="Copy JSON"
                    >
                      <div className="relative w-5 h-5">
                        <AnimatePresence>
                          {!copied ? (
                            <motion.div key="copy" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}>
                              <Copy size={16} />
                            </motion.div>
                          ) : (
                            <motion.div key="check" initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1.05 }} exit={{ opacity: 0 }} >
                              <Check size={16} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                      <span className="text-sm">{copied ? "Copied" : "Copy JSON"}</span>
                    </motion.button>

                    <Button variant="outline" onClick={downloadJSON} className="cursor-pointer">
                      <Download size={16} /> Download
                    </Button>

                    <Button variant="ghost" onClick={() => openMaps(selected)} className="cursor-pointer">
                      <ExternalLink size={16} /> Open in Maps
                    </Button>
                  </div>

                  {/* raw json viewer */}
                  {showRaw && (
                    <pre className="mt-6 p-3 rounded-xl text-xs border overflow-auto max-h-[300px] bg-zinc-50 dark:bg-zinc-900">
                      {prettyJSON(rawResp)}
                    </pre>
                  )}
                </>
              ) : (
                <div className="text-sm opacity-60 py-10 text-center">
                  Select a post office from the list
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* -------- RIGHT ACTIONS & SMALL MAP PREVIEW -------- */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-sm flex items-center gap-2"><Tag /> Actions</h3>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="ghost" onClick={() => { setShowRaw(false); fetchPincode(pincode); }} className="cursor-pointer">
                <RefreshCw size={14} /> Refresh
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Button className="w-full cursor-pointer" variant="outline" onClick={copyJSON}>
              <Copy size={16} /> Copy JSON
            </Button>
            <Button className="w-full cursor-pointer" variant="outline" onClick={downloadJSON}>
              <Download size={16} /> Download JSON
            </Button>
            <Button className="w-full cursor-pointer" variant="outline" onClick={() => fetchPincode(pincode)}>
              <Loader2 size={16} className={loading ? "animate-spin" : ""} /> Refresh
            </Button>
          </div>

          <Separator />

          <h3 className="font-semibold text-sm">Endpoint</h3>
          <p className="text-xs opacity-60 break-all">{API_ENDPOINT(pincode)}</p>
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(API_ENDPOINT(pincode)); showToast("success", "Endpoint copied"); }} className="cursor-pointer">
              <Copy size={14} />
            </Button>
          </div>

          <Separator />

          <h3 className="font-semibold text-sm">Map Preview</h3>
          <div className="rounded-lg overflow-hidden border">
            {selected ? (
              <iframe
                title="map-preview"
                src={mapsEmbedUrl(selected)}
                className="w-full h-40 border-0"
                loading="lazy"
              />
            ) : (
              <div className="h-40 flex items-center justify-center text-xs opacity-60 p-4">Select an office to preview its location.</div>
            )}
          </div>
        </aside>
      </main>

      {/* ---------------- MAP DIALOG ---------------- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl rounded-xl p-3 overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <MapPin /> {selected ? selected.Name : "Map"}
            </DialogTitle>
          </DialogHeader>

          <div className="py-2">
            {selected ? (
              <>
                <div className="w-full h-[60vh]">
                  <iframe
                    title="map-full"
                    src={mapsEmbedUrl(selected)}
                    className="w-full h-full border-0"
                    loading="lazy"
                  />
                </div>

                <div className="p-4 flex gap-2 justify-center">
                  <Button onClick={() => openMaps(selected)} className="cursor-pointer">
                    <ExternalLink size={16} /> Open Google Maps
                  </Button>
                </div>
              </>
            ) : (
              <div className="p-6 text-center text-sm opacity-70">No selection</div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)} className="cursor-pointer">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
