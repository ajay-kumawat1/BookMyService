import { sendResponse } from "../../Common/common.js";
import {
  RESPONSE_CODE,
  RESPONSE_FAILURE,
  RESPONSE_SUCCESS,
} from "../../Common/constant.js";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.NODEMAILER_HOST,
  port: process.env.NODEMAILER_PORT,
  secure: true,
  auth: {
    user: process.env.NODEMAILER_AUTH,
    pass: process.env.NODEMAILER_PASS,
  },
});

/**
 * Handle contact form submissions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Validate required fields
    if (!name || !email || !subject || !message) {
      return sendResponse(
        res,
        {},
        "All fields are required",
        RESPONSE_FAILURE,
        RESPONSE_CODE.BAD_REQUEST
      );
    }

    // Create HTML for the email to the admin
    const adminEmailHtml = `
      <h1>New Contact Form Submission</h1>
      <p><strong>Name:</strong> ${name}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
      <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
    `;

    // Send email to admin
    await transporter.sendMail({
      from: "bookmyservice786@gmail.com",
      to: "bookmyservice786@gmail.com", // Admin email
      subject: `Contact Form: ${subject}`,
      html: adminEmailHtml,
    });

    // Create HTML for the confirmation email to the user
    const userEmailHtml = `
      <h1>Thank You for Contacting BookMyService</h1>
      <p>Hello ${name},</p>
      <p>We have received your message and will get back to you as soon as possible.</p>
      <p><strong>Your Message Details:</strong></p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong></p>
      <p>${message}</p>
      <p>Thank you for reaching out to us!</p>
      <p>Best regards,<br>The BookMyService Team</p>
    `;

    // Send confirmation email to the user
    await transporter.sendMail({
      from: "bookmyservice786@gmail.com",
      to: email,
      subject: "Thank You for Contacting BookMyService",
      html: userEmailHtml,
    });

    return sendResponse(
      res,
      {},
      "Your message has been sent successfully. We'll get back to you soon!",
      RESPONSE_SUCCESS,
      RESPONSE_CODE.SUCCESS
    );
  } catch (error) {
    console.error(`ContactController.submitContactForm() -> Error: ${error}`);
    return sendResponse(
      res,
      {},
      "Failed to send your message. Please try again later.",
      RESPONSE_FAILURE,
      RESPONSE_CODE.INTERNAL_SERVER_ERROR
    );
  }
};

export default {
  submitContactForm,
};
