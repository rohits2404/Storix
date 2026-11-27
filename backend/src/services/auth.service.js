import { query, withTransaction } from "../config/database.config.js";
import {
    NotFoundException,
    UnauthorizedException,
} from "../utils/app-error.js";
import { compareValue, hashValue } from "../utils/bcrypt.js";
import { signJwtToken } from "../utils/jwt.js";
import { mapUser } from "../utils/mappers.js";
import { STORAGE_QUOTA } from "../constant/multer.js";

export const registerService = async (body) => {
    const email = body.email.toLowerCase();
    const passwordHash = await hashValue(body.password);

    try {
        return await withTransaction(async (client) => {
            const existing = await client.query(
                "SELECT 1 FROM users WHERE email = $1",
                [email],
            );
            if (existing.rowCount)
                throw new UnauthorizedException("User Already Exists");

            const { rows } = await client.query(
                `INSERT INTO users (name, email, password, profile_picture)
         VALUES ($1, $2, $3, $4)
         RETURNING id, name, email, profile_picture, created_at, updated_at`,
                [body.name, email, passwordHash, body.profilePicture || null],
            );

            await client.query(
                "INSERT INTO storages (user_id, storage_quota) VALUES ($1, $2)",
                [rows[0].id, STORAGE_QUOTA],
            );

            return { user: mapUser(rows[0]) };
        });
    } catch (error) {
        if (error.code === "23505")
            throw new UnauthorizedException("User Already Exists");
        console.error("Error Registering User", error);
        throw error;
    }
};

export const loginService = async ({ email, password }) => {
    const { rows } = await query("SELECT * FROM users WHERE email = $1", [
        email.toLowerCase(),
    ]);
    const row = rows[0];
    if (!row) throw new NotFoundException("Email/Password Not Found");

    if (!row.password)
        throw new UnauthorizedException("This Account Uses GitHub Sign In");

    const valid = await compareValue(password, row.password);
    if (!valid) throw new UnauthorizedException("Email/Password Is Incorrect");

    const { token, expiresAt } = signJwtToken({ userId: row.id });

    return { user: mapUser(row), accessToken: token, expiresAt };
};
