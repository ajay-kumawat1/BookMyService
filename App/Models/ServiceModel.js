import { model, Schema } from "mongoose";

export const serviceSchema = new Schema(
  {
    name: { type: String, required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: false },
    availability: { type: String, required: true },
    location: {
      type: [String],
      enum: ["on-site", "online", "customer_location"],
      required: true,
    },
    duration: { type: Number, required: false },
    serviceOtp: { type: Number },
    images:[{
      type: String,
      required: true,
      default: null,
  }],
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
