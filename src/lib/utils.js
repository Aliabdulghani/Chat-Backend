import jwt from 'jsonwebtoken';

export const generateToken = (id) => {
    try {
        return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    } catch (error) {
        console.error('Error generating token:', error.message);
        throw new Error('Failed to generate token');
    }
};
