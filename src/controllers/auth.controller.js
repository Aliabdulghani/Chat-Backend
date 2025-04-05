import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import cloudinary from "../lib/cloudinary.js";

// ✅ دالة مساعدة تضمن استدعاء آمن لـ req.t()
const translate = (req, key, fallback) => (req.t ? req.t(key) : fallback || key);

// ✅ تسجيل مستخدم جديد
export const Signup = async (req, res) => {
    try {
        const { fullName, email, password, numberPhone } = req.body;

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: translate(req, "User already exists") });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            fullName,
            email,
            password: hashedPassword,
            numberPhone
        });

        const token = generateToken(user._id);

        res.status(201).json({
            token,
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                numberPhone: user.numberPhone,
            }
        });
    } catch (error) {
        console.error('❌ Error in Register Controller:', error);
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
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: translate(req, "Invalid credentials") });
        }

        const token = generateToken(user._id);

        res.status(200).json({
            token,
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                numberPhone: user.numberPhone,
                profilePic: user.profilePic
            }
        });
    } catch (error) {
        console.error("❌ Error in Login Controller:", error);
        res.status(500).json({ message: translate(req, "Internal Server Error") });
    }
};



// ✅ تسجيل الخروج
export const Logout = (req, res) => {
    try {
        res.cookie("jwt", "", { maxAge: 0 });
        res.status(200).json({ message: translate(req, "Logged out successfully") });
    } catch (error) {
        console.error("❌ Error in Logout Controller:", error);
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

        const uploadResponse = await cloudinary.uploader.upload(profilePic);
        const updatedUser = await User.findByIdAndUpdate(userId, { profilePic: uploadResponse.secure_url }, { new: true });

        res.status(200).json(updatedUser);

    } catch (error) {
        console.error("❌ Error in UpdateProfile Controller:", error);
        res.status(500).json({ message: translate(req, "Internal Server Error") });
    }
};

// ✅ تعديل الاسم الكامل
export const EditName = async (req, res) => {
    try {
        const { fullName } = req.body;
        const userId = req.user._id;

        if (!fullName) {
            return res.status(400).json({ message: translate(req, "Full name is required") });
        }

        const updatedUser = await User.findByIdAndUpdate(userId, { fullName }, { new: true });
        res.status(200).json(updatedUser);

    } catch (error) {
        console.error("❌ Error in EditName Controller:", error);
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
        const user = await User.findById(decoded.userId).select("-password");

        if (!user) {
            return res.status(404).json({ message: translate(req, "User not found") });
        }

        res.status(200).json(user);

    } catch (error) {
        console.error("❌ Error in CheckAuth Controller:", error);
        res.status(401).json({ message: translate(req, "Invalid or expired token") });
    }
};
