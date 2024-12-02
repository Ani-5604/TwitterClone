import TwitterSvg from "../svgs/TwitterSvg";
import { MdHomeFilled } from "react-icons/md";
import { IoNotifications, IoSearch, IoMail, IoBookmark, IoList } from "react-icons/io5";
import { Link } from "react-router-dom";
import { BiLogOut } from "react-icons/bi";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useState } from "react";
import LanguageSelector from "../LanguageSelector";
import { useTranslation } from "react-i18next";
import { useRef } from "react";
import  EmojiPicker from 'emoji-picker-react'; // Import the emoji picker
import { Avatar, Menu, MenuItem, Divider, ListItemIcon } from "@mui/material";
import PermIdentityIcon from "@mui/icons-material/PermIdentity";
import MoreIcon from "@mui/icons-material/More";
import DoneIcon from "@mui/icons-material/Done"; // Ensure DoneIcon is imported
import { Button } from '@mui/material'; // Assuming you're using Material UI for Button
import { IoCloseSharp } from 'react-icons/io5';
import { FaVideo, FaMicrophone } from 'react-icons/fa';
import { CiImageOn } from 'react-icons/ci';

import { Outlet } from "react-router-dom";
import { BsEmojiSmileFill } from 'react-icons/bs';
import { FaFileUpload } from "react-icons/fa"; // Importing upload icon
const Sidebar = () => {
    const { t } = useTranslation();
    const queryClient = useQueryClient();

    const { mutate: logout } = useMutation({
        mutationFn: async () => {
            const res = await fetch("/api/auth/logout", { method: "POST" });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Something went wrong");
        },
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authUser"] }),
        onError: () => toast.error("Logout failed"),
    });
 // Video upload handler
 const videoUrl = useRef(null);
    const { data: authUser } = useQuery({ queryKey: ["authUser"] });
    const [language, setLanguage] = useState("en");
    const handleLanguageChange = (lang) => setLanguage(lang);

    const [menuAnchor, setMenuAnchor] = useState(null);
    const handleMenuOpen = (event) => setMenuAnchor(event.currentTarget);
    const handleMenuClose = () => setMenuAnchor(null);
    const [showTweetForm, setShowTweetForm] = useState(false); // State to show or hide the form
    const [tweetText, setTweetText] = useState(''); // State for tweet content
    const [media, setMedia] = useState({ img: null, video: null, audio: null }); // State for media files
    const [showEmojiPicker, setShowEmojiPicker] = useState(false); // Define the state to control the emoji picker visibility
   // State hooks
   const [text, setText] = useState("");
  
   const [VideoUrl, setVideoUrl] = useState(null); // To hold recorded audio URL
 

   const [audio, setAudio] = useState(null);

   const [email, setEmail] = useState("");
   const [otp, setOtp] = useState("");
   const [isOtpSent, setIsOtpSent] = useState(false);
   const [isOtpVerified, setIsOtpVerified] = useState(false);
   const [showEmailVerification, setShowEmailVerification] = useState(false);
   const [isSubmitting, setIsSubmitting] = useState(false);
   const [isRecording, setIsRecording] = useState(false);
   const [recorder, setRecorder] = useState(null);
   const [audioUrl, setAudioUrl] = useState(null); // To hold recorded audio URL

   const imgRef = useRef(null);
   const audioRef = useRef(null);
const videoRef=useRef(null);
 
   const [showVideoPlayer, setShowVideoPlayer] = useState(false);

    // Handle submit (post tweet)
  

  // Form submission handler
  const handleSubmit = (e) => {
    e.preventDefault();

    // Check if text is empty and no media is uploaded
    if (!text.trim() && !media.img && !media.audio && !audioUrl && !media.video) {
      toast.error("Post must contain either text or media.");
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
    });


    // Update user data (in your database or state) to reflect the new post
    // This could involve an API call to update the user's post count and last post date.
    authUser.postsToday = postsToday + 1;
    authUser.lastPostDate = currentDate.toISOString();
  };


   
const toggleEmojiPicker = () => {
    setShowEmojiPicker((prev) => !prev);
  };

  const onEmojiClick = (emoji) => {
    setText((prev) => prev + emoji.emoji);
  };

 
    // File Upload Handlers
    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => setMedia(prev => ({ ...prev, img: reader.result }));
            reader.readAsDataURL(file);
        }
    };

    // Log out function
    const handleLogout = () => {
        setMenuAnchor(null);
        logout();
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
  // Audio upload handler

  
  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
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
    // Ensure email and otp are not empty
    if (!email || !otp) {
      toast.error("Email and OTP are required.");
      return;
    }

    // Log email and OTP values to verify that they're correct
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


  const triggerFileInput = () => {
    if (audioRef.current) {
      audioRef.current.click();
    }
  }
  
    const { mutate: createPost, isPending, isError, error } = useMutation({
      mutationFn: async ({ text, img, audio, video }) => {
        // Ensure the video URL is properly passed along
        const res = await fetch("/api/posts/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, img, audio }), // Add video field here
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Something went wrong");
        return data;
      },
      onMutate: () => setIsSubmitting(true),
      onSuccess: () => {
        // Only reset after the post is successfully created
        setText("");
        setMedia({ img: null, audio: null}); // Reset only after success
        setEmail("");
        setOtp("");
        setIsOtpSent(false);
        setIsOtpVerified(false);
        setShowEmailVerification(false);
        setAudioUrl(null); // Reset audio URL after posting
  
        setIsSubmitting(false);
        toast.success("Post created successfully");
        queryClient.invalidateQueries({ queryKey: ["posts"] });
      },
      onError: () => setIsSubmitting(false),
    });
  
    return (
        <div className='md:flex-[2_2_0] w-18 max-w-52'>
            <div className='sticky top-0 left-0 h-screen flex flex-col border-r border-gray-700 w-20 md:w-full'>
                <Link to='/' className='flex justify-center md:justify-start'>
                    <TwitterSvg className='px-2 w-12 h-12 rounded-full fill-white hover:bg-stone-900' />
                </Link>
                <ul className='flex flex-col gap-3 mt-4'>
              <SidebarLink to="/" icon={<MdHomeFilled className="w-8 h-8" />} text={t("Home")} />

                    <SidebarLink to="/notifications" icon={<IoNotifications className='w-6 h-6' />} text={t("Notifications")} />
                    <SidebarLink to="/explore" icon={<IoSearch className='w-6 h-6' />} text={t("Explore")} />
                    <SidebarLink to="/messages" icon={<IoMail className='w-6 h-6' />} text={t("Messages")} />
                    <SidebarLink to="/bookmarks" icon={<IoBookmark className='w-6 h-6' />} text={t("BookMarks")} />
                    <SidebarLink to="/lists" icon={<IoList className='w-6 h-6' />} text={t("Lists")} />
                    <SidebarLink to={`/profile/${authUser?.username}`} icon={<PermIdentityIcon className='w-6 h-6' />} text={t("Profile")} />
                    <SidebarLink to="/more" icon={<MoreIcon className='w-6 h-6' />} text={t("More")} />
                    <Button
        variant="outlined"
        className="sidebar__tweet"
        fullWidth
        onClick={() => setShowTweetForm(true)} // Show form when button clicked
      >
        Tweet
      </Button>

      {/* Tweet Form Modal */}
      {showTweetForm && (
        <div className="modal modal-open">
          <div className="modal-box">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">{t('Create Tweet')}</h3>
              <IoCloseSharp
                className="cursor-pointer"
                onClick={() => setShowTweetForm(false)} // Close the form when clicked
              />
            </div>

            {/* Tweet Form */}
            <form className="flex flex-col gap-3 w-full" onSubmit={handleSubmit}>
          <textarea
            className="textarea w-full p-3 text-lg resize-none border-2 border-gray-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={t("What's happening?!")}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
      
          {media.img && (
            <div className="relative w-72 mx-auto">
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
</div>
          {/* Submit Button */}
          <button
            type="submit"
            disabled={isPending || isSubmitting}
            className="btn btn-primary rounded-full text-white px-4 py-2 mt-4"
          >
           
  {t("Post")}
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
            >
              {t('Send OTP')}
            </button>
            {isOtpSent && (
              <>
                <input
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
                  }                   </button>
              </>
            )}
          </div>
        </div>
      )}

    </div>
      )} <LanguageSelector currentLanguage={language} onLanguageChange={handleLanguageChange} />
                </ul>
               
                
                {authUser && (
                    <div className='flex items-center gap-2 mt-auto mb-10 px-4'>
                        <Link to={`/profile/${authUser.username}`} className='flex gap-2 items-center'>
                            <Avatar src={authUser?.profileImg || "/avatar-placeholder.png"} alt='Profile' />
                            <div className='hidden md:block'>
                                <p className='text-white font-bold text-sm w-20 truncate'>{authUser?.fullName}</p>
                                <p className='text-slate-600 text-sm'>@{authUser?.username}</p>
                            </div>
                        </Link>
                        <BiLogOut className='w-5 h-5 cursor-pointer' onClick={handleMenuOpen} />

                        <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={handleMenuClose}>
                            <MenuItem onClick={handleMenuClose}>
                                <ListItemIcon><DoneIcon /></ListItemIcon> {/* Done Icon */}
                                <span>{t("Add an existing account")}</span>
                            </MenuItem>
                            <Divider />
                            <MenuItem onClick={handleLogout}>
                                <ListItemIcon><BiLogOut /></ListItemIcon>
                               {t("Log out")} @{authUser?.username}
                            </MenuItem>
                        </Menu>
                    </div>
                )}
            </div>
        </div>
    );
};

const SidebarLink = ({ to, icon, text }) => (
    <li className='flex justify-center md:justify-start'>
        <Link to={to} className='flex gap-3 items-center hover:bg-stone-900 transition-all rounded-full duration-300 py-2 pl-2 pr-4 max-w-fit cursor-pointer'>
            {icon}
            <span className='text-lg hidden md:block'>{text}</span>
        </Link>
    </li>
);

export default Sidebar;
