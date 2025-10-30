// src/components/SpinnerPreview.jsx
import React, { useMemo } from "react";
import * as All from "./AllSpinners";

/*
  Renders the selected spinner component with controls:
  - size slider
  - color theme applied via color value
  - shows source code (from mapping) and copy button
*/

export default function SpinnerPreview({ spinnerDef, size, color, onCopy, showCode }) {
  const SpinnerComponent = spinnerDef ? All[spinnerDef.component] : null;
  const source = useMemo(() => {
    // We'll try to present the component's source as a string. For simplicity, we store textual templates in spinnerDef.source in the main page.
    return spinnerDef?.source || `// source not available for ${spinnerDef?.name}`;
  }, [spinnerDef]);

  if (!spinnerDef) {
    return (
      <div className="h-full flex items-center justify-center text-zinc-400">
        Pick a spinner from the left to preview
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-6 bg-transparent border border-zinc-800/40">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-2xl font-semibold">{spinnerDef.name}</h2>
            <p className="text-sm text-zinc-400">{spinnerDef.category} • {spinnerDef.id}</p>
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm text-zinc-400">Size</label>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
          <div className="flex-0 grid place-items-center p-4 rounded-lg bg-black/40 border border-zinc-800" style={{ minWidth: 180 }}>
            {SpinnerComponent ? <SpinnerComponent size={size} color={color} /> : null}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-3">
              <div className="text-sm text-zinc-400">Color</div>
              <div className="w-8 h-8 rounded-full ring-1 ring-white/10" style={{ background: color }} />
              <div className="text-sm text-zinc-300">{color}</div>
            </div>
            <div className="flex items-center gap-3">
              <input type="range" min="16" max="220" value={size} readOnly className="w-full pointer-events-none opacity-0" />
              <div className="text-xs text-zinc-500">Use the slider on the page to change size</div>
            </div>
            <div className="flex gap-2">
              <button onClick={onCopy} className="inline-flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-700 rounded text-sm hover:bg-zinc-800">
                Copy Source
              </button>
              <a className="inline-flex items-center gap-2 px-3 py-2 bg-transparent border border-zinc-800 rounded text-sm text-zinc-300" href="#" onClick={(e)=>e.preventDefault()}>
                View in sandbox
              </a>
            </div>
          </div>
        </div>
      </div>

      {showCode ? (
        <pre className="rounded-lg p-4 bg-[#0b0b0b] border border-zinc-800 overflow-auto text-sm">
          <code>{source}</code>
        </pre>
      ) : null}
    </div>
  );
}
