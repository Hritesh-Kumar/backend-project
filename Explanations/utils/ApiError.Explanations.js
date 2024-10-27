// Define a custom error class called ApiError that extends the built-in Error class
class ApiError extends Error {
  // The constructor method is called when creating a new instance of ApiError
  constructor(
    statusCode, // HTTP status code, e.g., 404, 500
    message = "Something went wrong", // Default error message
    errors = [], // Array to store multiple error details, defaults to an empty array
    stack = "" // Optional custom stack trace, defaults to an empty string
  ) {
    // Call the parent constructor (Error class) with the message
    super(message);

    // Assign the provided HTTP status code to the instance
    this.statusCode = statusCode;

    // Placeholder for additional data, can be set when handling the error later
    this.data = null;

    // Store the message, which was also passed to the parent Error class
    this.message = message;

    // Indicate the success status (usually false for errors)
    this.success = false;

    // Store any additional error details passed to the constructor
    this.errors = errors;

    // If a custom stack trace is provided, use it; otherwise, capture the default stack trace
    if (stack) {
      this.stack = stack;
    } else {
      // Capture stack trace, excluding the constructor to avoid cluttering the trace
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

// Example usage
//!try {
// Throw a new instance of ApiError with a 404 status and custom message
//!   throw new ApiError(404, "Resource not found", ["Invalid resource ID"]);
//! } catch (error) {
// Check if the error is an instance of ApiError and handle accordingly
//!   if (error instanceof ApiError) {
//!     console.error("Custom API Error:", error.statusCode, error.message, error.errors);
//!   } else {
// !    console.error("General Error:", error);
// !  }
//! }
