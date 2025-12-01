// src/pages/StoicQuotePage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Loader2,
  Copy,
  Download,
  ExternalLink,
  Twitter,
  X,
  RefreshCw,
  Eye,
  Menu,
  Quote,
  User,
  FileText,
  Sparkles,
  BookOpen,
  Info,
  ListChecks,
  Shuffle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/* ---------------------- CONFIG ---------------------- */
const API_ENDPOINT = "/api/stoic/stoic-quote";
const DEFAULT_PLACEHOLDER = "Type to search or press Generate";

/* ---------------------- HELPERS ---------------------- */
function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

function normalizeResponse(json) {
  if (!json) return null;

  const raw = json;
  const text =
    json.quote ??
    json.text ??
    json.phrase ??
    json.body ??
    json.quoteText ??
    json.content ??
    null;

  const author =
    json.author ??
    json.by ??
    json.person ??
    json.quoter ??
    json.source ??
    null;

  if (!text && typeof json === "string") {
    return { text: json, author: null, raw };
  }

  return { text: text ?? null, author: author ?? null, raw };
}

function pickRandom(arr, n = 10) {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

/* ---------------------- COMPONENT ---------------------- */
export default function StoicQuotePage() {
  /* THEME */
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  /* STATE */
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loading, setLoading] = useState(false);
  const [current, setCurrent] = useState(null);
  const [showRawDialog, setShowRawDialog] = useState(false);
  const [rawVisible, setRawVisible] = useState(false);

  /* Sidebars */
  const [sidebarItems, setSidebarItems] = useState([]);
  const [sheetOpen, setSheetOpen] = useState(false);

  const timerRef = useRef(null);

  /* FETCH QUOTE */
  async function fetchQuote() {
    setLoading(true);
    try {
      const res = await fetch(API_ENDPOINT);
      if (!res.ok) {
        showToast("error", `Fetch failed (${res.status})`);
        setLoading(false);
        return;
      }

      const json = await res.json();
      const normalized = normalizeResponse(json);

      const finalObj =
        normalized?.text
          ? { ...normalized, id: Date.now().toString() }
          : normalizeResponse(json?.data ?? json?.result ?? json?.quote ?? null);

      if (finalObj) {
        setCurrent(finalObj);
        setSuggestions((s) => [finalObj, ...s].slice(0, 40));
      }

      showToast("success", "Quote generated");
    } catch (err) {
      console.error(err);
      showToast("error", "Network error");
    } finally {
      setLoading(false);
    }
  }

  /* INITIAL LOAD */
  useEffect(() => {
    fetchQuote();
    setSidebarItems([]);
  }, []);

  /* FILTER SUGGESTIONS */
  const filteredSuggestions = useMemo(() => {
    if (!query.trim()) return suggestions;
    const q = query.toLowerCase();
    return suggestions.filter((s) => (s.text || "").toLowerCase().includes(q));
  }, [query, suggestions]);

  /* QUERY CHANGE */
  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(() => {
      setShowSuggest(true);
    }, 120);
  }

  /* COPY */
  function copyQuote() {
    if (!current) return;
    navigator.clipboard.writeText(
      `"${current.text}" — ${current.author ?? "Unknown"}`
    );
    showToast("success", "Copied");
  }

  function copyJSON() {
    if (!current) return;
    navigator.clipboard.writeText(prettyJSON(current.raw ?? current));
    showToast("success", "JSON Copied");
  }

  function downloadJSON() {
    if (!current) return;
    const blob = new Blob([prettyJSON(current.raw ?? current)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `stoic_${Date.now()}.json`;
    link.click();
  }

  /* SHARE */
  function shareToTwitter() {
    if (!current?.text) return;
    const text = encodeURIComponent(
      `"${current.text}" — ${current.author ?? "Unknown"}`
    );
    window.open(
      `https://twitter.com/intent/tweet?text=${text}`,
      "_blank"
    );
  }

  /* LOAD FROM SIDEBAR */
  function loadFromSidebar(item) {
    setCurrent(item);
    setSheetOpen(false);
    setRawVisible(false);
  }

  /* GENERATE SIDEBAR QUOTES */
  function generateSidebar() {
    setSidebarItems(pickRandom(suggestions, 10));
  }

  /* UI BADGE STYLE */
  const glassBadge = clsx(
    "text-xs px-2 py-1 rounded-full backdrop-blur",
    isDark
      ? "bg-white/10 border border-white/20 text-zinc-200"
      : "bg-black/10 border border-black/10 text-zinc-800"
  );

  return (
    <div
      className={clsx(
        "min-h-screen p-4 md:p-6 mx-auto max-w-8xl pb-10 transition-colors",
        isDark ? "bg-black text-white" : "bg-white text-zinc-900"
      )}
    >
      {/* ---------------------- HEADER ---------------------- */}
      <header className="flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
        <div className="flex items-center gap-3">
          {/* MOBILE SIDEBAR */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="md:hidden cursor-pointer"
              >
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="left"
              className={clsx(
                "w-[320px] p-0",
                isDark ? "bg-black text-white" : "bg-white text-zinc-900"
              )}
            >
              <div className="p-4 border-b flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Quote />
                  <div>
                    <div className="font-semibold">Stoic Quotes</div>
                    <div className="text-xs opacity-60">Recent picks</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="cursor-pointer"
                    onClick={() => generateSidebar()}
                  >
                    <Shuffle />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setSheetOpen(false)}
                  >
                    <X />
                  </Button>
                </div>
              </div>

              <ScrollArea className="h-[75vh] p-3">
                {sidebarItems.length === 0 ? (
                  <div className="text-xs opacity-60 p-4">
                    No recent quotes yet — generate some.
                  </div>
                ) : (
                  sidebarItems.map((item, i) => (
                    <div
                      key={i}
                      onClick={() => loadFromSidebar(item)}
                      className={clsx(
                        "p-3 mb-3 rounded-xl border cursor-pointer transition hover:shadow-md backdrop-blur",
                        isDark
                          ? "bg-white/5 border-white/10"
                          : "bg-white/70 border-zinc-200"
                      )}
                    >
                      <div className="font-medium line-clamp-2">
                        {item.text}
                      </div>
                      <div className="text-xs opacity-60 mt-1">
                        {item.author ?? "Unknown"}
                      </div>
                    </div>
                  ))
                )}
              </ScrollArea>

              <div className="p-3 border-t flex gap-2">
                <Button
                  variant="outline"
                  className="cursor-pointer w-full"
                  onClick={generateSidebar}
                >
                  <Shuffle /> Refresh
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-2">
          
              Stoic Quote — Daily Pulse
            </h1>
            <p className="text-xs opacity-60 mt-1">
              Pure Stoic wisdom — generate, filter, learn, share.
            </p>
          </div>
        </div>

        {/* SEARCH BAR */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (filteredSuggestions.length > 0) {
              setCurrent(filteredSuggestions[0]);
            } else {
              fetchQuote();
            }
            setShowSuggest(false);
          }}
          className={clsx(
            "flex items-center gap-2 rounded-lg px-3 py-2 w-full md:w-[550px]",
            isDark
              ? "bg-black/40 border border-white/10 backdrop-blur"
              : "bg-white/60 border border-zinc-200 backdrop-blur"
          )}
        >
          <Search className="opacity-60" />
          <Input
            value={query}
            placeholder={DEFAULT_PLACEHOLDER}
            onChange={(e) => onQueryChange(e.target.value)}
            onFocus={() => setShowSuggest(true)}
            className="flex-1 bg-transparent border-none outline-none shadow-none"
          />
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer"
            onClick={() => fetchQuote()}
          >
            <RefreshCw className={loading ? "animate-spin" : ""} />
          </Button>
          <Button type="submit" variant="outline" className="cursor-pointer">
            <Search />
          </Button>
        </form>
      </header>

      {/* ---------------------- SUGGESTION DROPDOWN ---------------------- */}
      <AnimatePresence>
        {showSuggest && filteredSuggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className={clsx(
              "absolute left-4 right-4 md:left-auto md:right-auto md:w-[550px] mt-2 rounded-xl shadow-xl z-50 overflow-hidden",
              isDark
                ? "bg-black/60 border border-white/10 backdrop-blur"
                : "bg-white/90 border border-zinc-200"
            )}
          >
            {filteredSuggestions.map((s, i) => (
              <li
                key={i}
                onClick={() => {
                  setCurrent(s);
                  setShowSuggest(false);
                }}
                className={clsx(
                  "px-4 py-3 cursor-pointer hover:bg-indigo-100/20 transition"
                )}
              >
                <div className="font-medium line-clamp-2">{s.text}</div>
                <div className="text-xs opacity-60">{s.author}</div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* ---------------------- LAYOUT (3 COLUMNS) ---------------------- */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        
        {/* ---------- LEFT: VISUAL CARD ---------- */}
        <section className="lg:col-span-3">
          <Card
            className={clsx(
              "rounded-2xl overflow-hidden border h-full backdrop-blur",
              isDark
                ? "bg-white/5 border-white/10"
                : "bg-white/70 border-zinc-200"
            )}
          >
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Quote /> Quote
              </CardTitle>
              <p className="text-xs opacity-60 mt-1">
                Beautiful large card for focus.
              </p>
            </CardHeader>

            <CardContent className="p-6">
              {loading ? (
                <div className="py-12 text-center">
                  <Loader2 className="animate-spin mx-auto" />
                </div>
              ) : !current ? (
                <div className="py-12 text-center opacity-60">
                  No quote loaded
                </div>
              ) : (
                <>
                  <div className="text-xl font-semibold leading-relaxed mb-4">
                    {current.text}
                  </div>

                  <span className={glassBadge + " inline-flex items-center gap-1"}>
                    <User className="w-3 h-3" />
                    {current.author ?? "Unknown"}
                  </span>

                  <Separator className="my-6" />

                  <div className="text-xs opacity-60">
                    <ExternalLink className="inline w-3 h-3 mr-1" />
                    {API_ENDPOINT}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ---------- CENTER: DETAILS ---------- */}
        <section className="lg:col-span-6">
          <Card
            className={clsx(
              "rounded-2xl overflow-hidden border backdrop-blur",
              isDark
                ? "bg-white/5 border-white/10"
                : "bg-white/70 border-zinc-200"
            )}
          >
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <BookOpen />
                  Details & Breakdown
                </CardTitle>
                <p className="text-xs opacity-60 mt-1">
                  Parsed fields, raw data, author metadata.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => setRawVisible((s) => !s)}
                >
                  <Eye /> {rawVisible ? "Hide Raw" : "Show Raw"}
                </Button>
                <Button
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => fetchQuote()}
                >
                  <RefreshCw className={loading ? "animate-spin" : ""} /> New
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {!current ? (
                <div className="text-center opacity-60">No data available</div>
              ) : (
                <>
                  {/* Summary */}
                  <div>
                    <span className={glassBadge}>
                      <Info className="inline w-3 h-3 mr-1" />
                      Summary
                    </span>

                    <p className="mt-2 text-base leading-relaxed">
                      {current.text}
                    </p>

                    <p className="mt-1 text-sm opacity-70">
                      Author:{" "}
                      <span className="font-medium">
                        {current.author ?? "Unknown"}
                      </span>
                    </p>
                  </div>

                  <Separator className="my-6" />

                  {/* Extracted Fields */}
                  <div>
                    <span className={glassBadge}>
                      <ListChecks className="inline w-3 h-3 mr-1" />
                      Extracted Fields
                    </span>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
                      <div
                        className={clsx(
                          "p-3 rounded-lg border text-sm backdrop-blur",
                          isDark
                            ? "bg-white/5 border-white/10"
                            : "bg-white/90 border-zinc-200"
                        )}
                      >
                        <div className="text-xs opacity-60">Text</div>
                        <div className="font-medium">{current.text}</div>
                      </div>

                      <div
                        className={clsx(
                          "p-3 rounded-lg border text-sm backdrop-blur",
                          isDark
                            ? "bg-white/5 border-white/10"
                            : "bg-white/90 border-zinc-200"
                        )}
                      >
                        <div className="text-xs opacity-60">Author</div>
                        <div className="font-medium">
                          {current.author ?? "Unknown"}
                        </div>
                      </div>

                   
                    </div>
                  </div>

                  <Separator className="my-6" />

                  {/* Raw toggle */}
                  <AnimatePresence>
                    {rawVisible && (
                      <motion.div
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        className={clsx(
                          "p-4 rounded-lg border mt-4 backdrop-blur",
                          isDark
                            ? "bg-white/5 border-white/10"
                            : "bg-white/90 border-zinc-200"
                        )}
                      >
                        <div className="text-xs opacity-60 mb-2">
                          Full Raw Response
                        </div>
                        <pre className="text-xs max-h-80 overflow-auto">
                          {prettyJSON(current.raw ?? current)}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ---------- RIGHT: QUICK ACTIONS ---------- */}
        <section className="lg:col-span-3">
          <Card
            className={clsx(
              "rounded-2xl overflow-hidden border p-4 backdrop-blur",
              isDark
                ? "bg-white/5 border-white/10"
                : "bg-white/70 border-zinc-200"
            )}
          >
            <div className="text-sm font-semibold flex items-center gap-2 mb-2">
           
              Quick Actions
            </div>
            <p className="text-xs opacity-60 mb-4">
              Export, copy, share, inspect response.
            </p>

            <div className="flex flex-col gap-3">
              <Button
                className="cursor-pointer justify-start"
                onClick={copyQuote}
              >
                <Copy className="mr-2" /> Copy Quote
              </Button>

              <Button
                variant="outline"
                className="cursor-pointer justify-start"
                onClick={copyJSON}
              >
                <FileText className="mr-2" /> Copy JSON
              </Button>

              <Button
                variant="outline"
                className="cursor-pointer justify-start"
                onClick={downloadJSON}
              >
                <Download className="mr-2" /> Download JSON
              </Button>

              <Button
                variant="ghost"
                className="cursor-pointer justify-start"
                onClick={shareToTwitter}
              >
                <Twitter className="mr-2" /> Share to Twitter
              </Button>

              <Button
                variant="outline"
                className="cursor-pointer justify-start"
                onClick={() => setShowRawDialog(true)}
              >
                <Eye className="mr-2" /> View Raw JSON
              </Button>

              <Button
                variant="ghost"
                className="cursor-pointer justify-start"
                onClick={() =>
                  current
                    ? window.open(API_ENDPOINT, "_blank")
                    : showToast("info", "Nothing to open")
                }
              >
                <ExternalLink className="mr-2" /> Open API
              </Button>
            </div>
          </Card>
        </section>
      </main>

      {/* ---------------------- RAW JSON DIALOG ---------------------- */}
      <Dialog open={showRawDialog} onOpenChange={setShowRawDialog}>
        <DialogContent
          className={clsx(
            "max-w-3xl w-full rounded-2xl overflow-hidden",
            isDark
              ? "bg-black/90 text-white"
              : "bg-white text-zinc-900"
          )}
        >
          <DialogHeader>
            <DialogTitle>Raw JSON Response</DialogTitle>
          </DialogHeader>

          <div className="max-h-[65vh] overflow-auto p-4">
            <pre className="text-xs">
              {prettyJSON(current?.raw ?? current ?? {})}
            </pre>
          </div>

          <DialogFooter className="flex justify-between border-t p-3">
            <div className="text-xs opacity-60">Stoic Quote API</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setShowRawDialog(false)}>
                <X />
              </Button>
              <Button variant="outline" onClick={copyJSON}>
                <Copy /> Copy JSON
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
