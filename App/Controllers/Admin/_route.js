import { Router } from "express";
import adminController from "./adminController";

const route = Router();

// User Management
route.get('/users', verifySuperAdmin, adminController.getAllUsers);

export default route;
