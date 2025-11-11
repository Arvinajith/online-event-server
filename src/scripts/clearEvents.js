import dotenv from "dotenv";
import mongoose from "mongoose";
import Event from "../models/Event.js"; // ✅ adjust path if your model is elsewhere

// ✅ Load environment variables
dotenv.config();

async function run() {
  try {
    // ✅ Connect to MongoDB
    const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/event_platform";
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to MongoDB");

    // 🧹 Delete all events
    const result = await Event.deleteMany({});
    console.log(`🗑️ Removed ${result.deletedCount} events from the database`);

    // ✅ Disconnect cleanly
    await mongoose.disconnect();
    console.log("🔌 MongoDB disconnected — cleanup complete.");
  } catch (err) {
    console.error("❌ Error during cleanup:", err);
    process.exit(1);
  }
}

// 🚀 Run the script
run();
