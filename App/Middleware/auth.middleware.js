import Joi from "joi";
import { sendResponse } from "../Common/common.js";
import { RESPONSE_CODE, RESPONSE_FAILURE } from "../Common/constant.js";
import pkg from "lodash";
const { isEmpty } = pkg;

const validateRegister = async (req, res, next) => {
  try {
    if (isEmpty(req.body)) {
      return sendResponse(
        res,
        {},
        "Register data is not valid",
        RESPONSE_FAILURE,
        RESPONSE_CODE.BAD_REQUEST
      );
    }

    const registerSchema = Joi.object({
      firstName: Joi.string().required("First name is required"),
      lastName: Joi.string().required("Last name is required"),
      email: Joi.string().email().required("Email is required"),
      password: Joi.string().required("Password is required"),
      phoneNumber: Joi.string()
        .pattern(new RegExp("\\d{10}"))
        .required("Phone number is required"),
    });

    const { error, value } = registerSchema.validate(req.body);
    if (error) {
      return sendResponse(
        res,
        {},
        `${"Register data is not valid"}: ${error.details
          .map((x) => x.message.replace(/"/g, ""))
          .join(", ")}`,
        RESPONSE_FAILURE,
        RESPONSE_CODE.BAD_REQUEST
      );
    }

    req.body = value;
    next();
  } catch (error) {
    console.error(`validateRegister() -> Error: ${error}`);
  }
};

const validateLogin = async (req, res, next) => {
  if (isEmpty(req.body)) {
    return sendResponse(
      res,
      {},
      "Login data is not valid",
      RESPONSE_FAILURE,
      RESPONSE_CODE.BAD_REQUEST
    );
  }

  const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  });

  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    return sendResponse(
      res,
      {},
      `${"Login data is not valid"}}: ${error.details
        .map((x) => x.message.replace(/"/g, ""))
        .join(", ")}`,
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
      locale("RESET_PASSWORD_INVALID_DATA"),
      RESPONSE_FAILURE,
      RESPONSE_CODE.BAD_REQUEST
    );
  }
  if (isEmpty(req.body)) {
    return sendResponse(
      res,
      {},
      locale("RESET_PASSWORD_INVALID_DATA"),
      RESPONSE_FAILURE,
      RESPONSE_CODE.BAD_REQUEST
    );
  }

  const resetPasswordSchema = Joi.object({
    password: Joi.string().required().min(8),
    confirmPassword: Joi.string().required().min(8),
  });

  const { error, value } = resetPasswordSchema.validate(req.body);
  if (error) {
    return sendResponse(
      res,
      {},
      `${locale("RESET_PASSWORD_INVALID_DATA")}: ${error.details
        .map((x) => x.message.replace(/"/g, ""))
        .join(", ")}`,
      RESPONSE_FAILURE,
      RESPONSE_CODE.BAD_REQUEST
    );
  }
  req.body = value;
  next();
};

export { validateRegister, validateLogin, validateResetPassword };
