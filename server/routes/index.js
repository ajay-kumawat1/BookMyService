import express from "express";
import usersRouter from "./user.js";
const router = express.Router();

router.use('/users', usersRouter);

export { router };