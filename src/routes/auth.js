import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";

const router = express.Router();

router.post("/register", async (req, res) => {
	const { name, email, password } = req.body;
	if (!name || !email || !password) return res.status(400).json({ error: "Missing fields" });
	const existing = await User.findOne({ email });
	if (existing) return res.status(400).json({ error: "Email already in use" });
	const passwordHash = await bcrypt.hash(password, 10);
	const user = await User.create({ name, email, passwordHash, roles: [] });
	const token = jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "7d" });
	res.json({ token, user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin } });
});

router.post("/login", async (req, res) => {
	const { email, password } = req.body;
	if (!email || !password) return res.status(400).json({ error: "Missing fields" });
	const user = await User.findOne({ email });
	if (!user) return res.status(400).json({ error: "Invalid credentials" });
	const ok = await bcrypt.compare(password, user.passwordHash);
	if (!ok) return res.status(400).json({ error: "Invalid credentials" });
	const token = jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET, { expiresIn: "7d" });
	res.json({ token, user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin } });
});

export default router;


