import { CiImageOn } from "react-icons/ci";
import { BsEmojiSmileFill } from "react-icons/bs";
import { FaMicrophone } from "react-icons/fa";
import { useRef, useState } from "react";
import { IoCloseSharp } from "react-icons/io5";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import './Tweetbox.css';

const Tweetbox = () => {
    const [text, setText] = useState("");
    const [media, setMedia] = useState({ img: null, audio: null });
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const [showEmailVerification, setShowEmailVerification] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const imgRef = useRef(null);
    const audioRef = useRef(null);
    const queryClient = useQueryClient();

    // Fetch auth user data
    const { data: authUser, isLoading: isAuthUserLoading, isError: isAuthUserError } = useQuery({
        queryKey: ["authUser"],
    });

    // Fetch suggested users for "Who to Follow"
    const { data: suggestedUsers, isLoading: isSuggestionsLoading } = useQuery({
        queryKey: ["suggestedUsers"],
        queryFn: async () => {
            const res = await fetch("/api/users/suggestions");
            if (!res.ok) throw new Error("Failed to fetch suggestions");
            return res.json();
        },
    });

    // Mutation to follow a user
    const { mutate: followUser } = useMutation({
        mutationFn: async (userId) => {
            const res = await fetch(`/api/users/${userId}/follow`, {
                method: "POST",
            });
            if (!res.ok) throw new Error("Failed to follow user");
            return res.json();
        },
        onSuccess: () => {
            toast.success("Followed successfully!");
            queryClient.invalidateQueries({ queryKey: ["suggestedUsers"] }); // Refetch suggestions
        },
    });

    // Mutation hook for creating a post
    const { mutate: createPost, isPending, isError, error } = useMutation({
        mutationFn: async ({ text, img, audio }) => {
            const res = await fetch("/api/posts/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, img, audio }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Something went wrong");
            return data;
        },
        onMutate: () => setIsSubmitting(true),
        onSuccess: () => {
            // Reset states after successful post
            setText("");
            setMedia({ img: null, audio: null });
            setEmail("");
            setOtp("");
            setIsOtpSent(false);
            setIsOtpVerified(false);
            setShowEmailVerification(false);
            setIsSubmitting(false);
            toast.success("Post created successfully");
            queryClient.invalidateQueries({ queryKey: ["posts"] });
        },
        onError: () => setIsSubmitting(false),
    });

    // Form submission handler
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!text.trim()) {
            toast.error("Post content cannot be empty.");
            return;
        }
        if (isOtpVerified) {
            createPost({ text, img: media.img, audio: media.audio });
        } else {
            toast.error("Please verify your email first.");
        }
    };

    // Image upload handler
    const handleImgChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => setMedia((prev) => ({ ...prev, img: reader.result }));
            reader.readAsDataURL(file);
        }
    };

    // Audio upload handler
    const handleAudioChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => setMedia((prev) => ({ ...prev, audio: reader.result }));
            reader.readAsDataURL(file);
        }
    };

    // Email verification handlers
    const handleEmailVerification = async () => {
        if (email !== authUser.email) {
            toast.error("Email does not match your account.");
            return;
        }
        try {
            const response = await fetch("/api/email/send-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email }),
            });
            const data = await response.json();
            if (response.ok) {
                setIsOtpSent(true);
                toast.success("OTP sent to your email.");
            } else {
                toast.error(data.error || "Failed to send OTP.");
            }
        } catch {
            toast.error("Failed to send OTP.");
        }
    };

    const handleVerifyOtp = async () => {
        try {
            const response = await fetch("/api/email/verify-otp", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp }),
            });
            if (!response.ok) throw new Error("Error verifying OTP");
            const data = await response.json();
            toast.success(data.message);
            setIsOtpVerified(true);
            setShowEmailVerification(false);
        } catch (error) {
            toast.error(error.message || "Error verifying OTP.");
        }
    };

    return (
        <div className='flex flex-col p-4 gap-4'>
            {/* Loading and Error Handling for authUser */}
            {isAuthUserLoading && <div>Loading user information...</div>}
            {isAuthUserError && <div>Error loading user information.</div>}
            {authUser && (
                <div className='flex items-start gap-4 border-b border-gray-700'>
                    <div className='avatar'>
                        <div className='w-8 rounded-full'>
                            <img src={authUser?.profileImg || "/avatar-placeholder.png"} alt="Profile" />
                        </div>
                    </div>
                    <form className='flex flex-col gap-2 w-full' onSubmit={handleSubmit}>
                        <textarea
                            className='textarea w-full p-0 text-lg resize-none border-none focus:outline-none border-gray-800'
                            placeholder='What is happening?!'
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                        />
                        {media.img && (
                            <div className='relative w-72 mx-auto'>
                                <IoCloseSharp
                                    className='absolute top-0 right-0 text-white bg-gray-800 rounded-full w-5 h-5 cursor-pointer'
                                    onClick={() => {
                                        setMedia((prev) => ({ ...prev, img: null }));
                                        imgRef.current.value = null;
                                    }}
                                />
                                <img src={media.img} className='w-full mx-auto h-72 object-contain rounded' alt="Post content" />
                            </div>
                        )}
                        {media.audio && (
                            <div className='relative w-72 mx-auto'>
                                <IoCloseSharp
                                    className='absolute top-0 right-0 text-white bg-gray-800 rounded-full w-5 h-5 cursor-pointer'
                                    onClick={() => {
                                        setMedia((prev) => ({ ...prev, audio: null }));
                                        audioRef.current.value = null;
                                    }}
                                />
                                <audio controls className='w-full mx-auto'>
                                    <source src={media.audio} type='audio/mpeg' />
                                    Your browser does not support the audio tag.
                                </audio>
                            </div>
                        )}
                        {showEmailVerification && !isOtpVerified && (
                            <div className='flex flex-col gap-2'>
                                <input
                                    type='email'
                                    placeholder='Enter your app email'
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className='border border-gray-400 rounded p-1'
                                />
                                <button type='button' onClick={handleEmailVerification} className='btn btn-primary'>
                                    Send OTP
                                </button>
                                {isOtpSent && (
                                    <div className='flex gap-2'>
                                        <input
                                            type='text'
                                            placeholder='Enter OTP'
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            className='border border-gray-400 rounded p-1'
                                        />
                                        <button type='button' onClick={handleVerifyOtp} className='btn btn-primary'>
                                            Verify
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className='flex justify-between border-t py-2 border-t-gray-700'>
                            <div className='flex gap-1 items-center'>
                                <CiImageOn
                                    className='fill-primary w-6 h-6 cursor-pointer'
                                    onClick={() => imgRef.current.click()}
                                />
                                <FaMicrophone
                                    className='fill-primary w-6 h-6 cursor-pointer'
                                    onClick={() => audioRef.current.click()}
                                />
                                <BsEmojiSmileFill className='fill-primary w-6 h-6 cursor-pointer' />
                                <input
                                    type='file'
                                    hidden
                                    ref={imgRef}
                                    accept='image/*'
                                    onChange={handleImgChange}
                                />
                                <input
                                    type='file'
                                    hidden
                                    ref={audioRef}
                                    accept='audio/*'
                                    onChange={handleAudioChange}
                                />
                            </div>
                            <button
                                type='submit'
                                className={`btn btn-primary ${isPending || isSubmitting ? "loading" : ""}`}
                                disabled={isPending || isSubmitting}
                            >
                                {isPending || isSubmitting ? "Submitting..." : "Tweet"}
                            </button>
                        </div>
                    </form>
                </div>
            )}
            {/* Loading suggested users */}
            {isSuggestionsLoading && <div>Loading suggestions...</div>}
            {suggestedUsers && (
                <div className='border-t border-gray-700 mt-4 pt-4'>
                    <h3 className='text-lg font-bold'>Who to follow</h3>
                    <ul>
                        {suggestedUsers.map((user) => (
                            <li key={user.id} className='flex items-center justify-between py-2'>
                                <span>{user.name}</span>
                                <button onClick={() => followUser(user.id)} className='btn btn-secondary'>
                                    Follow
                                </button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};

export default Tweetbox;
