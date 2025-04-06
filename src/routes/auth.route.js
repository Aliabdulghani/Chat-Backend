import express from 'express';
import { Signup, Login, Logout, UpdateProfile, EditName, checkAuth } from '../controllers/auth.controller.js';
import { protectRoute } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post("/signup", Signup);
router.post("/login", Login);
router.post("/logout", Logout);

router.put("/update-Profile", UpdateProfile);
router.put("/update-name", EditName);

router.get("/check", checkAuth);


export default router;