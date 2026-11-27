import { asyncHandler } from "../middlewares/asyncHandler.middleware.js";
import { HTTPSTATUS } from "../config/http.config.js";
import {
    deleteFilesService,
    downloadFilesService,
    getAllFilesService,
    getFileUrlService,
    uploadFilesService,
} from "../services/files.service.js";
import {
    deleteFilesSchema,
    downloadFilesSchema,
    fileIdSchema,
} from "../validators/files.validator.js";

export const uploadFilesViaWebController = asyncHandler(async (req, res) => {
    const results = await uploadFilesService(req.user._id, req.files, "WEB");
    return res.status(HTTPSTATUS.OK).json(results);
});

export const uploadFilesViaApiController = asyncHandler(async (req, res) => {
    const results = await uploadFilesService(req.user._id, req.files, "API");
    return res.status(HTTPSTATUS.OK).json(results);
});

export const getAllFilesController = asyncHandler(async (req, res) => {
    const filter = { keyword: req.query.keyword || undefined };
    const pagination = {
        pageSize: Math.min(parseInt(req.query.pageSize) || 20, 100),
        pageNumber: Math.max(parseInt(req.query.pageNumber) || 1, 1),
    };
    const result = await getAllFilesService(req.user._id, filter, pagination);
    return res
        .status(HTTPSTATUS.OK)
        .json({ message: "All Files Retrieved Successfully", ...result });
});

export const deleteFilesController = asyncHandler(async (req, res) => {
    const { fileIds } = deleteFilesSchema.parse(req.body);
    const result = await deleteFilesService(req.user._id, fileIds);
    return res
        .status(HTTPSTATUS.OK)
        .json({ message: "Files Deleted Successfully", ...result });
});

export const downloadFilesController = asyncHandler(async (req, res) => {
    const { fileIds } = downloadFilesSchema.parse(req.body);
    const result = await downloadFilesService(req.user._id, fileIds);
    return res.status(HTTPSTATUS.OK).json({
        message: "File Download URL Successfully",
        downloadUrl: result.url,
        isZip: result.isZip || false,
    });
});

export const publicGetFileUrlController = asyncHandler(async (req, res) => {
    const fileId = fileIdSchema.parse(req.params.fileId);
    const { stream, contentType, fileSize } = await getFileUrlService(fileId);

    res.set({
        "Content-Type": contentType,
        "Content-Length": fileSize,
        "Cache-Control": "public, max-age=3600",
        "Content-Disposition": "inline",
        "X-Content-Type-Options": "nosniff",
    });
    stream.pipe(res);
});
