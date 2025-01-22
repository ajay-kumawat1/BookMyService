import express from 'express';
import userController from '../../../controllers/api/v1/userControllers.js';

const usersRouter = express.Router();

// Define routes
usersRouter.get('/', userController.getAllUsers);

export default usersRouter;