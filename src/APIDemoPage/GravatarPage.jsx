// src/pages/GravatarPage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  User,
  ImageIcon,
  ExternalLink,
  Download,
  Copy,
  Check,
  Star,
  X,
  Loader2,
  List,
  ArchiveRestore,
  Menu,
  FileJson,
  Hash,
  RefreshCcw,
  Github,
  Link as LinkIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/* shadcn select & sheet imports (adjust path if different in your project) */
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Sheet, SheetTrigger, SheetContent } from "@/components/ui/sheet";

/* ---------- Default resource ---------- */
const DEFAULT_RESOURCE = {
  id: "gravatar",
  name: "Gravatar User Avatar",
  category: "Profile",
  endpointBase: "https://www.gravatar.com/avatar/",
  exampleHash: "205e460b479e2e5b48aec07710c08d50",
  description: "Fetch a user's global avatar using their MD5-hashed email. No API key required.",
  image: "/api_previews/gravatar.png",
  code: `// Replace with MD5 hash of any email
fetch("https://www.gravatar.com/avatar/205e460b479e2e5b48aec07710c08d50")
  .then(res => res.blob())
  .then(console.log);`,
};

/* ---------- Minimal MD5 implementation (inline) ---------- */
/* (same as your prior inline implementation - kept for offline hashing) */
function md5cycle(x, k) {
  let [a, b, c, d] = x;

  function ff(a, b, c, d, x, s, t) {
    a = (a + ((b & c) | (~b & d)) + x + t) | 0;
    return (((a << s) | (a >>> (32 - s))) + b) | 0;
  }
  function gg(a, b, c, d, x, s, t) {
    a = (a + ((b & d) | (c & ~d)) + x + t) | 0;
    return (((a << s) | (a >>> (32 - s))) + b) | 0;
  }
  function hh(a, b, c, d, x, s, t) {
    a = (a + (b ^ c ^ d) + x + t) | 0;
    return (((a << s) | (a >>> (32 - s))) + b) | 0;
  }
  function ii(a, b, c, d, x, s, t) {
    a = (a + (c ^ (b | ~d)) + x + t) | 0;
    return (((a << s) | (a >>> (32 - s))) + b) | 0;
  }

  a = ff(a, b, c, d, k[0], 7, -680876936);
  d = ff(d, a, b, c, k[1], 12, -389564586);
  c = ff(c, d, a, b, k[2], 17, 606105819);
  b = ff(b, c, d, a, k[3], 22, -1044525330);
  a = ff(a, b, c, d, k[4], 7, -176418897);
  d = ff(d, a, b, c, k[5], 12, 1200080426);
  c = ff(c, d, a, b, k[6], 17, -1473231341);
  b = ff(b, c, d, a, k[7], 22, -45705983);
  a = ff(a, b, c, d, k[8], 7, 1770035416);
  d = ff(d, a, b, c, k[9], 12, -1958414417);
  c = ff(c, d, a, b, k[10], 17, -42063);
  b = ff(b, c, d, a, k[11], 22, -1990404162);
  a = ff(a, b, c, d, k[12], 7, 1804603682);
  d = ff(d, a, b, c, k[13], 12, -40341101);
  c = ff(c, d, a, b, k[14], 17, -1502002290);
  b = ff(b, c, d, a, k[15], 22, 1236535329);

  a = gg(a, b, c, d, k[1], 5, -165796510);
  d = gg(d, a, b, c, k[6], 9, -1069501632);
  c = gg(c, d, a, b, k[11], 14, 643717713);
  b = gg(b, c, d, a, k[0], 20, -373897302);
  a = gg(a, b, c, d, k[5], 5, -701558691);
  d = gg(d, a, b, c, k[10], 9, 38016083);
  c = gg(c, d, a, b, k[15], 14, -660478335);
  b = gg(b, c, d, a, k[4], 20, -405537848);
  a = gg(a, b, c, d, k[9], 5, 568446438);
  d = gg(d, a, b, c, k[14], 9, -1019803690);
  c = gg(c, d, a, b, k[3], 14, -187363961);
  b = gg(b, c, d, a, k[8], 20, 1163531501);
  a = gg(a, b, c, d, k[13], 5, -1444681467);
  d = gg(d, a, b, c, k[2], 9, -51403784);
  c = gg(c, d, a, b, k[7], 14, 1735328473);
  b = gg(b, c, d, a, k[12], 20, -1926607734);

  a = hh(a, b, c, d, k[5], 4, -378558);
  d = hh(d, a, b, c, k[8], 11, -2022574463);
  c = hh(c, d, a, b, k[11], 16, 1839030562);
  b = hh(b, c, d, a, k[14], 23, -35309556);
  a = hh(a, b, c, d, k[1], 4, -1530992060);
  d = hh(d, a, b, c, k[4], 11, 1272893353);
  c = hh(c, d, a, b, k[7], 16, -155497632);
  b = hh(b, c, d, a, k[10], 23, -1094730640);
  a = hh(a, b, c, d, k[13], 4, 681279174);
  d = hh(d, a, b, c, k[0], 11, -358537222);
  c = hh(c, d, a, b, k[3], 16, -722521979);
  b = hh(b, c, d, a, k[6], 23, 76029189);
  a = hh(a, b, c, d, k[9], 4, -640364487);
  d = hh(d, a, b, c, k[12], 11, -421815835);
  c = hh(c, d, a, b, k[15], 16, 530742520);
  b = hh(b, c, d, a, k[2], 23, -995338651);

  a = ii(a, b, c, d, k[0], 6, -198630844);
  d = ii(d, a, b, c, k[7], 10, 1126891415);
  c = ii(c, d, a, b, k[14], 15, -1416354905);
  b = ii(b, c, d, a, k[5], 21, -57434055);
  a = ii(a, b, c, d, k[12], 6, 1700485571);
  d = ii(d, a, b, c, k[3], 10, -1894986606);
  c = ii(c, d, a, b, k[10], 15, -1051523);
  b = ii(b, c, d, a, k[1], 21, -2054922799);
  a = ii(a, b, c, d, k[8], 6, 1873313359);
  d = ii(d, a, b, c, k[15], 10, -30611744);
  c = ii(c, d, a, b, k[6], 15, -1560198380);
  b = ii(b, c, d, a, k[13], 21, 1309151649);
  a = ii(a, b, c, d, k[4], 6, -145523070);
  d = ii(d, a, b, c, k[11], 10, -1120210379);
  c = ii(c, d, a, b, k[2], 15, 718787259);
  b = ii(b, c, d, a, k[9], 21, -343485551);

  x[0] = (x[0] + a) | 0;
  x[1] = (x[1] + b) | 0;
  x[2] = (x[2] + c) | 0;
  x[3] = (x[3] + d) | 0;
}

function md5blk(s) {
  const md5blks = [];
  let i;
  for (i = 0; i < 64; i += 4) {
    md5blks[i >> 2] =
      s.charCodeAt(i) +
      (s.charCodeAt(i + 1) << 8) +
      (s.charCodeAt(i + 2) << 16) +
      (s.charCodeAt(i + 3) << 24);
  }
  return md5blks;
}

function rhex(n) {
  const hex_chr = "0123456789abcdef";
  let s = "";
  for (let j = 0; j < 4; j++) {
    s +=
      hex_chr.charAt((n >> (j * 8 + 4)) & 0x0f) +
      hex_chr.charAt((n >> (j * 8)) & 0x0f);
  }
  return s;
}

function md5(s) {
  let i;
  let x = [1732584193, -271733879, -1732584194, 271733878];
  let sLen = s.length;
  for (i = 64; i <= sLen; i += 64) {
    md5cycle(x, md5blk(s.substring(i - 64, i)));
  }
  s = s.substring(i - 64);
  const tail = new Array(16).fill(0);
  for (i = 0; i < s.length; i++) tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
  tail[s.length >> 2] |= 0x80 << ((s.length % 4) << 3);
  if (s.length > 55) {
    md5cycle(x, tail);
    for (let j = 0; j < 16; j++) tail[j] = 0;
  }
  tail[14] = sLen * 8;
  md5cycle(x, tail);
  return rhex(x[0]) + rhex(x[1]) + rhex(x[2]) + rhex(x[3]);
}

/* ---------- Utility helpers ---------- */
function buildGravatarUrl(hash, size = 200, rating = "g", def = "identicon") {
  const base = DEFAULT_RESOURCE.endpointBase;
  const params = new URLSearchParams();
  if (size) params.set("s", String(size));
  if (rating) params.set("r", rating);
  if (def) params.set("d", def);
  return `${base}${hash}?${params.toString()}`;
}

function generateRandomHashes(count = 10) {
  const hashes = [];
  for (let i = 0; i < count; i++) {
    // random string hashed via md5 to get a pseudorandom gravatar hash
    const s = `${Math.random().toString(36).slice(2)}-${Date.now()}-${i}`;
    hashes.push(md5(s));
  }
  return hashes;
}

/* ---------- Main component ---------- */
export default function GravatarPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-color-scheme: dark)")?.matches);

  const [emailInput, setEmailInput] = useState("");
  const [hashInput, setHashInput] = useState(DEFAULT_RESOURCE.exampleHash);
  const [size, setSize] = useState(200);
  const [rating, setRating] = useState("g");
  const [defaultImage, setDefaultImage] = useState("identicon");
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState(buildGravatarUrl(DEFAULT_RESOURCE.exampleHash, 200, "g", "identicon"));
  const [profileJson, setProfileJson] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const favLoadedRef = useRef(false);

  // copy animation state
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef(null);

  // 10 sample avatars
  const [samples] = useState(() => generateRandomHashes(10));

  useEffect(() => {
    // load favorites
    try {
      const saved = JSON.parse(localStorage.getItem("gravatar-favs") || "[]");
      setFavorites(Array.isArray(saved) ? saved : []);
    } catch {
      setFavorites([]);
    }
    favLoadedRef.current = true;
  }, []);

  useEffect(() => {
    if (!favLoadedRef.current) return;
    localStorage.setItem("gravatar-favs", JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    // initial profile attempt
    fetchProfile(DEFAULT_RESOURCE.exampleHash);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleEmailToHash(value) {
    setEmailInput(value);
    const email = value.trim().toLowerCase();
    if (!email) return;
    try {
      const h = md5(email);
      setHashInput(h);
      setImageUrl(buildGravatarUrl(h, size, rating, defaultImage));
    } catch (err) {
      console.error("MD5 error", err);
    }
  }

  async function fetchAvatar() {
    if (!hashInput || hashInput.trim().length === 0) {
      showToast("info", "Enter an email or MD5 hash first.");
      return;
    }

    setLoading(true);
    setProfileJson(null);
    const u = buildGravatarUrl(hashInput, size, rating, defaultImage);
    setImageUrl(u);

    try {
      const profileUrl = `https://en.gravatar.com/${hashInput}.json`;
      const res = await fetch(profileUrl, { method: "GET" });
      if (!res.ok) {
        setProfileJson(null);
        showToast("info", "No profile JSON found for this hash — showing avatar only.");
        setLoading(false);
        return;
      }
      const json = await res.json();
      setProfileJson(json);
      showToast("success", "Loaded profile JSON.");
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to fetch profile JSON — avatar will still show.");
    } finally {
      setLoading(false);
    }
  }

  async function fetchProfile(hash) {
    if (!hash) return;
    setLoading(true);
    setProfileJson(null);
    try {
      const profileUrl = `https://en.gravatar.com/${hash}.json`;
      const res = await fetch(profileUrl, { method: "GET" });
      if (!res.ok) {
        setProfileJson(null);
        setLoading(false);
        return;
      }
      const json = await res.json();
      setProfileJson(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function saveFavorite() {
    const id = hashInput || Date.now().toString();
    if (!imageUrl) return showToast("info", "Nothing to save");
    if (favorites.some((f) => f.id === id)) {
      showToast("info", "Already in favorites");
      return;
    }
    const next = [
      { id, hash: hashInput, title: profileJson?.entry?.[0]?.displayName || `Hash: ${hashInput}`, thumb: imageUrl },
      ...favorites,
    ].slice(0, 100);
    setFavorites(next);
    showToast("success", "Saved to favorites");
  }

  function removeFavorite(id) {
    setFavorites((p) => p.filter((f) => f.id !== id));
    showToast("info", "Removed favorite");
  }

  function chooseFavorite(f) {
    setHashInput(f.hash);
    setImageUrl(f.thumb);
    fetchProfile(f.hash);
  }

  function chooseSample(hash) {
    setHashInput(hash);
    setImageUrl(buildGravatarUrl(hash, size, rating, defaultImage));
    fetchProfile(hash);
  }

  function copyImageUrl() {
    if (!imageUrl) return showToast("info", "No image URL");
    navigator.clipboard.writeText(imageUrl).then(() => {
      setCopied(true);
      showToast("success", "Image URL copied");
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopied(false), 1800);
    });
  }

  function downloadImage() {
    if (!imageUrl) return showToast("info", "No image to download");
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `gravatar_${hashInput || "avatar"}.jpg`;
    a.target = "_blank";
    document.body.appendChild(a);
    a.click();
    a.remove();
    showToast("success", "Download triggered (may open in new tab depending on CORS)");
  }

  function resetToDefault() {
    setImageUrl(buildGravatarUrl(DEFAULT_RESOURCE.exampleHash, size, rating, defaultImage));
    setHashInput(DEFAULT_RESOURCE.exampleHash);
    setEmailInput("");
    fetchProfile(DEFAULT_RESOURCE.exampleHash);
  }

  return (
    <div className={clsx("min-h-screen p-4 sm:p-6 pb-10 max-w-8xl mx-auto")}>
      {/* Header: responsive with mobile menu */}
      <header className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden cursor-pointer">
                <Menu />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-2">
              {/* Mobile sheet content: mirror of right sidebar */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Github />
                  <div>
                    <div className="font-semibold">Gravatar Tools</div>
                    <div className="text-xs opacity-60">Quick actions & examples</div>
                  </div>
                </div>

              </div>

              <ScrollArea className="h-[60vh] p-2 overflow-auto">
                <div className="space-y-4">
                  

                  <div className="overflow-x-auto w-80">
                    <div className="text-xs opacity-60 mb-1">Samples</div>
                    <div className="grid grid-cols-5 overflow-auto gap-2">
                      {samples.map((s) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={s} src={buildGravatarUrl(s, 80, "g", "identicon")} alt="sample" className="w-full h-16 object-cover rounded-sm cursor-pointer" onClick={() => chooseSample(s)} />
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs opacity-60 mb-1">Favorites</div>
                    <div className="space-y-2">
                      {favorites.length === 0 ? (
                        <div className="text-sm opacity-60">No favorites yet.</div>
                      ) : (
                        favorites.map((f) => (
                          <div key={f.id} className="flex items-center gap-2 p-2 rounded-md border">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={f.thumb} alt={f.title} className="w-12 h-12 object-cover rounded-sm" />
                            <div className="">
                              <div className="text-sm font-medium">{f.title}</div>
                              <div className="text-xs opacity-60 ">{f.hash}</div>
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost" onClick={() => chooseFavorite(f)} className="cursor-pointer"><ExternalLink /></Button>
                              <Button size="sm" variant="ghost" onClick={() => removeFavorite(f.id)} className="cursor-pointer"><X /></Button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs opacity-60 mb-1">About</div>
                    <div className="text-sm opacity-70">This page uses Gravatar public endpoints. Profiles: <span className="font-mono">https://en.gravatar.com/&lt;hash&gt;.json</span></div>
                  </div>
                </div>
              </ScrollArea>
            </SheetContent>
          </Sheet>

          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold">Gravatar — Avatar Explorer</h1>
            <div className="text-xs opacity-60 hidden sm:block">Fetch avatars by email or MD5 hash. Save favorites, inspect profile JSON, and preview endpoints.</div>
          </div>
        </div>

        {/* Desktop search & actions */}
        <div className="hidden md:flex items-center gap-3">
          <form
            onSubmit={(e) => { e.preventDefault(); fetchAvatar(); }}
            className={clsx("flex items-center gap-2 rounded-lg px-3 py-2 w-[640px]", isDark ? "bg-black/50 border border-zinc-800" : "bg-white border border-zinc-200")}
          >
            <Search className="opacity-60" />
            <Input
              placeholder="Enter email (will be MD5-hashed) — e.g. user@example.com, or paste MD5 hash"
              value={emailInput}
              onChange={(e) => handleEmailToHash(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none flex-1"
            />
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  // toggle to allow direct hash editing
                  if (emailInput) {
                    setHashInput(md5(emailInput.trim().toLowerCase()));
                    setImageUrl(buildGravatarUrl(md5(emailInput.trim().toLowerCase()), size, rating, defaultImage));
                  } else {
                    setHashInput(DEFAULT_RESOURCE.exampleHash);
                    setEmailInput("");
                    setImageUrl(buildGravatarUrl(DEFAULT_RESOURCE.exampleHash, size, rating, defaultImage));
                  }
                }}
                className="cursor-pointer"
              >
                <User /> Hash
              </Button>
              <Button type="submit" variant="outline" className="cursor-pointer"><Search /></Button>
            </div>
          </form>
        </div>

        {/* Mobile search (small) */}
        <div className="md:hidden w-full">
          <form
            onSubmit={(e) => { e.preventDefault(); fetchAvatar(); }}
            className={clsx("flex items-center gap-2 rounded-lg px-3 py-2 w-full", isDark ? "bg-black/50 border border-zinc-800" : "bg-white border border-zinc-200")}
          >
            <Search className="opacity-60" />
            <Input
              placeholder="email or md5 hash"
              value={emailInput}
              onChange={(e) => handleEmailToHash(e.target.value)}
              className="border-0 shadow-none bg-transparent outline-none flex-1"
            />
            <Button type="submit" variant="outline" className="cursor-pointer"><Search /></Button>
          </form>
        </div>
      </header>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main viewer */}
        <section className="lg:col-span-8 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <CardHeader className={clsx("p-5 flex flex-col md:flex-row items-start md:items-center gap-4 justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <ImageIcon /> Avatar Preview
                </CardTitle>
                <div className="text-xs opacity-60">{DEFAULT_RESOURCE.description}</div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <div className="flex items-center gap-2">
                  {/* Size Select */}
                  <div className="flex flex-col">
                    <div className="text-xs opacity-60">Size</div>
                    <Select value={String(size)} onValueChange={(v) => { const n = Number(v); setSize(n); setImageUrl(buildGravatarUrl(hashInput || DEFAULT_RESOURCE.exampleHash, n, rating, defaultImage)); }}>
                      <SelectTrigger className="w-[80px]">
                        <SelectValue placeholder={`${size}px`} />
                      </SelectTrigger>
                      <SelectContent>
                        {[80, 128, 200, 400, 800].map((s) => <SelectItem key={s} value={String(s)}>{s}px</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Rating */}
                  <div className="flex flex-col">
                    <div className="text-xs opacity-60">Rating</div>
                    <Select value={rating} onValueChange={(v) => { setRating(v); setImageUrl(buildGravatarUrl(hashInput || DEFAULT_RESOURCE.exampleHash, size, v, defaultImage)); }}>
                      <SelectTrigger className="w-[72px]">
                        <SelectValue placeholder={rating.toUpperCase()} />
                      </SelectTrigger>
                      <SelectContent>
                        {["g", "pg", "r", "x"].map((r) => <SelectItem key={r} value={r}>{r.toUpperCase()}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Default */}
                  <div className="flex flex-col">
                    <div className="text-xs opacity-60">Default</div>
                    <Select value={defaultImage} onValueChange={(v) => { setDefaultImage(v); setImageUrl(buildGravatarUrl(hashInput || DEFAULT_RESOURCE.exampleHash, size, rating, v)); }}>
                      <SelectTrigger className="w-[110px]">
                        <SelectValue placeholder={defaultImage} />
                      </SelectTrigger>
                      <SelectContent>
                        {["404", "mp", "identicon", "monsterid", "wavatar", "retro", "robohash"].map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-2 sm:mt-0">
                  <Button variant="outline" onClick={() => fetchAvatar()} className="cursor-pointer">
                    {loading ? <Loader2 className="animate-spin" /> : <ImageIcon />} Fetch
                  </Button>

                  <Button variant="ghost" onClick={() => setDialogOpen(true)} className="cursor-pointer">
                    <List /> View
                  </Button>

                  <Button variant="outline" onClick={() => saveFavorite()} className="cursor-pointer">
                    <Star /> Save
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                {/* Left: visual avatar + quick actions */}
                <div className={clsx("p-4 rounded-xl border flex flex-col items-center gap-3", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                  <div className="w-full text-sm font-semibold mb-1 flex items-center gap-2">
                    <span>Avatar</span>
                    <span className="text-xs opacity-60">Preview</span>
                  </div>

                  <div className="w-full flex items-center justify-center">
                    <motion.div
                      key={imageUrl}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.18 }}
                      className="rounded-md overflow-hidden flex items-center bg-zinc-50 dark:bg-zinc-900 p-3"
                      style={{ width: "min(360px, 100%)" }}
                    >
                      {loading ? (
                        <div className="w-full h-[200px] flex items-center justify-center"><Loader2 className="animate-spin" /></div>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={imageUrl} alt={`Gravatar ${hashInput}`} className="w-full h-[200px] object-cover rounded-md" />
                      )}
                    </motion.div>
                  </div>

                  <div className="w-full space-y-2 text-sm">
                    <div>
                      <div className="text-xs opacity-60">Hash</div>
                      <div className="font-medium break-words text-sm flex items-center gap-2">
                        <Hash className="opacity-70" />
                        <span className="break-all">{hashInput || "—"}</span>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs opacity-60">Image URL</div>
                      <div className="font-medium text-sm overflow-auto no-scrollbar break-all">{imageUrl}</div>
                    </div>

             
                  </div>
                </div>

                {/* Right: profile summary with icons and details */}
                <div className={clsx("p-4 rounded-xl border col-span-1 md:col-span-2", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                  <div className="flex items-center gap-2 flex-wrap justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileJson />
                      <div>
                        <div className="text-sm font-semibold">Profile Summary</div>
                        <div className="text-xs opacity-60">Avatar metadata & fields</div>
                      </div>
                    </div>

                    
                  </div>

                  {profileJson ? (
                    <>
                      <div className="mb-3">
                        <div className="text-xs opacity-60">Display name</div>
                        <div className="font-medium text-lg">{profileJson.entry?.[0]?.displayName ?? "—"}</div>
                      </div>

                      <div className="mb-3">
                        <div className="text-xs opacity-60">About</div>
                        <div className="text-sm leading-relaxed">{profileJson.entry?.[0]?.aboutMe ?? profileJson.entry?.[0]?.thumbnailUrl ?? "No description available."}</div>
                      </div>

                      <Separator className="my-3" />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {profileJson.entry?.[0]?.preferredUsername && (
                          <div className="p-2 rounded-md border flex items-center gap-2">
                            <User className="opacity-70" />
                            <div>
                              <div className="text-xs opacity-60">Username</div>
                              <div className="text-sm font-medium">{profileJson.entry[0].preferredUsername}</div>
                            </div>
                          </div>
                        )}

                        {profileJson.entry?.[0]?.profileUrl && (
                          <div className="p-2 rounded-md border flex items-center gap-2">
                            <LinkIcon className="opacity-70" />
                            <div>
                              <div className="text-xs opacity-60">Profile URL</div>
                              <div className="text-sm font-medium"><a href={profileJson.entry[0].profileUrl} target="_blank" rel="noreferrer" className="underline">{profileJson.entry[0].profileUrl}</a></div>
                            </div>
                          </div>
                        )}

                        {profileJson.entry?.[0]?.photos && (
                          <div className="p-2 rounded-md border col-span-1 sm:col-span-2">
                            <div className="text-xs opacity-60">Photos</div>
                            <div className="flex gap-2 mt-2">
                              {profileJson.entry[0].photos.map((p, i) => (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img key={i} src={p.value} alt={`photo-${i}`} className="w-16 h-16 object-cover rounded-sm" />
                              ))}
                            </div>
                          </div>
                        )}

                        {Object.entries(profileJson.entry?.[0] ?? {})
                          .filter(([k]) => !["photos", "displayName", "aboutMe", "profileUrl", "preferredUsername"].includes(k))
                          .slice(0, 6)
                          .map(([k, v]) => (
                            <div key={k} className="p-2 rounded-md border">
                              <div className="text-xs opacity-60">{k}</div>
                              <div className="text-sm font-medium break-words">{typeof v === "object" ? JSON.stringify(v) : String(v)}</div>
                            </div>
                          ))}
                      </div>
                    </>
                  ) : (
                    <div className="py-6 text-sm opacity-70">No profile JSON available. Gravatar will still serve an avatar. Use Fetch to attempt loading profile JSON.</div>
                  )}

                  <AnimatePresence>
                    {showRaw && profileJson && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("p-4 mt-4 border-t", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                        <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 300 }}>
                          {JSON.stringify(profileJson, null, 2)}
                        </pre>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Samples row (10 random) */}
              <div className="mt-4">
                <div className="text-sm font-semibold mb-2 flex items-center gap-2"><RefreshCcw /> Explore samples</div>
                <ScrollArea className="py-2">
                  <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                    {samples.map((s) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <motion.img
                        key={s}
                        src={buildGravatarUrl(s, 64, "g", "identicon")}
                        alt="sample"
                        className="w-full h-16 object-cover rounded-sm cursor-pointer border"
                        whileHover={{ scale: 1.03 }}
                        onClick={() => chooseSample(s)}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </CardContent>

            <div className={clsx("p-4 border-t flex items-center justify-between", isDark ? "bg-black/60 border-zinc-800" : "bg-white/90 border-zinc-200")}>
              <div className="text-xs opacity-60">Endpoint</div>
              <div className="flex gap-2 items-center">
                <Button variant="outline" onClick={() => { navigator.clipboard.writeText(buildGravatarUrl(hashInput || DEFAULT_RESOURCE.exampleHash, size, rating, defaultImage)); showToast("success", "Endpoint copied"); }} className="cursor-pointer"><Copy /> Copy Endpoint</Button>
                <Button variant="outline" onClick={() => { setShowRaw((s) => !s); }} className="cursor-pointer"><List /> {showRaw ? "Hide JSON" : "Show JSON"}</Button>
                <Button variant="ghost" onClick={() => { resetToDefault(); }} className="cursor-pointer"><ArchiveRestore /> Reset</Button>
              </div>
            </div>
          </Card>
        </section>

        {/* Right sidebar (desktop) */}
        <aside className={clsx("lg:col-span-4 rounded-2xl p-4 space-y-4 h-fit hidden lg:block", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold mb-2">Developer</div>
            <div className="text-xs opacity-60">Endpoint examples, preview & tools</div>

            <div className="mt-3 space-y-2">
              <div className="text-xs opacity-60">Example endpoint</div>
              <div className="p-2 rounded-md bg-zinc-50 dark:bg-zinc-900 border break-words text-sm">{DEFAULT_RESOURCE.endpointBase}{DEFAULT_RESOURCE.exampleHash}?s=200&r=g&d=identicon</div>

              <div className="flex gap-2 mt-2">
                <Button variant="outline" onClick={() => { navigator.clipboard.writeText(DEFAULT_RESOURCE.code); showToast("success", "Code snippet copied"); }} className="cursor-pointer"><Copy /> Copy Snippet</Button>
                <Button variant="outline" onClick={() => { window.open(`${DEFAULT_RESOURCE.endpointBase}${hashInput || DEFAULT_RESOURCE.exampleHash}?s=${size}&r=${rating}&d=${defaultImage}`, "_blank"); }} className="cursor-pointer"><ExternalLink /> Open</Button>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Favorites</div>
            <div className="text-xs opacity-60">Saved avatars for quick access</div>

            <div className="mt-3 space-y-2 max-h-64">
              <ScrollArea className="max-h-64">
                <div className="space-y-2">
                  {favorites.length === 0 ? (
                    <div className="text-sm opacity-60">No favorites yet — save avatars with the Save button.</div>
                  ) : (
                    favorites.map((f) => (
                      <div key={f.id} className="flex items-center gap-2 p-2 rounded-md border">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={f.thumb} alt={f.title} className="w-12 h-12 object-cover rounded-sm" />
                        <div className="flex-1">
                          <div className="text-sm font-medium">{f.title}</div>
                          <div className="text-xs opacity-60 truncate">{f.hash}</div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <Button size="sm" variant="ghost" onClick={() => chooseFavorite(f)} className="cursor-pointer"><ExternalLink /></Button>
                          <Button size="sm" variant="ghost" onClick={() => removeFavorite(f.id)} className="cursor-pointer"><X /></Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">About</div>
            <div className="text-xs opacity-60">This page uses Gravatar public endpoints. If profile JSON exists, it's loaded from <span className="font-mono">https://en.gravatar.com/&lt;hash&gt;.json</span>. Avatars are served from <span className="font-mono">{DEFAULT_RESOURCE.endpointBase}&lt;hash&gt;</span>.</div>
          </div>
        </aside>
      </main>

      {/* Image dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-3xl w-full p-3 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>Avatar</DialogTitle>
          </DialogHeader>

          <div style={{ height: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imageUrl} alt="avatar" style={{ maxHeight: "100%", maxWidth: "100%", objectFit: "contain" }} />
            ) : (
              <div className="h-full flex items-center justify-center">No image</div>
            )}
          </div>

          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Avatar preview</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="cursor-pointer"><X /></Button>
              <Button variant="outline" onClick={() => { if (imageUrl) window.open(imageUrl, "_blank"); }} className="cursor-pointer"><ExternalLink /></Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
