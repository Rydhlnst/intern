import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { s3, BUCKET, ensureCoverBucket } from "./minio";
import sharp from "sharp";
import { randomUUID } from "crypto";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export async function uploadBookCover(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("File type not allowed. Use JPG, PNG, or WebP.");
  }
  if (file.size > MAX_SIZE) {
    throw new Error("File size must be less than 2MB.");
  }

  await ensureCoverBucket();

  const buffer = Buffer.from(await file.arrayBuffer());
  const processed = await sharp(buffer)
    .resize(400, 600, { fit: "cover" })
    .webp({ quality: 85 })
    .toBuffer();

  const objectKey = `covers/${randomUUID()}.webp`;

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: objectKey,
      Body: processed,
      ContentType: "image/webp",
    })
  );

  const coverUrl = `${process.env.MINIO_USE_SSL === "true" ? "https" : "http"}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}/${BUCKET}/${objectKey}`;

  return {
    coverUrl,
    coverObjectKey: objectKey,
    coverMimeType: "image/webp",
    coverSize: processed.length,
  };
}

export async function deleteBookCover(objectKey: string) {
  await s3.send(
    new DeleteObjectCommand({
      Bucket: BUCKET,
      Key: objectKey,
    })
  );
}
