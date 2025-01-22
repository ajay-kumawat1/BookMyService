import express from 'express';
import adminController from '../../../controllers/api/v1/adminControllers.js';

const adminsRouter = express.Router();

// Define routes
adminsRouter.get('/', adminController.getAllAdmins);

export default adminsRouter;