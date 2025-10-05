import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { Outlet } from "react-router-dom";
import { FaEnvelope, FaGift, FaQuestionCircle, FaUserCircle, FaExternalLinkAlt, FaMoon, FaSun, FaBell } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import "../styles/drawerNavStyles/DrawerNavigation.css";
import SplitText from "../react_bits/src/blocks/TextAnimations/SplitText/SplitText";

const DrawerNavigation = () => {
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
        <SplitText
          text="Core Collective"
          className="top-nav-title"
          delay={100}
          duration={0.6}
          ease="power3.out"
          splitType="chars"
          from={{ opacity: 0, y: 40 }}
          to={{ opacity: 1, y: 0 }}
          threshold={0.1}
          rootMargin="-100px"
          textAlign="center"
        />
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
            <FaBell size={24} />
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
          <Link
            to="/home"
            className={`nav-link ${location.pathname === '/home' ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            Home
          </Link>
          <Link
            to="/forum"
            className={`nav-link ${location.pathname === '/forum' ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            Chat Forum
          </Link>
          <Link
            to="/profile"
            className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            Profile
          </Link>
          <Link
            to="/settings"
            className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            Settings
          </Link>
          <Link
            to="/contactUs"
            className={`nav-link ${location.pathname === '/contactUs' ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
          >
            Contact-us
          </Link>
        </nav>
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
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="overlay"
        />
      )}

      {/* Right Sidebars */}
      {showAnnouncements && (
        <>
          <div className="right-sidebar-overlay" onClick={() => setShowAnnouncements(false)} />
          <div className="right-sidebar">
            <div className="right-sidebar-header">
              <span>Announcements</span>
              <button className="close-button" onClick={() => setShowAnnouncements(false)}>×</button>
            </div>
            <div className="right-sidebar-content">
              <strong className="sidebar-content-title">What's new 🎁</strong>
              <ul className="sidebar-list">
                <li>Welcome to Core Collective!</li>
                <li>New features coming soon.</li>
              </ul>
            </div>
          </div>
        </>
      )}
      {showHelp && (
        <>
          <div className="right-sidebar-overlay" onClick={() => setShowHelp(false)} />
          <div className="right-sidebar">
            <div className="right-sidebar-header">
              <span>Help</span>
              <button className="close-button" onClick={() => setShowHelp(false)}>×</button>
            </div>
            <div className="right-sidebar-content">
              <p className="sidebar-content-title">Useful UJ Links:</p>
              <ul className="uj-help-links">
                <li>
                  <a
                    href="https://www.uj.ac.za/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="uj-help-link"
                  >
                    <FaExternalLinkAlt className="uj-help-link-icon" />
                    UJ Main Website
                  </a>
                </li>
                <li>
                  <a
                    href="https://ulink.uj.ac.za/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="uj-help-link"
                  >
                    <FaExternalLinkAlt className="uj-help-link-icon" />
                    ULink Student Portal
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.uj.ac.za/library/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="uj-help-link"
                  >
                    <FaExternalLinkAlt className="uj-help-link-icon" />
                    UJ Library
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.uj.ac.za/about/student-support/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="uj-help-link"
                  >
                    <FaExternalLinkAlt className="uj-help-link-icon" />
                    Student Support
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.uj.ac.za/admission-aid/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="uj-help-link"
                  >
                    <FaExternalLinkAlt className="uj-help-link-icon" />
                    Admissions & Aid
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.uj.ac.za/contact-us/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="uj-help-link"
                  >
                    <FaExternalLinkAlt className="uj-help-link-icon" />
                    Contact UJ
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </>
      )}
      {showProfile && (
        <>
          <div className="right-sidebar-overlay" onClick={() => setShowProfile(false)} />
          <div className="right-sidebar profile-sidebar">
            <div className="right-sidebar-header profile-header">
              <div className="profile-avatar">
                <div className="profile-avatar-circle">
                  <span style={{ fontSize: "2.0rem", color: "#fff" }}>👤</span>
                </div>
              </div>
              <div className="profile-info">
                <div className="profile-name">themba Biyela</div>
                <div className="profile-email">thembabiyela20@gmail.com</div>
              </div>
              <button className="close-button" onClick={() => setShowProfile(false)}>×</button>
            </div>
            <div className="right-sidebar-content profile-content">
              <ul className="profile-list">
                <li
                  className="profile-list-item"
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setShowProfile(false);
                    navigate("/profile");
                  }}
                >
                  Profile
                </li>
                <li
                  className="profile-list-item"
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setShowProfile(false);
                    navigate("/settings");
                  }}
                >
                  Settings
                </li>
              </ul>
              <hr className="profile-divider" />
              <ul className="profile-list">
                <li
                  className="profile-list-item signout"
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setShowProfile(false);
                    navigate("/");
                  }}
                >
                  Sign out
                </li>
              </ul>
            </div>
          </div>
        </>
      )}
      {/* Main content */}
      <div className="main-content"><Outlet /></div>
    </div>
  );
};

export default DrawerNavigation;