/* ============================================================
 * 404 — Not Found page
 * Design: Alpine Glass / Lime-green brand
 * ============================================================ */

import { Mountain, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="w-20 h-20 rounded-full glass-lime flex items-center justify-center mx-auto mb-6">
          <Mountain size={36} className="text-lime" />
        </div>
        <h1 className="text-6xl font-bold text-lime mb-2 font-sans">404</h1>
        <h2 className="text-xl font-serif text-foreground mb-3">
          Trail Not Found
        </h2>
        <p className="text-muted-foreground text-sm mb-8 max-w-xs mx-auto">
          Looks like you've wandered off the trail. Let's get you back to base camp.
        </p>
        <Button
          onClick={() => setLocation("/")}
          className="bg-lime hover:bg-lime-light text-black font-semibold px-8 py-5 rounded-xl"
        >
          <ArrowLeft size={18} className="mr-2" />
          Back to Explore
        </Button>
      </motion.div>
    </div>
  );
}
