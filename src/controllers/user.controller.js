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
    console.log("Yahan se token generation start hua hai:", userId);

    // Bug fix 1: Added 'await' to findById
    const user = await User.findById(userId);
    console.log("user khoj ke mil gaya", user ? "Yes" : "No");

    if (!user) {
      console.log("No user found for ID:", userId);
      throw new ApiError(
        404,
        "User not found (generateAccessAndRefreshToken):"
      );
    }

    // Bug fix 2: Methods were swapped - fixed the method names
    // Bug fix 3: Added 'await' if these are async operations
    console.log("Generating access token...");
    const accessToken = await user.generateAccessToken();

    console.log("Generating refresh token...");
    const refreshToken = await user.generateRefreshToken();

    console.log("Tokens generated successfully");

    // Bug fix 4: Added 'await' to save operation
    user.refreshToken = refreshToken;
    console.log("Saving refresh token to user document...");
    await user.save({ validateBeforeSave: false });
    console.log("Refresh token saved successfully");

    return { accessToken, refreshToken };
  } catch (error) {
    console.error("Token generation error:", {
      message: error.message,
      stack: error.stack,
    });

    throw new ApiError(500, `Token generation failed: ${error.message}`);
  }
};

//=======================================================

const loginUser = asyncHandler(async (req, res) => {
  //!
  // req body -> data
  // username  or email
  // find the user
  // password check
  // access and refresh token
  // send cookie
  //!

  try {
    console.log("Login attempt started");
    const { email, username, password } = req.body;
    console.log("Request body:", { email, username, password: "****" });

    if (!username && !email) {
      console.log("Validation failed: No username or email provided");
      throw new ApiError(400, "username or email required");
    }

    // Major bug fix: Added 'await' here
    const user = await User.findOne({
      $or: [{ username }, { email }],
    });
    console.log("User search result:", user ? "User found" : "User not found");

    if (!user) {
      console.log("User not found in database");
      throw new ApiError(404, "user doesn't exists");
    }

    // Major bug fix: Added 'await' here
    const isPasswordValid = await user.isPasswordCorrect(password);
    console.log("Password validation:", isPasswordValid ? "Success" : "Failed");

    if (!isPasswordValid) {
      console.log("Invalid password attempt");
      throw new ApiError(401, "Invalid password");
    }

    console.log("Generating tokens for user ID:", user._id);
    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );
    console.log("Tokens generated successfully");

    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );
    console.log("Fetched user data without sensitive information");

    const options = {
      httpOnly: true,
      secure: true,
    };

    console.log("Sending successful login response");
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
    console.error("Login error:", error);
    // Modified to include the original error message
    throw new ApiError(500, `Login failed: ${error.message}`);
  }
});

//=======================================================

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "user has been logged Out"));
});

export { registerUser, loginUser, logoutUser };
