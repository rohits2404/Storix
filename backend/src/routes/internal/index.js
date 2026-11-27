import { Router } from "express";

import authRoutes from "./auth.route.js";
import filesRoutes from "./files.route.js";

import { passportAuthenticateJwt } from "../../config/passport.config.js";

const internalRoutes = Router();

internalRoutes.use("/auth", authRoutes);
internalRoutes.use("/files", passportAuthenticateJwt, filesRoutes);

export default internalRoutes;
