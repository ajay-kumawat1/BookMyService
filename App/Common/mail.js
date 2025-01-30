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

export const sendMail = async (email, otp) => {
  const info = await transporter.sendMail({
    from: "bookmyservice786@gmail.com",
    to: email,
    subject: "Hello ✔",
    text: ``,
    html: `<b>Your OTP is ${otp} for verification</b>`,
  });

  console.log("Message sent: %s", info.messageId);
};
