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
import EmojiPicker from 'emoji-picker-react'; // Import the emoji picker
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
    const [text, setText] = useState("");
    const [audio, setAudio] = useState(null);
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [isOtpSent, setIsOtpSent] = useState(false);
    const [isOtpVerified, setIsOtpVerified] = useState(false);
    const [showEmailVerification, setShowEmailVerification] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState(null); // To hold recorded audio URL
    const imgRef = useRef(null);
    const audioRef = useRef(null);
    const videoRef = useRef(null);

    const [showVideoPlayer, setShowVideoPlayer] = useState(false);

    // Handle submit (post tweet)
    const handleSubmit = (e) => {
        e.preventDefault();

        if (!text.trim() && !media.img && !media.audio && !audioUrl && !media.video) {
            toast.error("Post must contain either text or media.");
            return;
        }

        const followersCount = authUser?.following.length || 0;
        let postsToday = authUser?.postsToday || 0;
        let lastPostDate = authUser?.lastPostDate ? new Date(authUser.lastPostDate) : null;
        const currentDate = new Date();

        if (!lastPostDate || lastPostDate.toDateString() !== currentDate.toDateString()) {
            postsToday = 0;
            lastPostDate = currentDate;
        }

        const allowedPostWindowStart = new Date(currentDate);
        const allowedPostWindowEnd = new Date(currentDate);
        allowedPostWindowStart.setHours(10, 0, 0, 0);
        allowedPostWindowEnd.setHours(10, 30, 0, 0);

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

        if (media.audio && !isOtpVerified) {
            setShowEmailVerification(true);
            toast.error("Please verify your email to post audio content.");
            return;
        }
        createPost({
            text,
            img: media.img,
            audio: media.audio || audioUrl,
            video: media.video || videoUrl,
        });

        authUser.postsToday = postsToday + 1;
        authUser.lastPostDate = currentDate.toISOString();
    };

    const toggleEmojiPicker = () => {
        setShowEmojiPicker((prev) => !prev);
    };

    const onEmojiClick = (emoji) => {
        setText((prev) => prev + emoji.emoji);
    };

    const handleImgChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => setMedia(prev => ({ ...prev, img: reader.result }));
            reader.readAsDataURL(file);
        }
    };

    const handleLogout = () => {
        setMenuAnchor(null);
        logout();
    };

    const { mutate: createPost, isPending, isError, error } = useMutation({
        mutationFn: async ({ text, img, audio, video }) => {
            const res = await fetch("/api/posts/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, img, audio, video }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Something went wrong");
            return data;
        },
        onMutate: () => setIsSubmitting(true),
        onSuccess: () => {
            setText("");
            setMedia({ img: null, audio: null });
            setEmail("");
            setOtp("");
            setIsOtpSent(false);
            setIsOtpVerified(false);
            setShowEmailVerification(false);
            setAudioUrl(null);
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
                </ul>

                {/* Scrollable sidebar content */}
                <div className="flex flex-col gap-3 mt-4 overflow-y-auto flex-grow">
                    <LanguageSelector currentLanguage={language} onLanguageChange={handleLanguageChange} />
                </div>

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
                                <ListItemIcon><DoneIcon /></ListItemIcon>
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
