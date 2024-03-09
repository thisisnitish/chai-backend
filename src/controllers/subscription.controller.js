import mongoose, { isValidObjectId, mongo } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription

  if (!channelId) {
    throw new ApiError(400, "Invalid channel Id");
  }

  const subscribed = Subscription.findOne({
    subscriber: req.user?._id,
    channel: channelId,
  });

  try {
    if (!subscribed) {
      const newSubscription = await Subscription.create({
        subscriber: req.user?._id,
        channel: channelId,
      });

      if (!newSubscription) {
        throw new ApiError(400, "Unable to subscribe the channel!");
      }

      res
        .status(200)
        .json(
          new ApiResponse(
            200,
            newSubscription,
            "Channel subscribed successfully!"
          )
        );
    } else {
      const deleteSubscription = await Subscription.deleteOne({
        subscriber: req.user?._id,
        channel: channelId,
      });

      if (!deleteSubscription) {
        throw new ApiError(400, "Cannote delete channel");
      }

      res
        .status(200)
        .json(new ApiResponse(200, {}, "Channel deleted successfully!"));
    }
  } catch (error) {
    throw new ApiError(400, "Something went wrong!");
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!subscriberId) {
    throw new ApiError(400, "Invalid subscriberId");
  }

  const subsriberList = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Schema.Types.ObjectId(subscriberId),
      },
    },
    {
      $group: {
        _id: "channel",
        subscribers: {
          $push: "$subscriber",
        },
      },
    },
    {
      $project: {
        _id: 0,
        subscribers: 1,
      },
    },
  ]);

  if (!subsriberList || subsriberList.length === 0) {
    return res
      .status(200)
      .json(new ApiResponse(200, [], "No subscriber found for this channel!"));
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, subsriberList, "Subscriber list for a channel!")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!channelId) {
    throw new ApiError(400, "Invalid channel Id");
  }

  const channelList = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Schema.Types.ObjectId(channelId),
      },
    },
    {
      $group: {
        _id: "subscriber",
        channels: {
          $push: "$channel",
        },
      },
    },
    {
      $project: {
        _id: 0,
        channels: 1,
      },
    },
  ]);

  if (!channelList || channelList.length === 0) {
    return res.status(200).json(200, [], "No channel for the user!");
  }

  return res
    .status(200)
    .json(200, channelList, "Channel fetched successfully!");
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
