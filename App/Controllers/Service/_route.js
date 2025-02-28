import { Router } from "express";
import serviceController from "./serviceController.js";
import { validJWTNeeded } from "../../Middleware/auth.middleware.js";

const route = Router();

route.post("/create", validJWTNeeded, serviceController.create);
route.get("/getMy", validJWTNeeded, serviceController.getMy);
route.get("/get/:id", validJWTNeeded, serviceController.getById);
route.get("/getAll", validJWTNeeded, serviceController.getAll);
route.put("/bookService/:id", validJWTNeeded, serviceController.bookService);

export default route;
