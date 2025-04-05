import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "Unauthorized - No Token Provided" });
        }

        const token = authHeader.split(" ")[1]; // Bearer <token>

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        req.user = user;
        next();

    } catch (error) {
        console.error("❌ Error in protectRoute middleware:", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
};
