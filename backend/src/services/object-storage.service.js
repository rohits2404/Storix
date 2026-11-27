import {
    DeleteObjectCommand,
    GetObjectCommand,
    PutObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { s3, BUCKET } from "../config/storage.config.js";
import { InternalServerException } from "../utils/app-error.js";

export async function putObject(key, body, contentType) {
    try {
        await s3.send(
            new PutObjectCommand({
                Bucket: BUCKET,
                Key: key,
                Body: body,
                ContentType: contentType,
            }),
        );
    } catch (error) {
        console.error("Object Storage Upload Failed", error);
        throw error;
    }
}

export async function getSignedObjectUrl({
    storageKey,
    filename,
    mimeType,
    expiresIn = 60,
}) {
    const disposition = filename
        ? `attachment; filename="${filename.replace(/[^\x20-\x7e]|["\\]/g, "_")}"; filename*=UTF-8''${encodeURIComponent(filename)}`
        : "inline";

    const command = new GetObjectCommand({
        Bucket: BUCKET,
        Key: storageKey,
        ResponseContentDisposition: disposition,
        ...(!filename && mimeType && { ResponseContentType: mimeType }),
    });
    return getSignedUrl(s3, command, { expiresIn });
}

export async function getObjectStream(storageKey) {
    try {
        const res = await s3.send(
            new GetObjectCommand({ Bucket: BUCKET, Key: storageKey }),
        );
        if (!res.Body)
            throw new InternalServerException("No Body Returned For Key");
        return res.Body;
    } catch (error) {
        console.error(
            `Error Getting Object Stream For Key: ${storageKey}`,
            error,
        );
        throw new InternalServerException("Failed To Retrieve File");
    }
}

export async function deleteObject(storageKey) {
    try {
        await s3.send(
            new DeleteObjectCommand({ Bucket: BUCKET, Key: storageKey }),
        );
    } catch (error) {
        console.error(`Failed To Delete Object ${storageKey}`, error);
        throw error;
    }
}
