import { Router } from "express";
import userController from "./userController.js";

const route = Router();

route.get("/:id", userController.getMyProfile);
route.put("/:id", userController.updateProfile);

export default route;
