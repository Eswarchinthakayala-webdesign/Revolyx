import React, { forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import clsx from "clsx";

/**
 * ✅ Custom Toaster Implementation
 * Supports custom icons, themes, per-type colors, and animations.
 */

const typeStyles = {
  success: "bg-green-500/10 border-green-500/40 text-green-400",
  error: "bg-red-500/10 border-red-500/40 text-red-400",
  warning: "bg-yellow-500/10 border-yellow-500/40 text-yellow-400",
  info: "bg-blue-500/10 border-blue-500/40 text-blue-400",
  loading: "bg-gray-500/10 border-gray-500/40 text-gray-300",
  default: "bg-zinc-800/40 border-zinc-700/60 text-zinc-200",
  custom: "bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 border-indigo-400/30 text-white",
};

const defaultIcons = {
  success: <span>✅</span>,
  error: <span>❌</span>,
  warning: <span>⚠️</span>,
  info: <span>ℹ️</span>,
  loading: <span>⏳</span>,
  custom: <span>✨</span>,
};

const Toast = ({
  id,
  title,
  description,
  type = "default",
  icon,
  onDismiss,
  classNames = {},
  style,
  action,
  cancel,
  closeButton = true,
  richColors = true,
}) => {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 25, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      className={clsx(
        "relative flex w-full max-w-sm p-4 rounded-2xl border shadow-lg backdrop-blur-md transition-all duration-200",
        richColors ? typeStyles[type] : "bg-zinc-900/90 border-zinc-700 text-zinc-200",
        classNames.toast
      )}
      style={style}
    >
      <div className="flex items-start gap-3">
        <div className={clsx("text-xl", classNames.icon)}>
          {icon || defaultIcons[type] || defaultIcons.default}
        </div>
        <div className="flex flex-col flex-1">
          {title && (
            <div className={clsx("font-semibold text-sm", classNames.title)}>
              {typeof title === "function" ? title() : title}
            </div>
          )}
          {description && (
            <div className={clsx("text-xs opacity-90 mt-0.5", classNames.description)}>
              {typeof description === "function" ? description() : description}
            </div>
          )}
          {(action || cancel) && (
            <div className="flex gap-2 mt-2">
              {cancel && (
                <button
                  className={clsx(
                    "px-2 py-1 text-xs rounded-lg border border-zinc-700 hover:bg-zinc-700/40 transition",
                    classNames.cancelButton
                  )}
                  onClick={cancel.onClick}
                >
                  {cancel.label}
                </button>
              )}
              {action && (
                <button
                  className={clsx(
                    "px-2 py-1 text-xs rounded-lg font-semibold bg-white/10 hover:bg-white/20 transition",
                    classNames.actionButton
                  )}
                  onClick={action.onClick}
                >
                  {action.label}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {closeButton && (
        <button
          onClick={() => onDismiss?.(id)}
          className={clsx(
            "absolute top-2 right-2 text-zinc-400 hover:text-white transition",
            classNames.closeButton
          )}
        >
          <X size={14} />
        </button>
      )}
    </motion.div>
  );
};

const CustomToaster = forwardRef(
  (
    {
      position = "top-right",
      toasts = [],
      className,
      defaultClassNames = {},
      globalStyle,
      offset = 16,
      gap = 10,
      icons = {},
      theme = "dark",
      containerAriaLabel = "Notifications",
    },
    ref
  ) => {
    const positions = {
      "top-left": "top-4 left-4",
      "top-right": "top-4 right-4",
      "bottom-left": "bottom-4 left-4",
      "bottom-right": "bottom-4 right-4",
      "top-center": "top-4 left-1/2 -translate-x-1/2",
      "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
    };

    return (
      <div
        ref={ref}
        aria-label={containerAriaLabel}
        className={clsx(
          "fixed z-[9999] flex flex-col pointer-events-none",
          positions[position],
          className
        )}
        style={{ gap, ...globalStyle }}
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              {...toast}
              icon={toast.icon || icons[toast.type] || defaultIcons[toast.type]}
              classNames={{ ...defaultClassNames, ...toast.classNames }}
              onDismiss={toast.onDismiss}
            />
          ))}
        </AnimatePresence>
      </div>
    );
  }
);

CustomToaster.displayName = "CustomToaster";

export default CustomToaster;
