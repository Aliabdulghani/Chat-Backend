import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import cloudinary from "../lib/cloudinary.js";
import jwt from "jsonwebtoken";

// ✅ دالة مساعدة تضمن استدعاء آمن لـ req.t()
const translate = (req, key, fallback) => (req.t ? req.t(key) : fallback || key);

// ✅ تسجيل مستخدم جديد
export const Signup = async (req, res) => {
    try {
        const { fullName, email, password, numberPhone } = req.body;

        // تحقق من وجود جميع الحقول المطلوبة
        if (!fullName || !email || !password || !numberPhone) {
            return res.status(400).json({
                message: translate(req, "All fields are required"),
            });
        }

        // تحقق من وجود المستخدم مسبقًا
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({
                message: translate(req, "User already exists"),
            });
        }
        // تحقق من وجود رقم الجوال مسبقًا 
        const checkPhone = await User.findOne({ numberPhone });
        if (checkPhone) {
            return res.status(400).json({
                message: translate(req, "numberPhone already exists"),
            });
        }

        // تشفير كلمة المرور
        const hashedPassword = await bcrypt.hash(password, 10);

        // إنشاء المستخدم الجديد
        const user = await User.create({
            fullName,
            email,
            password: hashedPassword,
            numberPhone,
        });

        // إنشاء التوكن
        const token = generateToken(user._id);

        // إرجاع البيانات
        res.status(201).json({
            token,
            user: {
                _id: user._id,
                fullName: user.fullName,
                email: user.email,
                numberPhone: user.numberPhone,
                profilePic: user.profilePic || null,
            },
        });
    } catch (error) {
        console.error("❌ Error in Signup Controller:", error.message);
        res.status(500).json({
            message: translate(req, "Internal Server Error"),
        });
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

        // التحقق من وجود الصورة
        if (!profilePic) {
            return res.status(400).json({ message: translate(req, "Profile pic is required") });
        }

        // التحقق من نوع الصورة (إضافة فحص بسيط)
        const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        const imageMimeType = profilePic.split(';')[0]; // الحصول على النوع
        if (!validImageTypes.includes(imageMimeType)) {
            return res.status(400).json({ message: translate(req, "Invalid image format. Please upload a jpg, jpeg, or png image.") });
        }

        // رفع الصورة إلى Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(profilePic, {
            folder: 'user_profile_pics', // تحديد المجلد لتخزين الصور في Cloudinary
        });

        // تحديث صورة المستخدم في قاعدة البيانات
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

        // التحقق من وجود الاسم الكامل
        if (!fullName) {
            return res.status(400).json({ message: translate(req, "Full name is required") });
        }

        // التأكد أن الاسم الكامل يحتوي على أكثر من حرفين (على سبيل المثال)
        if (fullName.length < 3) {
            return res.status(400).json({ message: translate(req, "Full name must be at least 3 characters long") });
        }

        // التحقق من أن المستخدم الذي يحاول التعديل هو نفس المستخدم الذي يملك التوكن
        if (userId !== req.user._id) {
            return res.status(403).json({ message: translate(req, "You are not authorized to update this profile") });
        }

        // تحديث الاسم الكامل للمستخدم في قاعدة البيانات
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
        const user = await User.findById(decoded.id).select("-password");  // تأكد من استخدام `decoded.id`

        if (!user) {
            return res.status(404).json({ message: translate(req, "User not found") });
        }

        res.status(200).json(user);

    } catch (error) {
        console.error("❌ Error in CheckAuth Controller:", error);
        res.status(401).json({ message: translate(req, "Invalid or expired token") });
    }
};
