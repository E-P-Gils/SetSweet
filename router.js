const express = require('express');
const cors = require('cors');
const User = require('./models/user');
const Like = require('./models/project');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const PORT = 3001;
const app = express();

// Middleware to handle JSON and URL-encoded data
app.use(cors({
  origin: 'http://localhost:8081', // Allow only frontend origin
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization'
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/setsweet')

const router = express.Router();

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().populate('projects');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch users', error });
  }
});

// Get a specific user
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).populate('projects');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch user', error });
  }
});

// Register a new user

router.post('/register', async (req, res) => {
    try {
      const { email, password } = req.body;
      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: 'User already exists' });
  
      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
  
      const user = new User({
        email,
        password: hashedPassword,
      });
  
      await user.save();
      res.status(201).json(user);
    } catch (error) {
      res.status(500).json({ message: 'Failed to register user', error });
    }
  });

// Login user
router.post('/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) return res.status(401).json({ message: 'Invalid password' });
  
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: 'Failed to log in user', error });
    }
  });

app.use('/api', router);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

module.exports = router;