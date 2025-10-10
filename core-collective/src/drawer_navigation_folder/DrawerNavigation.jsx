import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Outlet } from "react-router-dom";
import { FaEnvelope, FaGift, FaQuestionCircle, FaUserCircle, FaExternalLinkAlt, FaMoon, FaSun, FaHome, FaComments, FaUser, FaCog, FaPhoneAlt, FaRocket } from "react-icons/fa";
import { jwtDecode } from "jwt-decode";
import "../styles/drawerNavStyles/DrawerNavigation.css";
import SplitText from "../react_bits/src/blocks/TextAnimations/SplitText/SplitText";
import VALogo from "../assets/Logo.png";
import NotificationList from "../components/NotificationList";

const DrawerNavigation = () => {
  const [isOpen, setIsOpen] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [userName, setUserName] = useState("User");
  const [userEmail, setUserEmail] = useState("");
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
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
        if (decoded.email) {
          setUserEmail(decoded.email);
          // Fetch initial notification count
          fetchUnreadNotificationCount(decoded.email);
        }
      } catch (err) {
        console.error("Failed to decode token:", err);
      }
    }

    // Handle responsive behavior
    const handleResize = () => {
      if (window.innerWidth <= 600) {
        setIsOpen(false);
        setIsCollapsed(false);
      } else {
        setIsOpen(true);
        setIsCollapsed(true);
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Call on mount

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Fetch unread notification count
  const fetchUnreadNotificationCount = async (email) => {
    try {
      const response = await fetch(`http://localhost:3001/api/notifications/unread-count/${encodeURIComponent(email)}`);
      if (response.ok) {
        const data = await response.json();
        setUnreadNotificationCount(data.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread notification count:', error);
    }
  };

  // Handle notification count updates
  const handleNotificationUpdate = (newCount) => {
    setUnreadNotificationCount(newCount);
  };

  return (
    <div className={`drawer-container ${darkMode ? 'dark-mode' : 'light-mode'}`}>
      {/* Top Nav */}
      <div className="top-nav">
        <img 
          src={VALogo} 
          alt="VirtualAssist Logo" 
          className="logo-image"
          onClick={() => navigate("/home")}
        />
        <SplitText
          text="Virtual Assist"
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
            className="icon-btn notification-btn"
            title="Announcements"
            onClick={() => setShowAnnouncements(true)}
          >
            <FaGift size={24} />
            {unreadNotificationCount > 0 && (
              <span className="notification-badge">
                {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
              </span>
            )}
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
      <div className={`drawer ${isOpen ? "drawer-open" : "drawer-closed"} ${isCollapsed ? "drawer-collapsed" : "drawer-expanded"}`}>
        <div className="drawer-header">
          {!isCollapsed && <span className="drawer-title">Hey there, {userName}!</span>}
        </div>

        {/* Links */}
        <nav className="drawer-nav">
          <Link
            to="/homeLanding"
            className={`nav-link ${location.pathname === '/homeLanding' ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
            title="Home Landing"
          >
            <FaRocket size={20} />
            <span className="nav-text">Home Landing</span>
          </Link>
          <Link
            to="/home"
            className={`nav-link ${location.pathname === '/home' ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
            title="Home"
          >
            <FaHome size={20} />
            <span className="nav-text">Home</span>
          </Link>
          
          <Link
            to="/forum"
            className={`nav-link ${location.pathname === '/forum' ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
            title="Chat Forum"
          >
            <FaComments size={20} />
            <span className="nav-text">Chat Forum</span>
          </Link>
          <Link
            to="/profile"
            className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
            title="Profile"
          >
            <FaUser size={20} />
            <span className="nav-text">Profile</span>
          </Link>
          <Link
            to="/settings"
            className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
            title="Settings"
          >
            <FaCog size={20} />
            <span className="nav-text">Settings</span>
          </Link>
          <Link
            to="/contactUs"
            className={`nav-link ${location.pathname === '/contactUs' ? 'active' : ''}`}
            onClick={() => setIsOpen(false)}
            title="Contact Us"
          >
            <FaPhoneAlt size={20} />
            <span className="nav-text">Contact Us</span>
          </Link>
        </nav>
        <div className="drawer-bottom-controls">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="collapse-toggle-button"
            aria-label={isCollapsed ? "Expand menu" : "Collapse menu"}
            title={isCollapsed ? "Expand menu" : "Collapse menu"}
          >
            {isCollapsed ? ">" : "<"}
          </button>
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
      </div>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="overlay mobile-only"
        />
      )}

      {/* Right Sidebars */}
      {showAnnouncements && (
        <>
          <div className="right-sidebar-overlay" onClick={() => setShowAnnouncements(false)} />
          <div className="right-sidebar">
            <div className="right-sidebar-header">
              <span>Notifications</span>
              <button className="close-button" onClick={() => setShowAnnouncements(false)}>×</button>
            </div>
            <div className="right-sidebar-content">
              <NotificationList 
                userEmail={userEmail} 
                onNotificationUpdate={handleNotificationUpdate}
              />
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
            <div className="right-sidebar-content traditional">
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
                <div className="profile-name">{userName}</div>
                <div className="profile-email">{userEmail}</div>
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