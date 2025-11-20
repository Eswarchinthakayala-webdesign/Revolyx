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
  List,
  X,
  BookOpen,
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
  const words = name.trim().split(" ");
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
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
      showToast("success", `Found ${entry.PostOffice.length} Post Offices`);
    } catch (e) {
      showToast("error", "Failed fetching PIN details");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  /* ------------------- Utilities ------------------- */
  function copyJSON() {
    navigator.clipboard.writeText(
      prettyJSON(selected || rawResp || {})
    );
    showToast("success", "JSON Copied");
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
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`);
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
        p.Name.toLowerCase().includes(q) ||
        p.District.toLowerCase().includes(q) ||
        p.State.toLowerCase().includes(q)
    );
  }, [postOffices, suggestFilter]);

  /* ------------------- INITIAL LOAD ------------------- */
  useEffect(() => {
    fetchPincode(DEFAULT_PINCODE);
  }, []);

  /* ------------------- UI Helper ------------------- */
  const field = (label, val) => (
    <div className="p-3 rounded-md border">
      <div className="text-xs opacity-60">{label}</div>
      <div className="text-sm font-medium">{val ?? "—"}</div>
    </div>
  );

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="min-h-screen p-6 max-w-8xl mx-auto relative">

      {/* ---------------- HEADER ---------------- */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-4xl font-extrabold">Indian Postal PIN Lookup</h1>
          <p className="text-sm opacity-70 mt-1">
            Search for detailed Post Office information — fast & elegant.
          </p>
        </div>

        {/* Search Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchPincode(pincode);
          }}
          className={clsx(
            "flex items-center gap-2 rounded-xl px-3 py-2 w-full md:w-[480px]",
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
          <Button variant="outline" type="submit">
            <Search />
          </Button>
        </form>
      </header>

      {/* ---------------- SUGGESTIONS ---------------- */}
      <AnimatePresence>
        {showSuggest && filteredSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={clsx(
              "absolute left-6 right-6 md:left-1/2 md:-translate-x-1/2 top-[102px] max-w-2xl rounded-2xl overflow-hidden shadow-xl z-50",
              isDark ? "bg-black/80 border border-zinc-800" : "bg-white"
            )}
          >
            {/* Header */}
            <div className="flex justify-between items-center px-4 py-2 border-b border-zinc-700/30">
              <div className="text-xs opacity-70">
                {postOffices.length} offices for PIN {pincode}
              </div>
              <Input
                placeholder="Filter by name/district/state…"
                value={suggestFilter}
                onChange={(e) => handleTyping(e.target.value)}
                className="w-52 text-xs"
              />
            </div>

            {/* Items */}
            {filteredSuggestions.map((po, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/40 cursor-pointer transition"
                onClick={() => {
                  setSelected(po);
                  setShowSuggest(false);
                }}
              >
                {/* Initials Box */}
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center font-bold text-sm"
                  style={{
                    background: isDark ? "#1a1a1a" : "#f3f3f3",
                  }}
                >
                  {getInitials(po.Name)}
                </div>

                <div className="flex-1">
                  <div className="font-medium">{po.Name}</div>
                  <div className="text-xs opacity-60">
                    {po.BranchType} • {po.District}, {po.State}
                  </div>
                </div>

                <div className="text-xs opacity-60">{po.Pincode}</div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ---------------- LAYOUT GRID ---------------- */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">

        {/* -------- LEFT LIST -------- */}
        <aside className="lg:col-span-3 space-y-4">
          <Card
            className={clsx(
              "rounded-2xl border",
              isDark
                ? "bg-black/50 border-zinc-800"
                : "bg-white/90 border-zinc-200"
            )}
          >
            <CardHeader className="p-4 border-b border-zinc-700/20">
              <CardTitle className="text-sm">Post Offices</CardTitle>
              <p className="text-xs opacity-60">{postOffices.length} results</p>
            </CardHeader>

            <CardContent className="p-3 max-h-[450px] overflow-auto space-y-2">
              {loading ? (
                <Loader2 className="animate-spin mx-auto my-6" />
              ) : (
                postOffices.map((po, i) => (
                  <div
                    key={i}
                    onClick={() => setSelected(po)}
                    className={clsx(
                      "p-3 rounded-lg cursor-pointer transition flex items-center gap-3",
                      selected === po
                        ? "dark:bg-zinc-800/40 bg-zinc-200"
                        : "hover:bg-zinc-700/20"
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg dark:bg-zinc-800/50 bg-zinc-300 flex items-center justify-center font-bold text-sm">
                      {getInitials(po.Name)}
                    </div>

                    <div className="flex-1">
                      <div className="text-sm font-medium">{po.Name}</div>
                      <div className="text-xs opacity-60">
                        {po.BranchType} • {po.District}
                      </div>
                    </div>

                    <div className="text-xs opacity-60">{po.Pincode}</div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </aside>

        {/* -------- CENTER DETAILS -------- */}
        <section className="lg:col-span-6 space-y-4">
          <Card
            className={clsx(
              "rounded-2xl border",
              isDark
                ? "bg-black/40 border-zinc-800"
                : "bg-white/90 border-zinc-200"
            )}
          >
            <CardHeader className="p-6 border-b border-zinc-700/20">
              <div className="flex justify-between items-start">

                {/* Left TITLE section */}
                <div className="flex items-center gap-3">
                        {/* Initials Badge */}
                {selected && (
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-xl font-bold border dark:border-zinc-300/50 border-zinc-700/20 shadow-md"
                    style={{
                      background: isDark ? "#111" : "#e8e8e8",
                    }}
                  >
                    {getInitials(selected.Name)}
                  </div>
                )}
                <div>
                  <CardTitle className="text-xl font-bold mb-1">
                    {selected?.Name ?? "Select a Post Office"}
                  </CardTitle>
                  {selected && (
                    <p className="text-sm opacity-70">
                      {selected.BranchType} • PIN {selected.Pincode}
                    </p>
                  )}
                  {selected && (
                    <p className="text-xs opacity-70 mt-1">
                      {selected.District}, {selected.State}
                    </p>
                  )}
                  </div>
                </div>

            
              </div>

              <div className="flex gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowRaw(!showRaw)}
                  className="flex items-center gap-2"
                >
                  <BookOpen size={16} /> Raw JSON
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(true)}
                  className="flex items-center gap-2"
                >
                  <MapPin size={16} /> Map
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {selected ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {field("District", selected.District)}
                    {field("State", selected.State)}
                    {field("Region", selected.Region)}
                    {field("Division", selected.Division)}
                    {field("Block", selected.Block)}
                    {field("Country", selected.Country)}
                    {field("Type", selected.BranchType)}
                    {field("Delivery", selected.DeliveryStatus)}
                  </div>

                  {showRaw && (
                    <pre className="mt-6 p-3 rounded-xl text-xs border overflow-auto max-h-[280px]">
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

        {/* -------- RIGHT ACTIONS -------- */}
        <aside
          className={clsx(
            "lg:col-span-3 rounded-2xl p-4 space-y-4 border",
            isDark
              ? "bg-black/40 border-zinc-800"
              : "bg-white/90 border-zinc-200"
          )}
        >
          <h3 className="font-semibold text-sm">Actions</h3>
          <div className="space-y-2">
            <Button className="w-full" variant="outline" onClick={copyJSON}>
              <Copy size={16} /> Copy JSON
            </Button>
            <Button className="w-full" variant="outline" onClick={downloadJSON}>
              <Download size={16} /> Download JSON
            </Button>
            <Button
              className="w-full"
              variant="outline"
              onClick={() => fetchPincode(pincode)}
            >
              <Loader2
                size={16}
                className={loading ? "animate-spin" : ""}
              />
              Refresh
            </Button>
          </div>

          <Separator />

          <h3 className="font-semibold text-sm">Endpoint</h3>
          <p className="text-xs opacity-60 break-all">
            {API_ENDPOINT(pincode)}
          </p>

          <div className="flex gap-2 mt-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                navigator.clipboard.writeText(API_ENDPOINT(pincode));
                showToast("success", "Endpoint copied");
              }}
            >
              <Copy size={14} />
            </Button>
          </div>
        </aside>
      </main>

      {/* ---------------- MAP DIALOG ---------------- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className={clsx(
            "max-w-lg rounded-xl",
            isDark ? "bg-black/90" : "bg-white"
          )}
        >
          <DialogHeader>
            <DialogTitle>
              {selected ? selected.Name : "Map"}
            </DialogTitle>
          </DialogHeader>

          <div className="py-6 text-center">
            {selected ? (
              <>
                <p className="text-sm opacity-70 mb-4">
                  View this location on Google Maps.
                </p>
                <Button onClick={() => openMaps(selected)}>
                  <ExternalLink size={16} /> Open Google Maps
                </Button>
              </>
            ) : (
              <p className="opacity-60 text-sm">No selection</p>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
