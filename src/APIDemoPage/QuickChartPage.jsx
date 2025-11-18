// src/pages/QuickChartPage.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  ImageIcon,
  ExternalLink,
  Download,
  Loader2,
  Code,
  Copy,
  BarChart2,
  Palette,
  Settings,
  FileText,
  Zap,
  X
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useTheme } from "@/components/theme-provider";
import { showToast } from "../lib/ToastHelper";

/* ---------- QuickChart endpoint ---------- */
const QUICKCHART_ENDPOINT = "https://quickchart.io/chart";

/* ---------- Default chart presets ---------- */
const PRESETS = [
  {
    id: "default-bar",
    name: "Default Bar",
    description: "Simple bar chart (Votes)",
    config: {
      type: "bar",
      data: {
        labels: ["Red", "Blue", "Yellow", "Green", "Purple"],
        datasets: [
          { label: "Votes", data: [12, 19, 3, 5, 2], backgroundColor: undefined }
        ]
      },
      options: {
        plugins: { legend: { display: true } },
        responsive: true,
        maintainAspectRatio: false
      }
    },
    width: 800,
    height: 400,
    format: "png",
  },
  {
    id: "line-sales",
    name: "Sales Line",
    description: "Monthly sales trend",
    config: {
      type: "line",
      data: {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          { label: "Revenue", data: [1200, 1900, 3000, 5000, 2300, 4200], fill: false }
        ]
      },
      options: { plugins: { legend: { display: true } }, responsive: true }
    },
    width: 900,
    height: 380,
    format: "png",
  },
  {
    id: "pie-market",
    name: "Market Share Pie",
    description: "Market share example",
    config: {
      type: "pie",
      data: {
        labels: ["Chrome", "Safari", "Firefox", "Edge"],
        datasets: [{ data: [62, 19, 10, 9] }]
      },
      options: { plugins: { legend: { position: "right" } } }
    },
    width: 700,
    height: 420,
    format: "png",
  }
];

/* ---------- Helpers ---------- */
function prettyJSON(obj) {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

/* Build the request body expected by QuickChart */
function buildRequestBody({ chartConfig, width, height, format, backgroundColor }) {
  const payload = {
    chart: chartConfig,
    width: width || 800,
    height: height || 400,
    format: format || "png",
  };
  if (backgroundColor) payload.backgroundColor = backgroundColor;
  return payload;
}

/* ---------- Page Component ---------- */
export default function QuickChartPage() {
  const { theme } = useTheme?.() ?? { theme: "system" };
  const isDark =
    theme === "dark" ||
    (theme === "system" &&
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  const [presetId, setPresetId] = useState(PRESETS[0].id);
  const [chartConfigText, setChartConfigText] = useState(JSON.stringify(PRESETS[0].config, null, 2));
  const [width, setWidth] = useState(PRESETS[0].width);
  const [height, setHeight] = useState(PRESETS[0].height);
  const [format, setFormat] = useState(PRESETS[0].format);
  const [backgroundColor, setBackgroundColor] = useState("");
  const [loading, setLoading] = useState(false);

  const [chartBlobUrl, setChartBlobUrl] = useState(null);
  const [rawRequest, setRawRequest] = useState(null);
  const [rawResponseInfo, setRawResponseInfo] = useState(null);
  const [showRaw, setShowRaw] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const editorRef = useRef(null);

  useEffect(() => {
    // load default preset on mount (Neem equivalent)
    applyPreset(PRESETS[0].id);
    // cleanup blob on unmount
    return () => {
      if (chartBlobUrl) URL.revokeObjectURL(chartBlobUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function applyPreset(id) {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    setPresetId(p.id);
    setChartConfigText(JSON.stringify(p.config, null, 2));
    setWidth(p.width || 800);
    setHeight(p.height || 400);
    setFormat(p.format || "png");
    setRawRequest(null);
    setRawResponseInfo(null);
    setChartBlobUrl(null);
  }

  async function generateChart(e) {
    e?.preventDefault?.();
    // parse config safely
    let parsedConfig;
    try {
      parsedConfig = JSON.parse(chartConfigText);
    } catch (err) {
      showToast("error", "Chart config JSON is invalid. Fix syntax and try again.");
      return;
    }

    const bodyPayload = buildRequestBody({
      chartConfig: parsedConfig,
      width: Number(width) || 800,
      height: Number(height) || 400,
      format: format || "png",
      backgroundColor: backgroundColor || undefined,
    });

    setRawRequest(bodyPayload);
    setLoading(true);
    setShowRaw(false);

    // Clear previous blob URL
    if (chartBlobUrl) {
      try { URL.revokeObjectURL(chartBlobUrl); } catch {}
      setChartBlobUrl(null);
    }

    try {
      const res = await fetch(QUICKCHART_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      // QuickChart often returns binary image in response body directly
      if (!res.ok) {
        const txt = await res.text();
        setRawResponseInfo({ status: res.status, statusText: res.statusText, body: txt });
        showToast("error", `QuickChart returned ${res.status}`);
        setLoading(false);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setChartBlobUrl(url);
      setRawResponseInfo({ status: res.status, statusText: res.statusText, size: blob.size, type: blob.type });
      setDialogOpen(true);
    } catch (err) {
      console.error(err);
      showToast("error", "Failed to generate chart");
    } finally {
      setLoading(false);
    }
  }

  function downloadChart() {
    if (!chartBlobUrl) return showToast("info", "No chart to download");
    const a = document.createElement("a");
    a.href = chartBlobUrl;
    a.download = `chart.${format || "png"}`;
    a.click();
  }

  function copyEndpoint() {
    navigator.clipboard.writeText(QUICKCHART_ENDPOINT);
    showToast("success", "Endpoint copied");
  }

  /* small UI components inline to keep file self-contained */
  function Section({ title, subtitle, children }) {
    return (
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold">{title}</div>
            {subtitle && <div className="text-xs opacity-60">{subtitle}</div>}
          </div>
        </div>
        <div className="mt-3">{children}</div>
      </div>
    );
  }

  return (
    <div className={clsx("min-h-screen p-6 max-w-8xl mx-auto")}>
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold">QuickChart Studio</h1>
          <p className="mt-1 text-sm opacity-70">Generate Chart images from Chart.js configs — preview, tweak, download.</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Preset selector + small search-like control */}
          <div className={clsx("flex items-center gap-2 rounded-lg px-3 py-1", isDark ? "bg-black/60 border border-zinc-800" : "bg-white border border-zinc-200")}>
            <BarChart2 className="opacity-60" />
            <select
              value={presetId}
              onChange={(e) => applyPreset(e.target.value)}
              className="bg-transparent outline-none border-0"
            >
              {PRESETS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <Button variant="outline" className="ml-3" onClick={() => applyPreset(PRESETS[0].id)}>Reset</Button>
          </div>
        </div>
      </header>

      {/* Layout */}
      <main className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main left: Editor + Preview */}
        <section className="lg:col-span-9 space-y-4">
          <Card className={clsx("rounded-2xl overflow-hidden border", isDark ? "bg-black/40 border-zinc-800" : "bg-white/90 border-zinc-200")}>
            <div className={clsx("p-5 flex items-center justify-between", isDark ? "bg-black/60 border-b border-zinc-800" : "bg-white/90 border-b border-zinc-200")}>
              <div>
                <div className="text-lg font-semibold">Chart Generator</div>
                <div className="text-xs opacity-60">Edit Chart.js config (JSON) and generate a PNG image.</div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={generateChart} className="px-3">
                  {loading ? <Loader2 className="animate-spin" /> : <Zap />} Generate
                </Button>
                <Button variant="ghost" onClick={() => setShowRaw((s) => !s)}><Code /> Raw</Button>
                <Button variant="outline" onClick={() => { copyEndpoint(); }}><Copy /> Copy Endpoint</Button>
              </div>
            </div>

            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Left: Editor */}
                <div className={clsx("md:col-span-2 p-4 rounded-xl border", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                  <Section title="Chart Config (Chart.js JSON)">
                    <div className="text-xs opacity-60 mb-2">Paste or edit a Chart.js configuration object. The top-level object should contain type/data/options as Chart.js expects.</div>
                    <textarea
                      ref={editorRef}
                      value={chartConfigText}
                      onChange={(e) => setChartConfigText(e.target.value)}
                      rows={22}
                      className={clsx("w-full min-h-[320px] p-3 text-sm rounded-md font-mono outline-none resize-vertical", isDark ? "bg-zinc-900 text-zinc-200" : "bg-zinc-50 text-zinc-900")}
                    />
                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <div>
                        <div className="text-xs opacity-60">Width (px)</div>
                        <Input value={width} onChange={(e) => setWidth(Number(e.target.value))} className="mt-1" />
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Height (px)</div>
                        <Input value={height} onChange={(e) => setHeight(Number(e.target.value))} className="mt-1" />
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Format</div>
                        <select value={format} onChange={(e) => setFormat(e.target.value)} className="mt-1 w-full bg-transparent">
                          <option value="png">png</option>
                          <option value="svg">svg</option>
                          <option value="webp">webp</option>
                        </select>
                      </div>
                      <div>
                        <div className="text-xs opacity-60">Background</div>
                        <Input placeholder="#ffffff or transparent" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="mt-1" />
                      </div>
                    </div>
                  </Section>
                </div>

                {/* Right: Preview + metadata */}
                <div className={clsx("p-4 rounded-xl border flex flex-col items-stretch", isDark ? "bg-black/20 border-zinc-800" : "bg-white/70 border-zinc-200")}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-sm font-semibold">Preview</div>
                    <div className="text-xs opacity-60">Generated image</div>
                  </div>

                  <div className="flex-1 w-full rounded-md bg-zinc-100 dark:bg-zinc-900 overflow-hidden flex items-center justify-center" style={{ minHeight: 220 }}>
                    {loading ? (
                      <div className="text-center">
                        <Loader2 className="animate-spin mx-auto" />
                        <div className="text-xs opacity-60 mt-2">Generating chart...</div>
                      </div>
                    ) : chartBlobUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={chartBlobUrl} alt="Generated chart" className="w-full h-full object-contain" />
                    ) : (
                      <div className="text-xs opacity-60">No chart generated yet — click Generate.</div>
                    )}
                  </div>

                  <div className="mt-3 space-y-2">
                    <Button variant="outline" className="w-full" onClick={() => downloadChart()}><Download /> Download</Button>
                    <Button variant="ghost" className="w-full" onClick={() => setDialogOpen(true)}><ImageIcon /> Open in dialog</Button>

                    <div className="mt-2 text-xs opacity-60">
                      {rawResponseInfo ? (
                        <>
                          <div>Status: {rawResponseInfo.status} {rawResponseInfo.statusText}</div>
                          {rawResponseInfo.size && <div>Size: {Math.round(rawResponseInfo.size / 1024)} KB</div>}
                          <div>Type: {rawResponseInfo.type || "image/png"}</div>
                        </>
                      ) : <div>Response info will appear here.</div>}
                    </div>
                  </div>
                </div>
              </div>

              {/* Raw JSON toggle */}
              <AnimatePresence>
                {showRaw && rawRequest && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} className={clsx("mt-4 p-3 rounded-md border", isDark ? "bg-black/30 border-zinc-800" : "bg-white/60 border-zinc-200")}>
                    <div className="text-xs opacity-60 mb-2">Request payload</div>
                    <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 240 }}>{prettyJSON(rawRequest)}</pre>
                    <Separator className="my-3" />
                    <div className="text-xs opacity-60 mb-2">Response info</div>
                    <pre className={clsx("text-xs overflow-auto", isDark ? "text-zinc-200" : "text-zinc-900")} style={{ maxHeight: 160 }}>{prettyJSON(rawResponseInfo)}</pre>
                  </motion.div>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>
        </section>

        {/* Right: Developer & Presets panel */}
        <aside className={clsx("lg:col-span-3 rounded-2xl p-4 space-y-4 h-fit", isDark ? "bg-black/40 border border-zinc-800" : "bg-white/90 border border-zinc-200")}>
          <div>
            <div className="text-sm font-semibold mb-2">Presets</div>
            <div className="text-xs opacity-60 mb-3">Quick examples — click to load into editor.</div>
            <div className="space-y-2">
              {PRESETS.map((p) => (
                <Button key={p.id} variant="outline" className="w-full justify-start" onClick={() => applyPresetFromPanel(p)}>{p.name}</Button>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Developer</div>
            <div className="text-xs opacity-60">Endpoint examples & debugging</div>
            <div className="mt-2 space-y-2 grid grid-cols-1 gap-2">
              <Button variant="outline" onClick={() => copyEndpoint()}><Copy /> Copy Endpoint</Button>
              <Button variant="outline" onClick={() => { if (chartBlobUrl) downloadChart(); else showToast("info", "No chart yet"); }}><Download /> Download PNG</Button>
              <Button variant="outline" onClick={() => setShowRaw((s) => !s)}><Code /> Toggle Raw</Button>
            </div>
          </div>

          <Separator />

          <div>
            <div className="text-sm font-semibold mb-2">Quick tips</div>
            <div className="text-xs opacity-60">
              • Use Chart.js v3-compatible config. <br />
              • For transparent backgrounds leave "backgroundColor" empty. <br />
              • Large size → increase width & height. <br />
              • Use format "svg" for vector output.
            </div>
          </div>
        </aside>
      </main>

      {/* Preview dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className={clsx("max-w-4xl w-full p-0 rounded-2xl overflow-hidden", isDark ? "bg-black/90" : "bg-white")}>
          <DialogHeader>
            <DialogTitle>Chart Preview</DialogTitle>
          </DialogHeader>
          <div style={{ height: "70vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
            {chartBlobUrl ? <img src={chartBlobUrl} alt="chart preview" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} /> : <div className="text-xs opacity-60">No chart generated yet</div>}
          </div>
          <DialogFooter className="flex justify-between items-center p-4 border-t">
            <div className="text-xs opacity-60">Generated by QuickChart</div>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setDialogOpen(false)}><X /></Button>
              <Button variant="outline" onClick={() => downloadChart()}><Download /> Download</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  /* ---------- local helpers used in render scope ---------- */
  function applyPresetFromPanel(preset) {
    setPresetId(preset.id);
    setChartConfigText(JSON.stringify(preset.config, null, 2));
    setWidth(preset.width || 800);
    setHeight(preset.height || 400);
    setFormat(preset.format || "png");
    setBackgroundColor("");
    setChartBlobUrl(null);
    setRawRequest(null);
    setRawResponseInfo(null);
    showToast("success", `Loaded preset: ${preset.name}`);
  }

  function applyPreset(id) {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    applyPresetFromPanel(p);
  }
}
