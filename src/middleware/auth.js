import jwt from "jsonwebtoken";
import User from "../models/User.js";

export async function requireAuth(req, res, next) {
	try {
		const header = req.headers.authorization || "";
		const token = header.startsWith("Bearer ") ? header.slice(7) : null;
		if (!token) return res.status(401).json({ error: "Unauthorized" });
		const payload = jwt.verify(token, process.env.JWT_SECRET);
		const user = await User.findById(payload.userId).lean();
		if (!user) return res.status(401).json({ error: "Unauthorized" });
		req.user = { id: user._id.toString(), isAdmin: !!user.isAdmin, roles: user.roles || [] };
		next();
	} catch (e) {
		return res.status(401).json({ error: "Unauthorized" });
	}
}

export function requireAdmin(req, res, next) {
	if (!req.user?.isAdmin) return res.status(403).json({ error: "Forbidden" });
	next();
}

export async function optionalAuth(req, _res, next) {
	try {
		const header = req.headers.authorization || "";
		const token = header.startsWith("Bearer ") ? header.slice(7) : null;
		if (!token) return next();
		const payload = jwt.verify(token, process.env.JWT_SECRET);
		const user = await User.findById(payload.userId).lean();
		if (user) {
			req.user = { id: user._id.toString(), isAdmin: !!user.isAdmin, roles: user.roles || [] };
		}
	} catch {
		// ignore invalid token
	}
	next();
}


