import React, { useState } from 'react';
import '../styles/ProfileStyles/Profiles.css';

const Profile = () => {
  // Dummy data
  const [profileName, setProfileName] = useState('David Slade Manson');
  const [username] = useState('DavidSlade');
  const [status, setStatus] = useState('Busy with assignments');
  const [course, setCourse] = useState('Computer Science');
  const [studyYear, setStudyYear] = useState('2');

  return (
    <div className="profile-container">
      <div className="profile-picture-section">
        <div className="profile-picture">
          {/* Replace with <img src={...}/> for real avatar */}
          <div className="profile-avatar-circle">👤</div>
        </div>
        <button className="profile-btn profile-btn-blue">Change picture</button>
        <button className="profile-btn profile-btn-red">Delete picture</button>
      </div>

      <div className="profile-form">
        <label>Profile name</label>
        <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} />

        <label>Username</label>
        <div className="profile-username-row">
          <span className="profile-username-at">@</span>
          <input type="text" value={username} disabled />
        </div>
        <div className="profile-username-note">Available change in 25/04/2024</div>

        <label>Status recently</label>
        <input type="text" value={status} onChange={e => setStatus(e.target.value)} />

        <label>Course</label>
        <input type="text" value={course} onChange={e => setCourse(e.target.value)} />

        <label>Study year</label>
        <input type="number" min="1" max="6" value={studyYear} onChange={e => setStudyYear(e.target.value)} />
      </div>

      <div className="profile-save-row">
        <button className="profile-save-btn" disabled>Save changes</button>
      </div>
    </div>
  );
};

export default Profile;