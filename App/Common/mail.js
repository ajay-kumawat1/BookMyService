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

export const sendSignUpMail = async (email, firstName, otp) => {
  try {
    // Simple email without template
    const emailHtml = `
      <h1>Welcome to BookMyService!</h1>
      <p>Hello ${firstName},</p>
      <p>Thank you for registering with BookMyService. Please use the following OTP to verify your account:</p>
      <p style="font-size: 24px; font-weight: bold; color: #f97316; text-align: center; padding: 10px; background-color: #f3f4f6; border-radius: 5px;">${otp}</p>
      <p>This OTP is valid for 5 minutes.</p>
      <p>Date: ${new Date().toDateString()}</p>
      <p>If you did not request this OTP, please ignore this email.</p>
      <p>Thank you for choosing BookMyService!</p>
    `;

    const info = await transporter.sendMail({
      from: "bookmyservice786@gmail.com",
      to: email,
      subject: "BookMyService - Verify Your Account",
      html: emailHtml,
    });

    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

export const sendMail = async (service, firstName, email, otp) => {
  try {
    const emailHtml = `
      <h1>Service Confirmation & OTP Details</h1>
      <p>Hello ${firstName},</p>
      <p>Your OTP for service confirmation is: <strong>${otp}</strong></p>
      <p><strong>Service Details:</strong></p>
      <p>Service: ${service.name}</p>
      <p>Description: ${service.description}</p>
      <p>Price: $${service.price}</p>
      <p>Date: ${new Date().toDateString()}</p>
      <p>Thank you for using BookMyService!</p>
    `;

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

export const sendServiceBookedMail = async (owner, service, user, otp) => {
  try {
        owner = owner.toObject ? owner.toObject() : owner;
        service = service.toObject ? service.toObject() : service;
        user = user.toObject ? user.toObject() : user;

    const ownerEmailHtml = `
      <h1>Service Booking Notification</h1>
      <p>Hello ${owner.firstName || owner.ownerFirstName},</p>
      <p>Your service "${service.name}" has been booked by ${user.firstName} ${user.lastName || ''}.</p>
      <p><strong>Customer Details:</strong></p>
      <p>Name: ${user.firstName} ${user.lastName || ''}</p>
      <p>Email: ${user.email}</p>
      <p>Phone: ${user.phoneNumber || 'Not provided'}</p>
      <p><strong>Service Details:</strong></p>
      <p>Service: ${service.name}</p>
      <p>Description: ${service.description}</p>
      <p>Price: $${service.price}</p>
      <p>Date: ${new Date().toDateString()}</p>
      <p>Thank you for using BookMyService!</p>
    `;

    const ownerInfo = await transporter.sendMail({
      from: "bookmyservice786@gmail.com",
      to: owner.email,
      subject: `Your service "${service.name}" has been booked`,
      text: `Your service "${service.name}" has been booked by ${user.firstName} ${user.lastName || ''}`,
      html: ownerEmailHtml,
    });

    const userEmailHtml = `
      <h1>Service Booking Confirmation</h1>
      <p>Hello ${user.firstName},</p>
      <p>You have successfully booked the service "${service.name}".</p>
      <p><strong>Service Details:</strong></p>
      <p>Service: ${service.name}</p>
      <p>Description: ${service.description}</p>
      <p>Price: $${service.price}</p>
      <p>Date: ${new Date().toDateString()}</p>
      <p><strong>Service Provider Details:</strong></p>
      <p>Name: ${owner.ownerFirstName} ${owner.ownerLastName || ''}</p>
      <p>Business: ${owner.businessName || ''}</p>
      <p>Email: ${owner.email}</p>
      <p>Phone: ${owner.phoneNumber || 'Not provided'}</p>

      <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #f97316; border-radius: 4px;">
        <h2 style="color: #f97316; margin-top: 0;">Service Completion OTP</h2>
        <p>Please keep this OTP safe. You will need it to mark the service as completed:</p>
        <p style="font-size: 24px; font-weight: bold; color: #f97316; text-align: center; padding: 10px; background-color: #f3f4f6; border-radius: 5px;">${otp}</p>
        <p>This OTP is valid until the service is completed.</p>
      </div>

      <p>Thank you for using BookMyService!</p>
    `;

    const userInfo = await transporter.sendMail({
      from: "bookmyservice786@gmail.com",
      to: user.email,
      subject: `You have booked "${service.name}" - Service Completion OTP`,
      text: `You have successfully booked the service "${service.name}". Your service completion OTP is: ${otp}`,
      html: userEmailHtml,
    });

    console.log("Owner email sent: %s", ownerInfo.messageId);
    console.log("User email sent: %s", userInfo.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

export const sendServiceAcceptMail = async (owner, service, user) => {
  try {
    owner = owner.toObject ? owner.toObject() : owner;
    service = service.toObject ? service.toObject() : service;
    user = user.toObject ? user.toObject() : user;

    const emailHtml = `
      <h1>Service Booking Confirmation</h1>
      <p>Hello ${user.firstName},</p>
      <p>Your booking for "${service.name}" has been confirmed by the service provider.</p>
      <p><strong>Service Provider Details:</strong></p>
      <p>Name: ${owner.ownerFirstName} ${owner.ownerLastName || ''}</p>
      <p>Business: ${owner.businessName || ''}</p>
      <p>Email: ${owner.email}</p>
      <p>Phone: ${owner.phoneNumber || 'Not provided'}</p>
      <p><strong>Service Details:</strong></p>
      <p>Service: ${service.name}</p>
      <p>Description: ${service.description}</p>
      <p>Price: $${service.price}</p>
      <p>Date: ${new Date().toDateString()}</p>
      <p>Thank you for using BookMyService!</p>
    `;

    const info = await transporter.sendMail({
      from: "bookmyservice786@gmail.com",
      to: user.email,
      subject: "Your Service Booking is Confirmed",
      text: `Your booking for ${service.name} has been confirmed by the service provider.`,
      html: emailHtml,
    });

    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

export const sendCancelServiceMail = async (service, user, customHtml = null) => {
  try {
    service = service.toObject ? service.toObject() : service;
    user = user.toObject ? user.toObject() : user;

    const emailHtml = customHtml || `
      <h1>Service Booking Cancellation</h1>
      <p>Hello ${user.firstName},</p>
      <p>Your booking for "${service.name}" has been cancelled.</p>
      <p><strong>Service Details:</strong></p>
      <p>Service: ${service.name}</p>
      <p>Description: ${service.description}</p>
      <p>Price: $${service.price}</p>
      <p>Date: ${new Date().toDateString()}</p>
      <p>If you have any questions, please contact our support team.</p>
      <p>Thank you for using BookMyService!</p>
    `;

    const info = await transporter.sendMail({
      from: "bookmyservice786@gmail.com",
      to: user.email,
      subject: "Your Service Booking has been Cancelled",
      text: `Your booking for ${service.name} has been cancelled`,
      html: emailHtml,
    });

    console.log("Message sent: %s", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};