export const MAX_IMAGE_BYTES = 8 * 1024 * 1024; // 8MB per photo
export const MAX_PHOTOS_PER_LETTER = 12;

export type PendingPhoto = {
  // Present once uploaded to Cloudinary; absent while still uploading.
  url?: string;
  publicId?: string;
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
