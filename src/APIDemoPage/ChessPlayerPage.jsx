// src/pages/ChessPlayerPage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ExternalLink,
  Loader,
  ImageIcon,
  Copy,
  Download,
  X,
  RefreshCw,
  User,
  MapPin,
  Calendar,
  Activity,
  Star,
  Eye
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/* ---------- Defaults ---------- */
const DEFAULT_USERNAME = "magnuscarlsen";
const DEFAULT_MSG = "Search a Chess.com username (e.g. magnuscarlsen)";

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  return JSON.stringify(obj, null, 2);
}

function formatTimestamp(ts) {
  try {
    if (!ts) return "—";
    const n = Number(ts);
    if (!isNaN(n) && ts.toString().length > 10) {
      // likely milliseconds
      return new Date(n).toLocaleString();
    }
    // seconds -> ms
    return new Date(n * 1000).toLocaleString();
  } catch {
    return String(ts);
  }
}

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
    "lichess" // placeholder - chess.com username "lichess" may or may not exist
  ]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);

  const [avatarOpen, setAvatarOpen] = useState(false);

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

  /* Suggestion-checking: when user types, we will try to "validate" existence of that username
     by pinging the player endpoint (fast). If exists, show it as a suggestion (validated).
     This is a pragmatic approach because Chess.com does not provide a general 'search users' public endpoint.
  */
  function onInputChange(v) {
    setInput(v);
    setShowSuggest(true);
    if (suggestTimer.current) clearTimeout(suggestTimer.current);
    // debounce
    suggestTimer.current = setTimeout(async () => {
      if (!v || v.trim().length === 0) {
        setSuggestions((s) => s.slice(0, 5));
        setLoadingSuggest(false);
        return;
      }
      setLoadingSuggest(true);
      try {
        // quick HEAD / GET to check existence
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

  /* actions */
  function onSubmit(e) {
    e?.preventDefault?.();
    setShowSuggest(false);
    fetchPlayer(input.trim().toLowerCase());
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
  function parseCountry(countryUrl) {
    if (!countryUrl) return null;
    try {
      const parts = countryUrl.split("/").filter(Boolean);
      return parts[parts.length - 1].toUpperCase();
    } catch {
      return countryUrl;
    }
  }

  /* Fields we highlight if present */
  const highlightFields = [
    { key: "username", icon: User, label: "Username" },
    { key: "name", icon: Star, label: "Name" },
    { key: "title", icon: Star, label: "Title" },
    { key: "country", icon: MapPin, label: "Country" },
    { key: "joined", icon: Calendar, label: "Joined" },
    { key: "last_online", icon: Activity, label: "Last Online" },
    { key: "followers", icon: Eye, label: "Followers" }
  ];

  return (
    <div className={clsx("min-h-screen p-6 max-w-9xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className={clsx("text-3xl md:text-4xl font-extrabold")}>Chess — Player Lookup</h1>
          <p className="mt-1 text-sm opacity-70">Inspect public Chess.com profiles — no API key required.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <form onSubmit={onSubmit} className={clsx("flex items-center gap-2 w-full md:w-[640px] rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Search className="opacity-60" />
            <Input
              placeholder="Enter Chess.com username (e.g. magnuscarlsen)"
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none"
              onFocus={() => setShowSuggest(true)}
            />
            <Button type="button" variant="outline" className="px-3" onClick={() => { setInput(DEFAULT_USERNAME); setShowSuggest(false); fetchPlayer(DEFAULT_USERNAME); }}>
              Default
            </Button>
            <Button type="submit" variant="outline" className="px-3"><Search /></Button>
          </form>
        </div>
      </header>

      {/* Suggestions dropdown */}
      <AnimatePresence>
        {showSuggest && (suggestions.length > 0 || loadingSuggest) && (
          <motion.ul initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("absolute z-50 left-6 right-6 md:left-[calc(50%_-_320px)] md:right-auto max-w-5xl rounded-xl overflow-hidden shadow-xl", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            {loadingSuggest && <li className="p-3 text-sm opacity-60">Checking...</li>}
            {suggestions.map((s, idx) => (
              <li key={`${s}_${idx}`} className="px-4 py-3 hover:bg-zinc-100 dark:hover:bg-zinc-800/50 cursor-pointer" onClick={() => { setInput(s); setShowSuggest(false); fetchPlayer(s); }}>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center text-sm font-medium overflow-hidden">
                    {/* try to fetch avatar quickly if we already have player cached; otherwise show initials */}
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

      {/* Main layout: left (mini), center (full), right (quick actions) */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        {/* Left column: avatar + quick summary (col-span: 3) */}
        <aside className={clsx("lg:col-span-3 space-y-4")}>
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center gap-3", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Profile</CardTitle>
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
                    <div className="text-4xl font-semibold opacity-60 uppercase">{(player?.username || "—").slice(0, 2)}</div>
                  )}
                </div>

                <div className="text-xl font-semibold">{player?.name || player?.username || "—"}</div>
                <div className="text-sm opacity-60">{player?.title ? `${player.title} •` : ""} {player?.username ? `@${player.username}` : ""}</div>

                <div className="mt-4 w-full space-y-2">
                  {highlightFields.map((f) => {
                    const val = player?.[f.key];
                    if (!val) return null;
                    let display = val;
                    if (f.key === "country") display = parseCountry(val);
                    if (f.key === "joined" || f.key === "last_online") display = formatTimestamp(val);
                    return (
                      <div key={f.key} className="flex items-center justify-between px-3 py-2 rounded-md border">
                        <div className="flex items-center gap-2">
                          <f.icon className="opacity-70" />
                          <div className="text-xs opacity-70">{f.label}</div>
                        </div>
                        <div className="text-sm font-medium">{display}</div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-4 w-full flex flex-col gap-2">
                  <Button variant="outline" className="w-full" onClick={() => { openProfile(); }}><ExternalLink /> View on Chess.com</Button>
                  <Button variant="ghost" className="w-full" onClick={() => setAvatarOpen(true)}><ImageIcon /> View avatar</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* small bio / about card */}
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div className="text-sm font-semibold">About</div>
            </CardHeader>
            <CardContent>
              <div className="text-sm opacity-70">
                Chess.com public profile fields are shown where available. This panel surfaces the main metadata for quick scanning.
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Center: full details (col-span: 6) */}
        <section className="lg:col-span-6 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg">Player Details</CardTitle>
                <div className="text-xs opacity-60">{player?.username ? `Full details for ${player.username}` : "No player loaded"}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => refresh()}><RefreshCw className={loading ? "animate-spin" : ""} /> Refresh</Button>
                <Button variant="ghost" onClick={() => copyJSON()}><Copy /></Button>
                <Button variant="ghost" onClick={() => downloadJSON()}><Download /></Button>
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
                    <div className="text-lg font-semibold mb-2">{player.name || player.username}</div>
                    <div className="text-sm leading-relaxed text-opacity-80 mb-2">
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

                  {/* structured fields grid */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-sm font-semibold mb-3">All fields</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {Object.keys(player).map((k) => {
                        // we render primitives nicely; arrays / objects as JSON
                        const v = player[k];
                        const isObj = typeof v === "object" && v !== null;
                        let display = isObj ? JSON.stringify(v) : (v ?? "—");
                        if ((k === "joined" || k === "last_online")) display = formatTimestamp(v);
                        if (k === "country") display = parseCountry(v);
                        return (
                          <div key={k} className="p-3 rounded-md border">
                            <div className="text-xs opacity-60 mb-1">{k}</div>
                            <div className="text-sm font-medium break-words">{display}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* raw JSON collapsible */}
                  <div className={clsx("p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                    <div className="text-sm font-semibold mb-2">Raw JSON</div>
                    <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 360 }}>
                      {prettyJSON(rawResp || {})}
                    </pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* Right: quick actions (col-span: 3) */}
        <aside className={clsx("lg:col-span-3 space-y-4")}>
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div className="text-sm font-semibold">Quick Actions</div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Button variant="outline" onClick={() => { if (player?.url) window.open(player.url, "_blank"); else showToast("info", "No profile URL"); }}><ExternalLink /> Open profile</Button>
                <Button variant="outline" onClick={() => { if (player?.username) window.open(`https://api.chess.com/pub/player/${player.username}/stats`, "_blank"); else showToast("info", "No username"); }}><Activity /> View stats (API)</Button>
                <Button variant="outline" onClick={() => copyJSON()}><Copy /> Copy JSON</Button>
                <Button variant="outline" onClick={() => downloadJSON()}><Download /> Download JSON</Button>
                <Button variant="ghost" onClick={() => refresh()}><RefreshCw /> Refresh</Button>
              </div>

              <Separator className="my-4" />

              <div className="text-xs opacity-60">
                This viewer maps common fields returned by Chess.com public player API. Timestamps are converted for readability. If a field isn't present it will show as "—".
              </div>
            </CardContent>
          </Card>

          {/* helper: endpoint example */}
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-4", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div className="text-sm font-semibold">Endpoint</div>
            </CardHeader>
            <CardContent>
              <div className="text-xs opacity-70">
                <code className="block break-words">https://api.chess.com/pub/player/&lt;username&gt;</code>
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>

      {/* Avatar dialog */}
      <Dialog open={avatarOpen} onOpenChange={setAvatarOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
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
              <Button variant="ghost" onClick={() => setAvatarOpen(false)}><X /></Button>
              <Button variant="outline" onClick={() => { if (player?.url) window.open(player.url, "_blank"); }}><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
