import { Router } from "express";
import adminController from "./adminController";

const route = Router();

// User Management
route.get('/users', adminController.getAllUsers);
route.delete('/user/:id', adminController.deleteUser);

// Business Management
route.get('/businesses', adminController.getAllBusinessOwner);
route.delete('/business/:id', adminController.deleteBusinessOwner);

// Service Management
route.get('/services', adminController.getAllServices);
route.delete('/service/:id', adminController.deleteService);

export default route;
