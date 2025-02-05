import { Router } from "express";
import AuthController from "./AuthController.js"

const route = Router();

route.post('/signup', AuthController.create);
route.post('/login', AuthController.login);
route.post('/verify-otp', AuthController.verifyOtpAndCreateUser);
route.post('/resend-otp', AuthController.resendOtp);
route.post('/forgot-password', AuthController.forgotPassword);
route.post('/verify-forgotPassword-otp', AuthController.verifyOtp);
route.post('/reset-password', AuthController.resetPassword);

export default route;

