export type MediaKind = "IMAGE" | "AUDIO" | "VIDEO";

export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB per photo
export const MAX_AUDIO_BYTES = 15 * 1024 * 1024; // 15MB per voice note
export const MAX_VIDEO_BYTES = 50 * 1024 * 1024; // 50MB per video
export const MAX_ITEMS_PER_LETTER = 12; // combined cap across photos/voice/video
export const MAX_RECORDING_SECONDS = 5 * 60; // auto-stop a voice recording at 5 minutes

export function maxBytesFor(kind: MediaKind) {
  if (kind === "AUDIO") return MAX_AUDIO_BYTES;
  if (kind === "VIDEO") return MAX_VIDEO_BYTES;
  return MAX_IMAGE_BYTES;
}

// Cloudinary categorizes both audio and video files under its "video"
// resource type (it processes audio through the same pipeline) - only
// plain images use the "image" endpoint.
export function cloudinaryResourceType(kind: MediaKind): "image" | "video" {
  return kind === "IMAGE" ? "image" : "video";
}

export type PendingMedia = {
  kind: MediaKind;
  // Present once uploaded to Cloudinary; absent while still uploading.
  url?: string;
  publicId?: string;
  duration?: number; // seconds - audio/video only
  caption: string;
  // Local-only id to key React lists and track upload progress before a
  // real publicId exists.
  localId: string;
  status: "uploading" | "done" | "error";
  previewUrl: string; // object URL for instant local preview
  // Set only for media that already existed on the letter (edit mode) -
  // lets us tell "remove this" (delete on server) apart from "never
  // finished uploading" (just drop it locally).
  existingId?: string;
};

export type IncomingMedia = {
  url: string;
  publicId: string;
  type: MediaKind;
  caption?: string | null;
  duration?: number | null;
};

const VALID_KINDS = new Set(["IMAGE", "AUDIO", "VIDEO"]);

// Shared by the create and edit letter routes: validates the shape of
// client-submitted media entries and caps how many can be attached in one
// request. Never trusts `type` blindly - anything outside the enum is
// dropped rather than passed through to Prisma.
export function parseIncomingMedia(raw: unknown, roomLeft: number): IncomingMedia[] {
  const arr = Array.isArray(raw) ? raw : [];
  return arr
    .filter((m): m is IncomingMedia => {
      if (!m || typeof m !== "object") return false;
      const obj = m as Record<string, unknown>;
      return (
        typeof obj.url === "string" &&
        typeof obj.publicId === "string" &&
        typeof obj.type === "string" &&
        VALID_KINDS.has(obj.type)
      );
    })
    .slice(0, Math.max(0, roomLeft));
}
