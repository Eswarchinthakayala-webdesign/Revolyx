// src/pages/PlaceKeanuPage.jsx
import React, { useEffect, useRef, useState, useMemo } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";

// shadcn UI imports (per your project structure)
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

// Icons
import {
  Search,
  ExternalLink,
  Copy,
  Download,
  Code,
  RefreshCw,
  Sun,
  Moon,
  Image as ImageIcon,
  Info,
  Menu,
  ArrowLeft,
  ArrowRight,
  Check,
} from "lucide-react";

/* ===========
  NOTES
  - This component generates a 50-item gallery of placekeanu images using different seeds (via ?r=)
  - Replace generation logic with your real image metadata if you have it.
  - All interactive controls include cursor-pointer classes.
============= */

/* ---------- helpers ---------- */
function copyTextToClipboard(text) {
  if (!text) return Promise.reject(new Error("No text"));
  return navigator.clipboard.writeText(text);
}

function pickRandom(arr, n = 10) {
  if (!Array.isArray(arr)) return [];
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(n, copy.length));
}

/* ---------- gallery generation (50 items) ---------- */
const API_BASE = "https://placekeanu.com";
function makeImageObj(i) {
  // We'll create consistent sizes for variety and seed via ?r to vary image
  const sizes = [
    [1024, 768],
    [900, 600],
    [800, 600],
    [640, 480],
    [600, 400],
    [500, 500],
    [400, 300],
    [300, 200],
  ];
  const size = sizes[i % sizes.length];
  const seed = i + 1;
  // Using query param ?r to try to vary random image per seed
  const url = `${API_BASE}/${size[0]}/${size[1]}?r=${seed}`;
  return {
    id: `pk-${seed}`,
    label: `Keanu ${seed}`,
    width: size[0],
    height: size[1],
    url,
    createdAt: new Date(Date.now() - i * 1000 * 60 * 60 * 24).toISOString(), // varied date for demo
    description: `Random Keanu placeholder image #${seed}`,
  };
}
const ALL_IMAGES = Array.from({ length: 50 }, (_, i) => makeImageObj(i));

/* ---------- component ---------- */
export default function PlaceKeanuPage() {
  // theme (local toggle)
  const [theme, setTheme] = useState("dark"); // default as before
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // gallery state
  const [images] = useState(ALL_IMAGES);
  const [sidebarList, setSidebarList] = useState(() => pickRandom(ALL_IMAGES, 10));
  const [selected, setSelected] = useState(images[0]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [imgError, setImgError] = useState(null);

  // dialog viewer
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  // copying state for animated tick
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef(null);

  // mobile sheet
  const [sheetOpen, setSheetOpen] = useState(false);

  // raw JSON toggle
  const [showRaw, setShowRaw] = useState(false);

  // when selected changes reset errors & preloading
  useEffect(() => {
    setImgError(null);
    setLoadingPreview(true);
    // preload
    const img = new Image();
    img.src = selected?.url || "";
    img.onload = () => {
      setLoadingPreview(false);
      setImgError(null);
    };
    img.onerror = () => {
      setLoadingPreview(false);
      setImgError("Failed to load image (service may be unavailable)");
    };
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [selected]);

  // shuffle sidebar
  function refreshSidebar() {
    setSidebarList(pickRandom(images, 10));
  }

  // open viewer at index
  function openViewerAt(idx) {
    setViewerIndex(idx);
    setViewerOpen(true);
  }

  // change viewer image
  function gotoViewer(delta) {
    const next = (viewerIndex + delta + images.length) % images.length;
    setViewerIndex(next);
    setSelected(images[next]);
  }

  // copy url animation
  async function handleCopyUrl(url) {
    try {
      await copyTextToClipboard(url);
      setCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  // download helper
  function handleDownload(url, filename) {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename || "placekeanu.jpg";
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  // pick 10 random for left list on mount / images change
  useEffect(() => {
    setSidebarList(pickRandom(images, 10));
  }, [images]);

  // keyboard navigation in viewer
  useEffect(() => {
    function onKey(e) {
      if (!viewerOpen) return;
      if (e.key === "ArrowLeft") gotoViewer(-1);
      if (e.key === "ArrowRight") gotoViewer(1);
      if (e.key === "Escape") setViewerOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [viewerOpen, viewerIndex, images]);

  /* ---------- layout ---------- */
  return (
    <div className={clsx("min-h-screen p-4 md:p-6 lg:p-8 pb-10")}>
      <div className="max-w-8xl mx-auto">
        {/* Header */}
        <header className="flex items-center flex-wrap justify-between gap-4 mb-6">
            
          <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
              <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden cursor-pointer"><Menu /></Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[320px]">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ImageIcon /> <div className="font-semibold">Stations</div>
                    </div>
                    <Button variant="ghost" className="cursor-pointer" onClick={refreshSidebar}><RefreshCw /></Button>
                  </div>
                  <Separator />
                  <ScrollArea className="h-[70vh] p-3">
                    {sidebarList.map((s, i) => (
                      <div key={s.id} className="flex items-center gap-3 p-2 border rounded mb-2 cursor-pointer hover:shadow-sm" onClick={() => { setSelected(s); setSheetOpen(false); }}>
                        <img src={s.url} alt={s.label} className="w-16 h-12 object-cover rounded" />
                        <div className="flex-1">
                          <div className="font-medium">{s.label}</div>
                          <div className="text-xs opacity-60">{s.width}×{s.height}</div>
                        </div>
                        <Badge className="backdrop-blur-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs">#{s.id.split("-")[1]}</Badge>
                      </div>
                    ))}
                  </ScrollArea>
                </SheetContent>
              </Sheet>

            </div>
          
            <div>
              <h1 className="text-lg md:text-2xl font-bold">PlaceKeanu Gallery</h1>
              <div className="text-xs opacity-60">50 playful Keanu placeholders — gallery & preview</div>
            </div>
          </div>

          <div className="flex items-center  gap-2">
            <div className="flex items-center gap-2 w-full   border rounded-lg px-2 py-1 ">
              <Input placeholder="Search label (e.g. Keanu 12)" className="w-full sm:w-auto" onChange={() => {}} />
              <Button variant="outline" className="cursor-pointer" onClick={() => refreshSidebar()}><RefreshCw /></Button>
            </div>


          </div>
        </header>

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left sidebar (desktop) */}
          <aside className="hidden lg:block lg:col-span-3">
            <Card className="p-3 rounded-2xl dark:bg-black/80 bg-white/80">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">Random picks <Badge className="ml-2">10</Badge></CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[60vh]">
                  <div className="space-y-3">
                    {sidebarList.map((s, i) => (
                      <motion.div
                        key={s.id}
                        whileHover={{ scale: 1.01 }}
                        className="p-2 rounded-lg border flex items-center gap-3 cursor-pointer hover:shadow-sm"
                        onClick={() => setSelected(s)}
                      >
                        <img src={s.url} alt={s.label} className="w-16 h-12 object-cover rounded" />
                        <div className="flex-1">
                          <div className="font-medium">{s.label}</div>
                          <div className="text-xs opacity-60">{s.width}×{s.height}</div>
                        </div>
                        <Badge className="backdrop-blur-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs">#{s.id.split("-")[1]}</Badge>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>

                <div className="mt-3 flex gap-2">
                  <Button className="cursor-pointer" variant="outline" onClick={refreshSidebar}><RefreshCw /> Refresh</Button>
                  <Button className="cursor-pointer" variant="ghost" onClick={() => setSidebarList(pickRandom(images, 10))}>Shuffle</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-4 p-3 rounded-2xl dark:bg-black/80 bg-white/80">
              <div className="font-semibold flex items-center gap-2"><Info /> Notes</div>
              <div className="text-xs opacity-70 mt-2">Click thumbnails to preview. Click the center image to open a larger viewer. Use copy/download actions on the right.</div>
            </Card>
          </aside>

          {/* Center preview */}
          <section className="lg:col-span-6 space-y-4">
            <Card className="p-3 rounded-2xl dark:bg-black/80 bg-white/80">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold flex items-center gap-2"><ImageIcon /> Preview</div>
                  <div className="text-xs opacity-60">{selected ? `${selected.label} • ${selected.width}×${selected.height}` : "Select an image"}</div>
                </div>

                <div className="flex items-center gap-2">
                  <Button className="cursor-pointer" variant="outline" onClick={() => setSelected(pickRandom(images, 1)[0])}><SparkleButtonIcon /></Button>
                  <Button className="cursor-pointer" variant="ghost" onClick={() => openViewerAt(images.indexOf(selected))}>Open</Button>
                </div>
              </div>

              <Separator className="my-3" />

              <div className="rounded-lg border overflow-hidden bg-white dark:bg-neutral-800">
                {loadingPreview ? (
                  <div className="h-72 flex items-center justify-center text-sm opacity-60"><LoaderPlaceholder /></div>
                ) : imgError ? (
                  <div className="h-72 flex items-center justify-center text-sm text-red-400">{imgError}</div>
                ) : selected ? (
                  <div className="relative group">
                    <img
                      src={selected.url}
                      alt={selected.label}
                      className="w-full object-cover max-h-[520px] cursor-pointer"
                      onClick={() => openViewerAt(images.indexOf(selected))}
                    />
                    <div className="absolute left-4 bottom-4 flex items-center gap-2 transition">
                      <Badge className="backdrop-blur-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">{selected.width}×{selected.height}</Badge>
                      <Badge className="backdrop-blur-md bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-300 text-xs">#{selected.id.split("-")[1]}</Badge>
                    </div>
                  </div>
                ) : (
                  <div className="h-72 flex items-center justify-center text-sm opacity-60">No preview</div>
                )}
              </div>

              {/* details & code */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div>
                  <div className="text-xs opacity-60">Details</div>
                  <div className="mt-2 text-sm">
                    <div className="font-medium">{selected?.label || "—"}</div>
                    <div className="text-xs opacity-60">{selected?.description}</div>
                    <div className="text-xs opacity-60 mt-2">Added: {selected ? new Date(selected.createdAt).toLocaleString() : "—"}</div>
                  </div>
                </div>

                <div>
                  <div className="text-xs opacity-60">Usage</div>
                  <pre className="text-xs font-mono p-2 overflow-x-auto rounded bg-slate-100 dark:bg-neutral-800 mt-2 break-words">
                    {selected ? `<img src="${selected.url}" width="${selected.width}" height="${selected.height}" alt="${selected.label}" />` : "—"}
                  </pre>
                </div>
              </div>
            </Card>

            {/* gallery strip (quick browse) */}
            <Card className="p-3 rounded-2xl dark:bg-black/80 bg-white/80">
              <CardHeader>
                <CardTitle>Browse gallery</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[120px]">
                  <div className="flex gap-2 items-center py-2">
                    {images.map((img, i) => (
                      <div key={img.id} className="w-[100px] flex-shrink-0 cursor-pointer" onClick={() => setSelected(img)}>
                        <img src={img.url} alt={img.label} className={clsx("rounded border hover:shadow-md transition", img.id === selected.id ? "border border-zinc-300/90" : "")} style={{ width: 100, height: 70, objectFit: "cover" }} />
                        <div className="text-xs mt-1 text-center opacity-70">{img.label}</div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </section>

          {/* Right actions & raw */}
          <aside className="lg:col-span-3 space-y-4">
            <Card className="p-3 rounded-2xl dark:bg-black/80 bg-white/80">
              <div className="flex items-center justify-between">
                <div className="font-semibold flex items-center gap-2">Quick Actions</div>
                <div className="text-xs opacity-60">Share / download</div>
              </div>

              <Separator className="my-3" />

              <div className="flex flex-col gap-2">
        

                <Button variant="outline" className="cursor-pointer" onClick={() => handleDownload(selected?.url, `${selected?.label || "placekeanu"}.jpg`)}>
                  <Download className="mr-2" /> Download
                </Button>

                <Button asChild className="cursor-pointer" variant="outline">
                  <a href={selected?.url || "#"} target="_blank" rel="noreferrer">
                    <ExternalLink className="mr-2" /> Open in new tab
                  </a>
                </Button>

                <Button className="cursor-pointer" variant="outline" onClick={() => setShowRaw(s => !s)}>
                  <Code className="mr-2" /> {showRaw ? "Hide JSON" : "Show JSON"}
                </Button>
              </div>
            </Card>

            <AnimatePresence>
              {showRaw && selected && (
                <motion.pre initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="p-3 rounded border text-xs overflow-auto" style={{ maxHeight: 240 }}>
                  {JSON.stringify(selected, null, 2)}
                </motion.pre>
              )}
            </AnimatePresence>

            <Card className="p-3 rounded-2xl dark:bg-black/80 bg-white/80">
              <div className="font-semibold mb-2">Summary</div>
              <div className="text-sm opacity-70">Selected: <span className="font-medium">{selected?.label}</span></div>
              <div className="text-xs opacity-60 mt-2">Size: {selected?.width}×{selected?.height}</div>
              <div className="text-xs opacity-60">ID: {selected?.id}</div>
            </Card>
          </aside>
        </div>

       
      </div>

      {/* Viewer Dialog */}
      <Dialog open={viewerOpen} onOpenChange={setViewerOpen}>
        <DialogContent className="max-w-4xl w-full p-3 dark:bg-black/80 bg-white rounded-2xl overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center mt-6 justify-between w-full">
              <div className="flex items-center gap-3">
                <ImageIcon /> <span>{images[viewerIndex]?.label}</span>
                <Badge className="backdrop-blur-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 ml-2">#{images[viewerIndex]?.id.split("-")[1]}</Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button className="cursor-pointer" variant="ghost" onClick={() => gotoViewer(-1)}><ArrowLeft /></Button>
                <Button className="cursor-pointer" variant="ghost" onClick={() => gotoViewer(1)}><ArrowRight /></Button>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className=" p-4 flex items-center justify-center" style={{ minHeight: 420 }}>
            <img src={images[viewerIndex]?.url} alt={images[viewerIndex]?.label} className="max-h-[80vh] max-w-full object-contain" />
          </div>

          <DialogFooter>
            <div className="flex items-center gap-2">
              <Button className="cursor-pointer" variant="outline" onClick={() => handleCopyUrl(images[viewerIndex]?.url)}>{copied ? <Check /> : <Copy />} Copy</Button>
              <Button className="cursor-pointer" variant="secondary" onClick={() => handleDownload(images[viewerIndex]?.url, `${images[viewerIndex]?.label}.jpg`)}><Download /> Download</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ---------- small inline components ---------- */
function LoaderPlaceholder() {
  return (
    <div className="flex items-center gap-2">
      <div className="w-6 h-6 border-2 border-dashed rounded-full animate-spin border-slate-300 dark:border-neutral-700"></div>
      <div className="opacity-70">Loading preview…</div>
    </div>
  );
}

function SparkleButtonIcon() {
  // small adaptive icon button (uses ImageIcon)
  return <ImageIcon className="w-4 h-4" />;
}
