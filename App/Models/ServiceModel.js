import { model, Schema } from "mongoose";

export const serviceSchema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true }, // Example: "Electrician", "Plumber", "Carpenter"
    description: { type: String, required: true },
    price: { type: Number, required: false },
    availability: { type: String, required: true }, // Example: "Monday - Friday, 9 AM - 5 PM"
    location: {
      type: [String],
      enum: ["on-site", "online", "customer_location"],
      required: true,
    },
    duration: { type: Number, required: false }, // Duration in minutes
    serviceOtp: { type: Number },
    images:[{
      type: String,
      required: true,
      default: null,
  }], // Array of image URLs
    businessOwner: { type: Schema.Types.ObjectId, ref: "BusinessOwner" },
    booking_type: {
      type: [String],
      enum: ["instant", "appointment"],
      required: true,
    },
    payment_options: {
      type: [String],
      enum: ["cash", "online", "card"],
      required: true,
    },
    status: { type: String },
    bookedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

export default  model("Service", serviceSchema);
