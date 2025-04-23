import { Router } from "express";
import adminController from "./adminController";

const route = Router();

// User Management
route.get('/users', verifySuperAdmin, adminController.getAllUsers);
route.delete('/user/:id', verifySuperAdmin, adminController.deleteUser);

export default route;
