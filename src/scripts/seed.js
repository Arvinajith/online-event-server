import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../models/User.js";
import Event from "../models/Event.js";

dotenv.config();

async function run() {
  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/event_platform";
  await mongoose.connect(mongoUri);
  console.log("✅ Connected to MongoDB");

   // Clear old seeded data (events and the single organizer if exists)
   await Promise.all([
     Event.deleteMany({}),
     User.deleteMany({ email: "organizer@example.com" })
   ]);
   console.log("🧹 Cleared old events and organizer");

  const now = new Date();

   // Ensure an organizer exists to satisfy Event.organizerId requirement
   const organizer = await User.create({
     name: "Seed Organizer",
     email: "organizer@example.com",
     passwordHash: "seed", // not used for login in this seed-only flow
     isAdmin: false,
     roles: ["organizer"]
   });

   // Preset realistic events with guaranteed-working Picsum seed images
  const presets = [
    { title: "Tech Summit San Francisco 2025", category: "Technology", location: "San Francisco, CA", imgId: 1011 },
    { title: "AI Innovators Expo", category: "Technology", location: "San Jose, CA", imgId: 1005 },
    { title: "Cloud Native World", category: "Technology", location: "Seattle, WA", imgId: 1025 },
    { title: "FinTech Forward", category: "Business", location: "New York, NY", imgId: 1039 },
    { title: "HealthTech Live", category: "Health", location: "Boston, MA", imgId: 1050 },
    { title: "Creative Arts Fair", category: "Art", location: "Los Angeles, CA", imgId: 1067 },
    { title: "Business Growth Summit", category: "Business", location: "Chicago, IL", imgId: 1043 },
    { title: "EduTech Connect", category: "Education", location: "Austin, TX", imgId: 1000 },
    { title: "Startup Pitch Night", category: "Business", location: "Denver, CO", imgId: 1027 },
    { title: "UX/UI Design Week", category: "Art", location: "Portland, OR", imgId: 1015 },
    { title: "Music & Arts Festival Austin", category: "Music", location: "Austin, TX", imgId: 1033 },
    { title: "Jazz Nights Chicago", category: "Music", location: "Chicago, IL", imgId: 1040 },
    { title: "Food Truck Carnival", category: "Food", location: "San Diego, CA", imgId: 1060 },
    { title: "Sustainable Future Forum", category: "Environment", location: "Vancouver, BC", imgId: 1056 },
    { title: "Cybersecurity Congress", category: "Technology", location: "Washington, DC", imgId: 1006 },
    { title: "Data Science Day", category: "Technology", location: "Philadelphia, PA", imgId: 1010 },
    { title: "Product Management Conference", category: "Business", location: "Atlanta, GA", imgId: 1029 },
    { title: "Developer Week NYC", category: "Technology", location: "New York, NY", imgId: 1031 },
    { title: "E-sports Championship", category: "Sports", location: "Las Vegas, NV", imgId: 1045 },
    { title: "Wellness Retreat LA", category: "Health", location: "Los Angeles, CA", imgId: 1052 },
  ];

   const eventsToInsert = presets.map((p, idx) => {
    const start = new Date(now.getTime() + (idx + 5) * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 3 * 60 * 60 * 1000);
    const basePrice = 59 + (idx % 6) * 15;
    return {
       organizerId: organizer._id,
      title: p.title,
      description: `Join us at ${p.title} in ${p.location}. Engage with experts, attend sessions, and network with peers.`,
      category: p.category,
      location: p.location,
      startDate: start,
      endDate: end,
       imageUrls: [`https://picsum.photos/seed/${encodeURIComponent(p.title)}/800/400`],
      ticketTypes: [
        { label: "General Admission", price: basePrice, quantityTotal: 200, quantitySold: 0 },
        { label: "VIP", price: basePrice + 150, quantityTotal: 40, quantitySold: 0 },
      ],
      schedule: [
        { startTime: start, endTime: new Date(start.getTime() + 60 * 60 * 1000), title: "Opening Session", speaker: "Host" },
        { startTime: new Date(start.getTime() + 60 * 60 * 1000), endTime: end, title: "Main Program", speaker: "Guest Speaker" },
      ],
      status: "approved",
      isPublished: true,
    };
  });

  const inserted = await Event.insertMany(eventsToInsert);
  console.log(`✅ Seeded ${inserted.length} events with working images`);

  await mongoose.disconnect();
  console.log("🔌 MongoDB disconnected — seeding complete.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
