import {
  S3Client,
  HeadBucketCommand,
  CreateBucketCommand,
  PutBucketPolicyCommand,
} from "@aws-sdk/client-s3";

export const s3 = new S3Client({
  endpoint: `${process.env.MINIO_USE_SSL === "true" ? "https" : "http"}://${process.env.MINIO_ENDPOINT}:${process.env.MINIO_PORT}`,
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.MINIO_ACCESS_KEY!,
    secretAccessKey: process.env.MINIO_SECRET_KEY!,
  },
  forcePathStyle: true,
});

export const BUCKET = process.env.MINIO_BUCKET!;

// Anonymous read-only policy so cover URLs are directly fetchable by next/image.
function publicReadPolicy(bucket: string): string {
  return JSON.stringify({
    Version: "2012-10-17",
    Statement: [
      {
        Effect: "Allow",
        Principal: { AWS: ["*"] },
        Action: ["s3:GetObject"],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  });
}

let bucketReady: Promise<void> | null = null;

/**
 * Idempotently ensure the cover bucket exists and is publicly readable.
 * Memoized per-process so repeated uploads don't re-issue the head/create calls.
 */
export function ensureCoverBucket(): Promise<void> {
  if (!bucketReady) {
    bucketReady = (async () => {
      try {
        await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
      } catch {
        await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
      }
      await s3.send(
        new PutBucketPolicyCommand({
          Bucket: BUCKET,
          Policy: publicReadPolicy(BUCKET),
        })
      );
    })().catch((err) => {
      // Reset so a later call can retry after a transient failure.
      bucketReady = null;
      throw err;
    });
  }
  return bucketReady;
}
