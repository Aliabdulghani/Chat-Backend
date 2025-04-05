import jwt from 'jsonwebtoken';

export const generateToken = (userId) => {
    try {
        // توليد التوكن مع إضافة خصائص إضافية (مثال: email أو username إذا كان متاحًا)
        const payload = { userId };
        const options = { expiresIn: '7d' };
        
        // توليد التوكن باستخدام مفتاح السر
        const token = jwt.sign(payload, process.env.JWT_SECRET, options);
        return token;
    } catch (error) {
        // تسجيل الخطأ بطريقة أكثر وضوحًا
        console.error('Error generating token:', error);
        throw new Error('Failed to generate token due to internal error');
    }
};
