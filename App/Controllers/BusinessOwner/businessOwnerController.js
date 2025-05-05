import { sendResponse } from "../../Common/common.js";
import {
  RESPONSE_CODE,
  RESPONSE_FAILURE,
  RESPONSE_SUCCESS,
} from "../../Common/constant.js"
import BusinessOwner from "../../Models/BusinessOwnerModel.js";
import { uploadImageCloudinary, deleteImageCloudinary } from "../../Services/CloudnaryService.js";

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
  const { id } = req.params;
  const { body, file } = req;
  try {
    console.log("Update profile request received:", { id, body, file });

    let businessOwner = await BusinessOwner.findOne({ _id: id });
    if (!businessOwner) {
      return sendResponse(
        res,
        {},
        "Business owner not found",
        RESPONSE_FAILURE,
        RESPONSE_CODE.NOT_FOUND
      );
    }

    let input = {
      ...body
    }

    if (file) {
      console.log("File received:", file.fieldname, file.mimetype);

      // Delete old logo if it exists
      if (businessOwner.businessLogo) {
        try {
          await deleteImageCloudinary(businessOwner.businessLogo);
          console.log("Old logo deleted successfully");
        } catch (error) {
          console.error("Error deleting old logo:", error);
          // Continue even if deletion fails
        }
      }

      try {
        // Upload new logo to Cloudinary
        const logoUrl = await uploadImageCloudinary(file, "Business/Owner");
        console.log("New logo uploaded successfully:", logoUrl);
        input.businessLogo = logoUrl;
      } catch (uploadError) {
        console.error("Error uploading logo to Cloudinary:", uploadError);
        return sendResponse(
          res,
          {},
          "Failed to upload logo: " + uploadError.message,
          RESPONSE_FAILURE,
          RESPONSE_CODE.BAD_REQUEST
        );
      }
    } else {
      console.log("No file received, keeping existing logo");
      input.businessLogo = businessOwner.businessLogo;
    }

    console.log("Updating business owner with:", input);
    businessOwner = await BusinessOwner.findByIdAndUpdate(
      id,
      input,
      { new: true } // Return the updated document instead of the original
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