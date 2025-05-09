import '../styles/ProfileStyles/profile.css';

export default function Profile() {
  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-picture-container">
          <div className="profile-picture">
            <img src='https://picsum.photos/200' style={{width: 'auto', borderRadius: '50%'}}/>
          </div>
        </div>
        <h2 className="profile-title">John Doe, 2nd Year</h2>
        <div className="profile-details">
          
          <p><span className="profile-label">Faculty:</span> College of Business and Economics</p>
          <p><span className="profile-label">Email:</span> johndoe@example.com</p>
          <p><span className="profile-label">Location:</span> Johannesburg, JHB</p>
          <p><span className="profile-label">Joined:</span> February 2022</p>
        </div>
      </div>
    </div>
  );
}