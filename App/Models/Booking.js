import { model, Schema } from "mongoose";

export const bookingSchema = new Schema(
  {
    service: { 
      type: Schema.Types.ObjectId, 
      ref: "Service", 
      required: true 
    },
    user: { 
      type: Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    businessOwner: { 
      type: Schema.Types.ObjectId, 
      ref: "BusinessOwner", 
      required: true 
    },
    date: { 
      type: Date, 
      required: true 
    },
    timeSlot: { 
      type: String, 
      required: function() { 
        return this.service.booking_type === "appointment"; 
      } 
    },
    status: { 
      type: String, 
      enum: [
        "PENDING",    
        "CONFIRMED",    
        "REJECTED",      
        "CANCELLED",     
        "COMPLETED",     
        "CANCELLED_BY_PROVIDER" 
      ],
      default: "PENDING" 
    },
    paymentIntentId: { 
      type: String, 
      required: true 
    }, // Stripe payment ID
    amount: { 
      type: Number, 
      required: true 
    }, // In cents (Stripe standard)
    refundId: { 
      type: String 
    }, // Stripe refund ID (if cancelled)
    specialRequests: { 
      type: String 
    },
    otp: { 
      type: String 
    }, // For service verification
  },
  { timestamps: true }
);

export default model("Booking", bookingSchema);