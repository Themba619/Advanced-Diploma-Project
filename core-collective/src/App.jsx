import React from "react";
import { Routes, Route } from "react-router-dom";
import DrawerNavigation from "./drawer_navigation_folder/DrawerNavigation";
import Home from "./pages_folder/Home";
import ChatForum from "./pages_folder/ChatForum";
import Profile from "./pages_folder/Profile";
import Settings from "./pages_folder/Settings";

function App() {

  return (
    <DrawerNavigation>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chatforum" element={<ChatForum />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </DrawerNavigation>
  );
}

export default App;
