import React from 'react';
import { MessageCircle } from 'lucide-react';

const ContactSupport = () => {
  const handleContactClick = () => {
    // This would typically open a chat widget or redirect to support
    window.open('mailto:support@uj.ac.za', '_blank');
  };

  return (
    <button
      onClick={handleContactClick}
      className="fixed bottom-8 right-8 bg-uj-red hover:bg-uj-blue text-white p-4 rounded-full shadow-lg transition-all duration-300 hover:scale-110 z-50 flex items-center justify-center"
      aria-label="Contact Support"
    >
      <MessageCircle className="h-6 w-6" />
    </button>
  );
};

export default ContactSupport;