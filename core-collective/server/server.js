const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;
const FILE_PATH = path.join(__dirname, 'forumData.json');

// Middleware
app.use(cors());
app.use(express.json());

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

// Save posts
app.post('/posts', async (req, res) => {
  try {
    const posts = req.body;
    // No profanity filtering on the backend; save directly
    await fs.writeFile(FILE_PATH, JSON.stringify(posts, null, 2));
    res.status(200).json({ message: 'Posts saved successfully' });
  } catch (error) {
    console.error('Error saving posts:', error);
    res.status(500).json({ error: 'Failed to save posts' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});