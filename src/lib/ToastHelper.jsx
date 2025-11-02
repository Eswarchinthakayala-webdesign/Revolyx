import { toast } from "sonner";
import React from "react";
import {
  CheckCircle2,
  XCircle,
  Info,
  AlertTriangle,
} from "lucide-react";

/**
 * Elegant theme-aware toast system using zinc tones and Lucide icons.
 * Automatically adapts to dark/light themes.
 */
export const showToast = (
  type = "info",
  message = "",
  duration = 2500,
  description = ""
) => {
  const currentTheme =
    typeof window !== "undefined" &&
    document.documentElement.classList.contains("dark")
      ? "dark"
      : "light";

  const isDark = currentTheme === "dark";

  // 🎨 Theme palette (zinc + subtle accent)
  const theme = {
    bg: isDark ? "bg-zinc-900/80" : "bg-white/90",
    border: isDark ? "border-zinc-800" : "border-zinc-200",
    text: isDark ? "text-zinc-100" : "text-zinc-900",
    subtext: isDark ? "text-zinc-400" : "text-zinc-600",
    shadow: isDark
      ? "shadow-[0_0_25px_rgba(255,255,255,0.03)]"
      : "shadow-[0_0_25px_rgba(0,0,0,0.05)]",
  };

  // 💬 Type settings
  const iconMap = {
    success: { icon: <CheckCircle2 className="w-5 h-5 text-zinc-400" />, color: "#a1a1aa" },
    error: { icon: <XCircle className="w-5 h-5 text-zinc-400" />, color: "#a1a1aa" },
    info: { icon: <Info className="w-5 h-5 text-zinc-400" />, color: "#a1a1aa" },
    warning: { icon: <AlertTriangle className="w-5 h-5 text-zinc-400" />, color: "#a1a1aa" },
  };

  const icon = iconMap[type]?.icon || iconMap.info.icon;
  const progressColor = isDark ? "#71717a" : "#a3a3a3";

  // ✨ Toast component
  toast.custom(
    () =>
      React.createElement(
        "div",
        {
          className: `
            group flex flex-col gap-2 border ${theme.border} ${theme.bg} ${theme.shadow}
            px-4 py-3 rounded-xl transition-all duration-300
            backdrop-blur-md w-[300px]
            hover:scale-[1.02] hover:shadow-lg
          `,
        },
        // Header with icon + message
        React.createElement(
          "div",
          { className: "flex items-center gap-3" },
          icon,
          React.createElement(
            "div",
            { className: "flex-1" },
            React.createElement(
              "p",
              {
                className: `font-medium text-sm leading-tight ${theme.text}`,
              },
              message
            ),
            description &&
              React.createElement(
                "p",
                {
                  className: `text-xs mt-1 ${theme.subtext}`,
                },
                description
              )
          )
        ),

        // Progress bar
        React.createElement(
          "div",
          {
            className:
              "h-[3px] rounded-full overflow-hidden bg-zinc-700/20 dark:bg-zinc-800/50 mt-1",
          },
          React.createElement("div", {
            className: "h-full rounded-full",
            style: {
              backgroundColor: progressColor,
              animation: `shrink ${duration}ms linear forwards`,
            },
          })
        )
      ),
    { duration }
  );
};

// 👇 Add this once in your global CSS
// (e.g., in globals.css or tailwind.css)
// For progress bar animation
/*
@keyframes shrink {
  from { width: 100%; }
  to { width: 0%; }
}
*/
