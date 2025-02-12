import { Router } from "express";
import AuthController from "./AuthController.js";
import {
  validateLogin,
  validateRegister,
  validateResetPassword,
} from "../../Middleware/auth.middleware.js";

const router = Router();

// **User Registration & OTP Verification**
router.post("/register", validateRegister, AuthController.register);
router.post("/verifyAndCreateUser", AuthController.verifyOtpAndCreateUser);
router.post("/resendOtp", AuthController.resendOtp);

// **Authentication**
router.post("/login", validateLogin, AuthController.login);

// **Password Reset**
router.post("/forgotPassword", AuthController.forgotPassword);
router.post("/verifyOtp", AuthController.forgotPasswordVerifyOtp);
router.post("/resetPassword", validateResetPassword, AuthController.resetPassword);

export default router;
