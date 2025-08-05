import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { Outlet } from "react-router-dom";
import { FaEnvelope, FaGift, FaQuestionCircle, FaUserCircle, FaMoon, FaSun } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";

import "../styles/drawerNavStyles/DrawerNavigation.css";

const DrawerNavigation = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [userName, setUserName] = useState("User");
  const navigate = useNavigate();
  const location = useLocation();

  const handleThemeToggle = () => {
    setDarkMode((prev) => !prev);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.fullName) {
          setUserName(decoded.fullName);
        } else if (decoded.email) {
          setUserName(decoded.email);
        }
      } catch (err) {
        console.error("Failed to decode token:", err);
      }
    }
  }, []);

  return (
    <div className={`drawer-container ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Top Nav */}
      <div className="top-nav">
        <button
          onClick={() => setIsOpen(true)}
          className="menu-button"
          aria-label="Open menu"
          aria-expanded={isOpen}
        >
          <Menu size={26} />
        </button>
        <h1 className="top-nav-title">Core Collective</h1>
        <div className="top-nav-right">
          <button
            className="icon-btn"
            title="Contact Us"
            onClick={() => navigate("/contactUs")}
          >
            <FaEnvelope size={24} />
          </button>
          <button
            className="icon-btn"
            title="Announcements"
            onClick={() => setShowAnnouncements(true)}
          >
            <FaGift size={24} />
          </button>
          <button
            className="icon-btn"
            title="Help"
            onClick={() => setShowHelp(true)}
          >
            <FaQuestionCircle size={24} />
          </button>
          <button
            className="icon-btn"
            title="Profile"
            onClick={() => setShowProfile(true)}
          >
            <FaUserCircle size={28} />
          </button>
        </div>
      </div>

      {/* Drawer */}
      <div className={`drawer ${isOpen ? "drawer-open" : "drawer-closed"}`}>
        <div className="drawer-header">
          <span className="drawer-title">Hey there, {userName}!</span>
          <button
            onClick={() => setIsOpen(false)}
            className="close-button"
            aria-label="Close menu"
          >
            ×
          </button>
        </div>

        {/* Links */}
        <nav className="drawer-nav">
          <Link to="/home" className={`nav-link ${location.pathname === '/home' ? 'active' : ''}`} onClick={() => setIsOpen(false)}>Home</Link>
          <Link to="/forum" className={`nav-link ${location.pathname === '/forum' ? 'active' : ''}`} onClick={() => setIsOpen(false)}>Chat Forum</Link>
          <Link to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`} onClick={() => setIsOpen(false)}>Profile</Link>
          <Link to="/settings" className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`} onClick={() => setIsOpen(false)}>Settings</Link>
          <Link to="/contactUs" className={`nav-link ${location.pathname === '/contactUs' ? 'active' : ''}`} onClick={() => setIsOpen(false)}>Contact-us</Link>
        </nav>

        {/* Theme Toggle */}
        <div className="drawer-theme-toggle">
          <button
            onClick={handleThemeToggle}
            className="theme-button"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <FaSun size={24} className="theme-icon" /> : <FaMoon size={24} className="theme-icon" />}
          </button>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && <div onClick={() => setIsOpen(false)} className="overlay" />}

      <div className="main-content">
        <Outlet />
      </div>
    </div>
  );
};

export default DrawerNavigation;