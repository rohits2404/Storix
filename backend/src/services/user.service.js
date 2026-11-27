import { query } from "../config/database.config.js";
import { mapUser } from "../utils/mappers.js";

export const findByIdUserService = async (userId) => {
    const { rows } = await query(
        `SELECT id, name, email, profile_picture, created_at, updated_at
       FROM users WHERE id = $1`,
        [userId],
    );
    return mapUser(rows[0]);
};
