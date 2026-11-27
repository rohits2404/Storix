import { Router } from "express";
import {
    loginController,
    registerController,
} from "../../controllers/auth.controller.js";
import { signJwtToken } from "../../utils/jwt.js";
import passport from "passport";

const authRoutes = Router();

authRoutes.post("/register", registerController);
authRoutes.post("/login", loginController);

authRoutes.get(
    "/github",
    passport.authenticate("github", { session: false, scope: ["user:email"] }),
);

authRoutes.get(
    "/github/callback",
    passport.authenticate("github", {
        session: false,
        failureRedirect: `${process.env.FRONTEND_URL}/auth/github/callback?error=github_failed`,
    }),
    (req, res) => {
        const { token, expiresAt } = signJwtToken({ userId: req.user._id });
        const hash = new URLSearchParams({
            token,
            expiresAt: String(expiresAt),
            user: JSON.stringify(req.user),
        }).toString();
        res.redirect(
            `${process.env.FRONTEND_URL}/auth/github/callback#${hash}`,
        );
    },
);

export default authRoutes;
