import { getEnv } from "../utils/get-env.js";

export const Env = {
    NODE_ENV: getEnv("NODE_ENV", "development"),
    PORT: getEnv("PORT", "3000"),
    BASE_PATH: getEnv("BASE_PATH", "/api"),

    DATABASE_URL: getEnv("DATABASE_URL"),

    JWT_SECRET: getEnv("JWT_SECRET", "secret_jwt"),
    JWT_EXPIRES_IN: getEnv("JWT_EXPIRES_IN", "30d"),

    STORAGE_ACCESS_KEY_ID: getEnv("AWS_ACCESS_KEY_ID"),
    STORAGE_SECRET_ACCESS_KEY: getEnv("AWS_SECRET_ACCESS_KEY"),
    STORAGE_ENDPOINT: getEnv("AWS_ENDPOINT_URL_S3"),
    STORAGE_REGION: getEnv("AWS_REGION", "us-east-2"),
    STORAGE_BUCKET: getEnv("STORAGE_BUCKET"),

    ALLOWED_ORIGINS: getEnv("ALLOWED_ORIGINS", "http://localhost:5173"),
};
