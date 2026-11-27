import {
    BadRequestException,
    UnauthorizedException,
} from "../utils/app-error.js";
import { validateUpload } from "../services/storage.service.js";

export const CheckStorageAvailability = async (req, res, next) => {
    try {
        const files = req.files?.length
            ? req.files
            : req.file
              ? [req.file]
              : [];
        if (!files.length) throw new BadRequestException("No File Uploaded");

        const userId = req.user?._id;
        if (!userId) throw new UnauthorizedException("Unauthorized Access");

        const total = files.reduce((sum, f) => sum + f.size, 0);
        const result = await validateUpload(userId, total);
        console.info(`Storage Result: ${JSON.stringify(result)}`);
        next();
    } catch (error) {
        next(error);
    }
};
