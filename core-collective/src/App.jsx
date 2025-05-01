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
import NotFound from "./pages/NotFound";
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
          {/* Default route to Login */}
          <Route path="/" element={<LoginPage />} />
          {/* Authenticated routes (with DrawerNavigation) */}
          <Route
            path="/*"
            element={
              <DrawerNavigation>
                <Routes>
                  <Route path="/home" element={<Home />} />
                  <Route path="/chatforum" element={<ChatForum />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/forum" element={<ForumChat />} />
                  {/* Catch-all for undefined authenticated routes */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </DrawerNavigation>
            }
          />
        </Routes>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;