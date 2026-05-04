import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST() {
  const timestamp = Math.round(new Date().getTime() / 1000);

  const paramsToSign = `timestamp=${timestamp}`;
  const signature = crypto
    .createHash("sha1")
    .update(paramsToSign + process.env.CLOUDINARY_API_SECRET)
    .digest("hex");

  return NextResponse.json({
    timestamp,
    signature,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
  });
}