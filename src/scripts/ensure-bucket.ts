import {
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketPolicyCommand,
  S3Client,
} from "@aws-sdk/client-s3"

async function ensureBucket() {
  const endpoint = process.env.MINIO_ENDPOINT
  const port = process.env.MINIO_PORT ?? "9000"
  const bucket = process.env.MINIO_BUCKET ?? "library-covers"
  const accessKey = process.env.MINIO_ACCESS_KEY
  const secretKey = process.env.MINIO_SECRET_KEY

  if (!endpoint || !accessKey || !secretKey) {
    throw new Error(
      "MINIO_ENDPOINT / MINIO_ACCESS_KEY / MINIO_SECRET_KEY must be set."
    )
  }

  const useSsl = process.env.MINIO_USE_SSL === "true"
  const protocol = useSsl ? "https" : "http"

  const client = new S3Client({
    endpoint: `${protocol}://${endpoint}:${port}`,
    region: "us-east-1",
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    forcePathStyle: true,
  })

  try {
    await client.send(new HeadBucketCommand({ Bucket: bucket }))
    console.log(`[startup] bucket "${bucket}" already exists`)
  } catch {
    console.log(`[startup] creating bucket "${bucket}"`)
    await client.send(new CreateBucketCommand({ Bucket: bucket }))
    await client.send(
      new PutBucketPolicyCommand({
        Bucket: bucket,
        Policy: JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: "*",
              Action: ["s3:GetObject"],
              Resource: [`arn:aws:s3:::${bucket}/*`],
            },
          ],
        }),
      })
    )
    console.log(`[startup] bucket "${bucket}" created and set public-read`)
  }
}

async function withRetry(fn: () => Promise<void>, attempts = 10, delayMs = 3000) {
  for (let i = 1; i <= attempts; i++) {
    try {
      await fn()
      return
    } catch (err) {
      if (i === attempts) throw err
      console.log(`[startup] attempt ${i}/${attempts} failed, retrying in ${delayMs}ms...`)
      await new Promise((r) => setTimeout(r, delayMs))
    }
  }
}

withRetry(ensureBucket)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[startup] ensureBucket failed after retries:", err)
    process.exit(1)
  })
