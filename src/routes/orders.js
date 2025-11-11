import express from "express";
import Stripe from "stripe";
import { requireAuth } from "../middleware/auth.js";
import Event from "../models/Event.js";
import Order from "../models/Order.js";

const router = express.Router();
const stripeKey = process.env.STRIPE_SECRET_KEY || "";
const stripe = stripeKey ? new Stripe(stripeKey) : null;

// Create checkout and order
router.post("/checkout", requireAuth, async (req, res) => {
	const { eventId, ticketLabel, quantity = 1, attendees = [] } = req.body;
	const event = await Event.findById(eventId);
	if (!event) return res.status(404).json({ error: "Event not found" });
	const ticket = (event.ticketTypes || []).find((t) => t.label === ticketLabel);
	if (!ticket) return res.status(400).json({ error: "Ticket not found" });
	if (ticket.quantitySold + quantity > ticket.quantityTotal)
		return res.status(400).json({ error: "Not enough tickets available" });

	const totalAmount = ticket.price * quantity;

	let paymentId = `mock_${Date.now()}`;
	if (stripe) {
		const paymentIntent = await stripe.paymentIntents.create({
			amount: Math.round(totalAmount * 100),
			currency: "usd",
			automatic_payment_methods: { enabled: true },
			metadata: { userId: req.user.id, eventId: event._id.toString(), ticketLabel, quantity: String(quantity) }
		});
		paymentId = paymentIntent.id;
	}

	const order = await Order.create({
		userId: req.user.id,
		items: [{ eventId: event._id, ticketLabel, unitPrice: ticket.price, quantity }],
		totalAmount,
		paymentStatus: stripe ? "pending" : "paid",
		paymentId,
		attendeeInfo: attendees
	});

	// On mock path, mark as sold immediately
	if (!stripe) {
		ticket.quantitySold += quantity;
		await event.save();
	}

	res.status(201).json({
		orderId: order._id,
		paymentId,
		clientSecret: stripe ? (await stripe.paymentIntents.retrieve(paymentId)).client_secret : null
	});
});

// Webhook placeholder (configure endpoint in Stripe)
router.post("/webhook", express.raw({ type: "application/json" }), async (req, res) => {
	try {
		const event = req.body;
		if (event.type === "payment_intent.succeeded") {
			const paymentIntent = event.data.object;
			const order = await Order.findOne({ paymentId: paymentIntent.id });
			if (order && order.paymentStatus !== "paid") {
				order.paymentStatus = "paid";
				await order.save();
				// Update ticket sold counts
				for (const item of order.items) {
					const ev = await Event.findById(item.eventId);
					if (!ev) continue;
					const ticket = ev.ticketTypes.find((t) => t.label === item.ticketLabel);
					if (ticket) {
						ticket.quantitySold += item.quantity;
						await ev.save();
					}
				}
			}
		}
		res.json({ received: true });
	} catch (e) {
		res.status(400).send(`Webhook Error: ${e.message}`);
	}
});

// List user's orders
router.get("/mine", requireAuth, async (req, res) => {
	const orders = await Order.find({ userId: req.user.id }).sort({ createdAt: -1 });
	res.json(orders);
});

export default router;


