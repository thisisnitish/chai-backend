import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;

  if (!content) {
    throw new ApiError("Content is required!");
  }

  const tweet = await Tweet.Create({
    content,
    owner: req.user._id,
  });

  res.status(200).json(new ApiResponse(200, tweet, "Tweet published!"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  // Brute Force
  // const user = User.find({ owner: userId })

  const tweet = Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $group: {
        _id: "$owner",
        tweets: {
          $push: "$content",
        },
      },
    },
    {
      $project: {
        _id: 0,
        tweets: 1,
      },
    },
  ]);

  return res.status(200).json(new ApiResponse(200, tweet, "User Tweets!"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetContent } = req.body;
  const { tweetId } = req.params;

  if (!tweetId) {
    throw new ApiError(400, "unauthorised access!");
  }

  if (!tweetContent) {
    throw new ApiError(400, "No tweet so no update!");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(400, "No tweet exists!");
  }

  if (tweet.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "Unauthorised access!");
  }

  const updatedTweet = await Tweet.findByIdAndUpdate(
    tweetId,
    {
      $set: {
        content: tweetContent,
      },
    },
    { new: true }
  );

  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "Tweet updated successfully!"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!tweetId) {
    throw new ApiError(400, "unauthorised access!");
  }

  const tweet = await Tweet.findById(tweetId);

  if (!tweet) {
    throw new ApiError(400, "No tweet exists!");
  }

  if (tweet.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(400, "Unauthorised access!");
  }

  await Tweet.findByIdAndDelete(tweetId);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Tweet deleted successfully!"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
