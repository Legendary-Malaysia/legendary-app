import { motion, AnimatePresence } from "framer-motion";
import { Loader2 } from "lucide-react";

export function StatusMessage({ status }: { status: string }) {
  return (
    <AnimatePresence mode="wait">
      {status && (
        <motion.div
          key={status}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -5 }}
          className="bg-muted text-muted-foreground mr-auto flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm shadow-sm"
        >
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>{status}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
