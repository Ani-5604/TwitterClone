import path from "path";
import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import { v2 as cloudinary } from "cloudinary";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import nodemailer from "nodemailer";
import cors from "cors";
import passport from "passport";
// Import routes
import authRoutes from "./routes/auth.route.js";
import userRoutes from "./routes/user.route.js";
import postRoutes from "./routes/post.route.js";
import notificationRoutes from "./routes/notification.route.js";
import Otp from "./models/otp.model.js";
import connectMongoDB from "./db/connectMongoDB.js";
import session from 'express-session';
import multer from 'multer';
import User from './models/user.model.js';  // Adjust the path according to your project structure
import jwt from 'jsonwebtoken';  // Add this import at the top
import bcrypt from 'bcrypt'; // Make sure bcrypt is imported at the top of your file
import crypto from 'crypto';

import fs from 'fs';

import Post from "./models/post.model.js";
import admin from 'firebase-admin';  // Import Firebase Admin SDK

// Initialize Firebase Admin SDK with your service account credentials
admin.initializeApp({
  credential: admin.credential.cert({
    // Replace with your service account credentials
    project_id: "twiller-960e0",
   private_key_id: "452fbf14887ee061220becdf59c944c73bb95742",
  private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC1fdDh7G8pEQHc\naaFI3eCQb6qKLuB3yOAUwduT29/7hcTHFXP3ycx2WaV9pOke6fyhTB2K0ci4ycIv\n1QegkWyeQAc+y/ZYlZ6r/eduWdJ+U4EWDmGdqCGpWZDevqrzWYdHnVh/AJTf0fb9\nsGTK9EYQnzugNi8oEoDxcJAI9DgMRu4Xu/qvXUEi86Gxfr3nzZnJH9jh2Ha+h1OK\np3n0dtHiPQL2zQYhGuhd2r2DthhUdGIZoJTntgscRQcnYDJJqFKZiuuzuLPHx174\nDViTBUklPkUmfFKmU0HWFTEdvo6nZO3rCnrtBT3fVY1m3eR8cPwTdJv/jFmkzvj7\nQRZt8RIdAgMBAAECggEAA1A/OoizBNhrJMeG6somOezX+7rcXUN9F9PsOthWUATC\nsXHKUrlL8tMzKsaSfP5/nsBBf9HRrNH+KhplD8Dn70GzACoAHuDoazJxAbpBFg5X\nOnxbuuGhb7KTawWnIFc/mYadYYA0t5thO4N3a58nElGd6JBkrwIbeYz5DDjNNygi\nbTBb7E4zq03Sjr5X7j9ZZncspbA77TYXTwKoqTwhrGai7gnvtyKyHYh7ef5NJuwf\nY+0kui7/+QEkiHgMzp1ChyivU8rhAEWTCf2wMpBFvCPR0bjKianvY/7iGvUxI0vG\nI6f79uVi2waUB5gxeB9s6reyAAMplh6cPvVbhGiskQKBgQD0FkE38UAnbrlhg+4J\nsRE8gN3r27ywZ95hFO3OFVqXjJb3V/eNLRQMo04GYSODqf3jqp1vRIzwF5HvKIhq\nq1AiUXNFYfQEvFwyNem1d9PDelcPotzyZ7qZfKQM6HKV3S29pvToKZffVfgM0Rn7\n8iLVOOE91e4AFpmSAKeEJMmkFQKBgQC+WXY+X/IZs+iMcI4ZZWz0YDRsJNY2yOjP\nIpwby0GwpWNvErhtRvRMHUUlAeJ2czP+Q0Ay8JCFP0yZoTgAY5lO5RdwTM2bb212\nPR22hcAq9+qIvBVsxUnNfF2K8RZ2R0ri73ANLDD6vow9ePC4AuSOKiTP8YbmfjoH\n95UVYneP6QKBgGJIl8hD31ZBcmn+qpnCb7NSHIn9N/Q8TsH+oGbMGGdPl/ZOuIJj\nNWCFXUSaVqeMiovixnPoQWvnwb5wLsXs5156N5UnhQ9nHSSmqs2ES4O5vlaweJEv\nDWcCVjhQXNtVbTahhJn7LYkjX7chd3oInNgIiEHS43urnfi5RLqj6YGlAoGBAJ1w\nZWrF9PrpYUj3t7CtwWaHRBTGix+ZIWZh2/jpLxYqVYoDU+OesmVaOFyZqHQMaU6+\n1RTNANwVNQhE3osD1kP5HF/YRp9vlHwdpLvY+M8Raz1ZQ+dJbve1C7HmIowF/5yg\nKm/aw1BB1sDpjUDFs8EafoQ34zo14U3Bq9+aKAYxAoGARe7fTAuSrmGk5DpT01eG\nI8B95EwAJBHo8fwFeLfH1/5nn7+Bf4aqMxAJhVtfY9HCwvKy0I2Jzng11ubAoOZA\ndB+ehiarwsP9FvaKXlapH4RZS9V3IuBDntRM4zKPFBQYVXioMzFW3TrbNtkxDGcy\nnUZMInRlO/o7odqnifiZU7k=\n-----END PRIVATE KEY-----\n",
  client_email: "firebase-adminsdk-xfx4j@twiller-960e0.iam.gserviceaccount.com",
  client_id: "116811412693151836214",
  }),
});
// Store OTPs in-memory (for simplicity)
let otpStore = {};

// Helper function to generate OTP
const generateOtp = () => {
  return crypto.randomInt(100000, 999999).toString(); // Random 6-digit OTP
};


// Load environment variables
dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;
const __dirname = path.resolve();
app.use(passport.initialize());

// Middleware
app.use(helmet());
app.use(cors()); // Enable CORS
app.use(express.json({ limit: "500mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", apiLimiter);


// Configure email transporter
const transporter = nodemailer.createTransport({
  service: "Gmail", // Use an email service like SendGrid or Mailgun in production
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
// Set up storage for Multer to handle video file uploads

const uploadDir = path.join(__dirname, 'uploads', 'videos');

// Check if the 'uploads/videos' directory exists, if not, create it
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });  // recursive will create parent directories as needed
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);  // Use the path for video uploads
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);  // Use unique filename for each upload
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },  // Max file size 100MB
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (['.mp4', '.mkv', '.avi', '.mov'].includes(ext)) {
      cb(null, true);  // Accept the file
    } else {
      cb(new Error("Only video files are allowed"), false);  // Reject the file
    }
  }
});


// Video upload API endpoint
app.post("/api/video/upload", upload.single("video"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No video file uploaded" });
  }

  // Send back the video URL (or any relevant data)
  const videoUrl = `/uploads/videos/${req.file.filename}`;
  res.status(200).json({ message: "Video uploaded successfully", videoUrl });
});
app.post('/upload', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file uploaded.' });
  }

  try {
    // Upload video to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'video',
      folder: 'videos', // Optional: organize uploads in a folder
    });

    res.status(200).json({
      message: 'Video uploaded successfully.',
      url: result.secure_url,  // Cloudinary URL for the uploaded video
    });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({ error: 'Video upload failed.' });
  }
});
app.post("/api/email/send-otp", async (req, res) => {
  const { email } = req.body;  // Assuming the email is being sent in the body

  if (!email) {
    return res.status(400).json({ error: "Email is required" });
  }

  try {
    // Find the user by email
    const user = await User.findOne({ email });  // Querying by email

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Generate a random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set OTP expiration time (5 minutes)
    const expirationTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Save OTP and expiration to MongoDB
    const otpRecord = new Otp({
      email,
      otp,
      expiration: expirationTime,
    });
    await otpRecord.save();  // Save OTP record

    // Send the OTP via email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Hello ${user.fullName}, Your OTP code is ${otp}. It is valid for 5 minutes.`,
    });

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ error: "Failed to send OTP" });
  }
});


// Route to verify OTP
app.post("/api/email/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  // Check if email and OTP are provided
  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required" });
  }

  try {
    // Find the OTP record for the provided email
    const otpRecord = await Otp.findOne({ email, otp });

    if (!otpRecord) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Check if OTP has expired
    const currentTime = new Date();
    const expirationTime = otpRecord.expiration; // assuming expiration is a Date object
    if (currentTime > expirationTime) {
      return res.status(400).json({ error: "OTP has expired" });
    }

    // OTP is valid, delete it from the database after verification
    await otpRecord.deleteOne();

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ error: "An error occurred while verifying OTP" });
  }
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);

app.use(session({ secret: process.env.JWT_SECRET, resave: false, saveUninitialized: false }));
app.use(passport.initialize());
app.use(passport.session());
app.post("/api/auth/google", async (req, res) => {
  const { tokenId } = req.body;

  if (!tokenId) {
    return res.status(400).json({ message: "Token not provided" });
  }

  try {
    // Verify the ID token using Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(tokenId);
    const { uid, email, name, picture } = decodedToken;

    let user = await User.findOne({ googleId: uid });
    if (!user) {
      const username = email.split('@')[0];
      user = new User({
        googleId: uid,
        email,
        fullName: name,
        profileImg: picture,
        username,
        password: 'defaultPassword', // Optional: handle password logic
      });
      await user.save();
    }

    const jwtToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ message: "Google Sign-In successful", token: jwtToken, user });
  } catch (error) {
    console.error("Google Sign-In Error:", error);
    res.status(500).json({ message: "Google Sign-In failed", error: error.message });
  }
});



// Protect a route (example)
const authenticateJWT = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Extract token from Authorization header
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};


app.post('/upload', upload.single('video'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No video file uploaded.' });
  }

  try {
    // Upload video to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: 'video',
      folder: 'videos', // Optional: organize uploads
    });

    res.status(200).json({ message: 'Video uploaded successfully.', url: result.secure_url });
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    res.status(500).json({ error: 'Video upload failed.' });
  }
});


app.get('/profile', authenticateJWT, (req, res) => {
  res.json({ message: 'Profile data', user: req.user });
});

// Serve frontend in production
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "/frontend/dist")));
  app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "frontend", "dist", "index.html"));
  });
}
app.get("/api/auth/validate-reset-token/:token", async (req, res) => {
  const { token } = req.params;
  
  try {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }, // Token should still be valid
    });

    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token" });
    }

    res.status(200).json({ message: "Valid token" });
  } catch (error) {
    console.error("Error validating reset token:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&display=swap" rel="stylesheet">
            <title>Twiller</title>
        </head>
        <body>
            <h2 style="
                color: #1DA1F2; 
                font-family: 'Poppins', Arial, sans-serif; 
                font-weight: 700; 
                font-size: 24px; 
                letter-spacing: -1px; 
                text-align: center; 
                display: inline-block; 
                padding-left: 10px;
                margin: 0;
                line-height: 1.2;
                text-transform: lowercase;
            ">
                twiller
            </h2>
        </body>
        </html>
    `);
});
// Forgot password (send email with reset token)
app.post("/api/auth/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No user found with this email." });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Set reset token and expiry time
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // Token expires in 15 minutes
    await user.save();

    // Construct the reset URL
    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
    const mailOptions = {
      to: user.email,
      subject: "Reset Your Twiller Password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="https://res.cloudinary.com/djkgxhjdn/image/upload/c_thumb,w_200,g_face/v1732974003/twitter_oyg0fx.webp" alt="Twiller Logo" style="width: 50px; height: auto;" />
 <h2 style="
        color: #1DA1F2; 
        font-family: 'Poppins', Arial, sans-serif; 
        font-weight: 700; 
        font-size: 24px; 
        letter-spacing: -1px; 
        text-align: center; 
        display: inline-block; 
        padding-left: 10px;
        margin: 0;
    ">
        twiller
    </h2>


          </div>
          <h2 style="color: #1DA1F2; text-align: center;">Hi ${user.username},</h2>
          <p style="font-size: 16px; line-height: 1.5;">
            Sorry to hear you’re having trouble logging into Twiller. We received a message that you forgot your password. If this was you, you can get back into your account or reset your password now.
          </p>
    
          <div style="text-align: center; margin: 20px 0;">
            <a href="http://localhost:5173/${user.username}" 
              style="background-color: #1DA1F2; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-size: 16px; margin-right: 10px;">
              Log in as ${user.username}
            </a>
            <a href="${resetUrl}" 
              style="background-color: #FFAD1F; color: white; text-decoration: none; padding: 10px 20px; border-radius: 5px; font-size: 16px;">
              Reset your password
            </a>
          </div>
    
          <p style="font-size: 16px; line-height: 1.5;">
            If you didn’t request a login link or a password reset, you can ignore this message and learn more about 
            <a href="https://help.twiller.com" style="color: #1DA1F2;">why you may have received it</a>.
          </p>
    
          <p style="font-size: 14px; color: #555; line-height: 1.5; margin-top: 30px; text-align: center;">
            Only people who know your Twiller password or click the login link in this email can log into your account.
          </p>
    
          <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
    
          <footer style="font-size: 12px; color: #888; text-align: center;">
            <p>&copy; Twiller. Clone Platforms, Inc., 1601 Willow Road, Menlo Park, CA 94025</p>
            <p>This message was sent to ${user.email} and intended for ${user.username}. Not your account? 
              <a href="https://help.twiller.com/remove-email" style="color: #1DA1F2;">Remove your email from this account</a>.
            </p>
          </footer>
        </div>
      `,
    };
    

    // Send the reset email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Password reset email sent!" });
  } catch (error) {
    console.error("Error in forgot-password route:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});app.post("/api/auth/reset-password", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ message: 'Token and password are required' });
  }

  try {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }, // Check token expiration
    });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Update password and clear reset token and expiry
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'An error occurred. Please try again.' });
  }
});

// Request reset token (alternative to use JWT, if preferred)
app.post("/api/auth/request-reset", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Set reset token and expiry time
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = Date.now() + 3600000; // Token expires in 1 hour
    await user.save();

    const resetUrl = `http://localhost:5173/reset-password/${resetToken}`;
    const mailOptions = {
      to: user.email,
      subject: "Password Reset Request",
      html: `<p>You requested a password reset.</p>
             <p>Click this <a href="${resetUrl}">link</a> to reset your password. It expires in 1 hour.</p>`,
    };

    // Send the reset email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Password reset link sent" });
  } catch (error) {
    console.error("Error in request-reset route:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});
app.delete('/api/posts/:postId/comments/:commentId', async (req, res) => {
  const { postId, commentId } = req.params;

  try {
    // Find the post by ID
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Find the index of the comment to delete
    const commentIndex = post.comments.findIndex(comment => comment._id.toString() === commentId);
    if (commentIndex === -1) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    // Remove the comment from the comments array
    post.comments.splice(commentIndex, 1);

    // Save the updated post document
    await post.save();

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error' });
  }
});


// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack); // Log the error stack
  res.status(500).send("Something went wrong!"); // Generic error response
});

// Connect to MongoDB and start the server
connectMongoDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
