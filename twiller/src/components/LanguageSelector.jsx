import React, { useState, useEffect } from "react";
import { Button, Modal, Input, Box, MenuItem, Select, FormControl, InputLabel } from "@mui/material";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { FaRegHandPointRight } from "react-icons/fa";
import { MdClose } from "react-icons/md"; // Add close icon

// Shared OTP Input Form Component
const OtpVerificationForm = ({ onSubmit, isSubmitting, otp, setOtp, isOtpVerified, placeholder, buttonText }) => {
  return (
    <div className="flex flex-col gap-4 mt-4">
      <Input
        type="text"
        placeholder={placeholder}
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        className="border p-2 rounded-md"
        required
      />
      <Button
        onClick={onSubmit}
        variant="contained"
        color="primary"
        disabled={isSubmitting || isOtpVerified}
        className="flex items-center justify-center gap-2 w-full"
      >
        {isSubmitting ? "Verifying..." : buttonText}
      </Button>
    </div>
  );
};

const LanguageSelector = ({ currentLanguage, onLanguageChange }) => {
  const { t, i18n } = useTranslation();
  const [showModal, setShowModal] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState(""); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(localStorage.getItem("language") || currentLanguage); 
  const [isOtpSent, setIsOtpSent] = useState(false); 
  const [otp, setOtp] = useState(""); 
  const [isOtpVerified, setIsOtpVerified] = useState(false); 
  const [isPhoneOtpSent, setIsPhoneOtpSent] = useState(false); 
  const { data: authUser } = useQuery({ queryKey: ["authUser"] });
  const [previousLanguage, setPreviousLanguage] = useState(localStorage.getItem("language") || currentLanguage); // Track the previous language
  
  // Effect to handle the language on initial load or refresh
  useEffect(() => {
    if (selectedLanguage) {
      i18n.changeLanguage(selectedLanguage).catch((error) => {
        toast.error(t("Error changing language."));
      });
    }
  }, [selectedLanguage, i18n, t]);

  // Handle Language Change
  const handleLanguageChange = async (event) => {
    const lang = event.target.value;

    // Save the current language as the previous language before attempting the change
    setPreviousLanguage(selectedLanguage);

    // Temporarily set selected language to update the UI
    setSelectedLanguage(lang);

    // Save language to localStorage to persist after page refresh
    localStorage.setItem("language", lang);
    console.log(lang);

    if (lang === "en") {
      // Directly change language for English
      try {
        await i18n.changeLanguage(lang);
      } catch (error) {
        toast.error(t("Error changing language."));
      }
      return;
    }

    if (lang === "fr") {
      // Require email verification for French
      toast.error(t("Please verify your email first to change your language."));
      setShowModal(true); // Trigger the email verification modal
      return;
    }

    // For all other languages, require phone verification
    toast.error(t("Please verify your phone number to change your language."));
    setShowModal(true); // Trigger the phone verification modal
  };

  // Phone number submission with loading and feedback
  const handlePhoneNumberSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Send OTP to the phone number for verification
      await axios.post("/api/send-phone-otp", { phoneNumber });
      setIsPhoneOtpSent(true); 
      setIsSubmitting(false);
      setPhoneNumber(""); 
      toast.success(t("A verification OTP will be sent to your phone."));
    } catch (error) {
      toast.error(t("Error sending phone verification code."));
      setIsSubmitting(false);
    }
  };

  // Email submission for French language change (Send OTP to email)
  const handleEmailSubmit = async (e) => {
    e.preventDefault();

    if (email !== authUser.email) {
      toast.error(t("Email does not match your account."));
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
        toast.success(t("OTP sent to your email."));
      } else {
        toast.error(data.error || t("Failed to send OTP."));
      }
    } catch {
      toast.error(t("Failed to send OTP."));
    }
  };

  // Verify OTP for email verification
  const handleVerifyOtp = async () => {
    if (!otp) {
      toast.error(t("Please enter the OTP."));
      return;
    }

    try {
      const response = await fetch("/api/email/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp }),
      });

      if (!response.ok) throw new Error(t("Error verifying OTP"));

      const data = await response.json();
      toast.success(data.message);

      // Successfully verified the email, switch the app's language to French
      await i18n.changeLanguage("fr");
      setIsOtpVerified(true);
      setShowModal(false); // Close modal after email verification
      setSelectedLanguage("fr"); // Update the UI state to reflect language change
    } catch (error) {
      toast.error(error.message || t("Error verifying OTP."));
    }
  };

  // Verify OTP for phone number verification
  const handleVerifyPhoneOtp = async () => {
    if (!otp) {
      toast.error(t("Please enter the OTP."));
      return;
    }

    try {
      const response = await axios.post("/api/verify-phone-otp", { phoneNumber, otp });

      if (response.data.success) {
        toast.success(t("Phone number verified successfully."));

        // Change the language after successful verification
        await i18n.changeLanguage(selectedLanguage);

        setIsOtpVerified(true);
        setShowModal(false);
      } else {
        toast.error(t("Invalid OTP. Please try again."));
      }
    } catch (error) {
      toast.error(t("Error verifying phone OTP."));
    }
  };

  // Handle modal close
  const handleCloseModal = async () => {
    // If the user closes the modal without verifying, revert to the previous language
    if (!isOtpVerified) {
      try {
        await i18n.changeLanguage(previousLanguage);
        setSelectedLanguage(previousLanguage); // Revert UI state
      } catch (error) {
        toast.error(t("Error reverting language."));
      }
    }

    // Reset state
    setShowModal(false);
    setPhoneNumber("");
    setEmail("");                                                         
    setOtp("");
    setIsSubmitting(false);
    setIsOtpSent(false);
    setIsPhoneOtpSent(false);
  };

  return (
    <div>
      <FormControl variant="outlined" className="mb-4 w-full">
        <InputLabel>{t("Select Language")}</InputLabel>
        <Select value={selectedLanguage} onChange={handleLanguageChange} label={t("Select Language")}>
          <MenuItem value="en">{t("English")}</MenuItem>
          <MenuItem value="es">{t("Spanish")}</MenuItem>
          <MenuItem value="hi">{t("Hindi")}</MenuItem>
          <MenuItem value="pt">{t("Portuguese")}</MenuItem>
          <MenuItem value="zh">{t("Chinese")}</MenuItem>
          <MenuItem value="fr">{t("French")}</MenuItem>
        </Select>
      </FormControl>

      <Modal
        open={showModal}
        onClose={handleCloseModal}
        aria-labelledby="language-verification-modal"
        aria-describedby="modal-to-verify-language-change"
      >
        <Box className="flex flex-col justify-center items-center w-80 mx-auto mt-24 bg-white p-4 rounded-lg outline-none shadow-lg">
          <div className="flex justify-between items-center w-full mb-4">
            <h2 className="text-xl font-bold">{t("Verify Your Account")}</h2>
            <MdClose onClick={handleCloseModal} className="text-2xl cursor-pointer" />
          </div>

          <div className="flex items-center gap-2 mb-4">
            <FaRegHandPointRight className="text-4xl text-blue-500" />
            <p className="text-sm">{t("Provide your phone number to receive an OTP.")}</p>
          </div>

          {/* Phone Verification Form (For all languages except English and French) */}
          {selectedLanguage !== "en" && selectedLanguage !== "fr" && !isPhoneOtpSent && (
            <form className="flex flex-col gap-4" onSubmit={handlePhoneNumberSubmit}>
              <Input
                type="tel"
                placeholder={t("Enter your phone number")}
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="border p-2 rounded-md"
                required
                inputProps={{ pattern: "[0-9]{10}", title: t("Enter a valid 10-digit phone number") }}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 w-full"
              >
                {isSubmitting ? t("Sending...") : t("Send OTP")}
              </Button>
            </form>
          )}

          {/* OTP Verification Form for Phone Number */}
          {isPhoneOtpSent && selectedLanguage !== "en" && selectedLanguage !== "fr" && (
            <OtpVerificationForm
              onSubmit={handleVerifyPhoneOtp}
              isSubmitting={isSubmitting}
              otp={otp}
              setOtp={setOtp}
              isOtpVerified={isOtpVerified}
              placeholder={t("Enter OTP")}
              buttonText={t("Verify OTP")}
            />
          )}

          {/* Email Verification Form (For French) */}
          {selectedLanguage === "fr" && !isOtpSent && (
            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4">
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("Enter your email")}
                className="border p-2 rounded-md"
                required
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isSubmitting}
                className="flex items-center justify-center gap-2 w-full"
              >
                {isSubmitting ? t("Sending...") : t("Send OTP")}
              </Button>
            </form>
          )}

          {/* OTP Verification Form for Email */}
          {isOtpSent && selectedLanguage === "fr" && (
            <OtpVerificationForm
              onSubmit={handleVerifyOtp}
              isSubmitting={isSubmitting}
              otp={otp}
              setOtp={setOtp}
              isOtpVerified={isOtpVerified}
              placeholder={t("Enter OTP")}
              buttonText={t("Verify OTP")}
            />
          )}
        </Box>
      </Modal>
    </div>
  );
};

export default LanguageSelector;
