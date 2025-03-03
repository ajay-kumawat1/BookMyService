import { sendResponse } from "../../Common/common.js";
import {
  RESPONSE_CODE,
  RESPONSE_FAILURE,
  RESPONSE_SUCCESS,
} from "../../Common/constant.js";
import { sendMail, sendServiceBookedMail } from "../../Common/mail.js";
import { BusinessOwner } from "../../Models/BusinessOwnerModel.js";
import { Service } from "../../Models/ServiceModel.js";
import { User } from "../../Models/UserModel.js";

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

const getAll = async (req, res) => {
  try {
    const services = await Service.find();
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
    console.error(`ServiceController.getAll() -> Error: ${error}`);
    return sendResponse(
      res,
      {},
      "Internal Server Error",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
};

const bookService = async (req, res) => {
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

    const isBooked = await User.findOne({ bookedServiceIds: req.params.id });
    if (isBooked) {
      return sendResponse(
        res,
        {},
        "Service already booked",
        RESPONSE_FAILURE,
        RESPONSE_CODE.BAD_REQUEST
      );
    }

    await User.findOneAndUpdate(
      { _id: req.user.id },
      { $push: { bookedServiceIds: req.params.id } },
      { new: true }
    );

    await Service.findOneAndUpdate(
      { _id: req.params.id },
      { $push: { bookedBy: req.user.id } },
      { new: true }
    );

    // send mail to owner
    const owner = await BusinessOwner.findOne({
      servicesOffered: req.params.id,
    });
    if (owner) {
      await sendServiceBookedMail(
        owner.email,
        owner.ownerFirstName,
        "/email_template/service_book_email_template.html",
      );
    }

    return sendResponse(
      res,
      {},
      "Service booked successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`ServiceController.bookService() -> Error: ${error}`);
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
  getAll,
  bookService,
};
