import { S3Client } from "@aws-sdk/client-s3";
import { Env } from "./env.config.js";

export const s3 = new S3Client({
    region: Env.STORAGE_REGION,
    endpoint: Env.STORAGE_ENDPOINT,
    forcePathStyle: true,
    credentials: {
        accessKeyId: Env.STORAGE_ACCESS_KEY_ID,
        secretAccessKey: Env.STORAGE_SECRET_ACCESS_KEY,
    },
});

export const BUCKET = Env.STORAGE_BUCKET;
