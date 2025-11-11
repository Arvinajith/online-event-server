import express from "express";
import Event from "../models/Event.js";
import { requireAuth, optionalAuth } from "../middleware/auth.js";

const router = express.Router();

// Create event (organizer)
router.post("/", requireAuth, async (req, res) => {
	const payload = req.body;
	const event = await Event.create({
		...payload,
		organizerId: req.user.id,
		status: "pending",
		isPublished: false
	});
	res.status(201).json(event);
});

// Update event
router.put("/:id", requireAuth, async (req, res) => {
	const id = req.params.id;
	const existing = await Event.findById(id);
	if (!existing) return res.status(404).json({ error: "Not found" });
	if (existing.organizerId.toString() !== req.user.id && !req.user.isAdmin)
		return res.status(403).json({ error: "Forbidden" });
	Object.assign(existing, req.body);
	await existing.save();
	res.json(existing);
});

// Public list with search/filter
router.get("/", async (req, res) => {
	const { q, category, location, startDate, endDate, minPrice, maxPrice } = req.query;
	const filter = { status: "approved", isPublished: true };
	if (q) filter.title = { $regex: String(q), $options: "i" };
	if (category) filter.category = category;
	if (location) filter.location = { $regex: String(location), $options: "i" };
	if (startDate || endDate) {
		filter.startDate = {};
		if (startDate) filter.startDate.$gte = new Date(String(startDate));
		if (endDate) filter.startDate.$lte = new Date(String(endDate));
	}
	// price range filter: any ticketTypes price within range
	const priceConditions = [];
	if (minPrice) priceConditions.push({ "ticketTypes.price": { $gte: Number(minPrice) } });
	if (maxPrice) priceConditions.push({ "ticketTypes.price": { $lte: Number(maxPrice) } });
	const query = Event.find(filter);
	if (priceConditions.length) query.where({ $and: priceConditions });
	const events = await query.sort({ startDate: 1 }).limit(100);
	res.json(events);
});

// Get by id (public if approved/published, else restricted to owner/admin)
router.get("/:id", optionalAuth, async (req, res) => {
	const event = await Event.findById(req.params.id);
	if (!event) return res.status(404).json({ error: "Not found" });
	const isPublic = event.status === "approved" && event.isPublished;
	if (isPublic) return res.json(event);
	const isOwner = req.user && event.organizerId.toString() === req.user.id;
	const isAdmin = req.user && req.user.isAdmin;
	if (isOwner || isAdmin) return res.json(event);
	return res.status(403).json({ error: "Forbidden" });
});

export default router;


