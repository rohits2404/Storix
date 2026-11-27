import { query } from "../config/database.config.js";
import { NotFoundException } from "../utils/app-error.js";
import { generateAPIKey } from "../utils/key.js";
import { mapApiKey } from "../utils/mappers.js";

export const createApiKeyService = async (userId, name) => {
    const { rawKey, hashedKey, displayKey } = generateAPIKey();
    await query(
        `INSERT INTO api_keys (user_id, name, display_key, hashed_key)
     VALUES ($1, $2, $3, $4)`,
        [userId, name, displayKey, hashedKey],
    );
    return { rawKey };
};

export const getAllApiKeysService = async (
    userId,
    { pageSize, pageNumber },
) => {
    const skip = (pageNumber - 1) * pageSize;

    const [list, count] = await Promise.all([
        query(
            `SELECT id, user_id, name, display_key, last_used_at, created_at, updated_at
         FROM api_keys WHERE user_id = $1
         ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
            [userId, pageSize, skip],
        ),
        query(
            "SELECT COUNT(*)::int AS count FROM api_keys WHERE user_id = $1",
            [userId],
        ),
    ]);

    const totalCount = count.rows[0].count;
    return {
        apiKeys: list.rows.map(mapApiKey),
        pageination: {
            pageSize,
            totalCount,
            totalPages: Math.ceil(totalCount / pageSize),
            pageNumber,
            skip,
        },
    };
};

export const deleteApiKeyService = async (userId, apiKeyId) => {
    const result = await query(
        "DELETE FROM api_keys WHERE id = $1 AND user_id = $2",
        [apiKeyId, userId],
    );
    if (result.rowCount === 0) throw new NotFoundException("API Key Not Found");
    return { deletedCount: result.rowCount };
};
