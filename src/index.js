import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import authRoutes from "./routes/auth.js";
import eventRoutes from "./routes/events.js";
import orderRoutes from "./routes/orders.js";
import adminRoutes from "./routes/admin.js";

// ✅ Load environment variables first
dotenv.config({ path: "../.env" });


const app = express();
const port = process.env.PORT || 4000;
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

// ✅ Allow multiple localhost origins (fixes 5174 CORS issue)
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "https://cute-sable-c28e19.netlify.app",
  frontendUrl,
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow curl or mobile
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

app.use(express.json());

// ✅ Health check
app.get("/api/health", (_req, res) => {
  res.json({
    ok: true,
    service: "event-platform",
    time: new Date().toISOString(),
  });
});

// ✅ Routes
app.use("/api/auth", authRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/admin", adminRoutes);

// ✅ Global error handler
app.use((err, _req, res, _next) => {
  console.error(err);
  res
    .status(err.status || 500)
    .json({ error: err.message || "Internal Server Error" });
});

// ✅ Connect to MongoDB and start server
async function start() {
  const mongoUri =
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/event_platform";

  await mongoose.connect(mongoUri);
  console.log("✅ MongoDB connected");

  app.listen(port, () => {
    console.log(`✅ Server listening on http://localhost:${port}`);
    console.log(
      "🔐 JWT_SECRET:",
      process.env.JWT_SECRET ? "Loaded ✅" : "❌ Missing"
    );
  });
}

start().catch((e) => {
  console.error("❌ Failed to start server", e);
  process.exit(1);
});
