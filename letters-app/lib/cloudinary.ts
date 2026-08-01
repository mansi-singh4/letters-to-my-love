import { createHash } from "crypto";

// Cloudinary's signing rule: alphabetically sort every param you're sending
// (except file/api_key/signature/resource_type), join as key=value with &,
// append the api secret, sha1 the whole string. We only ever sign `folder`
// and `timestamp`, so this stays simple rather than pulling in the full SDK.
export function signCloudinaryUpload(params: Record<string, string | number>) {
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!apiSecret) throw new Error("CLOUDINARY_API_SECRET is not set");

  const toSign =
    Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("&") + apiSecret;

  return createHash("sha1").update(toSign).digest("hex");
}

export function cloudinaryConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET
  );
}

// Best-effort delete of a Cloudinary asset. Never throws - a stray orphaned
// file in storage is a cleanup task, not a reason to fail a user's request
// (e.g. deleting a letter should succeed even if this call fails).
export async function destroyCloudinaryAsset(publicId: string, resourceType: "image" | "video" = "image") {
  try {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    if (!cloudName || !apiKey || !cloudinaryConfigured()) return;

    const timestamp = Math.floor(Date.now() / 1000);
    const signature = signCloudinaryUpload({ public_id: publicId, timestamp });

    const form = new URLSearchParams();
    form.set("public_id", publicId);
    form.set("timestamp", String(timestamp));
    form.set("api_key", apiKey);
    form.set("signature", signature);

    await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
  } catch {
    // swallow - see comment above
  }
}
