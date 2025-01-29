import { Router } from "express";
import AuthController from "./AuthController.js"

const route = Router();

route.post('/signup', AuthController.create);
route.post('/login', AuthController.login);

export default route;

