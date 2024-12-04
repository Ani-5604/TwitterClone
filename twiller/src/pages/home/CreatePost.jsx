import { CiImageOn } from "react-icons/ci";
import { BsEmojiSmileFill } from "react-icons/bs";
import { FaMicrophone, FaVideo } from "react-icons/fa";
import { useRef, useState } from "react";
import { useTranslation } from 'react-i18next';
import { IoCloseSharp } from "react-icons/io5";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";
import { Outlet } from "react-router-dom";
import i18n from "../../i18n";
import axios from 'axios';
import EmojiPicker from "emoji-picker-react";
import './Post.css';
import { FaFileUpload } from "react-icons/fa"; // Importing upload icon
const CreatePost = () => {
  // State hooks
  const [text, setText] = useState("");
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null); // To hold recorded audio URL
  const [isRecording, setIsRecording] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [audio, setAudio] = useState(null);
  const imgRef = useRef(null);
  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const { data: authUser } = useQuery({ queryKey: ["authUser"] });
  const queryClient = useQueryClient();
  const [media, setMedia] = useState({ img: null, audio: null, video: null });
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [tweetSuccess, setTweetSuccess] = useState(false); // Success message
  const videoUrl = useRef(null);
  const [uploadProgress, setUploadProgress] = useState(0); // Track upload progress
  const [uploadPercentage, setUploadPercentage] = useState(0); // Upload Progress
  // Fetch suggested users for "Who to Follow"
  const { data: suggestedUsers, isLoading: isSuggestionsLoading } = useQuery({
    queryKey: ["suggestedUsers"],
    queryFn: async () => {
      const res = await fetch("/api/users/suggestions");
      if (!res.ok) throw new Error("Failed to fetch suggestions");
      return res.json();
    },
  });
  // Gesture-based video controls
  const handleVideoTap = (e) => {
    e.preventDefault();
    const touchX = e.touches[0].clientX;
    taps++;
    if (tapTimeout) {
      clearTimeout(tapTimeout);
    }
    tapTimeout = setTimeout(() => {
      if (taps === 1) {
        // Single Tap: Pause or Play the Video
        if (videoRef.current.paused) {
          videoRef.current.play();
        } else {
          videoRef.current.pause();
        }
      } else if (taps === 2) {
        // Double Tap: Skip forward or backward
        const videoDuration = videoRef.current.duration;
        const currentTime = videoRef.current.currentTime;
        if (touchX > window.innerWidth / 2) {
          // Right Side: Move forward 10 seconds
          videoRef.current.currentTime = Math.min(currentTime + 10, videoDuration);
        } else {
          // Left Side: Move backward 10 seconds
          videoRef.current.currentTime = Math.max(currentTime - 10, 0);
        }
      } else if (taps === 3) {
        // Triple Tap: Custom Action
        if (touchX < window.innerWidth / 3) {
          showComments(); // Function to show comments section
        } else if (touchX > window.innerWidth * 2 / 3) {
          closeSite(); // Function to close the site (could be a confirmation)
        } else {
          nextVideo(); // Function to move to the next video (you'll define what this is)
        }
      }
      taps = 0; // Reset taps
    }, 300);
  };
  // Handle video removal
  const removeVideo = () => {
    setMedia((prev) => ({ ...prev, video: null }));
    setShowVideoPlayer(false);
  }; const nextVideo = () => {
    toast.success("Next Video!"); // Placeholder action for next video
  };
  const showComments = () => {
    toast.success("Showing Comments Section!"); // Placeholder action for showing comments
  };
 const closeSite = () => {
    toast.success("Closing the Site!"); // Placeholder action for closing site
  };
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
      queryClient.invalidateQueries({ queryKey: ["suggestedUsers"] });
    },
  });
  axios.defaults.timeout = 60000; // 60 seconds
  const fetchWithTimeout = (url, options, timeout = 60000) => {
    return Promise.race([
      fetch(url, options),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), timeout)
      )
    ]);
  }; const { mutate: createPost, isPending, isError, error } = useMutation({
    mutationFn: async ({ text, img, audio, video }) => {
      const url = "/api/posts/create"; // API endpoint
      const options = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, img, audio, video }), // Include video field
      };
      try {
        // Use fetchWithTimeout for the API request
        const response = await fetchWithTimeout(url, options, 60000); // 60-second timeout
        if (isUploading) return; // Don't allow multiple uploads

        setIsUploading(true); // Start the uploading process
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Something went wrong");
        }
        return data; // Return the parsed response
      } catch (error) {
        console.error("Error in createPost mutation:", error.message);
        throw error; // Ensure error is passed back to React Query
      }
    },
    onMutate: () => {
      setIsSubmitting(true); // Indicate submission process starts
    }, onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadPercentage(percent); // Update upload percentage
      }
    },
    onSuccess: () => {
      // Reset fields after successful mutation
      setText("");
      setMedia({ img: null, audio: null, video: null });
      setEmail("");
      setOtp("");
      setIsOtpSent(false);
      setIsOtpVerified(false);
      setShowEmailVerification(false);
      setAudioUrl(null);
      setTweetSuccess(true);
      setTimeout(() => {
        setTweetSuccess(false);
        setUploadPercentage(0); // Reset progress bar
        setIsUploading(false); // Reset uploading state
        setTweetText(""); // Optionally clear tweet text
        setMedia(null); // Optionally clear selected media
      }, 2000); // Display success for 2 seconds
      setIsSubmitting(false); // Indicate submission is complete
      toast.success("Post created successfully"); // Display success message
      queryClient.invalidateQueries({ queryKey: ["posts"] }); // Refresh cached data
    },
    onError: (error) => {
      console.error("Post creation error:", error.message); // Log error details
      setIsSubmitting(false); // Reset submission state on error
      toast.error(error.message || "Failed to create post,Please Try again"); // Display error message
    },
  });
  // Form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();
    // Check if text is empty and no media is uploaded
    if (!text.trim() && !media.img && !media.audio && !audioUrl && !media.video) {
      toast.error(t("Post must contain either text or media."));
      return;
    }
    const followersCount = authUser?.following.length || 0;
    let postsToday = authUser?.postsToday || 0;
    let lastPostDate = authUser?.lastPostDate ? new Date(authUser.lastPostDate) : null;
    const currentDate = new Date();
    // Check if the last post was on a previous day, if so reset postsToday
    if (!lastPostDate || lastPostDate.toDateString() !== currentDate.toDateString()) {
      postsToday = 0; // Reset the count for a new day
      lastPostDate = currentDate; // Update the last post date to today
    }
    // Define the allowed post window for users with no followers (10 AM to 10:30 AM)
    const allowedPostWindowStart = new Date(currentDate);
    const allowedPostWindowEnd = new Date(currentDate);
    allowedPostWindowStart.setHours(10, 0, 0, 0);
    allowedPostWindowEnd.setHours(10, 30, 0, 0);
    // Conditions for users without followers
    if (followersCount === 0) {
      if (currentDate < allowedPostWindowStart || currentDate > allowedPostWindowEnd) {
        toast.error("You can only post between 10:00 AM and 10:30 AM since you have no followers.");
        return;
      }
    }
    if (followersCount === 1) {
      if (postsToday >= 1) {
        toast.error("You can only post 1 time a day if you have 1 follower. You've reached your limit for today.");
        return;
      }
    }
    if (followersCount === 2 && postsToday >= 2) {
      toast.error("You can only post 2 times a day if you have 2 to 10 followers. You've reached your limit for today.");
      return;
    }
    if (followersCount > 2 && followersCount <= 10 && postsToday >= 10) {
      toast.error("You can only post 10 times a day if you have 2 to 10 followers. You've reached your limit for today.");
      return;
    }
    // Check OTP verification before allowing the post
    if (media.audio && !isOtpVerified) {
      setShowEmailVerification(true);
      toast.error("Please verify your email to post audio content.");
      return;
    }
    createPost({
      text,
      img: media.img,
      audio: media.audio || audioUrl,
      video: media.video || videoUrl, // Include video file
    });  // Update user data (in your database or state) to reflect the new post
    // This could involve an API call to update the user's post count and last post date.
    authUser.postsToday = postsToday + 1;
    authUser.lastPostDate = currentDate.toISOString();
  };  // Image upload handler
  const handleImgChange = (e) => {
    const file = e.target.files[0];
    setIsUploading(true);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setMedia((prev) => ({ ...prev, img: reader.result }));
      reader.readAsDataURL(file);
    }
    setMedia((prev) => ({ ...prev, img: URL.createObjectURL(file) }));
    // Simulate the upload process with progress
    const uploadInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(uploadInterval); // Stop the progress when it reaches 100
          setIsUploading(false);
        }
        return prev + 10; // Increase progress
      });
    }, 500); // Update progress every 500ms (simulate upload)
  };
  // Audio upload handler
  const handleAudioChange = (e) => {
    const file = e.target?.files?.[0]; // Use optional chaining
    if (!file) {
      toast.error("No audio file selected.");
      return;
    }
    const maxSizeInBytes = 100 * 1024 * 1024; // 100 MB
    if (file.size > maxSizeInBytes) {
      toast.error("Audio file size cannot exceed 100 MB.");
      return;
    } const audioURL = URL.createObjectURL(file);
    const audio = new Audio(audioURL);
    audio.onloadedmetadata = () => {
      if (audio.duration > 5 * 60) { // 5 minutes in seconds
        toast.error("Audio length cannot exceed 5 minutes.");
        return;
      } const currentHour = new Date().getHours();
      if (currentHour < 14 || currentHour >= 19) {
        toast.error("Audio uploads are allowed only between 2:00 PM and 7:00 PM IST.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => setMedia((prev) => ({ ...prev, audio: reader.result }));
      reader.readAsDataURL(file);
    };
  }; 
  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    setIsUploading(true);
    if (!file) {
      toast.error("No audio file selected.");
      return;
    }
    setMedia((prev) => ({ ...prev, video: URL.createObjectURL(file) }));
    const maxSizeInBytes = 100 * 1024 * 1024; // 100 MB
    if (file.size > maxSizeInBytes) {
      toast.error("VDIO file size cannot exceed 100 MB.");
      return;
    }   if (file) {
      const reader = new FileReader();
      reader.onload = () => setMedia((prev) => ({ ...prev, video: reader.result }));
      reader.readAsDataURL(file);
    }
    // Simulate the upload process with progress
    const uploadInterval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(uploadInterval); // Stop the progress when it reaches 100
          setIsUploading(false);
        }
        return prev + 10; // Increase progress
      });
    }, 5000); // Update progress every 500ms (simulate upload)
  }
  const toggleEmojiPicker = () => {
    setShowEmojiPicker((prev) => !prev);
  };

  const onEmojiClick = (emoji) => {
    setText((prev) => prev + emoji.emoji);
  };
  // Audio recording logic
  const startRecording = () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          mediaRecorderRef.current = new MediaRecorder(stream);
          const audioChunks = [];

          mediaRecorderRef.current.ondataavailable = (event) => {
            audioChunks.push(event.data);
          };
          mediaRecorderRef.current.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
            setAudio(URL.createObjectURL(audioBlob));
          };
          mediaRecorderRef.current.start();
          setIsRecording(true);
        })
        .catch((err) => console.error("Error accessing microphone:", err));
    }
  };
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  }; const triggerFileInput = () => {
    if (audioRef.current) {
      audioRef.current.click();
    }
  }
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
    // Ensure email and otp are not empty
    if (!email || !otp) {
      toast.error("Email and OTP are required.");
      return;
    }    // Log email and OTP values to verify that they're correct
    console.log("Sending OTP for verification:", { email, otp });
    try {
      const response = await fetch("http://localhost:5000/api/email/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Error verifying OTP");
      }
      toast.success(data.message || "OTP verified successfully.");
      setIsOtpVerified(true);
      setShowEmailVerification(false);
    } catch (error) {
      console.error("Verification error:", error);
      toast.error(error.message || "Error verifying OTP.");
    }
  };
  return (
    <div className="flex flex-col p-6 gap-6 max-w-2xl mx-auto">
      {/* Post input area */}
      <div className="flex items-start gap-4 border-b pb-4 border-gray-700">
        <div className="avatar">
          <div className="w-10 rounded-full">
            <img
              src="/avatar-placeholder.png"
              alt="Profile"
              className="object-cover"
            />
          </div>
        </div>
        <form className="flex flex-col gap-3 w-full" onSubmit={handleSubmit}>
          <textarea
            className="textarea w-full p-3 text-lg resize-none border-2 border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t("What's happening?!")}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {media.video && (
            <div className="relative w-72 mx-auto">
              {isUploading && (
                <div className="absolute inset-0 flex justify-center items-center bg-opacity-50 bg-gray-800 rounded-lg">
                  <div className="spinner"></div>
                  <span className="upload-percentage">{uploadProgress}%</span>
                </div>
              )}
              <IoCloseSharp
                className="absolute top-0 right-5  text-white bg-gray-700 p-2 rounded-full cursor-pointer"
                onClick={() => setMedia((prev) => ({ ...prev, video: null }))}
              />
              <video className="w-full rounded-lg" src={media.video}></video>
            </div>
          )}
          {media.img && (
            <div className="relative w-72 mx-auto">
              {isUploading && (
                <div className="absolute inset-0 flex justify-center items-center bg-opacity-50 bg-gray-800 rounded-lg">
                  <div className="spinner"></div>
                  <span className="upload-percentage">{uploadProgress}%</span>
                </div>
              )}
              <IoCloseSharp
                className="absolute top-0 right-0 text-white bg-gray-700 p-2 rounded-full cursor-pointer"
                onClick={() => setMedia((prev) => ({ ...prev, img: null }))}
              />
              <img
                src={media.img}
                alt="Upload Preview"
                className="rounded-lg object-cover"
              />
            </div>
          )}
          {media.audio && (
            <div className="relative w-72 mx-auto">
              <IoCloseSharp
                className="absolute top-0 right-0 text-white bg-gray-700 p-2 rounded-full cursor-pointer"
                onClick={() => setMedia((prev) => ({ ...prev, audio: null }))}
              />
              <audio controls className="w-full rounded-lg" src={media.audio}></audio>
            </div>
          )}
          {/* Media and Emoji Pickers */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-4">
              <input
                ref={videoRef}
                type="file"
                accept="video/*"
                className="hidden"
                controls
                onTouchStart={handleVideoTap}
                onChange={handleVideoChange}
              />
              <FaVideo className=" cursor-pointer text-gray-600 hover:text-blue-500" size={25}
                onClick={() => videoRef.current.click()} />
              {/* Image File Picker */}
              <input
                ref={imgRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImgChange}
              />
              <CiImageOn
                size={25}
                className="cursor-pointer text-gray-600 hover:text-blue-500"
                onClick={() => imgRef.current.click()}
              />
              {/* Emoji Picker */}
              <BsEmojiSmileFill
                size={25}
                className="cursor-pointer text-gray-600 hover:text-blue-500"
                onClick={toggleEmojiPicker}
              />
            </div>
            {/* Audio Recording */}
            <span
              onClick={() => {
                if (isRecording) {
                  stopRecording();
                } else {
                  startRecording();
                }
              }}
              className="cursor-pointer"
            >
              {isRecording ? (
                <FaStop size={30} className="text-red-500" />
              ) : (
                <FaMicrophone size={30} className="text-blue-500" />
              )}
            </span>
            <span
              className="cursor-pointer text-green-500"
              onClick={triggerFileInput}
            >
              <FaFileUpload size={25} className="text-gray-600 hover:text-blue-500" /> {/* Icon */}
            </span>
          </div>
          {/* Hidden Audio Input */}
          <input
            ref={audioRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={handleAudioChange}
            onClick={(e) => (e.target.value = null)} // Reset file input to allow re-selection
          />
          {audio && (
            <div className="mt-4">
              <audio controls src={audio} />
            </div>
          )}
          {isUploading && (
            <div className="upload-progress">
              <p>Uploading... {uploadPercentage}%</p>
              <progress value={uploadPercentage} max="100" />
            </div>
          )}   {tweetSuccess && <p className="tweet-success">Tweet posted successfully!</p>}
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending || isSubmitting}
            className="btn btn-primary rounded-full text-white px-4 py-2 mt-4"
          >
            <h4 >{t("Tweets")}</h4>
          </button>
        </form>
      </div>
      <Outlet />
      {/* Emoji Picker */}
      {showEmojiPicker && (
        <div className="emoji-container mt-4">
          <EmojiPicker onEmojiClick={onEmojiClick} />
        </div>
      )}
      {/* OTP Verification Modal */}
      {showEmailVerification && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">{t('Email Verification Required')}</h3>
            <p className="py-2">{t('Enter your email and OTP to verify before posting audio.')}</p>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input input-bordered w-full mt-4"
            />
            <button
              onClick={handleEmailVerification}
              className="btn btn-primary mt-2"
              disabled={isOtpSent}
            >              {isSubmitting ? t("Sending...") : t("Send OTP")}
            </button>
            {isOtpSent && (
              <><input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  className="input input-bordered w-full mt-4"
                />
                <button
                  onClick={handleVerifyOtp}
                  className="btn btn-primary mt-2"
                >
                  {t('Verify OTP')
                  }</button>  </>
            )}
          </div>
        </div>
      )} </div>
  );
};
export default CreatePost;
