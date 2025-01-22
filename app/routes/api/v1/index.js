import express from "express";
import usersRouter from "./userRoutes.js";
import adminsRouter from "./adminRoutes.js";
const router = express.Router();

router.use('/users', usersRouter);
router.use('/admins', adminsRouter);

export { router };