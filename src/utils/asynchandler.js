const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
  };
};

//!return here is essential to make asyncHandler truly asynchronous and to properly propagate the result or error.

export { asyncHandler };

// export const asyncHandler = (fn) => async ()=>{
//   try {
//     await fn(req, res , next)
//   } catch (error) {
//     res.status(err code || 500).json({
//       success: false,
//       message: err.message
//     })
//   }
// }
