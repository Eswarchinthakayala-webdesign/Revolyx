"use client";

import React, { useState, useEffect } from "react";
import Editor from "@monaco-editor/react";
import {
  FileCode,
  Files,
  Play,
  RotateCcw,
  Monitor,
  Smartphone,
  Maximize2,
  Download,
  FolderIcon,
  ChevronRight,
  ChevronDown,
  Settings,
  Search,
  Layers,
  Eye,
  X,
  Trash2,
  Minimize2,
  Menu,
  Terminal,
  Code2,
  Tablet,
  ExternalLink,
  FileText,
  Code,
  Braces
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast, Toaster } from "sonner";
import clsx from "clsx";
import { useTheme } from "../components/theme-provider";

/* ------------------------- INITIAL CONTENT ------------------------- */
const INITIAL_FILES = {
  "index.html": {
    name: "index.html",
    language: "html",
    value: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Revolyx  Studio</title>
</head>
<body>
  <div class="card">
    <div class="badge">Production Ready</div>
    <h1>Revolyx <span class="gradient-text">IDE</span></h1>
    
    <button id="mainBtn">Execute Sequence</button>
  </div>
</body>
</html>`,
  },
  "style.css": {
    name: "style.css",
    language: "css",
    value: `body {
  margin: 0;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: radial-gradient(circle at center, #1e1b4b, #020617);
  color: white;
  font-family: 'Inter', sans-serif;
}

.card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  padding: 3rem;
  border-radius: 24px;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.gradient-text {
  background: linear-gradient(to right, #818cf8, #c084fc);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.badge {
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  background: #4f46e5;
  padding: 4px 12px;
  border-radius: 100px;
  display: inline-block;
  margin-bottom: 1rem;
}

button {
  background: #6366f1;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px rgba(99, 102, 241, 0.4);
}`,
  },
  "script.js": {
    name: "script.js",
    language: "javascript",
    value: `document.getElementById("mainBtn").addEventListener("click", () => {
  toast("Deployment Successful 🚀", {
    description: "Your changes are now live in the preview.",
  });
});`,
  },
};

export default function WebStudioIDE() {

   
     const { theme } = useTheme?.() ?? { theme: "system" };  
     const isDark =
       theme === "dark" ||
       (theme === "system" &&
         typeof window !== "undefined" &&
         window.matchMedia("(prefers-color-scheme: dark)").matches); 
  const [files, setFiles] = useState(INITIAL_FILES);
  const [activeFile, setActiveFile] = useState("index.html");
  const [previewDoc, setPreviewDoc] = useState("");
  const [viewport, setViewport] = useState("desktop");
  const [isFolderOpen, setIsFolderOpen] = useState(true);
  const [fullscreenPreview, setFullscreenPreview] = useState(false);

  /* ---------------- PREVIEW COMPILATION ---------------- */
  useEffect(() => {
    const t = setTimeout(() => {
      const html = files["index.html"]?.value || "";
      const css = files["style.css"]?.value || "";
      const js = files["script.js"]?.value || "";

      setPreviewDoc(`
        <!DOCTYPE html>
        <html>
          <head>
            <link rel="preconnect" href="https://fonts.googleapis.com">
            <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
            <style>${css}</style>
          </head>
          <body>
            ${html}
            <script>${js}<\/script>
          </body>
        </html>
      `);
    }, 400);
    return () => clearTimeout(t);
  }, [files]);

  const handleEditorChange = (value) => {
    setFiles((prev) => ({
      ...prev,
      [activeFile]: { ...prev[activeFile], value: value || "" },
    }));
  };

/* ---------------- FILE EXPLORER (PRO) ---------------- */
/* ---------------- FILE EXPLORER (PRO + THEME AWARE) ---------------- */
const FileExplorer = () => (
  <div className="flex flex-col h-full 
    bg-white text-zinc-800 
    dark:bg-[#0b0b0d] dark:text-zinc-300
  ">

    {/* HEADER */}
    <div className="
      h-10 px-4 flex items-center justify-between 
      border-b border-zinc-200 
      dark:border-white/10
      bg-zinc-50 dark:bg-[#0b0b0d]
      sticky top-0 z-10
    ">
      <span className="text-[10px] font-semibold uppercase tracking-widest 
        text-zinc-500 dark:text-zinc-400
      ">
        Explorer
      </span>

    </div>

    {/* CONTENT */}
    <ScrollArea className="flex-1 px-2 py-2">

      {/* ROOT FOLDER */}
      <div
        onClick={() => setIsFolderOpen(!isFolderOpen)}
        className="
          flex items-center gap-2 px-2 py-1.5 
          text-[11px] font-medium cursor-pointer rounded-md 
          text-zinc-600 hover:bg-zinc-100
          dark:text-zinc-400 dark:hover:bg-white/5
          transition-colors
        "
      >
        {isFolderOpen ? (
          <ChevronDown className="w-3.5 h-3.5" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5" />
        )}
        <FolderIcon className="w-4 h-4 text-zinc-500" />
        <span className="tracking-wide">src</span>
      </div>

      {/* FILE LIST */}
      {isFolderOpen && (
        <div className="
          mt-1 ml-4 pl-2 space-y-[2px]
          border-l border-zinc-200
          dark:border-white/10
        ">
          {Object.keys(files).map((file) => {
            const isActive = activeFile === file;
            const isHTML = file.endsWith("html");
            const isCSS = file.endsWith("css");
            const isJS = file.endsWith("js");

            return (
              <div
                key={file}
                onClick={() => setActiveFile(file)}
                className={clsx(
                  "group relative flex items-center justify-between px-3 py-1.5 rounded-md text-[11px] cursor-pointer transition-colors",
                  isActive
                    ? `
                      bg-zinc-200 text-zinc-600
                      dark:bg-zinc-500/10 dark:text-zinc-400
                    `
                    : `
                      text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900
                      dark:text-zinc-500 dark:hover:bg-white/5 dark:hover:text-zinc-300
                    `
                )}
              >
                {/* ACTIVE INDICATOR */}
                {isActive && (
                  <span className="
                    absolute left-0 top-1/2 -translate-y-1/2 
                    w-[2px] h-4 rounded-r 
                    bg-zinc-500
                  " />
                )}

                <div className="flex items-center gap-2">
                  {isHTML && <FileText className="w-3.5 h-3.5 text-orange-500" />}
                  {isCSS && <Code className="w-3.5 h-3.5 text-sky-500" />}
                  {isJS && <Braces className="w-3.5 h-3.5 text-yellow-500" />}
                  <span className="truncate">{file}</span>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </ScrollArea>
  </div>
);



  return (
    <div className="flex flex-col h-screen  text-zinc-300 overflow-hidden font-sans">
      <Toaster richColors position="bottom-right" />

{/* ======================= TOP GLOBAL NAV (PRO) ======================= */}
<header
  className="
    h-14 px-4 flex items-center justify-between
    border-b border-zinc-200
    dark:border-white/10
    bg-white dark:bg-[#09090b]
  "
>
  {/* LEFT */}
  <div className="flex items-center gap-4 min-w-0">
    {/* MOBILE MENU */}
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="
            lg:hidden
            text-zinc-500 hover:text-zinc-900
            dark:text-zinc-400 dark:hover:text-white
          "
        >
          <Menu className="w-5 h-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="
          p-0 w-72
          bg-white dark:bg-[#09090b]
          border-r border-zinc-200
          dark:border-white/10
        "
      >
        <FileExplorer />
      </SheetContent>
    </Sheet>

    {/* BRAND */}
    <div className="flex items-center gap-3 min-w-0">


      <div className="leading-tight">
        <div className="flex items-center gap-2">
          <h1 className="text-lg sm:text-xl lg:text-2xl text-black/80 dark:text-white/80 font-extrabold tracking-tight flex items-center gap-2 truncate">
          Revolyx
          <span className="text-zinc-500 font-medium">
            Studio 
          </span>
        </h1>
        </div>
      
      </div>
    </div>
  </div>

  {/* RIGHT */}
  <div className="flex items-center gap-1.5">
    <Button
     
      variant="outline"
      onClick={() => setFullscreenPreview(true)}
      className="
      
        text-zinc-500 hover:text-zinc-900 cursor-pointer
        dark:text-zinc-400 dark:hover:text-white
      "
    >
      <Maximize2 className="w-3.5 h-3.5" />Preview
    </Button>
  </div>
</header>


      {/* MAIN WORKSPACE */}
      <main className="flex-1 flex overflow-hidden">


        {/* DESKTOP FILE EXPLORER */}
        <aside className="hidden lg:block w-64 border-r border-white/5">
          <FileExplorer />
        </aside>

        {/* EDITOR AREA */}
{/* ======================= EDITOR SECTION ======================= */}
<section className="flex-1 flex flex-col min-w-0  relative">

  {/* ======================= TAB BAR ======================= */}
  <div className="relative h-10  border-b border-white/5 flex items-center overflow-x-auto no-scrollbar">

    {/* Left shadow mask (VS Code feel) */}
    {/* <div className="pointer-events-none absolute left-0 top-0 h-full w-6 bg-gradient-to-r from-[#09090b] to-transparent z-10" />
    <div className="pointer-events-none absolute right-0 top-0 h-full w-6 bg-gradient-to-l from-[#09090b] to-transparent z-10" /> */}

    {Object.keys(files).map((file) => {
      const isActive = activeFile === file;
      const isHTML = file.endsWith("html");
      const isCSS = file.endsWith("css");
      const isJS = file.endsWith("js");

      return (
        <div
          key={file}
          onClick={() => setActiveFile(file)}
          className={clsx(
            "group relative  flex items-center gap-2 px-4 h-full min-w-[140px] text-[11px] font-medium cursor-pointer transition-all select-none",
            "border-r border-white/5",
            isActive
              ? "dark:bg-[#0c0c0e] bg-zinc-200 dark:text-zinc-400 text-black/70"
              : "text-zinc-500  bg-white dark:bg-black hover:bg-white/90"
          )}
        >
          {/* Active top indicator */}
          {isActive && (
            <span className="absolute top-0 left-0 w-full h-[2px] bg-zinc-500" />
          )}

          {/* File Icon */}
          {isHTML && <FileText className="w-3.5 h-3.5 text-orange-400" />}
          {isCSS && <Code className="w-3.5 h-3.5 text-sky-400" />}
          {isJS && <Braces className="w-3.5 h-3.5 text-yellow-400" />}

          <span className="truncate">{file}</span>

        </div>
      );
    })}
  </div>

  {/* ======================= EDITOR CONTAINER ======================= */}
  <div className="flex-1 relative ">
    {/* Subtle inner border */}
    <div className="absolute inset-0 pointer-events-none shadow-[inset_0_1px_0_0_rgba(255,255,255,0.03)]" />

    <Editor
      height="100%"
      theme={isDark ? "vs-dark" : "vs"}
      language={files[activeFile].language}
      value={files[activeFile].value}
      onChange={handleEditorChange}
      options={{
        fontSize: 14,
        fontFamily: "'JetBrains Mono', monospace",
        minimap: { enabled: true },
        padding: { top: 16, bottom: 16 },
        wordWrap: "on",
        lineNumbers: "on",
        cursorSmoothCaretAnimation: true,
        cursorBlinking: "smooth",
        renderLineHighlight: "all",
        folding: true,
        glyphMargin: false,
        smoothScrolling: true,
        automaticLayout: true,
        scrollbar: {
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8,
          useShadows: false,
        },
      }}
    />
  </div>
</section>


{/* ======================= PREVIEW PANEL (PRO) ======================= */}
<section
  className="
    hidden md:flex flex-col relative
    md:w-[40%] lg:w-[45%]
    border-l border-zinc-200
    dark:border-white/10
    bg-zinc-50 dark:bg-[#050505]
  "
>
  {/* ======================= TOOLBAR ======================= */}
  <div
    className="
      h-10 px-3 flex items-center justify-between
      border-b border-zinc-200
      dark:border-white/10
      bg-white dark:bg-[#09090b]
    "
  >
    {/* Viewport Switch */}
    <div
      className="
        flex items-center gap-1 p-1 rounded-lg
        bg-zinc-100 dark:bg-white/5
      "
    >
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setViewport("desktop")}
        className={clsx(
          "h-7 w-7 cursor-pointer rounded-md",
          viewport === "desktop"
            ? "bg-white shadow text-zinc-900 dark:bg-white/10 dark:text-white"
            : "text-zinc-500 dark:text-zinc-400"
        )}
      >
        <Monitor className="w-3.5 h-3.5" />
      </Button>

      <Button
        size="icon"
        variant="ghost"
        onClick={() => setViewport("tablet")}
        className={clsx(
          "h-7 w-7 cursor-pointer rounded-md",
          viewport === "tablet"
            ? "bg-white shadow text-zinc-900 dark:bg-white/10 dark:text-white"
            : "text-zinc-500 dark:text-zinc-400"
        )}
      >
        <Tablet className="w-3.5 h-3.5" />
      </Button>

      <Button
        size="icon"
        variant="ghost"
        onClick={() => setViewport("mobile")}
        className={clsx(
          "h-7 w-7 cursor-pointer rounded-md",
          viewport === "mobile"
            ? "bg-white shadow text-zinc-900 dark:bg-white/10 dark:text-white"
            : "text-zinc-500 dark:text-zinc-400"
        )}
      >
        <Smartphone className="w-3.5 h-3.5" />
      </Button>
    </div>

    {/* Actions */}
    <Button
      size="icon"
      variant="ghost"
      onClick={() => setFullscreenPreview(true)}
      className="
        h-8 w-8
        cursor-pointer
        text-zinc-500 hover:text-zinc-900
        dark:text-zinc-400 dark:hover:text-white
      "
    >
      <Maximize2 className="w-3.5 h-3.5" />
    </Button>
  </div>

  {/* ======================= PREVIEW CANVAS ======================= */}
  <div
    className="
      flex-1 flex items-center justify-center p-6
      bg-zinc-100 dark:bg-[#0b0b0d] overflow-y-auto
      dark:bg-[url('https://grainy-gradients.vercel.app/noise.svg')]
      dark:bg-repeat
    "
  >
    <div
      className={clsx(
        "relative  transition-all duration-500 ease-out",
        "bg-white shadow-xl dark:shadow-[0_0_80px_rgba(0,0,0,0.45)]",
        viewport === "desktop" &&
          "w-full h-full rounded-2xl",
        viewport === "tablet" &&
          "w-[768px] h-[724px] rounded-2xl  mt-45 border border-zinc-200 dark:border-zinc-800",
        viewport === "mobile" &&
          "w-[375px] h-[720px] rounded-2xl mt-45 border border-zinc-200 dark:border-zinc-800"
      )}
    >
      {/* Browser chrome hint */}
      <div className="absolute top-0 left-0 right-0 h-6 rounded-t-2xl bg-zinc-100 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 flex items-center px-2 gap-1">
        <span className="w-2 h-2 rounded-full bg-red-400" />
        <span className="w-2 h-2 rounded-full bg-yellow-400" />
        <span className="w-2 h-2 rounded-full bg-green-400" />
      </div>

      <iframe
        srcDoc={previewDoc}
        title="live-render"
        sandbox="allow-scripts"
        className="w-full h-full pt-6 rounded-[inherit]"
      />
    </div>
  </div>
</section>

      </main>



      {/* FULLSCREEN PREVIEW OVERLAY */}
      {fullscreenPreview && (
        <div className="fixed inset-0 bg-[#020617] z-[100] flex flex-col animate-in fade-in zoom-in-95 duration-200">
           <header className="h-14 bg-[#09090b] border-b border-white/5 flex items-center justify-between px-6">
            <span className="text-xs font-bold text-zinc-400">Full Screen Staging</span>
            <Button  size="icon" variant="secondary" className="h-9 w-9 cursor-pointer" onClick={() => setFullscreenPreview(false)}><Minimize2 className="w-4 h-4"/></Button>
           </header>
           <div className="flex-1">
             <iframe srcDoc={previewDoc} className="w-full h-full" sandbox="allow-scripts" />
           </div>
        </div>
      )}
    </div>
  );
}