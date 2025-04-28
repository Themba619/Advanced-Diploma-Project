

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Menu } from "lucide-react";
import "../styles/drawerNavStyles/DrawerNavigation.css";

const DrawerNavigation = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);

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
        <h1 className="top-nav-title">Core Collective</h1>
      </div>

      {/* Drawer */}
      <div
        className={`drawer ${isOpen ? "drawer-open" : "drawer-closed"}`}
      >
        <div className="drawer-header">
          <span className="drawer-title">Hey there, User!</span>
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
            to="/"
            className="nav-link"
            onClick={() => setIsOpen(false)}
          >
            Home
          </Link>
          <Link
            to="/chatforum"
            className="nav-link"
            onClick={() => setIsOpen(false)}
          >
            Chat Forum
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
        </nav>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="overlay"
        />
      )}

      {/* Main content */}
      <div className="main-content">{children}</div>
    </div>
  );
};

export default DrawerNavigation;