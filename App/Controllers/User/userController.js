import { sendResponse } from "../../Common/common.js";
import {
  RESPONSE_CODE,
  RESPONSE_FAILURE,
  RESPONSE_SUCCESS,
} from "../../Common/constant.js";
import { User } from "../../Models/UserModel.js";

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

const updateProfile = async (req, res) => {
  try {
    let user = await User.findOne({ _id: req.params.id });
    if (!user) {
      return sendResponse(
        res,
        {},
        "User not found",
        RESPONSE_FAILURE,
        RESPONSE_CODE.NOT_FOUND
      );
    }

    user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!user) {
      return sendResponse(
        res,
        {},
        "Failed to update profile",
        RESPONSE_FAILURE,
        RESPONSE_CODE.BAD_REQUEST
      );
    }

    return sendResponse(
      res,
      user,
      "Profile updated successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`UserController.updateProfile() -> Error: ${error}`);
  }
};

export default {
  getMyProfile,
  updateProfile,
};
