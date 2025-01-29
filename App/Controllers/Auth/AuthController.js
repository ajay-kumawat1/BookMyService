import { sendResponse } from "../../Common/common.js";
import {
  RESPONSE_CODE,
  RESPONSE_FAILURE,
  RESPONSE_SUCCESS,
} from "../../Common/constant.js";
import { User } from "../../Models/User.js";
import bcrypt from "bcrypt";

const create = async (req, res) => {
  try {
    const { email, password } = req.body;

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
