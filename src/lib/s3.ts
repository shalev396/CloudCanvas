import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getAwsCredentials } from "./aws-credentials";

function getS3Client(): S3Client {
  if (!process.env.AWS_REGION) {
    throw new Error("AWS_REGION environment variable is required for S3");
  }
  return new S3Client({
    region: process.env.AWS_REGION,
    credentials: getAwsCredentials(),
  });
}

function getBucket(): string {
  const bucket = process.env.S3_BUCKET_NAME;
  if (!bucket) {
    throw new Error("S3_BUCKET_NAME environment variable is required");
  }
  return bucket;
}

export async function uploadIcon(
  key: string,
  body: Buffer
): Promise<void> {
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: getBucket(),
      Key: key,
      Body: body,
      ContentType: "image/svg+xml",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
}

export async function getIconContent(
  key: string
): Promise<Buffer | null> {
  try {
    const res = await getS3Client().send(
      new GetObjectCommand({ Bucket: getBucket(), Key: key })
    );
    const bytes = await res.Body?.transformToByteArray();
    return bytes ? Buffer.from(bytes) : null;
  } catch (err: unknown) {
    if (
      typeof err === "object" &&
      err !== null &&
      "name" in err &&
      (err as { name: string }).name === "NoSuchKey"
    ) {
      return null;
    }
    throw err;
  }
}

export async function deleteIcon(key: string): Promise<void> {
  await getS3Client().send(
    new DeleteObjectCommand({ Bucket: getBucket(), Key: key })
  );
}

export async function deleteAllObjects(prefix = ""): Promise<number> {
  const client = getS3Client();
  const bucket = getBucket();
  let continuationToken: string | undefined;
  let total = 0;

  do {
    const listed = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix || undefined,
        ContinuationToken: continuationToken,
      })
    );
    const objects = (listed.Contents ?? [])
      .map((o) => o.Key)
      .filter((k): k is string => !!k)
      .map((Key) => ({ Key }));

    if (objects.length > 0) {
      await client.send(
        new DeleteObjectsCommand({
          Bucket: bucket,
          Delete: { Objects: objects, Quiet: true },
        })
      );
      total += objects.length;
    }
    continuationToken = listed.NextContinuationToken;
  } while (continuationToken);

  return total;
}

export async function listIcons(
  prefix: string
): Promise<string[]> {
  const keys: string[] = [];
  let continuationToken: string | undefined;
  const client = getS3Client();
  const bucket = getBucket();

  do {
    const res = await client.send(
      new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      })
    );
    for (const obj of res.Contents ?? []) {
      if (obj.Key) keys.push(obj.Key);
    }
    continuationToken = res.NextContinuationToken;
  } while (continuationToken);

  return keys;
}
