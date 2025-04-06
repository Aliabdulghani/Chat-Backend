import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import cloudinary from "../lib/cloudinary.js";
import jwt from "jsonwebtoken";

// ✅ دالة مساعدة آمنة للترجمة
const translate = (req, key, fallback) => (req.t ? req.t(key) : fallback || key);

// ✅ توليد كائن المستخدم المطلوب إرساله في الرد
const formatUser = (user) => ({
    _id: user._id,
    fullName: user.fullName,
    email: user.email,
    numberPhone: user.numberPhone,
    profilePic: user.profilePic || null,
});

// ✅ تسجيل مستخدم جديد
export const Signup = async (req, res) => {
    try {
        const { fullName, email, password, numberPhone } = req.body;

        if (!fullName || !email || !password || !numberPhone) {
            return res.status(400).json({ message: translate(req, "All fields are required") });
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: translate(req, "User already exists") });
        }

        const phoneExists = await User.findOne({ numberPhone });
        if (phoneExists) {
            return res.status(400).json({ message: translate(req, "Phone number already exists") });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({ fullName, email, password: hashedPassword, numberPhone });
        const token = generateToken(user._id);

        res.status(201).json({
            message: translate(req, "Account created successfully"),
            token,
            user: formatUser(user),
        });
    } catch (error) {
        console.error("[Signup Error]:", error?.message);
        res.status(500).json({ message: translate(req, "Internal Server Error") });
    }
};

// ✅ تسجيل الدخول
export const Login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: translate(req, "Email and password are required") });
        }

        const user = await User.findOne({ email });
        const isMatch = user && (await bcrypt.compare(password, user.password));

        if (!isMatch) {
            return res.status(400).json({ message: translate(req, "Invalid credentials") });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            message: translate(req, "Logged in successfully"),
            token,
            user: formatUser(user),
        });
    } catch (error) {
        console.error("[Login Error]:", error?.message);
        res.status(500).json({ message: translate(req, "Internal Server Error") });
    }
};

// ✅ تسجيل الخروج
export const Logout = (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 });
        res.status(200).json({ message: translate(req, "Logged out successfully") });
    } catch (error) {
        console.error("[Logout Error]:", error?.message);
        res.status(500).json({ message: translate(req, "Internal Server Error") });
    }
};

// ✅ تحديث الصورة الشخصية
export const UpdateProfile = async (req, res) => {
    try {
        const { profilePic } = req.body;
        const userId = req.user._id;

        if (!profilePic) {
            return res.status(400).json({ message: translate(req, "Profile pic is required") });
        }

        const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        const imageMimeType = profilePic.split(';')[0];
        if (!validImageTypes.includes(imageMimeType)) {
            return res.status(400).json({ message: translate(req, "Invalid image format. Please upload a jpg, jpeg, or png image.") });
        }

        const uploadResponse = await cloudinary.uploader.upload(profilePic, { folder: 'user_profile_pics' });
        const updatedUser = await User.findByIdAndUpdate(userId, { profilePic: uploadResponse.secure_url }, { new: true });

        res.status(200).json({
            message: translate(req, "Profile picture updated successfully"),
            user: formatUser(updatedUser),
        });
    } catch (error) {
        console.error("[UpdateProfile Error]:", error?.message);
        res.status(500).json({ message: translate(req, "Internal Server Error") });
    }
};

// ✅ تعديل الاسم الكامل
export const EditName = async (req, res) => {
    try {
        const { fullName } = req.body;
        const userId = req.user._id;

        if (!fullName || fullName.length < 3) {
            return res.status(400).json({ message: translate(req, "Full name must be at least 3 characters long") });
        }

        const updatedUser = await User.findByIdAndUpdate(userId, { fullName }, { new: true });

        res.status(200).json({
            message: translate(req, "Name updated successfully"),
            user: formatUser(updatedUser),
        });
    } catch (error) {
        console.error("[EditName Error]:", error?.message);
        res.status(500).json({ message: translate(req, "Internal Server Error") });
    }
};

// ✅ التحقق من تسجيل الدخول
export const checkAuth = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: translate(req, "No token provided") });
        }

        const token = authHeader.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("-password");

        if (!user) {
            return res.status(404).json({ message: translate(req, "User not found") });
        }

        res.status(200).json({ user: formatUser(user) });
    } catch (error) {
        console.error("[CheckAuth Error]:", error?.message);
        res.status(401).json({ message: translate(req, "Invalid or expired token") });
    }
};
