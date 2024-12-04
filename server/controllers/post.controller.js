import Notification from "../models/notification.model.js";
import Post from "../models/post.model.js";
import User from "../models/user.model.js";
import fs from 'fs';  // Make sure fs module is imported for file cleanup
import { v2 as cloudinary } from "cloudinary";
import { getAudioDurationInSeconds } from "get-audio-duration"; 
import moment from "moment-timezone"; 
import nodemailer from 'nodemailer'; 
import multer from '../config/multer.js';
let currentOtp; 
let otpExpiry; 

// Configure Nodemailer for sending OTP
const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

// Function to send OTP
const sendOtp = async (email) => {
    currentOtp = Math.floor(100000 + Math.random() * 900000); 
    otpExpiry = Date.now() + 5 * 60 * 1000; 

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP Code',
        text: `Your OTP code is ${currentOtp}. It is valid for 5 minutes.`,
    };

    await transporter.sendMail(mailOptions);
};

// Request OTP endpoint
export const requestOtp = async (req, res) => {
    const { email } = req.body;

    try {
        await sendOtp(email);
        res.status(200).json({ message: 'OTP sent successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send OTP' });
    }
};

// Verify OTP endpoint
export const verifyOtp = (req, res) => {
    const { otp } = req.body;

    if (!otp) return res.status(400).json({ error: "OTP is required" });
    if (Date.now() > otpExpiry) return res.status(400).json({ error: "OTP has expired" });
    if (otp !== currentOtp) return res.status(400).json({ error: "Invalid OTP" });

    res.status(200).json({ message: "OTP verified successfully" });
};

export const createPost = async (req, res) => {
    try {
        const { text, img, audio,video} = req.body;
    
        const userId = req.user._id.toString();
        const user = await User.findById(userId);

        if (!user) return res.status(404).json({ message: "User not found" });

        // Check if the last post date is today, reset if needed
        const today = new Date();
        const lastPostDate = new Date(user.lastPostDate);
        if (lastPostDate.toDateString() === today.toDateString()) {
            user.postsToday += 1;
        } else {
            user.postsToday = 1;
            user.lastPostDate = today;
        }

        const followersCount = user.following?.length || 0;

        // Determine allowed daily posts based on followers count
        let maxPostsToday = 2; // Default if followers <= 2
        if (followersCount === 0) maxPostsToday = 1; // 1 post for 0 followers
        else if (followersCount >= 2 && followersCount <= 10) maxPostsToday = 10;
        else if (followersCount > 10) maxPostsToday = 20; // Example for 10+ followers

        // Restrict posts for users who have reached the limit
        if (user.postsToday > maxPostsToday) {
            return res.status(403).json({ error: `You've reached your limit of ${maxPostsToday} posts for today.` });
        }

        // Allowed post window for users with 0 followers
        if (followersCount === 0) {
            const allowedPostWindowStart = new Date(today);
            const allowedPostWindowEnd = new Date(today);
            allowedPostWindowStart.setHours(10, 0, 0);
            allowedPostWindowEnd.setHours(10, 30, 0);
            if (new Date() < allowedPostWindowStart || new Date() > allowedPostWindowEnd) {
                return res.status(403).json({ error: "Posting allowed only between 10:00 AM and 10:30 AM if you have no followers." });
            }
        }

        // Upload media to Cloudinary if present
        let imgUrl = null;
        let audioUrl = null;
        let videoUrl = null;
         // Upload image if present
         if (img) {
            const uploadResponse = await cloudinary.uploader.upload(img, { asset_folder: 'My', resource_type: 'image' });
            imgUrl = uploadResponse.secure_url;
        }

        // Upload audio if present
      else   if (audio) {
            const uploadResponse = await cloudinary.uploader.upload(audio, { asst_folder: "posts", resource_type: "auto" });
            audioUrl = uploadResponse.secure_url;
        }
  // Handle video upload
else if (video) {
    if (typeof video === "string") { // Ensure video is valid (URL or base64 string)
        const uploadResponse = await cloudinary.uploader.upload(video, {
            folder: 'twitter_clone/videos',
            resource_type: 'video', // Specify video resource type
            use_filename: true,
            unique_filename: false,
        });
        videoUrl = uploadResponse.secure_url;
    } } 
      
     // Create and save the post
        const newPost = new Post({
            user: userId,
            text,
            img: imgUrl,
            audio: audioUrl,
            video: videoUrl,
        });
        
        await newPost.save();
        await user.save();

        res.status(201).json(newPost);
    } catch (error) {
        console.error("Error in createPost controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
export const deletePost = async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) return res.status(404).json({ error: "Post not found" });

        // Ensure that the user is authorized to delete the post
        if (post.user.toString() !== req.user._id.toString()) {
            return res.status(401).json({ error: "You are not authorized to delete this post" });
        }

        // Retrieve the user to update their postsToday count
        const user = await User.findById(req.user._id);
        if (user.postsToday > 0) {
            user.postsToday--; // Decrement the postsToday count
        }

        // Delete media from Cloudinary if it exists
        const deleteCloudinaryMedia = async (mediaUrl, resourceType = 'image') => {
            if (mediaUrl) {
                const mediaId = mediaUrl.split("/").pop().split(".")[0];
                await cloudinary.uploader.destroy(mediaId, { resource_type: resourceType });
            }
        };

        await deleteCloudinaryMedia(post.img);
        await deleteCloudinaryMedia(post.audio, 'video');
        await deleteCloudinaryMedia(post.video, 'video');

        // Use deleteOne or findByIdAndDelete to remove the post
        await post.deleteOne(); // or use Post.findByIdAndDelete(req.params.id)
        await user.save(); // Save the user to reflect the updated postsToday count

        res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
        console.error("Error in deletePost controller:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Comment on Post Function
export const commentOnPost = async (req, res) => {
    try {
        const { text } = req.body;
        const postId = req.params.id;
        const userId = req.user._id;

        if (!text) {
            return res.status(400).json({ error: "Text field is required" });
        }
        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        const comment = { user: userId, text };

        post.comments.push(comment);
        await post.save();

        res.status(200).json(post);
    } catch (error) {
        console.log("Error in commentOnPost controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
// Delete Comment on Post Function
export const deleteComment = async (req, res) => {
    try {
        const { commentId } = req.params;  // Comment ID to be deleted
        const postId = req.params.id;      // Post ID from the route params
        const userId = req.user._id;      // User ID from the authenticated user

        console.log(commentId, postId, userId);  // Fixed typo: console.log

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        const comment = post.comments.id(commentId);
        if (!comment) {
            return res.status(404).json({ error: "Comment not found" });
        }

        // Only the user who made the comment or the post owner can delete it
        if (comment.user.toString() !== userId.toString() && post.user.toString() !== userId.toString()) {
            return res.status(401).json({ error: "You are not authorized to delete this comment" });
        }

        // Remove the comment from the post
        post.comments.pull(commentId);
        await post.save();

        res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error) {
        console.log("Error in deleteComment controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Like/Unlike Post Function
export const likeUnlikePost = async (req, res) => {
    try {
        const userId = req.user._id;
        const { id: postId } = req.params;

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }

        const userLikedPost = post.likes.includes(userId);

        if (userLikedPost) {
            // Unlike post
            await Post.updateOne({ _id: postId }, { $pull: { likes: userId } });
            await User.updateOne({ _id: userId }, { $pull: { likedPosts: postId } });

            const updatedLikes = post.likes.filter((id) => id.toString() !== userId.toString());
            res.status(200).json(updatedLikes);
        } else {
            // Like post
            post.likes.push(userId);
            await User.updateOne({ _id: userId }, { $push: { likedPosts: postId } });
            await post.save();

            const notification = new Notification({
                from: userId,
                to: post.user,
                type: "like",
            });
            await notification.save();

            const updatedLikes = post.likes;
            res.status(200).json(updatedLikes);
        }
    } catch (error) {
        console.log("Error in likeUnlikePost controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get All Posts Function
export const getAllPosts = async (req, res) => {
    try {
        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .populate({
                path: "user",
                select: "-password",
            })
            .populate({
                path: "comments.user",
                select: "-password",
            });

        if (posts.length === 0) {
            return res.status(200).json([]);
        }

        res.status(200).json(posts);
    } catch (error) {
        console.log("Error in getAllPosts controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get Liked Posts Function
export const getLikedPosts = async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const likedPosts = await Post.find({ _id: { $in: user.likedPosts } })
            .populate({
                path: "user",
                select: "-password",
            })
            .populate({
                path: "comments.user",
                select: "-password",
            });

        res.status(200).json(likedPosts);
    } catch (error) {
        console.log("Error in getLikedPosts controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get Following Posts Function
export const getFollowingPosts = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: "User not found" });

        const following = user.following;

        const feedPosts = await Post.find({ user: { $in: following } })
            .sort({ createdAt: -1 })
            .populate({
                path: "user",
                select: "-password",
            })
            .populate({
                path: "comments.user",
                select: "-password",
            });

        res.status(200).json(feedPosts);
    } catch (error) {
        console.log("Error in getFollowingPosts controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get User Posts Function
export const getUserPosts = async (req, res) => {
    try {
        const { username } = req.params;

        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ error: "User not found" });

        const posts = await Post.find({ user: user._id })
            .sort({ createdAt: -1 })
            .populate({
                path: "user",
                select: "-password",
            })
            .populate({
                path: "comments.user",
                select: "-password",
            });

        res.status(200).json(posts);
    } catch (error) {
        console.log("Error in getUserPosts controller: ", error);
        res.status(500).json({ error: "Internal server error" });
    }
};
