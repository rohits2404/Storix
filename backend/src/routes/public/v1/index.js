import { Router } from "express";
import fileV1Routes from "./files.route.js";
import { apiKeyAuthMiddleware } from "../../../middlewares/apikey-auth.middleware.js";

const v1Routes = Router();

v1Routes.use("/files", apiKeyAuthMiddleware, fileV1Routes);

export default v1Routes;
