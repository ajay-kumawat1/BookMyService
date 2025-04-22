import { model, Schema } from "mongoose";
import { Role } from "../Common/enum.js";

export const BusinessSchema = new Schema(
  {
    ownerFirstName: {
      type: String,
      required: [true, "The first name is required."],
    },
    ownerLastName: {
      type: String,
      default: [true, "The last name is required."],
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: [true, "Password is required."],
    },
    phoneNumber: {
      type: String,
      required: [true, "Phone number is required."],
      unique: true,
      validate: {
        validator: function (v) {
          return /\d{10}/.test(v);
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    businessName: {
      type: String,
      required: [true, "Business name is required."],
    },
    businessCategory: {
      type: String,
      required: [true, "Business category is required."],
    },
    businessDescription: {
      type: String,
      default: "",
    },
    businessAddress: {
      type: String,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    zipCode: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
    },
    businessWebsite: {
      type: String,
      default: null,
    },
    businessLogo: {
      type: String,
      default: "https://example.com/default-business-logo.png",
    },
    role: {
      type: String,
      default: Role.OWNER,
    },
    servicesOffered: [{ type: Schema.Types.ObjectId, ref: "Service" }],
    workingHours: {
      type: String,
      required: false,
    },
    businessRegistrationNumber: {
      type: String,
      default: null,
    },
    taxId: {
      type: String,
      default: null,
    },
    businessLicense: {
      type: String,
      default: null,
    },
    idProof: {
      type: String,
      default: null,
    },
    paymentMethod: {
      type: String,
      required: false,
      enum: ["Bank Transfer", "PayPal", "Stripe"],
    },
    payoutDetails: {
      type: String,
      required: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    termsAccepted: {
      type: Boolean,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export default model("BusinessOwner", BusinessSchema);
