import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";
import { HTTPSTATUS } from "../config/http.config.js";
import { BadRequestException } from "../utils/app-error.js";
import { getUserAnalyticsWithChartService } from "../services/analytics.service.js";

const parseDate = (value) => {
    if (!value) return undefined;
    const d = new Date(value);
    if (Number.isNaN(d.getTime()))
        throw new BadRequestException("Invalid Date");
    return d;
};

export const getUserAnalyticsWithChartController = asyncHandler(
    async (req, res) => {
        const filter = {
            dateFrom: parseDate(req.query.from),
            dateTo: parseDate(req.query.to),
        };
        const result = await getUserAnalyticsWithChartService(
            req.user._id,
            filter,
        );
        return res
            .status(HTTPSTATUS.OK)
            .json({
                message: "User Analytics Retrieved Successfully",
                ...result,
            });
    },
);
