import { sendResponse } from "../../Common/common.js";
import {
  RESPONSE_CODE,
  RESPONSE_FAILURE,
  RESPONSE_SUCCESS,
} from "../../Common/constant.js"
import { BusinessOwner } from "../../Models/BusinessOwnerModel.js";

const getMyProfile = async (req, res) => {
  try {
    const businessOwner = await BusinessOwner.findById(req.params.id);
    if (!businessOwner) {
      return sendResponse(
        res,
        {},
        "Business owner not found",
        RESPONSE_FAILURE,
        RESPONSE_CODE.NOT_FOUND
      );
    }

    return sendResponse(
      res,
      businessOwner,
      "Profile fetched successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`BusinessOwnerController.getMyProfile() -> Error: ${error}`);
    return sendResponse(
      res,
      {},
      "Internal Server Error",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
};

const updateProfile = async (req, res) => {
  try {
    let businessOwner = await BusinessOwner.findOne({ _id: req.params.id });
    if (!businessOwner) {
      return sendResponse(
        res,
        {},
        "Business owner not found",
        RESPONSE_FAILURE,
        RESPONSE_CODE.NOT_FOUND
      );
    }

    businessOwner = await BusinessOwner.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    if (!businessOwner) {
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
      businessOwner,
      "Profile updated successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`BusinessOwnerController.updateProfile() -> Error: ${error}`);
    return sendResponse(
      res,
      {},
      "Internal Server Error",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
};

export default {
  getMyProfile,
  updateProfile,
};