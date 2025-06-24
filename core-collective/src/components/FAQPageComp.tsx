import React from "react";
import FAQItem from "../components/FAQItem";
import BackToTop from "../components/BackToTop";
import ContactSupport from "../components/ContactSupport";
import '../styles/FAQPageComp.css';

interface FAQPageCompProps {
  faqData: { question: string; answer: string }[];
}

const FAQPageComp: React.FC<FAQPageCompProps> = ({ faqData }) => {
  const [openItems, setOpenItems] = React.useState<Set<number>>(new Set());

  const toggleItem = (index: number) => {
    const newOpenItems = new Set(openItems);
    if (newOpenItems.has(index)) {
      newOpenItems.delete(index);
    } else {
      newOpenItems.add(index);
    }
    setOpenItems(newOpenItems);
  };

  return (
    <div className="bg-white font-roboto">
      {/* Header */}
      <header className="bg-uj-blue text-white py-8 mb-8">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-2">
            UJ First-Year FAQ
          </h1>
          <p className="text-xl text-center text-blue-100">
            Everything you need to know as a new UJ student
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 pb-20"
        style={{
            flex: 1,
            overflowY: 'auto',
            minHeight: 0,
        }}
      >
        <div className="max-w-4xl mx-auto">
          {/* Introduction */}
          <div className="text-center mb-12">
            <h2 className="text-2xl font-semibold text-uj-blue mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-gray-600 text-lg">
              Find answers to the most common questions about starting your
              journey at the University of Johannesburg.
            </p>
          </div>

          {/* FAQ Items */}
          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <FAQItem
                key={index}
                question={faq.question}
                answer={faq.answer}
                isOpen={openItems.has(index)}
                onToggle={() => toggleItem(index)}
              />
            ))}
          </div>

          {/* Additional Help Section */}
          {/* <div className="mt-6 text-center bg-gray-50 rounded-lg p-8">
            <h3 className="text-2xl font-semibold text-uj-blue mb-4">
              Need More Help?
            </h3>
            <p className="text-gray-600 mb-6">
              Can't find what you're looking for? Our support team is here to
              help you with any questions about your UJ journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:support@uj.ac.za"
                className="faq-support-btn bg-uj-red hover:bg-uj-blue text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 inline-flex items-center justify-center"
              >
                Email Support
              </a>
              <a
                href="tel:+27115593000"
                className="faq-support-btn bg-uj-blue hover:bg-uj-red text-white px-6 py-3 rounded-lg font-medium transition-colors duratin-200 inline-flex items-center justify-center"
              >
                Call UJ
              </a>
            </div>
          </div> */}
        </div>
      </main>
    </div>
  );
};

export default FAQPageComp;
