"use client";

import { useRef, useState } from "react";
import { MAX_IMAGE_BYTES, MAX_PHOTOS_PER_LETTER, PendingPhoto } from "@/lib/media";
import { showToast } from "@/lib/toast";

let localIdCounter = 0;
function nextLocalId() {
  localIdCounter += 1;
  return `local-${Date.now()}-${localIdCounter}`;
}

export default function MediaUploader({
  photos,
  onChange,
}: {
  photos: PendingPhoto[];
  onChange: (photos: PendingPhoto[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  // Uploads run concurrently via Promise.all, so a closure over the
  // `photos` prop from the moment handleFiles was called would go stale as
  // sibling uploads finish first. Always resolve updates against the
  // latest array via this ref instead.
  const latestPhotos = useRef(photos);
  latestPhotos.current = photos;

  function patchPhoto(localId: string, patch: Partial<PendingPhoto>) {
    onChange(latestPhotos.current.map((p) => (p.localId === localId ? { ...p, ...patch } : p)));
  }

  function removePhoto(localId: string) {
    onChange(photos.filter((p) => p.localId !== localId));
  }

  function setCaption(localId: string, caption: string) {
    onChange(photos.map((p) => (p.localId === localId ? { ...p, caption } : p)));
  }

  async function uploadOne(file: File, localId: string) {
    try {
      const sigRes = await fetch("/api/media/upload-signature", { method: "POST" });
      if (!sigRes.ok) {
        const data = await sigRes.json().catch(() => ({}));
        throw new Error(data.error || "Couldn't authorize upload");
      }
      const sig = await sigRes.json();

      const form = new FormData();
      form.set("file", file);
      form.set("api_key", sig.apiKey);
      form.set("timestamp", String(sig.timestamp));
      form.set("signature", sig.signature);
      form.set("folder", sig.folder);

      const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
        method: "POST",
        body: form,
      });
      if (!uploadRes.ok) throw new Error("Upload failed");
      const result = await uploadRes.json();

      patchPhoto(localId, { status: "done", url: result.secure_url, publicId: result.public_id });
    } catch (err) {
      patchPhoto(localId, { status: "error" });
      showToast(err instanceof Error ? err.message : "A photo failed to upload");
    }
  }

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const remaining = MAX_PHOTOS_PER_LETTER - photos.length;
    if (remaining <= 0) {
      showToast(`You can add up to ${MAX_PHOTOS_PER_LETTER} photos per letter`);
      return;
    }

    const selected = Array.from(files).slice(0, remaining);
    if (files.length > remaining) {
      showToast(`Only added ${remaining} \u2014 that's the limit per letter`);
    }

    const tooBig = selected.filter((f) => f.size > MAX_IMAGE_BYTES);
    const ok = selected.filter((f) => f.size <= MAX_IMAGE_BYTES);
    if (tooBig.length > 0) {
      showToast(`${tooBig.length > 1 ? "Some photos are" : "That photo is"} over 8MB and won't upload`);
    }
    if (ok.length === 0) return;

    const pending: PendingPhoto[] = ok.map((file) => ({
      localId: nextLocalId(),
      caption: "",
      status: "uploading",
      previewUrl: URL.createObjectURL(file),
    }));
    onChange([...photos, ...pending]);
    setUploading(true);
    await Promise.all(ok.map((file, i) => uploadOne(file, pending[i].localId)));
    setUploading(false);
  }

  return (
    <div>
      <div className="memory-toolbar">
        <button
          type="button"
          className="memory-btn"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || photos.length >= MAX_PHOTOS_PER_LETTER}
        >
          &#128247; Add Photos
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          hidden
          onChange={(e) => {
            handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
        {photos.length > 0 && (
          <span className="photo-count-pill">
            {photos.length}/{MAX_PHOTOS_PER_LETTER} photos
          </span>
        )}
      </div>

      {photos.length > 0 && (
        <div className="photo-tray">
          {photos.map((p) => (
            <div className="photo-thumb" key={p.localId}>
              <img src={p.url || p.previewUrl} alt="" />
              {p.status === "uploading" && <div className="thumb-status">Uploading&hellip;</div>}
              {p.status === "error" && <div className="thumb-status">Failed</div>}
              <button type="button" className="thumb-remove" onClick={() => removePhoto(p.localId)} aria-label="Remove photo">
                &times;
              </button>
              {p.status === "done" && (
                <input
                  type="text"
                  className="thumb-caption"
                  placeholder="Add a caption\u2026"
                  value={p.caption}
                  onChange={(e) => setCaption(p.localId, e.target.value)}
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
