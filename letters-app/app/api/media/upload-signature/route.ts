import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { requireCoupleId } from "@/lib/couple";
import { signCloudinaryUpload, cloudinaryConfigured } from "@/lib/cloudinary";

// The browser uploads the actual file bytes straight to Cloudinary (never
// through our server, so we don't have to proxy large files or worry about
// Next.js body-size limits). What this route hands out is authorization to
// do that upload - scoped to this user's couple space via the folder path,
// and only valid for this one signed request (Cloudinary checks the exact
// timestamp/folder/signature triple).
export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const coupleId = await requireCoupleId(userId);
  if (!coupleId) return NextResponse.json({ error: "No Couple Space yet" }, { status: 403 });

  if (!cloudinaryConfigured()) {
    const missing = [
      !process.env.CLOUDINARY_CLOUD_NAME && "CLOUDINARY_CLOUD_NAME",
      !process.env.CLOUDINARY_API_KEY && "CLOUDINARY_API_KEY",
      !process.env.CLOUDINARY_API_SECRET && "CLOUDINARY_API_SECRET",
    ].filter(Boolean);
    console.error(`[media/upload-signature] Missing env vars: ${missing.join(", ")}`);
    return NextResponse.json(
      {
        error: "Photo uploads aren't configured on this deployment yet",
        ...(process.env.NODE_ENV !== "production" ? { missing } : {}),
      },
      { status: 503 }
    );
  }

  try {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = `letters-to-my-love/${coupleId}`;
    const signature = signCloudinaryUpload({ folder, timestamp });

    return NextResponse.json({
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      timestamp,
      folder,
      signature,
    });
  } catch (err) {
    console.error("[media/upload-signature] Failed to sign upload:", err);
    return NextResponse.json({ error: "Couldn't authorize the upload \u2014 check server logs" }, { status: 500 });
  }
}
