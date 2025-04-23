import { sendResponse } from "../../Common/common";
import { RESPONSE_CODE, RESPONSE_FAILURE } from "../../Common/constant";
import UserModel from "../../Models/UserModel";

const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find({});
    if (!users) {
      return sendResponse(
        res,
        {},
        "No users found",
        RESPONSE_FAILURE,
        RESPONSE_CODE.NOT_FOUND
      );
    }

    const userCount = await UserModel.countDocuments();
    
    return sendResponse(
      res,
      {users, userCount},
      "Users fetched successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`AdminController.getAllUsers() -> Error: ${error}`);
  }
};

export default {
  getAllUsers,
};
