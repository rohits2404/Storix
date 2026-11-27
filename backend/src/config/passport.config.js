import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import passport from "passport";
import { Env } from "./env.config.js";
import { findByIdUserService } from "../services/user.service.js";

passport.use(
    new JwtStrategy(
        {
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: Env.JWT_SECRET,
            audience: ["user"],
            algorithms: ["HS256"],
        },
        async (payload, done) => {
            try {
                if (!payload.userId) return done(null, false);
                const user = await findByIdUserService(payload.userId);
                return done(null, user || false);
            } catch {
                return done(null, false);
            }
        },
    ),
);

export const passportAuthenticateJwt = passport.authenticate("jwt", {
    session: false,
});
