import { Router } from "express";
import serviceController from "./serviceController.js";
import { validJWTNeeded } from "../../Middleware/auth.middleware.js";
import { handleServiceMultipartData } from "../../Helper/fileHandler.js"

const route = Router();

route.post("/create", validJWTNeeded, handleServiceMultipartData.array('images', 10), serviceController.create);
route.get("/getMy", validJWTNeeded, serviceController.getMy);
route.get("/get/:id", validJWTNeeded, serviceController.getById);
route.get("/getAll", serviceController.getAll);
route.put("/bookService/:id", validJWTNeeded, serviceController.bookService);
route.put("/accept/:id", validJWTNeeded, serviceController.acceptService);
route.put("/cancel/:id", validJWTNeeded, serviceController.cancelService);
route.post("/complete/:id", validJWTNeeded, serviceController.completeService);
route.put("/update/:id", validJWTNeeded, handleServiceMultipartData.array('images', 10), serviceController.update);
export default route;
