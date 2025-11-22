import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { showToast } from "@/lib/ToastHelper"; // adjust path if needed

export function CopyButton({ text, className = "", onCopied }) {
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCopy = async () => {
    setLoading(true);

    try {
      await navigator.clipboard.writeText(text);

      // small delay to play "loader" animation
      setTimeout(() => {
        setLoading(false);
        setCopied(true);

        showToast("success", "Copied!"); // 🔥 integrated Toast

        onCopied?.();

        // revert after 1.4s
        setTimeout(() => setCopied(false), 1400);
      }, 350);
    } catch (err) {
      setLoading(false);
      showToast("error", "Copy failed");
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleCopy}
      disabled={loading}
      className={`cursor-pointer relative overflow-hidden flex items-center gap-2 rounded-lg ${className}`}
    >
      {/* ICON + TEXT */}
      <motion.div
        initial={false}
        animate={
          loading
            ? { scale: 0.6, opacity: 0.5 }
            : copied
            ? { scale: 1.25 }
            : { scale: 1 }
        }
        transition={{ type: "spring", stiffness: 300 }}
        className="flex items-center gap-2"
      >
        {/* Loader Ripple */}
        {loading && (
          <motion.div
            className="absolute w-3 h-3 rounded-full bg-zinc-400"
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 2.4, opacity: 0 }}
            transition={{ repeat: Infinity, duration: 0.8, ease: "easeOut" }}
          />
        )}

        {!loading && !copied && <Copy />}
        {!loading && copied && <Check className="text-green-500" />}
      </motion.div>

      {loading ? "Copying..." : copied ? "Copied!" : "Copy"}

      {/* 🎉 CONFETTI BURST WHEN COPIED */}
      <AnimatePresence>
        {copied && (
          <motion.div
            className="absolute inset-0 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {[...Array(6)].map((_, i) => (
              <motion.span
                key={i}
                className="absolute w-1 h-1 bg-green-500 rounded-full"
                initial={{ opacity: 1, x: 0, y: 0 }}
                animate={{
                  x: (Math.random() - 0.5) * 40,
                  y: (Math.random() - 0.5) * 40,
                  opacity: 0,
                  scale: 0.2,
                }}
                transition={{ duration: 0.6 }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </Button>
  );
}
