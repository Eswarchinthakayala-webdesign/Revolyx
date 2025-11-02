"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { CodeBlock as CodeBlockPrimitive } from "@/components/animate-ui/primitives/animate/code-block";
import { cn } from "@/lib/utils";
import { CopyButton } from "@/components/animate-ui/components/buttons/copy";
import { getStrictContext } from "@/lib/get-strict-context";

// Context
const [CodeProvider, useCode] = getStrictContext("CodeContext");

// 🧱 Wrapper: provides `code` context and base surface
function Code({ className, code, ...props }) {
  return (
    <CodeProvider value={{ code }}>
      <div
        className={cn(
          "relative flex flex-col overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/60 backdrop-blur-md",
          className
        )}
        {...props}
      />
    </CodeProvider>
  );
}

// 🧩 Header bar with optional icon + copy button
function CodeHeader({ className, children, icon: Icon, copyButton = false, ...props }) {
  const { code } = useCode();

  return (
    <div
      className={cn(
        "flex items-center text-sm text-zinc-500 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/40 px-4 h-10 gap-2",
        className
      )}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 opacity-70" />}
      <span className="truncate">{children}</span>
      {copyButton && (
        <CopyButton
          content={code}
          size="xs"
          variant="ghost"
          className="ml-auto w-auto h-auto p-2 -mr-2"
        />
      )}
    </div>
  );
}

// 💡 Code block (syntax highlight + optional typing cursor)
function CodeBlock({ cursor = false, className, ...props }) {
  const {theme}=useTheme()
     const isDark =
      theme === "dark" ||
      (theme === "system" &&
        window.matchMedia("(prefers-color-scheme: dark)").matches);
  const { code } = useCode();
  const scrollRef = React.useRef(null);

  return (
    <CodeBlockPrimitive
      ref={scrollRef}
      // ✅ fix: correct theme selection
      theme={isDark? "dark" : "light"}
      scrollContainerRef={scrollRef}
      code={code}
      className={cn(
        "relative text-sm p-4 overflow-auto font-mono leading-relaxed",
        "[&>pre,_&_code]:!bg-transparent [&>pre,_&_code]:border-none",
        "[&_code]:!text-[13px] [&_code_.line]:!px-0",
        cursor &&
          "data-[done=false]:[&_.line:last-of-type::after]:content-['|'] data-[done=false]:[&_.line:last-of-type::after]:inline-block data-[done=false]:[&_.line:last-of-type::after]:animate-pulse",
        className
      )}
      {...props}
    />
  );
}

export { Code, CodeHeader, CodeBlock };
