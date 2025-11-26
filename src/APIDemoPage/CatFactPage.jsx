// src/pages/CatFactPage.jsx
"use client";

import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Cat,
  RefreshCcw,
  Copy,
  Bookmark,
  BookmarkCheck,
  Menu,
  Trash2,
  Code,
  ChevronDown,
  ChevronUp,
  Quote,
  Download,
  Eye,
  List,
  Info,
  X,
} from "lucide-react";

import { showToast } from "../lib/ToastHelper";

/* shadcn/ui components */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { useTheme } from "@/components/theme-provider";

const CATFACT_ENDPOINT = "https://catfact.ninja/fact";

export default function CatFactPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [catFact, setCatFact] = useState("");
  const [loading, setLoading] = useState(false);

  const [savedFacts, setSavedFacts] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [showCode, setShowCode] = useState(false);

  /* Load saved facts */
  useEffect(() => {
    try {
      const local = JSON.parse(localStorage.getItem("saved_catfacts") || "[]");
      setSavedFacts(Array.isArray(local) ? local : []);
    } catch {
      console.error("Localstorage read failed");
    }
  }, []);

  /* Fetch cat fact */
  async function fetchFact() {
    try {
      setLoading(true);

      const resp = await fetch(CATFACT_ENDPOINT + "?ts=" + Date.now()); // avoid cache
      if (!resp.ok) throw new Error("API failed");

      const data = await resp.json();
      setCatFact(data?.fact || "No fact found");
      showToast("success", "Fetched a new cat fact!");
    } catch (err) {
      showToast("error", "Failed to fetch cat fact");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  /* Save cat fact */
  function saveFact() {
    if (!catFact) return;

    if (savedFacts.includes(catFact)) {
      showToast("info", "Already saved");
      return;
    }

    const updated = [catFact, ...savedFacts].slice(0, 200); // keep limited history
    setSavedFacts(updated);
    try {
      localStorage.setItem("saved_catfacts", JSON.stringify(updated));
    } catch {
      /* ignore */
    }

    showToast("success", "Cat fact saved!");
  }

  /* Remove saved fact */
  function removeFact(f) {
    const updated = savedFacts.filter((x) => x !== f);
    setSavedFacts(updated);
    try {
      localStorage.setItem("saved_catfacts", JSON.stringify(updated));
    } catch {}
    showToast("info", "Fact removed");
  }

  /* Copy fact */
  async function copyFact() {
    try {
      await navigator.clipboard.writeText(catFact);
      showToast("success", "Copied fact to clipboard");
    } catch {
      showToast("error", "Copy failed");
    }
  }

  /* Copy endpoint */
  function copyEndpoint() {
    try {
      navigator.clipboard.writeText(CATFACT_ENDPOINT);
      showToast("success", "Endpoint copied");
    } catch {
      showToast("error", "Copy failed");
    }
  }

  /* Download JSON (current fact) */
  function downloadFact() {
    const payload = { fact: catFact };
    try {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `catfact_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(a.href);
      showToast("success", "Downloaded fact");
    } catch {
      showToast("error", "Failed to download");
    }
  }

  useEffect(() => {
    fetchFact();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Small UI components for consistent interactive look */
  const headerPanel = (
    <div className="flex items-center gap-3">
      <div className={clsx("rounded-lg p-2", isDark ? "bg-zinc-800" : "bg-zinc-100")}>
        <Cat className="w-6 h-6" />
      </div>
      <div>
        <div className="text-xs opacity-60">Revolyx</div>
        <div className="font-semibold">Cat Fact API</div>
      </div>
    </div>
  );

  return (
    <div
      className={clsx(
        "min-h-screen p-6 pb-10 max-w-8xl overflow-hidden mx-auto",
        isDark ? "bg-black text-white" : "bg-white text-black"
      )}
    >
      {/* HEADER */}
      <header className="flex flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>{headerPanel}</div>

        {/* Mobile Menu (sheet) + Desktop buttons */}
        <div className="flex items-center flex-wrap gap-3">
          {/* Desktop quick actions */}
          <div className="hidden lg:flex items-center gap-2">
            <Button variant="outline" className="cursor-pointer" onClick={fetchFact}>
              <RefreshCcw size={14} /> New Fact
            </Button>
            <Button variant="outline" className="cursor-pointer" onClick={copyFact}>
              <Copy size={14} /> Copy
            </Button>
            <Button variant="outline" className="cursor-pointer" onClick={saveFact}>
              <Bookmark size={14} /> Save
            </Button>
            <Button variant="outline" className="cursor-pointer" onClick={downloadFact}>
              <Download size={14} /> Download
            </Button>
          </div>

          {/* Mobile sheet trigger */}
          <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
            <SheetTrigger asChild>
              <Button
                className="lg:hidden cursor-pointer"
                variant="outline"
                aria-label="Open menu"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu />
              </Button>
            </SheetTrigger>

            <SheetContent side="left" className={clsx("p-4", isDark ? "bg-black text-white" : "bg-white text-black")}>
              <MobileSheetContent
                fetchFact={fetchFact}
                copyFact={copyFact}
                saveFact={saveFact}
                downloadFact={downloadFact}
                copyEndpoint={copyEndpoint}
                savedFacts={savedFacts}
                removeFact={removeFact}
                closeSheet={() => setSidebarOpen(false)}
                isDark={isDark}
              />
            </SheetContent>
          </Sheet>
        </div>
      </header>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* LEFT SIDEBAR (Desktop) */}
        <aside
          className={clsx(
            "hidden lg:block p-4 rounded-xl border h-[80vh] overflow-auto",
            isDark ? "border-zinc-800 bg-black/40" : "border-zinc-200 bg-zinc-50"
          )}
        >
          <Sidebar savedFacts={savedFacts} removeFact={removeFact} isDark={isDark} />
        </aside>

        {/* MAIN CONTENT */}
        <section className="lg:col-span-3 space-y-8">
          {/* PREVIEW CARD */}
          <Card
            className={clsx(
              "rounded-2xl border shadow-lg transition",
              isDark ? "bg-black/40 border-zinc-800" : "bg-white border-zinc-200"
            )}
          >
            <CardHeader className="p-6 flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Cat className="w-6 h-6 opacity-90" />
                  <h2 className="text-lg font-bold">Random Cat Fact</h2>
                </div>
                <p className="text-xs opacity-60 mt-1">Short, surprising facts about our feline friends</p>
              </div>

              {/* small action group for mobile/desktop */}
              <div className="flex items-center gap-2">
                <Button variant="ghost" className="cursor-pointer" onClick={() => setShowCode((s) => !s)}>
                  {showCode ? <ChevronUp /> : <ChevronDown />} {showCode ? "Hide Code" : "Show Code"}
                </Button>

                <Button variant="outline" className="cursor-pointer" onClick={() => setCatFact("") || fetchFact()}>
                  <RefreshCcw size={16} /> New
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              {/* FACT TEXT WITH ICONS */}
              <div className={clsx("rounded-xl p-4", isDark ? "bg-zinc-900 text-zinc-100" : "bg-zinc-100 text-zinc-700")}>
                <div className="flex items-start gap-4">
                  <Quote className="w-7 h-7 opacity-40 mt-1" />
                  <div className="flex-1">
                    <motion.div
                      key={catFact}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 220, damping: 20 }}
                      className="text-lg md:text-xl font-semibold leading-relaxed"
                    >
                      {loading ? (
                        <div className="animate-pulse opacity-70">Fetching kitty wisdom...</div>
                      ) : (
                        catFact || "No cat fact available"
                      )}
                    </motion.div>

                    <div className="mt-3 hidden sm:flex flex-wrap gap-2">
                      <Button variant="outline" className="cursor-pointer" onClick={fetchFact}>
                        <RefreshCcw size={14} /> New Fact
                      </Button>

                      <Button variant="outline" className="cursor-pointer" onClick={copyFact}>
                        <Copy size={14} /> Copy Fact
                      </Button>

                      <Button variant="outline" className="cursor-pointer" onClick={saveFact}>
                        <Bookmark size={14} /> Save Fact
                      </Button>

                      <Button variant="outline" className="cursor-pointer" onClick={downloadFact}>
                        <Download size={14} /> Download
                      </Button>

                      <Button variant="outline" className="cursor-pointer" onClick={copyEndpoint}>
                        <Code size={14} /> Endpoint
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* METADATA ROW */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-md border flex items-center gap-3">
                  <Info className="w-5 h-5 opacity-70" />
                  <div>
                    <div className="text-xs opacity-60">Source</div>
                    <div className="text-sm font-medium">catfact.ninja</div>
                  </div>
                </div>

                <div className="p-3 rounded-md border flex items-center gap-3">
                  <List className="w-5 h-5 opacity-70" />
                  <div>
                    <div className="text-xs opacity-60">Saved</div>
                    <div className="text-sm font-medium">{savedFacts.length}</div>
                  </div>
                </div>

                <div className="p-3 rounded-md border flex items-center gap-3">
                  <Eye className="w-5 h-5 opacity-70" />
                  <div>
                    <div className="text-xs opacity-60">Last fetched</div>
                    <div className="text-sm font-medium">{new Date().toLocaleString()}</div>
                  </div>
                </div>
              </div>

              {/* COLLAPSIBLE CODE BLOCK */}
              <div>
                <AnimatePresence>
                  {showCode && (
                    <motion.pre
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className={clsx(
                        "mt-3 p-4 rounded-xl text-sm overflow-auto",
                        isDark ? "bg-zinc-900 text-zinc-100" : "bg-zinc-100 text-zinc-700"
                      )}
                    >
{`// Simple fetch
fetch("https://catfact.ninja/fact")
  .then(r => r.json())
  .then(data => console.log(data));`}
                    </motion.pre>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          {/* SAVED FACTS */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <BookmarkCheck /> Saved Cat Facts
              </h2>
              <div>
                {savedFacts.length > 0 && (
                  <Button variant="ghost" className="cursor-pointer" onClick={() => { setSavedFacts([]); localStorage.removeItem("saved_catfacts"); showToast("info", "Cleared saved facts"); }}>
                    <Trash2 size={14} /> Clear All
                  </Button>
                )}
              </div>
            </div>

            {savedFacts.length === 0 ? (
              <p className="opacity-60 text-sm">No saved facts yet — save your favorites to keep them.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedFacts.map((f, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={clsx(
                      "p-4 rounded-xl border relative",
                      isDark ? "bg-zinc-900 border-zinc-700" : "bg-zinc-100 border-zinc-300"
                    )}
                  >
                    <p className="text-sm opacity-90 w-[90%] pr-10 truncate">{f}</p>

                    <div className="absolute top-3 right-3 flex items-center gap-2">
                      <Button size="icon" variant="ghost" className="cursor-pointer" onClick={() => { navigator.clipboard.writeText(f); showToast("success", "Copied"); }}>
                        <Copy size={14} />
                      </Button>

                      <Button size="icon" variant="ghost" className="cursor-pointer text-red-600" onClick={() => removeFact(f)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

/* --------------------------------------------- */
/* ---------------- SIDEBAR -------------------- */
/* --------------------------------------------- */

function Sidebar({ savedFacts, removeFact, isDark }) {
  return (
    <ScrollArea className="h-full pr-3">
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
        <BookmarkCheck /> Saved Facts
      </h2>

      {savedFacts.length === 0 && (
        <p className="opacity-50 text-sm">No saved cat facts</p>
      )}

      <div className="space-y-3">
        {savedFacts.map((f, i) => (
          <div
            key={i}
            className={clsx(
              "p-3 rounded-lg border relative",
              isDark ? "border-zinc-700 bg-zinc-900" : "border-zinc-300 bg-zinc-100"
            )}
          >
            <p className="text-sm opacity-90 pr-6 ">{f}</p>

            <Button
              variant="ghost"
              size="icon"
              className="absolute text-red-600 hover:text-red-500 bg-transparent top-2 right-2 cursor-pointer"
              onClick={() => removeFact(f)}
            >
              <Trash2 size={15} />
            </Button>
          </div>
        ))}
      </div>

      <Separator className="my-4" />
      <p className="text-xs opacity-60">Saved locally in your browser.</p>
    </ScrollArea>
  );
}

/* --------------------------------------------- */
/* ------------- MOBILE SHEET CONTENT --------- */
/* --------------------------------------------- */
function MobileSheetContent({ fetchFact, copyFact, saveFact, downloadFact, copyEndpoint, savedFacts, removeFact, closeSheet, isDark }) {
  return (
    <div className={clsx("min-h-full flex flex-col gap-4")}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cat /> <div className="font-semibold">Cat Facts</div>
        </div>
        
      </div>

      <Separator />

      <div className="flex flex-col gap-2">
        <Button variant="outline" className="cursor-pointer" onClick={() => { fetchFact(); closeSheet(); }}>
          <RefreshCcw /> New Fact
        </Button>
        <Button variant="outline" className="cursor-pointer" onClick={() => { copyFact(); closeSheet(); }}>
          <Copy /> Copy Fact
        </Button>
        <Button variant="outline" className="cursor-pointer" onClick={() => { saveFact(); closeSheet(); }}>
          <Bookmark /> Save Fact
        </Button>
        <Button variant="outline" className="cursor-pointer" onClick={() => { downloadFact(); closeSheet(); }}>
          <Download /> Download
        </Button>
        <Button variant="outline" className="cursor-pointer" onClick={() => { copyEndpoint(); closeSheet(); }}>
          <Code /> Endpoint
        </Button>
      </div>

      <Separator />

      <div>
        <h3 className="text-sm font-semibold mb-2">Saved</h3>
        {savedFacts.length === 0 ? (
          <p className="text-sm opacity-60">No saved facts</p>
        ) : (
          <div className="space-y-2">
            {savedFacts.map((f, i) => (
              <div key={i} className={clsx("p-2 rounded border", isDark ? "border-zinc-700 bg-zinc-900" : "border-zinc-300 bg-zinc-100")}>
                <div className="flex items-start justify-between gap-2">
                  <div className="text-xs truncate">{f}</div>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="ghost" className="cursor-pointer" onClick={() => { navigator.clipboard.writeText(f); showToast("success", "Copied"); }}>
                      <Copy size={14} />
                    </Button>
                    <Button size="icon" variant="ghost" className="cursor-pointer text-red-600" onClick={() => removeFact(f)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-auto text-xs opacity-60">
        Saved locally in your browser.
      </div>
    </div>
  );
}
