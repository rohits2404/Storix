import pg from "pg";
import { Env } from "./env.config.js";

pg.types.setTypeParser(20, (v) => Number(v));

export const pool = new pg.Pool({
    connectionString: Env.DATABASE_URL,
    ssl: { rejectUnauthorized: true },
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
});

pool.on("error", (err) => console.error("Unexpected Postgres Pool Error", err));

export const query = (text, params) => pool.query(text, params);

export async function withTransaction(fn) {
    const client = await pool.connect();
    try {
        await client.query("BEGIN");
        const result = await fn(client);
        await client.query("COMMIT");
        return result;
    } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
    } finally {
        client.release();
    }
}

export const connectDB = async () => {
    try {
        await pool.query("SELECT 1");
        console.info("Connected To Neon Postgres");
    } catch (error) {
        console.error("Error Connecting To Neon Postgres", error);
        process.exit(1);
    }
};

export const disconnectDB = async () => {
    await pool.end();
    console.info("Disconnected From Neon Postgres");
};
