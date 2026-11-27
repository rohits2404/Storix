import { query, withTransaction } from "../config/database.config.js";
import { STORAGE_QUOTA } from "../constant/multer.js";
import { mapUser } from "../utils/mappers.js";

const USER_COLS = "id, name, email, profile_picture, created_at, updated_at";

export const findByIdUserService = async (userId) => {
    const { rows } = await query(
        `SELECT ${USER_COLS} FROM users WHERE id = $1`,
        [userId],
    );
    return mapUser(rows[0]);
};

export const findOrCreateGithubUserService = async ({
    githubId,
    email,
    name,
    profilePicture,
}) => {
    email = email.toLowerCase();

    const run = () =>
        withTransaction(async (client) => {
            let { rows } = await client.query(
                `SELECT ${USER_COLS} FROM users WHERE github_id = $1`,
                [githubId],
            );
            if (rows[0]) return mapUser(rows[0]);

            ({ rows } = await client.query(
                `UPDATE users SET github_id = $1, updated_at = NOW()
                 WHERE email = $2 RETURNING ${USER_COLS}`,
                [githubId, email],
            ));
            if (rows[0]) return mapUser(rows[0]);

            ({ rows } = await client.query(
                `INSERT INTO users (name, email, github_id, profile_picture)
                 VALUES ($1, $2, $3, $4) RETURNING ${USER_COLS}`,
                [name, email, githubId, profilePicture ?? null],
            ));
            await client.query(
                "INSERT INTO storages (user_id, storage_quota) VALUES ($1, $2)",
                [rows[0].id, STORAGE_QUOTA],
            );
            return mapUser(rows[0]);
        });

    try {
        return await run();
    } catch (error) {
        if (error.code === "23505") return run();
        throw error;
    }
};
