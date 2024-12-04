import UserModel from '../models/user.model.js'; // Make sure the user model path is correct
import nodemailer from 'nodemailer';
import crypto from 'crypto';

// Utility function to create a Nodemailer transporter
const createTransporter = async () => {
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false, // Use true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

// Utility function to generate a 6-digit OTP
const generateOtp = () => Math.floor(100000 + Math.random() * 900000);

// Utility function to send OTP via email
const sendOtpEmail = async (email, otp, subject) => {
    const transporter = await createTransporter();
    try {
        await transporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: email,
            subject: subject,
            text: `Your OTP is ${otp}`,
            html: `<p>Your OTP is <strong>${otp}</strong></p>`,
        });
        console.log(`OTP email sent to ${email}`);
    } catch (error) {
        console.error(`Error sending OTP email: ${error.message}`);
        throw new Error('Failed to send OTP email.');
    }
};

// Verify OTP function
export const verifyOtp = async (req, res) => {
    const { email, otp } = req.body;

    try {
        // Find the user by email
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ code: 404, message: 'User not found' });
        }

        // Check if the OTP has expired
        if (user.otpExpiry && user.otpExpiry < Date.now()) {
            return res.status(400).json({ code: 400, message: 'OTP has expired' });
        }

        // Compare the provided OTP with the one in the database
        if (user.otp === otp) {
            user.isVerified = true; // Mark the user as verified
            user.otp = null; // Clear the OTP
            user.otpExpiry = null; // Clear the OTP expiry
            await user.save();

            return res.status(200).json({ code: 200, message: 'Email verified successfully. You are now registered.' });
        } else {
            return res.status(400).json({ code: 400, message: 'Invalid OTP' });
        }
    } catch (err) {
        console.error('Error during OTP verification:', err);
        return res.status(500).json({ code: 500, message: 'Server error', error: err.message });
    }
};

// Resend OTP function
export const resendOtp = async (req, res) => {
    const { email } = req.body;

    try {
        // Find the user by email
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(404).json({ code: 404, message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ code: 400, message: 'User already verified' });
        }

        // Generate a new OTP and set expiry time
        const newOtp = generateOtp();
        user.otp = newOtp;
        user.otpExpiry = Date.now() + 10 * 60 * 1000; // OTP expires in 10 minutes
        await user.save();

        // Resend OTP to the user's email
        await sendOtpEmail(email, newOtp, 'Resend OTP');

        return res.status(200).json({ code: 200, message: 'OTP resent successfully.' });
    } catch (err) {
        console.error('Error during OTP resend:', err);
        return res.status(500).json({ code: 500, message: 'Server error', error: err.message });
    }
};

// Export controller functions
export default {
    verifyOtp,
    resendOtp,
};
