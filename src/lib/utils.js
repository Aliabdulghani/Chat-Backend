import jwt from 'jsonwebtoken';

export const generateToken = (userId) => {
    try {
        const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
        return token;
    } catch (error) {
        console.error('Error generating token:', error.message);
        throw new Error('Failed to generate token');
    }
};

