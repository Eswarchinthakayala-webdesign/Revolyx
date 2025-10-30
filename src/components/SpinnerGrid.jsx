import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function SpinnerGrid({ filtered, handleSelectSpinner, renderSpinnerThumbnail }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full"
    >
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4  gap-4">
        {filtered.map((s, i) => (
          <motion.div
            key={s.key}
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.35, ease: "easeOut" }}
          >
            <Card
              onClick={() => handleSelectSpinner(s.key)}
              className={cn(
                "group cursor-pointer rounded-2xl border transition-all duration-300 hover:shadow-lg hover:scale-[1.03]",
                "bg-white/80 backdrop-blur-sm border-zinc-200",
                "dark:bg-gradient-to-br dark:from-zinc-900 dark:to-zinc-950 dark:border-zinc-800",
                "hover:border-zinc-400 dark:hover:border-zinc-600"
              )}
            >
              <CardContent className="p-4 flex flex-col items-center justify-center gap-3">
                {/* Spinner preview */}
                <div className="w-full h-20 flex items-center justify-center relative">
                  <motion.div
                    whileHover={{ rotate: 2, scale: 1.02 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center justify-center w-full"
                  >
                    {renderSpinnerThumbnail(s.key)}
                  </motion.div>

                  {/* Subtle glowing ring effect */}
                  <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="absolute inset-0 rounded-xl blur-lg bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 dark:from-cyan-500/10 dark:to-fuchsia-500/10" />
                  </div>
                </div>

                {/* Spinner name */}
                <motion.div
                  className="text-xs font-medium text-center text-zinc-700 dark:text-zinc-300 group-hover:text-zinc-900 dark:group-hover:text-white transition-colors"
                  whileHover={{ scale: 1.05 }}
                >
                  {s.title}
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
