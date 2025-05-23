import Joi from "joi";
import { sendResponse } from "../Common/common.js";
import { RESPONSE_CODE, RESPONSE_FAILURE } from "../Common/constant.js";
import pkg from "lodash";
const { isEmpty } = pkg;
import jwt, { decode } from "jsonwebtoken";
import  User  from "../Models/UserModel.js";
import  BusinessOwner  from "../Models/BusinessOwnerModel.js";
import { Role } from "../Common/enum.js";

/**
 * Validate Registration Request
 */
const validateRegister = async (req, res, next) => {
  try {
    if (isEmpty(req.body)) {
      return sendResponse(
        res,
        {},
        "Registration data is required.",
        RESPONSE_FAILURE,
        RESPONSE_CODE.BAD_REQUEST
      );
    }

    const registerSchema = Joi.object({
      firstName: Joi.string().required().messages({
        "any.required": "First name is required.",
      }),
      lastName: Joi.string().optional(),
      email: Joi.string().email().required().messages({
        "string.email": "Please enter a valid email.",
        "any.required": "Email is required.",
      }),
      password: Joi.string().min(6).required().messages({
        "string.min": "Password must be at least 6 characters long.",
        "any.required": "Password is required.",
      }),
      phoneNumber: Joi.string()
        .pattern(new RegExp("^\\d{10}$"))
        .required()
        .messages({
          "string.pattern.base": "Phone number must be a 10-digit number.",
          "any.required": "Phone number is required.",
        }),
    });

    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return sendResponse(
        res,
        {},
        `Registration failed: ${error.details
          .map((x) => x.message)
          .join(", ")}`,
        RESPONSE_FAILURE,
        RESPONSE_CODE.BAD_REQUEST
      );
    }

    req.body = value;
    next();
  } catch (error) {
    console.error(`validateRegister() -> Error: ${error}`);
    return sendResponse(
      res,
      {},
      "An error occurred during registration validation.",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
};

const validateLogin = async (req, res, next) => {
  if (isEmpty(req.body)) {
    return sendResponse(
      res,
      {},
      "Login data is required.",
      RESPONSE_FAILURE,
      RESPONSE_CODE.BAD_REQUEST
    );
  }

  const loginSchema = Joi.object({
    email: Joi.string().email().required().messages({
      "string.email": "Please enter a valid email.",
      "any.required": "Email is required.",
    }),
    password: Joi.string().required().messages({
      "any.required": "Password is required.",
    }),
  });

  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    return sendResponse(
      res,
      {},
      `Login failed: ${error.details.map((x) => x.message).join(", ")}`,
      RESPONSE_FAILURE,
      RESPONSE_CODE.BAD_REQUEST
    );
  }

  req.body = value;
  next();
};

const validateResetPassword = async (req, res, next) => {
  if (isEmpty(req.params.token)) {
    return sendResponse(
      res,
      {},
      "Reset password token is missing or invalid.",
      RESPONSE_FAILURE,
      RESPONSE_CODE.BAD_REQUEST
    );
  }
  if (isEmpty(req.body)) {
    return sendResponse(
      res,
      {},
      "New password is required.",
      RESPONSE_FAILURE,
      RESPONSE_CODE.BAD_REQUEST
    );
  }

  const resetPasswordSchema = Joi.object({
    password: Joi.string().min(8).required().messages({
      "string.min": "Password must be at least 8 characters long.",
      "any.required": "Password is required.",
    }),
    confirmPassword: Joi.string()
      .valid(Joi.ref("password"))
      .required()
      .messages({
        "any.only": "Passwords do not match.",
        "any.required": "Confirm password is required.",
      }),
  });

  const { error, value } = resetPasswordSchema.validate(req.body);
  if (error) {
    return sendResponse(
      res,
      {},
      `Reset password failed: ${error.details
        .map((x) => x.message)
        .join(", ")}`,
      RESPONSE_FAILURE,
      RESPONSE_CODE.BAD_REQUEST
    );
  }
  req.body = value;
  next();
};

/**
 * Validate JWT Token Middleware
 */
const validJWTNeeded = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log(`[validJWTNeeded] Request path: ${req.path}`); // Log the route
  console.log(`[validJWTNeeded] Authorization header: ${authHeader}`); // Log the header
  const authToken = req.headers.authorization;
  if (!authToken || !authToken.startsWith("Bearer ")) {
    return sendResponse(
      res,
      {},
      "Authentication required. Please log in.",
      RESPONSE_FAILURE,
      RESPONSE_CODE.UNAUTHORISED
    );
  }
  const token = authToken.split(" ")[1];

  try {
    const decode = jwt.verify(token, process.env.JWT_SECRET);
    console.log("[validJWTNeeded] Decoded token:", decode);

    const userType = decode.businessOwner ? "businessOwner" : "user";
    const userId = decode[userType]?.id;
    const userModel = userType === "businessOwner" ? BusinessOwner : User;

    if (!userId) {
      return sendResponse(
        res,
        {},
        "Invalid token: User ID missing.",
        RESPONSE_FAILURE,
        RESPONSE_CODE.UNAUTHORISED
      );
    }

    const user = await userModel.findById(userId);
    if (!user) {
      return sendResponse(
        res,
        {},
        "Invalid token: User does not exist.",
        RESPONSE_FAILURE,
        RESPONSE_CODE.UNAUTHORISED
      );
    }

    // Create a user object with all necessary properties
    req.user = {
      id: userId,
      role: user.role || decode[userType]?.role,
      ...decode[userType]
    };

    console.log("[validJWTNeeded] User set in request:", req.user);
    return next();
  } catch (error) {
    console.error(`validJWTNeeded() -> Error: ${error.message}`);
    return sendResponse(
      res,
      {},
      "Invalid or expired token. Please log in again.",
      RESPONSE_FAILURE,
      RESPONSE_CODE.UNAUTHORISED
    );
  }
};

const isAdminAuthenticated = async (req, res, next) => {
  const authToken = req.headers.authorization;
  if (!authToken || !authToken.startsWith("Bearer ")) {
    return sendResponse(
      res,
      {},
      "Authentication required. Please log in.",
      RESPONSE_FAILURE,
      RESPONSE_CODE.UNAUTHORISED
    );
  }
  const token = authToken.split(" ")[1];

  try {
    const decodeToken = jwt.verify(token, process.env.JWT_SECRET);
    console.log("[isAdminAuthenticated] Decoded token:", decodeToken);

    // Check if the user is a business owner with SuperAdmin role
    if (decodeToken.businessOwner && decodeToken.businessOwner.role === "SuperAdmin") {
      // Find the business owner in the database to get the most up-to-date role
      const businessOwner = await BusinessOwner.findById(decodeToken.businessOwner.id);

      if (!businessOwner) {
        return sendResponse(
          res,
          {},
          "Business owner not found",
          RESPONSE_FAILURE,
          RESPONSE_CODE.UNAUTHORISED
        );
      }

      console.log("[isAdminAuthenticated] Business owner from DB:", businessOwner);

      if (businessOwner.role === "SuperAdmin") {
        req.user = {
          ...decodeToken.businessOwner,
          role: businessOwner.role
        };
        console.log("[isAdminAuthenticated] SuperAdmin authenticated:", req.user);
        return next();
      } else {
        console.log("[isAdminAuthenticated] Not a SuperAdmin:", businessOwner.role);
        return sendResponse(
          res,
          {},
          "Unauthorized: SuperAdmin access required",
          RESPONSE_FAILURE,
          RESPONSE_CODE.UNAUTHORISED
        );
      }
    } else {
      console.log("[isAdminAuthenticated] Not a business owner or missing role");
      return sendResponse(
        res,
        {},
        "Unauthorized: SuperAdmin access required",
        RESPONSE_FAILURE,
        RESPONSE_CODE.UNAUTHORISED
      );
    }
  } catch (error) {
    console.error(`isAdminAuthenticated() -> Error: ${error.message}`);
    return sendResponse(
      res,
      {},
      "Invalid or expired token. Please log in again.",
      RESPONSE_FAILURE,
      RESPONSE_CODE.UNAUTHORISED
    );
  }
};

export {
  validateRegister,
  validateLogin,
  validateResetPassword,
  validJWTNeeded,
  isAdminAuthenticated,
};
