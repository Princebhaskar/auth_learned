import express from 'express';
import { registerUser  , verifyUser , login ,logout, getUserProfile ,forgotPassword , resetPassword} from "../controllers/userController.js";
import { isAuthenticated } from '../middleware/auth.js';


const router = express.Router();

router.post("/register", registerUser);
router.post("/otp-verification" , verifyUser);
router.post("/login" ,login);
router.get("/logout" ,isAuthenticated, logout);
router.get("/me" , isAuthenticated , getUserProfile);
router.post("/forgot-password" , forgotPassword);
router.put("/reset-password/:token" , resetPassword);



export default router;
