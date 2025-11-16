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
      setSavedFacts(local);
    } catch {
      console.error("Localstorage read failed");
    }
  }, []);

  /* Fetch cat fact */
  async function fetchFact() {
    try {
      setLoading(true);

      const resp = await fetch(CATFACT_ENDPOINT);
      if (!resp.ok) throw new Error("API failed");

      const data = await resp.json();
      setCatFact(data?.fact || "No fact found");

      showToast("success", "Fetched a new cat fact!");
    } catch (err) {
      showToast("error", "Failed to fetch cat fact");
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

    const updated = [...savedFacts, catFact];
    setSavedFacts(updated);
    localStorage.setItem("saved_catfacts", JSON.stringify(updated));

    showToast("success", "Cat fact saved!");
  }

  /* Remove saved fact */
  function removeFact(f) {
    const updated = savedFacts.filter((x) => x !== f);
    setSavedFacts(updated);
    localStorage.setItem("saved_catfacts", JSON.stringify(updated));

    showToast("info", "Fact removed");
  }

  /* Copy fact */
  function copyFact() {
    navigator.clipboard.writeText(catFact);
    showToast("success", "Copied fact to clipboard");
  }

  /* Copy endpoint */
  function copyEndpoint() {
    navigator.clipboard.writeText(CATFACT_ENDPOINT);
    showToast("success", "Endpoint copied");
  }

  useEffect(() => {
    fetchFact();
  }, []);

  return (
    <div
      className={clsx(
        "min-h-screen p-6 max-w-8xl mx-auto",
        isDark ? "bg-black text-white" : "bg-white text-black"
      )}
    >
      {/* HEADER */}
      <header className="flex justify-between items-center mb-8">
        <div>
          <h1
            className={clsx(
              "text-3xl md:text-4xl font-extrabold",
              isDark ? "text-white" : "text-black"
            )}
          >
            Revolyx · Cat Fact API
          </h1>
          <p
            className={clsx(
              "opacity-60 text-sm mt-1",
              isDark ? "text-zinc-400" : "text-zinc-600"
            )}
          >
            Fetch random, fun, surprising facts about cats.
          </p>
        </div>

        {/* Mobile Sidebar Button */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              className="lg:hidden cursor-pointer"
              variant="outline"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu />
            </Button>
          </SheetTrigger>

          <SheetContent
            side="left"
            className={clsx("p-4",isDark ? "bg-black text-white" : "bg-white text-black")}
          >
            <Sidebar savedFacts={savedFacts} removeFact={removeFact} isDark={isDark} />
          </SheetContent>
        </Sheet>
      </header>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* LEFT SIDEBAR (Desktop) */}
        <aside
          className={clsx(
            "hidden lg:block p-4 rounded-xl border h-[80vh]",
            isDark ? "border-zinc-800 bg-black/40" : "border-zinc-200 bg-zinc-50"
          )}
        >
          <Sidebar savedFacts={savedFacts} removeFact={removeFact} isDark={isDark} />
        </aside>

        {/* RIGHT CONTENT */}
        <section className="lg:col-span-3 space-y-8">

          {/* PREVIEW CARD */}
          <Card
            className={clsx(
              "rounded-2xl border shadow-lg transition",
              isDark ? "bg-black/40 border-zinc-800" : "bg-white border-zinc-200"
            )}
          >
            <CardHeader className="p-6">
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <Cat /> Random Cat Fact
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 space-y-4">

              {/* FACT TEXT */}
              <motion.div
                key={catFact}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={clsx(
                  "text-lg leading-relaxed rounded-xl p-4",
                  isDark ? "bg-zinc-900 text-zinc-100" : "bg-zinc-100 text-zinc-700"
                )}
              >
                {loading ? (
                  <div className="animate-pulse text-sm opacity-70">
                    Fetching kitty wisdom...
                  </div>
                ) : (
                  <>{catFact}</>
                )}
              </motion.div>

              {/* ACTION BUTTONS */}
              <div className="grid sm:grid-cols-4 grid-cols-2 gap-3 mt-4">
                <Button variant="outline" className="cursor-pointer w-full" onClick={fetchFact}>
                  <RefreshCcw size={16} /> New Fact
                </Button>

                <Button variant="outline" className="cursor-pointer w-full" onClick={copyFact}>
                  <Copy size={16} /> Copy Fact
                </Button>

                <Button variant="outline" className="cursor-pointer w-full" onClick={saveFact}>
                  <Bookmark size={16} /> Save Fact
                </Button>

                <Button variant="outline" className="cursor-pointer w-full" onClick={copyEndpoint}>
                  <Code size={16} /> Copy Endpoint
                </Button>
              </div>

              {/* COLLAPSIBLE CODE BLOCK */}
              <div className="mt-6">
                <Button
                  variant="ghost"
                  className="cursor-pointer flex items-center gap-2"
                  onClick={() => setShowCode(!showCode)}
                >
                  {showCode ? <ChevronUp /> : <ChevronDown />}
                  {showCode ? "Hide Code" : "Show Code"}
                </Button>

                <AnimatePresence>
                  {showCode && (
                    <motion.pre
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className={clsx(
                        "mt-3 p-4 rounded-xl text-sm overflow-auto",
                        isDark ? "bg-zinc-900" : "bg-zinc-100"
                      )}
                    >
{`fetch("https://catfact.ninja/fact")
  .then(r => r.json())
  .then(console.log);`}
                    </motion.pre>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          {/* SAVED FACTS */}
          <div>
            <h2 className="text-xl font-bold mb-3">Saved Cat Facts</h2>

            {savedFacts.length === 0 ? (
              <p className="opacity-60 text-sm">No saved facts yet.</p>
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
                    <p className="text-sm opacity-90 pr-6">{f}</p>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="absolute text-red-600 hover:text-red-500 bg-transparent top-2 right-2 cursor-pointer"
                      onClick={() => removeFact(f)}
                    >
                      <Trash2 size={16} />
                    </Button>
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
            <p className="text-sm opacity-90 pr-6">{f}</p>

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
