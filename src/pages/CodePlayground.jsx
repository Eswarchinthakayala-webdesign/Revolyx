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
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast, Toaster } from "sonner";
import clsx from "clsx";

/* ------------------------- INITIAL CONTENT ------------------------- */
const INITIAL_FILES = {
  "index.html": {
    name: "index.html",
    language: "html",
    value: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Revolyx Pro Studio</title>
</head>
<body>
  <div class="card">
    <div class="badge">Production Ready</div>
    <h1>Revolyx <span class="gradient-text">IDE</span></h1>
    <p>Professional development in the browser.</p>
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

  /* ---------------- COMPONENTS ---------------- */
  const FileExplorer = () => (
    <div className="flex flex-col h-full bg-[#09090b]">
      <div className="p-4 flex items-center justify-between border-b border-white/5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Workspace</span>
        <Button variant="ghost" size="icon" className="h-6 w-6"><Settings className="w-3 h-3"/></Button>
      </div>
      <ScrollArea className="flex-1 p-2">
        <div 
          className="flex items-center gap-2 px-2 py-1.5 text-xs font-semibold text-zinc-300 cursor-pointer"
          onClick={() => setIsFolderOpen(!isFolderOpen)}
        >
          {isFolderOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
          <FolderIcon className="w-4 h-4 text-indigo-400" />
          src
        </div>
        {isFolderOpen && (
          <div className="ml-4 mt-1 border-l border-white/10 pl-2 space-y-0.5">
            {Object.keys(files).map((f) => (
              <div
                key={f}
                onClick={() => setActiveFile(f)}
                className={clsx(
                  "flex items-center justify-between px-3 py-2 rounded-lg text-xs cursor-pointer transition-colors",
                  activeFile === f ? "bg-indigo-500/10 text-indigo-400" : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                )}
              >
                <div className="flex items-center gap-2">
                  <FileCode className={clsx("w-3.5 h-3.5", activeFile === f ? "text-indigo-400" : "text-zinc-600")} />
                  {f}
                </div>
                {f !== "index.html" && <Trash2 className="w-3 h-3 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity" />}
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#020617] text-zinc-300 overflow-hidden font-sans">
      <Toaster richColors position="bottom-right" />

      {/* TOP GLOBAL NAV */}
      <header className="h-14 bg-[#09090b] border-b border-white/5 flex items-center justify-between px-4 z-50">
        <div className="flex items-center gap-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden text-zinc-400">
                <Menu className="w-5 h-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-72 bg-[#09090b] border-r border-white/10">
              <FileExplorer />
            </SheetContent>
          </Sheet>
          
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Code2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-sm font-bold tracking-tight text-white">REVOLYX <span className="text-indigo-500">STUDIO</span></span>
              <p className="text-[10px] text-zinc-500 leading-none">v2.4.0 Stable</p>
            </div>
          </div>
        </div>

         <div className="flex gap-2">
              <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-500 hover:text-white" onClick={() => setFullscreenPreview(true)}><Maximize2 className="w-3.5 h-3.5"/></Button>
            </div>
      </header>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 flex overflow-hidden">
        {/* DESKTOP ACTIVITY BAR */}
        <aside className="hidden lg:flex w-14 bg-[#09090b] border-r border-white/5 flex-col items-center py-4 gap-6">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-2 text-indigo-400 bg-indigo-500/10 rounded-xl cursor-pointer"><Files className="w-5 h-5" /></div>
              </TooltipTrigger>
              <TooltipContent side="right"><p>Explorer</p></TooltipContent>
            </Tooltip>
            <div className="p-2 text-zinc-600 hover:text-zinc-300 cursor-pointer transition-colors"><Search className="w-5 h-5" /></div>
            <div className="p-2 text-zinc-600 hover:text-zinc-300 cursor-pointer transition-colors mt-auto"><Settings className="w-5 h-5" /></div>
          </TooltipProvider>
        </aside>

        {/* DESKTOP FILE EXPLORER */}
        <aside className="hidden lg:block w-64 border-r border-white/5">
          <FileExplorer />
        </aside>

        {/* EDITOR AREA */}
        <section className="flex-1 flex flex-col min-w-0 bg-[#0c0c0e]">
          {/* VS-CODE STYLE TABS */}
          <div className="h-10 bg-[#09090b] flex items-center border-b border-white/5 overflow-x-auto no-scrollbar">
            {Object.keys(files).map((f) => (
              <div
                key={f}
                onClick={() => setActiveFile(f)}
                className={clsx(
                  "flex items-center gap-2 px-4 h-full text-[11px] cursor-pointer transition-all border-r border-white/5 min-w-[120px]",
                  activeFile === f ? "bg-[#0c0c0e] text-indigo-400 border-t-2 border-t-indigo-500" : "text-zinc-500 hover:bg-white/5"
                )}
              >
                <FileCode className={clsx("w-3.5 h-3.5", f.endsWith('html') && "text-orange-400", f.endsWith('css') && "text-blue-400", f.endsWith('js') && "text-yellow-400")} />
                {f}
              </div>
            ))}
          </div>

          <div className="flex-1 relative">
            <Editor
              height="100vh"
              theme="vs-dark"
              language={files[activeFile].language}
              value={files[activeFile].value}
              onChange={handleEditorChange}
              options={{
                fontSize: 14,
                fontFamily: "'JetBrains Mono', monospace",
                minimap: { enabled: true },
                padding: { top: 16 },
                wordWrap: "on",
                lineNumbers: "on",
                automaticLayout: true,
                glyphMargin: false,
                folding: true,
                scrollbar: { verticalScrollbarSize: 8 },
              }}
            />
          </div>
        </section>

        {/* PREVIEW PANEL */}
        <section className="hidden md:flex flex-col border-l border-white/5 bg-[#050505] relative md:w-[40%] lg:w-[45%]">
          <div className="h-10 bg-[#09090b] border-b border-white/5 flex items-center justify-between px-3">
            <div className="flex gap-1.5 p-1 bg-white/5 rounded-lg">
              <Button size="icon" variant="ghost" className={clsx("h-7 w-7", viewport === "desktop" && "bg-white/10 text-white")} onClick={() => setViewport("desktop")}><Monitor className="w-3.5 h-3.5"/></Button>
              <Button size="icon" variant="ghost" className={clsx("h-7 w-7", viewport === "tablet" && "bg-white/10 text-white")} onClick={() => setViewport("tablet")}><Tablet className="w-3.5 h-3.5"/></Button>
              <Button size="icon" variant="ghost" className={clsx("h-7 w-7", viewport === "mobile" && "bg-white/10 text-white")} onClick={() => setViewport("mobile")}><Smartphone className="w-3.5 h-3.5"/></Button>
            </div>
            <div className="flex gap-2">
              <Button size="icon" variant="ghost" className="h-8 w-8 text-zinc-500 hover:text-white" onClick={() => setFullscreenPreview(true)}><Maximize2 className="w-3.5 h-3.5"/></Button>

            </div>
          </div>

          <div className="flex-1  overflow-y-auto flex items-center justify-center p-6  bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-repeat">
            <div
              className={clsx(
                "bg-white  shadow-[0_0_100px_rgba(0,0,0,0.3)]  transition-all  duration-500 ease-in-out",
                viewport === "desktop" ? "w-full h-full rounded-xl" : 
                viewport === "tablet" ? "w-[600px] h-[800px] mt-50 rounded-3xl border-[12px] border-zinc-900" :
                "w-[340px] h-[680px] mt-35 rounded-[48px] border-[14px] border-zinc-900"
              )}
            >
              <iframe
                srcDoc={previewDoc}
                className="w-full h-full rounded-[inherit]"
                sandbox="allow-scripts"
                title="live-render"
              />
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER BAR */}
      <footer className="h-7 bg-[#09090b] border-t border-white/5 flex items-center justify-between px-3 text-[10px] font-medium tracking-wide uppercase text-zinc-500 shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 text-emerald-500"><div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"/> Live Connection</div>
          <div className="flex items-center gap-1.5"><Terminal className="w-3 h-3"/> UTF-8</div>
        </div>
        <div className="flex items-center gap-3">
          <span>{activeFile.split('.').pop()} Layout</span>
          <Separator orientation="vertical" className="h-3 bg-white/10" />
          <span className="text-zinc-400">Prettier: Active</span>
        </div>
      </footer>

      {/* FULLSCREEN PREVIEW OVERLAY */}
      {fullscreenPreview && (
        <div className="fixed inset-0 bg-[#020617] z-[100] flex flex-col animate-in fade-in zoom-in-95 duration-200">
           <header className="h-14 bg-[#09090b] border-b border-white/5 flex items-center justify-between px-6">
            <span className="text-xs font-bold text-zinc-400">Full Screen Staging</span>
            <Button size="icon" variant="secondary" className="h-9 w-9" onClick={() => setFullscreenPreview(false)}><Minimize2 className="w-4 h-4"/></Button>
           </header>
           <div className="flex-1">
             <iframe srcDoc={previewDoc} className="w-full h-full" sandbox="allow-scripts" />
           </div>
        </div>
      )}
    </div>
  );
}