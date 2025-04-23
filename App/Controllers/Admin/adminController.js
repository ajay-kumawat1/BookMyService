import { sendResponse } from "../../Common/common";
import { RESPONSE_CODE, RESPONSE_FAILURE } from "../../Common/constant";
import ServiceModel from "../../Models/ServiceModel";
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

const deleteUser = async (req, res) => {
    const { id } = req.params;
    
    try {
        const user = await UserModel.findByIdAndDelete(id);
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
    }
}

const getAllServices = async (req, res) => {
  try {
    const services = await ServiceModel.find({});
    if (!services) {
      return sendResponse(
        res,
        {},
        "No services found",
        RESPONSE_FAILURE,
        RESPONSE_CODE.NOT_FOUND
      );
    }

    const serviceCount = await ServiceModel.countDocuments();
    
    return sendResponse(
      res,
      {services, serviceCount},
      "Services fetched successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`AdminController.getAllServices() -> Error: ${error}`);
  }
};

const deleteService = async (req, res) => {
    const { id } = req.params;
    
    try {
        const service = await ServiceModel.findByIdAndDelete(id);
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
    }
}

export default {
  getAllUsers,
  deleteUser,
  getAllServices,
  deleteService,
};
