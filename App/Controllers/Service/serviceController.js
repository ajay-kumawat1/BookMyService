import { sendResponse } from "../../Common/common.js";
import {
  RESPONSE_CODE,
  RESPONSE_FAILURE,
  RESPONSE_SUCCESS,
} from "../../Common/constant.js";
import { BusinessOwner } from "../../Models/BusinessOwnerModel.js";
import { Service } from "../../Models/ServiceModel.js";

const create = async (req, res) => {
  try {
    const isExist = await Service.findOne({
      name: req.body.name,
      businessOwner: req.user._id,
    });
    if (isExist) {
      return sendResponse(
        res,
        {},
        "Service already exists",
        RESPONSE_FAILURE,
        RESPONSE_CODE.BAD_REQUEST
      );
    }

    const service = await Service.create({
      ...req.body,
      businessOwner: req.user._id,
    });
    if (!service) {
      return sendResponse(
        res,
        {},
        "Failed to create service",
        RESPONSE_FAILURE,
        RESPONSE_CODE.BAD_REQUEST
      );
    }

    await BusinessOwner.findOneAndUpdate(
      { _id: req.user.id },
      { $push: { servicesOffered: service._id } },
      { new: true }
    );

    return sendResponse(
      res,
      service,
      "Service created successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.CREATED
    );
  } catch (error) {
    console.error(`ServiceController.create() -> Error: ${error}`);
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
  create,
};
