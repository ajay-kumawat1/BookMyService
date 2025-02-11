import { Router } from "express";
import AuthController from "./AuthController.js";
import {
  validateLogin,
  validateRegister,
  validateResetPassword,
} from "../../Middleware/auth.middleware.js";

const router = Router();

// **Signup & Account Verification**
router.post("/register", validateRegister, AuthController.register);
router.post("/verify-otp", AuthController.verifyOtp);
router.post("/resend-otp", AuthController.resendOtp);

// **Authentication**
router.post("/login", validateLogin, AuthController.login);

// **Password Reset**
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/verify-forgot-password-otp", AuthController.verifyOtp);
router.post("/reset-password", validateResetPassword, AuthController.resetPassword);

export default router;
