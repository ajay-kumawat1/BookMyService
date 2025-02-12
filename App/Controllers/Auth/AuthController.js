import { generateOtp, sendOtpMail, sendResponse, storeOtpInCookie } from "../../Common/common.js";
import {
  RESPONSE_CODE,
  RESPONSE_FAILURE,
  RESPONSE_SUCCESS,
} from "../../Common/constant.js";
import { verifyOTP } from "../../Common/otpVerification.js";
import { User } from "../../Models/User.js";
import bcrypt from "bcrypt";

/** Registers a user by sending OTP */
const register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phoneNumber } = req.body;

    if (await User.findOne({ email })) {
      return sendResponse(
        res,
        {},
        "Email already exists",
        RESPONSE_FAILURE,
        RESPONSE_CODE.BAD_REQUEST
      );
    }

    const otp = generateOtp();
    storeOtpInCookie(res, otp);
    await sendOtpMail(
      email,
      firstName,
      "../../Common/email_template/signup_email_template.html",
      otp
    );

    res.cookie(
      "user_data",
      JSON.stringify({ firstName, lastName, email, password, phoneNumber }),
      {
        httpOnly: true,
        secure: true,
        maxAge: 5 * 60 * 1000,
      }
    );

    return sendResponse(
      res,
      {},
      "OTP sent successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error("Register Error:", error);
    return sendResponse(
      res,
      {},
      "Failed to send OTP",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
};

/** Verifies OTP and creates user */
const verifyOtpAndCreateUser = async (req, res) => {
  try {
    const otpVerify = verifyOTP(req.cookies.otp, req.body.otp);
    if (!otpVerify) {
      return sendResponse(
        res,
        {},
        "OTP verification failed",
        RESPONSE_FAILURE,
        RESPONSE_CODE.UNAUTHORISED
      );
    }

    const userData = JSON.parse(req.cookies.user_data || "{}");
    if (!userData.email)
      return sendResponse(
        res,
        {},
        "User data missing. Please register again.",
        RESPONSE_FAILURE,
        RESPONSE_CODE.BAD_REQUEST
      );

    const user = await User.create({
      ...userData,
      password: await bcrypt.hash(userData.password, 10),
      isVerified: true,
      role: "User",
    });

    res.clearCookie("user_data");
    return sendResponse(
      res,
      user,
      "User registered successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.CREATED
    );
  } catch (error) {
    console.error("User Creation Error:", error);
    return sendResponse(
      res,
      {},
      "Failed to create user",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
};

/** Resends OTP */
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user)
      return sendResponse(
        res,
        {},
        "User not found",
        RESPONSE_FAILURE,
        RESPONSE_CODE.NOT_FOUND
      );

    const otp = generateOtp();
    storeOtpInCookie(res, otp);
    await sendOtpMail(
      email,
      user.firstName,
      "../../Common/email_template/signup_email_template.html",
      otp
    );

    return sendResponse(
      res,
      {},
      "OTP resent successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error("Resend OTP Error:", error);
    return sendResponse(
      res,
      {},
      "Failed to resend OTP",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
};

/** Logs in a user */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return sendResponse(
        res,
        {},
        "Invalid email or password",
        RESPONSE_FAILURE,
        RESPONSE_CODE.UNAUTHORIZED
      );
    }

    return sendResponse(
      res,
      user,
      "User logged in successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error("Login Error:", error);
    return sendResponse(
      res,
      {},
      "Failed to login",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
};

/** Handles forgot password by sending OTP */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return sendResponse(
        res,
        {},
        "User not found",
        RESPONSE_FAILURE,
        RESPONSE_CODE.NOT_FOUND
      );

    const otp = generateOtp();
    storeOtpInCookie(res, otp);
    res.cookie("resetEmail", email, {
      httpOnly: true,
      secure: true,
      maxAge: 5 * 60 * 1000,
    });

    await sendOtpMail(
      email,
      user.firstName,
      "../../Common/email_template/signup_email_template.html",
      otp
    );

    return sendResponse(
      res,
      {},
      "OTP sent successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return sendResponse(
      res,
      {},
      "Failed to send OTP",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
};

/** Verifies OTP */
const forgotPasswordVerifyOtp = (req, res) => {
  try {
    const otpVerify = verifyOTP(req.cookies.otp, req.body.otp);
    if (!otpVerify) {
      return sendResponse(
        res,
        {},
        "OTP verification failed",
        RESPONSE_FAILURE,
        RESPONSE_CODE.UNAUTHORISED
      );
    }

    return sendResponse(
      res,
      {},
      "OTP verified successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
    
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return sendResponse(
      res,
      {},
      "Failed to verify OTP",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
};

/** Resets the user's password */
const resetPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;

    const email = req.cookies.resetEmail;
    if (!email) {
      return sendResponse(
        res,
        {},
        "Session expired or invalid request",
        RESPONSE_FAILURE,
        RESPONSE_CODE.UNAUTHORIZED
      );
    }

    if (password !== confirmPassword) {
      return sendResponse(
        res,
        {},
        "Passwords do not match",
        RESPONSE_FAILURE,
        RESPONSE_CODE.BAD_REQUEST
      );
    }

    await User.findOneAndUpdate(
      { email },
      { password: await bcrypt.hash(password, 10) }
    );
    res.clearCookie("resetEmail");

    return sendResponse(
      res,
      {},
      "Password reset successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error("Reset Password Error:", error);
    return sendResponse(
      res,
      {},
      "Failed to reset password",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
};

export default {
  register,
  verifyOtpAndCreateUser,
  login,
  resendOtp,
  forgotPassword,
  forgotPasswordVerifyOtp,
  resetPassword,
};
