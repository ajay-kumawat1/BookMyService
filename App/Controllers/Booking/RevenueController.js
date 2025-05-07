import { sendResponse } from "../../Common/common.js";
import {
  RESPONSE_CODE,
  RESPONSE_FAILURE,
  RESPONSE_SUCCESS,
} from "../../Common/constant.js";
import Booking from "../../Models/Booking.js";
import Service from "../../Models/ServiceModel.js";

// Get revenue statistics for a business owner
const getRevenueStatistics = async (req, res) => {
  try {
    const businessOwnerId = req.user.id;

    // Get all completed bookings for this business owner
    const completedBookings = await Booking.find({
      businessOwner: businessOwnerId,
      status: "COMPLETED"
    }).populate("service");

    // Get all cancelled bookings for this business owner (to subtract from revenue)
    const cancelledBookings = await Booking.find({
      businessOwner: businessOwnerId,
      status: { $in: ["CANCELLED", "CANCELLED_BY_PROVIDER"] }
    }).populate("service");

    if ((!completedBookings || completedBookings.length === 0) &&
        (!cancelledBookings || cancelledBookings.length === 0)) {
      return sendResponse(
        res,
        {
          totalRevenue: 0,
          revenueByService: [],
          monthlyRevenue: []
        },
        "No revenue data available yet",
        RESPONSE_SUCCESS,
        RESPONSE_CODE.SUCCESS
      );
    }

    // Calculate total revenue from completed bookings
    const totalCompletedRevenue = completedBookings.reduce((sum, booking) => sum + booking.amount, 0);

    // Calculate revenue by service
    const serviceRevenueMap = {};

    // Add revenue from completed bookings
    for (const booking of completedBookings) {
      const serviceId = booking.service._id.toString();
      const serviceName = booking.service.name;

      if (!serviceRevenueMap[serviceId]) {
        serviceRevenueMap[serviceId] = {
          serviceId,
          serviceName,
          revenue: 0
        };
      }

      serviceRevenueMap[serviceId].revenue += booking.amount;
    }

    // Subtract revenue from cancelled bookings
    for (const booking of cancelledBookings) {
      const serviceId = booking.service._id.toString();
      const serviceName = booking.service.name;

      if (!serviceRevenueMap[serviceId]) {
        serviceRevenueMap[serviceId] = {
          serviceId,
          serviceName,
          revenue: 0
        };
      }

      // Subtract the cancelled booking amount
      serviceRevenueMap[serviceId].revenue -= booking.amount;
    }

    // Filter out services with zero or negative revenue
    const revenueByService = Object.values(serviceRevenueMap)
      .filter(service => service.revenue > 0);

    // Calculate monthly revenue for the past 12 months
    const now = new Date();
    const monthlyData = {};

    // Initialize past 12 months with zero revenue
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyData[monthKey] = {
        month: monthKey,
        revenue: 0
      };
    }

    // Add revenue from completed bookings
    for (const booking of completedBookings) {
      const bookingDate = new Date(booking.date);
      const monthKey = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}`;

      // Only include data for the past 12 months
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].revenue += booking.amount;
      }
    }

    // Subtract revenue from cancelled bookings
    for (const booking of cancelledBookings) {
      const bookingDate = new Date(booking.date);
      const monthKey = `${bookingDate.getFullYear()}-${String(bookingDate.getMonth() + 1).padStart(2, '0')}`;

      // Only include data for the past 12 months
      if (monthlyData[monthKey]) {
        monthlyData[monthKey].revenue -= booking.amount;
      }
    }

    // Convert to array and sort by month
    const monthlyRevenue = Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));

    // Calculate final total revenue (may be different from totalCompletedRevenue due to cancellations)
    const totalRevenue = monthlyRevenue.reduce((sum, month) => sum + month.revenue, 0);

    return sendResponse(
      res,
      {
        totalRevenue,
        revenueByService,
        monthlyRevenue
      },
      "Revenue statistics fetched successfully",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`RevenueController.getRevenueStatistics() -> Error: ${error}`);
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
  getRevenueStatistics
};
