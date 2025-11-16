// src/pages/RandomUserPage.jsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
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
  Map,
  Download,
  Eye,
  X,
  Menu,
  ExternalLink,
  Image as ImageIcon,
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

/* Syntax highlighter */
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

/* Theme provider */
import { useTheme } from "@/components/theme-provider";

const ENDPOINT = "https://randomuser.me/api/";

// Format JSON
const pretty = (obj) => JSON.stringify(obj, null, 2);

/* MAIN PAGE */
export default function RandomUserPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [imageOpen, setImageOpen] = useState(false);

  async function fetchUser() {
    try {
      setLoading(true);
      const res = await fetch(ENDPOINT);
      const json = await res.json();
      setData(json?.results?.[0]);
      toast.success("Random user loaded");
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch user");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUser();
  }, []);

  /* Quick Actions */
  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText(ENDPOINT);
    toast.success("Endpoint copied!");
  };

  const handleCopyJSON = () => {
    navigator.clipboard.writeText(pretty(data));
    toast.success("JSON copied!");
  };

  const handleDownloadJSON = () => {
    const blob = new Blob([pretty(data)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "random-user.json";
    a.click();
    URL.revokeObjectURL(a.href);
    toast.success("Downloaded JSON");
  };

  /* Extracted fields */
  const fullName = data ? `${data.name.title} ${data.name.first} ${data.name.last}` : "—";
  const location = data
    ? `${data.location.city}, ${data.location.state}, ${data.location.country}`
    : "—";

  const avatar = data?.picture?.large ?? "";
  const dob = data?.dob?.date ? new Date(data.dob.date).toLocaleDateString() : "—";

  /* UI */
  return (
    <div
      className={clsx(
        "min-h-screen p-6 max-w-8xl mx-auto",
        isDark ? "bg-black" : "bg-white"
      )}
    >
      <Toaster richColors />

      {/* HEADER */}
      <header className="mb-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1
            className={clsx(
              "text-3xl md:text-4xl font-extrabold",
              isDark ? "text-zinc-50" : "text-zinc-900"
            )}
          >
            Revolyx · Random User Generator
          </h1>
          <p className={clsx("text-sm mt-1", isDark ? "text-zinc-300" : "text-zinc-600")}>
            Realistic fake users for testing, design samples, profiles & more.
          </p>
        </div>

        {/* Mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" className="md:hidden">
              <Menu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] p-4">
            <div className="flex items-center justify-between mb-4">
              <div className={clsx("text-lg font-semibold")}>Actions</div>
              <Button variant="ghost" onClick={() => setSheetOpen(false)}>
                <X />
              </Button>
            </div>

            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start" onClick={fetchUser}>
                <RefreshCw /> Refresh
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={handleCopyEndpoint}>
                <Copy /> Copy Endpoint
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={handleCopyJSON}>
                <Copy /> Copy JSON
              </Button>
              <Button variant="outline" className="w-full justify-start" onClick={handleDownloadJSON}>
                <Download /> Download JSON
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </header>

      {/* MAIN LAYOUT */}
      <main className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* LEFT SIDEBAR */}
        <aside
          className={clsx(
            "hidden lg:block h-[78vh] w-full p-4 rounded-xl border",
            isDark ? "bg-black/40 border-zinc-800" : "bg-white/70 border-zinc-200"
          )}
        >
          <h3 className={clsx("text-sm font-semibold", isDark ? "text-zinc-100" : "text-zinc-800")}>
            Quick Actions
          </h3>
          <p className={clsx("text-xs mb-3", isDark ? "text-zinc-300" : "text-zinc-600")}>
            Useful controls for the API
          </p>

          <div className="space-y-3">
            <Button variant="outline" className="w-full justify-start" onClick={fetchUser}>
              <RefreshCw /> Refresh User
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={handleCopyEndpoint}>
              <Copy /> Copy Endpoint
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={handleCopyJSON}>
              <Copy /> Copy JSON
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={handleDownloadJSON}>
              <Download /> Download JSON
            </Button>
          </div>

          <Separator className="my-4" />

          {/* Quick user meta */}
          <div className="space-y-3">
            <Card
              className={clsx(
                "p-3 border rounded-xl",
                isDark ? "bg-black/20 border-zinc-800" : "bg-white/60 border-zinc-200"
              )}
            >
              <div className="text-xs opacity-70">User</div>
              <div className="mt-1 font-medium">{fullName}</div>
            </Card>
            <Card
              className={clsx(
                "p-3 border rounded-xl",
                isDark ? "bg-black/20 border-zinc-800" : "bg-white/60 border-zinc-200"
              )}
            >
              <div className="text-xs opacity-70">Email</div>
              <div className="mt-1 font-medium">{data?.email ?? "—"}</div>
            </Card>
          </div>
        </aside>

        {/* RIGHT MAIN CONTENT */}
        <section className="lg:col-span-3 space-y-6">
          {/* USER PREVIEW CARD */}
          <Card
            className={clsx(
              "rounded-2xl border overflow-hidden",
              isDark ? "bg-black/40 border-zinc-800" : "bg-white/80 border-zinc-200"
            )}
          >
            <CardHeader
              className={clsx(
                "p-5 border-b",
                isDark ? "bg-black/60 border-zinc-800" : "bg-white/80 border-zinc-200"
              )}
            >
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className={clsx(isDark ? "text-zinc-100" : "text-zinc-900")}>
                    User Profile
                  </CardTitle>
                  <p className={clsx("text-xs mt-1", isDark ? "text-zinc-400" : "text-zinc-600")}>
                    Realistic generated user — always random.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={fetchUser} disabled={loading}>
                    <RefreshCw className={loading ? "animate-spin" : ""} />
                  </Button>

                  <Button variant="outline" onClick={() => setImageOpen(true)}>
                    <ImageIcon />
                  </Button>

                  <Button variant="outline" onClick={() => setShowRaw(!showRaw)}>
                    <Eye /> {showRaw ? "Hide Raw" : "Show Raw"}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6">
              {!data ? (
                <div className="text-center py-6 opacity-50">Loading…</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* COLUMN 1 — Profile */}
                  <div
                    className={clsx(
                      "rounded-xl p-5 border flex flex-col items-center",
                      isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200"
                    )}
                  >
                    <img
                      src={avatar}
                      alt="User"
                      className="w-32 h-32 rounded-full border border-zinc-300 dark:border-zinc-700 shadow-md cursor-pointer"
                      onClick={() => setImageOpen(true)}
                    />

                    <div className="mt-3 text-center">
                      <h2 className={clsx("font-semibold", isDark ? "text-zinc-100" : "text-zinc-900")}>
                        {fullName}
                      </h2>
                      <div className={clsx("text-sm", isDark ? "text-zinc-300" : "text-zinc-600")}>
                        {data.gender}
                      </div>
                    </div>
                  </div>

                  {/* COLUMN 2 — Contact */}
                  <div
                    className={clsx(
                      "rounded-xl p-5 border space-y-4",
                      isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <div className="text-sm">{data.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <div className="text-sm">{data.phone}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <div className="text-sm">{dob}</div>
                    </div>
                  </div>

                  {/* COLUMN 3 — Location */}
                  <div
                    className={clsx(
                      "rounded-xl p-5 border space-y-3",
                      isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <div className="text-sm">{location}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <div className="text-sm">{data.nat}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* RAW JSON */}
              <AnimatePresence>
                {showRaw && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={clsx(
                      "mt-6 rounded-xl p-4 border",
                      isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200"
                    )}
                  >
                    <SyntaxHighlighter
                      
                      wrapLongLines wrapLines language="json" style={isDark ? oneDark : oneLight}
                    >
                      {pretty(data)}
                    </SyntaxHighlighter>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {/* RESPONSE JSON CARD */}
          <Card
            className={clsx(
              "rounded-2xl border",
              isDark ? "bg-black/40 border-zinc-800" : "bg-white/80 border-zinc-200"
            )}
          >
            <CardHeader className="flex items-center justify-between">
              <CardTitle className={clsx(isDark ? "text-zinc-100" : "text-zinc-900")}>
                Response JSON
              </CardTitle>

              <div className="flex items-center gap-2">
                <Button variant="ghost" onClick={handleCopyJSON}>
                  <Copy />
                </Button>
                <Button variant="ghost" onClick={handleDownloadJSON}>
                  <Download />
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="rounded-md overflow-auto border p-2 max-h-[420px]">
                <SyntaxHighlighter
                  language="json"
                  style={isDark ? oneDark : oneLight}
                  
                >
                  {pretty(data)}
                </SyntaxHighlighter>
              </div>
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
            <Button variant="outline" onClick={() => setImageOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
