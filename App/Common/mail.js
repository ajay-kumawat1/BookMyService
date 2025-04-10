import fs from "fs";
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

export const sendMail = async (service, firstName, otp, emailTemplatePath) => {
  try {
    const emailTemplate = fs.readFileSync(emailTemplatePath, "utf-8");
    const emailHtml = emailTemplate
      .replace("{{OTP}}", otp)
      .replace("{{NAME}}", firstName)
      .replace("{{SERVICE_NAME}}", service.name)
      .replace("{{SERVICE_DESCRIPTION}}", service.description)
      .replace("{{SERVICE_CHARGE}}", service.serviceCharge)
      .replace("{{DATE}}", new Date().toDateString());

    const info = await transporter.sendMail({
      from: "bookmyservice786@gmail.com",
      to: email,
      subject: "Service Confirmation & OTP Details",
      html: emailHtml,
    });

    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

export const sendServiceBookedMail = async (email, firstName, emailTemplatePath) => {
  try {
    const emailTemplate = fs.readFileSync(emailTemplatePath, "utf-8");
    const emailHtml = emailTemplate
      .replace("{{NAME}}", firstName)
      .replace("{{DATE}}", new Date().toDateString());

    const info = await transporter.sendMail({
      from: "bookmyservice786@gmail.com",
      to: email,
      subject: "Service Booked",
      text: `Your service has been booked`,
      html: emailHtml,
    });

    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};