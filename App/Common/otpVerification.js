export function verifyOTP(inputOTP, generatedOTP, res) {
  if (inputOTP === generatedOTP) {
    res.clearCookie("otp");
    return true;
  } else {
    return false;
  }
}
