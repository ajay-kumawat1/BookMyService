import { Router } from "express";
import businessOwnerController from "./businessOwnerController.js";
import { validJWTNeeded } from "../../Middleware/auth.middleware.js";

const route = Router();

route.get("/:id", validJWTNeeded, businessOwnerController.getMyProfile);
route.put("/:id", validJWTNeeded, businessOwnerController.updateProfile);

export default route;
