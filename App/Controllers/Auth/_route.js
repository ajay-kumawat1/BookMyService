import { Router } from "express";
import AuthController from "./AuthController.js";

const router = Router();

// **Signup & Account Verification**
router.post("/register", AuthController.register);
router.post("/verify-otp", AuthController.verifyOtp);
router.post("/resend-otp", AuthController.resendOtp);

// **Authentication**
router.post("/login", AuthController.login);

// **Password Reset**
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/verify-forgot-password-otp", AuthController.verifyOtp);
router.post("/reset-password", AuthController.resetPassword);

export default router;
