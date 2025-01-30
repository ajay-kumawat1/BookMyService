import { sendResponse } from "../../Common/common.js";
import { RESPONSE_CODE, RESPONSE_FAILURE } from "../../Common/constant.js";
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
        "Email already exist",
        RESPONSE_FAILURE,
        RESPONSE_CODE.BAD_REQUEST
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Email template path
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const emailTemplatePath = path.join(
      __dirname,
      "../../Common/email_template/signup_email_template.html"
    );

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const mail = await sendMail(email, firstName, otp, emailTemplatePath);

    const user = await User.create({
      ...req.body,
      role: "User",
      password: hashedPassword,
    });

    return sendResponse(
      res,
      user,
      "User created successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.CREATED
    );
  } catch (error) {
    console.log(`UserController.create() -> Error: ${error}`);
  }
};

const login = async (req, res) => {
  try {
    console.log("login");
  } catch (error) {
    console.log(error);
  }
};

export default {
  create,
  login,
};
