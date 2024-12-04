import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import GoogleButton from "react-google-button";
import twitterimg from "../../image/twitter.jpeg";
import TwitterIcon from "@mui/icons-material/Twitter";
import { MdOutlineMail, MdPassword } from "react-icons/md";
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Import eye icons
import { getAuth, signInWithPopup } from "firebase/auth";
import { auth, provider } from "../../context/firebase"; // Ensure correct Firebase setup
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./login.css";
const LoginPage = () => {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false); // State for password visibility
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState("");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { mutate: loginMutation, isPending, isError, error } = useMutation({
    mutationFn: async ({ username, password }) => {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Welcome ${data.username || "User"}!`);
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      setTimeout(() => navigate("/home"), 1500);
    },
    onError: (err) => {
      console.error("Login failed", err);
      toast.error(err.message || "Login failed. Please try again.");
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.username || !formData.password) {
      toast.error("Please fill in both fields");
      return;
    }
    loginMutation(formData);
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const tokenId = await result.user.getIdToken();

      const response = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Google Sign-In successful");
        navigate("/");
      } else {
        toast.error(data.message || "Google Sign-In failed");
      }
    } catch (error) {
      console.error("Error during Google Sign-In:", error);
      toast.error("Google Sign-In failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordSubmit = async (e) => {
    e.preventDefault();

    if (!forgotPasswordEmail) {
      toast.error("Please enter your email.");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotPasswordEmail }),
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Password reset email sent! Check your inbox.");
        setIsForgotPasswordOpen(false);
        setForgotPasswordEmail("");
      } else {
        toast.error(data.message || "Failed to send password reset email.");
      }
    } catch (error) {
      console.error("Error in forgot password:", error);
      toast.error("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="login-page-container max-w-screen-xl mx-auto flex h-screen">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="image-container">
        <img src={twitterimg} className="image" alt="Twitter Background" />
      </div>

      <div className="form-section flex-1 flex flex-col justify-center items-center">
        <form className="form flex flex-col gap-4" onSubmit={handleSubmit}>
          <TwitterIcon className="icon-twitter" style={{ color: "skyblue" }} />
          <h1 className="heading">{"Let's"} go.</h1>

          <label className="input-container">
            <MdOutlineMail />
            <input
              type="text"
              className="input-field"
              placeholder="Username"
              name="username"
              onChange={handleInputChange}
              value={formData.username}
              aria-label="Username"
            />
          </label>

          <label className="input-container">
            <MdPassword />
            <div className="input-with-icon">
              <input
                type={passwordVisible ? "text" : "password"}
                className="input-field"
                placeholder="Password"
                name="password"
                onChange={handleInputChange}
                value={formData.password}
                aria-label="Password"
              />
              <button
                type="button"
                className="icon-button"
                onClick={() => setPasswordVisible(!passwordVisible)}
                aria-label="Toggle Password Visibility"
              >
                {passwordVisible ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </label>

          <button
            className="btn-login"
            disabled={isPending || !formData.username || !formData.password}
          >
            {isPending ? "Loading..." : "Login"}
          </button>
          {isError && <p className="error-message">{error?.message || "An error occurred"}</p>}
        </form>

        <GoogleButton
          className="google-btn"
          type="light"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        />

        <button
          className="forgot-password-link"
          onClick={() => setIsForgotPasswordOpen(true)}
        >
          Forgot Password?
        </button>

        <div className="signup-prompt">
          <p>{"Don't"} have an account?</p>
          <Link to="/signup">
            <button className="btn-signup">Sign up</button>
          </Link>
        </div>

        {isForgotPasswordOpen && (
          <div className="forgot-password-modal">
            <div className="modal-content">
              <h2 className="modal-heading">Reset Your Password</h2>
              <p className="modal-subtext">
                Enter your email address to receive a password reset link.
              </p>
              <form onSubmit={handleForgotPasswordSubmit}>
                <label className="input-container">
                  <MdOutlineMail />
                  <input
                    type="email"
                    className="input-field"
                    placeholder="Enter your email"
                    value={forgotPasswordEmail}
                    onChange={(e) => setForgotPasswordEmail(e.target.value)}
                    required
                  />
                </label>
                <button
                  className="btn-submit"
                  type="submit"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </form>
              <button
                className="btn-close"
                onClick={() => setIsForgotPasswordOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
