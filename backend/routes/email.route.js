import express from 'express';
import { resendOtp, verifyOtp } from '../controllers/email.controller.js'; // Note the .js extension

const router = express.Router();

// Verify OTP
router.post('/verify-otp', verifyOtp);

// Resend OTP
router.post('/resend-otp', resendOtp);


export default router;
