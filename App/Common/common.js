import { sendMail } from "./mail.js";
import path from "path";
import { fileURLToPath } from "url";
import pkg from 'jsonwebtoken';
const { sign } = pkg;

export async function sendResponse(res, data, message, success, code = 200) {
  const responseObj = {
    data: data,
    message: message ? message : "undefined",
    success: success,
  };

  res.status(code).json(responseObj);
}

export const Role = {
  SYSTEM_ADMIN: 'SystemAdmin',
  ADMIN: 'Admin',
  EMPLOYEE: 'Employee',
};

export async function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000);
}

export async function storeOtpInCookie(res, otp) {
  res.cookie("otp", otp, {
    maxAge: 900000,
    httpOnly: true,
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