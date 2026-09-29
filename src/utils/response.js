const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const errorResponse = (res, message, statusCode = 500, errors = null) => {
  const finalMessage = message && typeof message === 'string' && message.trim() ? message.trim() : 'Something went wrong';
  return res.status(statusCode).json({
    success: false,
    message: finalMessage,
    errors,
  });
};

module.exports = { successResponse, errorResponse };
