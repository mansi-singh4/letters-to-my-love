"use client";

import { useRef, useState } from "react";
import {
  MediaKind,
  PendingMedia,
  MAX_ITEMS_PER_LETTER,
  maxBytesFor,
  cloudinaryResourceType,
} from "@/lib/media";
import { showToast } from "@/lib/toast";
import VoiceRecorder from "./VoiceRecorder";

let localIdCounter = 0;
function nextLocalId() {
  localIdCounter += 1;
  return `local-${Date.now()}-${localIdCounter}`;
}

function labelFor(kind: MediaKind) {
  if (kind === "AUDIO") return "voice note";
  if (kind === "VIDEO") return "video";
  return "photo";
}

export default function MediaUploader({
  media,
  onChange,
}: {
  media: PendingMedia[];
  onChange: (media: PendingMedia[]) => void;
}) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);

  const latestMedia = useRef(media);
  latestMedia.current = media;

  function patchItem(localId: string, patch: Partial<PendingMedia>) {
    onChange(latestMedia.current.map((m) => (m.localId === localId ? { ...m, ...patch } : m)));
  }

  function removeItem(localId: string) {
    onChange(media.filter((m) => m.localId !== localId));
  }

  function setCaption(localId: string, caption: string) {
    onChange(media.map((m) => (m.localId === localId ? { ...m, caption } : m)));
  }

  async function uploadBlob(fileOrBlob: Blob, kind: MediaKind, localId: string, durationSeconds?: number) {
    try {
      const sigRes = await fetch("/api/media/upload-signature", { method: "POST" });
      if (!sigRes.ok) {
        const data = await sigRes.json().catch(() => ({}));
        const detail = Array.isArray(data.missing) ? ` (missing: ${data.missing.join(", ")})` : "";
        throw new Error((data.error || "Couldn't authorize upload") + detail);
      }
      const sig = await sigRes.json();

      const form = new FormData();
      form.set("file", fileOrBlob, `${kind.toLowerCase()}-${localId}`);
      form.set("api_key", sig.apiKey);
      form.set("timestamp", String(sig.timestamp));
      form.set("signature", sig.signature);
      form.set("folder", sig.folder);

      const resourceType = cloudinaryResourceType(kind);
      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/${resourceType}/upload`, {
        method: "POST",
        body: form,
      });
      if (!uploadRes.ok) {
        const errBody = await uploadRes.json().catch(() => null);
        const detail = errBody?.error?.message;
        throw new Error(detail ? `Upload failed: ${detail}` : `That ${labelFor(kind)} failed to upload`);
      }
      const result = await uploadRes.json();

      patchItem(localId, {
        status: "done",
        url: result.secure_url,
        publicId: result.public_id,
        duration: durationSeconds ?? (typeof result.duration === "number" ? Math.round(result.duration) : undefined),
      });
    } catch (err) {
      patchItem(localId, { status: "error" });
      showToast(err instanceof Error ? err.message : "Upload failed");
    }
  }

  function addPending(kind: MediaKind, previewUrl: string): string {
    const localId = nextLocalId();
    const item: PendingMedia = { localId, kind, caption: "", status: "uploading", previewUrl };
    onChange([...latestMedia.current, item]);
    return localId;
  }

  function roomLeft() {
    return MAX_ITEMS_PER_LETTER - media.length;
  }

  async function handlePhotoFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = roomLeft();
    if (remaining <= 0) {
      showToast(`You can add up to ${MAX_ITEMS_PER_LETTER} memories per letter`);
      return;
    }
    const selected = Array.from(files).slice(0, remaining);
    if (files.length > remaining) showToast(`Only added ${remaining} \u2014 that's the limit per letter`);

    const maxBytes = maxBytesFor("IMAGE");
    const ok = selected.filter((f) => f.size <= maxBytes);
    if (ok.length < selected.length) showToast("Some photos are over 8MB and won't upload");
    if (ok.length === 0) return;

    setUploading(true);
    await Promise.all(
      ok.map((file) => {
        const localId = addPending("IMAGE", URL.createObjectURL(file));
        return uploadBlob(file, "IMAGE", localId);
      })
    );
    setUploading(false);
  }

  async function handleVideoFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (roomLeft() <= 0) {
      showToast(`You can add up to ${MAX_ITEMS_PER_LETTER} memories per letter`);
      return;
    }
    const file = files[0];
    const maxBytes = maxBytesFor("VIDEO");
    if (file.size > maxBytes) {
      showToast(`That video is over ${Math.round(maxBytes / (1024 * 1024))}MB \u2014 try a shorter clip`);
      return;
    }

    setUploading(true);
    const localId = addPending("VIDEO", URL.createObjectURL(file));
    await uploadBlob(file, "VIDEO", localId);
    setUploading(false);
  }

  async function handleVoiceComplete(blob: Blob, durationSeconds: number) {
    setRecording(false);
    if (roomLeft() <= 0) {
      showToast(`You can add up to ${MAX_ITEMS_PER_LETTER} memories per letter`);
      return;
    }
    if (blob.size > maxBytesFor("AUDIO")) {
      showToast("That recording is too long \u2014 try a shorter one");
      return;
    }
    const localId = addPending("AUDIO", URL.createObjectURL(blob));
    await uploadBlob(blob, "AUDIO", localId, durationSeconds);
  }

  return (
    <div>
      {!recording && (
        <div className="memory-toolbar">
          <button
            type="button"
            className="memory-btn"
            onClick={() => photoInputRef.current?.click()}
            disabled={uploading || roomLeft() <= 0}
          >
            &#128247; Add Photos
          </button>
          <button
            type="button"
            className="memory-btn"
            onClick={() => setRecording(true)}
            disabled={uploading || roomLeft() <= 0}
          >
            &#127908; Voice Note
          </button>
          <button
            type="button"
            className="memory-btn"
            onClick={() => videoInputRef.current?.click()}
            disabled={uploading || roomLeft() <= 0}
          >
            &#127909; Add Video
          </button>
          {media.length > 0 && (
            <span className="photo-count-pill">
              {media.length}/{MAX_ITEMS_PER_LETTER} memories
            </span>
          )}
        </div>
      )}

      {recording && (
        <VoiceRecorder onComplete={handleVoiceComplete} onCancel={() => setRecording(false)} />
      )}

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={(e) => {
          handlePhotoFiles(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept="video/*"
        hidden
        onChange={(e) => {
          handleVideoFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {media.length > 0 && (
        <div className="photo-tray">
          {media.map((m) => (
            <div
              className={"photo-thumb" + (m.kind === "AUDIO" ? " audio-thumb" : m.kind === "VIDEO" ? " video-thumb" : "")}
              key={m.localId}
            >
              {m.kind === "IMAGE" && <img src={m.url || m.previewUrl} alt="" />}
              {m.kind === "VIDEO" && <video src={m.url || m.previewUrl} muted />}
              {m.kind === "AUDIO" && m.status === "done" && <audio src={m.url} controls />}
              {m.kind === "AUDIO" && m.status !== "done" && <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>&#127908; Voice note</div>}

              {m.status === "uploading" && <div className="thumb-status">Uploading&hellip;</div>}
              {m.status === "error" && <div className="thumb-status">Failed</div>}

              <button type="button" className="thumb-remove" onClick={() => removeItem(m.localId)} aria-label="Remove">
                &times;
              </button>

              {m.status === "done" && (
                <input
                  type="text"
                  className="thumb-caption"
                  placeholder="Add a caption\u2026"
                  value={m.caption}
                  onChange={(e) => setCaption(m.localId, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
