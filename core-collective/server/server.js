require('dotenv').config();
const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;
const FILE_PATH = path.join(__dirname, 'forumData.json');

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Routes
const profanityRoute = require('./routes/profanityRoute');
const emailRoute = require('./routes/emailRoute');

// Middleware
app.use(cors());
app.use(express.json());

app.use('/api/profanityRoute', profanityRoute);
app.use('/api/email', emailRoute);

// Initialize forumData.json with empty array if it doesn't exist
async function initializeFile() {
  try {
    await fs.access(FILE_PATH);
  } catch {
    await fs.writeFile(FILE_PATH, JSON.stringify([], null, 2));
  }
}

app.get('/api/db-check', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'success', time: result.rows[0].now });
  } catch (err) {
    console.error('Database connection test failed:', err);
    res.status(500).json({ status: 'fail', error: err.message });
  }
});


// --- Existing JSON file-based post and reply endpoints (untouched) ---
app.get('/posts', async (req, res) => {
  try {
    await initializeFile();
    const data = await fs.readFile(FILE_PATH, 'utf8');
    res.json(JSON.parse(data));
  } catch (error) {
    console.error('Error reading posts:', error);
    res.status(500).json({ error: 'Failed to read posts' });
  }
});

app.post('/posts', async (req, res) => {
  try {
    const newPost = req.body;
    if (!newPost.title || !newPost.description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    await initializeFile();
    const data = await fs.readFile(FILE_PATH, 'utf8');
    const posts = JSON.parse(data);
    posts.push(newPost);
    await fs.writeFile(FILE_PATH, JSON.stringify(posts, null, 2));
    res.status(200).json({ message: 'Post added successfully', post: newPost });
  } catch (error) {
    console.error('Error saving post:', error);
    res.status(500).json({ error: 'Failed to save post' });
  }
});

app.post('/posts/:postId/replies', async (req, res) => {
  const postId = parseInt(req.params.postId);
  const { content, parentReplyId } = req.body;
  const newReply = {
    id: Date.now(),
    user: "Anonymous",
    content,
    timeAgo: new Date(),
    replies: []
  };
  try {
    const data = await fs.readFile(FILE_PATH, 'utf8');
    let posts = JSON.parse(data);
    const addNestedReply = (replies) => {
      return replies.map(reply => {
        if (reply.id === parentReplyId) {
          return { ...reply, replies: [newReply, ...reply.replies] };
        }
        return { ...reply, replies: addNestedReply(reply.replies) };
      });
    };
    posts = posts.map(post => {
      if (post.id === postId) {
        if (!parentReplyId) {
          post.replies.unshift(newReply);
        } else {
          post.replies = addNestedReply(post.replies);
        }
        post.chatCount++;
      }
      return post;
    });
    await fs.writeFile(FILE_PATH, JSON.stringify(posts, null, 2));
    res.status(201).json({ message: "Reply added successfully" });
  } catch (error) {
    console.error('Error saving reply:', error);
    res.status(500).json({ error: 'Failed to save reply' });
  }
});

//Register endpoint ---
app.post('/api/auth/register', async (req, res) => {
  const { fullName, email, password } = req.body;
  if (!fullName || !email || !password) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  // Password complexity requirements
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({ 
      error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
    });
  }

  try {
    const existingUser = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const result = await pool.query(
      'INSERT INTO users (full_name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, email',
      [fullName, email, passwordHash]
    );
    res.status(201).json({ message: 'User registered', user: result.rows[0] });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Server error during registration' });
  }
});

//Login endpoint
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = userResult.rows[0];
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // ✅ Add fullName to the JWT payload:
    const token = jwt.sign(
      { userId: user.id, email: user.email, fullName: user.full_name },
      process.env.JWT_SECRET || 'default_jwt_secret',
      { expiresIn: '1h' }
    );

    res.json({ 
      message: 'Login successful', 
      token,
      user: { id: user.id, email: user.email, fullName: user.full_name }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});


// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
