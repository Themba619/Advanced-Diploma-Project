import React, { useState } from "react";
import "../styles/SettingsStyles/Settings.css";
import { FaBell, FaPalette, FaShieldAlt, FaUserCog } from "react-icons/fa";

const Settings = () => {

  const [emailNotifications, setEmailNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [twoFactor, setTwoFactor] = useState(false);

  return (
    <div className="settings-bg">
      <div className="settings-header">
        <FaUserCog className="settings-header-icon" />
        <div>
          <h2 className="settings-title">Settings</h2>
          <div className="settings-subtitle">Manage your account and preferences</div>
        </div>
      </div>

      <form className="settings-form">
        {/* Profile */}
        <section className="settings-card">
          <div className="settings-card-header">
            <span className="settings-card-icon"><FaUserCog /></span>
            <span className="settings-card-title">Profile</span>
          </div>
          <div className="settings-card-desc">Update your personal information and profile details</div>
          <div className="settings-profile-row">
            <div>
              <label className="settings-label">Full Name</label>
              <input className="settings-input" type="text" value="John Doe" disabled />
            </div>
            <div>
              <label className="settings-label">Email Address</label>
              <input className="settings-input" type="email" value="john@example.com" disabled />
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="settings-card">
          <div className="settings-card-header">
            <span className="settings-card-icon"><FaBell /></span>
            <span className="settings-card-title">Notifications</span>
          </div>
          <div className="settings-card-desc">Control how you receive notifications and updates</div>
          <div className="settings-row">
            <div>
              <div className="settings-label-bold">Email Notifications</div>
              <div className="settings-desc">Receive notifications about updates and activities</div>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={() => setEmailNotifications((v) => !v)}
              />
              <span className="settings-slider"></span>
            </label>
          </div>
        </section>

        {/* Appearance */}
        <section className="settings-card">
          <div className="settings-card-header">
            <span className="settings-card-icon"><FaPalette /></span>
            <span className="settings-card-title">Appearance</span>
          </div>
          <div className="settings-card-desc">Customize the look and feel of your interface</div>
          <div className="settings-row">
            <div>
              <div className="settings-label-bold">Dark Mode</div>
              <div className="settings-desc">Switch between light and dark themes</div>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={darkMode}
                onChange={() => setDarkMode((v) => !v)}
              />
              <span className="settings-slider"></span>
            </label>
          </div>
        </section>

        {/* Security */}
        <section className="settings-card">
          <div className="settings-card-header">
            <span className="settings-card-icon"><FaShieldAlt /></span>
            <span className="settings-card-title">Security</span>
          </div>
          <div className="settings-card-desc">Manage your account security and privacy settings</div>
          <div className="settings-row">
            <div>
              <div className="settings-label-bold">Two-Factor Authentication</div>
              <div className="settings-desc">Add an extra layer of security to your account</div>
            </div>
            <label className="settings-switch">
              <input
                type="checkbox"
                checked={twoFactor}
                onChange={() => setTwoFactor((v) => !v)}
              />
              <span className="settings-slider"></span>
            </label>
          </div>
          <hr className="settings-divider" />
          <div className="settings-actions">
            <button type="button" className="settings-btn settings-btn-outline">Change Password</button>
            <button type="button" className="settings-btn settings-btn-outline">Update Password</button>
          </div>
        </section>

        {/* Save Changes Button */}
        <div className="settings-save-row">
          <button type="button" className="settings-btn settings-btn-primary">Save Changes</button>
        </div>
      </form>
    </div>
  );
}

export default Settings