// src/pages/IplDataPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { showToast } from "../lib/ToastHelper";

import {
  Search,
  ExternalLink,
  Copy,
  Download,
  Loader2,
  ImageIcon,
  List,
  FileText,
  Users,
  Zap,
  Calendar,
  MapPin,
  BarChart2,
  ArrowUpDown,
  ChevronDown,
  ChevronUp,
  LucideTarget
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

import { useTheme } from "@/components/theme-provider";

/**
 * IplDataPage.jsx (PRO)
 * - Smart Lazy Index inside React (Option 4)
 * - Polished 3-column layout: Teams | Match | Actions
 * - Uses TEAMS_INFO for logos (inlined below)
 */

/* ---------- Config ---------- */
const GITHUB_CONTENTS_API = "https://api.github.com/repos/ritesh-ojha/IPL-DATASET/contents/json/ipl_match";
const RAW_MATCH_BASE = "https://raw.githubusercontent.com/ritesh-ojha/IPL-DATASET/main/json/ipl_match";
const RAW_TEAM_INFO = "https://raw.githubusercontent.com/ritesh-ojha/IPL-DATASET/main/json/ipl_team_info/teams_info.json";
const DEFAULT_MATCH_ID = "1082591";

const SEED_BATCH_SIZE = 36;
const BATCH_SIZE = 80;
const CONCURRENCY = 6;

/* ---------- TEAMS INFO (inlined, from user) ---------- */
const TEAMS_INFO = [
  {
    "team_name": "Mumbai Indians",
    "url": "https://assets.iplt20.com/ipl/MI/Logos/Logooutline/MIoutline.png",
    "espn_id": "4346"
  },
  {
    "team_name": "Chennai Super Kings",
    "url": "https://assets.iplt20.com/ipl/CSK/logos/Logooutline/CSKoutline.png",
    "espn_id": "4343"
  },
  {
    "team_name": "Delhi Capitals",
    "url": "https://assets.iplt20.com/ipl/DC/Logos/LogoOutline/DCoutline.png",
    "espn_id": "4347"
  },
  {
    "team_name": "Kolkata Knight Riders",
    "url": "https://assets.iplt20.com/ipl/KKR/Logos/Logooutline/KKRoutline.png",
    "espn_id": "4341"
  },
  {
    "team_name": "Punjab Kings",
    "url": "https://assets.iplt20.com/ipl/PBKS/Logos/Logooutline/PBKSoutline.png",
    "espn_id": "4342"
  },
  {
    "team_name": "Rajasthan Royals",
    "url": "https://assets.iplt20.com/ipl/RR/Logos/Logooutline/RRoutline.png",
    "espn_id": "4345"
  },
  {
    "team_name": "Royal Challengers Bengaluru",
    "url": "https://assets.iplt20.com/ipl/RCB/Logos/Logooutline/RCBoutline.png",
    "espn_id": "4340"
  },
  {
    "team_name": "Sunrisers Hyderabad",
    "url": "https://assets.iplt20.com/ipl/SRH/Logos/Logooutline/SRHoutline.png",
    "espn_id": "5143"
  },
  {
    "team_name": "Pune Warriors",
    "url": "https://upload.wikimedia.org/wikipedia/en/4/4a/Pune_Warriors_India_IPL_Logo.png",
    "espn_id": "4787"
  },
  {
    "team_name": "Kochi Tuskers Kerala",
    "url": "https://upload.wikimedia.org/wikipedia/en/thumb/9/96/Kochi_Tuskers_Kerala_Logo.svg/1280px-Kochi_Tuskers_Kerala_Logo.svg.png",
    "espn_id": "4788"
  },
  {
    "team_name": "Gujarat Lions",
    "url": "https://upload.wikimedia.org/wikipedia/en/c/c4/Gujarat_Lions.png",
    "espn_id": "5845"
  },
  {
    "team_name": "Rising Pune Supergiants",
    "url": "https://upload.wikimedia.org/wikipedia/en/9/9a/Rising_Pune_Supergiant.png",
    "espn_id": "5843"
  },
  {
    "team_name": "Kings XI Punjab",
    "url": "https://assets.iplt20.com/ipl/PBKS/Logos/Logooutline/PBKSoutline.png",
    "espn_id": "4342"
  },
  {
    "team_name": "Delhi Daredevils",
    "url": "https://toppng.com/uploads/preview/delhi-daredevils-vector-logo-115742572044grppp7oxb.png",
    "espn_id": "4344"
  },
  {
    "team_name": "Lucknow Super Giants",
    "url": "https://assets.iplt20.com/ipl/LSG/Logos/Logooutline/LSGoutline.png",
    "espn_id": "6903"
  },
  {
    "team_name": "Gujarat Titans",
    "url": "https://assets.iplt20.com/ipl/GT/Logos/Logooutline/GToutline.png",
    "espn_id": "6904"
  },
  {
    "team_name": "Royal Challengers Bangalore",
    "url": "https://assets.iplt20.com/ipl/RCB/Logos/Logooutline/RCBoutline.png",
    "espn_id": "4340"
  },
  {
    "team_name": "Deccan Chargers",
    "url": "https://upload.wikimedia.org/wikipedia/en/a/a6/HyderabadDeccanChargers.png",
    "espn_id": "4347"
  },
  {
    "team_name": "Rising Pune Supergiant",
    "url": "https://upload.wikimedia.org/wikipedia/en/9/9a/Rising_Pune_Supergiant.png",
    "espn_id": "5843"
  }
]
/* ---------- Helpers ---------- */
function normalize(s = "") {
  return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "").trim();
}

function findTeamLogo(teamName) {
  if (!teamName) return null;
  const norm = normalize(teamName);
  const direct = TEAMS_INFO.find(t => normalize(t.team_name) === norm);
  if (direct) return direct.url;
  const inc = TEAMS_INFO.find(t => normalize(t.team_name).includes(norm) || norm.includes(normalize(t.team_name)));
  return inc ? inc.url : null;
}

function prettyJSON(obj) {
  try { return JSON.stringify(obj, null, 2); } catch { return String(obj); }
}

/* Score a row for fuzzy-ish matching */
function scoreQueryRow(q, row) {
  if (!q || q.trim().length === 0) return 0;
  const qnorm = normalize(q);
  let score = 0;
  if (row.match_id && String(row.match_id).includes(qnorm)) score += 120;
  (row.teams || []).forEach(t => {
    const tn = normalize(t);
    if (tn === qnorm) score += 80;
    else if (tn.includes(qnorm)) score += 50;
    else if (qnorm.includes(tn)) score += 30;
  });
  if (row.venue && normalize(row.venue).includes(qnorm)) score += 30;
  if (row.date && normalize(row.date).includes(qnorm)) score += 20;
  if (row.season && String(row.season).includes(q)) score += 30;
  return score;
}

/* concurrency-limited batch fetch */
async function fetchBatchWithConcurrency(urls = [], concurrency = 6) {
  const results = new Array(urls.length);
  let i = 0;
  const workers = Array.from({ length: concurrency }, async () => {
    while (i < urls.length) {
      const idx = i++;
      try {
        const res = await fetch(urls[idx]);
        if (!res.ok) { results[idx] = { ok: false, status: res.status }; continue; }
        const json = await res.json();
        results[idx] = { ok: true, json };
      } catch (err) {
        results[idx] = { ok: false, error: String(err) };
      }
    }
  });
  await Promise.all(workers);
  return results;
}

/* Extract index entry safely from match JSON */
function extractIndexEntry(matchJson, filename, downloadUrl = null) {
  const info = matchJson?.info || {};
  return {
    match_id: filename.replace(/\.json$/i, ""),
    teams: info.teams || [],
    date: (info.dates && info.dates[0]) || info.date || null,
    venue: info.venue || info.city || null,
    season: info.season || null,
    title: `${(info.teams && info.teams[0]) || ""} vs ${(info.teams && info.teams[1]) || ""}`,
    _src: downloadUrl || null
  };
}
/* ---------- Smart Lazy Index Engine (Option 4) ---------- */
function useSmartIndex() {
  const [fileList, setFileList] = useState([]); // {name, download_url}
  const [indexRows, setIndexRows] = useState([]); // extracted entries
  const [indexedCount, setIndexedCount] = useState(0);
  const [isListing, setIsListing] = useState(false);
  const [isIndexing, setIsIndexing] = useState(false);
  const [seedDone, setSeedDone] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function listFiles() {
      setIsListing(true);
      try {
        const res = await fetch(GITHUB_CONTENTS_API);
        if (!res.ok) {
          showToast("error", `Failed to list match files (${res.status})`);
          setIsListing(false);
          return;
        }
        const arr = await res.json();
        if (!mounted) return;
        const files = (arr || []).filter(f => f.name && f.name.toLowerCase().endsWith(".json")).map(f => ({ name: f.name, download_url: f.download_url }));
        setFileList(files);
      } catch (err) {
        console.error("listFiles", err);
        showToast("error", "Failed to list match files");
      } finally {
        setIsListing(false);
      }
    }
    listFiles();
    return () => { mounted = false; };
  }, []);

  /* seed first small batch */
  useEffect(() => {
    if (!fileList || fileList.length === 0) return;
    if (seedDone) return;
    const seedFiles = fileList.slice(0, SEED_BATCH_SIZE);
    if (seedFiles.length === 0) { setSeedDone(true); return; }
    (async () => {
      setIsIndexing(true);
      const urls = seedFiles.map(f => f.download_url);
      const results = await fetchBatchWithConcurrency(urls, CONCURRENCY);
      const rows = [];
      results.forEach((r, idx) => {
        const filename = seedFiles[idx].name;
        if (r.ok && r.json) rows.push({ ...extractIndexEntry(r.json, filename, seedFiles[idx].download_url) });
        else rows.push({ ...extractIndexEntry({}, filename, seedFiles[idx].download_url) });
      });
      setIndexRows(prev => {
        const next = [...prev, ...rows];
        setIndexedCount(next.length);
        return next;
      });
      setIsIndexing(false);
      setSeedDone(true);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileList]);

  /* expand index by N batches (non-blocking) */
  async function expandIndexIfNeeded(batches = 1) {
    if (!fileList || fileList.length === 0) return;
    if (isIndexing) return;
    setIsIndexing(true);
    try {
      let start = indexRows.length;
      for (let b = 0; b < batches; b++) {
        const slice = fileList.slice(start, start + BATCH_SIZE);
        if (!slice || slice.length === 0) break;
        const urls = slice.map(s => s.download_url);
        const results = await fetchBatchWithConcurrency(urls, CONCURRENCY);
        const newRows = [];
        results.forEach((res, idx) => {
          const filename = slice[idx].name;
          if (res.ok && res.json) newRows.push({ ...extractIndexEntry(res.json, filename, slice[idx].download_url) });
          else newRows.push({ ...extractIndexEntry({}, filename, slice[idx].download_url) });
        });
        setIndexRows(prev => {
          const nxt = [...prev, ...newRows];
          setIndexedCount(nxt.length);
          return nxt;
        });
        start += slice.length;
        await new Promise(r => setTimeout(r, 120));
      }
    } catch (err) {
      console.error("expandIndexIfNeeded", err);
    } finally {
      setIsIndexing(false);
    }
  }

  return {
    fileList, indexRows, indexedCount, isListing, isIndexing, seedDone,
    expandIndexIfNeeded, setIndexRows
  };
}
/* ---------- Search + Suggestions Component ---------- */
function SearchBar({
  query, setQuery, showSuggest, setShowSuggest,
  indexRows, indexedCount, fileList, isIndexing, expandIndexIfNeeded,
  onSelectSuggestion, teamsInfo, isDark
}) {
  const [suggestions, setSuggestions] = useState([]);
  const [focusIndex, setFocusIndex] = useState(-1);
  const suggestRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!query || query.trim().length === 0) { setSuggestions([]); setFocusIndex(-1); return; }
    const q = query.trim();
    const scored = indexRows.map(row => ({ row, score: scoreQueryRow(q, row) }))
                           .filter(s => s.score > 0)
                           .sort((a,b) => b.score - a.score)
                           .slice(0, 20)
                           .map(s => ({ ...s.row, _score: s.score }));
    if (scored.length > 0) {
      setSuggestions(scored);
      return;
    }
    // If no results yet, start background expansion, and show hint row
    setSuggestions([{ hint: true, label: "No indexed matches found — expanding index..." }]);
    // debounce expansion to avoid too many fetches while typing
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      expandIndexIfNeeded(1);
    }, 250);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, indexRows]);

  /* keyboard navigation */
  useEffect(() => {
    function onKey(e) {
      if (!showSuggest) return;
      if (e.key === "ArrowDown") { e.preventDefault(); setFocusIndex(i => Math.min(i + 1, suggestions.length - 1)); }
      else if (e.key === "ArrowUp") { e.preventDefault(); setFocusIndex(i => Math.max(i - 1, 0)); }
      else if (e.key === "Enter") { e.preventDefault(); const sel = suggestions[focusIndex >= 0 ? focusIndex : 0]; if (sel && !sel.hint) onSelectSuggestion(sel); }
      else if (e.key === "Escape") { setShowSuggest(false); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showSuggest, suggestions, focusIndex, onSelectSuggestion, setShowSuggest]);

  function renderLogo(teamName) {
    return findTeamLogo(teamName);
  }

  return (
    <div className="relative w-full">
      <div className={clsx("flex items-center gap-2 w-full rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
        <Search className="opacity-60" />
        <Input
          placeholder="Search matches: team, venue, season, date or match id..."
          value={query}
          onChange={(e) => { setQuery(e.target.value); setShowSuggest(true); }}
          onFocus={() => setShowSuggest(true)}
          className="border-0 shadow-none bg-transparent outline-none"
        />
        <Button type="button" variant="outline" className="px-3" onClick={() => { if (query && /^\d+$/.test(query.trim())) { onSelectSuggestion({ match_id: query.trim(), _src: `${RAW_MATCH_BASE}/${query.trim()}.json` }); } else setShowSuggest(s => !s); }}>
          <Search />
        </Button>
      </div>

      <AnimatePresence>
        {showSuggest && (suggestions.length > 0 || isIndexing) && (
          <motion.ul initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} ref={suggestRef} className={clsx("absolute left-0 right-0 mt-2 max-h-80 overflow-auto rounded-xl shadow-xl z-50", isDark ? "bg-black border border-zinc-800" : "bg-white border border-zinc-200")}>
            <li className="px-3 py-2 text-xs opacity-60 flex items-center justify-between">
              <div>Indexed: {indexedCount}/{fileList.length || "?"}</div>
              <div>{isIndexing ? <span className="flex items-center gap-2"><Loader2 className="animate-spin" /> Indexing…</span> : "Ready"}</div>
            </li>

            {suggestions.length > 0 ? suggestions.map((s, i) => (
              <li key={s.match_id || s.label || i} onClick={() => { if (!s.hint) onSelectSuggestion(s); }} onMouseEnter={() => setFocusIndex(i)} className={clsx("px-4 py-3 cursor-pointer flex gap-3 items-center", focusIndex === i ? (isDark ? "bg-zinc-800/40" : "bg-zinc-100") : "hover:bg-zinc-100 dark:hover:bg-zinc-800/50")}>
                <div className="w-10 h-10">
                  <img src={renderLogo((s.teams && s.teams[0]) || (s.teams && s.teams[1])) || ""} alt="logo" className="w-10 h-10 object-contain" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{s.title || s.label}</div>
                  <div className="text-xs opacity-60">{s.date ? `${new Date(s.date).toLocaleDateString()} • ${s.venue || ""}` : (s.venue || s.label || "")}</div>
                </div>
                <div className="text-xs opacity-60">{s.match_id}</div>
              </li>
            )) : (
              <li className="p-3 text-sm opacity-60">No suggestions yet — indexing in background</li>
            )}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}
/* ---------- Header / Hero ---------- */
function PageHeader({ currentMatch, onSearchSelect, teamsInfo, isDark }) {
  const leftLogo = currentMatch?.data?.info?.teams?.[0] ? findTeamLogo(currentMatch.data.info.teams[0]) : null;
  const rightLogo = currentMatch?.data?.info?.teams?.[1] ? findTeamLogo(currentMatch.data.info.teams[1]) : null;

  return (
    <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          {leftLogo && <img src={leftLogo} alt="left" className="w-12 h-12 object-contain" />}
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold">IPL Explorer</h1>
            <p className="text-sm opacity-70">Beautiful match viewer — team logos, ball-by-ball, scorecards</p>
          </div>
          {rightLogo && <img src={rightLogo} alt="right" className="w-12 h-12 object-contain" />}
        </div>
      </div>

    </header>
  );
}
/* ---------- LEFT: Teams Sidebar ---------- */

import {

  Hash,
  User,
  Gavel,
  Video,
  RefreshCw,
  Info
} from "lucide-react";

/**
 * TeamsSidebar
 *
 * Props:
 * - currentMatch: object (expects currentMatch.data.info shape)
 * - isDark: boolean (theme)
 *
 * Requires:
 * - findTeamLogo(teamName) -> URL or null (your existing helper)
 */

 function TeamsSidebar({ currentMatch, isDark }) {
  const info = currentMatch?.data?.info ?? {};
  const teams = info.teams || [];
  const playersObj = info.players || {};

  // Officials lists (safely handle missing keys)
  const umpires = info.officials?.umpires || [];
  const tvUmpires = info.officials?.tv_umpires || [];
  const reserveUmpires = info.officials?.reserve_umpires || [];
  const matchReferees = info.officials?.match_referees || [];

  // Small helper to render a compact, comma-separated list with fallback
  const renderList = (arr) =>
    Array.isArray(arr) && arr.length > 0 ? arr.join(", ") : "—";

  return (
    <aside
      className={clsx(
        "lg:col-span-3 space-y-4",
        isDark
          ? "bg-black/30 border border-zinc-800 p-4 rounded-2xl"
          : "bg-white/90 border border-zinc-200 p-4 rounded-2xl"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 opacity-80" />
            <div className="text-sm font-semibold">Teams</div>
          </div>
          <div className="text-xs opacity-60 mt-1">
            {teams.length} team{teams.length !== 1 ? "s" : ""}
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs opacity-60">Match</div>
          <div className="text-sm font-semibold">{info?.event?.match_number ?? "—"}</div>
        </div>
      </div>

      {/* Teams list */}
      <div className="space-y-3">
        {teams.map((t, i) => {
          const logo = typeof findTeamLogo === "function" ? findTeamLogo(t) : null;
          const players = playersObj[t] || [];
          return (
            <div
              key={i}
              className={clsx(
                "p-3 rounded-lg border flex items-start gap-3",
                isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200"
              )}
            >
              {logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logo} alt={t} className="w-12 h-12 object-contain rounded" />
              ) : (
                <div
                  className={clsx(
                    "w-12 h-12 bg-zinc-100 dark:bg-zinc-900 rounded-md flex items-center justify-center text-xs",
                    isDark ? "text-zinc-300" : "text-zinc-700"
                  )}
                >
                  {t.slice(0, 2).toUpperCase()}
                </div>
              )}

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm">{t}</div>
                  <div className="text-xs opacity-60">{players.length} players</div>
                </div>

                <div className="mt-2 text-xs opacity-70">
                  {players.slice(0, 6).map((p, idx) => (
                    <span key={idx} className="inline-block mr-2">
                      {p}
                      {idx < Math.min(players.length, 6) - 1 ? "·" : ""}
                    </span>
                  ))}
                  {players.length > 6 && (
                    <div className="text-xs opacity-60 mt-1">+{players.length - 6} more</div>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {teams.length === 0 && (
          <div className="p-3 rounded-lg border text-sm opacity-60">
            No teams found in the current match JSON.
          </div>
        )}
      </div>

      <Separator />

      {/* Match metadata */}
      <div>
        <div className="flex items-center gap-2">
          <Hash className="w-4 h-4 opacity-80" />
          <div className="text-sm font-semibold">Match metadata</div>
        </div>

        <div className="mt-3 text-xs opacity-60 space-y-2">
          <div>
            <span className="block text-[11px] opacity-60">Event</span>
            <div className="font-medium text-sm">{info?.event?.name ?? "—"}</div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] opacity-60">Match No.</div>
              <div className="font-medium">{info?.event?.match_number ?? "—"}</div>
            </div>

            <div>
              <div className="text-[11px] opacity-60">Type</div>
              <div className="font-medium">{info?.match_type ?? "—"}</div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 opacity-70" />
              <div className="text-xs">
                {Array.isArray(info?.dates) && info.dates.length > 0 ? info.dates.join(", ") : "—"}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 opacity-70" />
              <div className="text-xs">{info?.city ?? info?.venue ?? "—"}</div>
            </div>
          </div>

          <div className="mt-2">
            <div className="text-[11px] opacity-60">Gender</div>
            <div className="font-medium text-sm">{info?.gender ?? "—"}</div>
          </div>

          <div className="mt-2">
            <div className="text-[11px] opacity-60">Balls / Over</div>
            <div className="font-medium text-sm">{info?.balls_per_over ?? "6"}</div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Officials / Umpires */}
      <div>
        <div className="flex items-center gap-2">
          <Gavel className="w-4 h-4 opacity-80" />
          <div className="text-sm font-semibold">Officials</div>
        </div>

        <div className="mt-3 text-xs opacity-70 space-y-3">
          <div>
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 opacity-70" />
              <div className="text-[12px] font-medium">On-field umpires</div>
            </div>
            <div className="mt-1 text-xs opacity-60">{renderList(umpires)}</div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 opacity-70" />
              <div className="text-[12px] font-medium">TV umpires</div>
            </div>
            <div className="mt-1 text-xs opacity-60">{renderList(tvUmpires)}</div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 opacity-70" />
              <div className="text-[12px] font-medium">Reserve umpires</div>
            </div>
            <div className="mt-1 text-xs opacity-60">{renderList(reserveUmpires)}</div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 opacity-70" />
              <div className="text-[12px] font-medium">Match referees</div>
            </div>
            <div className="mt-1 text-xs opacity-60">{renderList(matchReferees)}</div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Notes */}
      <div>
        <div className="text-sm font-semibold mb-2">Notes</div>
        <div className="text-xs opacity-60">
          All match JSONs are rendered dynamically. Use the search to quickly find match files (by ID or date). Team logos are matched via the `teams_info` mapping.
        </div>
      </div>
    </aside>
  );
}

/* ---------- InningsCard + Stats helpers ---------- */
function computeTopBatsmen(overs) {
  const map = {};
  (overs || []).forEach(o => {
    (o.deliveries || []).forEach(d => {
      const batsman = d.batter || d.batsman;
      const r = d.runs?.batter ?? 0;
      if (!batsman) return;
      map[batsman] = (map[batsman] || 0) + (typeof r === "number" ? r : 0);
    });
  });
  return Object.entries(map).map(([name, runs]) => ({ name, runs })).sort((a,b) => b.runs - a.runs);
}

function computeTopBowlers(overs) {
  const map = {};
  (overs || []).forEach(o => {
    (o.deliveries || []).forEach(d => {
      const bowler = d.bowler;
      if (!bowler) return;
      map[bowler] = map[bowler] || { name: bowler, runs: 0, wickets: 0, balls: 0 };
      map[bowler].runs += d.runs?.total ?? 0;
      map[bowler].balls += 1;
      if (d.wickets && Array.isArray(d.wickets)) map[bowler].wickets += d.wickets.length;
      else if (d.wicket) map[bowler].wickets += 1;
    });
  });
  return Object.values(map).sort((a,b) => b.wickets - a.wickets || a.runs - b.runs);
}

import {
  Sparkles,     // Six
  Flame,        // Four
  AlertTriangle,// Wicket
  PlusCircle,   // Extras
  ArrowUpRight, // Bowler indicator
} from "lucide-react";

function renderBallShort(dobj) {
  const overLabel = dobj.over || "";
  const del = dobj.delivery || {};

  const batter = del.batter || del.batsman || "-";
  const bowler = del.bowler || "-";

  const runs = del.runs?.batter ?? 0;
  const total = del.runs?.total ?? 0;

  const extrasObj = del.extras || {};
  const extras =
    extrasObj && Object.keys(extrasObj).length > 0
      ? Object.entries(extrasObj)
          .map(([k, v]) => `${k}:${v}`)
          .join(", ")
      : "";

  const wicket =
    del.wickets && Array.isArray(del.wickets) && del.wickets.length > 0
      ? del.wickets
          .map((w) => `${w.player_out} (${w.kind})`)
          .join(", ")
      : del.wicket
      ? `${del.wicket.player_out} (${del.wicket.kind})`
      : "";

  /* Badge logic */
  const isSix = runs === 6;
  const isFour = runs === 4;
  const isWicket = Boolean(wicket);

  return (
    <div className="py-2 border-b last:border-b-0">
      {/* Top Row */}
      <div className="flex items-center justify-between">
        {/* Left Info */}
        <div className="text-sm flex items-center gap-2">
          {/* Over */}
          <span className="font-semibold">{overLabel}</span>

          {/* Batter vs Bowler */}
          <span className="opacity-80">
            {batter}
            <ArrowUpRight className="inline-block w-3 h-3 mx-1 opacity-60" />
            {bowler}
          </span>

          {/* Extras */}
          {extras && (
            <span className="text-xs flex items-center gap-1 bg-yellow-500/20 text-yellow-600 dark:text-yellow-400 px-2 py-0.5 rounded-md">
              <PlusCircle className="w-3 h-3" />
              {extras}
            </span>
          )}
        </div>

        {/* Right: Runs, Six/Four/Wicket */}
        <div className="flex items-center gap-2">
          {/* Total Runs */}
          <span className="font-bold text-sm">{total}</span>

          {/* Six */}
          {isSix && (
            <span className="flex items-center gap-1 text-green-500 bg-green-500/20 px-2 py-0.5 rounded-lg text-xs font-semibold">
              <Sparkles className="w-3 h-3" /> SIX
            </span>
          )}

          {/* Four */}
          {isFour && (
            <span className="flex items-center gap-1 text-blue-500 bg-blue-500/20 px-2 py-0.5 rounded-lg text-xs font-semibold">
              <Flame className="w-3 h-3" /> FOUR
            </span>
          )}

          {/* Wicket */}
          {isWicket && (
            <span className="flex items-center gap-1 text-red-500 bg-red-500/20 px-2 py-0.5 rounded-lg text-xs font-semibold">
              <AlertTriangle className="w-3 h-3" /> W
            </span>
          )}
        </div>
      </div>

      {/* Wicket details line */}
      {isWicket && (
        <div className="text-xs mt-1 flex items-center gap-2 text-red-500 dark:text-red-400">
          <AlertTriangle className="w-3 h-3" />
          {wicket}
        </div>
      )}
    </div>
  );
}


function InningsCard({ teamName, logo, overs = [], flatDeliveries = [], powerplays = [] }) {
  const [open, setOpen] = useState(false);
  const topBatsmen = computeTopBatsmen(overs);
  const topBowlers = computeTopBowlers(overs);

  return (
    <div className="p-4 rounded-xl border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logo ? <img src={logo} alt={teamName} className="w-10 h-10 object-contain" /> : <div className="w-10 h-10 bg-zinc-100 dark:bg-zinc-900 rounded-md" />}
          <div>
            <div className="font-semibold">{teamName}</div>
            <div className="text-xs opacity-60">{overs.length} overs</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-sm opacity-70">{topBatsmen.slice(0,2).map(b => `${b.name} ${b.runs}`).join(" • ")}</div>
          <Button variant="ghost" onClick={() => setOpen(s => !s)}>{open ? <ChevronUp /> : <ChevronDown />}</Button>
        </div>
      </div>


<div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">

  {/* Top Batters */}
  <div className="p-3 rounded-md border flex flex-col gap-2">
    <div className="flex items-center gap-2 text-xs opacity-70">
      <Users className="w-4 h-4 opacity-70" />
      <span>Top Batters</span>
    </div>

    <div className="text-sm font-medium space-y-1">
      {topBatsmen.slice(0, 4).map((bt) => (
        <div key={bt.name} className="flex justify-between">
          <span>{bt.name}</span>
          <span className="opacity-70">{bt.runs}</span>
        </div>
      ))}
    </div>
  </div>

  {/* Top Bowlers */}
  <div className="p-3 rounded-md border flex flex-col gap-2">
    <div className="flex items-center gap-2 text-xs opacity-70">
      <LucideTarget className="w-4 h-4 opacity-70" />
      <span>Top Bowlers</span>
    </div>

    <div className="text-sm font-medium space-y-1">
      {topBowlers.slice(0, 4).map((bl) => (
        <div key={bl.name} className="flex justify-between">
          <span>{bl.name}</span>
          <span className="opacity-70">{bl.wickets}</span>
        </div>
      ))}
    </div>
  </div>

  {/* Powerplays */}
  <div className="p-3 rounded-md border flex flex-col gap-2">
    <div className="flex items-center gap-2 text-xs opacity-70">
      <Zap className="w-4 h-4 opacity-70" />
      <span>Powerplays</span>
    </div>

    <div className="text-sm font-medium space-y-1">
      {powerplays && powerplays.length > 0 ? (
        powerplays.map((p, i) => (
          <div key={i} className="flex justify-between">
            <span>{p.type}</span>
            <span className="opacity-70">{p.from}–{p.to}</span>
          </div>
        ))
      ) : (
        <div className="opacity-50">—</div>
      )}
    </div>
  </div>

</div>


      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className="mt-3">
            <div className="text-xs opacity-60 mb-2">Ball-by-ball</div>
            <div className="max-h-64 overflow-auto rounded-md border p-2">
              {flatDeliveries.map((d, i) => (
                <div key={i} className="py-1 text-sm border-b last:border-b-0">
                  {renderBallShort(d)}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
/* ---------- CENTER: Match Details ---------- */
import 
 {

  Trophy,
  Star,
  Target
} from "lucide-react";

function MatchDetailsPanel({
  currentMatch,
  loading,
  onRefresh,
  onViewLogo,
  isDark
}) {
  const info = currentMatch?.data?.info || {};
  const innings = currentMatch?.data?.innings || [];
  const playersObj = info.players || {};

  /* ---------- Aggregate Innings Summary ---------- */
  function aggregateInningsSummary(inningsArr = []) {
    return inningsArr.map((inn) => {
      const team = inn.team || "Unknown";
      let runs = 0, wickets = 0, balls = 0;

      if (Array.isArray(inn.overs)) {
        for (const o of inn.overs) {
          if (Array.isArray(o.deliveries)) {
            for (const del of o.deliveries) {
              const total = del.runs?.total ?? 0;
              runs += total;
              balls += 1;

              if (Array.isArray(del.wickets)) wickets += del.wickets.length;
              else if (del.wicket) wickets += 1;
            }
          }
        }
      }

      const overs = balls > 0 ? `${Math.floor(balls / 6)}.${balls % 6}` : "0.0";

      return { team, runs, wickets, overs };
    });
  }

  const inningsSummary = aggregateInningsSummary(innings);

  /* ---------- Render Match Header ---------- */
  function renderHeaderInfo(info = {}) {
    const teams = info.teams || [];
    const title = `${teams[0] || ""} vs ${teams[1] || ""}`;

    const venue = info.venue || info.city || "—";
    const date = info.dates?.[0]
      ? new Date(info.dates[0]).toLocaleDateString()
      : "—";

    const result = info.outcome
      ? `${info.outcome.winner || ""} ${
          info.outcome.by?.runs
            ? `won by ${info.outcome.by.runs} runs`
            : info.outcome.by?.wickets
            ? `won by ${info.outcome.by.wickets} wickets`
            : ""
        }`
      : "—";

    const potm =
      info.player_of_match?.length > 0
        ? info.player_of_match.join(", ")
        : "—";

    return (
      <div className="mb-4 pb-2 border-b dark:border-zinc-800 border-zinc-200">
        <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
          {title}
        </h2>

        <div className="flex flex-wrap items-center gap-4 mt-3 text-sm opacity-90">
          <div className="flex items-center gap-2">
            <MapPin size={16} /> {venue}
          </div>

          <div className="flex items-center gap-2">
            <Calendar size={16} /> {date}
          </div>

          <div className="flex items-center gap-2">
            <Zap size={16} /> Toss:{" "}
            {info.toss?.winner
              ? `${info.toss.winner} (${info.toss.decision})`
              : "—"}
          </div>

          <div className="flex items-center gap-2">
            <BarChart2 size={16} /> {result}
          </div>
        </div>

        {potm !== "—" && (
          <div className="mt-2 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400 font-medium">
            <Star size={16} />
            Player of the Match: {potm}
          </div>
        )}
      </div>
    );
  }

  return (
    <section className="lg:col-span-6 space-y-4">
      <Card
        className={clsx(
          "rounded-2xl overflow-hidden border shadow-sm",
          isDark
            ? "bg-black/40 border-zinc-800"
            : "bg-white border-zinc-200"
        )}
      >
        {/* ---------- Card Header ---------- */}
        <CardHeader
          className={clsx(
            "p-5 flex items-center justify-between gap-3",
            isDark
              ? "bg-black/60 border-b border-zinc-800"
              : "bg-zinc-50 border-b border-zinc-200"
          )}
        >
          <div>
            <CardTitle className="text-xl">Match Details</CardTitle>
            <div className="text-xs opacity-60 mt-1">
              {currentMatch?.id
                ? `Source: ${currentMatch.id}`
                : "No match loaded"}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onRefresh}>
              <Loader2
                className={loading ? "animate-spin mr-2" : "mr-2"}
              />
              Refresh
            </Button>

            <Button
              variant="ghost"
              onClick={() =>
                onViewLogo(findTeamLogo(info.teams?.[0]))
              }
            >
              <ImageIcon className="mr-2" /> Logo
            </Button>
          </div>
        </CardHeader>

        {/* ---------- Card Content ---------- */}
        <CardContent>
          {loading ? (
            <div className="py-14 text-center">
              <Loader2 className="animate-spin mx-auto" size={28} />
            </div>
          ) : !currentMatch ? (
            <div className="py-14 text-center text-sm opacity-60">
              No match loaded
            </div>
          ) : (
            <>
              {/* Match Header */}
              {renderHeaderInfo(info)}

              {/* ---------- Innings Summary Cards ---------- */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                {inningsSummary.map((s, idx) => (
                  <div
                    key={idx}
                    className={clsx(
                      "p-4 rounded-xl border transition hover:shadow-sm",
                      isDark
                        ? "bg-black/30 border-zinc-800"
                        : "bg-white border-zinc-200"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={findTeamLogo(s.team)}
                        alt={s.team}
                        className="w-10 h-10 object-contain"
                      />

                      <div>
                        <div className="font-semibold text-base">
                          {s.team}
                        </div>

                        <div className="text-xs opacity-70 flex items-center gap-2">
                          <span className="font-semibold text-lg">
                            {s.runs}/{s.wickets}
                          </span>
                          <span>({s.overs} ov)</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-5" />

              {/* ---------- Innings + Ball-by-Ball ---------- */}
              <div className="space-y-6">
                {innings.map((inn, i) => {
                  const teamName = inn.team || `Innings ${i + 1}`;
                  const logo = findTeamLogo(teamName);

                  const flatDeliveries = [];
                  for (const o of inn.overs || []) {
                    const base = o.over;
                    for (let k = 0; k < (o.deliveries || []).length; k++) {
                      flatDeliveries.push({
                        over: `${base}.${k + 1}`,
                        delivery: o.deliveries[k]
                      });
                    }
                  }

                  return (
                    <InningsCard
                      key={i}
                      teamName={teamName}
                      logo={logo}
                      overs={inn.overs || []}
                      flatDeliveries={flatDeliveries}
                      powerplays={inn.powerplays}
                    />
                  );
                })}
              </div>

              <Separator className="my-6" />

              {/* ---------- Full Squads ---------- */}
              <div>
                <div className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Users size={16} />
                  Full Team Squads
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(playersObj).map(
                    ([team, playerList], idx) => (
                      <div
                        key={idx}
                        className={clsx(
                          "p-4 rounded-xl border",
                          isDark
                            ? "bg-black/30 border-zinc-800"
                            : "bg-white border-zinc-200"
                        )}
                      >
                        <div className="font-medium flex items-center gap-2">
                          <Target size={16} />
                          {team}
                        </div>

                        <div className="text-xs opacity-60 mt-1">
                          {playerList.length} players
                        </div>

                        <div className="mt-3 space-y-1 text-sm">
                          {playerList.map((p, pi) => (
                            <div key={pi} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                              {p}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </section>
  );
}

/* ---------- RIGHT: Quick Actions + Dialogs ---------- */
function RightActionsPanel({ currentMatch, rawResp, onOpenRaw, onDownload, onCopy, onOpenRepo, onViewLogoClick, isDark }) {
  return (
    <aside className={clsx("lg:col-span-3 space-y-4", isDark ? "bg-black/30 border border-zinc-800 p-4 rounded-2xl" : "bg-white/90 border border-zinc-200 p-4 rounded-2xl")}>
      <div>
        <div className="text-sm font-semibold mb-2">Quick actions</div>
        <div className="grid grid-cols-1 gap-2">
          <Button variant="outline" onClick={onOpenRaw}><ExternalLink /> Open raw</Button>
          <Button variant="outline" onClick={onDownload}><Download /> Download</Button>
          <Button variant="outline" onClick={onCopy}><Copy /> Copy JSON</Button>
          <Button variant="outline" onClick={onOpenRepo}><ExternalLink /> Open repo</Button>
          <Button variant="ghost" onClick={() => onViewLogoClick(findTeamLogo(currentMatch?.data?.info?.teams?.[0]))}><ImageIcon /> View team logo</Button>
        </div>
      </div>

      <Separator />

      <div>
        <div className="text-sm font-semibold mb-2">Dataset</div>
        <div className="text-xs opacity-60">Files are read from the IPL dataset GitHub repository. Use search to find matches by team, season, venue or id.</div>
      </div>
    </aside>
  );
}

/* Image dialog used by header / actions */
function ImageDialog({ open, src, onOpenChange }) {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={clsx("max-w-3xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
        <DialogHeader>
          <DialogTitle>Image</DialogTitle>
        </DialogHeader>

        <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          {src ? <img src={src} alt="team" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} /> : <div className="h-full flex items-center justify-center">No image</div>}
        </div>

        <DialogFooter className="flex justify-between items-center p-4 border-t">
          <div className="text-xs opacity-60">Team image</div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>Close</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
/* ---------- FINAL: Page assembly and export ---------- */
export default function IplDataPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  // Smart index hook
  const {
    fileList, indexRows, indexedCount, isListing, isIndexing, seedDone,
    expandIndexIfNeeded, setIndexRows
  } = useSmartIndex();

  // page state
  const [query, setQuery] = useState("");
  const [showSuggest, setShowSuggest] = useState(false);

  const [currentMatch, setCurrentMatch] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [loadingMatch, setLoadingMatch] = useState(false);

  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [dialogImageSrc, setDialogImageSrc] = useState(null);

  /* default load */
  useEffect(() => {
    loadMatchById(DEFAULT_MATCH_ID);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* load match JSON by id or by URL */
  async function loadMatchById(idOrUrl) {
    let url;
    if (/^https?:\/\//.test(idOrUrl)) url = idOrUrl;
    else url = `${RAW_MATCH_BASE}/${idOrUrl}.json`;
    setLoadingMatch(true);
    try {
      const res = await fetch(url);
      if (!res.ok) { showToast("error", `Match not found (${res.status})`); setLoadingMatch(false); return; }
      const json = await res.json();
      setCurrentMatch({ id: String(idOrUrl).replace(/\.json$/, ""), data: json });
      setRawResp(json);
      showToast("success", `Loaded ${String(idOrUrl)}`);
    } catch (err) {
      console.error("loadMatchById", err);
      showToast("error", "Failed to load match");
    } finally { setLoadingMatch(false); }
  }

  /* search suggestion selection */
  function handleSelectSuggestion(row) {
    if (!row) return;
    // row may be index row with _src
    const src = row._src || `${RAW_MATCH_BASE}/${row.match_id}.json`;
    loadMatchById(src);
    setShowSuggest(false);
    setQuery("");
  }

  /* quick actions */
  function openRawInNewTab() {
    if (!currentMatch) return;
    const url = `${RAW_MATCH_BASE}/${currentMatch.id}.json`;
    window.open(url, "_blank");
  }
  function downloadJSON() {
    if (!rawResp) return showToast("info", "No data");
    const blob = new Blob([prettyJSON(rawResp)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `ipl_${currentMatch?.id || "match"}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    showToast("success", "Downloaded JSON");
  }
  function copyJSON() {
    if (!rawResp) return showToast("info", "No data");
    navigator.clipboard.writeText(prettyJSON(rawResp));
    showToast("success", "Copied JSON");
  }
  function openRepo() {
    window.open("https://github.com/ritesh-ojha/IPL-DATASET", "_blank");
  }
  function onViewLogoClick(src) {
    if (!src) return showToast("info", "No image");
    setDialogImageSrc(src);
    setImageDialogOpen(true);
  }

  /* optional: persist small index to localStorage for faster reload */
  useEffect(() => {
    try {
      if (indexRows && indexRows.length > 50) {
        localStorage.setItem("ipl_index_v1", JSON.stringify({ ts: Date.now(), rows: indexRows.slice(0, 5000) }));
      }
    } catch (e) { /* ignore */ }
  }, [indexRows]);

  /* try hydrate from localStorage on first mount */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("ipl_index_v1");
      if (raw && indexRows.length < 10) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.rows) setIndexRows(parsed.rows);
      }
    } catch (e) { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>

        <div className="flex flex-col  sm:flex-row items-start sm:items-center justify-between">
      <PageHeader currentMatch={currentMatch} isDark={isDark} />
      <div></div>
          <div className="mb-4 w-full sm:w-[350px] md:w-[400px]">
        <SearchBar
          query={query}
          setQuery={setQuery}
          showSuggest={showSuggest}
          setShowSuggest={setShowSuggest}
          indexRows={indexRows}
          indexedCount={indexedCount}
          fileList={fileList}
          isIndexing={isIndexing}
          expandIndexIfNeeded={expandIndexIfNeeded}
          onSelectSuggestion={handleSelectSuggestion}
          teamsInfo={TEAMS_INFO}
          isDark={isDark}
        />
      </div>
      </div>

  

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-6">
        <TeamsSidebar currentMatch={currentMatch} isDark={isDark} />
        <MatchDetailsPanel currentMatch={currentMatch} loading={loadingMatch} onRefresh={() => loadMatchById(currentMatch?.id || DEFAULT_MATCH_ID)} onViewLogo={onViewLogoClick} isDark={isDark} />
        <RightActionsPanel currentMatch={currentMatch} rawResp={rawResp} onOpenRaw={openRawInNewTab} onDownload={downloadJSON} onCopy={copyJSON} onOpenRepo={openRepo} onViewLogoClick={onViewLogoClick} isDark={isDark} />
      </main>

      <ImageDialog open={imageDialogOpen} src={dialogImageSrc} onOpenChange={setImageDialogOpen} />
    </div>
  );
}
