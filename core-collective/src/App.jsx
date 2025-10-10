// import React from "react";
// import { Routes, Route } from "react-router-dom";
// import DrawerNavigation from "./drawer_navigation_folder/DrawerNavigation";
// import Home from "./pages/Home";
// import ChatForum from "./pages/ChatForum";
// import Profile from "./pages/Profile";
// import Settings from "./pages/Settings";
// import ForumChat from "./pages/Forum";
// // import Forum from "./pages/Forum"; Replaced this with my one
// import LoginPage from './pages/Login';
// import Signup from './pages/Signup';
// import '@fortawesome/fontawesome-free/css/all.min.css';

// function App() {

//   return (
//     <DrawerNavigation>
//       <Routes>
//         <Route path="/" element={<Home />} />
//         <Route path="/chatforum" element={<ChatForum />} />
//         <Route path="/profile" element={<Profile />} />
//         <Route path="/settings" element={<Settings />} />
//         <Route path="/forum" element={<ForumChat />} />
//       </Routes>
//     </DrawerNavigation>
//     // <Router>
//     //   <Routes>
//     //   <Route path="/" element={<LoginPage />} />
//     //   <Route path="/" element={<Signup />} />
//     // </Routes>
//     // </Router>
//   );
// }

// export default App;

// import React from "react";
// import { Routes, Route } from "react-router-dom";
// import DrawerNavigation from "./drawer_navigation_folder/DrawerNavigation";
// import Home from "./pages/Home";
// import ChatForum from "./pages/ChatForum";
// import Profile from "./pages/Profile";
// import Settings from "./pages/Settings";
// import ForumChat from "./pages/Forum";
// import LoginPage from "./pages/Login";
// import Signup from "./pages/Signup";
// import ForgotPwd from "./pages/ForgotPwd";
// import "@fortawesome/fontawesome-free/css/all.min.css";

// function App() {
//   return (
//     <Routes>
//       {/* Unauthenticated routes (no DrawerNavigation) */}
//       <Route path="/login" element={<LoginPage />} />
//       <Route path="/signup" element={<Signup />} />
//       <Route path="/forgotPwd" element={<ForgotPwd />}/>
//       {/* Default route to Login */}
//       <Route path="/" element={<LoginPage />} />
//       {/* Authenticated routes (with DrawerNavigation) */}
//       <Route
//         path="/*"
//         element={
//           <DrawerNavigation>
//             <Routes>
//               <Route path="/home" element={<Home />} />
//               <Route path="/chatforum" element={<ChatForum />} />
//               <Route path="/profile" element={<Profile />} />
//               <Route path="/settings" element={<Settings />} />
//               <Route path="/forum" element={<ForumChat />} />
//             </Routes>
//           </DrawerNavigation>
//         }
//       />
//     </Routes>
//   );
// }

// export default App;

import React from "react";
import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "./components/ui/ForumUi/tooltip";
import { Toaster } from "./components/ui/ForumUi/toaster";
import { Toaster as Sonner } from "./components/ui/ForumUi/sonner";
import DrawerNavigation from "./drawer_navigation_folder/DrawerNavigation";
import Home from "./pages/Home";
import ChatForum from "./pages/ChatForum";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import ForumChat from "./pages/Forum";
import LoginPage from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPwd from "./pages/ForgotPwd";
import OTP from "./pages/OTP";
import ContactUs from "./pages/ContactUs";
import DownloadApp from "./pages/DownloadApp";
import ChatPerformanceTest from "./pages/ChatPerformanceTest";
import LandingPage from "./pages/LandingPage";
import AdminPanel from "./pages/AdminPanel";
import HomeLanding from "./pages/HomeLanding";
import "@fortawesome/fontawesome-free/css/all.min.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <Routes>
          {/* Unauthenticated routes (no DrawerNavigation) */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgotPwd" element={<ForgotPwd />} />
          <Route path="/forgot-password" element={<ForgotPwd />} />
          <Route path="/otp" element={<OTP />} />
          <Route path="/admin" element={<AdminPanel />} />
          {/* <Route path="/" element={<LoginPage />} /> */}
          <Route path="/" element={<LandingPage />} />
          {/* Authenticated routes (with DrawerNavigation) */}
          <Route element={<DrawerNavigation />}>
            <Route path="/home" element={<Home />} />
            <Route path="/chatforum" element={<ChatForum />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/forum" element={<ForumChat />} />
            <Route path="/contactUs" element={<ContactUs />} />
            <Route path="/performance" element={<ChatPerformanceTest />} />
            <Route path="/homeLanding" element={<HomeLanding />} />
            <Route path="*" element={<DownloadApp />} />
          </Route>
        </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;