import express from 'express';
import userController from '../controllers/userController.js';

const usersRouter = express.Router();

// Define routes
usersRouter.get('/', userController.getAllUsers);

export default usersRouter;