import { asyncHandler } from '../utils/asyncHandler.js';
import { APIError } from '../utils/APIError.js'
import { APIResponse } from '../utils/APIResponse.js';
import { User } from '../models/User.models.js'
import { uploadDataCloudinary } from '../utils/cloudinary.js'

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const userWithId = await User.findById(userId)
    const accessToken = userWithId.generateAccessToken()
    const refreshToken = userWithId.generateRefreshToken()
    userWithId.refreshToken = refreshToken
    userWithId.accessToken = accessToken
    // Now save the object
    // When we save using this method this will check for all validation, as we are sending only one data we need to turn off the validatioon
    await userWithId.save({ validateBeforeSave: false })
    return { accessToken, refreshToken }
  }
  catch (error) {
    throw new APIError(500, "Something went wrong while generating tokens")
  }
}

const registerUser = asyncHandler(async (req, res) => {
  // Steps to build logic:-
  // Get user details from frontend
  // Validation - not empty (required fields)
  // check if User already present, username, email
  // check for images, check for avatar
  // create User object - create entry in Database
  // remove password and referesh tokens field from response
  // check for User creation
  // return response to the frontend.

  // Get user details
  const { fullName, email, username, password } = req.body
  if ([fullName, email, username, password].some((field) =>
    field?.trim() === "")) {
    throw new APIError(400, "All fields are required")
  }

  // User have to find Is email is already present or not?
  const existedUser = await User.findOne({
    $or: [{ username }, { email }]
  })


  if (existedUser) {
    throw new APIError(409, "User with email or username already exist")
  }
  // console.log(req.files)

  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverLocalPath = req.files?.coverImage[0]?.path;
  let coverLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
    coverLocalPath = req.files.coverImage[0].path
  }

  if (!avatarLocalPath) {
    throw new APIError(400, "Avatar file is required")
  }
  const avatar = await uploadDataCloudinary(avatarLocalPath)
  const cover = await uploadDataCloudinary(coverLocalPath)

  if (!avatar) {
    throw new APIError(400, "Avatar is required")
  }

  // Create User
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: cover?.url || "",
    email,
    password,
    username: username.toLowerCase()
  })
  // This code is responsible for excluding the specific field value from the response.
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if (!createdUser) {
    throw new APIError(500, "Something went wrong while registering the user")
  }

  return res.status(201).json(
    new APIResponse(200, createdUser)
  )

});

const loginUser = asyncHandler(async (req, res) => {
  // Steps to build loginUser
  // check that email or username is present or not
  // getting username/email and password from the user
  // authentication for valid user
  // access token and refresh token to limit user access to server
  // send secure cookies to send tokens 
  // send response that user logged in
  const { email, username, password } = req.body

  if (!username || !email) {
    throw new APIError(400, "Username or Email is required")
  }
  // To get the user either with username or email
  const user = await User.findOne({
    $or: [{ username }, { email }]
  })

  if (!user) {
    throw new APIError(404, "User does not exist")
  }
  // Checking the password (User should not be used beacuse we have made a customised method it is not provided by mongoose, So it will be applicable for our user object)
  const isPasswordValid = await user.isPasswordCorrect(password)
  if (!isPasswordValid) {
    throw new APIError(404, "Invalid credentials")
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

  // user is empty so we need to update by object or trigger a DB call
  // DB call
  const loggedInUser = await User.findById(user._id)
    .select("-password -refreshToken")
  // // object updation
  // user.accessToken = accessToken
  // user.refreshToken = refreshToken
  // user.save({validateBeforeSave:false})

  const options = {
    httpOnly: true,
    secure: true
  }
  return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new APIResponse(200, {
        // when user want to save accessToken and refreshToken into the local memory
        user: loggedInUser, accessToken, refreshToken
      },
        "User Logged In successfully"
      )
    )
})

const logoutUser = asyncHandler(async (req, res) => {
  // As we don't have access to user so we used a middleware and created a object to get access. 
  const user = await User.findByIdAndUpdate(req.user._id,
    {
      $set: 
      {
        refreshToken: undefined
      }
    },
    {
      // By default, findOneAndUpdate() returns the document as it was before update was applied. If you set new: true, findOneAndUpdate() will instead give you the object after update was applied.
      new: true 
    }
  )
  const options = {
    httpOnly: true,
    secure:true
  }
  return res.status(200)
  .clearCookie("refreshToken",options)
  .clearCookie("accessToken",options)
  .json(
    new APIResponse(200, {},"User Logged out successfully")
  )
})


export { registerUser, loginUser, logoutUser } 