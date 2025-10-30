// src/components/SpinnerList.jsx
import React from "react";
import { SPINNER_LIST } from "../data/spinners";
import { Search, Code, Filter, ChevronDown } from "lucide-react";

/*
  Left sheet: searchable list, suggestions appear only after input focused (controlled by parent),
  quick filters (asc/desc), alphabetical buckets.
*/

export default function SpinnerList({
  items,
  query,
  setQuery,
  onSelect,
  selectedId,
  showSuggestions,
  onFilter,
  filterMode,
  onAlphaBucket,
}) {
  return (
    <div className="h-full">
      <div className="mb-3">
        <div className="relative">
          <input
            placeholder="Search spinners..."
            className="w-full rounded-md bg-black/40 border border-zinc-800 px-3 py-2 focus:outline-none"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => { /* parent will toggle showSuggestions true */}}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <Search size={16} className="text-zinc-400"/>
          </div>
        </div>

        {/* suggestions pop */}
        {showSuggestions && (
          <div className="mt-2 bg-[#070707] border border-zinc-800 rounded p-2 text-sm max-h-48 overflow-auto">
            {items.slice(0, 8).map(it => (
              <button key={it.id} className="w-full text-left py-2 px-2 rounded hover:bg-zinc-900 flex items-center gap-2"
                onClick={() => onSelect(it)}>
                <div className={`w-3 h-3 rounded-full bg-zinc-600`} />
                <div className="flex-1">
                  <div className="text-sm">{it.name}</div>
                  <div className="text-xs text-zinc-500">{it.category}</div>
                </div>
                <div className="text-xs text-zinc-500">{it.id}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <button onClick={() => onFilter("asc")} className={`px-2 py-1 rounded ${filterMode==="asc" ? "bg-zinc-800" : "bg-transparent"} text-sm`}>A→Z</button>
          <button onClick={() => onFilter("desc")} className={`px-2 py-1 rounded ${filterMode==="desc" ? "bg-zinc-800" : "bg-transparent"} text-sm`}>Z→A</button>
          <button onClick={() => onFilter("category")} className={`px-2 py-1 rounded ${filterMode==="category" ? "bg-zinc-800" : "bg-transparent"} text-sm`}>Category</button>
        </div>

        <div className="flex items-center gap-2 text-zinc-400">
          <span className="text-xs">Sort</span>
          <ChevronDown size={14}/>
        </div>
      </div>

      <div className="mb-2 flex gap-2 overflow-x-auto pb-2">
        {"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(letter => (
          <button key={letter} onClick={() => onAlphaBucket(letter)} className="min-w-[34px] px-2 py-1 rounded bg-transparent text-xs text-zinc-400 hover:bg-zinc-900">
            {letter}
          </button>
        ))}
      </div>

      <div className="divide-y divide-zinc-800 overflow-auto h-[calc(100%-220px)] pr-2">
        {items.map(it => (
          <button
            key={it.id}
            onClick={() => onSelect(it)}
            className={`w-full text-left py-3 pr-2 pl-2 hover:bg-zinc-900 flex items-start gap-3 ${selectedId === it.id ? "bg-zinc-900/70 border-l-2 border-zinc-700" : ""}`}
          >
            <div className="w-10 h-10 rounded-md grid place-items-center bg-zinc-800/40">
              <div className="w-3 h-3 rounded-full bg-zinc-500" />
            </div>
            <div className="flex-1">
              <div className="font-medium">{it.name}</div>
              <div className="text-xs text-zinc-500">{it.category}</div>
            </div>
            <div className="text-xs text-zinc-500">{it.id}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
