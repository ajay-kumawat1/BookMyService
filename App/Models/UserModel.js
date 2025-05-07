import { model, Schema } from "mongoose";
import jwt from "jsonwebtoken";
import { Role } from "../Common/enum.js";

export const UserSchema = new Schema(
  {
    firstName: {
      type: String,
      required: [true, "The first name is required."],
    },
    lastName: {
      type: String,
      default: null,
    },
    email: { type: String, required: true },
    password: { type: String, default: null },
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true, // Allow multiple null values (for social login users who don't provide phone)
    },
    avatar: {
      type: String,
    },
    role: {
      type: String,
      default: Role.USER,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    bookedServiceIds: [{ type: Schema.Types.ObjectId, ref: "Service" }],
    serviceOtp: {
      otp: { type: Number },
      expiresAt: { type: Date },
    },
    // Social login fields
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allow multiple null values
    },
    facebookId: {
      type: String,
      unique: true,
      sparse: true, // Allow multiple null values
    },
    authProvider: {
      type: String,
      enum: ['local', 'google', 'facebook'],
      default: 'local'
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.methods.generateAuthToken = function () {
  return jwt.sign(
    { uId: this._id, isAdmin: this.isAdmin },
    process.env.JWT_PRIVATE_KEY,
    {
      expiresIn: "24h",
    }
  );
};

export default model('User', UserSchema);
