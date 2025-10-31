// src/pages/FlowchartPage.jsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import mermaid from "mermaid";
import { motion } from "framer-motion";
import { Toaster, toast } from "sonner";
import { toPng } from "html-to-image";  
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
  Copy,
  Loader2,
  Send,
  Download,
  Search as SearchIcon,
  List,
  Palette as PaletteIcon,
  Menu as MenuIcon,
  X,
  Zap,
  Heart as HeartIcon,
  Filter as FilterIcon,
} from "lucide-react";

/* shadcn ui - import individual components */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import FlowchartSidebar from "../components/FlowchartSidebar";
import { useTheme } from "../components/theme-provider";
import { FlowchartShowcase } from "../components/FlowchartShowcase";
import { FlowchartGrid } from "../components/FlowchartGrid";

/* local UI helpers (if you have them) removed for portability */

/* -------------------- COLOR THEMES -------------------- */
const COLOR_THEMES = {
  zinc: ["#71717a", "#a1a1aa", "#27272a", "#52525b", "#3f3f46"],
  gray: ["#9ca3af", "#4b5563", "#6b7280", "#374151", "#1f2937"],
  slate: ["#64748b", "#94a3b8", "#334155", "#475569", "#1e293b"],
  stone: ["#78716c", "#a8a29e", "#57534e", "#44403c", "#292524"],
  orange: ["#f97316", "#fb923c", "#ea580c", "#fdba74", "#ffedd5"],
  green: ["#22c55e", "#4ade80", "#16a34a", "#86efac", "#dcfce7"],
  emerald: ["#10b981", "#34d399", "#059669", "#6ee7b7", "#a7f3d0"],
  teal: ["#14b8a6", "#2dd4bf", "#0d9488", "#5eead4", "#99f6e4"],
  cyan: ["#06b6d4", "#22d3ee", "#0891b2", "#67e8f9", "#a5f3fc"],
  sky: ["#0ea5e9", "#38bdf8", "#0284c7", "#7dd3fc", "#bae6fd"],
  blue: ["#3b82f6", "#60a5fa", "#2563eb", "#93c5fd", "#bfdbfe"],
  indigo: ["#6366f1", "#818cf8", "#4f46e5", "#a5b4fc", "#c7d2fe"],
  violet: ["#8b5cf6", "#a78bfa", "#7c3aed", "#c4b5fd", "#ddd6fe"],
  purple: ["#9333ea", "#a855f7", "#7e22ce", "#d8b4fe", "#f3e8ff"],
  pink: ["#ec4899", "#f472b6", "#db2777", "#f9a8d4", "#fce7f3"],
  rose: ["#f43f5e", "#fb7185", "#e11d48", "#fecdd3", "#ffe4e6"],
  red: ["#ef4444", "#f87171", "#dc2626", "#fca5a5", "#fee2e2"],
  yellow: ["#eab308", "#facc15", "#ca8a04", "#fde047", "#fef9c3"],
  amber: ["#f59e0b", "#fbbf24", "#d97706", "#fcd34d", "#fef3c7"],
};

/* -------------------- 30+ BUILT-IN FLOWCHARTS --------------------
   Each entry includes name, category, description and mermaid code.
   (All use 'flowchart TD' format.)
*/
const BUILT_IN_FLOWCHARTS = [
  {
    id: "f-login",
    name: "Login Flow",
    category: "Auth",
    description: "User submits credentials, validate and route.",
    code:
`flowchart TD
Start([Start]) --> Input[Enter credentials]
Input --> Validate{Valid?}
Validate -->|Yes| Success[Go to Dashboard]
Validate -->|No| Error[Show error message]
Error --> Input
Success --> End([End])`,
  },
  {
    id: "f-register",
    name: "Registration",
    category: "Auth",
    description: "Sign up flow with email verification.",
    code:
`flowchart TD
A[Start] --> B[User enters details]
B --> C[Create account]
C --> D[Send verification email]
D --> E{Email confirmed?}
E -->|Yes| F[Activate account]
E -->|No| G[Resend email]
F --> H[End]`,
  },
  {
    id: "f-checkout",
    name: "E-commerce Checkout",
    category: "Commerce",
    description: "Cart -> shipping -> payment -> confirmation.",
    code:
`flowchart TD
Cart[Cart] --> Shipping[Shipping details]
Shipping --> Payment[Payment details]
Payment --> Review[Review order]
Review --> Confirm{Confirm?}
Confirm -->|Yes| Place[Place order]
Place --> Confirmation[Show confirmation]
Confirm -->|No| Cancel[Cancel]
Confirmation --> End`,
  },
  {
    id: "f-payment",
    name: "Payment Processing",
    category: "Commerce",
    description: "Validate cards, process payment, notify.",
    code:
`flowchart TD
A[Start] --> B[Collect card info]
B --> C{Card valid?}
C -->|No| D[Show error]
C -->|Yes| E[Send to payment gateway]
E --> F{Payment success?}
F -->|Yes| G[Success page]
F -->|No| H[Failed page]`,
  },
  {
    id: "f-api",
    name: "API Request Cycle",
    category: "System",
    description: "Client -> API -> backend -> DB -> response",
    code:
`flowchart TD
U[User action] --> FE[Frontend sends request]
FE --> API[API Gateway]
API --> Service[Service logic]
Service --> DB[Database]
DB --> Service
Service --> API
API --> FE[Return response]`,
  },
  {
    id: "f-crud",
    name: "CRUD Operation",
    category: "System",
    description: "Create, Read, Update, Delete decision flow",
    code:
`flowchart TD
Start --> Choose{Operation?}
Choose -->|Create| Create[Insert record]
Choose -->|Read| Read[Fetch record]
Choose -->|Update| Update[Modify record]
Choose -->|Delete| Delete[Remove record]
Create --> Done[Done]
Read --> Done
Update --> Done
Delete --> Done`,
  },
  {
    id: "f-cache",
    name: "Cache Lookup",
    category: "System",
    description: "Check cache, fallback to DB, set cache.",
    code:
`flowchart TD
Request --> Cache[Check cache]
Cache -->|Hit| Return[Return cached]
Cache -->|Miss| DB[Query DB]
DB --> Return
DB --> CacheSet[Set cache]`,
  },
  {
    id: "f-pipeline",
    name: "Data Pipeline",
    category: "Data",
    description: "Ingest -> Process -> Store -> Serve",
    code:
`flowchart TD
Ingest --> Transform[Transform data]
Transform --> Validate{Valid?}
Validate -->|Yes| Store[Store]
Validate -->|No| Reject[Reject]
Store --> Serve[Serve to consumers]`,
  },
  {
    id: "f-etl",
    name: "ETL Job",
    category: "Data",
    description: "Extract, transform, load batch job",
    code:
`flowchart TD
Start --> Extract[Extract data]
Extract --> Transform[Transform]
Transform --> Load[Load into warehouse]
Load --> Verify[Verify]
Verify --> End`,
  },
  {
    id: "f-ci",
    name: "CI Pipeline",
    category: "DevOps",
    description: "Commit -> Build -> Test -> Deploy",
    code:
`flowchart TD
Commit --> Build[Build artifacts]
Build --> Test[Run tests]
Test -->|Pass| Deploy[Deploy to staging]
Test -->|Fail| Notify[Notify devs]
Deploy --> Monitor`,
  },
  {
    id: "f-cd",
    name: "CD Pipeline",
    category: "DevOps",
    description: "Deploy promotion pipeline",
    code:
`flowchart TD
Staging --> Smoke[Smoke tests]
Smoke -->|Pass| Prod[Promote to prod]
Smoke -->|Fail| Rollback[Rollback]`,
  },
  {
    id: "f-queue",
    name: "Queue Worker",
    category: "System",
    description: "Consume -> process -> ack/requeue",
    code:
`flowchart TD
Producer --> Queue
Worker --> Consume[Consume message]
Consume --> Process[Process]
Process -->|Success| Ack[Acknowledge]
Process -->|Fail| Requeue[Requeue or dead-letter]`,
  },
  {
    id: "f-authz",
    name: "Authorization",
    category: "Security",
    description: "Check tokens & permissions",
    code:
`flowchart TD
Request --> CheckAuth[Check token]
CheckAuth -->|Invalid| Deny[403]
CheckAuth -->|Valid| CheckPerms{Has perms?}
CheckPerms -->|Yes| Allow[Allow]
CheckPerms -->|No| Deny`,
  },
  {
    id: "f-2fa",
    name: "2FA Flow",
    category: "Security",
    description: "OTP verification flow",
    code:
`flowchart TD
Login --> OTP[Send OTP]
OTP --> Verify{Correct?}
Verify -->|Yes| Grant[Grant access]
Verify -->|No| Retry[Retry or block]`,
  },
  {
    id: "f-bug",
    name: "Bug Triage",
    category: "Process",
    description: "Report -> Triage -> Fix -> Release",
    code:
`flowchart TD
Report --> Triage[Assess severity]
Triage -->|High| Hotfix[Hotfix]
Triage -->|Low| Backlog[Backlog]
Hotfix --> Release
Backlog --> Plan`,
  },
  {
    id: "f-support",
    name: "Support Ticket",
    category: "Process",
    description: "Create -> assign -> resolve",
    code:
`flowchart TD
Customer --> Create[Create ticket]
Create --> Assign[Assign team]
Assign --> Work[Work on ticket]
Work --> Resolve[Resolved]`,
  },
  {
    id: "f-email",
    name: "Email Send",
    category: "Integration",
    description: "Compose -> send -> bounce handling",
    code:
`flowchart TD
Compose --> Send[Send email]
Send -->|Delivered| Done
Send -->|Bounced| Bounce[Handle bounce]`,
  },
  {
    id: "f-webhook",
    name: "Webhook Delivery",
    category: "Integration",
    description: "Deliver -> retry -> dead-letter",
    code:
`flowchart TD
Event --> Deliver[POST to endpoint]
Deliver -->|200| Done
Deliver -->|non-200| Retry[Retry with backoff]
Retry --> Dead[Dead-letter if exhausted]`,
  },
  {
    id: "f-rate",
    name: "Rate Limiting",
    category: "System",
    description: "Allow/deny requests based on quota",
    code:
`flowchart TD
Request --> CheckQuota{Within quota?}
CheckQuota -->|Yes| Forward
CheckQuota -->|No| Throttle[Return 429]`,
  },
  {
    id: "f-rollback",
    name: "Deployment Rollback",
    category: "DevOps",
    description: "Failure detection and rollback steps",
    code:
`flowchart TD
Deploy --> Monitor[Monitor metrics]
Monitor -->|Alert| Investigate
Investigate -->|Severe| Rollback
Rollback --> Notify`,
  },
  {
    id: "f-state",
    name: "State Machine",
    category: "System",
    description: "Basic state transitions",
    code:
`flowchart TD
Idle --> Start --> Running --> Pause --> Running
Running --> Stop --> Idle`,
  },
  {
    id: "f-search",
    name: "Search Flow",
    category: "UX",
    description: "Query parsing, autocomplete, results",
    code:
`flowchart TD
User --> Query[Type query]
Query --> Autocomplete{Suggest?}
Autocomplete -->|Yes| ShowSuggestions
Query --> SearchBackend
SearchBackend --> Results[Show results]`,
  },
  {
    id: "f-rating",
    name: "Feedback Loop",
    category: "UX",
    description: "Collect feedback and action",
    code:
`flowchart TD
Prompt --> Submit[User submits]
Submit --> Analyze[Analyze sentiment]
Analyze --> Action[Improve product]`,
  },
  {
    id: "f-ml",
    name: "ML Training",
    category: "Data",
    description: "Data prepare -> train -> eval -> deploy",
    code:
`flowchart TD
Collect --> Prepare[Prepare dataset]
Prepare --> Train[Train model]
Train --> Eval[Evaluate]
Eval -->|OK| Deploy
Eval -->|Not OK| Tune`,
  },
  {
    id: "f-cache-warm",
    name: "Warm Cache",
    category: "Data",
    description: "Precompute frequently used entries",
    code:
`flowchart TD
Start --> Identify[Identify hot keys]
Identify --> Precompute
Precompute --> LoadCache`,
  },
  {
    id: "f-sso",
    name: "SSO Flow",
    category: "Auth",
    description: "Redirect to provider and callback",
    code:
`flowchart TD
App --> Redirect[Redirect to SSO]
Redirect --> Provider
Provider --> Callback[Return to app]
Callback --> Session[Create session]`,
  },
  {
    id: "f-webapp",
    name: "Page Load",
    category: "UX",
    description: "Initial assets & hydrate client",
    code:
`flowchart TD
Browser --> Request
Request --> Server[Send HTML]
Server --> Browser[Browser receives]
Browser --> Hydrate`,
  },
  {
    id: "f-queue-backoff",
    name: "Retry Backoff",
    category: "System",
    description: "Retries with exponential backoff",
    code:
`flowchart TD
Try --> Fail{Failed?}
Fail -->|Yes| Backoff[Wait & retry]
Backoff --> Try
Try -->|Success| Done`,
  },
  {
    id: "f-logout",
    name: "Logout Flow",
    category: "Auth",
    description: "Clear session and redirect",
    code:
`flowchart TD
ClickLogout --> Clear[Clear session]
Clear --> Redirect[Go to homepage]`,
  },
  {
    id: "f-batch",
    name: "Batch Job",
    category: "Data",
    description: "Batch schedule/run/notify",
    code:
`flowchart TD
Schedule --> StartBatch[Start job]
StartBatch --> Process
Process --> Report
Report --> Notify`,
  },
  {
    id: "f-webperf",
    name: "Perf Optim",
    category: "Ops",
    description: "Detect & optimize hotspots",
    code:
`flowchart TD
Detect --> Profile[Profile]
Profile --> Optimize
Optimize --> Deploy`,
  },
];

/* -------------------- Mermaid Initialization -------------------- */
mermaid.initialize({
  startOnLoad: false,
  theme: "default",
  securityLevel: "loose",
  fontFamily: "Inter, system-ui, sans-serif",
});

/* -------------------- Utilities -------------------- */
function groupAlphabetically(list) {
  const map = {};
  list.forEach((it) => {
    const letter = (it.name && it.name[0]) ? it.name[0].toUpperCase() : "#";
    if (!map[letter]) map[letter] = [];
    map[letter].push(it);
  });
  // sort letters
  return Object.fromEntries(Object.entries(map).sort(([a], [b]) => a.localeCompare(b)));
}

function injectThemeIntoMermaid(code, colors = ["#3b82f6"]) {
  const [primary] = colors;
  const initBlock = `%%{init: { "themeVariables": { "primaryColor": "${primary}", "edgeLabelBackground": "#fff", "lineColor": "${primary}" } } }%%\n`;
  return initBlock + code;
}
async function downloadPng() {
  if (!chartRef.current) return toast.error("No chart to download");

  const svgElement = chartRef.current.querySelector("svg");
  if (!svgElement) return toast.error("SVG not rendered yet");

  const svgData = new XMLSerializer().serializeToString(svgElement);
  const svgBlob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    canvas.width = img.width * 2;
    canvas.height = img.height * 2;
    const ctx = canvas.getContext("2d");
    ctx.scale(2, 2);
    ctx.drawImage(img, 0, 0);
    URL.revokeObjectURL(url);

    canvas.toBlob((blob) => {
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${selected.name.replace(/\s+/g, "_")}.png`;
      a.click();
      toast.success("PNG downloaded");
    }, "image/png");
  };
  img.onerror = () => toast.error("Failed to generate PNG");
  img.src = url;
}


/* -------------------- The Page Component -------------------- */
export default function FlowchartPage() {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false); // hidden by default
  const [sortMode, setSortMode] = useState("asc");
  const [paletteName, setPaletteName] = useState("blue");
  const [subPaletteIdx, setSubPaletteIdx] = useState(0);
  const [palette, setPalette] = useState(COLOR_THEMES.blue.slice());
  const [selectedId, setSelectedId] = useState(BUILT_IN_FLOWCHARTS[0].id);
  const [favorites, setFavorites] = useState(new Set());
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [themes, setThemes] = useState("default");
  const chartRef = useRef(null);
  const searchRef = useRef(null);
  
   const {theme}=useTheme()
     const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
  useEffect(() => {
    // keep palette in sync with paletteName
    setPalette(COLOR_THEMES[paletteName] ? COLOR_THEMES[paletteName].slice() : COLOR_THEMES.blue.slice());
  }, [paletteName]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let arr = BUILT_IN_FLOWCHARTS.filter((d) => {
      if (!q) return true;
      return d.name.toLowerCase().includes(q) || d.description.toLowerCase().includes(q) || (d.category || "").toLowerCase().includes(q);
    });
    arr = arr.sort((a, b) => (sortMode === "asc" ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)));
    return arr;
  }, [query, sortMode]);

  const grouped = useMemo(() => groupAlphabetically(filtered), [filtered]);

  const selected = useMemo(() => BUILT_IN_FLOWCHARTS.find(d => d.id === selectedId) || BUILT_IN_FLOWCHARTS[0], [selectedId]);

  // Render mermaid into chartRef whenever selected, palette or theme changes
// Render mermaid into chartRef whenever selected, palette or theme changes
useEffect(() => {
  if (!selected || !chartRef.current) return;

  // pick a single color subset
  const activeColor = palette[subPaletteIdx % palette.length];
  const themedCode = injectThemeIntoMermaid(selected.code, [activeColor]);

  const container = chartRef.current;
  container.innerHTML = "";

  try {
    const id = "mermaid-" + Math.random().toString(36).slice(2, 9);
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      theme: isDark ? "dark" : "default",
    });

    mermaid.render(id, themedCode).then(({ svg }) => {
      container.innerHTML = svg;
    }).catch((err) => {
      console.error("Mermaid render error:", err);
      container.innerHTML = `<pre style="color:var(--muted)">${err?.str || err?.message || "Mermaid render error"}</pre>`;
      toast.error("Failed to render chart");
    });
  } catch (e) {
    console.error("Mermaid exception:", e);
    toast.error("Invalid Mermaid syntax");
  }
}, [selected, subPaletteIdx, theme]);


  function selectChart(id) {
    setSelectedId(id);
    // smooth scroll to top (like spinner page)
    window.scrollTo({ top: 0, behavior: "smooth" });
    toast.success("Selected: " + (BUILT_IN_FLOWCHARTS.find(c => c.id === id)?.name || id));
  }

  function toggleFavorite(id) {
    setFavorites(prev => {
      const copy = new Set(prev);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  }

  function copySource() {
    const code = selected.code;
    navigator.clipboard.writeText(code).then(() => toast.success("Source copied to clipboard"));
  }

  function downloadSvg() {
    if (!chartRef.current) return toast.error("Nothing to download");
    const svg = chartRef.current.innerHTML;
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selected.name.replace(/\s+/g, "_")}.svg`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("SVG downloaded");
  }


  // AI generation calling Gemini — optional and requires a valid env var in Vite
  async function generateWithAI(prompt) {
    const key = import.meta.env.VITE_GEMINI_API_KEY;
    if (!key) {
      toast.error("Missing Gemini API key (VITE_GEMINI_API_KEY)");
      return;
    }
    if (!prompt.trim()) {
      toast.error("Enter a prompt");
      return;
    }
    setAiLoading(true);
    try {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${key}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `Generate valid Mermaid flowchart code in "flowchart TD" format for this prompt. Return only pure mermaid code (no backticks):\n\n${prompt}`
                }
              ]
            }
          ]
        })
      });
      const data = await res.json();
      let text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
      text = text.replace(/```mermaid/gi, "").replace(/```/g, "").trim();
      if (!text.startsWith("flowchart")) {
        toast.error("AI did not return valid mermaid code");
        console.log("AI response:", text);
      } else {
        // create a new temporary built-in (or set as selected AI)
        const newId = "ai-" + Math.random().toString(36).slice(2, 9);
        const aiEntry = { id: newId, name: "AI: " + prompt.slice(0, 30), category: "AI", description: prompt, code: text };
        BUILT_IN_FLOWCHARTS.unshift(aiEntry); // add to front
        setSelectedId(newId);
        toast.success("AI flowchart generated");
        setDialogOpen(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("AI generation failed");
    } finally {
      setAiLoading(false);
    }
  }

  // Palette editor actions
  function setThemePalette(key) {
    if (COLOR_THEMES[key]) {
      setPaletteName(key);
      setPalette(COLOR_THEMES[key].slice());
      toast.success(`Palette ${key} applied`);
    }
  }

  function addColor(hex) {
    if (!/^#([0-9A-F]{3}){1,2}$/i.test(hex)) {
      toast.error("Invalid color");
      return;
    }
    setPalette(p => [...p, hex]);
    toast.success("Color added");
  }

  function removeColor(idx) {
    setPalette(p => p.filter((_, i) => i !== idx));
  }

  function updateColor(idx, value) {
    setPalette(p => p.map((c, i) => i === idx ? value : c));
  }

  const snapshotPNG = async () => {
    const node = document.querySelector(".snapshot");
    if (!node) {
      toast.error("Snapshot target not found");
      return;
    }

    try {
      const dataUrl = await toPng(node, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: isDark?"#000":"#fff",
        quality: 1,
      });
      const link = document.createElement("a");
      link.download = `snapshot-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
      toast.success("Snapshot saved!");
    } catch (error) {
      console.error("Snapshot failed:", error);
      toast.error("Failed to capture snapshot");
    }}


  /* Layout: follow spinnersPage: main container max-w-8xl, grid with 4 cols on lg:
     left: sidebar (col 1)
     middle+right: main preview + gallery (col-span-3)
     inside main: large preview + controls + source code
  */

  return (
    <div className="min-h-screen overflow-hidden max-w-8xl mx-auto py-8 px-4 md:px-8">
      <Toaster richColors />
      <div className="">
        {/* Header */}
        <header className="flex flex-row flex-wrap justify-between items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold flex items-center gap-3">Revolyx Flowchart</h1>
            <p className="text-sm opacity-80 mt-1">Browse, preview and customize flowcharts .</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 border rounded-md px-2 py-1 bg-white dark:bg-zinc-900">
              <SearchIcon className="w-4 h-4 opacity-60" />
              <Input
                ref={searchRef}
                placeholder="Search flowcharts (click to show suggestions)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                className="border-0 shadow-none"
              />
            </div>

            <Select value={paletteName} onValueChange={(v) => setThemePalette(v)}>
              <SelectTrigger className="w-44">
                <SelectValue placeholder="Palette" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(COLOR_THEMES).map(k => (
                  <SelectItem key={k} value={k}>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-4 rounded-sm" style={{ background: `linear-gradient(90deg, ${COLOR_THEMES[k].join(",")})` }} />
                      <div className="text-sm">{k}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => setDialogOpen(true)}><SparklesIconFallback /> Generate with AI</Button>

          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left column: sidebar */}
          <aside className="lg:col-span-1 max-h-screen">
       <FlowchartSidebar
        filtered={filtered}
        grouped={grouped}
        sortMode={sortMode}
        setSortMode={setSortMode}
        query={query}
        setQuery={setQuery}
        showSuggestions={showSuggestions}
        setShowSuggestions={setShowSuggestions}
        selectChart={selectChart}
        selectedId={selectedId}
      />
          </aside>

          {/* Middle + Right: preview and gallery */}
          <section className="lg:col-span-3 space-y-4">
            {/* Preview card */}
     <FlowchartShowcase
  selected={selected}
  favorites={favorites}
  toggleFavorite={toggleFavorite}
  copySource={copySource}
  downloadSvg={downloadSvg}
  snapshotPNG={downloadPng}  // ✅ use the new PNG function
  palette={palette}
  paletteName="Custom Palette"
  subPaletteIdx={subPaletteIdx}
  setSubPaletteIdx={setSubPaletteIdx}
  isDark={isDark}
  chartRef={chartRef}
  addColor={addColor}
  removeColor={removeColor}
  updateColor={updateColor}
  themes={themes}
  setThemes={setThemes}
/>


            {/* Gallery (remaining designs) */}
          <Card>
  <CardHeader>
    <CardTitle className="flex items-center justify-between">
      <span className="flex items-center gap-2">
        <List className="w-4 h-4" /> Gallery
      </span>
      <div className="flex items-center gap-2">
        <Badge>{filtered.length}</Badge>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setQuery("");
            setSortMode("asc");
            toast("Reset filters");
          }}
        >
          <FilterIcon className="w-4 h-4" />
        </Button>
      </div>
    </CardTitle>
  </CardHeader>
  <CardContent>
    <ScrollArea className="h-[60vh]">
      <FlowchartGrid
        filtered={filtered}
        selectedId={selectedId}
        selectChart={selectChart}
        isDark={isDark}
      />
    </ScrollArea>
  </CardContent>
</Card>

          </section>
        </main>
      </div>

      {/* AI dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Flowchart with AI</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <Label>Describe the flowchart you'd like</Label>
            <Input placeholder="e.g. User registration with email confirmation" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} />
          </div>

          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => generateWithAI(aiPrompt)} disabled={aiLoading}>
              {aiLoading ? <Loader2 className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4" />} Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* -------------------- tiny fallbacks for icons used inline (to avoid import mismatch) -------------------- */
function SparklesIconFallback() { return <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 3l1.9 4.9L18 9l-4 1 4 1-3.9 1.1L12 21l-1.1-4.9L7 15l4-1-4-1 4.1-1.1L12 3z" /></svg>; }
function PlusIconFallback() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 5v14M5 12h14" /></svg>; }
