import { asyncHandler } from '../utils/asyncHandler.js';
import { APIError } from '../utils/APIError.js'
import { APIResponse } from '../utils/APIResponse.js';
import {User} from '../models/User.models.js'
import {uploadDataCloudinary} from '../utils/cloudinary.js'

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
      field?.trim() === "")){
    throw new APIError(400, "All fields are required")
  }

  // User have to find Is email is already present or not?
  const existedUser = await User.findOne({
    $or:[{username},{email}]
  })


  if(existedUser){
    throw new APIError(409,"User with email or username already exist")
  } 
  console.log(req.files)
  
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverLocalPath = req.files?.coverImage[0]?.path;
  let coverLocalPath;
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverLocalPath = req.files.coverImage[0].path
  }

  if(!avatarLocalPath){
    throw new APIError(400,"Avatar file is required")
  }
  const avatar = await uploadDataCloudinary(avatarLocalPath)
  const cover = await uploadDataCloudinary(coverLocalPath)

  if(!avatar){
    throw new APIError(400,"Avatar is required")
  }

  // Create User
  const user = await User.create({
    fullName,
    avatar:avatar.url,
    coverImage: cover?.url || "",
    email,
    password,
    username: username.toLowerCase()
  }) 
  // This code is responsible for excluding the specific field value from the response.
  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if(!createdUser){
    throw new APIError(500,"Something went wrong while registering the user")
  }

  return res.status(201).json(
    new APIResponse(200,createdUser)
  )

});


export { registerUser }