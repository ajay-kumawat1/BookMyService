import { Router } from "express";
import BookingController from './BookingController.js';
import { validJWTNeeded } from "../../Middleware/auth.middleware.js";
const router = Router();

// Create a new booking with payment
router.post('/create', validJWTNeeded, BookingController.createBooking);

// Business owner confirms a booking
router.put('/confirm/:bookingId', validJWTNeeded, BookingController.confirmBooking);

// User cancels a booking
router.put('/cancel/:bookingId', validJWTNeeded, BookingController.cancelBooking);

// Business owner cancels a booking
router.put('/cancel-by-provider/:bookingId', validJWTNeeded, BookingController.cancelBookingByProvider);

// Complete a service with OTP verification
router.put('/complete', validJWTNeeded, BookingController.completeBooking);

// Get all bookings for a user
router.get('/user', validJWTNeeded, BookingController.getUserBookings);

// Get all bookings for a business owner
router.get('/business-owner', validJWTNeeded, BookingController.getBusinessOwnerBookings);

// Get a single booking by ID
router.get('/:bookingId', validJWTNeeded, BookingController.getBookingById);

export default router;