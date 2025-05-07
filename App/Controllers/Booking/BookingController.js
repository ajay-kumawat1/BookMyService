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

const updatePaymentInfo = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const booking = await Booking.findByIdAndUpdate(
      req.params.bookingId,
      { paymentIntentId },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json({ booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Create a new booking with payment
// const createBooking = async (req, res) => {
//   try {
//     const { serviceId, cardId, date, timeSlot, specialRequests } = req.body;
//     const userId = req.user.id;

//     // Find the service
//     const service = await Service.findById(serviceId);
//     if (!service) {
//       return sendResponse(
//         res,
//         {},
//         "Service not found",
//         RESPONSE_FAILURE,
//         RESPONSE_CODE.NOT_FOUND
//       );
//     }

//     // Find the business owner
//     const businessOwner = await BusinessOwner.findById(service.businessOwner);
//     if (!businessOwner) {
//       return sendResponse(
//         res,
//         {},
//         "Service provider not found",
//         RESPONSE_FAILURE,
//         RESPONSE_CODE.NOT_FOUND
//       );
//     }

//     // Find the user
//     const user = await User.findById(userId);
//     if (!user) {
//       return sendResponse(
//         res,
//         {},
//         "User not found",
//         RESPONSE_FAILURE,
//         RESPONSE_CODE.NOT_FOUND
//       );
//     }

//     // Check if service is already booked for this time slot
//     const existingBooking = await Booking.findOne({
//       service: serviceId,
//       date: new Date(date),
//       timeSlot,
//       status: { $in: ["PENDING", "CONFIRMED"] }
//     });

//     if (existingBooking) {
//       return sendResponse(
//         res,
//         {},
//         "This time slot is already booked",
//         RESPONSE_FAILURE,
//         RESPONSE_CODE.BAD_REQUEST
//       );
//     }

//     // Process payment with Stripe
//     const amount = service.price;
//     const discount = 0; // You can implement discount logic if needed

//     try {
//       const { payment, receipt } = await purchaseBooking(
//         amount,
//         discount,
//         cardId,
//         req,
//         res
//       );

//       if (!payment) {
//         return sendResponse(
//           res,
//           {},
//           "Payment processing failed",
//           RESPONSE_FAILURE,
//           RESPONSE_CODE.PAYMENT_REQUIRED
//         );
//       }

//       // Generate OTP for service completion verification
//      const otp = await generateOtp();

//       // Create booking record
//       const booking = await Booking.create({
//         service: serviceId,
//         user: userId,
//         businessOwner: businessOwner._id,
//         date: new Date(date),
//         timeSlot: service.booking_type === "appointment" ? timeSlot : null,
//         status: "PENDING",
//         paymentIntentId: payment.id,
//         amount: amount * 100, // Store in cents as per Stripe standard
//         specialRequests,
//         otp
//       });

//       // Send notification email to service provider
//       await sendServiceBookedMail(
//         businessOwner,
//         service,
//         user,
//         "/email_template/service_book_email_template.html"
//       );

//       return sendResponse(
//         res,
//         { booking, receipt },
//         "Service booked successfully. Awaiting confirmation from provider.",
//         RESPONSE_SUCCESS,
//         RESPONSE_CODE.CREATED
//       );
//     } catch (error) {
//       console.error(`Payment processing error: ${error}`);
//       return sendResponse(
//         res,
//         {},
//         `Payment failed: ${error.message}`,
//         RESPONSE_FAILURE,
//         RESPONSE_CODE.PAYMENT_REQUIRED
//       );
//     }
//   } catch (error) {
//     console.error(`BookingController.createBooking() -> Error: ${error}`);
//     return sendResponse(
//       res,
//       {},
//       "Internal Server Error",
//       RESPONSE_FAILURE,
//       RESPONSE_CODE.INTERNAL_SERVER_ERROR
//     );
//   }
// };
const createBooking = async (req, res) => {
  try {
    const { serviceId, date, timeSlot } = req.body;

    // Get service with its business owner
    const service = await Service.findById(serviceId).populate('businessOwner');
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    if (!service.businessOwner) {
      return res.status(400).json({ message: 'Service has no business owner assigned' });
    }

    // Get user data
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the service is already booked by this user
    const existingBooking = await Booking.findOne({
      service: serviceId,
      user: req.user.id,
      status: { $in: ["PENDING", "CONFIRMED"] }
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'You have already booked this service and it is still active'
      });
    }

    // Check if the service is already booked for this time slot
    const timeSlotBooking = await Booking.findOne({
      service: serviceId,
      date: new Date(date),
      timeSlot,
      status: { $in: ["PENDING", "CONFIRMED"] }
    });

    if (timeSlotBooking) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked. Please select a different time.'
      });
    }

    // Generate OTP for service completion verification
    const otp = await generateOtp();

    // Process test payment
    const { payment, receipt } = await purchaseBooking(service.price, req);

    // Create booking with all required fields
    const booking = await Booking.create({
      service: serviceId,
      user: req.user.id,
      businessOwner: service.businessOwner._id, // Add the business owner
      date,
      timeSlot,
      status: 'PENDING', // Set to PENDING so business owner can accept/reject
      paymentIntentId: payment.id,
      amount: service.price,
      testPayment: true, // Mark as test payment
      otp: otp.toString() // Store OTP for service completion
    });

    // Send OTP email to the user
    try {
      await sendServiceBookedMail(
        service.businessOwner,
        service,
        user,
        otp
      );
    } catch (emailError) {
      console.error('Error sending booking email:', emailError);
      // Continue with booking creation even if email fails
    }

    res.status(201).json({
      success: true,
      booking,
      receiptUrl: receipt
    });

  } catch (error) {
    console.error('Booking error:', error);
    res.status(500).json({
      message: 'Booking failed',
      error: error.message
    });
  }
};
// Business owner confirms a booking
const confirmBooking = async (req, res) => {
  try {
    const updates = { status: 'CONFIRMED' };

    if (req.body.paymentIntentId) {
      updates.paymentIntentId = req.body.paymentIntentId;
    }

    const booking = await Booking.findByIdAndUpdate(
      req.params.bookingId,
      updates,
      { new: true }
    ).populate('service').populate('user');

    if (!booking) {
      return sendResponse(
        res,
        {},
        "Booking not found",
        RESPONSE_FAILURE,
        RESPONSE_CODE.NOT_FOUND
      );
    }

    // Send confirmation email to the user
    try {
      await sendServiceAcceptMail(
        { email: req.user.email, ownerFirstName: req.user.ownerFirstName }, // Business owner info
        booking.service,
        booking.user
      );
    } catch (emailError) {
      console.error('Error sending confirmation email:', emailError);
      // Continue even if email fails
    }

    return sendResponse(
      res,
      { booking },
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

    // Update booking status without processing refund through Stripe
    booking.status = "CANCELLED";
    booking.refundId = "mock_refund_" + Date.now(); // Mock refund ID
    await booking.save();

    // Update service status if needed
    await Service.findByIdAndUpdate(
      booking.service._id,
      {
        $pull: { bookedBy: userId },
        $set: { status: "CANCELLED" }
      }
    );

    // Schedule removal of service from bookedServiceIds after 10 minutes
    setTimeout(async () => {
      try {
        // Remove the service from user's bookedServiceIds
        await User.findByIdAndUpdate(
          userId,
          { $pull: { bookedServiceIds: booking.service._id } }
        );

        console.log(`Service ${booking.service._id} removed from user ${userId}'s bookedServiceIds after cancellation`);
      } catch (error) {
        console.error('Error removing cancelled service from bookedServiceIds:', error);
      }
    }, 10 * 60 * 1000); // 10 minutes in milliseconds

    // Send cancellation email
    try {
      await sendCancelServiceMail(
        booking.service,
        booking.user
      );
    } catch (emailError) {
      console.error('Error sending cancellation email:', emailError);
      // Continue with cancellation even if email fails
    }

    return sendResponse(
      res,
      { booking, refundReceipt: "Your refund will be processed within 1 hour" },
      "Booking cancelled successfully. Your refund will be processed within 1 hour.",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
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

    // Update booking status without processing refund through Stripe
    booking.status = "CANCELLED_BY_PROVIDER";
    booking.refundId = "mock_refund_" + Date.now(); // Mock refund ID
    await booking.save();

    // Update service status if needed
    await Service.findByIdAndUpdate(
      booking.service._id,
      {
        $pull: { bookedBy: booking.user._id },
        $set: { status: "CANCELLED" }
      }
    );

    // Get business owner details for the email
    const businessOwner = await User.findById(businessOwnerId);

    // Send rejection email to the user with more details
    try {
      // Enhanced email with rejection details
      const emailHtml = `
        <h1>Booking Rejection Notification</h1>
        <p>Hello ${booking.user.firstName},</p>
        <p>We regret to inform you that your booking for "${booking.service.name}" has been rejected by the service provider.</p>
        <p><strong>Booking Details:</strong></p>
        <p>Service: ${booking.service.name}</p>
        <p>Date: ${new Date(booking.date).toDateString()}</p>
        <p>Time: ${booking.timeSlot || 'N/A'}</p>
        <p>Amount: $${booking.amount}</p>
        <p><strong>Refund Information:</strong></p>
        <p>Your payment will be refunded within 1 hour. The refund will be processed to your original payment method.</p>
        <p>If you have any questions, please contact the service provider at ${businessOwner?.email || 'the contact email provided'}.</p>
        <p>Thank you for using BookMyService!</p>
      `;

      // Send the email
      await sendCancelServiceMail(
        booking.service,
        booking.user,
        emailHtml
      );
    } catch (emailError) {
      console.error('Error sending cancellation email:', emailError);
      // Continue with cancellation even if email fails
    }

    // Schedule removal of booking from user's view after 10 minutes
    setTimeout(async () => {
      try {
        // Remove the service from user's bookedServiceIds
        await User.findByIdAndUpdate(
          booking.user._id,
          { $pull: { bookedServiceIds: booking.service._id } }
        );

        console.log(`Service ${booking.service._id} removed from user ${booking.user._id}'s bookedServiceIds after rejection`);
      } catch (error) {
        console.error('Error removing rejected service from bookedServiceIds:', error);
      }
    }, 10 * 60 * 1000); // 10 minutes in milliseconds

    return sendResponse(
      res,
      { booking, refundReceipt: "Refund will be processed within 1 hour" },
      "Booking rejected successfully. Customer has been notified and refund will be processed.",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
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
    const userId = req.user.id;

    const booking = await Booking.findById(bookingId)
      .populate('service')
      .populate('user');

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
      booking.service._id,
      { $set: { status: "COMPLETED" } }
    );

    // Schedule removal of service from bookedServiceIds after one hour
    setTimeout(async () => {
      try {
        // Remove the service from user's bookedServiceIds
        await User.findByIdAndUpdate(
          booking.user._id,
          { $pull: { bookedServiceIds: booking.service._id } }
        );

        console.log(`Service ${booking.service._id} removed from user ${booking.user._id}'s bookedServiceIds after completion`);
      } catch (error) {
        console.error('Error removing completed service from bookedServiceIds:', error);
      }
    }, 60 * 60 * 1000); // 1 hour in milliseconds

    return sendResponse(
      res,
      booking,
      "Service marked as completed successfully",
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
  getBookingById,
  updatePaymentInfo
};