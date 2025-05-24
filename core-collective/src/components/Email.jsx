import React, { useState } from 'react';
import './emailModules.css';

const Email = () => {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Extracting form data
    const formData = new FormData(event.target);
    // const name = formData.get('name').toString();
    // const email = formData.get('email').toString();
    // const message = formData.get('message').toString();

    setLoading(true);

    try{
      const response = await fetch("/api/email/send-email", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if(response.ok) {
        alert("Message sent");
        event.target.reset();
        setAttachments([]);
      }else{
        alert("Failed to send " + data.error)
      }
    }catch(err){
      console.log("Error: ", err);
      alert("Error sending message")
    } finally{
      setLoading(false);
    }
  };

  const handleFileChange = (event) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setAttachments([...attachments, ...newFiles]);
    }
  };

  const removeAttachment = (index) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  return (
    <div className="emailContainer">
      <div className="formContainer">
        <h2 className="formTitle">Contact Us</h2>
        {loading && <div className="loading">Sending message...</div>}
        <form onSubmit={handleSubmit} className="form">
          <fieldset 
            disabled={loading} 
            className={loading ? "fieldset-disabled" : ""}
            style={{ border: "none", padding: 0, margin: 0 }}
          >
            <div className="label">
              <label htmlFor="name" className="label">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="inputField"
                placeholder="Your Name"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className="inputField"
                placeholder="Your Email"
                required
              />
            </div>
            
            <div>
              <label htmlFor="message" className="label">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                className="textareaField"
                rows={5}
                placeholder="Your Message"
                required
              ></textarea>
            </div>
            <div>
              <label htmlFor="attachments" className="label">
                Attachments
              </label>
              <input
                type="file"
                id="attachments"
                name="attachments"
                accept=".jpg,.jpeg,.png,.pdf,.docx,.txt" 
                multiple
                onChange={handleFileChange}
                className="inputField fileInput"
              />
              {attachments.length > 0 && (
                <div className="attachmentList">
                  {attachments.map((file, index) => (
                    <div key={index} className="attachmentItem">
                      <span className="attachmentName">{file.name}</span>
                      <button
                        type="button"
                        onClick={() => removeAttachment(index)}
                        className="removeButton"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button 
              type="submit" 
              className="submitButton"
            >
              Send Message
            </button>
          </fieldset>
        </form>
      </div>
    </div>
  );
};

export default Email;