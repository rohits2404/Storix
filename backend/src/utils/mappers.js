import { formatBytes } from "./format-byte.js";

export const mapUser = (r) =>
    r && {
        _id: r.id,
        name: r.name,
        email: r.email,
        profilePicture: r.profile_picture,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };

export const mapFile = (r) =>
    r && {
        _id: r.id,
        userId: r.user_id,
        originalName: r.original_name,
        storageKey: r.storage_key,
        mimeType: r.mime_type,
        size: r.size,
        formattedSize: formatBytes(r.size),
        ext: r.ext,
        uploadVia: r.upload_via,
        url: r.url,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };

export const mapApiKey = (r) =>
    r && {
        _id: r.id,
        userId: r.user_id,
        name: r.name,
        displayKey: r.display_key,
        lastUsedAt: r.last_used_at,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
    };
