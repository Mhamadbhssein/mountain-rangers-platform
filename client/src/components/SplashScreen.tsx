/* ============================================================
 * SplashScreen — App-like loading screen
 * Design: Alpine Glass / Lime-green brand
 * Animated logo reveal with compass loader
 * ============================================================ */

import { motion, AnimatePresence } from "framer-motion";
import { LOGOS } from "@/lib/data";

interface SplashScreenProps {
  show: boolean;
}

export default function SplashScreen({ show }: SplashScreenProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{ background: "oklch(0.08 0.005 250)" }}
        >
          {/* Glow effect */}
          <div
            className="absolute w-64 h-64 rounded-full opacity-10"
            style={{
              background: "oklch(0.82 0.18 120)",
              filter: "blur(80px)",
            }}
          />

          {/* Logo icon */}
          <motion.img
            src={LOGOS.iconWhite}
            alt="Mountain Rangers"
            className="h-20 w-auto relative z-10 mb-6"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />

          {/* Name logo */}
          <motion.img
            src={LOGOS.nameWhite}
            alt="Mountain Rangers"
            className="h-6 w-auto relative z-10 mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
          />

          {/* Loading bar */}
          <motion.div
            className="w-32 h-0.5 bg-white/10 rounded-full overflow-hidden relative z-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <motion.div
              className="h-full rounded-full"
              style={{ background: "oklch(0.82 0.18 120)" }}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 1.2, delay: 0.5, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
