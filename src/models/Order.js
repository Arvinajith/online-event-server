import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
	{
		eventId: { type: mongoose.Schema.Types.ObjectId, ref: "Event", required: true },
		ticketLabel: { type: String, required: true },
		unitPrice: { type: Number, required: true },
		quantity: { type: Number, required: true, min: 1 }
	},
	{ _id: false }
);

const OrderSchema = new mongoose.Schema(
	{
		userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
		items: { type: [OrderItemSchema], required: true },
		totalAmount: { type: Number, required: true },
		paymentStatus: { type: String, enum: ["pending", "paid", "failed", "refunded"], default: "pending", index: true },
		paymentProvider: { type: String, default: "stripe" },
		paymentId: { type: String },
		attendeeInfo: {
			type: [
				{
					name: String,
					email: String
				}
			],
			default: []
		}
	},
	{ timestamps: true }
);

export default mongoose.model("Order", OrderSchema);


