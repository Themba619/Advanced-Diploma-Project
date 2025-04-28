import React, { useState, useEffect, JSX } from 'react';
import ForumQuestion from '../components/ForumQuestion';
import ReplyForm from '../components/ReplyForm';
import {Filter} from 'bad-words';
import profanityList from '../lib/profanityList'; // Import the profanity list (CommonJS compatible)
import '../styles/ForumStyles/layout.css';
import '../styles/ForumStyles/sidebar.css';
import '../styles/ForumStyles/header.css';
import '../styles/ForumStyles/posts.css';
import '../styles/ForumStyles/tags.css';
import '../styles/ForumStyles/topicInfo.css';

// Initialize the profanity filter with the imported list
const filter = new Filter();
filter.addWords(...profanityList);
// Whitelist words that might cause false positives
filter.removeWords('class', 'pass', 'therapist', 'assistant');

interface Reply {
  id: number;
  user: string;
  content: string;
  timeAgo: Date;
  replies: Reply[];
}

interface Post {
  id: number;
  title: string;
  description: string;
  user: string;
  timeAgo: Date;
  tags: string[];
  chatCount: number;
  replies: Reply[];
}

const formatTimeAgo = (timestamp: Date): string => {
  const now = new Date();
  const seconds = Math.floor((now.getTime() - timestamp.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(months / 12);
  return `${years} year${years === 1 ? '' : 's'} ago`;
};

const defaultPosts: Post[] = [
  {
    id: 1,
    title: "Where do I get a student card at UJ?",
    description: "I'm a first-year student at UJ and need to get my student card. Where do I go, and what documents do I need?",
    user: "NewbieUJ",
    timeAgo: new Date('2025-04-25T09:00:00Z'),
    tags: ["Academic Support", "General"],
    chatCount: 3,
    replies: [
      {
        id: 1.1,
        user: "UJHelper",
        content: "You can get your student card at the Student Enrolment Centre (SEC) on the Auckland Park Kingsway (APK) campus. Bring your ID/passport and proof of registration.",
        timeAgo: new Date('2025-04-25T10:30:00Z'),
        replies: [
          {
            id: 1.11,
            user: "NewbieUJ",
            content: "Thanks! Is there a specific time I should go?",
            timeAgo: new Date('2025-04-25T11:00:00Z'),
            replies: []
          }
        ]
      }
    ]
  },
  // Other default posts...
];

const topicInfo: Record<string, { title: string; content: JSX.Element }> = {
  "Academic Support": {
    title: "UJ Academic Support Resources",
    content: (
      <div>
        <p>Need help with your studies? UJ offers various academic support services:</p>
        <ul>
          <li><strong>Writing Centre:</strong> Get assistance with essays and assignments at the APK Writing Centre.</li>
          <li><strong>Tutoring:</strong> Contact your faculty for peer tutoring schedules.</li>
          <li><strong>Blackboard:</strong> Access lecture notes and submit assignments on the UJ Blackboard platform.</li>
        </ul>
        <p>Visit the <a href="https://www.uj.ac.za/studyatUJ/Student-Services" target="_blank" rel="noopener noreferrer">UJ Student Services</a> page for more details.</p>
      </div>
    )
  },
  "Housing": {
    title: "UJ Residence and Housing",
    content: (
      <div>
        <p>Looking for accommodation? UJ provides on-campus and accredited off-campus housing options:</p>
        <ul>
          <li><strong>Residence Applications:</strong> Apply via the UJ Student Portal for residences on APK, Soweto, or Doornfontein campuses.</li>
          <li><strong>Off-Campus Housing:</strong> Check the UJ website for accredited private accommodations.</li>
          <li><strong>Contact:</strong> Email residences@uj.ac.za for queries.</li>
        </ul>
        <p>Learn more at the <a href="https://www.uj.ac.za/studyatUJ/Accommodation" target="_blank" rel="noopener noreferrer">UJ Accommodation</a> page.</p>
      </div>
    )
  },
  "Study Tips": {
    title: "Study Tips for UJ Students",
    content: (
      <div>
        <p>Boost your academic performance with these study tips:</p>
        <ul>
          <li><strong>Library Access:</strong> Use the 24/7 library facilities during exams on the APK campus.</li>
          <li><strong>Study Groups:</strong> Join or form study groups via UJ student societies.</li>
          <li><strong>Time Management:</strong> Use the UJ academic calendar to plan your study schedule.</li>
        </ul>
        <p>Check out the <a href="https://www.uj.ac.za/studyatUJ/Student-Services" target="_blank" rel="noopener noreferrer">UJ Study Support</a> page for more resources.</p>
      </div>
    )
  },
  "Social": {
    title: "Get Involved at UJ",
    content: (
      <div>
        <p>Join the vibrant UJ student community:</p>
        <ul>
          <li><strong>Student Societies:</strong> Sign up for cultural, academic, or sports societies at the Student Centre.</li>
          <li><strong>Events:</strong> Attend events like the UJ Arts Festival or sports tournaments.</li>
          <li><strong>Connect:</strong> Follow UJ on social media for updates on campus events.</li>
        </ul>
        <p>Visit the <a href="https://www.uj.ac.za/studyatUJ/Student-Life" target="_blank" rel="noopener noreferrer">UJ Student Life</a> page for more info.</p>
      </div>
    )
  },
  "General": {
    title: "General UJ Information",
    content: (
      <div>
        <p>Explore general resources for UJ students:</p>
        <ul>
          <li><strong>Student Portal:</strong> Access the UJ Student Portal for registration, fees, and academic records.</li>
          <li><strong>Campus Maps:</strong> Find your way around APK, Soweto, or Doornfontein with UJ’s online maps.</li>
          <li><strong>Helpdesk:</strong> Contact the UJ Call Centre at 011 559 4555 for assistance.</li>
        </ul>
        <p>Find more at the <a href="https://www.uj.ac.za/" target="_blank" rel="noopener noreferrer">UJ Website</a>.</p>
      </div>
    )
  },
  "All Topics": {
    title: "Welcome to the UJ Student Forum",
    content: (
      <div>
        <p>Welcome to the UJ Student Forum! Ask questions, share tips, and connect with fellow students across all UJ campuses.</p>
        <p>Select a topic from the sidebar to view relevant posts and resources, or browse all posts below.</p>
      </div>
    )
  }
};

const Forum: React.FC = () => {
  const topics = ["All Topics", "Academic Support", "Housing", "Study Tips", "Social", "General"];
  const [posts, setPosts] = useState<Post[]>(defaultPosts);
  const [selectedTopic, setSelectedTopic] = useState<string>("All Topics");
  const [showQuestionForm, setShowQuestionForm] = useState<boolean>(false);
  const [expandedReplies, setExpandedReplies] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    fetch('http://localhost:3001/posts')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setPosts(data.map((post: Post) => ({
            ...post,
            timeAgo: new Date(post.timeAgo),
            replies: post.replies.map((reply: Reply) => ({
              ...reply,
              timeAgo: new Date(reply.timeAgo),
              replies: reply.replies.map((nestedReply: Reply) => ({
                ...nestedReply,
                timeAgo: new Date(nestedReply.timeAgo),
              }))
            }))
          })));
        } else {
          setPosts(defaultPosts);
          alert('Failed to load posts: Invalid data from server');
        }
      })
      .catch(error => {
        console.error('Error fetching posts:', error);
        setPosts(defaultPosts);
        alert('Failed to load posts: Could not connect to server');
      });
  }, []);

  useEffect(() => {
    fetch('http://localhost:3001/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(posts)
    })
      .then(res => {
        if (!res.ok) {
          return res.json().then(err => {
            throw new Error(err.error || 'Failed to save posts');
          });
        }
        return res.json();
      })
      .then(data => {
        console.log(data.message);
      })
      .catch(error => {
        console.error('Error saving posts:', error);
        setErrorMessage(error.message);
      });
  }, [posts]);

  const handleTopicClick = (topic: string) => {
    setSelectedTopic(topic);
  };

  const handleSearch = () => {
    console.log("Search query:", searchQuery);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleAskQuestion = () => {
    setShowQuestionForm(true);
    setErrorMessage('');
  };

  const handleCloseForm = () => {
    setShowQuestionForm(false);
    setErrorMessage('');
  };

  const handleSubmitQuestion = (newPost: { title: string; description: string; user?: string; tags: string[] }) => {
    const titleHasProfanity = filter.isProfane(newPost.title);
    const descriptionHasProfanity = filter.isProfane(newPost.description);

    if (titleHasProfanity || descriptionHasProfanity) {
      setErrorMessage('Your post contains inappropriate language. Please revise and try again.');
      return;
    }

    setPosts([
      {
        id: posts.length + 1,
        title: newPost.title,
        description: newPost.description,
        user: newPost.user || "Anonymous",
        timeAgo: new Date(),
        tags: newPost.tags,
        chatCount: 0,
        replies: []
      },
      ...posts
    ]);
    setShowQuestionForm(false);
    setErrorMessage('');
  };

  const handleSubmitReply = (postId: number, replyContent: string, parentReplyId: number | null = null) => {
    if (filter.isProfane(replyContent)) {
      setErrorMessage('Your reply contains inappropriate language. Please revise and try again.');
      return;
    }

    const newReply: Reply = {
      id: Date.now(),
      user: "Anonymous",
      content: replyContent,
      timeAgo: new Date(),
      replies: []
    };

    setPosts(posts.map(post => {
      if (post.id === postId) {
        if (parentReplyId === null) {
          return { ...post, replies: [newReply, ...post.replies], chatCount: post.chatCount + 1 };
        } else {
          const addReplyToNested = (replies: Reply[]): Reply[] => {
            return replies.map(reply => {
              if (reply.id === parentReplyId) {
                return { ...reply, replies: [newReply, ...reply.replies] };
              }
              return { ...reply, replies: addReplyToNested(reply.replies) };
            });
          };
          return { ...post, replies: addReplyToNested(post.replies), chatCount: post.chatCount + 1 };
        }
      }
      return post;
    }));
    setErrorMessage('');
  };

  const toggleReplies = (id: string) => {
    setExpandedReplies(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const filteredPosts = posts
    .filter(post => {
      if (selectedTopic !== "All Topics") {
        return post.tags.includes(selectedTopic);
      }
      return true;
    })
    .filter(post => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        post.title.toLowerCase().includes(query) ||
        post.description.toLowerCase().includes(query)
      );
    });

  const renderReplies = (replies: Reply[], postId: number, level: number = 1) => {
    return replies.map(reply => (
      <div key={reply.id} className={`reply level-${level}`}>
        <div className="reply-content">
          <span className="reply-user">{reply.user}</span>
          <p>{reply.content}</p>
          <span className="reply-time">{formatTimeAgo(reply.timeAgo)}</span>
          <button
            className="reply-button"
            onClick={() => toggleReplies(reply.id.toString())}
          >
            {expandedReplies[reply.id] ? 'Hide Replies' : `Show ${reply.replies.length} ${reply.replies.length === 1 ? 'Reply' : 'Replies'}`}
          </button>
          <button
            className="reply-button"
            onClick={() => toggleReplies(`form-${reply.id}`)}
          >
            {expandedReplies[`form-${reply.id}`] ? 'Cancel Reply' : 'Reply'}
          </button>
        </div>
        {expandedReplies[`form-${reply.id}`] && (
          <ReplyForm
            onSubmit={(content: string) => handleSubmitReply(postId, content, reply.id)}
          />
        )}
        {expandedReplies[reply.id] && reply.replies.length > 0 && (
          <div className="nested-replies">
            {renderReplies(reply.replies, postId, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="forum-container">
      <div className="topics-sidebar">
        <h3>Filter by Topic</h3>
        <div className="topic-buttons">
          {topics.map((topic) => (
            <button
              key={topic}
              className={`topic-button ${selectedTopic === topic ? 'active' : ''}`}
              onClick={() => handleTopicClick(topic)}
            >
              {topic}
            </button>
          ))}
        </div>
      </div>

      <div className="main-content">
        <div className="forum-header">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search questions..."
              className="search-input"
              value={searchQuery}
              onChange={handleSearchChange}
            />
            <button className="search-button" onClick={handleSearch}>
              Search
            </button>
          </div>
          <button className="ask-button" onClick={handleAskQuestion}>
            Ask Question
          </button>
        </div>

        <div className="topic-info">
          <h2>{topicInfo[selectedTopic].title}</h2>
          {topicInfo[selectedTopic].content}
        </div>

        {errorMessage && (
          <div className="error-message" style={{ color: 'red', margin: '10px 0' }}>
            {errorMessage}
          </div>
        )}

        {showQuestionForm && (
          <ForumQuestion
            topics={topics}
            onSubmit={handleSubmitQuestion}
            onClose={handleCloseForm}
          />
        )}

        <div className="posts-list">
          {filteredPosts.map((post) => (
            <div key={post.id} className="post-card">
              <h2 className="post-title">{post.title}</h2>
              <p className="post-description">{post.description}</p>
              <div className="post-meta">
                <div className="post-tags">
                  {post.tags.map((tag) => (
                    <span key={tag} className={`tag ${tag.toLowerCase().replace(' ', '-')}`}>
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="post-info">
                  <span className="post-user">
                    Asked by {post.user} {formatTimeAgo(post.timeAgo)}
                  </span>
                  <span className="chat-count">
                    {post.chatCount === 0
                      ? "No chats"
                      : `${post.chatCount} ${
                          post.chatCount === 1 ? "chat" : "chats"
                        }`}
                  </span>
                </div>
              </div>
              <div className="replies-section">
                <button
                  className="reply-button"
                  onClick={() => toggleReplies(`post-${post.id}`)}
                >
                  {expandedReplies[`post-${post.id}`] ? 'Hide Replies' : `Show ${post.replies.length} ${post.replies.length === 1 ? 'Reply' : 'Replies'}`}
                </button>
                <button
                  className="reply-button"
                  onClick={() => toggleReplies(`form-post-${post.id}`)}
                >
                  {expandedReplies[`form-post-${post.id}`] ? 'Cancel Reply' : 'Reply'}
                </button>
                {expandedReplies[`form-post-${post.id}`] && (
                  <ReplyForm
                    onSubmit={(content: string) => handleSubmitReply(post.id, content)}
                  />
                )}
                {expandedReplies[`post-${post.id}`] && post.replies.length > 0 && (
                  <div className="replies-list">
                    {renderReplies(post.replies, post.id)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Forum;