import multer from "multer";
import { ZodError } from "zod";
import { HTTPSTATUS } from "../config/http.config.js";
import { AppError } from "../utils/app-error.js";
import { ErrorCodeEnum } from "../enums/error-code.enum.js";

export const errorHandler = (error, req, res, next) => {
    console.log(`Error Occured On PATH: ${req.path}`, {
        params: req.params,
        error,
    });

    if (error instanceof SyntaxError && "body" in error) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({
            message: "Invalid json Format, Please Check Your Request Body",
        });
    }

    if (error instanceof ZodError) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({
            message: "Validation Failed",
            errors: error.issues.map((e) => ({
                field: e.path.join("."),
                message: e.message,
            })),
            errorCode: ErrorCodeEnum.VALIDATION_ERROR,
        });
    }

    if (error instanceof multer.MulterError) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({
            message: error.message,
            errorCode: ErrorCodeEnum.FILE_UPLOAD_ERROR,
        });
    }

    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            message: error.message,
            errorCode: error.errorCode,
        });
    }

    return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
        message: "Internal Server Error",
        error: error?.message || "Unknown Error",
    });
};
