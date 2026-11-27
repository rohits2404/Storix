import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";
import { HTTPSTATUS } from "../config/http.config.js";
import {
    createApiKeySchema,
    deleteApiKeySchema,
} from "../validators/apikey.validator.js";
import {
    createApiKeyService,
    deleteApiKeyService,
    getAllApiKeysService,
} from "../services/apikey.service.js";

export const createApiKeyController = asyncHandler(async (req, res) => {
    const { name } = createApiKeySchema.parse(req.body);
    const { rawKey } = await createApiKeyService(req.user._id, name);
    return res
        .status(HTTPSTATUS.OK)
        .json({ message: "API Key Created Successfully", key: rawKey });
});

export const getAllApiKeysController = asyncHandler(async (req, res) => {
    const pagination = {
        pageSize: Math.min(parseInt(req.query.pageSize) || 10, 100),
        pageNumber: Math.max(parseInt(req.query.pageNumber) || 1, 1),
    };
    const result = await getAllApiKeysService(req.user._id, pagination);
    return res
        .status(HTTPSTATUS.OK)
        .json({ message: "API Keys Retrieved Successfully", ...result });
});

export const deleteApiKeyController = asyncHandler(async (req, res) => {
    const { id } = deleteApiKeySchema.parse(req.params);
    const result = await deleteApiKeyService(req.user._id, id);
    return res
        .status(HTTPSTATUS.OK)
        .json({ message: "API Key Deleted Successfully", data: result });
});
