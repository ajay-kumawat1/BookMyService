import {
  generateOtp,
  hashPassword,
  sendOtpMail,
  sendResponse,
  signToken,
  storeOtpInCookie,
} from "../../Common/common.js";
import {
  RESPONSE_CODE,
  RESPONSE_FAILURE,
  RESPONSE_SUCCESS,
} from "../../Common/constant.js";
import { verifyOTP } from "../../Common/otpVerification.js";
import { BusinessOwner } from "../../Models/BusinessOwnerModel.js";
import { User } from "../../Models/UserModel.js";
import { compare } from "bcrypt";

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

    const otp = await generateOtp();
    storeOtpInCookie(res, otp);
    await sendOtpMail(
      email,
      firstName,
      "/email_template/signup_email_template.html",
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
      password: await hashPassword(userData.password),
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

    const otp = await generateOtp();
    storeOtpInCookie(res, otp);
    await sendOtpMail(
      email,
      user.firstName,
      "/email_template/signup_email_template.html",
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

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user || !(await compare(password, user.password))) {
      return sendResponse(
        res,
        {},
        "Invalid email or password",
        RESPONSE_FAILURE,
        RESPONSE_CODE.UNAUTHORISED
      );
    }

    // Return the JWT using jsonwebtoken
    const payload = {
      user: {
        id: user._id,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      },
    };

    const token = await signToken(payload);

    return sendResponse(
      res,
      { user, token },
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

    const otp = await generateOtp();
    storeOtpInCookie(res, otp);
    res.cookie("resetEmail", email, {
      httpOnly: true,
      secure: true,
      maxAge: 5 * 60 * 1000,
    });

    await sendOtpMail(
      email,
      user.firstName,
      "/email_template/signup_email_template.html",
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
        RESPONSE_CODE.UNAUTHORISED
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

const registerBusinessOwner = async (req, res) => {
  try {
    const {
      ownerFirstName,
      ownerLastName,
      email,
      password,
      phoneNumber,
      businessName,
      businessCategory,
      businessDescription,
      businessAddress,
      city,
      state,
      zipCode,
      country,
    } = req.body;

    if (await BusinessOwner.findOne({ email })) {
      return sendResponse(
        res,
        {},
        "Email already exists",
        RESPONSE_FAILURE,
        RESPONSE_CODE.BAD_REQUEST
      );
    }

    const otp = await generateOtp();
    storeOtpInCookie(res, otp);
    await sendOtpMail(
      email,
      ownerFirstName,
      "/email_template/signup_email_template.html",
      otp
    );

    res.cookie(
      "business_owner_data",
      JSON.stringify({
        personalInfo: {
          ownerFirstName: ownerFirstName,
          ownerLastName: ownerLastName,
          email: email,
          password: password,
          phoneNumber: phoneNumber,
        },
        businessInfo: {
          businessName: businessName,
          businessCategory: businessCategory,
          businessDescription: businessDescription,
          businessAddress: businessAddress,
          city: city,
          state: state,
          zipCode: zipCode,
          country: country,
        },
      }),
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
    console.error("Register Business Owner Error:", error);
    return sendResponse(
      res,
      {},
      "Failed to register business owner",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
};

const verifyOtpAndCreateBusinessOwner = async (req, res) => {
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

    const businessOwnerData = JSON.parse(
      req.cookies.business_owner_data || "{}"
    );
    if (!businessOwnerData.personalInfo.email)
      return sendResponse(
        res,
        {},
        "Business owner data missing. Please register again.",
        RESPONSE_FAILURE,
        RESPONSE_CODE.BAD_REQUEST
      );

    const businessOwner = await BusinessOwner.create({
      ...businessOwnerData.personalInfo,
      ...businessOwnerData.businessInfo,
      password: await hashPassword(businessOwnerData.personalInfo.password),
      isVerified: true,
      role: "Owner",
    });

    res.clearCookie("business_owner_data");
    return sendResponse(
      res,
      businessOwner,
      "Business owner registered successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.CREATED
    );
  } catch (error) {
    console.error("Business Owner Creation Error:", error);
    return sendResponse(
      res,
      {},
      "Failed to create business owner",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
};

const businessOwnerLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const businessOwner = await Business.findOne({ email });

    if (!businessOwner || !(await compare(password, businessOwner.password))) {
      return sendResponse(
        res,
        {},
        "Invalid email or password",
        RESPONSE_FAILURE,
        RESPONSE_CODE.UNAUTHORISED
      );
    }

    // Return the JWT using jsonwebtoken
    const payload = {
      businessOwner: {
        id: businessOwner._id,
        role: businessOwner.role,
        ownerFirstName: businessOwner.ownerFirstName,
        ownerLastName: businessOwner.ownerLastName,
        email: businessOwner.email,
      },
    };

    const token = await signToken(payload);

    return sendResponse(
      res,
      { businessOwner, token },
      "Business Owner logged in successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error("Business Owner Login Error:", error);
    return sendResponse(
      res,
      {},
      "Failed to login",
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

  // registerBusinessOwner,
  registerBusinessOwner,
  verifyOtpAndCreateBusinessOwner,
  businessOwnerLogin,
};
