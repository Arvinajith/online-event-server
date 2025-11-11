import mongoose from "mongoose";

const TicketTypeSchema = new mongoose.Schema(
	{
		label: { type: String, required: true }, // e.g., "General Admission", "VIP"
		price: { type: Number, required: true, min: 0 },
		quantityTotal: { type: Number, required: true, min: 0 },
		quantitySold: { type: Number, default: 0, min: 0 }
	},
	{ _id: false }
);

const ScheduleItemSchema = new mongoose.Schema(
	{
		startTime: { type: Date, required: true },
		endTime: { type: Date, required: true },
		title: { type: String, required: true },
		speaker: { type: String },
		description: { type: String }
	},
	{ _id: false }
);

const EventSchema = new mongoose.Schema(
	{
		organizerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
		title: { type: String, required: true },
		description: { type: String, required: true },
		category: { type: String, index: true },
		location: { type: String, required: true, index: true },
		startDate: { type: Date, required: true, index: true },
		endDate: { type: Date, required: true },
		imageUrls: { type: [String], default: [] },
		videoUrl: { type: String },
		ticketTypes: { type: [TicketTypeSchema], default: [] },
		schedule: { type: [ScheduleItemSchema], default: [] },
		status: { type: String, enum: ["draft", "pending", "approved", "rejected"], default: "pending", index: true },
		isPublished: { type: Boolean, default: false }
	},
	{ timestamps: true }
);

export default mongoose.model("Event", EventSchema);


