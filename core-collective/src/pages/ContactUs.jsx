import React, { useState } from 'react';
import '../styles/ContactUsStyles/contactUs.css';

import Email from '../components/Email';
import DirectMessage from '../components/DirectMessage';

const ContactUs = () => {
  const [activeTab, setActiveTab] = useState('email');

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  return ( // line 30
    <div className="container">
      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${activeTab === 'email' ? 'active' : ''}`}
          onClick={() => handleTabClick('email')}
        >
          Email
        </button>
        <button
          className={`tab ${activeTab === 'dm' ? 'active' : ''}`}
          onClick={() => handleTabClick('dm')}
        >
          Direct Message
        </button>
      </div>

      {/* Content */}
      <div className="content">
        <div
          className={`content-section ${activeTab === 'email' ? 'active' : 'hidden left'}`}
        >
          <Email />
        </div>
        <div
          className={`content-section ${activeTab === 'dm' ? 'active' : 'hidden'}`}
        >
          <DirectMessage />
        </div>
      </div>
    </div>
  );
};

export default ContactUs;