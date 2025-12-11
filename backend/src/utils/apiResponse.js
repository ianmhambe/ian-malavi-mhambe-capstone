/**
 * Standard API response format
 */

class ApiResponse {
  constructor(success, message, data = null, meta = null) {
    this.success = success;
    this.message = message;
    if (data !== null) this.data = data;
    if (meta !== null) this.meta = meta;
  }

  static success(message, data = null, meta = null) {
    return new ApiResponse(true, message, data, meta);
  }

  static error(message, data = null) {
    return new ApiResponse(false, message, data);
  }

  static paginated(message, data, pagination) {
    return new ApiResponse(true, message, data, { pagination });
  }
}

/**
 * Send success response
 */
const sendSuccess = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json(ApiResponse.success(message, data));
};

/**
 * Send error response
 */
const sendError = (res, message, statusCode = 400, data = null) => {
  return res.status(statusCode).json(ApiResponse.error(message, data));
};

/**
 * Send paginated response
 */
const sendPaginated = (res, message, data, pagination, statusCode = 200) => {
  return res.status(statusCode).json(ApiResponse.paginated(message, data, pagination));
};

/**
 * Calculate pagination metadata
 */
const calculatePagination = (total, page, limit) => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

module.exports = {
  ApiResponse,
  sendSuccess,
  sendError,
  sendPaginated,
  calculatePagination,
};
