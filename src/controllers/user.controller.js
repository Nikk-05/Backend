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
  if (!(username || email)) {
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
  console.log(user.id)
  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)
  // console.log(accessToken, refreshToken)

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
      $unset:
      {
        refreshToken: 1 // This will remove the vakue from database
      }
    },
    {
      // By default, findOneAndUpdate() returns the document as it was before update was applied. If you set new: true, findOneAndUpdate() will instead give you the object after update was applied.
      new: true
    }
  )
  const options = {
    httpOnly: true,
    secure: true
  }
  return res.status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(
      new APIResponse(200, {}, "User Logged out successfully")
    )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
  const oldRefreshToken = req.cookies.refreshToken || req.body.refreshToken
  if(!oldRefreshToken){
    throw new APIError(401, "Refresh token is missing")
  }
  try{
    // Verify that the refresh token is not being temped in between so that JWT checks its signature with secret key
    const decodedToken = jwt.verify(
      oldRefreshToken,
      process.env.REFRESH_TOKEN_SECRET,
      {
        expiresIn: "15m"
      }
    )
    console.log(decodedToken)

    const user = await User.findById(decodedToken?._id)
    if (!user) {
      throw new APIError(401, "Invalid refresh token")
    }
    if(oldRefreshToken !== user?.refreshToken){
      throw new APIError(401,"Refresh token is expired")
    }
    const options = {
      secure : true,
      httpOnly: true
    }
    const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    return res.status(200)
    .cookies(newRefreshToken,options)
    .cookies(accessToken,options)
    .json(new APIResponse(200, {accessToken: accessToken, refreshToken: newRefreshToken},"Access Token refreshed"))
  }
  catch(error){
    throw new APIError(500, "Failed to refresh token")
  }

})

const changeCurrentPassword = asyncHandler(async (req, res) => {
  // To verify user is logged in or not using verifyJWT middleware
  const { oldPassword, newPassword } = req.body
  const user = await User.findById(req.user?._id)
  const isPasswordValid = await user.isPasswordCorrect(oldPassword)
  if (!isPasswordValid) {
    throw new APIError(401, "Invalid old password")
  }
  user.password = newPassword // new password is being set only
  await user.save({ validateBeforeSave: false }) // it will be saved after decryption into the database
  return res.status(200)
    .json(new APIResponse(200, {}, "Password changed successfully"))
})

const getCurrentUser = asyncHandler(async (req, res) => {
  // To verify user is logged in or not using verifyJWT middleware
  return res.status(200)
    .json(new APIResponse(200, req.user, "Current usser data"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
  // To verify user is logged in or not using verifyJWT middleware
  const { fullName, email } = req.body

  if (!fullName || !email) {
    throw new APIError(400, "Full Name and Email are required")
  }
  const user = await User.findByIdAndUpdate(req.user._id,
    {
      $set: {
        fullName: fullName,
        email: email
      }
    },
    { new: true } // get updated user
  ).select("-password -refreshToken")

  return res.status(200)
    .json(new APIResponse(200, user, "Account details updated successfully"))

})

const updateAvatarFile = asyncHandler(async (req, res) => {
  // get file from user using multer middleware
  const avatarLocalPath = req.file?.path
  if (!avatarLocalPath) {
    throw new APIError(400, "Avatar file is required")
  }
  const avatar = await uploadDataCloudinary(avatarLocalPath)
  if (!avatar.url) {
    throw new APIError(400, "Error while uploading avatar")
  }
  const user = await User.findByIdAndUpdate(req.user._id,
    {
      $set: {
        avatar: avatar.url
      }
    },
    { new: true }
  ).select("-password -refreshToken")
  return res.status(200)
    .json(new APIResponse(200, user, "Avatar updated successfully"))
})

const updateCoverFile = asyncHandler(async (req, res) => {
  // get file from user using multer middleware
  const coverLocalPath = req.file?.path
  if (!coverLocalPath) {
    throw new APIError(400, "Cover file is required")
  }
  const coverImage = await uploadDataCloudinary(coverLocalPath)
  if (!coverImage.url) {
    throw new APIError(400, "Error while uploading Cover Image")
  }
  const user = await User.findByIdAndUpdate(req.user._id,
    {
      $set: {
        coverImage: coverImage.url
      }
    },
    { new: true }
  ).select("-password -refreshToken")
  return res.status(200)
    .json(new APIResponse(200, user, "Cover Image updated successfully"))
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const { username } = req.params
  if (!username?.trim()) {
    throw new APIError(400, "Username is missing")
  }
  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      },
      // How many subscriber user have
      $lookup: {
        from: "subscriptions", //model converts every thing in lowercase and in pural.
        localfield: "_id",
        foreignField: "channel",
        as: "subscribers"
      },
      // how many channel user have subscribed
      $lookup: {
        from: "subscriptions",
        localfield: "_id",
        foreignField: "subscriber",
        as: "subscribedTo"
      },
      // add to fields
      $addFields: {
        subscribersCount: {
          $size: "$subscribers"
        },
        subscribedToCount: {
          $size: "$subscribedTo"
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] },
            then: true,
            else: false
          }
        }
      }
    },
    {
      // Customize which field can be sent to UI
      $project: {
        username: 1,
        avatar: 1,
        coverImage: 1,
        fullName: 1,
        subscribersCount: 1,
        subscribedToCount: 1,
        isSubscribed: 1
      }
    }
  ])
  if (!channel?.length) {
    throw new APIError(404, "Channel does not exist")
  }
  return res.status(200)
    .json(new APIResponse(200, channel[0], "User channel fetched successfully")) // as we have only one user that's why we are sending channel[0] as object.
})

const getUserWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user?._id)
      },
      $lookup: {
        from: "vides",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1
                  }
                }
              ]
            }
          },
          {
            $addFields: {
              owner: {
                $first: "$owner"
              }
            }
          }
        ]
      }
    }
  ])
  if (!user?.length) {
    throw new APIError(404, "User does not exist")
  }
  return res.status(200)
    .json(new APIResponse(200, user[0].watchHistory, "Watch History feteched successfully"))
})


export { 
  registerUser, 
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateAvatarFile,
  updateCoverFile,
  getUserChannelProfile,
  getUserWatchHistory 
}