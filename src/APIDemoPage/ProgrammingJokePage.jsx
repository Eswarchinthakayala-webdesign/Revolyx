// src/pages/JokeAPIPage.jsx
"use client";

import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Laugh,
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

/* shadcn ui components */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { useTheme } from "@/components/theme-provider";

const JOKE_ENDPOINT =
  "https://v2.jokeapi.dev/joke/Programming?type=single";

export default function JokeAPIPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [joke, setJoke] = useState("");
  const [loading, setLoading] = useState(false);

  const [savedJokes, setSavedJokes] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [showCode, setShowCode] = useState(false);

  /** Load saved jokes */
  useEffect(() => {
    try {
      const local = JSON.parse(localStorage.getItem("saved_jokes") || "[]");
      setSavedJokes(local);
    } catch {
      console.error("Localstorage read failed");
    }
  }, []);

  /** Fetch a programming joke */
  async function fetchJoke() {
    try {
      setLoading(true);

      const resp = await fetch(JOKE_ENDPOINT);
      if (!resp.ok) throw new Error("API failed");

      const data = await resp.json();
      setJoke(data?.joke || "No joke found");

      showToast("success", "Fetched a new joke!");
    } catch (err) {
      showToast("error", "Failed to fetch joke");
    } finally {
      setLoading(false);
    }
  }

  /** Save joke */
  function saveJoke() {
    if (!joke) return;

    if (savedJokes.includes(joke)) {
      showToast("info", "Already saved");
      return;
    }

    const updated = [...savedJokes, joke];
    setSavedJokes(updated);
    localStorage.setItem("saved_jokes", JSON.stringify(updated));

    showToast("success", "Joke saved!");
  }

  /** Remove saved joke */
  function removeSaved(j) {
    const updated = savedJokes.filter((x) => x !== j);
    setSavedJokes(updated);
    localStorage.setItem("saved_jokes", JSON.stringify(updated));

    showToast("info", "Joke removed");
  }

  /** Copy joke */
  function copyJoke() {
    navigator.clipboard.writeText(joke);
    showToast("success", "Copied to clipboard");
  }

  /** Copy endpoint */
  function copyEndpoint() {
    navigator.clipboard.writeText(JOKE_ENDPOINT);
    showToast("success", "Endpoint copied");
  }

  useEffect(() => {
    fetchJoke();
  }, []);

  return (
    <div
      className={clsx(
        "min-h-screen p-6 max-w-8xl mx-auto"
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
            Revolyx · Programming Joke API
          </h1>
          <p
            className={clsx(
              "opacity-60 text-sm mt-1",
              isDark ? "text-zinc-400" : "text-zinc-600"
            )}
          >
            Fetch hilarious programming jokes instantly.
          </p>
        </div>

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
            className={clsx( "p-4",isDark ? "bg-black text-white" : "bg-white text-black")}
          >
            <Sidebar savedJokes={savedJokes} removeSaved={removeSaved} isDark={isDark} />
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
          <Sidebar savedJokes={savedJokes} removeSaved={removeSaved} isDark={isDark} />
        </aside>

        {/* RIGHT SIDE CONTENT */}
        <section className="lg:col-span-3 space-y-8">

          {/* JOKE PREVIEW CARD */}
          <Card
            className={clsx(
              "rounded-2xl border shadow-lg transition",
              isDark ? "bg-black/40 border-zinc-800" : "bg-white border-zinc-200"
            )}
          >
            <CardHeader className="p-6">
              <CardTitle className="flex items-center gap-2 text-xl font-bold">
                <Laugh /> Programming Joke
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 space-y-4">

              {/* JOKE TEXT */}
              <motion.div
                key={joke}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={clsx(
                  "text-lg leading-relaxed rounded-xl p-4",
                  isDark ? "bg-zinc-900 text-zinc-100" : "bg-zinc-100 text-zinc-700"
                )}
              >
                {loading ? (
                  <div className="animate-pulse text-sm opacity-70">Loading joke...</div>
                ) : (
                  <>{joke}</>
                )}
              </motion.div>

              {/* ACTION BUTTONS */}
              <div className="flex flex-wrap gap-3 mt-4">
                <Button
                  variant="outline"
                  className="cursor-pointer"
                  onClick={fetchJoke}
                >
                  <RefreshCcw size={16} /> New Joke
                </Button>

                <Button variant="outline" className="cursor-pointer" onClick={copyJoke}>
                  <Copy size={16} /> Copy Joke
                </Button>

                <Button variant="outline" className="cursor-pointer" onClick={saveJoke}>
                  <Bookmark size={16} /> Save Joke
                </Button>

                <Button
                  variant="outline"
                  className="cursor-pointer"
                  onClick={copyEndpoint}
                >
                  <Code size={16} /> Copy Endpoint
                </Button>
              </div>

              {/* SHOW/HIDE CODE */}
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
{`fetch("https://v2.jokeapi.dev/joke/Programming?type=single")
  .then(res => res.json())
  .then(data => console.log(data.joke));`}
                    </motion.pre>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>

          {/* QUICK SAVED PREVIEW */}
          <div>
            <h2 className="text-xl font-bold mb-3">Saved Jokes</h2>

            {savedJokes.length === 0 ? (
              <p className="opacity-60 text-sm">No saved jokes yet.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {savedJokes.map((j, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={clsx(
                      "p-4 rounded-xl flex flex-row gap-3 justify-between border relative",
                      isDark ? "bg-zinc-900 border-zinc-700" : "bg-zinc-100 border-zinc-300"
                    )}
                  >
                    <p className="text-sm opacity-80">{j}</p>

                    <button
                      
                      className=" text-red-500 hover:text-red-600    cursor-pointer"
                      onClick={() => removeSaved(j)}
                    >
                      <Trash2 size={16} />
                    </button>
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

function Sidebar({ savedJokes, removeSaved, isDark }) {
  return (
    <ScrollArea className="h-full pr-3">
      <h2 className="text-lg font-bold mb-3 flex items-center gap-2">
        <BookmarkCheck /> Saved Jokes
      </h2>

      {savedJokes.length === 0 && (
        <p className="opacity-50 text-sm">No saved jokes</p>
      )}

      <div className="space-y-3">
        {savedJokes.map((j, i) => (
          <div
            key={i}
            className={clsx(
              "p-3 flex flex-row gap-3 rounded-lg border relative",
              isDark ? "border-zinc-700 bg-zinc-900" : "border-zinc-300 bg-zinc-100"
            )}
          >
            <p className="text-sm opacity-90 pr-6">{j}</p>

            <button
              
              className="absolute top-3 text-red-500 hover:text-red-600  right-2 cursor-pointer"
              onClick={() => removeSaved(j)}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
      </div>

      <Separator className="my-4" />
      <p className="text-xs opacity-60">Saved locally in your browser.</p>
    </ScrollArea>
  );
}
