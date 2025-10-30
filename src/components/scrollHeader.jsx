import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Menu } from "lucide-react";

export default function ScrollAwareHeader() {
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // detect scroll direction
  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;

      // hide when scrolling down, show when scrolling up or at top
      if (currentScroll <= 0 || currentScroll < lastScrollY) {
        setShowHeader(true);
      } else {
        setShowHeader(false);
      }

      setLastScrollY(currentScroll);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <AnimatePresence>
      {showHeader && (
        <motion.div
          key="sticky-header"
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 100, damping: 18 }}
          className="
            sticky top-0 z-50 
            w-full 
            backdrop-blur-xl 
            bg-white/70 dark:bg-zinc-900/70
            border-b border-zinc-200/40 dark:border-zinc-700/40 
            shadow-md
          "
        >
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <Menu className="w-5 h-5" />
              <h2 className="text-base font-semibold">Charts</h2>
              <Badge className="ml-2 bg-blue-500/20 text-blue-600 dark:text-blue-300 dark:bg-blue-500/30">
                24
              </Badge>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="dark:border-zinc-700/60 dark:hover:bg-zinc-800/60"
            >
              Sort
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
