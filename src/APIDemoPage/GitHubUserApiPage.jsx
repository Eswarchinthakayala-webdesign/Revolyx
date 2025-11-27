// src/pages/RandomUserPage.jsx
"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { Toaster, toast } from "sonner";
import {
  RefreshCw,
  Copy,
  User,
  Mail,
  Phone,
  Globe,
  Calendar,
  MapPin,
  Download,
  Eye,
  X,
  Menu,
  ExternalLink,
  Image as ImageIcon,
  Check,
} from "lucide-react";

/* Shadcn/UI */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

/* Syntax highlighter */
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

/* Theme provider */
import { useTheme } from "@/components/theme-provider";

/* API */
const ENDPOINT = "https://randomuser.me/api/?results=10&nat=us,gb,ca,au";

/* Helpers */
const pretty = (obj) => JSON.stringify(obj, null, 2);

export default function RandomUserPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [copied, setCopied] = useState({ endpoint: false, json: false, profile: false });
  const [fullResponse, setFullResponse] = useState(null);

  const copyResetTimers = useRef({});

  /* Fetch 10 users */
  async function fetchUsers() {
    try {
      setLoading(true);
      const res = await fetch(ENDPOINT);
      const json = await res.json();
      setFullResponse(json);
      setProfiles(json?.results ?? []);
      setSelectedIndex(0);
      toast.success("10 random users loaded");
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUsers();
    // cleanup timers on unmount
    return () => {
      Object.values(copyResetTimers.current).forEach((t) => clearTimeout(t));
    };
  }, []);

  /* Selected profile derived */
  const selected = profiles?.[selectedIndex] ?? null;
  const fullName = selected ? `${selected.name.title} ${selected.name.first} ${selected.name.last}` : "—";
  const avatar = selected?.picture?.large ?? "";
  const dob = selected?.dob?.date ? new Date(selected.dob.date).toLocaleDateString() : "—";
  const location = selected
    ? `${selected.location.city}, ${selected.location.state}, ${selected.location.country}`
    : "—";

  /* Copy Helpers with animated tick */
  const doCopy = (text, key, message = "Copied!") => {
    if (!text) return toast.error("Nothing to copy");
    navigator.clipboard.writeText(text);
    setCopied((c) => ({ ...c, [key]: true }));
    // reset after 1.6s
    clearTimeout(copyResetTimers.current[key]);
    copyResetTimers.current[key] = setTimeout(() => {
      setCopied((c) => ({ ...c, [key]: false }));
    }, 1600);
    toast.success(message);
  };

  const handleCopyEndpoint = () => doCopy(ENDPOINT, "endpoint", "Endpoint copied!");
  const handleCopyJSON = () => doCopy(pretty(fullResponse ?? profiles), "json", "JSON copied!");
  const handleCopyProfileJSON = (idx) =>
    doCopy(pretty(profiles?.[idx] ?? {}), "profile", "Profile JSON copied!");

  const handleDownloadJSON = (payload, filename = "random-users.json") => {
    const blob = new Blob([pretty(payload)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Downloaded JSON");
  };

  /* Small card animation variants */
  const cardVariants = {
    hidden: { opacity: 0, y: 8 },
    enter: { opacity: 1, y: 0 },
    hover: { scale: 1.02 },
  };

  return (
    <div
      className={clsx(
        "min-h-screen p-4 md:p-6 pb-10 max-w-8xl mx-auto transition-colors duration-200",
        isDark ? "bg-zinc-950" : "bg-gray-50"
      )}
    >
      <Toaster richColors />

      {/* HEADER */}
      <header className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {/* mobile sheet trigger */}
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                className="p-2 md:hidden cursor-pointer"
                aria-label="Open actions"
              >
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className={clsx("w-[300px] p-4")}>
              <div className="flex items-center justify-between mb-4">
                <div className={clsx("text-lg font-semibold")}>Actions</div>
                <Button variant="ghost" onClick={() => setSheetOpen(false)}>
                  <X />
                </Button>
              </div>

              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start cursor-pointer" onClick={fetchUsers}>
                  <RefreshCw /> Refresh
                </Button>
                <Button variant="outline" className="w-full justify-start cursor-pointer" onClick={handleCopyEndpoint}>
                  <Copy /> Copy Endpoint
                </Button>
                <Button variant="outline" className="w-full justify-start cursor-pointer" onClick={handleCopyJSON}>
                  <Copy /> Copy JSON
                </Button>
                <Button variant="outline" className="w-full justify-start cursor-pointer" onClick={() => handleDownloadJSON(fullResponse ?? profiles)}>
                  <Download /> Download JSON
                </Button>
              </div>
            </SheetContent>
          </Sheet>

          <div>
            <h1
              className={clsx(
                "text-2xl md:text-3xl font-extrabold",
                isDark ? "text-zinc-50" : "text-zinc-900"
              )}
            >
              Revolyx · Random Users
            </h1>
            <p className={clsx("text-xs mt-0.5", isDark ? "text-zinc-400" : "text-zinc-600")}>
              Generating realistic profiles for testing & design — 10 at a time.
            </p>
          </div>
        </div>

        {/* desktop actions */}
        <div className="hidden md:flex items-center gap-2">
          <Button variant="outline" onClick={fetchUsers} className="cursor-pointer">
            <RefreshCw className={loading ? "animate-spin" : ""} /> Refresh
          </Button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            className="relative"
            onClick={handleCopyEndpoint}
            aria-label="Copy API endpoint"
          >
            <Button variant="outline" className="cursor-pointer flex items-center gap-2">
              {!copied.endpoint ? <Copy /> : <Check />}
              <span>{!copied.endpoint ? "Copy Endpoint" : "Copied"}</span>
            </Button>
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={handleCopyJSON}
            className="relative"
          >
            <Button variant="outline" className="cursor-pointer flex items-center gap-2">
              {!copied.json ? <Copy /> : <Check />}
              <span>{!copied.json ? "Copy JSON" : "Copied"}</span>
            </Button>
          </motion.button>

          <Button variant="outline" onClick={() => handleDownloadJSON(fullResponse ?? profiles)} className="cursor-pointer">
            <Download /> Download JSON
          </Button>
        </div>
      </header>

      {/* LAYOUT */}
      <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* LEFT SIDEBAR (desktop) */}
        <aside
          className={clsx(
            "hidden lg:block h-[78vh] p-4 rounded-xl border",
            isDark ? "bg-black/30 border-zinc-800" : "bg-white/80 border-zinc-200"
          )}
        >
          <h3 className={clsx("text-sm font-semibold", isDark ? "text-zinc-100" : "text-zinc-900")}>
            Quick Actions
          </h3>
          <p className={clsx("text-xs mb-3", isDark ? "text-zinc-300" : "text-zinc-600")}>
            Useful controls for the API
          </p>

          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start cursor-pointer" onClick={fetchUsers}>
              <RefreshCw /> Refresh Users
            </Button>
            <Button variant="outline" className="w-full justify-start cursor-pointer" onClick={handleCopyEndpoint}>
              <Copy /> Copy Endpoint
            </Button>
            <Button variant="outline" className="w-full justify-start cursor-pointer" onClick={handleCopyJSON}>
              <Copy /> Copy JSON
            </Button>
            <Button variant="outline" className="w-full justify-start cursor-pointer" onClick={() => handleDownloadJSON(fullResponse ?? profiles)}>
              <Download /> Download JSON
            </Button>
          </div>

          <Separator className="my-4" />

          <div className="space-y-3">
            <Card className={clsx("p-3 border rounded-xl", isDark ? "bg-black/20 border-zinc-800" : "bg-white/60 border-zinc-200")}>
              <div className="text-xs opacity-70">Users loaded</div>
              <div className="mt-1 font-medium">{profiles.length}</div>
            </Card>

            <Card className={clsx("p-3 border rounded-xl", isDark ? "bg-black/20 border-zinc-800" : "bg-white/60 border-zinc-200")}>
              <div className="text-xs opacity-70">Selected</div>
              <div className="mt-1 font-medium">{fullName}</div>
            </Card>
          </div>
        </aside>

        {/* MAIN (preview + list) */}
        <section className="lg:col-span-3 space-y-6">
          {/* PREVIEW */}
          <Card
            className={clsx(
              "rounded-2xl border overflow-hidden",
              isDark ? "bg-black/40 border-zinc-800" : "bg-white"
            )}
          >
            <CardHeader className={clsx("p-4 md:p-6 border-b", isDark ? "bg-black/60 border-zinc-800" : "bg-white/80 border-zinc-200")}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className={clsx(isDark ? "text-zinc-100" : "text-zinc-900", "flex items-center gap-3")}>
                    <User className="w-5 h-5" />
                    <span>Profile</span>
                  </CardTitle>
                  <p className={clsx("text-xs mt-1", isDark ? "text-zinc-400" : "text-zinc-600")}>
                    Click an avatar below to view details. Use actions to copy/download JSON.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="ghost" onClick={() => setImageOpen(true)} className="cursor-pointer">
                    <ImageIcon />
                  </Button>
                  <Button variant="ghost" onClick={() => setShowRaw((s) => !s)} className="cursor-pointer">
                    <Eye /> {showRaw ? "Hide Raw" : "Show Raw"}
                  </Button>
                  <Button variant="outline" onClick={fetchUsers} disabled={loading} className="cursor-pointer">
                    <RefreshCw className={loading ? "animate-spin" : ""} />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {!selected ? (
                <div className="text-center py-8 opacity-50">No user selected</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* PROFILE AVATAR */}
                  <motion.div
                    initial="hidden"
                    animate="enter"
                    variants={cardVariants}
                    className={clsx(
                      "rounded-xl p-5 border flex flex-col items-center",
                      isDark ? "bg-black/20 border-zinc-800" : "bg-white/60 border-zinc-200"
                    )}
                  >
                    <img
                      src={avatar}
                      alt={fullName}
                      className="w-36 h-36 rounded-full border border-zinc-200 dark:border-zinc-700 shadow-md cursor-pointer"
                      onClick={() => setImageOpen(true)}
                    />

                    <div className="mt-4 text-center">
                      <h2 className={clsx("font-semibold", isDark ? "text-zinc-100" : "text-zinc-900")}>
                        {fullName}
                      </h2>
                      <div className={clsx("text-sm mt-1", isDark ? "text-zinc-300" : "text-zinc-600")}>
                        {selected.gender} • {selected.nat}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-2">
                      <motion.button whileTap={{ scale: 0.96 }} onClick={() => handleCopyProfileJSON(selectedIndex)}>
                        <Button variant="outline" className="cursor-pointer">
                          {!copied.profile ? <Copy /> : <Check />} { !copied.profile ? "Copy" : "Copied"}
                        </Button>
                      </motion.button>

                      <Button variant="outline" className="cursor-pointer" onClick={() => handleDownloadJSON(selected, `${selected.login?.username ?? "profile"}.json`)}>
                        <Download /> Export
                      </Button>
                    </div>
                  </motion.div>

                  {/* DETAILS */}
                  <motion.div
                    initial="hidden"
                    animate="enter"
                    variants={cardVariants}
                    className={clsx(
                      "rounded-xl p-5 border col-span-2 space-y-4",
                      isDark ? "bg-black/20 border-zinc-800" : "bg-white/60 border-zinc-200"
                    )}
                  >
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 mt-1" />
                        <div>
                          <div className="text-xs opacity-70">Email</div>
                          <div className="font-medium">{selected.email}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 mt-1" />
                        <div>
                          <div className="text-xs opacity-70">Phone</div>
                          <div className="font-medium">{selected.phone}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <Calendar className="w-5 h-5 mt-1" />
                        <div>
                          <div className="text-xs opacity-70">Date of Birth</div>
                          <div className="font-medium">{dob}</div>
                        </div>
                      </div>

                      <div className="flex items-start gap-3">
                        <MapPin className="w-5 h-5 mt-1" />
                        <div>
                          <div className="text-xs opacity-70">Location</div>
                          <div className="font-medium">{location}</div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                      <div>
                        <div className="text-xs opacity-70">Login</div>
                        <div className="font-medium">{selected.login?.username ?? "—"}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <a href={selected?.picture?.large} target="_blank" rel="noreferrer" className="flex items-center gap-2 underline text-sm cursor-pointer">
                          <ExternalLink className="w-4 h-4" /> Open image
                        </a>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )}

              {/* RAW JSON */}
              <AnimatePresence>
                {showRaw && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className={clsx(
                      "mt-6 rounded-xl p-4 border",
                      isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200"
                    )}
                  >
                    <SyntaxHighlighter
                      wrapLongLines
                      wrapLines
                      language="json"
                      style={isDark ? oneDark : oneLight}
                    >
                      {pretty(selected ?? {})}
                    </SyntaxHighlighter>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* HORIZONTAL LIST OF 10 PROFILES */}
          <Card className={clsx("rounded-2xl border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/80 border-zinc-200")}>
            <CardHeader className="p-4 border-b flex items-center justify-between">
              <CardTitle className={clsx(isDark ? "text-zinc-100" : "text-zinc-900")}>
                All Profiles
              </CardTitle>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => handleDownloadJSON(fullResponse ?? profiles)} className="cursor-pointer">
                  <Download /> Export All
                </Button>
                <Button variant="ghost" onClick={() => setSelectedIndex(0)} className="cursor-pointer">
                  <RefreshCw /> Reset
                </Button>
              </div>
            </CardHeader>

            <CardContent className="p-3">
              <ScrollArea className="h-[110px]">
                <div className="flex items-center gap-3 px-2 py-2">
                  {profiles.length === 0 ? (
                    <div className="text-sm opacity-50">No users</div>
                  ) : (
                    profiles.map((p, i) => (
                      <motion.button
                        key={p.login?.uuid ?? i}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setSelectedIndex(i)}
                        className={clsx(
                          "flex-shrink-0 w-20 md:w-24 p-1 rounded-lg border cursor-pointer overflow-hidden",
                          i === selectedIndex
                            ? "ring-1 ring-offset-1 ring-zinc-500/30"
                            : isDark
                            ? "bg-black/20 border-zinc-800"
                            : "bg-white/60 border-zinc-200"
                        )}
                        aria-selected={i === selectedIndex}
                      >
                        <img src={p.picture?.thumbnail} alt={`${p.name.first}`} className="w-full h-16 md:h-20 rounded-md object-cover" />
                        <div className="mt-1 text-xs text-center truncate">{p.name.first}</div>
                      </motion.button>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </section>
      </main>

      {/* IMAGE DIALOG */}
      <Dialog open={imageOpen} onOpenChange={setImageOpen}>
        <DialogContent
          className={clsx(
            "max-w-md w-full rounded-xl overflow-hidden",
            isDark ? "bg-black/90" : "bg-white"
          )}
        >
          <DialogHeader>
            <DialogTitle className={clsx(isDark ? "text-zinc-100" : "text-zinc-900")}>
              User Image
            </DialogTitle>
          </DialogHeader>

          <div className="flex justify-center p-4">
            <img
              src={avatar}
              alt="User"
              className="rounded-xl border shadow-lg max-w-full"
            />
          </div>

          <DialogFooter className="flex justify-end p-3 border-t">
            <Button variant="outline" onClick={() => setImageOpen(false)} className="cursor-pointer">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
