import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import TwitterIcon from "@mui/icons-material/Twitter";
import GoogleButton from "react-google-button";
import twitterimg from "../../image/twitter.jpeg";
import { auth, provider } from "../../context/firebase"; // Import from your Firebase config
import { signInWithPopup } from "firebase/auth"; // Only import what's needed from Firebase
import { FaEye, FaEyeSlash } from "react-icons/fa"; // Import eye icons
import "./signup.css";

const SignUpPage = () => {
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    username: "",
    fullName: "",
    password: "",
  });
  const [passwordVisible, setPasswordVisible] = useState(false); // State for toggling password visibility
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const navigate = useNavigate(); // Hook to navigate

  const { mutate, error } = useMutation({
    mutationFn: async (formData) => {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create account");
      return data;
    },
    onSuccess: () => {
      toast.success("Account created successfully");
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    onError: () => toast.error("Sign-up failed. Please try again."),
  });

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, provider);
      const tokenId = await result.user.getIdToken(); // Get Google ID Token

      const response = await fetch("http://localhost:5000/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tokenId }), // Send ID token to the backend
      });

      const data = await response.json();

      if (response.ok) {
        toast.success("Google Sign-In successful");
        navigate("/home"); // Navigate to the home page after successful Google sign-in
        toast.success("Account created successfully");
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

  const handleSubmit = (e) => {
    e.preventDefault();
    mutate(formData);
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="signup-page max-w-screen-xl mx-auto flex h-screen px-10">
      <div className="image-container">
        <img className="image" src={twitterimg} alt="twitterimage" />
      </div>

      <div className="form-container">
        <div>
          <TwitterIcon className="twitter-icon" style={{ color: "skyblue" }} />
          <h2 className="heading">Happening now</h2>
          <h3 className="heading1">Join Twiller today</h3>

          {error && <p className="error-message">{error.message}</p>}

          <form onSubmit={handleSubmit}>
            <input
              className="input-field"
              type="text"
              name="username"
              placeholder="@username"
              value={formData.username}
              onChange={handleInputChange}
            />
            <input
              className="input-field"
              type="text"
              name="fullName"
              placeholder="Enter Full Name"
              value={formData.fullName}
              onChange={handleInputChange}
            />
            <input
              className="input-field"
              type="email"
              name="email"
              placeholder="Email Address"
              value={formData.email}
              onChange={handleInputChange}
            />
            <input
              className="input-field"
              type="phone"
              name="phone"
              placeholder="Phone Number"
              value={formData.phone}
              onChange={handleInputChange}
            />
            <div className="input-with-icon">
              <input
                className="input-field"
                type={passwordVisible ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
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
            <button type="submit" className="btn">
              Sign Up
            </button>
          </form>

          <hr />
          <div>
            <GoogleButton
              className="g-btn"
              type="light"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            />
          </div>

          <p>
            Already have an account?{" "}
            <Link to="/login" className="login-link">
              Log In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;
