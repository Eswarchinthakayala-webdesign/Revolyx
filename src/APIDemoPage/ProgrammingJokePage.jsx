// src/pages/JokeAPIPage.jsx
"use client";

import React, { useEffect, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Laugh,
  RefreshCcw,
  Copy,
  Check,
  Menu,
  Code,
  ChevronDown,
  ChevronUp,
  Search,
} from "lucide-react";

import { showToast } from "../lib/ToastHelper";

/* shadcn ui */
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";

const JOKE_ENDPOINT = "https://v2.jokeapi.dev/joke/Programming?type=single";

export default function JokeAPIPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [joke, setJoke] = useState("");
  const [loading, setLoading] = useState(false);
  const [randomJokes, setRandomJokes] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);

  /** Fetch main joke */
  async function fetchJoke(selectedJoke) {
    try {
      setLoading(true);
      if (selectedJoke) {
        setJoke(selectedJoke);
      } else {
        const resp = await fetch(JOKE_ENDPOINT);
        const data = await resp.json();
        setJoke(data?.joke || "No joke found");
      }
      showToast("success", "Fetched a new joke!");
    } catch (err) {
      showToast("error", "Failed to fetch joke");
    } finally {
      setLoading(false);
    }
  }

  /** Load 10 random jokes */
  async function fetchRandomJokes() {
    try {
      const requests = Array.from({ length: 10 }, () =>
        fetch(JOKE_ENDPOINT).then((res) => res.json())
      );
      const results = await Promise.all(requests);
      const list = results.map((d) => d.joke);
      setRandomJokes(list);
      setFiltered(list);
    } catch {
      console.error("Random jokes fetch failed");
    }
  }

  /** Copy */
  function copyJoke() {
    navigator.clipboard.writeText(joke);
    setCopied(true);
    showToast("success", "Copied!");
    setTimeout(() => setCopied(false), 1500);
  }

  function copyEndpoint() {
    navigator.clipboard.writeText(JOKE_ENDPOINT);
    showToast("success", "Endpoint copied");
  }

  /** Search filter */
  function handleSearch(text) {
    setSearch(text);
    if (!text.trim()) {
      setFiltered(randomJokes);
    } else {
      setFiltered(
        randomJokes.filter((j) =>
          j.toLowerCase().includes(text.toLowerCase())
        )
      );
    }
  }

  useEffect(() => {
    fetchJoke();
    fetchRandomJokes();
  }, []);

  return (
    <div className={clsx("min-h-screen pb-10 p-4 md:p-6 max-w-8xl mx-auto")}>
      {/* HEADER */}
      <header className="flex justify-between items-center mb-6 md:mb-10">
        <div>
          <h1
            className={clsx(
              "text-3xl md:text-4xl font-extrabold flex items-center gap-2",
              isDark ? "text-white" : "text-black"
            )}
          >
            <Laugh size={28} /> Revolyx · Programming Jokes
          </h1>

          <p
            className={clsx(
              "opacity-70 text-sm mt-1 flex items-center gap-1",
              isDark ? "text-zinc-400" : "text-zinc-600"
            )}
          >
            Instant programming humor at your fingertips
          </p>
        </div>

        {/* MOBILE SIDEBAR BUTTON */}
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetTrigger asChild>
            <Button
              className="lg:hidden cursor-pointer"
              variant="outline"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={20} /> Jokes
            </Button>
          </SheetTrigger>

          {/* FIXED HEIGHT SIDEBAR */}
          <SheetContent
            side="left"
            className={clsx(
              "p-0 w-80 h-screen flex flex-col",
              isDark ? "bg-zinc-900 text-white" : "bg-white text-black"
            )}
          >
            <Sidebar
              jokes={filtered}
              original={randomJokes}
              fetchJoke={fetchJoke}
              fetchRandomJokes={fetchRandomJokes}
              isDark={isDark}
              search={search}
              handleSearch={handleSearch}
              closeSidebar={() => setSidebarOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </header>

      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* DESKTOP SIDEBAR */}
        <aside
          className={clsx(
            "hidden lg:flex flex-col p-0 rounded-2xl border h-[80vh] overflow-hidden",
            isDark ? "border-zinc-800 bg-zinc-900/40" : "border-zinc-200 bg-zinc-50"
          )}
        >
          <Sidebar
            jokes={filtered}
            original={randomJokes}
            fetchJoke={fetchJoke}
            fetchRandomJokes={fetchRandomJokes}
            isDark={isDark}
            search={search}
            handleSearch={handleSearch}
          />
        </aside>

        {/* MAIN CONTENT */}
        <section className="lg:col-span-3 space-y-8">
          <Card
            className={clsx(
              "rounded-2xl border shadow-lg",
              isDark ? "bg-zinc-900/50 border-zinc-800" : "bg-white border-zinc-200"
            )}
          >
            <CardHeader className="p-6">
              <CardTitle className="flex items-center gap-3 text-xl font-bold">
                <Laugh size={20} /> Joke Preview
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* JOKE */}
              <motion.div
                key={joke}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={clsx(
                  "text-lg leading-relaxed rounded-xl p-6 transition-colors duration-200 cursor-pointer select-none text-center",
                  isDark ? "bg-zinc-900 text-zinc-100" : "bg-zinc-100 text-zinc-700"
                )}
              >
                {loading ? "Loading..." : joke}
              </motion.div>

              {/* BUTTONS */}
              <div className="flex flex-wrap gap-3 mt-4 justify-center">
                <Button className="cursor-pointer" variant="outline" onClick={() => fetchJoke()}>
                  <RefreshCcw size={16} /> New Joke
                </Button>

                <Button className="cursor-pointer" variant="outline" onClick={copyJoke}>
                  <AnimatePresence>
                    {copied ? (
                      <motion.div
                        key="tick"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        className="text-green-500"
                      >
                        <Check size={16} />
                      </motion.div>
                    ) : (
                      <Copy size={16} />
                    )}
                  </AnimatePresence>
                  {copied ? "Copied!" : "Copy"}
                </Button>

                <Button className="cursor-pointer" variant="outline" onClick={copyEndpoint}>
                  <Code size={16} /> Endpoint
                </Button>
              </div>

              {/* RAW CODE */}
              <div className="text-center">
                <Button className="cursor-pointer" variant="ghost" onClick={() => setShowCode(!showCode)}>
                  {showCode ? <ChevronUp /> : <ChevronDown />}
                  {showCode ? "Hide Raw" : "Show Raw"}
                </Button>

                <AnimatePresence>
                  {showCode && (
                    <motion.pre
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className={clsx(
                        "mt-4 p-4 rounded-xl text-sm overflow-auto",
                        isDark
                          ? "bg-zinc-900 text-zinc-100"
                          : "bg-zinc-100 text-zinc-700"
                      )}
                    >
{`fetch("${JOKE_ENDPOINT}")
  .then(r => r.json())
  .then(d => console.log(d.joke));`}
                    </motion.pre>
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

/* ---------------- SIDEBAR COMPONENT ---------------- */
function Sidebar({
  jokes,
  original,
  fetchJoke,
  fetchRandomJokes,
  isDark,
  search,
  handleSearch,
  closeSidebar,
}) {
  return (
    <div className="flex flex-col h-full p-4">
      {/* FIXED TOP CONTENT */}
      <div className="pb-3">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Laugh size={18} /> Random Jokes
          </h2>
          <Button className="cursor-pointer" size="sm" variant="outline" onClick={fetchRandomJokes}>
            <RefreshCcw size={16} />
          </Button>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-2.5 h-4 w-4 opacity-50" />
          <Input
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search jokes..."
            className={clsx("pl-10", isDark ? "bg-zinc-800 text-white" : "bg-white")}
          />
        </div>
      </div>

      {/* SCROLLABLE JOKES LIST */}
      <ScrollArea className="flex-1 pr-3 overflow-y-auto pb-10">
        <div className="space-y-3 flex flex-col">
          {jokes.map((j, i) => (
            <div
              key={i}
              onClick={() => {
                fetchJoke(j);
                closeSidebar?.();
              }}
              className={clsx(
                "cursor-pointer p-3 rounded-xl border transition text-sm",
                isDark
                  ? "bg-zinc-800/50 border-zinc-700 hover:bg-zinc-800"
                  : "bg-white border-zinc-200 hover:bg-zinc-100"
              )}
            >
              {j}
            </div>
          ))}
        </div>

        <Separator className="my-4" />

        <p className="text-xs opacity-60 text-center">
          Showing {jokes.length} jokes
        </p>
      </ScrollArea>
    </div>
  );
}
