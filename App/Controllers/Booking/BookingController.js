// import { sendResponse , generateOTP} from "../Common/common.js";
import {
  generateOtp,
  sendResponse,
} from "../../Common/common.js";
import {
  RESPONSE_CODE,
  RESPONSE_FAILURE,
  RESPONSE_SUCCESS,
} from "../../Common/constant.js";
import {sendServiceBookedMail , sendServiceAcceptMail , sendCancelServiceMail} from"../../Common/mail.js"

import BusinessOwner from "../../Models/BusinessOwnerModel.js";
import Service from "../../Models/ServiceModel.js";
import User from "../../Models/UserModel.js";
import Booking from "../../Models/Booking.js";
import { purchaseBooking, refund } from "../Services/StripeService.js";

// Create a new booking with payment
const createBooking = async (req, res) => {
  try {
    const { serviceId, cardId, date, timeSlot, specialRequests } = req.body;
    const userId = req.user.id;

    // Find the service
    const service = await Service.findById(serviceId);
    if (!service) {
      return sendResponse(
        res,
        {},
        "Service not found",
        RESPONSE_FAILURE,
        RESPONSE_CODE.NOT_FOUND
      );
    }

    // Find the business owner
    const businessOwner = await BusinessOwner.findById(service.businessOwner);
    if (!businessOwner) {
      return sendResponse(
        res,
        {},
        "Service provider not found",
        RESPONSE_FAILURE,
        RESPONSE_CODE.NOT_FOUND
      );
    }

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return sendResponse(
        res,
        {},
        "User not found",
        RESPONSE_FAILURE,
        RESPONSE_CODE.NOT_FOUND
      );
    }

    // Check if service is already booked for this time slot
    const existingBooking = await Booking.findOne({
      service: serviceId,
      date: new Date(date),
      timeSlot,
      status: { $in: ["PENDING", "CONFIRMED"] }
    });

    if (existingBooking) {
      return sendResponse(
        res,
        {},
        "This time slot is already booked",
        RESPONSE_FAILURE,
        RESPONSE_CODE.BAD_REQUEST
      );
    }

    // Process payment with Stripe
    const amount = service.price;
    const discount = 0; // You can implement discount logic if needed

    try {
      const { payment, receipt } = await purchaseBooking(
        amount,
        discount,
        cardId,
        req,
        res
      );

      if (!payment) {
        return sendResponse(
          res,
          {},
          "Payment processing failed",
          RESPONSE_FAILURE,
          RESPONSE_CODE.PAYMENT_REQUIRED
        );
      }

      // Generate OTP for service completion verification
     const otp = await generateOtp();

      // Create booking record
      const booking = await Booking.create({
        service: serviceId,
        user: userId,
        businessOwner: businessOwner._id,
        date: new Date(date),
        timeSlot: service.booking_type === "appointment" ? timeSlot : null,
        status: "PENDING",
        paymentIntentId: payment.id,
        amount: amount * 100, // Store in cents as per Stripe standard
        specialRequests,
        otp
      });

      // Send notification email to service provider
      await sendServiceBookedMail(
        businessOwner,
        service,
        user,
        "/email_template/service_book_email_template.html"
      );

      return sendResponse(
        res,
        { booking, receipt },
        "Service booked successfully. Awaiting confirmation from provider.",
        RESPONSE_SUCCESS,
        RESPONSE_CODE.CREATED
      );
    } catch (error) {
      console.error(`Payment processing error: ${error}`);
      return sendResponse(
        res,
        {},
        `Payment failed: ${error.message}`,
        RESPONSE_FAILURE,
        RESPONSE_CODE.PAYMENT_REQUIRED
      );
    }
  } catch (error) {
    console.error(`BookingController.createBooking() -> Error: ${error}`);
    return sendResponse(
      res,
      {},
      "Internal Server Error",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
};

// Business owner confirms a booking
const confirmBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const businessOwnerId = req.user.id;

    const booking = await Booking.findById(bookingId)
      .populate("service")
      .populate("user");

    if (!booking) {
      return sendResponse(
        res,
        {},
        "Booking not found",
        RESPONSE_FAILURE,
        RESPONSE_CODE.NOT_FOUND
      );
    }

    // Verify the business owner owns this service
    if (booking.businessOwner.toString() !== businessOwnerId) {
      return sendResponse(
        res,
        {},
        "You are not authorized to confirm this booking",
        RESPONSE_FAILURE,
        RESPONSE_CODE.FORBIDDEN
      );
    }

    if (booking.status !== "PENDING") {
      return sendResponse(
        res,
        {},
        `Cannot confirm booking with status: ${booking.status}`,
        RESPONSE_FAILURE,
        RESPONSE_CODE.BAD_REQUEST
      );
    }

    // Update booking status
    booking.status = "CONFIRMED";
    await booking.save();

    // Update service status if needed
    await Service.findByIdAndUpdate(
      booking.service._id,
      {
        $set: { status: "ACCEPTED" },
        $addToSet: { bookedBy: booking.user._id }
      }
    );

    // Update user's booked services
    await User.findByIdAndUpdate(
      booking.user._id,
      { $addToSet: { bookedServiceIds: booking.service._id } }
    );

    // Send confirmation email to user
    await sendServiceAcceptMail(
      await BusinessOwner.findById(businessOwnerId),
      booking.service,
      booking.user,
      "/email_template/service_accept_email_template.html"
    );

    return sendResponse(
      res,
      booking,
      "Booking confirmed successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`BookingController.confirmBooking() -> Error: ${error}`);
    return sendResponse(
      res,
      {},
      "Internal Server Error",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
};

// User cancels a booking
const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;

    const booking = await Booking.findById(bookingId)
      .populate("service")
      .populate("user");

    if (!booking) {
      return sendResponse(
        res,
        {},
        "Booking not found",
        RESPONSE_FAILURE,
        RESPONSE_CODE.NOT_FOUND
      );
    }

    // Verify the user owns this booking
    if (booking.user._id.toString() !== userId) {
      return sendResponse(
        res,
        {},
        "You are not authorized to cancel this booking",
        RESPONSE_FAILURE,
        RESPONSE_CODE.FORBIDDEN
      );
    }

    if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
      return sendResponse(
        res,
        {},
        `Cannot cancel booking with status: ${booking.status}`,
        RESPONSE_FAILURE,
        RESPONSE_CODE.BAD_REQUEST
      );
    }

    // Process refund through Stripe
    try {
      // Get the charge ID from the payment intent
      const { refundResult, receipt } = await refund(
        booking.paymentIntentId,
        booking.amount / 100 // Convert cents back to dollars
      );

      // Update booking status and refund information
      booking.status = "CANCELLED";
      booking.refundId = refundResult.id;
      await booking.save();

      // Update service status if needed
      await Service.findByIdAndUpdate(
        booking.service._id,
        {
          $pull: { bookedBy: userId },
          $set: { status: "CANCELLED" }
        }
      );

      // Update user's booked services
      await User.findByIdAndUpdate(
        userId,
        { $pull: { bookedServiceIds: booking.service._id } }
      );

      // Send cancellation email
      await sendCancelServiceMail(
        booking.service,
        booking.user,
        "/email_template/cancel_service_email_template.html"
      );

      return sendResponse(
        res,
        { booking, refundReceipt: receipt },
        "Booking cancelled and refund processed successfully",
        RESPONSE_SUCCESS,
        RESPONSE_CODE.SUCCESS
      );
    } catch (error) {
      console.error(`Refund processing error: ${error}`);
      return sendResponse(
        res,
        {},
        `Refund failed: ${error.message}`,
        RESPONSE_FAILURE,
        RESPONSE_CODE.PAYMENT_REQUIRED
      );
    }
  } catch (error) {
    console.error(`BookingController.cancelBooking() -> Error: ${error}`);
    return sendResponse(
      res,
      {},
      "Internal Server Error",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
};

// Business owner cancels a booking
const cancelBookingByProvider = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const businessOwnerId = req.user.id;

    const booking = await Booking.findById(bookingId)
      .populate("service")
      .populate("user");

    if (!booking) {
      return sendResponse(
        res,
        {},
        "Booking not found",
        RESPONSE_FAILURE,
        RESPONSE_CODE.NOT_FOUND
      );
    }

    // Verify the business owner owns this service
    if (booking.businessOwner.toString() !== businessOwnerId) {
      return sendResponse(
        res,
        {},
        "You are not authorized to cancel this booking",
        RESPONSE_FAILURE,
        RESPONSE_CODE.FORBIDDEN
      );
    }

    if (!["PENDING", "CONFIRMED"].includes(booking.status)) {
      return sendResponse(
        res,
        {},
        `Cannot cancel booking with status: ${booking.status}`,
        RESPONSE_FAILURE,
        RESPONSE_CODE.BAD_REQUEST
      );
    }

    // Process refund through Stripe
    try {
      const { refundResult, receipt } = await refund(
        booking.paymentIntentId,
        booking.amount / 100 // Convert cents back to dollars
      );

      // Update booking status and refund information
      booking.status = "CANCELLED_BY_PROVIDER";
      booking.refundId = refundResult.id;
      await booking.save();

      // Update service status if needed
      await Service.findByIdAndUpdate(
        booking.service._id,
        {
          $pull: { bookedBy: booking.user._id },
          $set: { status: "CANCELLED" }
        }
      );

      // Update user's booked services
      await User.findByIdAndUpdate(
        booking.user._id,
        { $pull: { bookedServiceIds: booking.service._id } }
      );

      // Send cancellation email
      await sendCancelServiceMail(
        booking.service,
        booking.user,
        "/email_template/cancel_service_email_template.html"
      );

      return sendResponse(
        res,
        { booking, refundReceipt: receipt },
        "Booking cancelled by provider and refund processed successfully",
        RESPONSE_SUCCESS,
        RESPONSE_CODE.SUCCESS
      );
    } catch (error) {
      console.error(`Refund processing error: ${error}`);
      return sendResponse(
        res,
        {},
        `Refund failed: ${error.message}`,
        RESPONSE_FAILURE,
        RESPONSE_CODE.PAYMENT_REQUIRED
      );
    }
  } catch (error) {
    console.error(`BookingController.cancelBookingByProvider() -> Error: ${error}`);
    return sendResponse(
      res,
      {},
      "Internal Server Error",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
};

// Complete a service with OTP verification
const completeBooking = async (req, res) => {
  try {
    const { bookingId, otp } = req.body;
    const businessOwnerId = req.user.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return sendResponse(
        res,
        {},
        "Booking not found",
        RESPONSE_FAILURE,
        RESPONSE_CODE.NOT_FOUND
      );
    }

    // Verify the business owner owns this service
    if (booking.businessOwner.toString() !== businessOwnerId) {
      return sendResponse(
        res,
        {},
        "You are not authorized to complete this booking",
        RESPONSE_FAILURE,
        RESPONSE_CODE.FORBIDDEN
      );
    }

    if (booking.status !== "CONFIRMED") {
      return sendResponse(
        res,
        {},
        `Cannot complete booking with status: ${booking.status}`,
        RESPONSE_FAILURE,
        RESPONSE_CODE.BAD_REQUEST
      );
    }

    // Verify OTP
    if (booking.otp !== otp) {
      return sendResponse(
        res,
        {},
        "Invalid OTP. Service completion failed.",
        RESPONSE_FAILURE,
        RESPONSE_CODE.BAD_REQUEST
      );
    }

    // Update booking status
    booking.status = "COMPLETED";
    await booking.save();

    // Update service status
    await Service.findByIdAndUpdate(
      booking.service,
      { $set: { status: "COMPLETED" } }
    );

    return sendResponse(
      res,
      booking,
      "Service completed successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`BookingController.completeBooking() -> Error: ${error}`);
    return sendResponse(
      res,
      {},
      "Internal Server Error",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
};

// Get all bookings for a user
const getUserBookings = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const bookings = await Booking.find({ user: userId })
      .populate("service")
      .populate("businessOwner", "name email phone")
      .sort({ createdAt: -1 });

    return sendResponse(
      res,
      bookings,
      "User bookings fetched successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`BookingController.getUserBookings() -> Error: ${error}`);
    return sendResponse(
      res,
      {},
      "Internal Server Error",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
};

// Get all bookings for a business owner
const getBusinessOwnerBookings = async (req, res) => {
  try {
    const businessOwnerId = req.user.id;
    
    const bookings = await Booking.find({ businessOwner: businessOwnerId })
      .populate("service")
      .populate("user", "name email phone")
      .sort({ createdAt: -1 });

    return sendResponse(
      res,
      bookings,
      "Business owner bookings fetched successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`BookingController.getBusinessOwnerBookings() -> Error: ${error}`);
    return sendResponse(
      res,
      {},
      "Internal Server Error",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
};

// Get a single booking by ID
const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user.id;
    
    const booking = await Booking.findById(bookingId)
      .populate("service")
      .populate("user", "name email phone")
      .populate("businessOwner", "name email phone");
    
    if (!booking) {
      return sendResponse(
        res,
        {},
        "Booking not found",
        RESPONSE_FAILURE,
        RESPONSE_CODE.NOT_FOUND
      );
    }
    
    // Check if the user is authorized to view this booking
    if (
      booking.user._id.toString() !== userId && 
      booking.businessOwner._id.toString() !== userId
    ) {
      return sendResponse(
        res,
        {},
        "You are not authorized to view this booking",
        RESPONSE_FAILURE,
        RESPONSE_CODE.FORBIDDEN
      );
    }

    return sendResponse(
      res,
      booking,
      "Booking fetched successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`BookingController.getBookingById() -> Error: ${error}`);
    return sendResponse(
      res,
      {},
      "Internal Server Error",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
};

export default {
  createBooking,
  confirmBooking,
  cancelBooking,
  cancelBookingByProvider,
  completeBooking,
  getUserBookings,
  getBusinessOwnerBookings,
  getBookingById
};