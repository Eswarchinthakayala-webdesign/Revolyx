// src/pages/AdviceApiPage.jsx
// Related uploaded file (for tooling): /mnt/data/NewsApiPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper";

import {
  Search,
  RefreshCcw,
  Quote,
  Copy,
  Download,
  List,
  Loader2,
  Info,
  Check,
  Zap,
  Share2,
  X,
  Shuffle
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";

/* ---------- Endpoint ---------- */
const ADVICE_ENDPOINT = "https://api.adviceslip.com/advice";

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

/* ---------- Small isolated inline copy button (per-button state) ---------- */
function InlineCopy({ text, okLabel = "Copied", className = "" }) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleCopy() {
    if (!text) return showToast("info", "Nothing to copy");
    try {
      setLoading(true);
      await navigator.clipboard.writeText(text);
      setLoading(false);
      setCopied(true);
      showToast("success", okLabel);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      setLoading(false);
      showToast("error", "Copy failed");
    }
  }

  return (
    <button
      onClick={handleCopy}
      className={clsx(
        "inline-flex items-center gap-2 px-3 py-1 rounded-md border transition transform hover:-translate-y-0.5",
        "cursor-pointer select-none",
        className
      )}
      aria-label="Copy"
    >
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.span key="lod" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Loader2 className="w-4 h-4 animate-spin" />
          </motion.span>
        ) : copied ? (
          <motion.span key="ok" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
            <Check className="w-4 h-4 text-emerald-500" />
          </motion.span>
        ) : (
          <motion.span key="copy" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <Copy className="w-4 h-4" />
          </motion.span>
        )}
      </AnimatePresence>

      <span className="text-sm">{loading ? "Copying..." : copied ? "Copied!" : "Copy"}</span>
    </button>
  );
}

/* ---------- Main Page Component ---------- */
export default function AdviceApiPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  /* State */
  const [advice, setAdvice] = useState(null); // { id, advice }
  const [rawResp, setRawResp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [searchID, setSearchID] = useState("");
  const [showRaw, setShowRaw] = useState(false);
  const [pulseId, setPulseId] = useState(0); // change to trigger pulse animation

  const mountedRef = useRef(false);

  /* Fetch functions */
  async function fetchRandom() {
    setLoading(true);
    try {
      // Advice API caches aggressively; add timestamp param to bypass cache
      const res = await fetch(`${ADVICE_ENDPOINT}?timestamp=${Date.now()}`);
      if (!res.ok) {
        showToast("error", "Failed to fetch advice");
        setLoading(false);
        return;
      }
      const json = await res.json();
      const slip = json.slip;
      setAdvice(slip);
      setRawResp(json);
      setPulseId((p) => p + 1); // trigger pulse / glow
      showToast("success", "New advice loaded");
    } catch (err) {
      console.error(err);
      showToast("error", "Network error");
    } finally {
      setLoading(false);
    }
  }

  async function fetchByID(id) {
    if (!id) {
      showToast("info", "Enter an ID (1–250)");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${ADVICE_ENDPOINT}/${encodeURIComponent(id)}?timestamp=${Date.now()}`);
      if (!res.ok) {
        showToast("error", `API error ${res.status}`);
        setLoading(false);
        return;
      }
      const json = await res.json();
      if (!json.slip) {
        showToast("info", "No advice for that ID");
        setLoading(false);
        return;
      }
      setAdvice(json.slip);
      setRawResp(json);
      setPulseId((p) => p + 1);
      showToast("success", `Advice #${id} loaded`);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // load a random advice once on first mount
    if (!mountedRef.current) {
      fetchRandom();
      mountedRef.current = true;
    }
  }, []);

  /* Exports */
  function copyJSON() {
    if (!rawResp) return showToast("info", "Nothing to copy");
    navigator.clipboard.writeText(prettyJSON(rawResp));
    showToast("success", "JSON copied");
  }

  function downloadJSON() {
    if (!rawResp) return showToast("info", "Nothing to download");
    const blob = new Blob([prettyJSON(rawResp)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `advice_${advice?.id ?? "random"}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  /* Derived */
  const neonBorder = isDark
    ? "bg-gradient-to-r from-[#0f172a] via-[#051123] to-[#0b1220] border border-transparent"
    : "bg-gradient-to-r from-[#fffaf0] via-[#fff1cc] to-[#fff3e0] border border-transparent";

  /* UI */
  return (
    <div className={clsx("min-h-screen p-4 md:p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold flex items-center gap-3">
            <motion.span
              initial={{ y: -4, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.05 }}
              className={clsx("p-2 rounded-md", isDark ? "bg-gradient-to-br from-[#0ea5e9]/10 via-[#7c3aed]/8 to-[#ef4444]/6" : "bg-gradient-to-br from-[#f0f9ff]/60 to-[#fff1f2]/50")}
            >
              <Quote className="w-6 h-6 zinc-400" />
            </motion.span>
            WiseWords
          </h1>
          <p className="mt-1 text-sm opacity-70 max-w-md">Vibrant, animated advice cards — random or by ID. Fresh results every time.</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchByID(searchID.trim());
          }}
          className={clsx(
            "w-full md:w-auto flex items-center gap-2 rounded-xl px-3 py-2",
            isDark ? "bg-black/50 border border-zinc-800" : "bg-white border border-zinc-200 shadow-sm"
          )}
        >
          <Search className="opacity-60" />
          <Input
            placeholder="Find advice by ID (e.g. 45) or leave blank for new"
            value={searchID}
            onChange={(e) => setSearchID(e.target.value)}
            className="border-0 bg-transparent outline-none"
            aria-label="Search advice id"
          />
          <Button type="submit" variant="outline" className="cursor-pointer">
            <Search />
          </Button>
          <Button
            type="button"
            variant="ghost"
            className="cursor-pointer"
            onClick={() => {
              setSearchID("");
              fetchRandom();
            }}
            title="Random"
          >
            <RefreshCcw className={loading ? "animate-spin" : ""} />
          </Button>
        </form>
      </header>

      {/* Main layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Center: big vibrant quote */}
        <section className="lg:col-span-9">
          <Card className={clsx("overflow-hidden rounded-2xl relative dark:bg-black bg-white")}>
            {/* Neon frame */}
            <div className={clsx("absolute inset-0 pointer-events-none rounded-2xl", "opacity-30")}></div>

            <CardHeader className={clsx("p-6 relative z-10 bg-transparent")}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-lg md:text-xl">Daily Advice</CardTitle>
                  <div className="text-xs opacity-60 mt-1">A short nugget of wisdom — refreshed on demand.</div>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" className="cursor-pointer" onClick={() => fetchRandom()}>
                    <Shuffle /> {/* small lightning for flair */}
                  </Button>
                  <Button variant="ghost" className="cursor-pointer" onClick={() => setShowRaw((s) => !s)}>
                    <List /> {showRaw ? "Hide" : "Raw"}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-8 relative z-10">
              {/* Animated glowing quote container */}
              <div className="w-full">
                <div className="relative">
                  {/* floating quote icon */}
                  <motion.div
                    key={`quote-icon-${pulseId}`}
                    initial={{ scale: 0.8, opacity: 0, y: -8 }}
                    animate={{ scale: 1, opacity: 0.12, y: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22 }}
                    className="absolute -left-6 -top-6 w-20 h-20 rounded-full flex items-center justify-center"
                   
                  >
                    <Quote className={clsx("w-10 h-10", isDark ? "text-zinc-300" : "text-zinc-950")} />
                  </motion.div>

                  <div className="ml-8 md:ml-12">
                    <AnimatePresence mode="popLayout">
                      {loading ? (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-16 text-center">
                          <Loader2 className="animate-spin mx-auto" />
                          <div className="mt-3 text-sm opacity-60">Fetching advice…</div>
                        </motion.div>
                      ) : advice ? (
                        <motion.blockquote
                          key={advice.id}
                          initial={{ opacity: 0, y: 8, scale: 0.995 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6 }}
                          transition={{ type: "spring", stiffness: 220, damping: 22 }}
                          className={clsx(
                            "text-2xl md:text-3xl font-extrabold leading-tight",
                            isDark ? "text-white" : "text-zinc-900"
                          )}
                        >
                          {advice.advice}
                        </motion.blockquote>
                      ) : (
                        <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>No advice available.</motion.div>
                      )}
                    </AnimatePresence>

                    {/* meta + actions */}
                    <div className="mt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="text-xs opacity-60">Advice ID</div>
                        <div className="text-sm font-medium">{advice?.id ?? "—"}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <InlineCopy text={advice ? advice.advice : ""} okLabel="Advice copied" className="mr-2" />
                        <button
                          onClick={() => {
                            if (!advice) return showToast("info", "No advice");
                            navigator.share?.({ title: `Advice #${advice.id}`, text: advice.advice }) ??
                              (() => {
                                navigator.clipboard.writeText(`${advice.advice}`);
                                showToast("success", "Copied for sharing");
                              })();
                          }}
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-md border cursor-pointer"
                          title="Share"
                        >
                          <Share2 className="w-4 h-4" />
                          <span className="text-sm">Share</span>
                        </button>

                        <button
                          onClick={() => {
                            if (!advice) return showToast("info", "No advice");
                            downloadJSON();
                          }}
                          className="inline-flex items-center gap-2 px-3 py-1 rounded-md border cursor-pointer"
                          title="Download JSON"
                        >
                          <Download className="w-4 h-4" />
                          <span className="text-sm">Download</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Optional raw */}
                <AnimatePresence>
                  {showRaw && rawResp && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className={clsx("mt-6 p-3 rounded-md border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/70 border-zinc-200")}
                      style={{ maxHeight: 260, overflow: "auto" }}
                    >
                      <pre className="text-xs">{prettyJSON(rawResp)}</pre>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>

            {/* subtle neon pulse when new advice arrives */}
            <motion.div
              key={`pulse-${pulseId}`}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: [0.15, 0.04, 0], scale: [1, 1.02, 1] }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="pointer-events-none absolute inset-0 rounded-2xl"
              style={{
                boxShadow: isDark ? "0 0 40px rgba(99,102,241,0.14) inset" : "0 0 40px rgba(99,102,241,0.06) inset",
              }}
            />
          </Card>
        </section>

        {/* Right: developer and quick actions */}
        <aside className="lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white border-zinc-200")}>
            <CardHeader className="p-4 flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">Developer Tools</CardTitle>
                <div className="text-xs opacity-60">Endpoint, copy & debug</div>
              </div>
              <div className="text-xs opacity-60">v1</div>
            </CardHeader>

            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex flex-col gap-2">
                  <Button className="w-full cursor-pointer" variant="outline" onClick={() => { navigator.clipboard.writeText(ADVICE_ENDPOINT); showToast("success", "Endpoint copied"); }}>
                    <Copy /> Copy Endpoint
                  </Button>

                  <Button className="w-full cursor-pointer" variant="outline" onClick={() => fetchRandom()}>
                    <RefreshCcw className={loading ? "animate-spin" : ""} /> New Random
                  </Button>

                  <Button className="w-full cursor-pointer" variant="outline" onClick={() => downloadJSON()}>
                    <Download /> Download JSON
                  </Button>

                  <Button className="w-full cursor-pointer" variant="ghost" onClick={() => setShowRaw((s) => !s)}>
                    <List /> Toggle Raw
                  </Button>
                </div>

                <Separator />

                <div className="text-xs text-justify opacity-70 flex items-start gap-2">
                  <Info className="w-4 h-4 mt-0.5" />
                  Advice Slip API caches responses. We add a timestamp parameter to ensure fresh results.
                </div>

                <Separator />

                <div className="flex gap-2">
                  <InlineCopy text={advice ? `#${advice.id} — ${advice.advice}` : ""} okLabel="Copied for demo" />
                  <button
                    onClick={() => {
                      if (!advice) return showToast("info", "No advice to show");
                      setShowRaw(true);
                      setTimeout(() => {
                        // noop: keeps raw open
                      }, 300);
                    }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-md border cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                    <span className="text-sm">Open Raw</span>
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={clsx("rounded-2xl p-4 border", isDark ? "bg-black/40 border-zinc-800" : "bg-white border-zinc-200")}>
            <div className="text-sm font-semibold mb-2">About</div>
            <div className="text-xs opacity-70 leading-relaxed">
              The Advice Slip API is a tiny public API that returns fun, short advice slips. Use the random endpoint or query by ID.
            </div>
          </Card>
        </aside>
      </main>
    </div>
  );
}
