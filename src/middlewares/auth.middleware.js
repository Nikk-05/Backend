import { APIError } from "../utils/APIError.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { User } from "../models/User.models.js"
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        if (!token) {
            throw new APIError(401, "Unauthorized request")
        }
        // Verify token using jwt
        const decodedInfo = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedInfo?._id)
            .select("-password -refreshToken")

        if (!user) {
            throw new APIError(401, "Invalid access Token")
        }
        req.user = user
        next()
    } catch (error) {
        throw new APIError(401, error?.message || "Invalid access Token")
    }
})