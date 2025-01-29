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
