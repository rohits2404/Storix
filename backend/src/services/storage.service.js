import { query } from "../config/database.config.js";
import { BadRequestException, NotFoundException } from "../utils/app-error.js";
import { ErrorCodeEnum } from "../enums/error-code.enum.js";
import { formatBytes } from "../utils/format-byte.js";

export const getStorageMetrics = async (userId) => {
    const { rows } = await query(
        `SELECT s.storage_quota AS quota,
            COALESCE((SELECT SUM(size) FROM files WHERE user_id = s.user_id), 0) AS usage
       FROM storages s WHERE s.user_id = $1`,
        [userId],
    );
    if (!rows[0]) throw new NotFoundException("Storage Record Not Found");

    const quota = Number(rows[0].quota);
    const usage = Number(rows[0].usage);
    return { quota, usage, remaining: quota - usage };
};

export const validateUpload = async (userId, totalFileSize) => {
    if (totalFileSize < 0)
        throw new BadRequestException("File Size Must Be Positive");

    const metrics = await getStorageMetrics(userId);
    if (metrics.remaining < totalFileSize) {
        const shortFall = totalFileSize - metrics.remaining;
        throw new BadRequestException(
            `Insufficient Storage. ${formatBytes(shortFall)} Needed.`,
            ErrorCodeEnum.INSUFFICIENT_STORAGE,
        );
    }

    return {
        allowed: true,
        newUsage: metrics.usage + totalFileSize,
        remainingAfterUpload: metrics.remaining - totalFileSize,
    };
};
