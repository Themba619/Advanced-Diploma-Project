import { useState } from 'react';
import '../styles/ForumStyles/questionForum.css';

const ForumQuestion = ({ topics, onSubmit, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [user, setUser] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  const handleTagToggle = (tag) => {
    if (tag === "All Topics") return;
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title || !description) {
      alert('Please fill in both title and description');
      return;
    }
    onSubmit({
      title,
      description,
      user,
      tags: selectedTags
    });
    setTitle('');
    setDescription('');
    setUser('');
    setSelectedTags([]);
  };

  return (
    <div className="question-form-container">
      <div className="question-form">
        <div className="form-header">
          <h2>Ask a New Question</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>
        <div className="form-body">
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your question title"
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide details about your question"
              rows="5"
            />
          </div>
          <div className="form-group">
            <label htmlFor="user">Your Name (optional)</label>
            <input
              type="text"
              id="user"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="Enter your name or leave blank for anonymous"
            />
          </div>
          <div className="form-group">
            <label>Tags</label>
            <div className="tags-selection">
              {topics.filter(topic => topic !== "All Topics").map((topic) => (
                <button
                  key={topic}
                  className={`tag-button ${selectedTags.includes(topic) ? 'selected' : ''}`}
                  onClick={() => handleTagToggle(topic)}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="form-footer">
          <button className="submit-button" onClick={handleSubmit}>
            Post Question
          </button>
          <button className="cancel-button" onClick={onClose}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ForumQuestion;