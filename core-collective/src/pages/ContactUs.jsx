import React, { useState } from 'react';
import '../styles/ContactUsStyles/contactUs.css';

import Email from '../components/Email';
import FAQPageComp from '../components/FAQPageComp';


const faqData = [
  {
    question: "How do I access my student email and online portals?",
    answer: "Use your student number and password to log into ULink for academic records, Blackboard for course materials, and Gmail with your UJ email address."
  },
  {
    question: "Where can I get my student card and what services does it provide?",
    answer: "Visit the Student Enrolment Centre with your ID and registration proof. Your card provides library access, meal plan payments, and building entry."
  },
  {
    question: "What academic support services are available on campus?",
    answer: "UJ offers tutoring at the Academic Development Centre, writing support at the Writing Centre, and subject-specific help through faculty mentoring programs."
  },
  {
    question: "How do I join student societies and clubs?",
    answer: "Visit the Student Life Centre or attend O-Week activities. Popular options include academic societies, sports clubs, cultural groups, and the SRC student government."
  },
  {
    question: "What library resources and study spaces are available?",
    answer: "Each campus has libraries with study rooms, computer labs, and group spaces. Book online or visit in person. Libraries also provide research assistance and printing services."
  },
  {
    question: "How does campus transportation and parking work?",
    answer: "UJ shuttles run between campuses. Student parking permits are available through Campus Control. Use Rea Vaya buses for off-campus transport with student discounts."
  },
  {
    question: "Where can I get food on campus and how do meal plans work?",
    answer: "Campus dining halls, cafeterias, and food courts accept cash, card, or meal plan credits. Load money onto your student card for convenient campus purchases."
  },
  {
    question: "What health and wellness services are available?",
    answer: "Campus Health provides medical services, counseling, and wellness programs. Emergency contacts and mental health support are available 24/7 through Student Affairs."
  },
  {
    question: "How do I add/drop courses or change my academic program?",
    answer: "Contact your faculty's Student Academic Services during add/drop periods. Changes may affect financial aid and graduation timeline, so consult your academic advisor first."
  },
  {
    question: "What career services and internship opportunities exist?",
    answer: "The Career Centre offers job placement assistance, CV workshops, interview prep, and connects you with internship partners and graduate employment opportunities."
  },
  {
    question: "How do I resolve academic or administrative issues?",
    answer: "Start with your lecturer or faculty office. For complex issues, contact Student Affairs or use the official UJ complaint process. Keep records of all communications."
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