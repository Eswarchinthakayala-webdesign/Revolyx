"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
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
  Plus, 
  FolderIcon,
  ChevronRight,
  ChevronDown,
  Settings,
  Search,
  Layout,
  Layers,
  Eye,
  X,
  Trash2
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { toast, Toaster } from "sonner";
import clsx from "clsx";

/* ------------------------- INITIAL CONTENT ------------------------- */
const INITIAL_FILES = {
  "index.html": {
    name: "index.html",
    language: "html",
    value: `<!DOCTYPE html>\n<html>\n<head>\n  <title>Revolyx Project</title>\n</head>\n<body>\n  <div class="container">\n    <h1>Hello Revolyx!</h1>\n    <p>Start editing to see magic happen.</p>\n    <button id="magicBtn">Click Me</button>\n  </div>\n</body>\n</html>`,
  },
  "style.css": {
    name: "style.css",
    language: "css",
    value: `body {\n  font-family: 'Inter', sans-serif;\n  background: #0f172a;\n  color: white;\n  display: flex;\n  justify-content: center;\n  align-items: center;\n  height: 100vh;\n  margin: 0;\n}\n\n.container {\n  text-align: center;\n  padding: 2rem;\n  background: #1e293b;\n  border-radius: 1rem;\n  box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);\n}\n\nbutton {\n  background: #6366f1;\n  color: white;\n  border: none;\n  padding: 0.5rem 1rem;\n  border-radius: 0.5rem;\n  cursor: pointer;\n  transition: transform 0.2s;\n}\n\nbutton:hover {\n  transform: scale(1.05);\n  background: #818cf8;\n}`,
  },
  "script.js": {
    name: "script.js",
    language: "javascript",
    value: `const btn = document.getElementById('magicBtn');\n\nbtn.addEventListener('click', () => {\n  alert('Revolyx Editor is Live! 🚀');\n  document.body.style.background = '#4338ca';\n});`,
  },
};

export default function WebStudioIDE() {
  const [files, setFiles] = useState(INITIAL_FILES);
  const [activeFile, setActiveFile] = useState("index.html");
  const [previewDoc, setPreviewDoc] = useState("");
  const [viewport, setViewport] = useState("desktop"); // desktop, mobile
  const [isFolderOpen, setIsFolderOpen] = useState(true);

  // Sync Preview
  useEffect(() => {
    const timeout = setTimeout(() => {
      const html = files["index.html"]?.value || "";
      const css = files["style.css"]?.value || "";
      const js = files["script.js"]?.value || "";

      const combined = `
        <html>
          <head>
            <style>${css}</style>
          </head>
          <body>
            ${html}
            <script>${js}<\/script>
          </body>
        </html>
      `;
      setPreviewDoc(combined);
    }, 500);

    return () => clearTimeout(timeout);
  }, [files]);

  const handleEditorChange = (value) => {
    setFiles((prev) => ({
      ...prev,
      [activeFile]: { ...prev[activeFile], value: value || "" },
    }));
  };

  const addNewFile = () => {
    const filename = prompt("Enter filename (e.g. about.html, theme.css):");
    if (!filename) return;

    if (files[filename]) {
      toast.error("File already exists");
      return;
    }

    const extension = filename.split(".").pop();
    let language = "plaintext";
    if (extension === "html") language = "html";
    if (extension === "css") language = "css";
    if (extension === "js") language = "javascript";

    setFiles(prev => ({
      ...prev,
      [filename]: {
        name: filename,
        language,
        value: ""
      }
    }));
    setActiveFile(filename);
    toast.success(`${filename} created`);
  };

  const deleteFile = (e, filename) => {
    e.stopPropagation();
    if (filename === "index.html") {
      toast.error("Cannot delete root index.html");
      return;
    }
    const newFiles = { ...files };
    delete newFiles[filename];
    setFiles(newFiles);
    setActiveFile("index.html");
    toast.info("File removed");
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#0d0d0d] text-zinc-300">
      <Toaster position="top-right" richColors />
      
      {/* TOP NAVBAR */}
      <header className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-[#141414] shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-indigo-600 rounded flex items-center justify-center">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="text-xs font-bold tracking-widest uppercase">
              Revolyx <span className="text-indigo-400">DevStudio</span>
            </span>
          </div>
          <Separator orientation="vertical" className="h-6 bg-white/10" />
          <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">
            Live Sync: Active
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* FULL SCREEN DIALOG PREVIEW */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 text-xs gap-2 hover:bg-white/5">
                <Maximize2 className="w-3.5 h-3.5" /> Full Preview
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] w-[95vw] h-[90vh] p-0 bg-white overflow-hidden border-none rounded-xl">
              <DialogHeader className="absolute top-2 right-12 z-50">
                <DialogTitle className="sr-only">Project Preview</DialogTitle>
              </DialogHeader>
              <iframe
                title="Full Preview"
                srcDoc={previewDoc}
                className="w-full h-full"
                sandbox="allow-scripts"
              />
            </DialogContent>
          </Dialog>

          <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700 text-white px-4">
            <Download className="w-3.5 h-3.5 mr-2" /> Export
          </Button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        
        {/* ACTIVITY BAR */}
        <aside className="w-12 bg-[#0a0a0a] border-r border-white/5 flex flex-col items-center py-4 gap-4 shrink-0">
          <div className="p-2 text-white border-l-2 border-indigo-500 bg-white/5 cursor-pointer">
            <Files className="w-5 h-5" />
          </div>
          <div className="p-2 opacity-40 hover:opacity-100 cursor-pointer transition-all">
            <Search className="w-5 h-5" />
          </div>
          <div className="mt-auto p-2 opacity-40 hover:opacity-100 cursor-pointer">
            <Settings className="w-5 h-5" />
          </div>
        </aside>

        {/* FILE EXPLORER */}
        <aside className="w-64 bg-[#111111] border-r border-white/5 flex flex-col shrink-0">
          <div className="p-3 flex items-center justify-between border-b border-white/5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Explorer</span>
            <Plus 
               className="w-4 h-4 text-zinc-500 hover:text-white cursor-pointer transition-colors" 
               onClick={addNewFile}
            />
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2">
              <div 
                className="flex items-center gap-2 py-1.5 px-2 text-xs font-medium text-zinc-400 cursor-pointer hover:bg-white/5 rounded-md"
                onClick={() => setIsFolderOpen(!isFolderOpen)}
              >
                {isFolderOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />} 
                <FolderIcon className="w-4 h-4 text-amber-500/70" /> src
              </div>
              
              {isFolderOpen && (
                <div className="space-y-0.5 mt-1 ml-4 border-l border-white/10 pl-2">
                  {Object.keys(files).map((filename) => (
                    <div
                      key={filename}
                      onClick={() => setActiveFile(filename)}
                      className={clsx(
                        "group w-full flex items-center justify-between py-1.5 px-3 rounded-md text-xs cursor-pointer transition-all",
                        activeFile === filename 
                          ? "bg-indigo-500/10 text-indigo-400" 
                          : "text-zinc-500 hover:bg-white/5 hover:text-zinc-300"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <FileCode className={clsx(
                          "w-3.5 h-3.5",
                          filename.endsWith('html') && "text-orange-500",
                          filename.endsWith('css') && "text-sky-400",
                          filename.endsWith('js') && "text-yellow-400"
                        )} />
                        {filename}
                      </div>
                      {filename !== "index.html" && (
                        <Trash2 
                          className="w-3 h-3 opacity-0 group-hover:opacity-100 hover:text-red-400 transition-opacity" 
                          onClick={(e) => deleteFile(e, filename)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollArea>
        </aside>

        {/* EDITOR SECTION */}
        <section className="flex-1 flex flex-col min-w-0 bg-[#1e1e1e]">
          {/* TABS BAR */}
          <div className="h-9 bg-[#1a1a1a] flex items-center px-1 overflow-x-auto no-scrollbar border-b border-white/5 shrink-0">
            {Object.keys(files).map((filename) => (
              <div
                key={filename}
                onClick={() => setActiveFile(filename)}
                className={clsx(
                  "flex items-center gap-2 px-4 h-full text-[11px] cursor-pointer transition-all border-t-2",
                  activeFile === filename 
                    ? "bg-[#1e1e1e] text-zinc-100 border-t-indigo-500" 
                    : "opacity-40 hover:opacity-100 hover:bg-white/5 border-t-transparent"
                )}
              >
                {filename}
                {activeFile === filename && (
                  <X 
                    className="w-2.5 h-2.5 ml-2 opacity-50 hover:text-red-400" 
                    onClick={(e) => deleteFile(e, filename)}
                  />
                )}
              </div>
            ))}
          </div>

          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              theme="vs-dark"
              language={files[activeFile].language}
              value={files[activeFile].value}
              onChange={handleEditorChange}
              options={{
                minimap: { enabled: true },
                fontSize: 14,
                fontFamily: "'Fira Code', monospace",
                wordWrap: "on",
                padding: { top: 16 },
                automaticLayout: true,
                scrollBeyondLastLine: false,
              }}
            />
          </div>
        </section>

        {/* PREVIEW SECTION */}
        <section className="flex-1 border-l border-white/5 bg-[#0a0a0a] flex flex-col min-w-0">
          <div className="h-12 border-b border-white/5 flex items-center justify-between px-4 bg-[#111111] shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-bold uppercase text-zinc-500 tracking-widest flex items-center gap-2">
                <Eye className="w-3 h-3" /> Live Preview
              </span>
              <Separator orientation="vertical" className="h-4 bg-white/10" />
              <div className="flex bg-white/5 rounded-md p-1 gap-1">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={clsx("h-6 w-6 rounded-sm transition-colors", viewport === 'desktop' && "bg-indigo-600 text-white")}
                  onClick={() => setViewport('desktop')}
                >
                  <Monitor className="w-3 h-3" />
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={clsx("h-6 w-6 rounded-sm transition-colors", viewport === 'mobile' && "bg-indigo-600 text-white")}
                  onClick={() => setViewport('mobile')}
                >
                  <Smartphone className="w-3 h-3" />
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7 opacity-50 hover:opacity-100" 
                onClick={() => setFiles(INITIAL_FILES)}
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </Button>
              <Button size="icon" className="h-7 w-7 bg-emerald-600 hover:bg-emerald-700">
                <Play className="w-3.5 h-3.5 text-white" />
              </Button>
            </div>
          </div>

          {/* PREVIEW VIEWPORT CONTAINER */}
          <div className="flex-1 flex items-center justify-center bg-[#0d0d0d] p-4 relative overflow-hidden">
             <div 
              className={clsx(
                "bg-white shadow-2xl transition-all duration-500 overflow-hidden",
                viewport === 'desktop' ? "w-full h-full rounded-lg" : "w-[375px] h-[667px] rounded-[32px] border-[8px] border-zinc-800"
              )}
            >
              <iframe
                title="Preview"
                srcDoc={previewDoc}
                className="w-full h-full border-none"
                sandbox="allow-scripts"
              />
            </div>
          </div>
        </section>

      </main>

      {/* FOOTER */}
      <footer className="h-6 bg-indigo-600 flex items-center px-4 justify-between text-[10px] text-white/90 font-medium shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1">
            <RotateCcw className="w-2.5 h-2.5" /> UTF-8
          </div>
          <div className="flex items-center gap-1 uppercase">
            {files[activeFile].language}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live
          </div>
        </div>
      </footer>
    </div>
  );
}