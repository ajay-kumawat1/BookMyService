import { Router } from "express";
import userController from "./userController.js";
import { validJWTNeeded } from "../../Middleware/auth.middleware.js";
import {handleUserMultipartData} from "../../Helper/fileHandler.js"

const route = Router();

route.get("/:id", validJWTNeeded, userController.getMyProfile);
route.put('/update-profile/:id',validJWTNeeded, handleUserMultipartData.single('avatar'), userController.updateProfile);


export default route;
