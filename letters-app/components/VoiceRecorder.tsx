"use client";

import { useEffect, useRef, useState } from "react";
import { MAX_RECORDING_SECONDS } from "@/lib/media";
import { showToast } from "@/lib/toast";

function formatElapsed(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VoiceRecorder({
  onComplete,
  onCancel,
}: {
  onComplete: (blob: Blob, durationSeconds: number) => void;
  onCancel: () => void;
}) {
  const [phase, setPhase] = useState<"idle" | "recording">("idle");
  const [elapsed, setElapsed] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval>>();
  // setInterval's closure can't see state updates, so track elapsed time in
  // a ref too and mirror it into state just for the display.
  const elapsedRef = useRef(0);

  useEffect(() => {
    return () => {
      // Always release the mic if the component unmounts mid-recording.
      streamRef.current?.getTracks().forEach((t) => t.stop());
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  async function start() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        streamRef.current?.getTracks().forEach((t) => t.stop());
        if (intervalRef.current) clearInterval(intervalRef.current);
        onComplete(blob, elapsedRef.current);
      };
      recorder.start();
      setPhase("recording");

      elapsedRef.current = 0;
      setElapsed(0);
      intervalRef.current = setInterval(() => {
        elapsedRef.current += 1;
        setElapsed(elapsedRef.current);
        if (elapsedRef.current >= MAX_RECORDING_SECONDS) stop();
      }, 1000);
    } catch {
      showToast("Couldn't access your microphone");
      onCancel();
    }
  }

  function stop() {
    recorderRef.current?.stop();
  }

  function cancel() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    recorderRef.current = null;
    onCancel();
  }

  if (phase === "idle") {
    return (
      <div className="memory-toolbar" style={{ marginTop: 10 }}>
        <button type="button" className="memory-btn" onClick={start}>
          &#127908; Record Voice Note
        </button>
        <button type="button" className="memory-btn" onClick={onCancel}>
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="recording-row">
      <span className="recording-dot" />
      <span>Recording {formatElapsed(elapsed)}</span>
      <button type="button" className="memory-btn" onClick={stop}>
        Stop
      </button>
      <button type="button" className="memory-btn" onClick={cancel}>
        Cancel
      </button>
    </div>
  );
}
