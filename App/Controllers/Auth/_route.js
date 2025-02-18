import { Router } from "express";
import AuthController from "./AuthController.js";
import {
  validateLogin,
  validateRegister,
  validateResetPassword,
  validJWTNeeded,
} from "../../Middleware/auth.middleware.js";

const router = Router();

// **User Registration & OTP Verification**
router.post("/register", validateRegister, AuthController.register);
router.post("/verifyAndCreateUser", AuthController.verifyOtpAndCreateUser);
router.post("/resendOtp", validJWTNeeded, AuthController.resendOtp);

// **Authentication**
router.post("/login", validateLogin, AuthController.login);

// **Password Reset**
router.post("/forgotPassword", AuthController.forgotPassword);
router.post("/verifyOtp", AuthController.forgotPasswordVerifyOtp);
router.post(
  "/resetPassword",
  validateResetPassword,
  AuthController.resetPassword
);

// ** Business Owner Registration **
router.post("/registerBusinessOwner", AuthController.registerBusinessOwner);
router.post(
  "/verifyAndCreateBusinessOwner",
  AuthController.verifyOtpAndCreateBusinessOwner
);

export default router;
