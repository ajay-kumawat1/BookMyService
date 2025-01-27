import { model, Schema } from "mongoose";
import jwt from "jsonwebtoken";

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
    isAdmin: {
      type: Boolean,
      default: false,
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

export default model("User", UserSchema);
