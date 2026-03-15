import "dotenv/config";
import express from "express";
import cors from "cors";

import { connectDB } from "./config/db.js";
import { stripeWebhooks } from "./controllers/webhooks.js";

import userRouter from "./routes/userRoute.js";
import chatRouter from "./routes/chatRoute.js";
import messageRouter from "./routes/messageRoute.js";
import creditRouter from "./routes/creditRoute.js";

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Stripe Webhook ───────────────────────────────────────────────
// Must be registered before express.json() — Stripe requires raw body
app.post(
    "/api/stripe",
    express.raw({ type: "application/json" }),
    stripeWebhooks
);

// ─── Middleware ───────────────────────────────────────────────────
app.use(
    cors({
        origin: process.env.CLIENT_URL || "http://localhost:5173",
        credentials: true,
        methods: ["GET","POST"]
    })
);
app.use(express.json());

// Request logger (development only)
if (process.env.NODE_ENV !== "production") {
    app.use((req, _res, next) => {
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
        next();
    });
}

// ─── Routes ───────────────────────────────────────────────────────
app.get("/", (_req, res) => {
    res.status(200).json({ success: true, message: "Server is live" });
});

app.use("/api/user", userRouter);
app.use("/api/chat", chatRouter);
app.use("/api/message", messageRouter);
app.use("/api/credit", creditRouter);

// ─── 404 Handler ─────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ success: false, message: "Route not found" });
});

// ─── Global Error Handler ─────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error("Unhandled error:", err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error",
    });
});

// ─── Start Server ─────────────────────────────────────────────────
const startServer = async () => {
    try {
        await connectDB();
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
        });
    } catch (error) {
        console.error("Failed to connect to database:", error.message);
        process.exit(1);
    }
};

startServer();
