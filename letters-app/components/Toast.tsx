"use client";

import { useEffect, useRef, useState } from "react";

export default function Toast() {
  const [message, setMessage] = useState("");
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    function onToast(e: Event) {
      const detail = (e as CustomEvent<string>).detail;
      setMessage(detail);
      setVisible(true);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setVisible(false), 2200);
    }
    window.addEventListener("app:toast", onToast);
    return () => window.removeEventListener("app:toast", onToast);
  }, []);

  return (
    <div id="toast" className={visible ? "show" : ""}>
      {message}
    </div>
  );
}
