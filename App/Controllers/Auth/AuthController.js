import { sendResponse } from "../../Common/common.js";
import {
  RESPONSE_CODE,
  RESPONSE_FAILURE,
  RESPONSE_SUCCESS,
} from "../../Common/constant.js";
import { sendMail } from "../../Common/mail.js";
import { User } from "../../Models/User.js";
import bcrypt from "bcrypt";
import path from "path";
import { fileURLToPath } from "url";

/** Generates a 6-digit OTP */
const generateOtp = () => Math.floor(100000 + Math.random() * 900000).toString();

/** Centralized function to store OTP in cookies */
const storeOtpInCookie = (res, otp) => {
  res.cookie("otp", otp, {
    httpOnly: true,
    secure: true,
    maxAge: 5 * 60 * 1000, // 5 minutes
  });
};

/** Sends OTP via email */
const sendOtpMail = async (email, firstName, templatePath, otp) => {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  await sendMail(email, firstName, otp, path.join(__dirname, templatePath));
};

/** Verifies OTP and executes callback */
const verifyOtp = (req, res, callback) => {
  if (req.cookies.otp !== req.body.otp) {
    return sendResponse(
      res, {}, "Invalid or expired OTP", RESPONSE_FAILURE, RESPONSE_CODE.UNAUTHORISED
    );
  }

  res.clearCookie("otp");
  if (callback) return callback();
  return sendResponse(res, {}, "OTP verified successfully", RESPONSE_SUCCESS, RESPONSE_CODE.SUCCESS);
};

/** Registers a user by sending OTP */
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phoneNumber } = req.body;

    if (await User.findOne({ email })) {
      return sendResponse(res, {}, "Email already exists", RESPONSE_FAILURE, RESPONSE_CODE.BAD_REQUEST);
    }

    const otp = generateOtp();
    storeOtpInCookie(res, otp);
    await sendOtpMail(email, firstName, "../../Common/email_template/signup_email_template.html", otp);

    res.cookie("user_data", JSON.stringify({ firstName, lastName, email, password, phoneNumber }), {
      httpOnly: true, secure: true, maxAge: 5 * 60 * 1000,
    });

    return sendResponse(res, {}, "OTP sent successfully", RESPONSE_SUCCESS, RESPONSE_CODE.SUCCESS);
  } catch (error) {
    console.error("Register Error:", error);
    return sendResponse(res, {}, "Failed to send OTP", RESPONSE_FAILURE, RESPONSE_CODE.INTERNAL_SERVER_ERROR);
  }
};

/** Verifies OTP and creates user */
const verifyOtpAndCreateUser = async (req, res) => {
  verifyOtp(req, res, async () => {
    try {
      const userData = JSON.parse(req.cookies.user_data || "{}");
      if (!userData.email) return sendResponse(res, {}, "User data missing. Please register again.", RESPONSE_FAILURE, RESPONSE_CODE.BAD_REQUEST);

      const user = await User.create({
        ...userData,
        password: await bcrypt.hash(userData.password, 10),
        isVerified: true,
        role: "User",
      });

      res.clearCookie("user_data");
      return sendResponse(res, user, "User registered successfully", RESPONSE_SUCCESS, RESPONSE_CODE.CREATED);
    } catch (error) {
      console.error("User Creation Error:", error);
      return sendResponse(res, {}, "Failed to create user", RESPONSE_FAILURE, RESPONSE_CODE.INTERNAL_SERVER_ERROR);
    }
  });
};

/** Resends OTP */
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return sendResponse(res, {}, "User not found", RESPONSE_FAILURE, RESPONSE_CODE.NOT_FOUND);

    const otp = generateOtp();
    storeOtpInCookie(res, otp);
    await sendOtpMail(email, user.firstName, "../../Common/email_template/signup_email_template.html", otp);

    return sendResponse(res, {}, "OTP resent successfully", RESPONSE_SUCCESS, RESPONSE_CODE.SUCCESS);
  } catch (error) {
    console.error("Resend OTP Error:", error);
    return sendResponse(res, {}, "Failed to resend OTP", RESPONSE_FAILURE, RESPONSE_CODE.INTERNAL_SERVER_ERROR);
  }
};

/** Logs in a user */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return sendResponse(res, {}, "Invalid email or password", RESPONSE_FAILURE, RESPONSE_CODE.UNAUTHORIZED);
    }

    return sendResponse(res, user, "User logged in successfully", RESPONSE_SUCCESS, RESPONSE_CODE.SUCCESS);
  } catch (error) {
    console.error("Login Error:", error);
    return sendResponse(res, {}, "Failed to login", RESPONSE_FAILURE, RESPONSE_CODE.INTERNAL_SERVER_ERROR);
  }
};

/** Handles forgot password by sending OTP */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return sendResponse(res, {}, "User not found", RESPONSE_FAILURE, RESPONSE_CODE.NOT_FOUND);

    const otp = generateOtp();
    storeOtpInCookie(res, otp);
    await sendOtpMail(email, user.firstName, "../../Common/email_template/forgot_password_email_template.html", otp);

    return sendResponse(res, {}, "OTP sent successfully", RESPONSE_SUCCESS, RESPONSE_CODE.SUCCESS);
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return sendResponse(res, {}, "Failed to send OTP", RESPONSE_FAILURE, RESPONSE_CODE.INTERNAL_SERVER_ERROR);
  }
};

/** Resets the user's password */
const resetPassword = async (req, res) => {
  verifyOtp(req, res, async () => {
    try {
      const { email, password } = req.body;
      await User.findOneAndUpdate({ email }, { password: await bcrypt.hash(password, 10) });

      return sendResponse(res, {}, "Password reset successfully", RESPONSE_SUCCESS, RESPONSE_CODE.SUCCESS);
    } catch (error) {
      console.error("Reset Password Error:", error);
      return sendResponse(res, {}, "Failed to reset password", RESPONSE_FAILURE, RESPONSE_CODE.INTERNAL_SERVER_ERROR);
    }
  });
};

export default {
  register,
  verifyOtpAndCreateUser,
  login,
  resendOtp,
  forgotPassword,
  resetPassword,
};
