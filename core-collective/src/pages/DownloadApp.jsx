// filepath: c:\Users\themb\projects\yearProject\Advanced-Diploma-Project\core-collective\src\pages\DownloadApp.jsx
import React from "react";

function DownloadApp() {
  return (
    <div style={{ textAlign: "center", marginTop: "4rem" }}>
      <h1>Get the Core Collective App!</h1>
      <p>For the best experience, download our mobile app.</p>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <img src="/DownloadTheApp.webp" alt="Download App" style={{ maxWidth: 600, width: "100%", height: "auto" }} />
      </div>
      <br />
      <a href="https://your-app-link.com" target="_blank" rel="noopener noreferrer">
        <button>Download Now</button>
      </a>
    </div>
  );
}

export default DownloadApp;