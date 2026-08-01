"use client";

import { motion, AnimatePresence } from "framer-motion";

export default function SendingOverlay({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.15)",
            backdropFilter: "blur(3px)",
          }}
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{ width: 150, height: 100, position: "relative" }}
          >
            <div className="seal">&#10084;</div>
            <motion.div
              className="env-flap"
              initial={{ rotateX: 150 }}
              animate={{ rotateX: 0 }}
              transition={{ duration: 0.6, delay: 0.2, ease: [0.4, 1.6, 0.5, 1] }}
              style={{ transformStyle: "preserve-3d" }}
            />
            <div className="env-body" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
