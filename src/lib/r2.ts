import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";

export function isR2Configured(): boolean {
  return Boolean(
    process.env.R2_ACCOUNT_ID &&
      process.env.R2_ACCESS_KEY_ID &&
      process.env.R2_SECRET_ACCESS_KEY &&
      process.env.R2_BUCKET_NAME &&
      process.env.R2_PUBLIC_URL
  );
}

function createR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });
}

export async function uploadImageToR2(params: {
  buffer: Buffer;
  contentType: string;
  originalName: string;
}): Promise<{ url: string; key: string }> {
  const ext = params.originalName.split(".").pop()?.toLowerCase() || "jpg";
  const safeExt = ["jpg", "jpeg", "png", "webp", "avif"].includes(ext) ? ext : "jpg";
  const key = `vehicles/${Date.now()}-${crypto.randomBytes(6).toString("hex")}.${safeExt}`;

  const client = createR2Client();
  await client.send(
    new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME!,
      Key: key,
      Body: params.buffer,
      ContentType: params.contentType,
      CacheControl: "public, max-age=31536000, immutable",
    })
  );

  const publicBase = process.env.R2_PUBLIC_URL!.replace(/\/$/, "");
  return {
    url: `${publicBase}/${key}`,
    key,
  };
}
