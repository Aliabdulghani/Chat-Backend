// const mongoose = require('mongoose');
import mongoose from "mongoose";
export const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.info("Database connection successful.");
    } catch (err) {
        console.error("Database connection failed:", err);
        process.exit(1);
    }
};
