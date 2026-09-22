import { NextRequest, NextResponse } from "next/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { r2Client, R2_BUCKET_NAME, R2_PUBLIC_DOMAIN } from "@/lib/r2";

export async function POST(req: NextRequest) {
  try {
    const { filename, contentType, folder } = await req.json();

    if (!filename || !contentType) {
      return NextResponse.json({ error: "Missing required filename or contentType" }, { status: 400 });
    }

    const timestamp = Date.now();
    const cleanFileName = filename.replace(/[^a-zA-Z0-9.-]/g, "_");
    const targetFolder = folder ? `${folder}/` : "uploads/";
    const key = `${targetFolder}${timestamp}-${cleanFileName}`;

    // If R2 credentials are not configured in environment, provide a mock url for local testing
    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID) {
      return NextResponse.json({
        uploadUrl: `/api/storage/mock-upload?key=${encodeURIComponent(key)}`,
        fileUrl: `https://storage.local/${key}`,
        key,
        mock: true,
      });
    }

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const uploadUrl = await getSignedUrl(r2Client, command, { expiresIn: 3600 });
    const fileUrl = R2_PUBLIC_DOMAIN
      ? `${R2_PUBLIC_DOMAIN}/${key}`
      : `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${R2_BUCKET_NAME}/${key}`;

    return NextResponse.json({ uploadUrl, fileUrl, key });
  } catch (error: any) {
    console.error("Presigned URL error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate presigned upload URL" }, { status: 500 });
  }
}
