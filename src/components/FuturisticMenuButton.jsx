import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";

export function FuturisticMenuButton({ open, onClick }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Button
        onClick={onClick}
        variant="outline"
        size="icon"
        className={`
          relative overflow-hidden group
          dark:bg-gradient-to-b dark:from-zinc-900 dark:to-black
          bg-gradient-to-b from-white to-zinc-100
          border border-zinc-400/50 dark:border-zinc-700/60
          hover:border-transparent
          transition-all duration-300
          rounded-xl
          shadow-md hover:shadow-xl
        `}
      >
        {/* animated background ring */}
        <motion.div
          className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 via-violet-500 to-fuchsia-500 opacity-0 group-hover:opacity-100 blur-sm"
          initial={false}
          animate={{ opacity: open ? 0.8 : 0 }}
          transition={{ duration: 0.4 }}
        />

        {/* glowing inner ring */}
        <div className="absolute inset-[2px] rounded-lg bg-white dark:bg-black z-0" />

        {/* icon */}
        <motion.div
          className="relative z-10 flex cursor-pointer items-center justify-center text-zinc-800 dark:text-zinc-100"
          initial={{ rotate: 0 }}
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
        >
          {open ? (
            <X className="w-5 h-5 text-black dark:text-white" />
          ) : (
            <Menu className="w-5 h-5 text-black dark:text-white" />
          )}
        </motion.div>
      </Button>
    </motion.div>
  );
}
