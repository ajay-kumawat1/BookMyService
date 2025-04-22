import { sendResponse } from "../../Common/common.js";
import {
  RESPONSE_CODE,
  RESPONSE_FAILURE,
  RESPONSE_SUCCESS,
} from "../../Common/constant.js";
import  User  from "../../Models/UserModel.js";
import { uploadImageCloudinary, deleteImageCloudinary } from "../../Services/CloudnaryService.js";

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
  const { id } = req.params
  const { body, file } = req;
  try {
    let user = await User.findOne({ _id: id });

    if (!user) {
      return sendResponse(
        res,
        {},
        "User not found",
        RESPONSE_FAILURE,
        RESPONSE_CODE.NOT_FOUND
      );
    }
    let input = {
      ...body
    };

    if (req.file) {
      console.log(req.file.fieldname);
      if (user.avatar) {
        await deleteImageCloudinary(user.avatar)
      }
      input.avatar = await uploadImageCloudinary(file, 'User/avatar')
    } else {
      input.avatar = user.avatar
    }

    user = await User.findByIdAndUpdate(
      id,
      input
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
