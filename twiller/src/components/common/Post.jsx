import { FaRegComment } from "react-icons/fa";
import { BiRepost } from "react-icons/bi";
import { FaRegHeart, FaRegBookmark, FaTrash } from "react-icons/fa";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import LoadingSpinner from "./LoadingSpinner";
import { formatPostDate } from "../../utils/date";

const Post = ({ post }) => {
    const [comment, setComment] = useState("");
    const { data: authUser } = useQuery({ queryKey: ["authUser"] });
    const queryClient = useQueryClient();
    const postOwner = post.user;
    const isLiked = post.likes.includes(authUser._id);
    const { t } = useTranslation();
    const isMyPost = authUser._id === post.user._id;

    const formattedDate = formatPostDate(post.createdAt);

    const { mutate: deletePost, isPending: isDeleting } = useMutation({
        mutationFn: async () => {
            try {
                const res = await fetch(`/api/posts/${post._id}`, {
                    method: "DELETE",
                });
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || "Something went wrong");
                }
                return data;
            } catch (error) {
                throw new Error(error);
            }
        },
        onSuccess: () => {
            toast.success("Post deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["posts"] });
        },
    });

    const { mutate: likePost, isPending: isLiking } = useMutation({
        mutationFn: async () => {
            try {
                const res = await fetch(`/api/posts/like/${post._id}`, {
                    method: "POST",
                });
                const data = await res.json();
                if (!res.ok) {
                    throw new Error(data.error || "Something went wrong");
                }
                return data;
            } catch (error) {
                throw new Error(error);
            }
        },
        onSuccess: (updatedLikes) => {
            queryClient.setQueryData(["posts"], (oldData) => {
                return oldData.map((p) => {
                    if (p._id === post._id) {
                        return { ...p, likes: updatedLikes };
                    }
                    return p;
                });
            });
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });

    const { mutate: commentPost, isPending: isCommenting } = useMutation({
        mutationFn: async () => {
            try {
                const res = await fetch(`/api/posts/comment/${post._id}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ text: comment }),
                });
                    // Log the response for debugging purposes
                    console.log("Comment Response: ", res);
    
                const data = await res.json();
                console.log(data);
                if (!res.ok) {
                    throw new Error(data.error || "Something went wrong");
                }
                return data;
            } catch (error) {
                throw new Error(error);
            }
      
        },
   
        onSuccess: () => {
            toast.success("Comment posted successfully");
            setComment("");
            queryClient.invalidateQueries({ queryKey: ["posts"] });
        },
        onError: (error) => {
            toast.error(error.message);
        },
    });
    const { mutate: deleteComment } = useMutation({
        mutationFn: async (commentId) => {
            console.log(post._id,commentId);
            const url = `http://localhost:5000/api/posts/${post._id}/comments/${commentId}`;
            try {
                const res = await fetch(url, {
                    method: "DELETE",
                });
    
                // Debug: Log the response status and body
                console.log("Delete Comment Response: ", res);
    
                if (!res.ok) {
                    const errorData = await res.json();
                    throw new Error(errorData.error || "Failed to delete comment");
                }
    
                return await res.json(); // Return JSON response
            } catch (error) {
                console.error("Error deleting comment: ", error);
                throw error; // Rethrow the error for onError to handle
            }
        },
        onSuccess: () => {
            toast.success("Comment deleted successfully");
            queryClient.invalidateQueries({ queryKey: ["posts"] });
        },
        onError: (error) => {
            toast.error(error.message || "Failed to delete comment");
        },
    });
    
    const handleDeletePost = () => {
        deletePost();
    };

    const handleDeleteComment = (commentId) => {
        deleteComment(commentId);
    };
    

    const handlePostComment = (e) => {
        e.preventDefault();
        if (isCommenting) return;
        commentPost();
    };

    const handleLikePost = () => {
        if (isLiking) return;
        likePost();
    };

    // Render images, videos, and audio
    const renderMedia = (media) => {
        if (media) {
            if (media.endsWith(".mp4")) {
                return (
                    <video controls className="h-80 object-contain rounded-lg border border-gray-700">
                        <source src={media} type="video/mp4" />
                        Your browser does not support the video tag.
                    </video>
                );
            } else if (media.endsWith(".mp3") || media.endsWith(".wav")) {
                return (
                    <audio controls className="w-full rounded-lg border border-gray-700">
                        <source src={media} type="audio/mp3" />
                        Your browser does not support the audio tag.
                    </audio>
                );
            } else {
                return (
                    <img
                        src={media}
                        className="h-80 object-contain rounded-lg border border-gray-700"
                        alt="Post media"
                    />
                );
            }
        }
    };

    return (
        <>
            <div className="flex gap-2 items-start p-4 border-b border-gray-700">
                <div className="avatar">
                    <Link to={`/profile/${postOwner.username}`} className="w-8 rounded-full overflow-hidden">
                        <img src={postOwner.profileImg || "/avatar-placeholder.png"} />
                    </Link>
                </div>
                <div className="flex flex-col flex-1">
                    <div className="flex gap-2 items-center">
                        <Link to={`/profile/${postOwner.username}`} className="font-bold">
                            {postOwner.fullName}
                        </Link>
                        <span className="text-gray-700 flex gap-1 text-sm">
                            <Link to={`/profile/${postOwner.username}`}>@{postOwner.username}</Link>
                            <span>·</span>
                            <span>{formattedDate}</span>
                        </span>
                        {isMyPost && (
                            <span className="flex justify-end flex-1">
                                {!isDeleting && (
                                    <FaTrash className="cursor-pointer hover:text-red-500" onClick={handleDeletePost} />
                                )}
                                {isDeleting && <LoadingSpinner size="sm" />}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col gap-3 overflow-hidden">
                        <span>{post.text}</span>
                        {renderMedia(post.img || post.video || post.audio)} {/* Render images, videos, or audio */}
                    </div>
                    <div className="flex justify-between mt-3">
                        <div className="flex gap-4 items-center w-2/3 justify-between">
                            <div
                                className="flex gap-1 items-center cursor-pointer group"
                                onClick={() => document.getElementById("comments_modal" + post._id).showModal()}
                            >
                                <FaRegComment className="w-4 h-4 text-slate-500 group-hover:text-sky-400" />
                                <span className="text-sm text-slate-500 group-hover:text-sky-400">
                                    {post.comments.length}
                                </span>
                            </div>
                            <dialog id={`comments_modal${post._id}`} className="modal border-none outline-none">
                                <div className="modal-box rounded border border-gray-600">
                                    <h3 className="font-bold text-lg mb-4">COMMENTS</h3>
                                    <div className="flex flex-col gap-3 max-h-60 overflow-auto">
                                        {post.comments.length === 0 && (
                                            <p>{t("No comments yet 🤔 Be the first one 😉")}</p>
                                        )}
                                        {post.comments.map((comment) => (
                                            <div key={comment._id} className="flex gap-2 items-start">
                                                <div className="avatar">
                                                    <div className="w-8 rounded-full">
                                                        <img
                                                            src={comment.user.profileImg || "/avatar-placeholder.png"}
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-1">
                                                        <span className="font-bold">{comment.user.fullName}</span>
                                                        <span className="text-gray-700 text-sm">@{comment.user.username}</span>
                                                    </div>
                                                    <div className="text-sm">{comment.text}</div>
                                                    {comment.user._id === authUser._id && (
                                                        <button
                                                            className="text-sm text-red-500 mt-1"
                                                            onClick={() => handleDeleteComment(comment._id)}
                                                        >
                                                            <FaTrash className="w-4 h-4 text-red-500" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <form
                                        className="flex flex-col gap-2 items-center mt-4 border-t border-gray-600 pt-2"
                                        onSubmit={handlePostComment}
                                    >
                                        <textarea
                                            className="textarea w-full p-1 rounded text-md resize-none border focus:outline-none border-gray-800"
                                            placeholder="Add a comment..."
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                        />
                                        <button className="btn btn-primary rounded-full btn-sm text-white px-4">
                                            {isCommenting ? <LoadingSpinner size="md" /> : "Post"}
                                        </button>
                                    </form>
                                    <button
                                        className="modal-close cursor-pointer absolute top-2 right-2 text-gray-400"
                                        onClick={() => document.getElementById("comments_modal" + post._id).close()}
                                    >
                                        ✕
                                    </button>
                                </div>
                            </dialog>
                            <div className="flex gap-1 items-center group cursor-pointer">
                                <BiRepost className="w-6 h-6 text-slate-500 group-hover:text-green-500" />
                                <span className="text-sm text-slate-500 group-hover:text-green-500">0</span>
                            </div>
                            <div className="flex gap-1 items-center group cursor-pointer" onClick={handleLikePost}>
                                {isLiking && <LoadingSpinner size="sm" />}
                                {!isLiked && !isLiking && (
                                    <FaRegHeart className="w-4 h-4 cursor-pointer text-slate-500 group-hover:text-pink-500" />
                                )}
                                {isLiked && !isLiking && (
                                    <FaRegHeart className="w-4 h-4 cursor-pointer text-pink-500" />
                                )}
                                <span
                                    className={`text-sm group-hover:text-pink-500 ${isLiked ? "text-pink-500" : "text-slate-500"}`}
                                >
                                    {post.likes.length}
                                </span>
                            </div>
                        </div>
                        <div className="flex w-1/3 justify-end gap-2 items-center">
                            <FaRegBookmark className="w-4 h-4 text-slate-500 cursor-pointer" />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Post;
