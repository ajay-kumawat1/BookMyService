import { Router } from "express";
import adminController from "./adminController";

const route = Router();

// User Management
route.get('/users', verifySuperAdmin, adminController.getAllUsers);
route.delete('/user/:id', verifySuperAdmin, adminController.deleteUser);

// Business Management
route.get('/businesses', verifySuperAdmin, adminController.getAllBusinessOwner);
route.delete('/business/:id', verifySuperAdmin, adminController.deleteBusinessOwner);

// Service Management
route.get('/services', verifySuperAdmin, adminController.getAllServices);
route.delete('/service/:id', verifySuperAdmin, adminController.deleteService)

export default route;
