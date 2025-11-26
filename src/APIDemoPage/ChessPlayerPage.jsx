// src/pages/ChessPlayerPage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ExternalLink,
  Loader,
  Copy,
  Download,
  X,
  RefreshCw,
  User,
  MapPin,
  Calendar,
  Activity,
  Star,
  Eye,
  ImageIcon,
  Menu,
  Code,
  List as ListIcon,
  Bolt,
  Globe2,
  Info,
  Clock
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/* shadcn Sheet (drawer) */
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";

/* ---------- Defaults ---------- */
const DEFAULT_USERNAME = "magnuscarlsen";
const DEFAULT_MSG = "Search a Chess.com username (e.g. magnuscarlsen)";

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

function formatTimestamp(ts) {
  try {
    if (!ts) return "—";
    const n = Number(ts);
    if (!isNaN(n) && ts.toString().length > 10) {
      return new Date(n).toLocaleString();
    }
    return new Date(n * 1000).toLocaleString();
  } catch {
    return String(ts);
  }
}

function parseCountry(countryUrl) {
  if (!countryUrl) return null;
  try {
    const parts = countryUrl.split("/").filter(Boolean);
    return parts[parts.length - 1].toUpperCase();
  } catch {
    return countryUrl;
  }
}

/* fields to highlight with icons */
const highlightFields = [
  { key: "username", icon: User, label: "Username" },
  { key: "name", icon: Star, label: "Name" },
  { key: "title", icon: Star, label: "Title" },
  { key: "country", icon: MapPin, label: "Country" },
  { key: "joined", icon: Calendar, label: "Joined" },
  { key: "last_online", icon: Clock, label: "Last Online" },
  { key: "followers", icon: Activity, label: "Followers" }
];

export default function ChessPlayerPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // state
  const [username, setUsername] = useState(DEFAULT_USERNAME);
  const [input, setInput] = useState(DEFAULT_USERNAME);
  const [loading, setLoading] = useState(false);
  const [player, setPlayer] = useState(null); // API response object
  const [rawResp, setRawResp] = useState(null);
  const [showSuggest, setShowSuggest] = useState(false);
  const [suggestions, setSuggestions] = useState([
    "magnuscarlsen",
    "hikaru",
    "fabianocaruana",
    "alirezakann",
    "lichess"
  ]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [avatarOpen, setAvatarOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const suggestTimer = useRef(null);

  /* ---------- Fetch player ---------- */
  async function fetchPlayer(u) {
    if (!u || u.trim().length === 0) {
      showToast("info", DEFAULT_MSG);
      return;
    }
    setLoading(true);
    try {
      const url = `https://api.chess.com/pub/player/${encodeURIComponent(u)}`;
      const res = await fetch(url);
      if (!res.ok) {
        if (res.status === 404) {
          showToast("info", `Player '${u}' not found.`);
        } else {
          showToast("error", `Fetch failed (${res.status})`);
        }
        setPlayer(null);
        setRawResp(null);
        setLoading(false);
        return;
      }
      const json = await res.json();
      setPlayer(json);
      setRawResp(json);
      setUsername(u);
      showToast("success", `Loaded: ${json.username || u}`);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch player");
      setPlayer(null);
      setRawResp(null);
    } finally {
      setLoading(false);
    }
  }

  /* initial load */
  useEffect(() => {
    fetchPlayer(DEFAULT_USERNAME);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Suggestion-checking: debounce and quick validates */
  function onInputChange(v) {
    setInput(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    suggestTimer.current = setTimeout(async () => {
      if (!v || v.trim().length === 0) {
        setSuggestions((s) => s.slice(0, 5));
        setLoadingSuggest(false);
        return;
      }
      setLoadingSuggest(true);
      try {
        const testUrl = `https://api.chess.com/pub/player/${encodeURIComponent(v)}`;
        const res = await fetch(testUrl, { method: "GET" });
        if (res.ok) {
          setSuggestions((prev) => {
            const normalized = v.toLowerCase();
            if (!prev.includes(normalized)) return [normalized, ...prev].slice(0, 10);
            return prev;
          });
        }
      } catch {
        // ignore network check errors
      } finally {
        setLoadingSuggest(false);
      }
    }, 300);
  }

  function onSubmit(e) {
    e?.preventDefault?.();
    setShowSuggest(false);
    fetchPlayer(input.trim().toLowerCase());
    if (sheetOpen) setSheetOpen(false);
  }

  function openProfile() {
    if (!player?.url) return showToast("info", "No profile URL available");
    window.open(player.url, "_blank");
  }

  function copyJSON() {
    if (!rawResp) return showToast("info", "No player data to copy");
    navigator.clipboard.writeText(prettyJSON(rawResp));
    showToast("success", "Player JSON copied");
  }

  function downloadJSON() {
    const payload = rawResp || player;
    if (!payload) return showToast("info", "Nothing to download");
    const blob = new Blob([prettyJSON(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `chess_player_${(player?.username || username || "player").replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }

  function refresh() {
    if (!username) return showToast("info", "No username to refresh");
    fetchPlayer(username);
  }

  /* parse country (chess.com returns a country url like https://api.chess.com/pub/country/NO) */
  function parseCountryVal(countryUrl) {
    if (!countryUrl) return null;
    try {
      const parts = countryUrl.split("/").filter(Boolean);
      return parts[parts.length - 1].toUpperCase();
    } catch {
      return countryUrl;
    }
  }

  /* get initials for avatar fallback */
  function initials(name = "") {
    if (!name) return "—";
    return name.slice(0, 2).toUpperCase();
  }

  /* Small Inline Copy button used in sheet/sidebar (isolated state) */
  function InlineCopy({ text, label = "Copied", className = "" }) {
    const [copied, setCopied] = useState(false);
    async function handleCopy() {
      try {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        showToast("success", label);
        setTimeout(() => setCopied(false), 1200);
      } catch {
        showToast("error", "Copy failed");
      }
    }
    return (
      <button onClick={handleCopy} className={clsx("inline-flex items-center gap-2 px-2 py-1 rounded-md border", "cursor-pointer", className)}>
        {copied ? <span className="text-emerald-500">✓</span> : <Copy className="w-4 h-4" />}
        <span className="text-sm">{copied ? "Copied" : "Copy"}</span>
      </button>
    );
  }

  /* ---------------- UI ---------------- */
  return (
    <div className={clsx("min-h-screen p-4 md:p-6 max-w-9xl mx-auto", isDark ? "bg-black text-zinc-50" : "bg-white text-zinc-900")}>
      {/* HEADER */}
      <header className="flex items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          {/* mobile: sheet trigger */}
          <div className="md:hidden">
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" className="p-2 cursor-pointer"><Menu /></Button>
              </SheetTrigger>

              <SheetContent side="left" className="w-full max-w-xs">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>

                {/* Sidebar content inside sheet */}
                <div className="p-3 space-y-3">
                  <form onSubmit={onSubmit} className="flex items-center gap-2">
                    <Input value={input} onChange={(e) => onInputChange(e.target.value)} placeholder="username" className="flex-1" />
                    <Button type="submit" className="cursor-pointer"><Search /></Button>
                  </form>

                  <div>
                    <div className="text-xs opacity-60 mb-2">Quick suggestions</div>
                    <div className="grid grid-cols-2 gap-2">
                      {suggestions.slice(0, 6).map((s) => (
                        <button key={s} onClick={() => { setInput(s); fetchPlayer(s); setSheetOpen(false); }} className="p-2 rounded-md border text-sm cursor-pointer">
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="text-sm font-semibold flex items-center gap-2"><User /> Profile</div>
                    <div className="mt-2 text-sm">
                      <div className="font-medium">{player?.name || player?.username || "—"}</div>
                      <div className="text-xs opacity-60">{player?.username ? `@${player.username}` : "No user loaded"}</div>
                      <div className="mt-2 flex gap-2">
                        <Button onClick={() => { openProfile(); setSheetOpen(false); }} className="cursor-pointer" variant="outline"><ExternalLink /> View</Button>
                        <Button onClick={() => { setAvatarOpen(true); setSheetOpen(false); }} className="cursor-pointer" variant="ghost"><ImageIcon /> Avatar</Button>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <div className="text-sm font-semibold flex items-center gap-2"><Bolt /> Quick Actions</div>
                    <div className="mt-2 flex flex-col gap-2">
                      <Button className="cursor-pointer" onClick={() => { copyJSON(); setSheetOpen(false); }} variant="outline"><Copy /> Copy JSON</Button>
                      <Button className="cursor-pointer" onClick={() => { downloadJSON(); setSheetOpen(false); }} variant="outline"><Download /> Download</Button>
                    </div>
                  </div>

                </div>

              
              </SheetContent>
            </Sheet>
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">Chess — Player Lookup</h1>
            <div className="text-sm opacity-60">Inspect public Chess.com profiles — no API key.</div>
          </div>
        </div>

        {/* Desktop search (visible md+) */}
        <div className="hidden md:flex items-center gap-3">
          <form onSubmit={onSubmit} className={clsx("flex items-center gap-2 w-[540px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input value={input} onChange={(e) => onInputChange(e.target.value)} className="border-0 shadow-none bg-transparent outline-none" placeholder="Enter Chess.com username (e.g. magnuscarlsen)" onFocus={() => setShowSuggest(true)} />
            <Button type="button" variant="outline" className="px-3 cursor-pointer" onClick={() => { setInput(DEFAULT_USERNAME); fetchPlayer(DEFAULT_USERNAME); setShowSuggest(false); }}>Default</Button>
            <Button type="submit" variant="outline" className="px-3 cursor-pointer"><Search /></Button>
          </form>
        </div>
      </header>

      {/* Suggestions dropdown (desktop) */}
      <AnimatePresence>
        {showSuggest && (suggestions.length > 0 || loadingSuggest) && (
          <motion.ul initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("absolute z-50 left-4 right-4 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Checking...</li>}
            {suggestions.map((s, idx) => (
              <li key={`${s}_${idx}`} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => { setInput(s); setShowSuggest(false); fetchPlayer(s); }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-sm font-medium overflow-hidden">
                    <span className="uppercase">{s.slice(0, 2)}</span>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{s}</div>
                    <div className="text-xs opacity-60">Chess.com username</div>
                  </div>
                  <div className="text-xs opacity-60">Profile</div>
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      {/* Main grid */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left: Sidebar (desktop) */}
        <aside className={clsx("hidden lg:block lg:col-span-3 space-y-4")}>
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center gap-3", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg flex items-center gap-2"><User /> Profile</CardTitle>
                <div className="text-xs opacity-60">Quick summary</div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="flex flex-col items-center text-center">
                <div className={clsx("w-44 h-44 rounded-xl overflow-hidden mb-4 flex items-center justify-center", isDark ? "bg-black/20 border border-zinc-800" : "bg-white/70 border border-zinc-200")}>
                  {player?.avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={player.avatar} alt={player?.username} className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-4xl font-semibold opacity-60 uppercase">{initials(player?.username || "")}</div>
                  )}
                </div>

                <div className="text-xl font-semibold">{player?.name || player?.username || "—"}</div>
                <div className="text-sm opacity-60">{player?.title ? `${player.title} •` : ""} {player?.username ? `@${player.username}` : ""}</div>

                <div className="mt-4 w-full space-y-2">
                  {highlightFields.map((f) => {
                    const val = player?.[f.key];
                    if (!val) return null;
                    let display = val;
                    if (f.key === "country") display = parseCountryVal(val);
                    if (f.key === "joined" || f.key === "last_online") display = formatTimestamp(val);
                    const Icon = f.icon;
                    return (
                      <div key={f.key} className="flex items-center justify-between px-3 py-2 rounded-md border">
                        <div className="flex items-center gap-2">
                          <Icon className="opacity-70" />
                          <div className="text-xs opacity-70">{f.label}</div>
                        </div>
                        <div className="text-sm font-medium">{display}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 w-full flex flex-col gap-2">
                  <Button variant="outline" className="w-full cursor-pointer" onClick={() => { openProfile(); }}><ExternalLink /> View on Chess.com</Button>
                  <Button variant="ghost" className="w-full cursor-pointer" onClick={() => setAvatarOpen(true)}><ImageIcon /> View avatar</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div className="text-sm font-semibold flex items-center gap-2"><Info /> About</div>
            </CardHeader>
            <CardContent>
              <div className="text-sm opacity-70">
                Chess.com public profile fields are shown where available. Use the search above to load any public user.
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Center: main details */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg flex items-center gap-2"><Activity /> Player Details</CardTitle>
                <div className="text-xs opacity-60">{player?.username ? `Full details for ${player.username}` : "No player loaded"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" className="cursor-pointer" onClick={() => refresh()}><RefreshCw className={loading ? "animate-spin" : ""} /> Refresh</Button>
                <Button variant="ghost" className="cursor-pointer" onClick={() => copyJSON()}><Copy /></Button>
                <Button variant="ghost" className="cursor-pointer" onClick={() => downloadJSON()}><Download /></Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-12 text-center"><Loader className="animate-spin mx-auto" /></div>
              ) : !player ? (
                <div className="py-12 text-center text-sm opacity-60">No player loaded — try search above.</div>
              ) : (
                <div className="space-y-4">
                  {/* prominent area: bio / summary */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="text-lg font-semibold mb-2">{player.name || player.username}</div>
                        <div className="text-sm leading-relaxed mb-2">
                          {player?.bio || player?.location ? (
                            <>
                              <div className="mb-1">{player.bio}</div>
                              <div className="text-xs opacity-60">Location: {player.location ?? "—"}</div>
                            </>
                          ) : (
                            <div className="text-sm opacity-60">No bio or location provided.</div>
                          )}
                        </div>

                        <div className="mt-3 flex flex-wrap gap-2">
                          {player?.followers !== undefined && <div className="text-sm px-3 py-1 rounded-full border">{player.followers} followers</div>}
                          {player?.title && <div className="text-sm px-3 py-1 rounded-full border">Title: {player.title}</div>}
                          {player?.status && <div className="text-sm px-3 py-1 rounded-full border">Status: {player.status}</div>}
                          {player?.twitch_url && <a href={player.twitch_url} target="_blank" rel="noreferrer" className="text-sm px-3 py-1 rounded-full border underline">Twitch</a>}
                        </div>
                      </div>

                      <div className="w-36 flex-shrink-0">
                        <div className="text-xs opacity-60 mb-1 flex items-center gap-2"><ImageIcon /> Avatar</div>
                        <div className="w-28 h-28 rounded-lg overflow-hidden border flex items-center justify-center">
                          {player?.avatar ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={player.avatar} alt={player?.username} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-lg uppercase opacity-60">{initials(player?.username)}</div>
                          )}
                        </div>
                        <div className="mt-2">
                          <Button className="w-full cursor-pointer" variant="outline" onClick={() => setAvatarOpen(true)}><Eye /> View</Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* structured fields grid with icons per heading */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-sm font-semibold mb-3 flex items-center gap-2"><ListIcon /> All fields</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.keys(player).map((k) => {
                        const v = player[k];
                        const isObj = typeof v === "object" && v !== null;
                        let display = isObj ? prettyJSON(v) : (v ?? "—");
                        if (k === "joined" || k === "last_online") display = formatTimestamp(v);
                        if (k === "country") display = parseCountryVal(v);
                        return (
                          <div key={k} className="p-3 rounded-md border">
                            <div className="text-xs opacity-60 mb-1 flex items-center gap-2">
                              {/* lightweight icon mapping: use MapPin for country, Calendar for joined, etc. */}
                              {k === "country" ? <MapPin className="w-4 h-4" /> : k === "joined" ? <Calendar className="w-4 h-4" /> : k === "last_online" ? <Clock className="w-4 h-4" /> : <Code className="w-4 h-4" />}
                              <span>{k}</span>
                            </div>
                            <div className="text-sm font-medium break-words">{display}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* raw JSON quickly accessible */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-sm font-semibold mb-2 flex items-center gap-2"><Code /> Raw JSON</div>
                    <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 360 }}>
                      {prettyJSON(rawResp || {})}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right: quick actions */}
        <aside className="lg:col-span-3 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div className="text-sm font-semibold flex items-center gap-2"><Bolt /> Quick Actions</div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button variant="outline" className="cursor-pointer" onClick={() => { if (player?.url) window.open(player.url, "_blank"); else showToast("info", "No profile URL"); }}><ExternalLink /> Open profile</Button>
                <Button variant="outline" className="cursor-pointer" onClick={() => { if (player?.username) window.open(`https://api.chess.com/pub/player/${player.username}/stats`, "_blank"); else showToast("info", "No username"); }}><Activity /> View stats (API)</Button>
                <Button variant="outline" className="cursor-pointer" onClick={() => copyJSON()}><Copy /> Copy JSON</Button>
                <Button variant="outline" className="cursor-pointer" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
                <Button variant="ghost" className="cursor-pointer" onClick={() => refresh()}><RefreshCw /> Refresh</Button>
              </div>

              <Separator className="my-4" />

              <div className="text-xs opacity-60">
                Endpoint example:
                <div className="mt-2">
                  <code className="break-words">https://api.chess.com/pub/player/&lt;username&gt;</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>

      {/* Avatar dialog */}
      <Dialog open={avatarOpen} onOpenChange={setAvatarOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>{player?.username ? `${player.username} — Avatar` : "Avatar"}</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {player?.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={player.avatar} alt={player.username} style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center">No avatar</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Image from profile</div>
            <div className="flex gap-2">
              <Button variant="ghost" className="cursor-pointer" onClick={() => setAvatarOpen(false)}><X /></Button>
              <Button variant="outline" className="cursor-pointer" onClick={() => { if (player?.url) window.open(player.url, "_blank"); }}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
