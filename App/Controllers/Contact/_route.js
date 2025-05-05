import { Router } from "express";
import contactController from "./contactController.js";

const route = Router();

route.post("/submit", contactController.submitContactForm);

export default route;
