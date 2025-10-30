// IconSidebar.jsx
"use client";

import { useState } from "react";
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
  ListFilter,
} from "lucide-react";
import clsx from "clsx";
import { motion } from "framer-motion";
import { FuturisticMenuButton } from "./FuturisticMenuButton";

/**
 * IconSidebar
 *
 * Props expected (based on your icon page snippet):
 *
 *  currentPage, totalPages,
 *  paginatedIcons, usableIcons,
 *  selectedIconKey, handleSelectIcon,
 *  searchTerm, setSearchTerm,
 *  showSuggestions, setShowSuggestions,
 *  setSortMode,            // setter function from parent (optional)
 *  goToPage,
 *  inputRef,               // forwarded ref for input focus control
 *  renderThumbnail,        // function(item) => JSX for icon preview
 *
 * All props are optional (defaults provided) so component won't crash if used stand-alone.
 */
export default function IconSidebar({
  currentPage = 1,
  totalPages = 1,
  paginatedIcons = [], // icons for the current page (array of string names)
  usableIcons = [], // full list of icon names
  selectedIconKey = null,
  handleSelectIcon = () => {},

  searchTerm = "",
  setSearchTerm = () => {},
  showSuggestions = false,
  setShowSuggestions = () => {},

  setSortMode: parentSetSortMode = null, // optional setter from parent
  goToPage = () => {},
  inputRef = null,
  renderThumbnail = () => null,
}) {
  // local sortMode if parent doesn't provide a setter (keeps UI consistent)
  const [sortModeLocal, setSortModeLocal] = useState("asc");
  const [open, setOpen] = useState(false); // mobile sheet open

  // choose which sortMode to show and change: always maintain local state,
  // and also call parent setter if provided.
  const sortMode = sortModeLocal;
  function setSortMode(mode) {
    setSortModeLocal(mode);
    if (typeof parentSetSortMode === "function") parentSetSortMode(mode);
  }

  // Count to show in header badge: show number of icons in current page (mirrors snippet)
  const pageCount = Array.isArray(paginatedIcons) ? paginatedIcons.length : 0;

  const SidebarContent = (
    <Card className="h-full border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#0a0a0a] shadow-xl">
      <CardHeader className="sticky top-0 bg-white dark:bg-[#0a0a0a] z-30 backdrop-blur-md border-b border-zinc-200/50 dark:border-zinc-700/50">
        <CardTitle className="flex items-center justify-between">
          <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <ListFilter className="w-4 h-4" />
            Icons (page {currentPage})
          </span>

          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="dark:bg-zinc-800 dark:text-zinc-100">
              {pageCount}
            </Badge>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="dark:border-zinc-700 cursor-pointer dark:bg-zinc-900 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  {sortMode === "asc" ? <SortAsc className="w-4 h-4" /> : <SortDesc className="w-4 h-4" />}
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent align="end">
                <DropdownMenuItem className="cursor-pointer" onClick={() => setSortMode("asc")}>
                  A → Z
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => setSortMode("desc")}>
                  Z → A
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="overflow-hidden">
        {/* Search Bar */}
        <div className="sticky top-0 z-20 py-2 bg-white dark:bg-[#0a0a0a]">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 w-4 h-4 text-zinc-500" />
            <Input
              ref={inputRef}
              placeholder="Search icons (click to show suggestions)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              className="pl-8 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-100"
            />
          </div>

          {showSuggestions && (
            <ScrollArea className="mt-2 border border-zinc-200 dark:border-zinc-700 max-h-screen overflow-y-auto rounded-md ">
              <motion.div
                className="p-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {usableIcons
                  .filter((n) => n.toLowerCase().includes(searchTerm.toLowerCase()) || searchTerm === "")
                  .slice(0, 100)
                  .map((name) => (
                    <button
                      key={name}
                      className={clsx(
                        "w-full text-left  cursor-pointer px-3 py-2 rounded-md transition-colors",
                        "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                        selectedIconKey === name ? "bg-zinc-200 dark:bg-zinc-700" : ""
                      )}
                      onClick={() => handleSelectIcon(name)}
                    >
                      <div className="font-medium text-zinc-900 dark:text-zinc-100">{name}</div>
                      <div className="text-xs opacity-70">{name}</div>
                    </button>
                  ))}

                {usableIcons.filter((n) => n.toLowerCase().includes(searchTerm.toLowerCase()) || searchTerm === "").length === 0 && (
                  <div className="text-sm opacity-60 p-2">No icons match.</div>
                )}
              </motion.div>
            </ScrollArea>
          )}
        </div>

        <Separator className="my-3 dark:bg-zinc-700" />

        {/* Grouped icons by first letter for current page (mirrors your code) */}
        <ScrollArea className="h-[75vh] pr-1">
          <div className="space-y-3">
            {(() => {
              const groups = {};
              (Array.isArray(paginatedIcons) ? paginatedIcons : []).forEach((n) => {
                const letter = (n && n[0]) ? n[0].toUpperCase() : "#";
                if (!groups[letter]) groups[letter] = [];
                groups[letter].push(n);
              });

              // sort group letters
              const ordered = Object.entries(groups).sort(([a], [b]) => {
                return sortMode === "asc" ? a.localeCompare(b) : b.localeCompare(a);
              });

              return ordered.map(([letter, group]) => (
                <div key={letter}>
                  <div className="text-xs font-semibold text-zinc-400 mb-1 uppercase tracking-wider">
                    {letter}
                  </div>
                  <div className="space-y-1">
                    {group.slice(0, 12).map((item) => (
                      <button
                        key={item}
                        onClick={() => handleSelectIcon(item)}
                        className={clsx(
                          "flex items-center cursor-pointer w-full px-3 py-2 rounded-md transition-all",
                          "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                          selectedIconKey === item ? "bg-zinc-200 dark:bg-zinc-700" : ""
                        )}
                      >
                        <div className="w-10 h-8 flex items-center justify-center">
                          {typeof renderThumbnail === "function" ? renderThumbnail(item) : null}
                        </div>

                        <span className="font-medium text-sm text-zinc-900 dark:text-zinc-100 ml-2">
                          {item}
                        </span>

                        <span className="ml-auto text-xs opacity-60">open</span>
                      </button>
                    ))}
                  </div>
                </div>
              ));
            })()}
          </div>
        </ScrollArea>

        {/* Pagination controls (mirrors your pasted code) */}
        <div className="mt-3 flex items-center gap-2">
          <Button size="sm" className='cursor-pointer' onClick={() => goToPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
            Prev
          </Button>
          <div className="text-sm px-2">Page {currentPage}/{totalPages}</div>
          <Button size="sm" className="cursor-pointer" onClick={() => goToPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
            Next
          </Button>
        </div>
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
      <div className="lg:hidden fixed  top-14 left-1 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <FuturisticMenuButton open={open} onClick={() => setOpen(!open)} />
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
