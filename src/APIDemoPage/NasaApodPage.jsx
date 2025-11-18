"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper";

import {
  Calendar,
  Search,
  ImageIcon,
  Video,
  ExternalLink,
  Copy,
  Download,
  Loader2,
  List,
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import { useTheme } from "@/components/theme-provider";

/* ------------------------------------------
   NASA APOD ENDPOINT
--------------------------------------------- */
const BASE = "https://api.nasa.gov/planetary/apod";
const API_KEY = "XGM1tXvMlcK6QFd2NkoeGW4zRwWbUxN3Odez0YBJ"; // replace with env var or your key

function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

export default function NasaApodPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [date, setDate] = useState("");
  const [currentApod, setCurrentApod] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const [suggestions, setSuggestions] = useState([]);
  const [showSuggest, setShowSuggest] = useState(false);
  const suggestTimer = useRef(null);

  /* -----------------------------------
      Fetch APOD 
  ----------------------------------- */
  async function fetchApod(d = "") {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("api_key", API_KEY);
      if (d) params.set("date", d);

      const url = `${BASE}?${params.toString()}`;
      const res = await fetch(url);
      if (!res.ok) {
        showToast("error", `APOD fetch failed (${res.status})`);
        setLoading(false);
        return;
      }

      const json = await res.json();
      setCurrentApod(json);
      setRawResp(json);

      showToast("success", json.title || "Loaded APOD");

    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch APOD");
    } finally {
      setLoading(false);
    }
  }

  /* -----------------------------------
      Suggestion logic (date-based)
  ----------------------------------- */
  function onDateChange(v) {
    setDate(v);
    setShowSuggest(true);

    if (suggestTimer.current) clearTimeout(suggestTimer.current);

    suggestTimer.current = setTimeout(() => {
      buildDateSuggestions(v);
    }, 200);
  }

  function buildDateSuggestions(v) {
    if (!v || v.length < 4) {
      setSuggestions([]);
      return;
    }

    const year = v.split("-")[0];
    const list = [];

    for (let i = 0; i < 10; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);

      const ds = d.toISOString().slice(0, 10);
      if (ds.startsWith(year)) list.push(ds);
    }

    setSuggestions(list);
  }

  /* -----------------------------------
      Initial load: Today's APOD
  ----------------------------------- */
  useEffect(() => {
    fetchApod();
  }, []);

  /* -----------------------------------
      Download JSON
  ----------------------------------- */
  function downloadJSON() {
    if (!rawResp) return;
    const blob = new Blob([prettyJSON(rawResp)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `apod_${rawResp.date}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  function copyEndpoint() {
    const url = `${BASE}?api_key=${API_KEY}${date ? `&date=${date}` : ""}`;
    navigator.clipboard.writeText(url);
    showToast("success", "Endpoint copied");
  }

  /* -----------------------------------
      UI
  ----------------------------------- */
  return (
    <div className="min-h-screen p-6 max-w-8xl overflow-hidden mx-auto">
      {/* -----------------------------------
            HEADER
      ----------------------------------- */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">Cosmos — NASA APOD</h1>
          <p className="mt-1 text-sm opacity-70">
            Astronomy Picture of the Day — explore space daily.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchApod(date);
          }}
          className={clsx(
            "flex items-center gap-2 w-full md:w-[460px] rounded-lg px-2 py-1",
            isDark
              ? "bg-black/60 border border-zinc-800"
              : "bg-white border border-zinc-200"
          )}
        >
          <Calendar className="opacity-60" />
          <Input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            onFocus={() => setShowSuggest(true)}
            className="border-0 bg-transparent shadow-none"
          />
          <Button type="submit" variant="outline" className="cursor-pointer px-3">
            <Search />
          </Button>
        </form>
      </header>

      {/* -----------------------------------
            SUGGESTIONS
      ----------------------------------- */}
      <AnimatePresence>
        {showSuggest && suggestions.length > 0 && (
          <motion.ul
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className={clsx(
              "absolute z-50 left-6 right-6 md:left-[calc(50%_-_230px)] md:right-auto max-w-xl rounded-xl overflow-hidden shadow-xl",
              isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200"
            )}
          >
            {suggestions.map((s) => (
              <li
                key={s}
                className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer text-sm"
                onClick={() => {
                  setDate(s);
                  fetchApod(s);
                  setShowSuggest(false);
                }}
              >
                <div className="font-medium">{s}</div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* -----------------------------------
            MAIN LAYOUT
      ----------------------------------- */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        <section className="lg:col-span-9 space-y-4">

          {/* -----------------------------------
                MAIN APOD CARD
          ----------------------------------- */}
          <Card
            className={clsx(
              "rounded-2xl overflow-hidden border",
              isDark
                ? "bg-black/40 border-zinc-800"
                : "bg-white/90 border-zinc-200"
            )}
          >
            <CardHeader
              className={clsx(
                "p-5 flex items-center flex-wrap gap-3 justify-between",
                isDark
                  ? "bg-black/60 border-b border-zinc-800"
                  : "bg-white/90 border-b border-zinc-200"
              )}
            >
              <div>
                <CardTitle className="text-lg">Astronomy Picture</CardTitle>
                <div className="text-xs opacity-60">
                  {currentApod?.date || "Loading..."}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  className="cursor-pointer"
                  variant="outline"
                  onClick={() => fetchApod(date)}
                >
                  <Loader2 className={loading ? "animate-spin" : ""} /> Refresh
                </Button>
                <Button
                  className="cursor-pointer"
                  variant="ghost"
                  onClick={() => setShowRaw((s) => !s)}
                >
                  <List /> {showRaw ? "Hide" : "Raw"}
                </Button>
                <Button
                  className="cursor-pointer"
                  variant="ghost"
                  onClick={() => setDialogOpen(true)}
                >
                  <ImageIcon /> View
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-12 text-center">
                  <Loader2 className="animate-spin mx-auto" />
                </div>
              ) : !currentApod ? (
                <div className="py-12 text-center text-sm opacity-60">
                  Loading APOD...
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* -----------------------------------
                        LEFT: Image / Video + Meta
                  ----------------------------------- */}
                  <div
                    className={clsx(
                      "p-4 rounded-xl border",
                      isDark
                        ? "bg-black/20 border-zinc-800"
                        : "bg-white/70 border-zinc-200"
                    )}
                  >
                    {/* Image or video */}
                    {currentApod.media_type === "image" ? (
                      <img
                        src={currentApod.url}
                        alt={currentApod.title}
                        className="w-full rounded-md mb-3 object-cover"
                      />
                    ) : (
                      <div className="aspect-video rounded-md overflow-hidden mb-3">
                        <iframe
                          src={currentApod.url}
                          className="w-full h-full"
                        />
                      </div>
                    )}

                    <div className="text-lg font-semibold">{currentApod.title}</div>
                    <div className="text-xs opacity-60 mt-1 flex gap-1 items-center">
                      {currentApod.media_type === "video" ? (
                        <Video className="w-4 h-4" />
                      ) : (
                        <ImageIcon className="w-4 h-4" />
                      )}
                      {currentApod.media_type.toUpperCase()}
                    </div>

                    <div className="mt-3 space-y-2 text-sm">
                      <div>
                        <div className="text-xs opacity-60">Date</div>
                        <div className="font-medium">{currentApod.date}</div>
                      </div>

                      {currentApod.copyright && (
                        <div>
                          <div className="text-xs opacity-60">Copyright</div>
                          <div className="font-medium">{currentApod.copyright}</div>
                        </div>
                      )}

                      {currentApod.hdurl && (
                        <div>
                          <div className="text-xs opacity-60">HD Image</div>
                          <a
                            href={currentApod.hdurl}
                            target="_blank"
                            className="underline text-sm"
                          >
                            Open HD Version
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex flex-col gap-2">
                      <Button
                        className="cursor-pointer"
                        variant="outline"
                        onClick={() =>
                          window.open(
                            currentApod.hdurl || currentApod.url,
                            "_blank"
                          )
                        }
                      >
                        <ExternalLink /> Open Source
                      </Button>
                    </div>
                  </div>

                  {/* -----------------------------------
                        RIGHT: Explanation + all fields
                  ----------------------------------- */}
                  <div
                    className={clsx(
                      "p-4 rounded-xl border col-span-1 md:col-span-2",
                      isDark
                        ? "bg-black/20 border-zinc-800"
                        : "bg-white/70 border-zinc-200"
                    )}
                  >
                    <div className="text-sm font-semibold mb-2">Explanation</div>
                    <div className="text-sm leading-relaxed mb-3">
                      {currentApod.explanation}
                    </div>

                    <Separator className="my-3" />

                    <div className="text-sm font-semibold mb-2">Full Fields (API)</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {Object.keys(currentApod).map((k) => (
                        <div key={k} className="p-2 rounded-md border">
                          <div className="text-xs opacity-60">{k}</div>
                          <div className="text-sm font-medium break-words">
                            {typeof currentApod[k] === "object"
                              ? JSON.stringify(currentApod[k])
                              : currentApod[k]}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>

            {/* -----------------------------------
                  RAW JSON VIEW
            ----------------------------------- */}
            <AnimatePresence>
              {showRaw && rawResp && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className={clsx(
                    "p-4 border-t",
                    isDark
                      ? "bg-black/30 border-zinc-800"
                      : "bg-white/60 border-zinc-200"
                  )}
                >
                  <pre
                    className={clsx(
                      "text-xs overflow-auto",
                      isDark ? "text-zinc-200" : "text-zinc-900"
                    )}
                    style={{ maxHeight: 300 }}
                  >
                    {prettyJSON(rawResp)}
                  </pre>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </section>

        {/* -----------------------------------
              DEV PANEL (RIGHT SIDE)
        ----------------------------------- */}
        <aside
          className={clsx(
            "lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit",
            isDark
              ? "bg-black/40 border border-zinc-800"
              : "bg-white/90 border border-zinc-200"
          )}
        >
          <div>
            <div className="text-sm font-semibold mb-2">Developer Tools</div>
            <div className="text-xs opacity-60">APOD endpoint helper</div>

            <div className="mt-3 space-y-2">
              <Button variant="outline" className="cursor-pointer" onClick={copyEndpoint}>
                <Copy /> Copy Endpoint
              </Button>

              <Button variant="outline" className="cursor-pointer" onClick={() => downloadJSON()}>
                <Download /> Download JSON
              </Button>

              <Button variant="outline" className="cursor-pointer" onClick={() => setShowRaw(s => !s)}>
                <List /> Toggle Raw
              </Button>
            </div>
          </div>
        </aside>
      </main>

      {/* -----------------------------------
            IMAGE DIALOG
      ----------------------------------- */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent
          className={clsx(
            "max-w-3xl w-full p-0 rounded-2xl overflow-hidden",
            isDark ? "bg-black/90" : "bg-white"
          )}
        >
          <DialogHeader>
            <DialogTitle>{currentApod?.title}</DialogTitle>
          </DialogHeader>

          <div
            style={{
              height: "60vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {currentApod?.media_type === "image" ? (
              <img
                src={currentApod.url}
                alt={currentApod.title}
                style={{
                  maxHeight: "100%",
                  maxWidth: "100%",
                  objectFit: "contain",
                }}
              />
            ) : (
              <></>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">NASA APOD</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>
                <X />
              </Button>
              <Button
                variant="outline"
                onClick={() =>
                  window.open(currentApod?.url || "", "_blank")
                }
              >
                <ExternalLink />
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
