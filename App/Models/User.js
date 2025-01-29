import { model, Schema } from "mongoose";
import jwt from "jsonwebtoken";
import { Role } from "../Common/common.js";

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
      default: null,
      unique: true,
      validate: {
        validator: function (v) {
          return /\d{10}/.test(v); // Validates 10-digit phone numbers
        },
        message: (props) => `${props.value} is not a valid phone number!`,
      },
    },
    role: {
      type: String,
      default: Role.USER,
    },
    isVerified: {
      type: Boolean,
      default: false,
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

export const User = model('User', UserSchema);
