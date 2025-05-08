import '../styles/ProfileStyles/profile.css';

export default function Profile() {
  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-picture-container">
          <div className="profile-picture">
            Profile Picture
          </div>
        </div>
        <h2 className="profile-title">John Doe, 1st Year</h2>
        <div className="profile-details">
          <p><span className="profile-label">Faculty:</span> College of Business and Economics</p>
          <p><span className="profile-label">Email:</span> johndoe@example.com</p>
          <p><span className="profile-label">Location:</span> Johannesburg, JHB</p>
          <p><span className="profile-label">Joined:</span> May 2025</p>
        </div>
      </div>
    </div>
  );
}