import jwt from "jsonwebtoken";
import { User } from "../models/user.models.js";

export const protect = async (req, res, next) => {
    try {
        const authHeader = req.header("Authorization");
        
        if (!authHeader) {
            return res.status(401).json({ success: false, message: "Authorization header is missing" });
        }

        if (!authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ success: false, message: "Authorization header format is invalid" });
        }

        const token = authHeader.replace("Bearer ", "");
        if (!token) {
            return res.status(401).json({ success: false, message: "Token is missing" });
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

        const user = await User.findById(decodedToken?._id).select("-password -refreshToken");

        if (!user) {
            return res.status(401).json({ success: false, message: "Invalid Access Token" });
        }

        req.user = user;
        next();
    } catch (error) {
        console.error("JWT verification failed:", error.message);
        return res.status(401).json({ success: false, message: error?.message || "Invalid access token" });
    }
};
