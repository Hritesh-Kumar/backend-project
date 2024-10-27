const asyncHandler = (requestHandler) => {
  Promise.resolve(requestHandler(req, res, next)).catch((err) => next(err));
};

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
