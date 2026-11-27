import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import passport from "passport";

import { Env } from "./config/env.config.js";

import { asyncHandler } from "./middlewares/asyncHandler.middleware.js";
import { errorHandler } from "./middlewares/errorHandler.middleware.js";

import { connectDB, disconnectDB } from "./config/database.config.js";

import internalRoutes from "./routes/internal/index.js";

const app = express();

const allowedOrigins = Env.ALLOWED_ORIGINS.split(",").map((o) => o.trim());

app.use(
    cors({
        credentials: true,
        origin(origin, callback) {
            if (!origin || allowedOrigins.includes(origin))
                return callback(null, true);
            callback(
                new UnauthorizedException(
                    `CORS Error: Origin ${origin} Is Not Allowed`,
                ),
                false,
            );
        },
    }),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(passport.initialize());

app.get(
    "/",
    asyncHandler(async (req, res) => {
        res.status(HTTPSTATUS.OK).json({ message: "Storix API" });
    }),
);

app.use(Env.BASE_PATH, internalRoutes);
app.use(errorHandler);

async function startServer() {
    try {
        await connectDB();
        const server = app.listen(Env.PORT, () => {
            console.info(
                `Server Listening On Port ${Env.PORT} In ${Env.NODE_ENV} Mode`,
            );
        });

        for (const signal of ["SIGTERM", "SIGINT"]) {
            process.on(signal, async () => {
                console.warn(`${signal} received: shutting down gracefully`);
                try {
                    server.close(() => console.warn("HTTP Server Closed"));
                    await disconnectDB();
                    process.exit(0);
                } catch (error) {
                    console.error("Error Occurred During Shutdown", error);
                    process.exit(1);
                }
            });
        }
    } catch (error) {
        console.error("Failed To Start Server", error);
        process.exit(1);
    }
}

startServer();
