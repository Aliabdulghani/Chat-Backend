import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import asyncHandler from "express-async-handler";

export const protectRoute = asyncHandler(async (req, res, next) => {
    let token;
    
    // التحقق من وجود التوكن في الهيدر
    if (req?.headers?.authorization && req.headers.authorization.includes("Bearer ")) {
        token = req.headers.authorization.split(" ")[1];
        
        try {
            // التحقق من صحة التوكن
            if (token) {
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                
                // العثور على المستخدم باستخدام الـ ID من التوكن
                const user = await User.findById(decoded?.id);
                
                // التحقق من وجود المستخدم
                if (!user) {
                    throw new Error("User not found");
                }

                req.user = user; // إضافة المستخدم إلى الطلب
                next(); // المتابعة إلى المسار التالي
            } else {
                throw new Error("Token is missing");
            }
        } catch (error) {
            // التعامل مع الأخطاء بشكل منظم
            res.status(401).json({
                message: error.message || "Not Authorized. Token may be expired, please log in again."
            });
        }
    } else {
        res.status(401).json({
            message: "No token provided, authorization denied"
        });
    }
});
