import { Router } from "express";
import userController from "./userController.js";
import { validJWTNeeded } from "../../Middleware/auth.middleware.js";

const route = Router();

route.get("/:id", validJWTNeeded, userController.getMyProfile);
route.put("/:id", validJWTNeeded, userController.updateProfile);

export default route;
