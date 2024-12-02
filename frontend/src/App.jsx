import { Navigate, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import HomePage from "./pages/home/HomePage";
import LoginPage from "./pages/auth/login/LoginPage";
import SignUpPage from "./pages/auth/signup/SignUpPage";
import NotificationPage from "./pages/notification/NotificationPage";
import ProfilePage from "./pages/profile/ProfilePage";
import Bookmark from "./pages/Bookmark/Bookmark";
import Sidebar from "./components/common/Sidebar";
import RightPanel from "./components/common/RightPanel";
import LoadingSpinner from "./components/common/LoadingSpinner";
import ThemeSwitcher from "./components/ThemeSwitcher";
import List from "./pages/Lists/Lists";
import Message from "./pages/Messages/Messages";
import Explore from "./pages/Explore/Explore";
import More from "./pages/more/More";
import PrivateRoute from "./components/PrivateRoutes";

import { QueryClient } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Disable automatic refetch on window focus
      staleTime: 1000 * 60,       // Data stays fresh for 1 minute
    },
  },
});

import { UserAuthContextProvider } from "./pages/context/UserAuthContext"; // Wrap context correctly
import LanguageSelector from "./components/LanguageSelector";
import ResetPasswordPage from "./pages/auth/login/ResetPassword";


function App() {
  const { data: authUser, isLoading } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      try {
        const res = await fetch("/api/auth/me");
        const data = await res.json();
        if (data.error) return null;
        if (!res.ok) {
          throw new Error(data.error || "Something went wrong");
        }
        console.log("authUser is here:", data);
        return data;
      } catch (error) {
        console.error("Error fetching authUser:", error);
        return null;
      }
    },
    retry: false,
  });

  // Show loading spinner during user authentication check
  if (isLoading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }
  const currentLanguage = "en"; // Default language, you can fetch this dynamically if needed

  const handleLanguageChange = (newLanguage) => {
    console.log("Selected Language:", newLanguage);
  };
  return (
    <QueryClientProvider client={queryClient}>
	
      <UserAuthContextProvider>
  
        <div className="flex max-w-6xl mx-auto">
   
          {/* Sidebar for authenticated users */}
          {authUser && <Sidebar />}
       
          {/* Main App Content */}
          <div className="flex-grow">
          <ThemeSwitcher/>
            <Routes>
              {/* Authenticated Routes */}
              <Route
                path="/"
                element={authUser ? <Navigate to="/home" /> : <Navigate to="/login" />}
              />
              <Route path="/home" element={<PrivateRoute><HomePage /></PrivateRoute>} />
       
              <Route path="/ls" element ={<PrivateRoute>   <LanguageSelector
        currentLanguage={currentLanguage}
        onLanguageChange={handleLanguageChange}
      /></PrivateRoute>}/>
              <Route path="/notifications" element={<PrivateRoute><NotificationPage /></PrivateRoute>} />
              <Route path="/profile/:username" element={<PrivateRoute><ProfilePage /></PrivateRoute>} />
              <Route path="/bookmarks" element={<PrivateRoute><Bookmark /></PrivateRoute>} />
              <Route path="/lists" element={<PrivateRoute><List /></PrivateRoute>} />
              <Route path="/messages" element={<PrivateRoute><Message /></PrivateRoute>} />
              <Route path="/explore" element={<PrivateRoute><Explore /></PrivateRoute>} />
              <Route path="/more" element={<PrivateRoute><More /></PrivateRoute>} />
              <Route path="/reset-password/:token" element={<ResetPasswordPage/>} />
              {/* Public Routes */}
              <Route path="/login" element={!authUser ? <LoginPage /> : <Navigate to="/home" />} />
              <Route path="/signup" element={!authUser ? <SignUpPage /> : <Navigate to="/" />} />
            </Routes>
          </div>

          {/* RightPanel for authenticated users */}
          {authUser && <RightPanel />}
        </div>

        {/* Global Notifications */}
        <Toaster />
      </UserAuthContextProvider>
    </QueryClientProvider>
  );
}

export default App;
