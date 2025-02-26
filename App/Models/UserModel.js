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
      unique: true,
    },
    avatar: {
      type: String,
      default: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTnFcoNkDNEQ9sXq36dfEj8FZjB4n_X3VFFew&s'
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
