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

const create = async (req, res) => {
  try {
    const { firstName, email, password } = req.body;

    const isEmailExist = await User.findOne({ email });
    if (isEmailExist) {
      return sendResponse(
        res,
        {},
        "Email already exists",
        RESPONSE_FAILURE,
        RESPONSE_CODE.BAD_REQUEST
      );
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    res.cookie("otp", otp, {
      httpOnly: true,
      secure: true,
      maxAge: 5 * 60 * 1000, // 5 minutes
    });
    const otps = req.cookies.otp; // Access OTP from cookies

    // Email template path
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const emailTemplatePath = path.join(
      __dirname,
      "../../Common/email_template/signup_email_template.html"
    );

    await sendMail(email, firstName, otp, emailTemplatePath);

    return sendResponse(
      res,
      {},
      "OTP sent successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`UserController.sendOtp() -> Error: ${error}`);
    return sendResponse(
      res,
      {},
      "Failed to send OTP",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
};

const verifyOtpAndCreateUser = async (req, res) => {
  try {
    const { firstName, email, password, otp } = req.body;
    const storedOtp = req.cookies.otp;

    if (!storedOtp || storedOtp !== otp) {
      return sendResponse(
        res,
        {},
        "Invalid or expired OTP",
        RESPONSE_FAILURE,
        RESPONSE_CODE.UNAUTHORISED
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      ...req.body,
      password: hashedPassword,
      role: "User",
    });

    res.clearCookie("otp"); // Remove OTP after successful verification

    return sendResponse(
      res,
      user,
      "User created successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.CREATED
    );
  } catch (error) {
    console.error(`UserController.verifyOtpAndCreateUser() -> Error: ${error}`);
  }
};

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
        RESPONSE_CODE.UNAUTHORISED
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
    console.error(`UserController.Login() -> Error: ${error}`);
  }
};

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

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    res.cookie("otp", otp, {
      httpOnly: true,
      secure: true,
      maxAge: 5 * 60 * 1000, // 5 minutes
    });

    // Email template path
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const emailTemplatePath = path.join(
      __dirname,
      "../../Common/email_template/signup_email_template.html"
    );

    await sendMail(email, user.firstName, otp, emailTemplatePath);

    return sendResponse(
      res,
      {},
      "OTP sent successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`UserController.resendOtp() -> Error: ${error}`);
  }
};

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

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    res.cookie("otp", otp, {
      httpOnly: true,
      secure: true,
      maxAge: 5 * 60 * 1000, // 5 minutes
    });

    // Email template path
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const emailTemplatePath = path.join(
      __dirname,
      "../../Common/email_template/forgot_password_email_template.html"
    );

    await sendMail(email, user.firstName, otp, emailTemplatePath);

    return sendResponse(
      res,
      {},
      "OTP sent successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`UserController.forgotPassword() -> Error: ${error}`);
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    const storedOtp = req.cookies.otp;

    if (!storedOtp || storedOtp !== otp) {
      return sendResponse(
        res,
        {},
        "Invalid or expired OTP",
        RESPONSE_FAILURE,
        RESPONSE_CODE.UNAUTHORISED
      );
    }

    res.clearCookie("otp"); // Remove OTP after successful verification

    return sendResponse(
      res,
      {},
      "OTP verified successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`UserController.verifyOtp() -> Error: ${error}`);
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    await User.findOneAndUpdate({ email: email }, { password: hashedPassword });

    return sendResponse(
      res,
      {},
      "Password reset successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`UserController.resetPassword() -> Error: ${error}`);
  }
};

const getMyProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return sendResponse(
        res,
        {},
        "User not found",
        RESPONSE_FAILURE,
        RESPONSE_CODE.NOT_FOUND
      );
    }

    return sendResponse(
      res,
      user,
      "User fetched successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`UserController.getMyProfile() -> Error: ${error}`);
  }
};

export default {
  create,
  verifyOtpAndCreateUser,
  login,
  resendOtp,
  forgotPassword,
  verifyOtp,
  resetPassword,
  getMyProfile,
};
