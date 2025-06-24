import React from "react";

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isOpen, onToggle }) => (
  <div className="border rounded-lg">
    <button
      className="w-full text-left px-4 py-3 font-semibold flex justify-between items-center"
      onClick={onToggle}
      aria-expanded={isOpen}
    >
      {question}
      <span>{isOpen ? "▲" : "▼"}</span>
    </button>
    {isOpen && (
      <div className="px-4 pb-4 text-gray-700">
        {answer}
      </div>
    )}
  </div>
);

export default FAQItem;