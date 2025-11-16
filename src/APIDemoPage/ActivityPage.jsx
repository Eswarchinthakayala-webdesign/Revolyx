// ActivityPage.jsx
"use client";

import React, { useEffect, useState, useMemo } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity as ActivityIcon,
  Music,
  BookOpen,
  Coffee,
   ToolCaseIcon as  Tools ,
  User,
  Link as LinkIcon,
  RefreshCcw,
  Zap,
  DollarSign,
  Eye,
  List
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/*
  Professional Activity page for: https://www.boredapi.com/api/activity/
  - Filters: type & participants (optional)
  - "Get Activity" button fetches one activity (default loads one on mount)
  - Raw JSON toggle & Dev panel
  - Icons mapped to : type
  - No local save logic (removed as requested)
*/

const BASE = "https://www.boredapi.com/api/activity/";

const TYPE_ICON_MAP = {
  music: Music,
  education: BookOpen,
  cooking: Coffee,
  relaxation: ActivityIcon,
  busywork: Tools,
  social: User,
  recreational: Zap,
  charity: HeartishOrFallback,
  diy: Tools,
  default: ActivityIcon
};

// small fallback helper for mapping "charity" icon (lucide doesn't have Heart imported)
function HeartishOrFallback(props) {
  // simple inline SVG fallback to avoid extra import
  return (
    <svg {...props} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 21s-7-4.35-9-7.5A5.5 5.5 0 0112 6.5a5.5 5.5 0 019 7 18 18 0 01-9 7.5z" />
    </svg>
  );
}

// Map numeric 0..1 to human label
function priceLabel(v) {
  if (v === undefined || v === null) return "Unknown";
  if (v === 0) return "Free";
  if (v <= 0.2) return "Very Low";
  if (v <= 0.5) return "Low";
  if (v <= 0.75) return "Medium";
  return "Paid";
}

function accessibilityLabel(v) {
  if (v === undefined || v === null) return "Unknown";
  if (v <= 0.2) return "Very Easy";
  if (v <= 0.5) return "Easy";
  if (v <= 0.8) return "Moderate";
  return "Challenging";
}

export default function ActivityPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches);

  // UI state
  const [typeFilter, setTypeFilter] = useState(""); // optional: music, education, etc.
  const [participants, setParticipants] = useState(""); // optional numeric
  const [activity, setActivity] = useState(null);
  const [rawResp, setRawResp] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [showRaw, setShowRaw] = useState(false);

  // Build query url based on filters
  const urlForFetch = useMemo(() => {
    const url = new URL(BASE);
    if (typeFilter) url.searchParams.set("type", typeFilter);
    if (participants && Number(participants) > 0) url.searchParams.set("participants", participants);
    return url.toString();
  }, [typeFilter, participants]);

  async function fetchActivity() {
    setLoading(true);
    try {
      const res = await fetch(urlForFetch);
      if (!res.ok) {
        showToast("error", `API error: ${res.status}`);
        setLoading(false);
        return;
      }
      const json = await res.json();
      // API returns a single object; it may return a "error" like { error: "No activity found" }
      if (json && json.error) {
        showToast("info", json.error);
        setActivity(null);
        setRawResp(json);
      } else {
        setActivity(json);
        setRawResp(json);
      }
    } catch (err) {
      console.error(err);
      showToast("error", "Network error fetching activity");
    } finally {
      setLoading(false);
    }
  }

  // fetch one default activity on mount
  useEffect(() => {
    fetchActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Choose icon component based on type
  function TypeIcon({ t, className }) {
    const Key = TYPE_ICON_MAP[t] || TYPE_ICON_MAP.default;
    // HeartishOrFallback is included in map for charity
    return <Key className={className} />;
  }

  // simple UI card showing a field title + value
  const Field = ({ title, value }) => (
    <div className="mb-3">
      <div className="text-xs opacity-60">{title}</div>
      <div className="text-sm font-medium">{value ?? "—"}</div>
    </div>
  );

  return (
    <div className={clsx("min-h-screen p-6 max-w-6xl mx-auto")}>
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold">Spark — Random Activities</h1>
          <p className="text-sm mt-1 opacity-70">Instant activity suggestions to beat boredom. Filter by type or participants, view details and raw response.</p>
        </div>

        <div className="flex gap-3 items-center w-full md:w-auto">
          <div className={clsx("flex gap-2 items-center rounded-lg px-3 py-2", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v)} className="min-w-[140px]">
              <option value="">Any type</option>
              <option value="education">Education</option>
              <option value="recreational">Recreational</option>
              <option value="social">Social</option>
              <option value="diy">DIY</option>
              <option value="charity">Charity</option>
              <option value="cooking">Cooking</option>
              <option value="relaxation">Relaxation</option>
              <option value="music">Music</option>
              <option value="busywork">Busywork</option>
            </Select>

            <Select value={participants} onValueChange={(v) => setParticipants(v)} className="min-w-[110px]">
              <option value="">Any participants</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </Select>

            <Button onClick={() => fetchActivity()} className="whitespace-nowrap" variant="primary">
              {loading ? <RefreshCcw className="animate-spin mr-2" /> : <RefreshCcw className="mr-2" />} Get Activity
            </Button>
          </div>
        </div>
      </header>

      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main card */}
        <section className="lg:col-span-8">
          <Card className={clsx("rounded-2xl overflow-hidden border")}>
            <CardHeader className="p-5 flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-lg">Activity Suggestion</CardTitle>
                <div className="text-xs opacity-60">{activity ? `Type: ${activity.type ?? "—"} • Participants: ${activity.participants ?? "—"}` : "Loading..."}</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={() => setShowRaw((s) => !s)}><List /></Button>
                <Button variant="ghost" onClick={() => setDialogOpen(true)}><Eye /></Button>
              </div>
            </CardHeader>

            <CardContent>
              {loading ? (
                <div className="py-12 text-center text-sm opacity-60">Fetching activity…</div>
              ) : !activity ? (
                <div className="py-12 text-center text-sm opacity-60">No activity found for the chosen filters. Try clearing filters or changing participants.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* left: visual */}
                  <div className="p-4 rounded-xl border flex flex-col items-start justify-start gap-3">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg p-3 bg-gradient-to-br from-sky-500 to-indigo-600 text-white">
                        <TypeIcon t={activity.type} className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">{activity.activity}</div>
                        <div className="text-xs opacity-60 mt-1">ID: {activity.key}</div>
                      </div>
                    </div>

                    {activity.link ? (
                      <div className="mt-3 w-full">
                        <a href={activity.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 underline text-sm">
                          <LinkIcon className="w-4 h-4" /> Learn more
                        </a>
                      </div>
                    ) : null}

                    <div className="mt-4 w-full">
                      <Button onClick={() => fetchActivity()} className="w-full">Try another</Button>
                    </div>
                  </div>

                  {/* center: metrics */}
                  <div className="p-4 rounded-xl border">
                    <Field title="Type" value={activity.type} />
                    <Field title="Participants" value={activity.participants} />
                    <div className="mb-3">
                      <div className="text-xs opacity-60">Price</div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1"><Progress value={(activity.price ?? 0) * 100} /></div>
                        <div className="text-sm font-medium">{priceLabel(activity.price)}</div>
                      </div>
                    </div>

                    <div>
                      <div className="text-xs opacity-60">Accessibility</div>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex-1"><Progress value={(activity.accessibility ?? 0) * 100} /></div>
                        <div className="text-sm font-medium">{accessibilityLabel(activity.accessibility)}</div>
                      </div>
                    </div>
                  </div>

                  {/* right: explanation / dev */}
                  <div className="p-4 rounded-xl border">
                    <div className="text-sm font-semibold mb-2">Why this suits you</div>
                    <div className="text-sm opacity-80 mb-4">
                      The page maps activity attributes to clear labels so you immediately know whether it's cheap, easy, or social. Adjust filters to get activities matching your needs.
                    </div>

                    <Separator className="my-3" />

                    <div className="text-sm font-semibold mb-2">Dev & metadata</div>
                    <div className="text-xs opacity-60 mb-2">Raw fields from API</div>
                    <div className="text-sm">
                      <div className="mb-2"><span className="opacity-60 text-xs">key</span><div className="font-medium">{activity.key}</div></div>
                      <div className="mb-2"><span className="opacity-60 text-xs">raw price</span><div className="font-medium">{activity.price}</div></div>
                      <div className="mb-2"><span className="opacity-60 text-xs">raw accessibility</span><div className="font-medium">{activity.accessibility}</div></div>
                    </div>
                  </div>
                </div>
              )}

              <AnimatePresence>
                {showRaw && rawResp && (
                  <motion.pre initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 p-4 rounded-md bg-zinc-50 dark:bg-zinc-900 text-xs overflow-auto" style={{ maxHeight: 240 }}>
                    {JSON.stringify(rawResp, null, 2)}
                  </motion.pre>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </section>

        {/* Right-side: compact dev panel */}
        <aside className="lg:col-span-4">
          <Card className="rounded-2xl p-4">
            <CardHeader className="p-0 mb-3">
              <CardTitle className="text-sm">Endpoint & Example</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="text-xs opacity-60 mb-2">Request</div>
              <div className="text-sm break-words mb-3">{urlForFetch}</div>

              <div className="text-xs opacity-60 mb-2">Code snippet</div>
              <pre className="text-xs bg-zinc-50 dark:bg-zinc-900 p-3 rounded-md overflow-auto">{`fetch("${urlForFetch}")
  .then(res => res.json())
  .then(console.log);`}</pre>

              <div className="mt-4 flex gap-2">
                <Button onClick={() => { navigator.clipboard.writeText(urlForFetch); showToast("success", "Endpoint copied"); }} variant="outline"><List /> Copy</Button>
                <Button onClick={() => { setShowRaw((s) => !s); }} variant="ghost">Toggle Raw</Button>
              </div>
            </CardContent>
          </Card>
        </aside>
      </main>

      {/* modal: show activity text large */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl p-0 rounded-2xl">
          <DialogHeader className="p-6">
            <DialogTitle className="text-lg">{activity?.activity ?? "Activity"}</DialogTitle>
          </DialogHeader>

          <div className="p-6">
            <div className="text-sm opacity-70">{activity?.type ? `Type: ${activity.type}` : ""}</div>
            <div className="mt-4 text-lg font-medium">{activity?.activity}</div>
            <div className="mt-4 text-xs opacity-60">Participants: {activity?.participants ?? "—"}</div>
          </div>

          <DialogFooter className="p-4">
            <div className="flex items-center justify-between w-full">
              <div className="text-xs opacity-60">Activity ID: {activity?.key}</div>
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => setDialogOpen(false)}>Close</Button>
                {activity?.link ? <Button onClick={() => window.open(activity.link, "_blank")}>Open Link</Button> : null}
              </div>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
