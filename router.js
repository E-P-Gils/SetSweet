const express = require('express');
const cors = require('cors');
const User = require('./models/user');
const Project = require('./models/project');
const path = require('path');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Scene = require('./models/scene');
const multer = require('multer');
const fs = require('fs');
const app = express();

const PORT = 3001;
const LOCAL_IP ="REPLACEWITHIP";
// const app = express();

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

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/scripts';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'script-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Accept only PDF files
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/setsweet')
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const router = express.Router();

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, 'your-secret-key');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
};

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
router.get('/scenes/:id', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, 'your-secret-key');
    const { id } = req.params;

    // Check if the ID is a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(id)) {
      // If it's a valid ObjectId, try to find a single scene
      const scene = await Scene.findById(id).populate('project');
      if (scene) {
        if (scene.project.user.toString() !== decoded.userId) {
          return res.status(403).json({ message: 'Unauthorized' });
        }
        return res.json(scene);
      }
    }

    // If not a valid ObjectId or scene not found, try to find scenes by project
    const project = await Project.findOne({ _id: id, user: decoded.userId });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Get all scenes for the project
    const scenes = await Scene.find({ project: id })
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

router.put('/scenes/:sceneId/floorplan', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, 'your-secret-key');
    const { sceneId } = req.params;
    const { floorplan } = req.body;

    console.log('Updating floorplan for scene:', sceneId);
    console.log('Received floorplan data:', JSON.stringify(floorplan, null, 2));

    // Validate floorplan data structure
    if (!floorplan || !Array.isArray(floorplan.shapes) || !Array.isArray(floorplan.paths)) {
      return res.status(400).json({ 
        message: 'Invalid floorplan data structure',
        expected: {
          shapes: [{
            id: 'Number',
            type: 'String',
            x: 'Number',
            y: 'Number',
            width: 'Number',
            height: 'Number',
            rotation: 'Number',
            color: 'String',
            name: 'String'
          }],
          paths: ['String']
        }
      });
    }

    // Find scene and verify it belongs to user's project
    const scene = await Scene.findById(sceneId).populate('project');
    if (!scene) {
      return res.status(404).json({ message: 'Scene not found' });
    }

    if (scene.project.user.toString() !== decoded.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Update scene floorplan - pass the shapes array directly without stringifying
    scene.floorplan = {
      shapes: floorplan.shapes,
      paths: floorplan.paths
    };

    await scene.save();
    console.log('Floorplan updated successfully');
    res.json(scene);
  } catch (error) {
    console.error('Error updating scene floorplan:', error);
    res.status(500).json({ message: 'Error updating scene floorplan', error: error.message });
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

// Add static file serving for uploads
app.use('/uploads', express.static('uploads'));

// Script routes
router.get('/projects/:projectId/script', verifyToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Verify project belongs to user
    if (project.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json({ scriptUrl: project.scriptUrl });
  } catch (error) {
    console.error('Error fetching script:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/projects/:projectId/script', verifyToken, upload.single('script'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Verify project belongs to user
    if (project.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Update project with script URL
    project.scriptUrl = `/uploads/scripts/${req.file.filename}`;
    await project.save();

    res.json({ scriptUrl: project.scriptUrl });
  } catch (error) {
    console.error('Error uploading script:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete script
router.delete('/projects/:projectId/script', verifyToken, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.projectId,
      userId: req.userId
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.scriptUrl) {
      // Delete the file from the uploads directory
      const filePath = path.join(__dirname, project.scriptUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Update project to remove script URL
    project.scriptUrl = null;
    await project.save();

    res.status(200).json({ message: 'Script deleted successfully' });
  } catch (error) {
    console.error('Error deleting script:', error);
    res.status(500).json({ message: 'Error deleting script' });
  }
});

// Add slate to project
router.post('/projects/:projectId/slates', verifyToken, async (req, res) => {
  try {
    console.log('Received slate data:', req.body);
    console.log('Project ID:', req.params.projectId);
    console.log('User ID:', req.userId);

    const project = await Project.findById(req.params.projectId);
    if (!project) {
      console.log('Project not found');
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user owns the project
    if (project.user.toString() !== req.userId) {
      console.log('Unauthorized access attempt');
      return res.status(403).json({ message: 'Not authorized to add slates to this project' });
    }

    const slate = {
      roll: req.body.roll,
      scene: req.body.scene,
      take: req.body.take,
      prod: req.body.prod,
      dir: req.body.dir,
      cam: req.body.cam,
      fps: req.body.fps,
      date: req.body.date,
      toggles: req.body.toggles,
      createdAt: new Date()
    };

    console.log('Adding slate to project:', slate);
    project.slates.push(slate);
    await project.save();
    console.log('Slate saved successfully');

    res.status(201).json(slate);
  } catch (error) {
    console.error('Error adding slate:', error);
    res.status(500).json({ message: 'Error adding slate to project', error: error.message });
  }
});

// Get all slates for a project
router.get('/projects/:projectId/slates', verifyToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user owns the project
    if (project.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to view slates for this project' });
    }

    res.json(project.slates);
  } catch (error) {
    console.error('Error fetching slates:', error);
    res.status(500).json({ message: 'Error fetching project slates' });
  }
});

// Delete a slate from a project
router.delete('/projects/:projectId/slates/:slateId', verifyToken, async (req, res) => {
  try {
    const project = await Project.findById(req.params.projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user owns the project
    if (project.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to delete slates from this project' });
    }

    const slateIndex = project.slates.findIndex(slate => slate._id.toString() === req.params.slateId);
    if (slateIndex === -1) {
      return res.status(404).json({ message: 'Slate not found' });
    }

    project.slates.splice(slateIndex, 1);
    await project.save();

    res.json({ message: 'Slate deleted successfully' });
  } catch (error) {
    console.error('Error deleting slate:', error);
    res.status(500).json({ message: 'Error deleting slate' });
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