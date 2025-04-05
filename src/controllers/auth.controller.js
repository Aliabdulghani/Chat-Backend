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

        if (!fullName || !email || !password || !numberPhone) {
            return res.status(400).json({ message: translate(req, "All fields are required") });
        }

        if (numberPhone.length < 7) {
            return res.status(400).json({ message: translate(req, "Number Phone must be at least 7 Numbers") });
        }
        if (password.length < 6) {
            return res.status(400).json({ message: translate(req, "Password must be at least 6 characters") });
        }

        if (await User.findOne({ email })) {
            return res.status(400).json({ message: translate(req, "Email already exists") });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({ fullName, email, numberPhone, password: hashedPassword });
        await newUser.save();

        generateToken(newUser._id, res);

        res.status(201).json({
            _id: newUser._id,
            fullName,
            email,
            numberPhone,
            profilePic: newUser.profilePic,
        });

    } catch (error) {
        console.error("❌ Error in Signup Controller:", error);
        res.status(500).json({ message: translate(req, "Internal Server Error") });
    }
};

// ✅ تسجيل الدخول
export const Login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ email });
        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: translate(req, "Invalid credentials") });
        }

        const token = generateToken(user._id); // ✅ نحصل على التوكن

        res.status(200).json({
            token, // ✅ نرسله في الرد
            user: {
                _id: user._id,
                fullName: user.fullName,
                numberPhone: user.numberPhone,
                email: user.email,
                profilePic: user.profilePic,
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
export const checkAuth = (req, res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.error("❌ Error in CheckAuth Controller:", error);
        res.status(500).json({ message: translate(req, "Internal Server Error") });
    }
};
