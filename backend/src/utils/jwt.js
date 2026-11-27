import jwt from "jsonwebtoken";
import { Env } from "../config/env.config.js";

export const signJwtToken = (payload) => {
    const token = jwt.sign(payload, Env.JWT_SECRET, {
        audience: ["user"],
        expiresIn: Env.JWT_EXPIRES_IN,
    });
    const expiresAt = jwt.decode(token).exp * 1000;
    return { token, expiresAt };
};
