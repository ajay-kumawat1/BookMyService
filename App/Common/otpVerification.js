export function verifyOTP(inputOTP, generatedOTP) {
  if (inputOTP === generatedOTP) {
    res.clearCookie("otp");
    return true;
  } else {
    return false;
  }
}
