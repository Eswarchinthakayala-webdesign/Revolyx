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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

import { useTheme } from "@/components/theme-provider";

/* ----------- Endpoint ----------- */
const ADVICE_ENDPOINT = "https://api.adviceslip.com/advice";

/* ----------- Helpers ----------- */
function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

export default function AdviceApiPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  /* State */
  const [advice, setAdvice] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [loading, setLoading] = useState(false);

  const [searchID, setSearchID] = useState("");
  const [showRaw, setShowRaw] = useState(false);

  /* ----------- Fetch Advice Helpers ----------- */

  async function fetchRandom() {
    setLoading(true);
    try {
      const res = await fetch(ADVICE_ENDPOINT + "?timestamp=" + Date.now()); // prevent caching
      if (!res.ok) {
        showToast("error", "Failed to fetch advice");
        setLoading(false);
        return;
      }
      const json = await res.json();
      const slip = json.slip;

      setAdvice(slip);
      setRawResp(json);
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
      showToast("info", "Enter an ID between 1 - 250");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`https://api.adviceslip.com/advice/${id}`);
      const json = await res.json();

      if (!json.slip) {
        showToast("info", "No advice found for that ID");
        setLoading(false);
        return;
      }

      setAdvice(json.slip);
      setRawResp(json);
      showToast("success", `Advice #${id} loaded`);
    } catch (err) {
      showToast("error", "Error fetching advice");
    } finally {
      setLoading(false);
    }
  }

  /* Load 1 default advice on mount */
  useEffect(() => {
    fetchRandom();
  }, []);

  /* ----------- Export / Copy Helpers ----------- */
  function copyJSON() {
    if (!rawResp) return showToast("info", "Nothing to copy");
    navigator.clipboard.writeText(prettyJSON(rawResp));
    showToast("success", "Copied JSON");
  }

  function downloadJSON() {
    if (!rawResp) return showToast("info", "Nothing to download");
    const blob = new Blob([prettyJSON(rawResp)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `advice_${advice?.id || "random"}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* ----------- Header ----------- */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">WiseWords — Advice</h1>
          <p className="mt-1 text-sm opacity-70">Random advice, lookup by ID, developer tools</p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchByID(searchID);
          }}
          className={clsx(
            "flex items-center gap-2 w-full md:w-[420px] rounded-lg px-2 py-1",
            isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200"
          )}
        >
          <Search className="opacity-60" />
          <Input
            value={searchID}
            onChange={(e) => setSearchID(e.target.value)}
            placeholder="Find advice by ID (1-250)"
            className="border-0 bg-transparent shadow-none outline-none"
          />
          <Button type="submit" variant="outline" className="cursor-pointer">
            <Search />
          </Button>
        </form>
      </header>

      {/* ----------- Main Layout ----------- */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Center */}
        <section className="lg:col-span-9 space-y-4">
          <Card
            className={clsx(
              "rounded-2xl overflow-hidden border",
              isDark ? "bg-black/50 border-zinc-800" : "bg-white border-zinc-200"
            )}
          >
            <CardHeader
              className={clsx(
                "p-5 flex items-center flex-wrap gap-3 justify-between",
                isDark ? "bg-black/40 border-b border-zinc-800" : "bg-white border-b border-zinc-200"
              )}
            >
              <div>
                <CardTitle className="text-lg">Advice</CardTitle>
                <div className="text-xs opacity-60">
                  {advice ? `#${advice.id}` : "No advice loaded"}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={fetchRandom}
                  className="cursor-pointer"
                >
                  <RefreshCcw className={loading ? "animate-spin" : ""} /> New
                </Button>

                <Button
                  variant="ghost"
                  onClick={() => setShowRaw((s) => !s)}
                  className="cursor-pointer"
                >
                  <List /> {showRaw ? "Hide Raw" : "Raw"}
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {loading ? (
                <div className="py-12 text-center">
                  <Loader2 className="animate-spin mx-auto" />
                </div>
              ) : advice ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xl md:text-2xl leading-relaxed flex items-start gap-3"
                >
                  <Quote className="opacity-40 w-6 h-6 mt-1" />
                  <span className="font-semibold">{advice.advice}</span>
                </motion.div>
              ) : (
                <div className="text-sm opacity-60 p-3">No advice found.</div>
              )}
            </CardContent>

            {/* Raw JSON */}
            <AnimatePresence>
              {showRaw && rawResp && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={clsx(
                    "p-4 border-t",
                    isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200"
                  )}
                >
                  <pre
                    className="text-xs overflow-auto"
                    style={{ maxHeight: 260 }}
                  >
                    {prettyJSON(rawResp)}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* Right Panel */}
        <aside
          className={clsx(
            "lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit",
            isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200"
          )}
        >
          <div>
            <div className="text-sm font-semibold mb-2">Developer Tools</div>
            <div className="text-xs opacity-60">Quick debugging utilities</div>

            <div className="mt-3 space-y-2">
              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => {
                  navigator.clipboard.writeText(ADVICE_ENDPOINT);
                  showToast("success", "Endpoint copied");
                }}
              >
                <Copy /> Copy Endpoint
              </Button>

              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={downloadJSON}
              >
                <Download /> Download JSON
              </Button>

              <Button
                variant="outline"
                className="cursor-pointer"
                onClick={() => setShowRaw((s) => !s)}
              >
                <List /> Toggle Raw
              </Button>
            </div>
          </div>

          <Separator />

          <div className="text-xs opacity-60 leading-relaxed flex gap-2">
            <Info className="w-4 h-4 mt-0.5" />
            The Advice Slip API caches aggressively.  
            Adding <code>?timestamp=Date.now()</code> ensures fresh results.
          </div>
        </aside>
      </main>
    </div>
  );
}
