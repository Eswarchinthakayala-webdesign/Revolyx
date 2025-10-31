"use client";

import React, { useRef } from "react";
import clsx from "clsx";
import { List, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { FuturisticMenuButton } from "./FuturisticMenuButton";

/**
 * Props expected:
 * filtered, grouped, sortMode, setSortMode,
 * query, setQuery, showSuggestions, setShowSuggestions,
 * selectChart, selectedId
 */
export default function FlowchartSidebar({
  filtered = [],
  grouped = {},
  sortMode,
  setSortMode,
  query,
  setQuery,
  showSuggestions,
  setShowSuggestions,
  selectChart,
  selectedId,
}) {
  const [open, setOpen] = React.useState(false);
  const inputRef = useRef(null);

  const SidebarContent = (
    <Card className="h-full border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-[#0a0a0a] shadow-md">
      {/* ===== Header ===== */}
      <CardHeader className="sticky top-0 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-md border-b border-zinc-200/50 dark:border-zinc-800/50 z-20">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-zinc-900 dark:text-zinc-100">
            <List className="w-4 h-4" /> Flowchart Library
          </div>
          <Badge variant="secondary" className="dark:bg-zinc-800 dark:text-zinc-200">
            {filtered.length}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-3">
        {/* ===== Search Input ===== */}
        <div className="relative mb-3">
          <Search className="absolute left-2 top-2.5 w-4 h-4 text-zinc-500 dark:text-zinc-400" />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Search flowcharts..."
            className="pl-8 dark:bg-zinc-900 dark:border-zinc-800 dark:text-zinc-100"
          />
        </div>

        {/* ===== Quick Filters ===== */}
        <div className="mb-3">
          <Label className="text-xs text-zinc-600 dark:text-zinc-400">Quick filters</Label>
          <div className="flex gap-2 mt-2 flex-wrap">
            <Button
              size="sm"
              variant={sortMode === "asc" ? "default" : "outline"}
              onClick={() => setSortMode("asc")}
            >
              A → Z
            </Button>
            <Button
              size="sm"
              variant={sortMode === "desc" ? "default" : "outline"}
              onClick={() => setSortMode("desc")}
            >
              Z → A
            </Button>
            <Button size="sm" variant="outline" onClick={() => setQuery("")}>
              Clear
            </Button>
          </div>
        </div>

        <Separator className="my-3 dark:bg-zinc-800" />

        {/* ===== Suggestions (fixed behavior same as SpinnerSidebar) ===== */}
        {showSuggestions && (
          <div className="mb-3">
            <Label className="text-xs text-zinc-600 dark:text-zinc-400">Suggestions</Label>
            <div className="mt-2 grid gap-2 max-h-screen overflow-y-auto">
              {filtered.slice(0,8).map((item) => (
                <button
                      key={item.id}
                      onClick={() => selectChart(item.id)}
                      className={clsx(
                        "flex items-start flex-col gap-3 p-2 cursor-pointer rounded-md w-full text-left transition-colors",
                        selectedId === item.id
                          ? "bg-zinc-600/10 dark:bg-zinc-100/20 text-gray-700 dark:text-zinc-300"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      )}
                    >
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {item.name}
                  </div>
                  <div className="text-xs opacity-60 truncate">{item.description}</div>
                </button>
              ))}

              {filtered.length === 0 && (
                <div className="text-sm opacity-60 p-2">No matches.</div>
              )}
            </div>
          </div>
        )}

        <Separator className="my-3 dark:bg-zinc-800" />

        {/* ===== Grouped Flowcharts ===== */}
        <Label className="text-xs text-zinc-600 dark:text-zinc-400">Grouped</Label>
        <ScrollArea className="max-h-screen overflow-y-auto mt-3 pr-1">
          <div className="space-y-3">
            {Object.entries(grouped).map(([letter, list]) => (
              <div key={letter}>
                <div className="text-xs font-semibold mb-2  flex items-center justify-between text-zinc-600 dark:text-zinc-400">
                  <span>{letter}</span>
                  <span className="text-xs opacity-60">({list.length})</span>
                </div>
                <div className="grid gap-2">
                  {list.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => selectChart(item.id)}
                      className={clsx(
                        "flex items-center gap-3 p-2 cursor-pointer rounded-md w-full text-left transition-colors",
                        selectedId === item.id
                          ? "bg-zinc-600/10 dark:bg-zinc-100/20 text-gray-700 dark:text-zinc-300"
                          : "hover:bg-zinc-100 dark:hover:bg-zinc-800"
                      )}
                    >
                      <div className="flex-1">
                        <div className="font-medium text-sm">{item.name}</div>
                        <div className="text-xs opacity-70">{item.category}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block max-h-screen sticky top-0 w-80">
        {SidebarContent}
      </aside>

      {/* Mobile Sidebar (Sheet) */}
      <div className="lg:hidden fixed top-16 left-1 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <FuturisticMenuButton open={open} onClick={() => setOpen(!open)} />
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-0 w-80  bg-white dark:bg-[#0a0a0a] border-r border-zinc-300 dark:border-zinc-800"
          >
            {SidebarContent}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
