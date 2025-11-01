"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  Menu,
  Search,
  SortAsc,
  SortDesc,
  Layers,
  ListFilter,
} from "lucide-react";
import clsx from "clsx";
import { motion } from "framer-motion";

export default function DesignSidebar({
  filtered = [],
  selected,
  handleSelect,
  search,
  setSearch,
  sortAsc,
  setSortAsc,
}) {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [open, setOpen] = useState(false);
  const inputRef = useRef();

  const sorted = [...filtered].sort((a, b) =>
    sortAsc
      ? a.name.localeCompare(b.name)
      : b.name.localeCompare(a.name)
  );

  const SidebarContent = (
    <Card className="h-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#0a0a0a] shadow-xl">
      <CardHeader className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-30 backdrop-blur-md border-b border-zinc-200/50 dark:border-zinc-700/50">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <ListFilter className="w-4 h-4" />
            All Designs
          </span>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="dark:bg-zinc-800 dark:text-zinc-100">
              {filtered.length}
            </Badge>

            {/* Sort Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="dark:border-zinc-700 cursor-pointer dark:bg-zinc-900 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  {sortAsc ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem className="cursor-pointer" onClick={() => setSortAsc(true)}>
                  A → Z
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => setSortAsc(false)}>
                  Z → A
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="overflow-hidden">
        {/* Search with Suggestions */}
        <div className="sticky top-0 z-20 py-2 bg-white dark:bg-[#0a0a0a]">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-500" />
            <Input
              ref={inputRef}
              placeholder="Search designs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              className="pl-8 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
            />
          </div>

          {/* Suggestions dropdown */}
          {showSuggestions && search && (
            <ScrollArea className="mt-2 border border-zinc-200 dark:border-zinc-700 max-h-[40vh] overflow-y-auto rounded-md">
              <motion.div
                className="p-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {sorted
                  .filter((d) =>
                    d.name.toLowerCase().includes(search.toLowerCase())
                  )
                  .slice(0, 10)
                  .map((d) => (
                    <button
                      key={d.id}
                      className={clsx(
                        "w-full text-left px-3 py-2 rounded-md cursor-pointer transition-colors",
                        "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                        selected?.id === d.id
                          ? "bg-zinc-200 dark:bg-zinc-700"
                          : ""
                      )}
                      onClick={() => handleSelect(d)}
                    >
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">
                        {d.name}
                      </div>
                      {d.category && (
                        <div className="text-xs text-zinc-500 dark:text-zinc-400">
                          {d.category}
                        </div>
                      )}
                    </button>
                  ))}
              </motion.div>
            </ScrollArea>
          )}
        </div>

        <Separator className="my-3 dark:bg-zinc-700" />

        {/* All Designs list */}
        <ScrollArea className="h-[75vh] pr-1">
          <div className="space-y-3">
            {sorted.map((design) => (
              <button
                key={design.id}
                onClick={() => handleSelect(design)}
                className={clsx(
                  "flex items-center cursor-pointer w-full px-3 py-2 rounded-md transition-all",
                  "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                  selected?.id === design.id
                    ? "bg-zinc-200 dark:bg-zinc-700"
                    : ""
                )}
              >
                <Layers className="w-4 h-4 mr-2 text-zinc-500 dark:text-zinc-300" />
                <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100">
                  {design.name}
                </span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block max-h-screen sticky top-0">
        {SidebarContent}
      </aside>

      {/* Mobile Sheet */}
      <div className="lg:hidden fixed top-16 left-1 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700"
              onClick={() => setOpen(!open)}
            >
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="p-0 w-80 bg-white dark:bg-[#0a0a0a] border-r border-zinc-300 dark:border-zinc-700 overflow-y-auto"
          >
            {SidebarContent}
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
