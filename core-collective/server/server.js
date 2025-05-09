// const express = require('express');
// const fs = require('fs').promises;
// const path = require('path');
// const cors = require('cors');

// const app = express();
// const PORT = 3001;
// const FILE_PATH = path.join(__dirname, 'forumData.json');

// // Middleware
// app.use(cors());
// app.use(express.json());

// // Initialize forumData.json with empty array if it doesn't exist
// async function initializeFile() {
//   try {
//     await fs.access(FILE_PATH);
//   } catch {
//     await fs.writeFile(FILE_PATH, JSON.stringify([], null, 2));
//   }
// }

// // Read posts
// app.get('/posts', async (req, res) => {
//   try {
//     await initializeFile();
//     const data = await fs.readFile(FILE_PATH, 'utf8');
//     res.json(JSON.parse(data));
//   } catch (error) {
//     console.error('Error reading posts:', error);
//     res.status(500).json({ error: 'Failed to read posts' });
//   }
// });

// // Save posts
// app.post('/posts', async (req, res) => {
//   try {
//     const posts = req.body;
//     // No profanity filtering on the backend; save directly
//     await fs.writeFile(FILE_PATH, JSON.stringify(posts, null, 2));
//     res.status(200).json({ message: 'Posts saved successfully' });
//   } catch (error) {
//     console.error('Error saving posts:', error);
//     res.status(500).json({ error: 'Failed to save posts' });
//   }
// });

// app.listen(PORT, () => {
//   console.log(`Server running on http://localhost:${PORT}`);
// });

const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;
const FILE_PATH = path.join(__dirname, 'forumData.json');

const profanityRoute = require('./routes/profanityRoute');

// Middleware
app.use(cors());
app.use(express.json());

app.use('/api/profanityRoute', profanityRoute);

// Initialize forumData.json with empty array if it doesn't exist
async function initializeFile() {
  try {
    await fs.access(FILE_PATH);
  } catch {
    await fs.writeFile(FILE_PATH, JSON.stringify([], null, 2));
  }
}

// Read posts
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

// Add a new post
app.post('/posts', async (req, res) => {
  try {
    const newPost = req.body;
    // Validate new post
    if (!newPost.title || !newPost.description) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    await initializeFile();
    // Read existing posts
    const data = await fs.readFile(FILE_PATH, 'utf8');
    const posts = JSON.parse(data);
    // Append new post
    posts.push(newPost);
    // Write updated posts back to file
    await fs.writeFile(FILE_PATH, JSON.stringify(posts, null, 2));
    res.status(200).json({ message: 'Post added successfully', post: newPost });
  } catch (error) {
    console.error('Error saving post:', error);
    res.status(500).json({ error: 'Failed to save post' });
  }
});

// app.post('/posts/:postId/replies', (req, res) => {
//   const postId = parseInt(req.params.postId);
//   const { content, parentReplyId } = req.body;

//   const newReply = {
//     id: Date.now(),
//     user: "Anonymous",
//     content,
//     timeAgo: new Date(),
//     replies: []
//   };

//   const addNestedReply = (replies) => {
//     return replies.map(reply => {
//       if (reply.id === parentReplyId) {
//         return { ...reply, replies: [newReply, ...reply.replies] };
//       }
//       return { ...reply, replies: addNestedReply(reply.replies) };
//     });
//   };

//   posts = posts.map(post => {
//     if (post.id === postId) {
//       if (!parentReplyId) {
//         post.replies.unshift(newReply);
//       } else {
//         post.replies = addNestedReply(post.replies);
//       }
//       post.chatCount++;
//     }
//     return post;
//   });

//   fs.writeFileSync(FILE_PATH, JSON.stringify(posts, null, 2));
//   res.status(201).json({ message: "Reply added successfully" });
// });


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
    // Read existing posts
    const data = await fs.readFile(FILE_PATH, 'utf8');
    let posts = JSON.parse(data);

    // Function to add nested replies
    const addNestedReply = (replies) => {
      return replies.map(reply => {
        if (reply.id === parentReplyId) {
          return { ...reply, replies: [newReply, ...reply.replies] };
        }
        return { ...reply, replies: addNestedReply(reply.replies) };
      });
    };

    // Update the posts
    posts = posts.map(post => {
      if (post.id === postId) {
        if (!parentReplyId) {
          post.replies.unshift(newReply);  // Add to main replies if no parentReplyId
        } else {
          post.replies = addNestedReply(post.replies);  // Add nested reply
        }
        post.chatCount++;
      }
      return post;
    });

    // Save updated posts to file
    await fs.writeFile(FILE_PATH, JSON.stringify(posts, null, 2));

    res.status(201).json({ message: "Reply added successfully" });
  } catch (error) {
    console.error('Error saving reply:', error);
    res.status(500).json({ error: 'Failed to save reply' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});