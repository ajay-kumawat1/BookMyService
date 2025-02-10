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

/**
 * Generates a 6-digit OTP
 */
const generateOtp = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

/**
 * Sends an OTP email
 */
const sendOtpMail = async (email, firstName, templatePath, otp) => {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const emailTemplatePath = path.join(__dirname, templatePath);

  await sendMail(email, firstName, otp, emailTemplatePath);
};

/**
 * Registers a user by sending an OTP for email verification
 */
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
    const templatePath =
      "../../Common/email_template/signup_email_template.html";
    res.cookie("otp", otp, {
      httpOnly: true,
      secure: true,
      maxAge: 5 * 60 * 1000,
    });

    await sendOtpMail(email, firstName, templatePath, otp);

    res.cookie(
      "user_data",
      JSON.stringify({ firstName, lastName, email, password, phoneNumber }),
      {
        httpOnly: true,
        secure: true,
        maxAge: 5 * 60 * 1000, // 5 minutes
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
    console.error(`UserController.register() -> Error: ${error}`);
    return sendResponse(
      res,
      {},
      "Failed to send OTP",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Verifies OTP and creates user
 */
const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const storedOtp = req.cookies.otp;
    const userData = req.cookies.user_data
      ? JSON.parse(req.cookies.user_data)
      : null;

    if (!storedOtp || storedOtp !== otp || !userData) {
      return sendResponse(
        res,
        {},
        "Invalid or expired OTP",
        RESPONSE_FAILURE,
        RESPONSE_CODE.UNAUTHORIZED
      );
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = await User.create({
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      password: hashedPassword,
      phoneNumber: userData.phoneNumber,
      isVerified: true,
      role: "User",
    });

    if (!user) {
      return sendResponse(
        res,
        {},
        "Failed to register user",
        RESPONSE_FAILURE,
        RESPONSE_CODE.INTERNAL_SERVER_ERROR
      );
    }

    res.clearCookie("otp");
    res.clearCookie("user_data");

    return sendResponse(
      res,
      user,
      "User registered successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.CREATED
    );
  } catch (error) {
    console.error(`UserController.verifyOtp() -> Error: ${error}`);
    return sendResponse(
      res,
      {},
      "Failed to verify OTP",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Resends OTP to the user
 */
const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return sendResponse(
        res,
        {},
        "User not found",
        RESPONSE_FAILURE,
        RESPONSE_CODE.NOT_FOUND
      );
    }

    const otp = generateOtp();
    res.cookie("otp", otp, {
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
      "OTP resent successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`UserController.resendOtp() -> Error: ${error}`);
    return sendResponse(
      res,
      {},
      "Failed to resend OTP",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Logs in a user
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return sendResponse(
        res,
        {},
        "User not found",
        RESPONSE_FAILURE,
        RESPONSE_CODE.NOT_FOUND
      );
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return sendResponse(
        res,
        {},
        "Invalid password",
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
    console.error(`UserController.login() -> Error: ${error}`);
    return sendResponse(
      res,
      {},
      "Failed to login",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Handles forgotten password by sending OTP
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return sendResponse(
        res,
        {},
        "User not found",
        RESPONSE_FAILURE,
        RESPONSE_CODE.NOT_FOUND
      );
    }

    const otp = generateOtp();
    res.cookie("otp", otp, {
      httpOnly: true,
      secure: true,
      maxAge: 5 * 60 * 1000,
    });

    await sendOtpMail(
      email,
      user.firstName,
      "../../Common/email_template/forgot_password_email_template.html",
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
    console.error(`UserController.forgotPassword() -> Error: ${error}`);
    return sendResponse(
      res,
      {},
      "Failed to send OTP",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
};

/**
 * Resets the user's password
 */
const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.findOneAndUpdate({ email }, { password: hashedPassword });

    return sendResponse(
      res,
      {},
      "Password reset successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`UserController.resetPassword() -> Error: ${error}`);
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
  verifyOtp,
  login,
  resendOtp,
  forgotPassword,
  resetPassword,
};
