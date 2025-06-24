import React, { useState } from 'react';
import '../styles/ContactUsStyles/contactUs.css';

import Email from '../components/Email';
import FAQPageComp from '../components/FAQPageComp';


const faqData = [
  {
    question: "When do applications open and close?",
    answer: "Applications open on April 1 and close on October 31 each year. No late applications are accepted."
  },
  {
    question: "How long until I hear back after applying?",
    answer: "You'll receive an email with your student number immediately. Final decisions can take up to 15 working days."
  },
  {
    question: "How many programmes can I apply to?",
    answer: "You may apply for up to two undergraduate (or postgraduate) programmes. You can't change choices later."
  },
  {
    question: "Do I need to pay to apply?",
    answer: "No, UJ's online application is free."
  },
  {
    question: "What documents are required with my application?",
    answer: "If you're a Grade 12 student, no documents are needed. Transfers must upload certified transcripts."
  },
  {
    question: "When is first-year registration?",
    answer: "It usually takes place between mid-January and early February (depending on matric results)."
  },
  {
    question: "How is registration secured?",
    answer: "UJ uses facial-recognition via SMS link to confirm your identity during registration."
  },
  {
    question: "How can I navigate between campuses?",
    answer: "UJ provides a shuttle service between campuses. Rea Vaya buses also serve most UJ locations."
  },
  {
    question: "What student accommodation is available?",
    answer: "UJ offers male, female, and mixed-gender residences like Kilimanjaro, Horizon, and Mayine."
  },
  {
    question: "How do I pay for tuition or apply for bursaries?",
    answer: "Visit Student Finance or use the Finance portal. NSFAS, SRC Trust, and merit bursaries are available."
  },
  {
    question: "How do I avoid scams during registration?",
    answer: "UJ is a cashless campus. Never pay anyone privately—use only official platforms. Report scams immediately."
  },
];

const ContactUs = () => {
  const [activeTab, setActiveTab] = useState('email');

  const handleTabClick = (tab) => {
    setActiveTab(tab);
  };

  return ( 
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
          className={`tab ${activeTab === 'faq' ? 'active' : ''}`}
          onClick={() => handleTabClick('faq')}
        >
          FAQ
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
          className={`content-section ${activeTab === 'faq' ? 'active' : 'hidden'}`}
        >
          <FAQPageComp faqData={faqData}/>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;