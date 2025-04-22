import { Router } from "express";
import businessOwnerController from "./businessOwnerController.js";
import { validJWTNeeded } from "../../Middleware/auth.middleware.js";
import {handleBusinessOwnerMultipartData} from "../../Helper/fileHandler.js";
const route = Router();

route.get("/:id", validJWTNeeded, businessOwnerController.getMyProfile);
route.put("/:id", validJWTNeeded, handleBusinessOwnerMultipartData.single('businessLogo'),businessOwnerController.updateProfile);

export default route;
