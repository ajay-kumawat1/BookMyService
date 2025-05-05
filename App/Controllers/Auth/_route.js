import { Router } from "express";
import AuthController from "./AuthController.js";
import {
  validateLogin,
  validateRegister,
  validateResetPassword,
  validJWTNeeded,
} from "../../Middleware/auth.middleware.js";
import passport from "../../Config/passport.js";

const router = Router();

// Get the login user
router.get("/me", validJWTNeeded, AuthController.getMe);

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
router.post("/businessOwnerLogin", AuthController.businessOwnerLogin);

// Social Login Routes
// Google OAuth Routes
router.get(
  "/google",
  (req, res, next) => {
    console.log("Starting Google OAuth flow...");
    console.log("Google Client ID:", process.env.GOOGLE_CLIENT_ID);
    console.log("Google Client Secret:", process.env.GOOGLE_CLIENT_SECRET ? "Set (hidden)" : "Not set");
    next();
  },
  passport.authenticate("google", {
    scope: ["profile", "email"],
    prompt: "select_account" // Force Google to always show the account selection screen
  })
);

router.get(
  "/google/callback",
  (req, res, next) => {
    console.log("Google OAuth callback received");
    if (req.query.error) {
      console.error("Google OAuth error:", req.query.error);
    }
    next();
  },
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
    failWithError: true
  }),
  AuthController.socialLoginCallback
);

// Facebook OAuth Routes
router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email"] })
);

router.get(
  "/facebook/callback",
  passport.authenticate("facebook", { session: false, failureRedirect: "/login" }),
  AuthController.socialLoginCallback
);

export default router;
