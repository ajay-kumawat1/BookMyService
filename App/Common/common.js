import path from "path";
import { fileURLToPath } from "url";
import { sendMail } from "./mail.js";
import pkg from "jsonwebtoken";
const { sign, verify } = pkg;
import { hash } from "bcrypt";

export async function sendResponse(res, data, message, success, code = 200) {
  const responseObj = {
    data: data,
    message: message ? message : "undefined",
    success: success,
  };

  res.status(code).json(responseObj);
}

export const Role = {
  SYSTEM_ADMIN: "SystemAdmin",
  ADMIN: "Admin",
  USER: "User",
};

export async function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000);
}

export async function storeOtpInCookie(res, otp) {
  res.cookie("otp", otp, {
    httpOnly: true, // Prevent client-side access
    secure: true, // Required for HTTPS (true in production)
    sameSite: "None", // Allows cross-origin requests
  });
}

export async function sendOtpMail(email, firstName, templatePath, otp) {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  await sendMail(email, firstName, otp, path.join(__dirname, templatePath));
}

export async function signToken(info) {
  const newToken = sign(info, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE,
  });

  return newToken;
}

export async function decodeToken(token) {
  const verifyToken = verify(token, process.env.JWT_SECRET);
  if (!verifyToken) {
    return null;
  }

  req.user = verifyToken;
  next();
}

export async function hashPassword(password) {
  return hash(password, 10);
}
