import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadInCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

export const registerUser = asyncHandler(async (req, res) => {
  //Get user details from frontend
  const { fullName, email, username, password } = req.body;
  console.log(email);
  console.log("Request Body:", req.body);

  //validation - not empty
  if (
    [fullName, username, password, email].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "fields missing here");
  }

  //check if already exists (username, Email)
  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  console.log("Existed User:", existedUser);

  if (existedUser) {
    throw new ApiError(409, "username or email already existed");
  }

  //check for images, check for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "AVATAR upload nai hai");
  }

  console.log("Avatar Path:", avatarLocalPath);
  console.log("Cover Image Path:", coverLocalPath);

  //upload them to cloudinary (avatar)
  const avatar = await uploadInCloudinary(avatarLocalPath);
  const coverImage = await uploadInCloudinary(coverLocalPath);

  if (!avatar) {
    throw new ApiError(400, "AVATAR upload nai hai");
  }

  //create user object (create entry in db)
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    username,
  });

  //remove password & refresh token from response
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  //check for user creation
  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering User");
  }

  //return response or send error
  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "user registered successfully"));
});
