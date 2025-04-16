import { sendResponse } from "../../Common/common.js";
import {
  RESPONSE_CODE,
  RESPONSE_FAILURE,
  RESPONSE_SUCCESS,
} from "../../Common/constant.js";
import { ServiceStatusEnum } from "../../Common/enum.js";
import {
  sendCancelServiceMail,
  sendServiceAcceptMail,
  sendServiceBookedMail,
} from "../../Common/mail.js";
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
    if (services.length === 0) {
      return sendResponse(
        res,
        [],
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

const update = async (req, res) => {
  try {
    const service = await Service.findOne({
      _id: req.params.id,
      businessOwner: req.user.id,
    });
    if (!service) {
      return sendResponse(
        res,
        {},
        "Service not found or you are not authorized to edit it",
        RESPONSE_FAILURE,
        RESPONSE_CODE.NOT_FOUND
      );
    }

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    return sendResponse(
      res,
      updatedService,
      "Service updated successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`ServiceController.update() -> Error: ${error}`);
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
    const { id } = req.user;
    const service = await Service.findOne({ _id: req.params.id });
    if (!service) {
      return sendResponse(
        res,
        {},
        "Service not found",
        RESPONSE_FAILURE,
        RESPONSE_CODE.NOT_FOUND
      );
    }

    const userData = await User.findOne({ _id: id });
    if (!userData) {
      return sendResponse(
        res,
        {},
        "User not found",
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

    // Send mail to service owner
    const owner = await BusinessOwner.findOne({
      servicesOffered: req.params.id,
    });
    if (owner) {
      await sendServiceBookedMail(
        owner,
        service,
        userData,
        "/email_template/service_book_email_template.html"
      );
    }

    return sendResponse(
      res,
      {},
      "Service booked successfully. OTP has been sent.",
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

const acceptService = async (req, res) => {
  try {
    const service = await Service.findOne({ _id: req.params.id });
    if (!service) {
      return sendResponse(
        res,
        {},
        "Service not found",
        RESPONSE_FAILURE,
        RESPONSE_CODE.NOT_FOUND
      );
    }

    const serviecData = await Service.findOneAndUpdate(
      { _id: req.params.id },
      {
        $set: { status: ServiceStatusEnum.ACCEPTED },
        $push: { bookedBy: req.user.id },
      },
      { new: true }
    );

    const serviceOwner = await BusinessOwner.findOne({
      servicesOffered: req.params.id,
    });

    const userData = await User.findOneAndUpdate(
      { _id: req.user.id },
      { $push: { bookedServiceIds: req.params.id } },
      { new: true }
    );

    // send mail to user
    await sendServiceAcceptMail(
      serviceOwner,
      serviecData,
      userData,
      "/email_template/service_accept_email_template.html"
    );

    return sendResponse(
      res,
      {},
      "Service accepted successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`ServiceController.acceptService() -> Error: ${error}`);
    return sendResponse(
      res,
      {},
      "Internal Server Error",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
};

const cancelService = async (req, res) => {
  try {
    const service = await Service.findOne({ _id: req.params.id });
    if (!service) {
      return sendResponse(
        res,
        {},
        "Service not found",
        RESPONSE_FAILURE,
        RESPONSE_CODE.NOT_FOUND
      );
    }

    const user = await User.findOneAndUpdate(
      { _id: req.user.id },
      { $pull: { bookedServiceIds: req.params.id } },
      { new: true }
    );

    const services = await Service.findOneAndUpdate(
      { _id: req.params.id },
      {
        $pull: { bookedBy: req.user.id },
        $set: { status: ServiceStatusEnum.CANCELLED },
      },
      { new: true }
    );

    // send cancel service mail to user
    await sendCancelServiceMail(
      services,
      user,
      "/email_template/cancel_service_email_template.html"
    );

    return sendResponse(
      res,
      {},
      "Service cancelled successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`ServiceController.cancelService() -> Error: ${error}`);
    return sendResponse(
      res,
      {},
      "Internal Server Error",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
};

const completeService = async (req, res) => {
  try {
    const { serviceId, otp } = req.body;
    const user = await User.findOne({
      _id: req.user.id,
      "serviceOtp.otp": otp,
    });

    if (!user || new Date() > new Date(user.serviceOtp.expiresAt)) {
      return sendResponse(
        res,
        {},
        "Invalid or expired OTP",
        RESPONSE_FAILURE,
        RESPONSE_CODE.BAD_REQUEST
      );
    }

    // Mark service as completed and remove OTP
    await Service.findOneAndUpdate(
      { _id: serviceId },
      { $set: { status: ServiceStatusEnum.COMPLETED } }
    );
    await User.findOneAndUpdate(
      { _id: req.user.id },
      { $unset: { serviceOtp: "" } }
    );

    return sendResponse(
      res,
      {},
      "Service completed successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`ServiceController.completeService() -> Error: ${error}`);
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
  completeService,
  cancelService,
  acceptService,
  update,
};
