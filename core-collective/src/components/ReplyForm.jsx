import { useState } from 'react';
import '../styles/ForumStyles/posts.css';

const ReplyForm = ({ onSubmit }) => {
  const [content, setContent] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!content.trim()) {
      alert('Please enter a reply');
      return;
    }
    onSubmit(content);
    setContent('');
  };

  return (
    <div className="reply-form">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Write your reply..."
        rows="3"
      />
      <button onClick={handleSubmit}>Submit Reply</button>
    </div>
  );
};

export default ReplyForm;