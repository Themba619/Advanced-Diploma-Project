import React, { useState, useEffect } from "react";
import { Link, useNavigate, Outlet } from "react-router-dom";
import { Menu } from "lucide-react";
import {
  FaEnvelope,
  FaGift,
  FaQuestionCircle,
  FaUserCircle,
  FaExternalLinkAlt
} from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import "../styles/drawerNavStyles/DrawerNavigation.css";
import SplitText from "../react_bits/src/blocks/TextAnimations/SplitText/SplitText";

const DrawerNavigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [userName, setUserName] = useState("User");

  const navigate = useNavigate();

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
    <div className="drawer-container">
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
            <FaEnvelope size={20} />
          </button>
          <button
            className="icon-btn"
            title="Announcements"
            onClick={() => setShowAnnouncements(true)}
          >
            <FaGift size={20} />
          </button>
          <button
            className="icon-btn"
            title="Help"
            onClick={() => setShowHelp(true)}
          >
            <FaQuestionCircle size={20} />
          </button>
          <button
            className="icon-btn"
            title="Profile"
            onClick={() => setShowProfile(true)}
          >
            <FaUserCircle size={22} />
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

        {/* Navigation Links */}
        <nav className="drawer-nav">
          <Link 
            to="/home" 
            className="nav-link"
            onClick={() => setIsOpen(false)}
          >
            Home
          </Link>
          <Link 
            to="/forum" 
            className="nav-link"
            onClick={() => setIsOpen(false)}
          >
            Virtual Chat
          </Link>
          <Link 
            to="/profile" 
            className="nav-link"
            onClick={() => setIsOpen(false)}
          >
            Profile
          </Link>
          <Link 
            to="/settings" 
            className="nav-link"
            onClick={() => setIsOpen(false)}
          >
            Settings
          </Link>
          <Link 
            to="/contactUs" 
            className="nav-link"
            onClick={() => setIsOpen(false)}
          >
            Contact-us
          </Link>

          <div className="drawer-nav-bottom">
            <button
              className="logout-btn"
              onClick={() => {
                localStorage.removeItem("token");
                setIsOpen(false);
                navigate("/login");
              }}
            >
              Logout <FaExternalLinkAlt size={14} />
            </button>
          </div>
        </nav>
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