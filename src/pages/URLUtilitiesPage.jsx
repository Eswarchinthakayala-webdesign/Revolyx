// src/pages/URLUtilitiesPage.jsx
"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { Toaster } from "sonner";
import {
  Loader2,
  Copy,
  Download,
  Layers,
  Settings,
  Link as LinkIcon,
  Scissors,
  DollarSign,
  Key,
  Hash,
  Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useTheme } from "../components/theme-provider";
import { showToast } from "../lib/ToastHelper";

const TOOLS = {
  SHORTENER: "shortener",
  UTM: "utm",
  ENCODER: "encoder",
  MULTILINK: "multilink",
  DEEPLINK: "deeplink",
};

const STORAGE_KEYS = {
  SHORTENER_MAP: "urlutils_shortener_map_v1",
  MULTILINKS: "urlutils_multilinks_v1",
};

function uid(len = 6) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// safe url join
function joinUrl(base, path) {
  try {
    const b = new URL(base);
    if (path.startsWith("/")) {
      b.pathname = path;
    } else {
      b.pathname = (b.pathname.endsWith("/") ? b.pathname : b.pathname + "/") + path;
    }
    return b.toString();
  } catch {
    return base + (base.endsWith("/") ? "" : "/") + path;
  }
}

export default function URLUtilitiesPage() {
  const { theme } = useTheme();
  const isDark =
    theme === "dark" ||
    (theme === "system" && typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)")?.matches);

  // --- URL sync ---
  const [selectedTool, setSelectedTool] = useState(TOOLS.SHORTENER);

  useEffect(() => {
    // initialize tool from ?tool= param
    try {
      const params = new URLSearchParams(window.location.search);
      const t = params.get("tool");
      if (t && Object.values(TOOLS).includes(t)) setSelectedTool(t);
    } catch {}
  }, []);

  const setToolAndUrl = useCallback((tool) => {
    setSelectedTool(tool);
    try {
      const pathname = window.location.pathname;
      const search = new URLSearchParams(window.location.search);
      if (tool) search.set("tool", tool);
      else search.delete("tool");
      const newUrl = `${pathname}${search.toString() ? `?${search.toString()}` : ""}`;
      window.history.replaceState(null, "", newUrl);
    } catch (e) {
      // ignore
    }
  }, []);

  // --- Shared utilities ---
  const copyToClipboard = useCallback(async (text) => {
    try {
      await navigator.clipboard.writeText(text || "");
      showToast("success", "Copied to clipboard");
    } catch {
      showToast("error", "Copy failed");
    }
  }, []);

  const downloadText = useCallback((filename, text) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  // -------------------------
  // URL Shortener (local)
  // -------------------------
  const [shortBase, setShortBase] = useState(window?.location?.origin || "https://example.com");
  const [shortPath, setShortPath] = useState("");
  const [shortTarget, setShortTarget] = useState("");
  const [shortMap, setShortMap] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.SHORTENER_MAP);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.SHORTENER_MAP, JSON.stringify(shortMap));
    } catch {}
  }, [shortMap]);

  const createShortlink = useCallback(() => {
    if (!shortTarget || !shortTarget.trim()) {
      showToast("error", "Enter a target URL");
      return;
    }
    // normalize
    let target = shortTarget.trim();
    try {
      // if it's not valid URL, attempt to add protocol
      new URL(target);
    } catch {
      target = "https://" + target;
    }

    const slug = shortPath?.trim() || uid(6);
    const shortUrl = joinUrl(shortBase, slug);
    const newMap = { ...shortMap, [slug]: { target, createdAt: Date.now() } };
    setShortMap(newMap);
    setShortPath(slug);
    showToast("success", `Short link created: ${shortUrl}`);
  }, [shortTarget, shortPath, shortBase, shortMap]);

  const deleteShort = useCallback((slug) => {
    const m = { ...shortMap };
    delete m[slug];
    setShortMap(m);
    showToast("success", "Deleted");
  }, [shortMap]);

  const resolveShortPreview = useMemo(() => {
    if (!shortPath) return "";
    return joinUrl(shortBase, shortPath);
  }, [shortBase, shortPath]);

  // -------------------------
  // UTM Generator
  // -------------------------
  const [utmBase, setUtmBase] = useState("");
  const [utmSource, setUtmSource] = useState("");
  const [utmMedium, setUtmMedium] = useState("");
  const [utmCampaign, setUtmCampaign] = useState("");
  const [utmTerm, setUtmTerm] = useState("");
  const [utmContent, setUtmContent] = useState("");

  const buildUtmUrl = useCallback(() => {
    if (!utmBase) return "";
    let url;
    try {
      url = new URL(utmBase);
    } catch {
      // try add https
      try {
        url = new URL("https://" + utmBase);
      } catch {
        return "";
      }
    }
    const params = url.searchParams;
    if (utmSource) params.set("utm_source", utmSource);
    if (utmMedium) params.set("utm_medium", utmMedium);
    if (utmCampaign) params.set("utm_campaign", utmCampaign);
    if (utmTerm) params.set("utm_term", utmTerm);
    if (utmContent) params.set("utm_content", utmContent);
    url.search = params.toString();
    return url.toString();
  }, [utmBase, utmSource, utmMedium, utmCampaign, utmTerm, utmContent]);

  // -------------------------
  // Encoder / Decoder
  // -------------------------
  const [encoderInput, setEncoderInput] = useState("");
  const [encoderMode, setEncoderMode] = useState("encode"); // encode | decode
  const encoderOutput = useMemo(() => {
    try {
      if (encoderMode === "encode") return encodeURIComponent(encoderInput || "");
      return decodeURIComponent(encoderInput || "");
    } catch {
      return "Invalid input for decoding";
    }
  }, [encoderInput, encoderMode]);

  // -------------------------
  // Multi-link Bio Creator
  // -------------------------
  const [bioTitle, setBioTitle] = useState("My Links");
  const [bioLinks, setBioLinks] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.MULTILINKS);
      return raw ? JSON.parse(raw) : [{ id: uid(6), title: "Example", url: "https://example.com" }];
    } catch {
      return [{ id: uid(6), title: "Example", url: "https://example.com" }];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.MULTILINKS, JSON.stringify(bioLinks));
    } catch {}
  }, [bioLinks]);

  const addBioLink = useCallback(() => {
    setBioLinks((s) => [...s, { id: uid(6), title: "New link", url: "https://" }]);
  }, []);

  const updateBioLink = useCallback((id, patch) => {
    setBioLinks((s) => s.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }, []);

  const removeBioLink = useCallback((id) => {
    setBioLinks((s) => s.filter((l) => l.id !== id));
  }, []);

  const moveBioLink = useCallback((id, dir) => {
    setBioLinks((s) => {
      const idx = s.findIndex((x) => x.id === id);
      if (idx === -1) return s;
      const newArr = [...s];
      const swapIdx = dir === "up" ? idx - 1 : idx + 1;
      if (swapIdx < 0 || swapIdx >= newArr.length) return s;
      [newArr[idx], newArr[swapIdx]] = [newArr[swapIdx], newArr[idx]];
      return newArr;
    });
  }, []);

  const exportBioHtml = useCallback(() => {
    const titleEsc = (s) => (s || "").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const itemsHtml = bioLinks
      .map((l) => `<a class="bio-link" href="${l.url}" target="_blank" rel="noopener noreferrer">${titleEsc(l.title)}</a>`)
      .join("\n");
    const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${titleEsc(bioTitle)}</title>
<style>
  body{font-family:system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial; background:#fff; color:#111; display:flex; align-items:center; justify-content:center; min-height:100vh; padding:24px}
  .card{max-width:420px;width:100%; text-align:center}
  .avatar{width:96px;height:96px;border-radius:50%;background:#eee;margin:0 auto 12px}
  h1{margin:0 0 14px;font-size:20px}
  .bio-link{display:block;padding:12px 16px;margin:8px 0;background:#111;color:#fff;text-decoration:none;border-radius:8px}
</style>
</head>
<body>
  <div class="card">
    <div class="avatar"></div>
    <h1>${titleEsc(bioTitle)}</h1>
    ${itemsHtml}
  </div>
</body>
</html>`;
    downloadText(`bio-${Date.now()}.html`, html);
  }, [bioLinks, bioTitle, downloadText]);

  // -------------------------
  // Deep Link Generator
  // -------------------------
  const [deepScheme, setDeepScheme] = useState("myapp://");
  const [deepPath, setDeepPath] = useState("product/123");
  const [deepFallback, setDeepFallback] = useState("https://example.com/product/123");
  const buildDeepLink = useMemo(() => {
    try {
      const url = joinUrl(deepScheme, deepPath);
      return url;
    } catch {
      return deepScheme + deepPath;
    }
  }, [deepScheme, deepPath]);

  const testDeepLink = useCallback(() => {
    // Attempt to open deep link - browser restrictions apply. We cannot reliably detect success.
    const link = buildDeepLink;
    const w = window.open(link, "_blank");
    if (w) {
      showToast("success", `Attempted to open: ${link}`);
      w.close();
    } else {
      // fallback to redirecting parent to fallback URL
      window.location.href = deepFallback;
    }
  }, [buildDeepLink, deepFallback]);

  // -------------------------
  // UI helpers
  // -------------------------
  const [dialogOpen, setDialogOpen] = useState(false);

  // --- result area: we will render different content per tool ---
  const renderResultArea = () => {
    switch (selectedTool) {
      case TOOLS.SHORTENER:
        return (
          <>
            <div className="mb-3 flex items-center justify-between">
              <div className="text-sm">Shortener</div>
              <div className="text-xs opacity-70">Local-only (client) • Maps stored in localStorage</div>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div className="flex gap-2">
                <Input value={shortBase} onChange={(e) => setShortBase(e.target.value)} placeholder="Short base (origin)" />
                <Input value={shortPath} onChange={(e) => setShortPath(e.target.value)} placeholder="Custom slug (optional)" />
              </div>

              <div className="flex gap-2">
                <Input value={shortTarget} onChange={(e) => setShortTarget(e.target.value)} placeholder="Target URL (https://...)" />
                <Button onClick={createShortlink} className="flex-shrink-0">
                  <Scissors className="w-4 h-4 mr-2" /> Create
                </Button>
              </div>

              {shortPath && (
                <div className="flex items-center gap-2">
                  <div className="flex-1 text-sm break-all">{resolveShortPreview}</div>
                  <Button size="sm" variant="ghost" onClick={() => copyToClipboard(resolveShortPreview)}><Copy className="w-4 h-4" /></Button>
                </div>
              )}

              <Separator />

              <div className="text-xs opacity-70">Existing short links</div>
              <div className="space-y-2 max-h-56 overflow-auto">
                {Object.keys(shortMap).length === 0 && <div className="text-sm opacity-60">No links yet</div>}
                {Object.entries(shortMap).map(([slug, meta]) => (
                  <div key={slug} className="flex items-center justify-between gap-2 border rounded p-2">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{joinUrl(shortBase, slug)}</div>
                      <div className="text-xs opacity-70 truncate">{meta.target}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard(joinUrl(shortBase, slug))}><Copy className="w-4 h-4" /></Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteShort(slug)}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        );

      case TOOLS.UTM:
        return (
          <>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm">UTM Parameter Generator</div>
              <div className="text-xs opacity-70">Build robust campaign URLs</div>
            </div>
            <div className="space-y-3">
              <Input value={utmBase} onChange={(e) => setUtmBase(e.target.value)} placeholder="Base URL (https://...)" />
              <div className="grid grid-cols-2 gap-2">
                <Input value={utmSource} onChange={(e) => setUtmSource(e.target.value)} placeholder="utm_source" />
                <Input value={utmMedium} onChange={(e) => setUtmMedium(e.target.value)} placeholder="utm_medium" />
                <Input value={utmCampaign} onChange={(e) => setUtmCampaign(e.target.value)} placeholder="utm_campaign" />
                <Input value={utmTerm} onChange={(e) => setUtmTerm(e.target.value)} placeholder="utm_term (optional)" />
                <Input value={utmContent} onChange={(e) => setUtmContent(e.target.value)} placeholder="utm_content (optional)" />
              </div>

              <div className="flex items-center gap-2">
                <Input value={buildUtmUrl() || ""} readOnly />
                <Button onClick={() => copyToClipboard(buildUtmUrl())}><Copy className="w-4 h-4" /></Button>
                <Button onClick={() => downloadText(`utm-${Date.now()}.txt`, buildUtmUrl() || "")}><Download className="w-4 h-4" /></Button>
              </div>
            </div>
          </>
        );

      case TOOLS.ENCODER:
        return (
          <>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm">URL Encoder / Decoder</div>
              <div className="text-xs opacity-70">Switch between raw and encoded forms</div>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2">
                <Select value={encoderMode} onValueChange={(v) => setEncoderMode(v)}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="encode">Encode</SelectItem>
                    <SelectItem value="decode">Decode</SelectItem>
                  </SelectContent>
                </Select>
                <Input value={encoderInput} onChange={(e) => setEncoderInput(e.target.value)} placeholder={encoderMode === "encode" ? "Raw text or URL" : "Encoded string"} />
              </div>

              <div>
                <Label className="text-xs">Result</Label>
                <Textarea value={encoderOutput} readOnly className="min-h-[80px]" />
                <div className="flex gap-2 mt-2">
                  <Button onClick={() => copyToClipboard(encoderOutput)}><Copy className="w-4 h-4" /></Button>
                  <Button onClick={() => downloadText(`encoder-${Date.now()}.txt`, encoderOutput)}><Download className="w-4 h-4" /></Button>
                </div>
              </div>
            </div>
          </>
        );

      case TOOLS.MULTILINK:
        return (
          <>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm">Multi-link Bio Page Creator</div>
              <div className="text-xs opacity-70">Create a Linktree-like page and export HTML</div>
            </div>

            <div className="space-y-3">
              <Input value={bioTitle} onChange={(e) => setBioTitle(e.target.value)} placeholder="Page title" />
              <div className="space-y-2">
                {bioLinks.map((l, i) => (
                  <div key={l.id} className="flex gap-2 items-start">
                    <div className="flex-1">
                      <Input value={l.title} onChange={(e) => updateBioLink(l.id, { title: e.target.value })} placeholder="Link title" />
                      <Input value={l.url} onChange={(e) => updateBioLink(l.id, { url: e.target.value })} placeholder="https://..." className="mt-1" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <Button size="sm" onClick={() => moveBioLink(l.id, "up")}>↑</Button>
                      <Button size="sm" onClick={() => moveBioLink(l.id, "down")}>↓</Button>
                      <Button size="sm" variant="destructive" onClick={() => removeBioLink(l.id)}>Del</Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 mt-2">
                <Button onClick={addBioLink}>Add link</Button>
                <Button variant="outline" onClick={() => copyToClipboard(JSON.stringify(bioLinks))}>Copy JSON</Button>
                <Button onClick={exportBioHtml}>Export HTML</Button>
              </div>

              <Separator />
              <div>
                <div className="text-xs opacity-70 mb-2">Preview</div>
                <div className="border rounded p-4">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                    <div className="text-lg font-medium">{bioTitle}</div>
                    <div className="w-full max-w-md">
                      {bioLinks.map((l) => (
                        <a key={l.id} className="block text-center py-3 my-2 rounded bg-slate-900 text-white" href={l.url} target="_blank" rel="noreferrer">
                          {l.title}
                        </a>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        );

      case TOOLS.DEEPLINK:
        return (
          <>
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm">Deep Link Generator</div>
              <div className="text-xs opacity-70">iOS/Android custom schemes & fallback</div>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <Input value={deepScheme} onChange={(e) => setDeepScheme(e.target.value)} placeholder="scheme (myapp://)" />
                <Input value={deepPath} onChange={(e) => setDeepPath(e.target.value)} placeholder="path (product/123)" />
              </div>

              <Input value={deepFallback} onChange={(e) => setDeepFallback(e.target.value)} placeholder="fallback web URL" />

              <div className="flex items-center gap-2">
                <Input value={buildDeepLink} readOnly />
                <Button onClick={() => copyToClipboard(buildDeepLink)}><Copy className="w-4 h-4" /></Button>
                <Button onClick={testDeepLink}>Test</Button>
              </div>

              <div className="text-xs opacity-70">Note: Most browsers restrict opening custom schemes from JS. "Test" will attempt to open a new window; if blocked, fallback will be navigated.</div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen max-w-7xl mx-auto py-8 px-4 md:px-8">
      <Toaster richColors />
      <header className="mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold leading-tight flex items-center gap-3">
              <Layers className="w-6 h-6 text-cyan-600" /> URL Utilities
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Shortener • UTM generator • Encoder • Multi-link bio • Deep links</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="inline-flex items-center gap-3 bg-gray-50 dark:bg-zinc-900 px-3 py-2 rounded-lg border">
              <div className="flex flex-col">
                <span className="text-[11px] text-slate-500">Local mode</span>
                <span className="text-xs font-medium">Client-only tools</span>
              </div>
            </div>
            <Button variant="secondary" onClick={() => setDialogOpen(true)}>
              <Settings className="w-4 h-4 mr-2" /> Info
            </Button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left controls */}
        <aside className="lg:col-span-3">
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Tools</span>
                <Badge>{selectedTool === TOOLS.MULTILINK ? "Export" : "Utility"}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label className="text-xs">Select tool</Label>
                <Select value={selectedTool} onValueChange={(v) => setToolAndUrl(v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TOOLS.SHORTENER}><LinkIcon className="w-4 h-4 mr-2 inline" /> URL Shortener</SelectItem>
                    <SelectItem value={TOOLS.UTM}><DollarSign className="w-4 h-4 mr-2 inline" /> UTM Generator</SelectItem>
                    <SelectItem value={TOOLS.ENCODER}><Key className="w-4 h-4 mr-2 inline" /> Encoder / Decoder</SelectItem>
                    <SelectItem value={TOOLS.MULTILINK}><Hash className="w-4 h-4 mr-2 inline" /> Multi-link Bio</SelectItem>
                    <SelectItem value={TOOLS.DEEPLINK}><Eye className="w-4 h-4 mr-2 inline" /> Deep Link Builder</SelectItem>
                  </SelectContent>
                </Select>

                <Separator />

                <div className="text-xs opacity-70">Tip: Selecting a tool updates the URL query param <code>?tool=</code> so you can deep-link to a specific utility.</div>

                <Separator />

                <div className="flex gap-2">
                  <Button className="flex-1" onClick={() => copyToClipboard(window.location.href)}>Copy page URL</Button>
                  <Button variant="outline" onClick={() => { setDialogOpen(true); }}>Help</Button>
                </div>

                <div className="text-xs opacity-70">All tools are client-side. Shortener and Multi-link data are stored in <code>localStorage</code>.</div>
              </div>
            </CardContent>
          </Card>
        </aside>

        {/* Center content / result */}
        <main className="lg:col-span-6 space-y-6">
          <Card className="shadow-md">
            <CardHeader className="flex items-center justify-between">
              <CardTitle>{(() => {
                switch (selectedTool) {
                  case TOOLS.SHORTENER: return "URL Shortener";
                  case TOOLS.UTM: return "UTM Generator";
                  case TOOLS.ENCODER: return "Encoder / Decoder";
                  case TOOLS.MULTILINK: return "Multi-link Bio Creator";
                  case TOOLS.DEEPLINK: return "Deep Link Generator";
                  default: return "Utility";
                }
              })()}</CardTitle>

              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" onClick={() => copyToClipboard(window.location.href)}><Copy className="w-4 h-4" /></Button>
                <Button size="sm" variant="ghost" onClick={() => downloadText(`url-utils-${Date.now()}.txt`, JSON.stringify({ tool: selectedTool }))}><Download className="w-4 h-4" /></Button>
              </div>
            </CardHeader>

            <CardContent>
              <div className="rounded-lg border p-4 bg-white/50 dark:bg-zinc-900/50 min-h-[260px]">
                {renderResultArea()}
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="text-xs opacity-70">Output & preview area. Use actions to copy or export.</div>
              </div>
            </CardContent>
          </Card>
        </main>

        {/* Right column: details / quick actions */}
        <aside className="lg:col-span-3">
          <div className="sticky top-24 space-y-4">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Quick Actions</span>
                  <Settings className="w-4 h-4" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2">
                  <Button size="sm" onClick={() => {
                    // backup short map
                    copyToClipboard(JSON.stringify(shortMap));
                    showToast("success", "Shortener map copied");
                  }}>Backup shortener map</Button>

                  <Button size="sm" onClick={() => {
                    localStorage.removeItem(STORAGE_KEYS.SHORTENER_MAP);
                    setShortMap({});
                    showToast("success", "Shortener map cleared");
                  }}>Clear shortener map</Button>

                  <Button size="sm" onClick={() => {
                    localStorage.removeItem(STORAGE_KEYS.MULTILINKS);
                    setBioLinks([{ id: uid(6), title: "Example", url: "https://example.com" }]);
                    showToast("success", "Multilink reset");
                  }}>Reset multilink</Button>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm opacity-80">
                  These utilities are intentionally client-only for quick workflows. If you need a server-backed shortener (custom domain, tracking, analytics), I can add API integration (example: bit.ly, your own backend).
                </div>
              </CardContent>
            </Card>
          </div>
        </aside>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>URL Utilities — Notes</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm opacity-80">
              These tools run fully in the browser. Shortener & multi-link data are stored in localStorage and will persist for this browser/profile. For production shorteners and deep linking you'll want a server, custom domain, and analytics.
            </p>
            <div className="mt-4 flex gap-2 justify-end">
              <Button onClick={() => setDialogOpen(false)}>Close</Button>
            </div>
          </div>
          <DialogFooter />
        </DialogContent>
      </Dialog>
    </div>
  );
}
