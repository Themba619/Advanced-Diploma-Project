import React from "react";
import "../styles/LandingPageStyles/landing.css";

function DownloadApp() {
  return (
    <div className="downloadapp-bg">
      <h1 className="downloadapp-title">Get the Core Collective App!</h1>
      <p className="downloadapp-subtitle">
        For the best experience, download our mobile app and join thousands of users who've already transformed their routine.
      </p>
      <div className="downloadapp-phone-container">
        <div className="downloadapp-phone">
          <img src="/DownloadTheApp.webp" alt="Download App" className="downloadapp-phone-img" />
          <span className="downloadapp-badge badge-top">
            <svg width="28" height="28" fill="none"><circle cx="14" cy="14" r="14" fill="#4F6DF5"/><path d="M14 7l2.09 4.26L21 12.27l-3.45 3.36L18.18 21 14 17.77 9.82 21l.63-5.37L7 12.27l4.91-.99L14 7z" fill="#fff"/></svg>
          </span>
          <span className="downloadapp-badge badge-bottom">
            <svg width="28" height="28" fill="none"><circle cx="14" cy="14" r="14" fill="#7C6DF5"/><path d="M14 20l-5.5-9h11L14 20z" fill="#fff"/></svg>
          </span>
        </div>
      </div>
      <div className="downloadapp-card">
        <div className="downloadapp-card-icon">
          <img src="/DownloadTheApp.webp" alt="App Icon" />
        </div>
        <div className="downloadapp-card-content">
          <div className="downloadapp-card-title">DOWNLOAD THE APP NOW!</div>
          <div className="downloadapp-card-desc">For better experience download our app!</div>
          <a href="https://your-app-link.com" target="_blank" rel="noopener noreferrer">
            <button className="downloadapp-btn">
              <svg width="20" height="20" fill="none" style={{marginRight: 8, verticalAlign: "middle"}}><rect width="20" height="20" rx="6" fill="#fff" opacity="0.2"/><path d="M7 10l3 3 3-3" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Download Now
            </button>
          </a>
        </div>
      </div>
    </div>
  );
}

export default DownloadApp;