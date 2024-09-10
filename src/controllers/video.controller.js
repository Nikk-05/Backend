import { Video } from "../models/Video.models.js";
import { uploadDataCloudinary } from "../utils/cloudinary.js";
import mongoose, { isValidObjectId } from "mongoose"
import { APIError } from "../utils/APIError.js"
import { APIResponse } from "../utils/APIResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sort, username } = req.query
    //TODO: get all videos based on query, sort, pagination
    // Steps to get all videos
    // 1. find videos based on query, sort, pagination
    // 2. return videos to client
    console.log(req.query)
    const videos = await Video.find({
        $text:{
            $search:query,
            $sort:sort
        }
    })
    return res.status(200).send("OK")
})

const publishAVideo = asyncHandler(async (req, res) => {
    // TODO: get video, upload to cloudinary, create video
    // Steps to upload video   
    // 1. take video file and upload it to cloudniary
    // 2. check if video is uploaded successfully in cloudniary
    // 3. save video details in database
    // 4. return video details to client
    try {
        const { title, description } = req.body
        if (!title || !description) {
            throw new APIError(400, "Title and description are required")
        }
        // Upload video and thumbnail to cloudinary
        const videoLocalPath = req.files.videoFile[0]?.path
        const thumbnailLocalPath = req.files.thumbnail[0]?.path
        if (!videoLocalPath || !thumbnailLocalPath) {
            throw new APIError(400, "Video and thumbnail files are required")
        }
        const videoCloudinaryPath = await uploadDataCloudinary(videoLocalPath)
        const thumbnailCloudinaryPath = await uploadDataCloudinary(thumbnailLocalPath)
        if (!videoCloudinaryPath || !thumbnailCloudinaryPath) {
            throw new APIError(500, "Failed to upload video to cloudinary")
        }
        const createVideoDoc = await Video.create({
            title: title,
            description: description,
            videoFile: videoCloudinaryPath.secure_url,
            thumbnail: thumbnailCloudinaryPath.secure_url,
            owner: req.user?._id,
            duration: videoCloudinaryPath.duration
        })
        // console.log(createVideoDoc)
        const videoDocument = await Video.findById(createVideoDoc._id)
        if (!videoDocument) {
            throw new APIError(500, "Failed to save video document to database")
        }
        return res.status(200)
            .json(new APIResponse(200, videoDocument, "Video uploaded successfully"))
    }
    catch (error) {
        throw new APIError(404, error.message)
    }

})

const getVideoById = asyncHandler(async (req, res) => {
    const { id } = req.params
    //TODO: get video by id
    const videoData = await Video.findById(id)
    if(!videoData){
        throw new APIError(404, "Video not found")
    }
    return res.status(200)
    .json(new APIResponse(200, videoData, "Video fetched successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { id } = req.params
    //TODO: update video details like title, description, thumbnail


})

const deleteVideo = asyncHandler(async (req, res) => {
    const { id } = req.params
    //TODO: delete video
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

const uploadVideo = asyncHandler(async (req, res) => {

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}