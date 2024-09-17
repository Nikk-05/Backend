import mongoose, { isValidObjectId } from "mongoose"
import { User } from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { APIError } from "../utils/APIError.js"
import { APIResponse } from "../utils/APIResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // TODO: toggle subscription
    // Means if user has subscription for this channel then unsubscribe it.
    // Otherwise, check if user didn't subscribe for this channel, subscribe.
    const subscribeId = req.user?._id
    if (!isValidObjectId(channelId)) {
        throw new APIError(400, "Invalid channel id")
    }
    const channel = await Subscription.findById(channelId)
    if (!channel) {
        throw new APIError(404, "Channel not found")
    }
    // check if user is already subscribed for this channel
    const existingSubscription = await Subscription.findOne({
        channel: channelId,
        subscriber: subscribeId
    })
    if (existingSubscription) {
        // delete subscription
        await Subscription.findByIdAndDelete(existingSubscription._id)
        return res.status(200).json(APIResponse(200, "Unsubscribed successfully"))
    }
    else {
        // create new subscription
        const newSubscription = new Subscription({
            channel: channelId,
            subscriber: subscribeId
        })
        await newSubscription.save()
        return res.status(201).json(APIResponse(201, "Subscribed successfully"))
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    const subscribersList = await Subscription.aggregate([
        {
            $match: {
                channel: channelId
            },
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribersDetails"
            },
            $group: {
                id: channelId,
                subscribers: {
                    $push: {
                        username: { $arrayElemAt: ["$subscriberDetails.username", 0] } // Extract username from the lookup result
                    }
                }
            }
        }
    ])

    if (subscribersList.length<0) {
        throw new APIError(404, "No subscribers found for this channel")
    }
    return res.status(200)
    .json(new APIResponse(200, subscribersList[0].subscribers,"Subscriber information for this channel"))
    
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if (!isValidObjectId(subscriberId)) {
        throw new APIError(400, "Invalid subscriber id")
    }
    const subscribedChannelsList = await Subscription.aggregate([
        {
            $match:{
                subscriber: subscriberId
            },
            $looup:{
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channelsDetails"
            },
            $group:{
                id: subscriberId, 
                subscribedChannels:{
                    $push:{
                        channelName: {$arrayElemAt:[$channelDetails.username,0]} // Channel name is also user name as it is channel owner
                    }
                }
            }
        }
    ])
    if(!subscribedChannelsList.length) {
        throw new APIError(404, "No channel subscribed by the subscriber")
    }
    return res.status(200)
    .json(new APIResponse(200,subscribedChannelsList[0].subscribedChannels,"Subscribed channels details"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}