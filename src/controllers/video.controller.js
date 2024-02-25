import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { Playlist } from "../models/playlist.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js";

// TODO: this function needs to be completed
const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination

  page = parseInt(page, 10);
  limit = parseInt(limit, 10);

  const allVideos = await Video.aggregate([
    {
      $match: {
        isPublished: true,
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "allVideos",
        pipeline: [
          {
            $project: {
              username: 1,
              avatar: 1,
              fullName: 1,
            },
          },
        ],
      },
    },
    {},
  ]);
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);

  if (
    !video ||
    !video?.isPublished ||
    video?.owner.toString() !== req.user?._id.toString()
  ) {
    throw new ApiError(401, "Video doesn't exists!");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully!"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  const thumbnailLocalPath = req.file?.path;

  //TODO: update video details like title, description, thumbnail

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(401, "No video found!");
  }

  if (title) {
    video.title = video;
  }

  if (description) {
    video.description = description;
  }

  // upload thumbnail on cloudinary
  let thumbnail = "";
  if (thumbnailLocalPath) {
    thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
    if (!thumbnail.url) {
      throw new ApiError(401, "Error while uploading thumbnail!");
    }

    // TODO: delete the old thumbnail from cloudinary
    video.thumbnail = thumbnail;
  }

  await video.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video details updated!"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(401, "Video doesn't exists!");
  }

  if (video.owner.toString() !== req.user?._id.toString()) {
    throw new ApiError(401, "You are not authorized to delete the video!");
  }

  const deleteVideo = await Video.findByIdAndDelete(videoId);

  // remove the video id from user's watch history
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $pull: {
        watchHistory: videoId,
      },
    },
    { new: true }
  );

  // Loose handling of this edge case
  await Like.deleteMany({ video: videoId });
  await Comment.deleteMany({ video: videoId });

  // remove the video id playlist
  const playlist = await Playlist.find({ videos: videoId });

  // handle response better here
  if (!playlist || playlist?.length == 0) {
    throw new ApiError("No Playlist exists for this video");
  }

  // TODO: Delete from the playlist also - may be need to write a aggregation pipeline
  // TODO: or something else, but not db call in loop

  // TODO: Remove from the cloudinary

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Video deleted successfully!"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(401, "Video doesn't exists!");
  }

  video.isPublished = !video.isPublished;
  await video.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Published status changed successully!"));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
