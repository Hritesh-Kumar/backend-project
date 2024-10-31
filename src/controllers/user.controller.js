import { asyncHandler } from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { uploadInCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  //------------
  //get user details
  //validation (empty)
  //check if already exists
  //check for images, check for avatar
  //upload them to coludinary
  //create user object(create entry in db)
  //remove password & refresh token from response
  //check for user creation
  //return res || send error
  //------------
  try {
    const { fullName, email, username, password } = req.body;
    console.log("Starting user registration process...");
    console.log("Request Body:", {
      fullName,
      email,
      username,
      password: "****",
    });

    if ([fullName, username, password, email].some((field) => !field?.trim())) {
      throw new ApiError(400, "All fields are required");
    }

    //=================================================================

    console.log("Checking for existing user...");
    const existedUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existedUser) {
      throw new ApiError(409, "Username or email already exists");
    }

    //=================================================================

    console.log("Checking avatar file...");
    if (!req.files?.avatar?.[0]?.path) {
      throw new ApiError(400, "Avatar file is required");
    }

    const avatarLocalPath = req.files.avatar[0].path;
    const coverLocalPath = req.files?.coverImage?.[0]?.path;

    console.log("Uploading avatar to Cloudinary...");
    const avatar = await uploadInCloudinary(avatarLocalPath);
    if (!avatar) {
      throw new ApiError(400, "Error while uploading avatar");
    }

    let coverImage;
    if (coverLocalPath) {
      console.log("Uploading cover image to Cloudinary...");
      coverImage = await uploadInCloudinary(coverLocalPath);
    }

    //=================================================================

    console.log("Creating user in database...");
    const user = await User.create({
      fullName,
      avatar: avatar.url,
      coverImage: coverImage?.url || "",
      email,
      password,
      username,
    });

    console.log("Fetching created user...");
    const createdUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while registering user");
    }

    console.log("User registration successful!");
    return res
      .status(201)
      .json(new ApiResponse(201, createdUser, "User registered successfully"));
  } catch (error) {
    console.error("Error in user registration:", error);
    throw error; // This will be caught by asyncHandler
  }
});

//=======================================================

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = User.findById(userId);

    const accessToken = user.generateRefreshToken();
    const refreshToken = user.generateAccessToken();

    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
    //
  } catch (error) {
    //
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh token"
    );
  }
};

//=======================================================

const loginUser = asyncHandler(async (req, res) => {
  // req body -> data
  // username  or email
  // find the user
  // password check
  // access and refresh token
  // send cookie

  try {
    const { email, username, password } = req.body;

    if (!username || !email) {
      throw new ApiError(400, "username or email required");
    }

    //! here we found the user that we were looking for and stored inside const user
    const user = User.findOne({
      $or: [{ username }, { email }],
    });

    if (!user) {
      throw new ApiError(404, "user doesn't exists");
    }

    const isPasswordValid = user.isPasswordCorrect(password);

    if (!isPasswordValid) {
      throw new ApiError(401, "bhai password galat hai");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    const options = {
      httpOnly: true,
      secure: true,
    };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: loggedInUser,
            accessToken,
            refreshToken,
          },
          "user has successfully logged In"
        )
      );
  } catch (error) {
    throw new ApiError(500, "loginUser not working");
  }
});

const logoutUser = asyncHandler(async (req, res) => {});

export { registerUser };
