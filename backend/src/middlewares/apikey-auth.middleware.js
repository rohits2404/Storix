import { UnauthorizedException } from "../utils/app-error.js";
import { KEY_TYPE, hashApiKey } from "../utils/key.js";
import { query } from "../config/database.config.js";
import { findByIdUserService } from "../services/user.service.js";

export const apiKeyAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith("Bearer ")) {
            throw new UnauthorizedException(
                "API Key Required. Use Authorization Bearer <API_KEY>",
            );
        }

        const apiKey = authHeader.slice(7).trim();
        if (!apiKey) throw new UnauthorizedException("API Key Missing");
        if (!apiKey.startsWith("sk_") || apiKey.length < 20) {
            throw new UnauthorizedException("Invalid API Key Format");
        }

        const parts = apiKey.split("_");
        if (parts.length < 3 || parts[0] !== "sk") {
            throw new UnauthorizedException("Invalid API Key Format");
        }
        if (!Object.values(KEY_TYPE).includes(parts[1])) {
            throw new UnauthorizedException("Invalid API Key Type");
        }

        const hashedKey = hashApiKey(apiKey);
        const { rows } = await query(
            "SELECT id, user_id, display_key FROM api_keys WHERE hashed_key = $1",
            [hashedKey],
        );

        const keyRow = rows[0];
        if (!keyRow) throw new UnauthorizedException("Invalid API Key");

        const user = await findByIdUserService(keyRow.user_id);
        if (!user)
            throw new UnauthorizedException("User Not Found For this API key");

        query("UPDATE api_keys SET last_used_at = now() WHERE id = $1", [
            keyRow.id,
        ]).catch((e) => console.error("Failed To Update last_used_at", e));

        req.user = user;
        console.info(`API KEY Used ${keyRow.display_key}`);

        next();
    } catch (error) {
        next(error);
    }
};
