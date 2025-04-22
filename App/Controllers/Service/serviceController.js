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

// Utility function to handle server errors
const handleError = (res, location, error) => {
  console.error(`${location} -> Error: ${error}`);
  return sendResponse(
    res,
    {},
    "Internal Server Error",
    RESPONSE_FAILURE,
    RESPONSE_CODE.INTERNAL_SERVER_ERROR
  );
};

// Helper to find service or return error
const findServiceOrFail = async (res, id, location = "") => {
  try {
    const service = await Service.findById(id);
    if (!service) {
      return sendResponse(res, {}, "Service not found", RESPONSE_FAILURE, RESPONSE_CODE.NOT_FOUND);
    }
    return service;
  } catch (error) {
    return handleError(res, location, error);
  }
};

const create = async (req, res) => {
  try {
    const exists = await Service.findOne({ name: req.body.name, businessOwner: req.user.id });
    if (exists) {
      return sendResponse(res, {}, "Service already exists", RESPONSE_FAILURE, RESPONSE_CODE.BAD_REQUEST);
    }

    const service = await Service.create({ ...req.body, businessOwner: req.user.id });
    await BusinessOwner.findByIdAndUpdate(req.user.id, { $push: { servicesOffered: service._id } });

    return sendResponse(res, service, "Service created successfully", RESPONSE_SUCCESS, RESPONSE_CODE.CREATED);
  } catch (error) {
    return handleError(res, "create", error);
  }
};

const getMy = async (req, res) => {
  try {
    const services = await Service.find({ businessOwner: req.user.id });
    if (!services.length) {
      return sendResponse(res, [], "No services found", RESPONSE_FAILURE, RESPONSE_CODE.NOT_FOUND);
    }
    return sendResponse(res, services, "Services fetched successfully", RESPONSE_SUCCESS, RESPONSE_CODE.SUCCESS);
  } catch (error) {
    return handleError(res, "getMy", error);
  }
};

const getById = async (req, res) => {
  const result = await findServiceOrFail(res, req.params.id, "getById");
  if (result instanceof Service) {
    return sendResponse(res, result, "Service fetched successfully", RESPONSE_SUCCESS, RESPONSE_CODE.SUCCESS);
  }
};

const getAll = async (req, res) => {
  try {
    const services = await Service.find();
    return sendResponse(
      res,
      services,
      services.length ? "Services fetched successfully" : "No services found",
      services.length ? RESPONSE_SUCCESS : RESPONSE_FAILURE,
      services.length ? RESPONSE_CODE.SUCCESS : RESPONSE_CODE.NOT_FOUND
    );
  } catch (error) {
    return handleError(res, "getAll", error);
  }
};

const update = async (req, res) => {
  try {
    const service = await Service.findOne({ _id: req.params.id, businessOwner: req.user.id });
    if (!service) {
      return sendResponse(res, {}, "Service not found or unauthorized", RESPONSE_FAILURE, RESPONSE_CODE.NOT_FOUND);
    }

    const updated = await Service.findByIdAndUpdate(req.params.id, { $set: req.body }, { new: true });
    return sendResponse(res, updated, "Service updated successfully", RESPONSE_SUCCESS, RESPONSE_CODE.SUCCESS);
  } catch (error) {
    return handleError(res, "update", error);
  }
};

const bookService = async (req, res) => {
  try {
    const { id } = req.user;
    const service = await findServiceOrFail(res, req.params.id, "bookService");
    if (!(service instanceof Service)) return;

    const user = await User.findById(id);
    const isBooked = await User.findOne({ bookedServiceIds: req.params.id });
    if (isBooked) {
      return sendResponse(res, {}, "Service already booked", RESPONSE_FAILURE, RESPONSE_CODE.BAD_REQUEST);
    }

    const owner = await BusinessOwner.findOne({ servicesOffered: req.params.id });
    if (owner) {
      await sendServiceBookedMail(owner, service, user, "/email_template/service_book_email_template.html");
    }

    return sendResponse(res, {}, "Service booked successfully. OTP has been sent.", RESPONSE_SUCCESS, RESPONSE_CODE.SUCCESS);
  } catch (error) {
    return handleError(res, "bookService", error);
  }
};

const acceptService = async (req, res) => {
  try {
    const service = await findServiceOrFail(res, req.params.id, "acceptService");
    if (!(service instanceof Service)) return;

    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      { $set: { status: ServiceStatusEnum.ACCEPTED }, $push: { bookedBy: req.user.id } },
      { new: true }
    );

    const serviceOwner = await BusinessOwner.findOne({ servicesOffered: req.params.id });
    const user = await User.findByIdAndUpdate(req.user.id, { $push: { bookedServiceIds: req.params.id } }, { new: true });

    await sendServiceAcceptMail(serviceOwner, updatedService, user, "/email_template/service_accept_email_template.html");

    return sendResponse(res, {}, "Service accepted successfully", RESPONSE_SUCCESS, RESPONSE_CODE.SUCCESS);
  } catch (error) {
    return handleError(res, "acceptService", error);
  }
};

const cancelService = async (req, res) => {
  try {
    const service = await findServiceOrFail(res, req.params.id, "cancelService");
    if (!(service instanceof Service)) return;

    const user = await User.findByIdAndUpdate(req.user.id, { $pull: { bookedServiceIds: req.params.id } }, { new: true });
    const updated = await Service.findByIdAndUpdate(
      req.params.id,
      { $pull: { bookedBy: req.user.id }, $set: { status: ServiceStatusEnum.CANCELLED } },
      { new: true }
    );

    await sendCancelServiceMail(updated, user, "/email_template/cancel_service_email_template.html");

    return sendResponse(res, {}, "Service cancelled successfully", RESPONSE_SUCCESS, RESPONSE_CODE.SUCCESS);
  } catch (error) {
    return handleError(res, "cancelService", error);
  }
};

const completeService = async (req, res) => {
  try {
    const { serviceId, otp } = req.body;
    const user = await User.findOne({ _id: req.user.id, "serviceOtp.otp": otp });

    if (!user || new Date() > new Date(user.serviceOtp.expiresAt)) {
      return sendResponse(res, {}, "Invalid or expired OTP", RESPONSE_FAILURE, RESPONSE_CODE.BAD_REQUEST);
    }

    await Service.findByIdAndUpdate(serviceId, { $set: { status: ServiceStatusEnum.COMPLETED } });
    await User.findByIdAndUpdate(req.user.id, { $unset: { serviceOtp: "" } });

    return sendResponse(res, {}, "Service completed successfully", RESPONSE_SUCCESS, RESPONSE_CODE.SUCCESS);
  } catch (error) {
    return handleError(res, "completeService", error);
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
