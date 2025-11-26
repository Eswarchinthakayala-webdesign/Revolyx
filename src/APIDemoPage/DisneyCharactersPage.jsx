// src/pages/DisneyCharactersPage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

import {
  Menu,
  Search,
  ImageIcon,
  ExternalLink,
  Copy,
  Download,
  Loader2,
  List,
  ArrowLeftRight,
  Film,
  Tv,
  Users,
  Info,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Check,
  BookText
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";


/* -------------------------------------------------- */
/*                 CONFIG + HELPERS                   */
/* -------------------------------------------------- */

const BASE_ENDPOINT = "https://api.disneyapi.dev/character";
const DEFAULT_MSG = "Search Disney characters by name, e.g. 'Mickey', 'Ariel'...";

function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

function extractItems(json) {
  if (!json) return [];
  if (Array.isArray(json)) return json;
  if (Array.isArray(json.data)) return json.data;
  if (Array.isArray(json.results)) return json.results;
  const vals = Object.values(json).find((v) => Array.isArray(v));
  return vals || [];
}


/* -------------------------------------------------- */
/*                MAIN COMPONENT START                */
/* -------------------------------------------------- */
export default function DisneyCharactersPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  /* ---------------- STATE ---------------- */
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [selected, setSelected] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [loadingSelected, setLoadingSelected] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogImage, setDialogImage] = useState(null);

  const [mobileSidebar, setMobileSidebar] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  const [copied, setCopied] = useState(false);

  const suggestTimer = useRef(null);

  /* -------------------------------------------------- */
  /*                     API CALLS                     */
  /* -------------------------------------------------- */

  async function searchCharacters(name) {
    if (!name || !name.trim()) return setSuggestions([]);

    setLoadingSuggest(true);
    try {
      const url = `${BASE_ENDPOINT}?name=${name}`;
      const res = await fetch(url);
      const json = await res.json();
      setRawResp(json);

      const items = extractItems(json);
      setSuggestions(items);
      setShowSuggest(true);
    } catch {
      showToast("error", "Search failed");
    }
    setLoadingSuggest(false);
  }

  async function fetchById(id) {
    if (!id) return;
    setLoadingSelected(true);
    try {
      const url = `${BASE_ENDPOINT}/${id}`;
      const res = await fetch(url);
      const json = await res.json();

      setRawResp(json);
      const item = json?.data || json;
      setSelected(item);
    } catch {
      showToast("error", "Failed to load character");
    }
    setLoadingSelected(false);
  }


  /* -------------------------------------------------- */
  /*                    HANDLERS                       */
  /* -------------------------------------------------- */

  function onQueryChange(v) {
    setQuery(v);
    setShowSuggest(true);

    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(() => searchCharacters(v), 300);
  }

  function onPickSuggestion(item) {
    const id = item._id || item.id;
    if (id) fetchById(id);
    else {
      setSelected(item);
      setRawResp({ data: [item] });
    }
    setShowSuggest(false);
    setMobileSidebar(false);
  }

  function copyJSON() {
    if (!selected) return showToast("info", "Nothing to copy");

    navigator.clipboard.writeText(prettyJSON(selected));
    setCopied(true);

    setTimeout(() => setCopied(false), 1200);
  }

  function openImageDialog(img) {
    setDialogImage(img);
    setDialogOpen(true);
  }

  function downloadJSON() {
    if (!rawResp) return showToast("info", "Nothing to download");

    const blob = new Blob([prettyJSON(rawResp)], { type: "application/json" });
    const a = document.createElement("a");

    a.href = URL.createObjectURL(blob);
    a.download = (selected?.name || "disney").replace(/\s+/g, "_") + ".json";
    a.click();
  }


  /* -------------------------------------------------- */
  /*            LOAD MICKEY ON FIRST VISIT             */
  /* -------------------------------------------------- */

  useEffect(() => {
    (async () => {
      await searchCharacters("Mickey");
      setTimeout(() => {
        if (suggestions?.[0]) onPickSuggestion(suggestions[0]);
      }, 600);
    })();
  }, []); // eslint-disable-line


  /* -------------------------------------------------- */
  /*                     RENDER UI                     */
  /* -------------------------------------------------- */

  return (
    <div className="min-h-screen max-w-8xl pb-10 mx-auto p-4 md:p-6">
      {/* -------------------------------------------------- */}
      {/*                       HEADER                        */}
      {/* -------------------------------------------------- */}
      <header className="flex items-start md:items-center md:justify-between mb-6">
        {/* MOBILE MENU */}
        <Sheet open={mobileSidebar} onOpenChange={setMobileSidebar}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden cursor-pointer">
              <Menu />
            </Button>
          </SheetTrigger>

          {/* MOBILE SIDEBAR BODY */}
          <SheetContent side="left" className="w-80 p-0">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Characters</SheetTitle>
            </SheetHeader>

                 <form
          onSubmit={(e) => e.preventDefault()}
          className={clsx(
            "flex items-center gap-2 mx-2  px-3 py-2 rounded-lg border",
            isDark ? "bg-black/40 border-zinc-800" : "bg-white border-zinc-200"
          )}
        >
          <Search className="opacity-60" />
          <Input
            placeholder="Search characters..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="border-0 shadow-none bg-transparent"
          />
        </form>

            <ScrollArea className="h-full p-4">
              {suggestions?.map((s, i) => (
                <div
                  key={i}
                  onClick={() => onPickSuggestion(s)}
                  className="flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/40"
                >
                  <img src={s.imageUrl} className="w-12 h-12 object-cover rounded-md" />
                  <div className="flex-1">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs opacity-60">
                      {s.films?.length} films / {s.tvShows?.length} shows
                    </div>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </SheetContent>
        </Sheet>

        {/* TITLE */}
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-2">
            <Sparkles /> Disney Characters
          </h1>
          <p className="text-xs opacity-70 mt-1">
            Search Disney characters, inspect details & export JSON.
          </p>
        </div>

        {/* SEARCH BAR */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className={clsx(
            "hidden md:flex items-center gap-2 w-[420px] px-3 py-2 rounded-lg border",
            isDark ? "bg-black/40 border-zinc-800" : "bg-white border-zinc-200"
          )}
        >
          <Search className="opacity-60" />
          <Input
            placeholder="Search characters..."
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            className="border-0 shadow-none bg-transparent"
          />
        </form>
      </header>

      {/* -------------------------------------------------- */}
      {/*                MAIN LAYOUT GRID                  */}
      {/* -------------------------------------------------- */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT SIDEBAR (desktop only) */}
        <aside
          className={clsx(
            "hidden lg:block col-span-3 p-4 rounded-2xl border",
            isDark ? "bg-black/20 border-zinc-800" : "bg-white/80 border-zinc-200"
          )}
        >
          <div className="flex justify-between items-center mb-3">
            <div className="text-sm font-semibold flex items-center gap-2">
              <List /> Results
            </div>
            <div className="text-xs opacity-60">
              {suggestions.length} items
            </div>
          </div>

          <ScrollArea className="h-[560px] rounded-md border p-2">
            <div className="space-y-2">
              {suggestions.length === 0 && (
                <div className="text-xs opacity-60">
                  Search above to load characters.
                </div>
              )}

              {suggestions.map((s, i) => (
                <div
                  key={i}
                  onClick={() => onPickSuggestion(s)}
                  className={clsx(
                    "flex items-center gap-3 p-2 rounded-md cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/40",
                    selected?.name === s.name ? "ring-2 ring-zinc-400/10" : ""
                  )}
                >
                  <img src={s.imageUrl} className="w-12 h-12 object-cover rounded-md" />
                  <div className="flex-1">
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs opacity-60">
                      {s.films?.length} films
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </aside>

        {/* -------------------------------------------------- */}
        {/*                    MIDDLE PANEL                   */}
        {/* -------------------------------------------------- */}
        <section className="col-span-1 lg:col-span-6">
          <Card
            className={clsx(
              "rounded-2xl overflow-hidden border",
              isDark ? "bg-black/30 border-zinc-800" : "bg-white/90 border-zinc-200"
            )}
          >
            {/* HEADER */}
            <CardHeader
              className={clsx(
                "p-4 flex items-center justify-between border-b",
                isDark ? "border-zinc-800" : "border-zinc-200"
              )}
            >
              <div>
                <CardTitle className="text-xl flex items-center gap-2">
                  <Users /> {selected?.name || "Select a character"}
                </CardTitle>
                <div className="text-xs opacity-60">
                  {selected?._id ? `ID: ${selected._id}` : "No character selected"}
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => setSelected(null)}
                >
                  <ArrowLeftRight />
                </Button>

                <Button
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => openImageDialog(selected?.imageUrl)}
                >
                  <ImageIcon />
                </Button>

                <Button
                  variant="outline"
                  className="cursor-pointer"
                  onClick={() => setShowRaw((s) => !s)}
                >
                  {showRaw ? <ChevronUp /> : <ChevronDown />} Raw
                </Button>
              </div>
            </CardHeader>

            {/* CONTENT */}
            <CardContent className="p-4">
              {loadingSelected ? (
                <div className="py-12 text-center">
                  <Loader2 className="animate-spin mx-auto" />
                </div>
              ) : !selected ? (
                <div className="py-12 text-center text-sm opacity-60">
                  Select a character on the left or search above.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

                  {/* IMAGE */}
                  <div
                    className={clsx(
                      "p-4 rounded-xl border",
                      isDark ? "bg-black/20 border-zinc-800" : "bg-white border-zinc-200"
                    )}
                  >
                    <img
                      src={selected.imageUrl}
                      className="w-full rounded-md object-cover mb-4 max-h-72"
                    />

                    <div className="text-sm opacity-60">Shows</div>
                    <div className="text-sm font-medium mb-3">
                      {selected.tvShows?.join(", ") || "—"}
                    </div>

                    <Separator />

                    <div className="mt-3">
                      <div className="text-sm opacity-60 flex items-center gap-1">
                        Allies
                      </div>
                      <div className="text-sm font-medium">
                        {selected.allies?.join(", ") || "—"}
                      </div>
                    </div>

                    <div className="mt-3">
                      <div className="text-sm opacity-60">Enemies</div>
                      <div className="text-sm font-medium">
                        {selected.enemies?.join(", ") || "—"}
                      </div>
                    </div>
                  </div>

                  {/* DETAILS */}
                  <div
                    className={clsx(
                      "md:col-span-2 p-4 rounded-xl border",
                      isDark ? "bg-black/20 border-zinc-800" : "bg-white border-zinc-200"
                    )}
                  >
                    <div className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <Info /> Overview
                    </div>
                    <div className="text-sm opacity-70 mb-4">
                      {selected.description ||
                        `Appears in ${selected.films?.length} films and ${selected.tvShows?.length} shows.`}
                    </div>

                    <Separator className="my-4" />

                    {/* Appearances */}
                    <div className="text-sm font-semibold flex items-center gap-2 mb-2">
                      <BookText /> Appearances
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Films */}
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60 flex items-center gap-1">
                          <Film /> Films
                        </div>
                        <div className="text-sm font-medium">
                          {selected.films?.join(", ") || "—"}
                        </div>
                      </div>

                      {/* TV Shows */}
                      <div className="p-2 rounded-md border">
                        <div className="text-xs opacity-60 flex items-center gap-1">
                          <Tv /> TV Shows
                        </div>
                        <div className="text-sm font-medium">
                          {selected.tvShows?.join(", ") || "—"}
                        </div>
                      </div>
                    </div>

                    {/* RAW VIEW */}
                    <AnimatePresence>
                      {showRaw && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <Separator className="my-4" />
                          <pre
                            className={clsx(
                              "text-xs p-3 rounded-md border overflow-auto max-h-80",
                              isDark ? "bg-black/40 border-zinc-800" : "bg-white border-zinc-300"
                            )}
                          >
                            {prettyJSON(selected)}
                          </pre>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* -------------------------------------------------- */}
        {/*                  RIGHT QUICK ACTIONS              */}
        {/* -------------------------------------------------- */}
        <aside
          className={clsx(
            "col-span-1 lg:col-span-3 p-4 rounded-2xl space-y-3 border h-fit",
            isDark ? "bg-black/20 border-zinc-800" : "bg-white/90 border-zinc-200"
          )}
        >
          <div className="text-sm font-semibold">Quick Actions</div>

          {/* VIEW IMAGE */}
          <Button
            variant="outline"
            className="w-full cursor-pointer"
            onClick={() => openImageDialog(selected?.imageUrl)}
          >
            <ImageIcon /> View Image
          </Button>

          {/* COPY JSON (animated) */}
          <Button
            variant="outline"
            className="w-full cursor-pointer flex items-center gap-2"
            onClick={copyJSON}
          >
            {copied ? (
              <>
                <Check className="text-green-500" /> Copied!
              </>
            ) : (
              <>
                <Copy /> Copy JSON
              </>
            )}
          </Button>

          {/* DOWNLOAD */}
          <Button
            variant="outline"
            className="w-full cursor-pointer"
            onClick={downloadJSON}
          >
            <Download /> Download JSON
          </Button>

          {/* RELATED */}
          <Button
            variant="outline"
            className="w-full cursor-pointer"
            onClick={() => {
              if (!selected) return showToast("info", "Select a character first");
              const shared = suggestions.filter((s) =>
                s.films?.some((f) => selected.films?.includes(f))
              );
              setSuggestions(shared);
              showToast("success", `${shared.length} related found`);
            }}
          >
            <ArrowLeftRight /> Related (Shared Films)
          </Button>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-1">Developer</div>
            <div className="text-xs opacity-60">Endpoint:</div>
            <code className="text-xs break-all">{BASE_ENDPOINT}</code>
          </div>
        </aside>
      </main>

      {/* IMAGE DIALOG */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl p-0">
          <DialogHeader className="p-4 border-b">
            <DialogTitle>{selected?.name || "Image"}</DialogTitle>
          </DialogHeader>

          <div className="flex items-center justify-center h-[60vh] bg-black/10">
            <img
              src={dialogImage}
              className="max-h-full max-w-full object-contain"
            />
          </div>

          <DialogFooter className="p-4 border-t flex justify-between">
            <div className="text-xs opacity-60">Image from API</div>

            <Button
              variant="outline"
              onClick={() =>
                window.open(
                  `https://www.google.com/search?q=${encodeURIComponent(selected?.name)}`,
                  "_blank"
                )
              }
            >
              <ExternalLink /> Google
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
