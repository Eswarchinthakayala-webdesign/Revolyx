// src/pages/KanyeQuotePage.jsx
"use client";

import React, { useEffect, useState, useRef } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  RefreshCw,
  Twitter,
  Copy,
  Download,
  Eye,
  X,
  Quote,
  Sun,
  Moon,
  Info,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";

/* Optional: if you have a showToast helper in your project, import it instead.
   import { showToast } from "../lib/ToastHelper";
   Fallback minimal toast (uncomment if you don't have a toast system) */
// function showToast(type, msg) {
//   // Very small fallback: browser alert (replace in production).
//   if (type === "error") console.error(msg);
//   else console.log(type, msg);
//   // alert(msg);
// }

/* Endpoint */
const ENDPOINT = "https://api.kanye.rest/";

/* Pretty JSON helper */
function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

/* Component */
export default function KanyeQuotePage() {
  const { theme, setTheme } = useTheme?.() ?? { theme: "system", setTheme: () => {} };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [quoteObj, setQuoteObj] = useState(null); // full JSON from API
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const mountedRef = useRef(false);

  /* Fetch a quote */
  async function fetchQuote() {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(ENDPOINT, { cache: "no-store" });
      if (!res.ok) {
        setErrorMsg(`Network error (${res.status})`);
        setLoading(false);
        return;
      }
      const json = await res.json();
      // API returns { quote: "..." }
      setQuoteObj(json);
    } catch (err) {
      console.error(err);
      setErrorMsg("Failed to fetch quote");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    // initial fetch
    mountedRef.current = true;
    fetchQuote();
    return () => {
      mountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Actions */
  function copyQuote() {
    if (!quoteObj?.quote) return;
    navigator.clipboard.writeText(quoteObj.quote);
    // showToast("success", "Quote copied to clipboard");
  }

  function downloadJSON() {
    const payload = quoteObj || { quote: "" };
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `kanye_quote_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    // showToast("success", "Downloaded JSON");
  }

  function tweetQuote() {
    if (!quoteObj?.quote) return;
    const text = encodeURIComponent(`"${quoteObj.quote}" — Kanye West`);
    const url = `https://twitter.com/intent/tweet?text=${text}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <div className={clsx("min-h-screen p-8 max-w-8xl mx-auto transition-colors", isDark ? "bg-black text-zinc-100" : "bg-white text-zinc-900")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-extrabold leading-tight">
            Kanye Quotes
          </h1>
          <p className="mt-2 text-sm opacity-70 max-w-xl">
            Fetch random Kanye West quotes. Large, clean reading surface with developer tools — copy, tweet, download raw JSON, or fetch a new quote.
          </p>
        </div>

        <div className="flex items-center gap-3">


          <Button onClick={fetchQuote} className="flex items-center gap-2" aria-label="New quote">
            <RefreshCw className={loading ? "animate-spin" : ""} /> New quote
          </Button>
        </div>
      </header>

      {/* Main */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: big quote display */}
        <section className="lg:col-span-8">
          <Card className={clsx("p-0 overflow-hidden rounded-2xl border", isDark ? "bg-black/60 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <div className={clsx("p-10 md:p-14 flex flex-col gap-6 items-start", isDark ? "bg-gradient-to-b from-black/60 to-black/50" : "bg-gradient-to-b from-white/90 to-white/80")}>
              {/* big quote */}
              <div className="flex items-start gap-4">
                <Quote size={48} className="opacity-30" />
                <div>
                  <AnimatePresence mode="wait">
                    <motion.blockquote
                      key={quoteObj?.quote ?? "empty"}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.28 }}
                      className="text-2xl md:text-4xl lg:text-5xl font-extrabold leading-tight max-w-3xl"
                    >
                      {quoteObj?.quote ?? (errorMsg ? "Unable to load quote." : "Loading inspirational chaos...")}
                    </motion.blockquote>
                  </AnimatePresence>

                  <div className="mt-4 flex items-center gap-3">
                    <div className="text-sm opacity-70">— <span className="font-semibold">Kanye West</span></div>
                    <div className="text-xs opacity-50"> · curated</div>
                  </div>
                </div>
              </div>

              {/* action buttons */}
              <div className="flex flex-wrap gap-3 mt-2">
                <Button onClick={copyQuote} className="flex items-center gap-2" aria-label="Copy quote"><Copy /> Copy</Button>
                <Button onClick={tweetQuote} className="flex items-center gap-2" aria-label="Tweet quote" variant="outline"><Twitter /> Tweet</Button>
                <Button onClick={() => setShowRaw(r => !r)} className="flex items-center gap-2" variant="ghost"><Eye /> {showRaw ? "Hide JSON" : "Show JSON"}</Button>
                <Button onClick={downloadJSON} className="flex items-center gap-2" variant="outline"><Download /> Download JSON</Button>
              </div>

              {/* subtle meta & credits */}
              <div className="mt-6 text-xs opacity-60">
                <span>Source: <a className="underline" href={ENDPOINT} target="_blank" rel="noreferrer">api.kanye.rest</a></span>
                <span className="mx-2">·</span>
                <span>Format: <code className="bg-zinc-100/10 px-2 py-0.5 rounded">{`{ "quote": "..." }`}</code></span>
              </div>
            </div>

            {/* raw JSON area */}
            <AnimatePresence>
              {showRaw && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className={clsx("border-t p-4")}
                >
                  <pre className={clsx("text-sm rounded-md p-3 overflow-auto", isDark ? "bg-zinc-900 text-zinc-100" : "bg-zinc-50 text-zinc-900")} style={{ maxHeight: 280 }}>
                    {quoteObj ? prettyJSON(quoteObj) : "No JSON available."}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* Right: details & developer panel */}
        <aside className="lg:col-span-4 space-y-4">
          <Card className={clsx("p-4 rounded-2xl border", isDark ? "bg-black/50 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader>
              <CardTitle className="text-base">Quote Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="text-xs opacity-60">Text</div>
                  <div className="mt-1 text-sm font-medium break-words">{quoteObj?.quote ?? (loading ? "Loading..." : "—")}</div>
                </div>

                <div>
                  <div className="text-xs opacity-60">Author</div>
                  <div className="mt-1 text-sm font-medium">Kanye West</div>
                </div>

                <div>
                  <div className="text-xs opacity-60">Length</div>
                  <div className="mt-1 text-sm font-medium">{quoteObj?.quote ? `${quoteObj.quote.length} characters` : "—"}</div>
                </div>

                <Separator />

                <div>
                  <div className="text-xs opacity-60">Actions</div>
                  <div className="mt-2 flex flex-col gap-2">
                    <Button onClick={fetchQuote} className="flex items-center gap-2"><RefreshCw /> New quote</Button>
                    <Button onClick={() => setDialogOpen(true)} variant="outline" className="flex items-center gap-2"><Info /> Inspect</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={clsx("p-4 rounded-2xl border", isDark ? "bg-black/50 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader>
              <CardTitle className="text-base">Developer</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs opacity-60 mb-2">Endpoint & debugging</div>
              <div className="text-sm break-words p-3 rounded-md border bg-transparent">
                <code className="text-xs">{ENDPOINT}</code>
              </div>

              <div className="mt-3 flex flex-col gap-2">
                <Button onClick={copyQuote} variant="ghost" className="flex items-center gap-2"><Copy /> Copy text</Button>
                <Button onClick={downloadJSON} variant="ghost" className="flex items-center gap-2"><Download /> Download JSON</Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>

      {/* Inspect dialog: big raw JSON view */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>Inspect Raw Response</DialogTitle>
          </DialogHeader>

          <div style={{ maxHeight: "60vh", overflow: "auto" }}>
            <pre className={clsx("text-sm p-4", isDark ? "bg-zinc-900 text-zinc-100" : "bg-zinc-50 text-zinc-900")}>
              {quoteObj ? prettyJSON(quoteObj) : "No response yet."}
            </pre>
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">api.kanye.rest</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* error toast (simple inline) */}
      {errorMsg && (
        <div className="fixed right-6 bottom-6">
          <div className="rounded-lg p-3 bg-red-600 text-white shadow-lg">
            <div className="flex items-center gap-3">
              <div className="font-medium">Error</div>
              <div className="text-sm opacity-90">{errorMsg}</div>
              <button onClick={() => setErrorMsg(null)} className="ml-2 p-1 rounded bg-white/10">
                <X size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
