import express from "express";
import { requireAuth, requireAdmin } from "../middleware/auth.js";
import Event from "../models/Event.js";
import User from "../models/User.js";
import Order from "../models/Order.js";

const router = express.Router();

router.use(requireAuth, requireAdmin);

// Approve or reject event
router.post("/events/:id/moderate", async (req, res) => {
	const { status, publish } = req.body; // status: approved|rejected
	const ev = await Event.findById(req.params.id);
	if (!ev) return res.status(404).json({ error: "Not found" });
	if (status) ev.status = status;
	if (typeof publish === "boolean") ev.isPublished = publish;
	await ev.save();
	res.json(ev);
});

// Basic reporting
router.get("/reports/summary", async (_req, res) => {
	const [totalUsers, totalEvents, totalOrders, paidOrders, pendingOrders] = await Promise.all([
		User.countDocuments({}),
		Event.countDocuments({}),
		Order.countDocuments({}),
		Order.countDocuments({ paymentStatus: "paid" }),
		Order.countDocuments({ paymentStatus: "pending" })
	]);
	const revenueAgg = await Order.aggregate([
		{ $match: { paymentStatus: "paid" } },
		{ $group: { _id: null, revenue: { $sum: "$totalAmount" } } }
	]);
	const revenue = revenueAgg[0]?.revenue || 0;
	res.json({ totalUsers, totalEvents, totalOrders, paidOrders, pendingOrders, revenue });
});

export default router;


