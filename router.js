const express = require('express');
const cors = require('cors');
const User = require('./models/user');
const Project = require('./models/project');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Scene = require('./models/scene');

const PORT = 3001;
const LOCAL_IP ="REPLACEWITHIP";
const app = express();

// Middleware to handle JSON and URL-encoded data
app.use(cors({
  origin: [
    'http://localhost:8081',
    'http://localhost:3000',
    `http://${LOCAL_IP}:8081`,
    `http://${LOCAL_IP}:3000`,
    'exp://*', // Allow Expo connections
  ],
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type,Authorization',
  credentials: true
}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/setsweet')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

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

    // Create token with user ID
    const token = jwt.sign(
      { userId: user._id },
      'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      user: {
        _id: user._id,
        email: user.email
      },
      token
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to log in user', error });
  }
});

// Project routes
router.post('/projects', async (req, res) => {
  try {
    console.log('Received project creation request:', req.body);
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, 'your-secret-key');
    console.log('Decoded token:', decoded);

    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    // Create new project
    const project = await Project.create({
      title,
      user: decoded.userId // Use the userId from the token
    });

    console.log('Created project:', project);

    // Add project to user's projects array
    await User.findByIdAndUpdate(
      decoded.userId,
      { $push: { projects: project._id } }
    );

    console.log('Updated user projects array');
    res.status(201).json(project);
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ message: 'Error creating project', error: error.message });
  }
});

router.get('/projects', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      console.log('No token provided');
      return res.status(401).json({ message: 'No token provided' });
    }

    console.log('Verifying token for projects fetch');
    let decoded;
    try {
      decoded = jwt.verify(token, 'your-secret-key');
      console.log('Decoded token:', decoded);
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ message: 'Invalid token' });
    }

    // First get the user to ensure they exist
    const user = await User.findById(decoded.userId);
    if (!user) {
      console.log('User not found for ID:', decoded.userId);
      return res.status(404).json({ message: 'User not found' });
    }

    // Find projects for the user and populate the user field
    const projects = await Project.find({ user: decoded.userId })
      .populate('user', 'email')
      .sort({ createdAt: -1 }); // Sort by newest first

    console.log('Found projects:', projects);
    res.json(projects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ 
      message: 'Error fetching projects', 
      error: error.message 
    });
  }
});

router.delete('/projects/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, 'your-secret-key');
    const project = await Project.findOne({ _id: req.params.id, user: decoded.userId });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Remove project from user's projects array
    await User.findByIdAndUpdate(
      decoded.userId,
      { $pull: { projects: project._id } }
    );

    // Delete the project
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ message: 'Error deleting project', error: error.message });
  }
});

// Scene routes
router.post('/scenes', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, 'your-secret-key');
    const { title, projectId } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ message: 'Title and project ID are required' });
    }

    // Verify project belongs to user
    const project = await Project.findOne({ _id: projectId, user: decoded.userId });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Create new scene
    const scene = await Scene.create({
      title,
      project: projectId
    });

    // Add scene to project's scenes array
    await Project.findByIdAndUpdate(
      projectId,
      { $push: { scenes: scene._id } }
    );

    res.status(201).json(scene);
  } catch (error) {
    console.error('Error creating scene:', error);
    res.status(500).json({ message: 'Error creating scene', error: error.message });
  }
});

router.get('/scenes/:projectId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, 'your-secret-key');
    const { projectId } = req.params;

    // Verify project belongs to user
    const project = await Project.findOne({ _id: projectId, user: decoded.userId });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get all scenes for the project
    const scenes = await Scene.find({ project: projectId })
      .sort({ createdAt: -1 });

    res.json(scenes);
  } catch (error) {
    console.error('Error fetching scenes:', error);
    res.status(500).json({ message: 'Error fetching scenes', error: error.message });
  }
});

router.put('/scenes/:sceneId/notes', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, 'your-secret-key');
    const { sceneId } = req.params;
    const { notes } = req.body;

    // Find scene and verify it belongs to user's project
    const scene = await Scene.findById(sceneId).populate('project');
    if (!scene) {
      return res.status(404).json({ message: 'Scene not found' });
    }

    if (scene.project.user.toString() !== decoded.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Update scene notes
    scene.notes = notes;
    await scene.save();

    res.json(scene);
  } catch (error) {
    console.error('Error updating scene notes:', error);
    res.status(500).json({ message: 'Error updating scene notes', error: error.message });
  }
});

router.delete('/scenes/:sceneId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, 'your-secret-key');
    const { sceneId } = req.params;

    // Find scene and verify it belongs to user's project
    const scene = await Scene.findById(sceneId).populate('project');
    if (!scene) {
      return res.status(404).json({ message: 'Scene not found' });
    }

    if (scene.project.user.toString() !== decoded.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Remove scene from project's scenes array
    await Project.findByIdAndUpdate(
      scene.project._id,
      { $pull: { scenes: sceneId } }
    );

    // Delete the scene
    await Scene.findByIdAndDelete(sceneId);

    res.json({ message: 'Scene deleted successfully' });
  } catch (error) {
    console.error('Error deleting scene:', error);
    res.status(500).json({ message: 'Error deleting scene', error: error.message });
  }
});

app.use('/api', router);

// Start server on all network interfaces
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on:`);
  console.log(`- http://localhost:${PORT}`);
  console.log(`- http://${LOCAL_IP}:${PORT}`);
});

module.exports = {
  router,
  LOCAL_IP
};