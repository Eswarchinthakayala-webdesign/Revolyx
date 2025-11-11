// src/pages/NeumorphicDesignPage.jsx
"use client";

import React, { useMemo, useState, useRef } from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark, oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";

import {
  Search as SearchIcon,
  Copy as CopyIcon,
  Maximize2,
  Minimize2,
  Code,
  Grid,
  Moon,
  Sun,
  List as ListIcon,
  Check,
} from "lucide-react";

import { Toaster, toast } from "sonner";

/* shadcn/ui components (adjust import paths if needed in your project) */
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import Bluetooth from "../components/Neumorphic/BlueTooth";
import { useTheme } from "../components/theme-provider";
import ThemeToggle from "../components/Neumorphic/ThemeToggle";
import GetStartedButton from "../components/Neumorphic/GetStartedButton";
import ViewCard from "../components/Neumorphic/ViewCard";
import SendMessage from "../components/Neumorphic/SendMessage";
import NotificationCard from "../components/Neumorphic/NotificationCard";
import InputField from "../components/Neumorphic/InputField";
import RadioGroup from "../components/Neumorphic/RadioGroup";
import SocialCard from "../components/Neumorphic/SocialCard";
import AddToCartButton from "../components/Neumorphic/AddToCartButton";
import CardTooltip from "../components/Neumorphic/CardToolTip";
import ShareTemplate from "../components/Neumorphic/ShareTemplate";
import LoginTemplate from "../components/Neumorphic/LoginTemplate";
/* -------------------------
   Neumorphic Components
   (exported individually)
   -------------------------*/

/* -------------------------
   Source code strings for each component
   (displayed in the code viewer)
   -------------------------*/

const COMPONENTS = [
  {
    id: "bluetooth",
    name: "BlueTooth",
    category: "Device",
    component: Bluetooth,
    code: `

import React from 'react';
import styled from 'styled-components';
export default function Demo() {
  return (
    <div className="relative">
      <BlueToothIcon />
    </div>
  );
}`,
  
  },
    {
    id: "InputField",
    name: "InputField",
    category: "Input",
    component: InputField,
    code: `

import React from 'react';
import styled from 'styled-components';
export default function Demo() {
  return (
    <div className="relative">
      <InputField />
    </div>
  );
}`,
  
  },
    {
    id: "theme-toggle",
    name: "ThemeToggle",
    category: "Toggle",
    component: ThemeToggle,
    code: `

import React from 'react';
import styled from 'styled-components';
export default function Demo() {
  return (
    <div className="relative">
      <ThemeToggle />
    </div>
  );
}`,
  
  },
    {
    id: "RadioGroup",
    name: "RadioGroup",
    category: "Radio",
    component: RadioGroup,
    code: `

import React from 'react';
import styled from 'styled-components';
export default function Demo() {
  return (
    <div className="relative">
      <RadioGroup />
    </div>
  );
}`,
  
  },
    {
    id: "SocialCard",
    name: "SocialCard",
    category: "Card",
    component: SocialCard,
    code: `

import React from 'react';
import styled from 'styled-components';
export default function Demo() {
  return (
    <div className="relative">
      <SocialCard />
    </div>
  );
}`,
  
  },
    {
    id: "AddToCartButton",
    name: "AddToCartButton",
    category: "Button",
    component: AddToCartButton,
    code: `

import React from 'react';
import styled from 'styled-components';
export default function Demo() {
  return (
    <div className="relative">
      <AddToCartButton />
    </div>
  );
}`,
  
  },
    {
    id: "CardTooltip",
    name: "CardTooltip",
    category: "ToolTip",
    component: CardTooltip,
    code: `

import React from 'react';
import styled from 'styled-components';
export default function Demo() {
  return (
    <div className="relative">
      <CardTooltip />
    </div>
  );
}`,
  
  },
    {
    id: "ShareTemplate",
    name: "ShareTemplate",
    category: "Tools",
    component:ShareTemplate,
    code: `

import React from 'react';
import styled from 'styled-components';
export default function Demo() {
  return (
    <div className="relative">
      <ShareTemplate />
    </div>
  );
}`,
  
  },
    {
    id: "LoginTemplate",
    name: "LoginTemplate",
    category: "Form",
    component:LoginTemplate,
    code: `

import React from 'react';
import styled from 'styled-components';
export default function Demo() {
  return (
    <div className="relative">
      <LoginTemplate />
    </div>
  );
}`,
  
  },
    {
    id: "GetStartedButton",
    name: "GetStartedButton",
    category: "Button",
    component: GetStartedButton,
    code: `

import React from 'react';
import styled from 'styled-components';
export default function Demo() {
  return (
    <div className="relative">
      <GetStartedButton />
    </div>
  );
}`,
  
  },
    {
    id: "ViewCard",
    name: "ViewCard",
    category: "Card",
    component: ViewCard,
    code: `

import React from 'react';
import styled from 'styled-components';
export default function Demo() {
  return (
    <div className="relative">
      <ViewCard />
    </div>
  );
}`,
  
  },
    {
    id: "SendMessage",
    name: "SendMessage",
    category: "Button",
    component: SendMessage,
    code: `

import React from 'react';
import styled from 'styled-components';
export default function Demo() {
  return (
    <div className="relative">
      <SendMessage />
    </div>
  );
}`,
  
  },
    {
    id: "NotificationCard",
    name: "NotificationCard",
    category: "Card",
    component: NotificationCard,
    code: `

import React from 'react';
import styled from 'styled-components';
export default function Demo() {
  return (
    <div className="relative">
      <NotificationCard />
    </div>
  );
}`,
  
  },
];



/* -------------------------
   Main Page: NeumorphicDesignPage
   -------------------------*/

export default function NeumorphicDesignPage() {
  const [query, setQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedId, setSelectedId] = useState(COMPONENTS[0].id);
  const [showCode, setShowCode] = useState(true);
  const [copied, setCopied] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
     const {theme}=useTheme()
       const isDark =
        theme === "dark" ||
        (theme === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);

  const selected = useMemo(() => COMPONENTS.find((c) => c.id === selectedId) || COMPONENTS[0], [selectedId]);

  // filtered list based on query
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COMPONENTS;
    return COMPONENTS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.description || "").toLowerCase().includes(q) ||
        (c.category || "").toLowerCase().includes(q)
    );
  }, [query]);

  // suggestions shown only when user clicks search input (per request)
  function handleSearchFocus() {
    setShowSuggestions(true);
  }
  function handleSearchBlur() {
    // small delay so click can register on suggestion
    setTimeout(() => setShowSuggestions(false), 180);
  }

  // copy code
  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(selected.code);
      setCopied(true);
      toast.success("Code copied");
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed");
    }
  };

  // render preview: if component is interactive supply previewProps
  const PreviewRenderer = () => {
    const Comp = selected.component;
    return (
      <div className="max-w-full">
        <Comp />
      </div>
    );
  };

  // quick selection gallery items
  const quickItems = [
    { title: "Primary Button", compId: "button", props: { children: "Primary" } },
    { title: "Soft Card", compId: "card" },
    { title: "Input Field", compId: "input" },
    { title: "Toggle On", compId: "toggle" },
    { title: "Badge", compId: "badge" },
  ];

  return (
    <div className="min-h-screen p-6 md:p-10 bg-background text-foreground">
      <Toaster richColors />

      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-extrabold">Revolyx — Neumorphic UI Kit</h1>
          <p className="text-sm opacity-70 mt-1">Inspect components, preview them live, copy source and use quickly.</p>
        </div>

        <div className="flex items-center gap-2">
        

          {/* Mobile sheet trigger */}
          <Sheet>
            <SheetTrigger asChild>
              <button className="p-2 rounded-lg bg-white/70 dark:bg-zinc-900/60 lg:hidden">
                <ListIcon className="w-5 h-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[300px]">
              <div className="p-4">
                <h3 className="font-semibold mb-3">Components</h3>
                <ScrollArea className="h-[60vh]">
                  <div className="space-y-2">
                    {COMPONENTS.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => setSelectedId(c.id)}
                        className={clsx(
                          "w-full text-left px-3 py-2 rounded-md",
                          selectedId === c.id ? "bg-indigo-500/10" : "hover:bg-muted"
                        )}
                      >
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs opacity-60">{c.category}</div>
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: component list */}
        <aside className="lg:col-span-3">
          <Card className="p-0 overflow-hidden bg-white/80 dark:bg-black/80">
            <CardHeader className="px-4 py-3">
              <div className="flex items-center justify-between">
                <CardTitle>Revolyx components</CardTitle>
                <div className="text-xs opacity-60">{COMPONENTS.length}</div>
              </div>
            </CardHeader>

            <div className="px-4 py-3">
              <div className="relative">
                <div className="absolute left-3 top-3 pointer-events-none">
                  <SearchIcon className="w-4 h-4 opacity-60" />
                </div>
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={handleSearchFocus}
                  onBlur={handleSearchBlur}
                  placeholder="Search components (click to show suggestions)"
                  className="pl-10 w-full rounded-lg py-2 border border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/60"
                />
              </div>

              {/* suggestions panel (only when user clicked) */}
              <AnimatePresence>
                {showSuggestions && (
                  <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-3">
                    <Card className="p-2">
                      <ScrollArea className="h-40">
                        <div className="space-y-2">
                          {filtered.map((c) => (
                            <button
                              key={c.id}
                              onClick={() => {
                                setSelectedId(c.id);
                                setShowSuggestions(false);
                                setQuery("");
                              }}
                              className="w-full text-left px-3 py-2 cursor-pointer rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800"
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="font-medium">{c.name}</div>
                                 
                                </div>
                                <div className="text-xs opacity-50">{c.category}</div>
                              </div>
                            </button>
                          ))}
                          {filtered.length === 0 && <div className="p-3 text-sm opacity-60">No results</div>}
                        </div>
                      </ScrollArea>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Separator />

            <div className="p-3">
              <ScrollArea className="h-[60vh]">
                <div className="space-y-2">
                  {COMPONENTS.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedId(c.id)}
                      className={clsx(
                        "w-full text-left px-3 border  cursor-pointer py-2 rounded-md flex items-center gap-3",
                        selectedId === c.id ? "bg-zinc-500/10 border-zinc-300/30" : "hover:bg-muted"
                      )}
                    >
                     
                      <div className="flex-1">
                        <div className="font-medium">{c.name}</div>
                        <div className="text-xs opacity-60">{c.category}</div>
                      </div>
                    
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </Card>
        </aside>

        {/* Right: preview + code */}
        <main className="lg:col-span-9 space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Preview card */}
            <Card className="h-full flex flex-col justify-between">
              <CardHeader className="flex items-start justify-between">
                <CardTitle>
                  <div className="text-lg font-semibold">{selected.name}</div>
                  <div className="text-sm opacity-60">{selected.category}</div>
                </CardTitle>

                <div className="flex items-center gap-2">
                  <Badge>{selected.category}</Badge>
                  <Button className="cursor-pointer" size="sm" onClick={() => { setFullscreen(true); }}>
                    <Maximize2 className="w-4 h-4 mr-1" /> Full
                  </Button>
                </div>
              </CardHeader>

              <CardContent className="mt-4 flex-1 flex items-center justify-center">
                <motion.div initial={{ scale: 0.96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.32 }} className="w-full">
                  {/* live preview area with subtle background */}
                  <div className="p-6 relative flex items-center w-full justify-center rounded-xl bg-gradient-to-br from-white/60 to-zinc-100 dark:from-zinc-900/70 dark:to-zinc-950 shadow-inner-neumorph">
                    <PreviewRenderer />
                  </div>
                </motion.div>
              </CardContent>
            </Card>

            {/* Code viewer */}
            <Card className="p-0">
              <CardHeader className="px-4 py-3 flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Code className="w-4 h-4" /> Source</CardTitle>

                <div className="flex items-center gap-2">
                  <Button className="cursor-pointer" size="sm" onClick={() => { setShowCode((s) => !s); }}>{showCode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}</Button>
                  <Button className="cursor-pointer" size="sm" onClick={copyCode}><CopyIcon className="w-4 h-4" /></Button>
                </div>
              </CardHeader>

              <CardContent>
                <AnimatePresence initial={false}>
                  {showCode && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }}>
                      <SyntaxHighlighter language="jsx" style={isDark ? oneDark : oneLight} customStyle={{ borderRadius: 8, padding: 16, fontSize: 12 }}>
                        {selected.code}
                      </SyntaxHighlighter>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </Card>
          </div>

          {/* Below: more previews */}
          <Card>
            <CardHeader><CardTitle>More components & variants</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                {COMPONENTS.map((c) => (
                  <motion.div whileHover={{ scale: 1.03 }} key={c.id} className="p-3 rounded-xl border bg-white/70 dark:bg-zinc-900/60">
                    <div className="mb-3 font-medium">{c.name}</div>
                    
                    <div className="flex gap-2">
                      <button onClick={() => setSelectedId(c.id)} className="text-xs px-2 py-1 rounded bg-indigo-50">Open</button>
                      <button onClick={() => toast.success("Copied quick code")} className="text-xs px-2 py-1 rounded bg-zinc-100/60">Copy</button>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Fullscreen preview dialog */}
      <Dialog open={fullscreen} onOpenChange={(v) => setFullscreen(v)}>
        <DialogContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold">{selected.name} — Full preview</h3>
              <div className="text-sm opacity-60">{selected.description}</div>
            </div>
          </div>

          <div className="w-full h-[70vh] flex items-center justify-center bg-gradient-to-br from-white/60 to-zinc-100 dark:from-zinc-900/70 dark:to-zinc-950 rounded-xl">
            <PreviewRenderer />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

