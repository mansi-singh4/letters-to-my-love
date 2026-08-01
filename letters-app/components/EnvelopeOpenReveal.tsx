"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function EnvelopeOpenReveal({
  play,
  onOpened,
  children,
}: {
  play: boolean;
  onOpened: () => void;
  children: React.ReactNode;
}) {
  const [opening, setOpening] = useState(play);

  useEffect(() => {
    if (!play) return;
    const t = setTimeout(() => {
      setOpening(false);
      onOpened();
    }, 1100);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play]);

  if (!play) return <>{children}</>;

  return (
    <AnimatePresence mode="wait">
      {opening ? (
        <motion.div
          key="envelope"
          exit={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.35 }}
          style={{ width: 150, height: 100, margin: "40px auto", position: "relative" }}
        >
          <div className="seal">&#10084;</div>
          <motion.div
            className="env-flap"
            initial={{ rotateX: 0 }}
            animate={{ rotateX: 150 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.4, 1.6, 0.5, 1] }}
            style={{ transformStyle: "preserve-3d" }}
          />
          <div className="env-body" />
        </motion.div>
      ) : (
        <motion.div
          key="letter"
          initial={{ opacity: 0, y: 14, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
