import path from "node:path";
import crypto from "node:crypto";
import { PassThrough } from "node:stream";
import { Upload } from "@aws-sdk/lib-storage";
import { query } from "../config/database.config.js";
import { s3, BUCKET } from "../config/storage.config.js";
import {
    BadRequestException,
    NotFoundException,
    UnauthorizedException,
} from "../utils/app-error.js";
import { sanitizeFilename } from "../utils/helper.js";
import { mapFile } from "../utils/mappers.js";
import {
    deleteObject,
    getObjectStream,
    getSignedObjectUrl,
    putObject,
} from "./object-storage.service.js";

import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const archiver = require("archiver");

export const uploadFilesService = async (userId, files, uploadedVia) => {
    const user = await query("SELECT 1 FROM users WHERE id = $1", [userId]);
    if (!user.rowCount) throw new UnauthorizedException("Unauthorized Access");
    if (!files?.length) throw new BadRequestException("No Files Provided");

    const results = await Promise.allSettled(
        files.map(async (file) => {
            const ext = path.extname(file.originalname);
            const cleanName = sanitizeFilename(
                path.basename(file.originalname, ext),
            ).substring(0, 64);
            const storageKey = `users/${userId}/${crypto.randomUUID()}-${cleanName}${ext}`;

            await putObject(storageKey, file.buffer, file.mimetype);

            try {
                const { rows } = await query(
                    `INSERT INTO files
             (user_id, storage_key, original_name, upload_via, size, ext, url, mime_type)
           VALUES ($1, $2, $3, $4, $5, $6, '', $7)
           RETURNING *`,
                    [
                        userId,
                        storageKey,
                        file.originalname,
                        uploadedVia,
                        file.size,
                        ext.slice(1).toLowerCase(),
                        file.mimetype,
                    ],
                );
                const f = mapFile(rows[0]);
                return {
                    fileId: f._id,
                    originalName: f.originalName,
                    size: f.size,
                    ext: f.ext,
                    mimeType: f.mimeType,
                };
            } catch (error) {
                console.error("Error Saving File Record", error);
                await deleteObject(storageKey).catch(() => {}); // don't leave orphans
                throw error;
            }
        }),
    );

    const data = results
        .filter((r) => r.status === "fulfilled")
        .map((r) => r.value);
    const failed = results.filter((r) => r.status === "rejected");
    if (failed.length) console.warn(`Failed To Upload ${failed.length} Files`);

    return {
        message: `Uploaded Successfully ${data.length} Out Of ${files.length} Files`,
        data,
        failedCount: failed.length,
    };
};

export const getAllFilesService = async (
    userId,
    { keyword },
    { pageSize, pageNumber },
) => {
    const skip = (pageNumber - 1) * pageSize;
    const params = [userId];
    let where = "user_id = $1";

    if (keyword) {
        const escaped = keyword.replace(/[\\%_]/g, "\\$&");
        params.push(`%${escaped}%`);
        where += ` AND original_name ILIKE $${params.length}`;
    }

    const [list, count] = await Promise.all([
        query(
            `SELECT * FROM files WHERE ${where}
        ORDER BY created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
            [...params, pageSize, skip],
        ),
        query(
            `SELECT COUNT(*)::int AS count FROM files WHERE ${where}`,
            params,
        ),
    ]);

    const files = await Promise.all(
        list.rows.map(async (row) => {
            const url = await getSignedObjectUrl({
                storageKey: row.storage_key,
                mimeType: row.mime_type,
                expiresIn: 3600,
            });
            return { ...mapFile(row), url, storageKey: undefined };
        }),
    );

    const totalCount = count.rows[0].count;
    return {
        files,
        pagination: {
            pageSize,
            pageNumber,
            totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
            skip,
        },
    };
};

export const getFileUrlService = async (fileId) => {
    const { rows } = await query("SELECT * FROM files WHERE id = $1", [fileId]);
    if (!rows[0]) throw new NotFoundException("File Not Found");

    const stream = await getObjectStream(rows[0].storage_key);
    return { stream, contentType: rows[0].mime_type, fileSize: rows[0].size };
};

export const deleteFilesService = async (userId, fileIds) => {
    const { rows: files } = await query(
        "SELECT id, storage_key FROM files WHERE id = ANY($1::uuid[]) AND user_id = $2",
        [fileIds, userId],
    );
    if (!files.length) throw new NotFoundException("No Files Found");

    const failedKeys = new Set();
    await Promise.all(
        files.map(async (f) => {
            try {
                await deleteObject(f.storage_key);
            } catch {
                failedKeys.add(f.storage_key);
            }
        }),
    );

    const deletableIds = files
        .filter((f) => !failedKeys.has(f.storage_key))
        .map((f) => f.id);
    const result = await query(
        "DELETE FROM files WHERE id = ANY($1::uuid[]) AND user_id = $2",
        [deletableIds, userId],
    );

    if (failedKeys.size)
        console.warn(
            `Failed To Delete ${failedKeys.size} Objects From Storage`,
        );

    return { deletedCount: result.rowCount, failedCount: failedKeys.size };
};

export const downloadFilesService = async (userId, fileIds) => {
    const { rows } = await query(
        "SELECT * FROM files WHERE id = ANY($1::uuid[]) AND user_id = $2",
        [fileIds, userId],
    );
    if (!rows.length) throw new NotFoundException("No Files Found");

    if (rows.length === 1) {
        const url = await getSignedObjectUrl({
            storageKey: rows[0].storage_key,
            filename: rows[0].original_name,
        });
        return { url, isZip: false };
    }

    return { url: await zipAndSign(rows, userId), isZip: true };
};

async function zipAndSign(files, userId) {
    const timestamp = Date.now();
    const zipKey = `temp-zips/${userId}/${timestamp}.zip`;

    const zip = archiver("zip", { zlib: { level: 6 } });
    const passThrough = new PassThrough();
    zip.on("error", (err) => passThrough.destroy(err));
    zip.pipe(passThrough);

    const upload = new Upload({
        client: s3,
        params: {
            Bucket: BUCKET,
            Key: zipKey,
            Body: passThrough,
            ContentType: "application/zip",
        },
    });
    const uploadDone = upload.done();

    const usedNames = new Set();
    for (const file of files) {
        const stream = await getObjectStream(file.storage_key);
        let name = sanitizeFilename(file.original_name) || file.id;
        if (usedNames.has(name)) name = `${file.id.slice(0, 8)}-${name}`;
        usedNames.add(name);
        zip.append(stream, { name });
    }

    await zip.finalize();
    await uploadDone;

    return getSignedObjectUrl({
        storageKey: zipKey,
        filename: `storix-${timestamp}.zip`,
        expiresIn: 3600,
    });
}
