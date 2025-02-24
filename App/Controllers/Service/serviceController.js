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
      businessOwner: req.user.id,
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
      businessOwner: req.user.id,
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

const getMy = async (req, res) => {
  try {
    const services = await Service.find({ businessOwner: req.user.id });
    if (!services) {
      return sendResponse(
        res,
        {},
        "No services found",
        RESPONSE_FAILURE,
        RESPONSE_CODE.NOT_FOUND
      );
    }

    return sendResponse(
      res,
      services,
      "Services fetched successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`ServiceController.getMy() -> Error: ${error}`);
    return sendResponse(
      res,
      {},
      "Internal Server Error",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
};

const getById = async (req, res) => {
  try {
    const service = await Service.findOne({
      _id: req.params.id,
    });
    if (!service) {
      return sendResponse(
        res,
        {},
        "Service not found",
        RESPONSE_FAILURE,
        RESPONSE_CODE.NOT_FOUND
      );
    }

    return sendResponse(
      res,
      service,
      "Service fetched successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`ServiceController.getById() -> Error:
    ${error}`);
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
  getMy,
  getById,
};
