import express from "express";
import { sendResponse } from "../Common/common.js";
import { RESPONSE_CODE, RESPONSE_FAILURE, RESPONSE_SUCCESS } from "../Common/constant.js";
import User from "../Models/UserModel.js";
import BusinessOwner from "../Models/BusinessOwnerModel.js";
import Service from "../Models/ServiceModel.js";
import Booking from "../Models/Booking.js";
const router = express.Router();

// Get platform statistics
router.get("/statistics", async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalBusinessOwners = await BusinessOwner.countDocuments();
    const totalServices = await Service.countDocuments();
    const totalBookings = await Booking.countDocuments();

    const statistics = {
      totalUsers,
      totalBusinessOwners,
      totalServices,
      totalBookings
    };

    return sendResponse(
      res,
      { data: statistics },
      "Statistics fetched successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`/statistics -> Error: ${error.message}`);
    return sendResponse(
      res,
      {},
      "Failed to fetch statistics",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
});

// Get all users
router.get("/users", async (req, res) => {
  try {
    const users = await User.find().select("-password");

    return sendResponse(
      res,
      { data: { users } },
      "Users fetched successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`/users -> Error: ${error.message}`);
    return sendResponse(
      res,
      {},
      "Failed to fetch users",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
});

// Get all services
router.get("/services", async (req, res) => {
  try {
    const services = await Service.find().populate("businessOwner", "businessName");

    return sendResponse(
      res,
      { data: { services } },
      "Services fetched successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`/services -> Error: ${error.message}`);
    return sendResponse(
      res,
      {},
      "Failed to fetch services",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
});

// Get all business owners
router.get("/businesses", async (req, res) => {
  try {
    const owners = await BusinessOwner.find().select("-password");

    return sendResponse(
      res,
      { data: { owners } },
      "Business owners fetched successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`/businesses -> Error: ${error.message}`);
    return sendResponse(
      res,
      {},
      "Failed to fetch business owners",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
});

// Delete a user
router.delete("/user/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndDelete(id);

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
    console.error(`/user/:id -> Error: ${error.message}`);
    return sendResponse(
      res,
      {},
      "Failed to delete user",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
});

// Delete a service
router.delete("/service/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Service.findByIdAndDelete(id);

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
    console.error(`/service/:id -> Error: ${error.message}`);
    return sendResponse(
      res,
      {},
      "Failed to delete service",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
});

// Delete a business owner
router.delete("/business/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const owner = await BusinessOwner.findByIdAndDelete(id);

    if (!owner) {
      return sendResponse(
        res,
        {},
        "Business owner not found",
        RESPONSE_FAILURE,
        RESPONSE_CODE.NOT_FOUND
      );
    }

    // Also delete all services associated with this business owner
    await Service.deleteMany({ businessOwner: id });

    return sendResponse(
      res,
      {},
      "Business owner and associated services deleted successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`/business/:id -> Error: ${error.message}`);
    return sendResponse(
      res,
      {},
      "Failed to delete business owner",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
});

export default router;
