import React from "react";
import { Routes, Route } from "react-router-dom";
import DrawerNavigation from "./drawer_navigation_folder/DrawerNavigation";
import Home from "./pages/Home";
import ChatForum from "./pages/ChatForum";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import ForumChat from "./pages/Forum";
import Forum from "./pages/Forum";

function App() {

  return (
    <DrawerNavigation>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chatforum" element={<ChatForum />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/forum" element={<ForumChat />} />
      </Routes>
    </DrawerNavigation>
  );
}

export default App;