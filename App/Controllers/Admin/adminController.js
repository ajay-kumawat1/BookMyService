import { sendResponse } from "../../Common/common.js";
import { RESPONSE_CODE, RESPONSE_FAILURE, RESPONSE_SUCCESS } from "../../Common/constant.js";
import { Role } from "../../Common/enum.js";
import BusinessOwnerModel from "../../Models/BusinessOwnerModel.js";
import ServiceModel from "../../Models/ServiceModel.js";
import UserModel from "../../Models/UserModel.js";

const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find({}).lean();
    if (!users || users.length === 0) {
      return sendResponse(
        res,
        {},
        "No users found",
        RESPONSE_FAILURE,
        RESPONSE_CODE.NOT_FOUND
      );
    }

    return sendResponse(
      res,
      { users, userCount: users.length },
      "Users fetched successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`AdminController.getAllUsers() -> Error: ${error}`);
    return sendResponse(
      res,
      {},
      "Server error while fetching users",
      RESPONSE_FAILURE,
      RESPONSE_CODE.SERVER_ERROR
    );
  }
};

const deleteUser = async (req, res) => {
  try {
    const user = await UserModel.findByIdAndDelete(req.params.id);
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
      {},
      "User deleted successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`AdminController.deleteUser() -> Error: ${error}`);
    return sendResponse(
      res,
      {},
      "Server error while deleting user",
      RESPONSE_FAILURE,
      RESPONSE_CODE.SERVER_ERROR
    );
  }
};

const getAllServices = async (req, res) => {
  try {
    const services = await ServiceModel.find({})
      .populate({ path: "businessOwner" })
      .lean();

    if (!services || services.length === 0) {
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
      { services, serviceCount: services.length },
      "Services fetched successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`AdminController.getAllServices() -> Error: ${error}`);
    return sendResponse(
      res,
      {},
      "Server error while fetching services",
      RESPONSE_FAILURE,
      RESPONSE_CODE.SERVER_ERROR
    );
  }
};

const deleteService = async (req, res) => {
  try {
    const service = await ServiceModel.findByIdAndDelete(req.params.id);
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
      {},
      "Service deleted successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`AdminController.deleteService() -> Error: ${error}`);
    return sendResponse(
      res,
      {},
      "Server error while deleting service",
      RESPONSE_FAILURE,
      RESPONSE_CODE.SERVER_ERROR
    );
  }
};

const getAllBusinessOwner = async (req, res) => {
  try {
    const owners = await BusinessOwnerModel.find({ role: { $ne: Role.SUPER_ADMIN } }).lean();
    if (!owners || owners.length === 0) {
      return sendResponse(
        res,
        {},
        "No business owners found",
        RESPONSE_FAILURE,
        RESPONSE_CODE.NOT_FOUND
      );
    }

    return sendResponse(
      res,
      { owners, ownerCount: owners.length },
      "Business owners fetched successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`AdminController.getAllBusinessOwner() -> Error: ${error}`);
    return sendResponse(
      res,
      {},
      "Server error while fetching business owners",
      RESPONSE_FAILURE,
      RESPONSE_CODE.SERVER_ERROR
    );
  }
};

const deleteBusinessOwner = async (req, res) => {
  try {
    const owner = await BusinessOwnerModel.findByIdAndDelete(req.params.id);
    if (!owner) {
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
      {},
      "Business owner deleted successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`AdminController.deleteBusinessOwner() -> Error: ${error}`);
    return sendResponse(
      res,
      {},
      "Server error while deleting business owner",
      RESPONSE_FAILURE,
      RESPONSE_CODE.SERVER_ERROR
    );
  }
};

// In adminController.js
const getStatistics = async (req, res) => {
  try {
    const totalUsers = await UserModel.countDocuments();
    const totalBusinessOwners = await BusinessOwnerModel.countDocuments();
    const totalServices = await ServiceModel.countDocuments();
    
    return sendResponse(
      res,
      { 
        totalUsers,
        totalBusinessOwners,
        totalServices,
        totalBookings: 0 // Add actual booking count if you have that model
      },
      "Statistics fetched successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`AdminController.getStatistics() -> Error: ${error}`);
    return sendResponse(
      res,
      {},
      "Server error while fetching statistics",
      RESPONSE_FAILURE,
      RESPONSE_CODE.SERVER_ERROR
    );
  }
};

export default {
  getAllUsers,
  deleteUser,
  getAllServices,
  deleteService,
  getAllBusinessOwner,
  deleteBusinessOwner,
  getStatistics,
};
