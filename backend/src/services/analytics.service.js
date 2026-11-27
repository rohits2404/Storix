import { query } from "../config/database.config.js";
import { formatBytes } from "../utils/format-byte.js";
import { getStorageMetrics } from "./storage.service.js";

export const getUserAnalyticsWithChartService = async (
    userId,
    { dateFrom, dateTo },
) => {
    const params = [userId];
    let where = "user_id = $1";
    if (dateFrom) {
        params.push(dateFrom);
        where += ` AND created_at >= $${params.length}`;
    }
    if (dateTo) {
        params.push(dateTo);
        where += ` AND created_at <= $${params.length}`;
    }

    const { rows } = await query(
        `SELECT to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD') AS date,
            COUNT(*)::int AS "uploadedFiles",
            COALESCE(SUM(size), 0)::bigint AS usages
       FROM files
      WHERE ${where}
      GROUP BY 1
      ORDER BY 1`,
        params,
    );

    const chart = rows.map((r) => ({
        date: r.date,
        uploadedFiles: r.uploadedFiles,
        usages: Number(r.usages),
        formattedUsages: formatBytes(r.usages),
    }));

    const totaluploadFilesForPeriod = chart.reduce(
        (s, r) => s + r.uploadedFiles,
        0,
    );
    const totalUsageForPeriod = chart.reduce((s, r) => s + r.usages, 0);

    const metrics = await getStorageMetrics(userId);

    return {
        chart,
        totaluploadFilesForPeriod,
        totalUsageForPeriod: formatBytes(totalUsageForPeriod),
        storageUsageSummary: {
            totalUsage: metrics.usage,
            quota: metrics.quota,
            formattedTotalUsage: formatBytes(metrics.usage),
            formattedQuota: formatBytes(metrics.quota),
        },
    };
};
