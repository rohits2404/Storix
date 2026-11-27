import { z } from "zod";

export const fileIdSchema = z.string().trim().uuid("Invalid File ID");

const baseSchema = z.object({
    fileIds: z
        .array(z.string().uuid("Invalid File ID"))
        .min(1, "At Least One File ID Must Be Provided"),
});

export const deleteFilesSchema = baseSchema;
export const downloadFilesSchema = baseSchema;
