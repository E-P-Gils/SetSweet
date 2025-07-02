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
    let uploadDir;
    if (req.path.includes('/storyboard/') && req.path.includes('/image')) {
      uploadDir = 'uploads/storyboard';
    } else {
      uploadDir = 'uploads/scripts';
    }
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    if (req.path.includes('/storyboard/') && req.path.includes('/image')) {
      cb(null, 'storyboard-' + uniqueSuffix + path.extname(file.originalname));
    } else {
      cb(null, 'script-' + uniqueSuffix + path.extname(file.originalname));
    }
  }
});

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    console.log('Multer fileFilter called for:', file.originalname);
    console.log('File mimetype:', file.mimetype);
    console.log('Request path:', req.path);
    
    // Accept PDF files for scripts, images for storyboard
    if (req.path.includes('/storyboard/') && req.path.includes('/image')) {
      if (file.mimetype.startsWith('image/')) {
        console.log('Image file accepted');
        cb(null, true);
      } else {
        console.log('Non-image file rejected:', file.mimetype);
        cb(new Error('Only image files are allowed for storyboard'));
      }
    } else {
      if (file.mimetype === 'application/pdf') {
        console.log('PDF file accepted');
        cb(null, true);
      } else {
        console.log('Non-PDF file rejected:', file.mimetype);
        cb(new Error('Only PDF files are allowed'));
      }
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024 // Increased to 50MB limit
  }
});

// Error handling middleware for multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    console.error('Multer error:', error);
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ message: 'File too large. Maximum size is 50MB.' });
    }
    return res.status(400).json({ message: 'File upload error: ' + error.message });
  } else if (error) {
    console.error('Upload error:', error);
    return res.status(400).json({ message: error.message });
  }
  next();
};

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

    // Find projects owned by user and projects shared with user
    const ownedProjects = await Project.find({ user: decoded.userId })
      .populate('user', 'email')
      .sort({ createdAt: -1 });

    const sharedProjects = await Project.find({ 
      sharedUsers: decoded.userId 
    })
      .populate('user', 'email')
      .sort({ createdAt: -1 });

    // Combine and mark shared projects
    const allProjects = [
      ...ownedProjects.map(p => ({ ...p.toObject(), isShared: false })),
      ...sharedProjects.map(p => ({ ...p.toObject(), isShared: true }))
    ];

    console.log('Found projects:', allProjects);
    res.json(allProjects);
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
router.get('/scenes/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('No token provided for scenes fetch');
      return res.status(401).json({ message: 'No token provided' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, 'your-secret-key');
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Find the project and check if user has access
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user owns the project or is a shared user
    const isOwner = project.user.toString() === decoded.userId;
    const isSharedUser = project.sharedUsers.includes(decoded.userId);
    
    if (!isOwner && !isSharedUser) {
      return res.status(403).json({ message: 'Not authorized to access this project' });
    }

    // Find scenes for this project
    const scenes = await Scene.find({ project: projectId }).sort({ createdAt: -1 });
    console.log('Found scenes:', scenes);
    res.json(scenes);
  } catch (error) {
    console.error('Error fetching scenes:', error);
    res.status(500).json({ message: 'Error fetching scenes', error: error.message });
  }
});

router.post('/scenes', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, 'your-secret-key');
    const { title, projectId } = req.body;

    if (!title || !projectId) {
      return res.status(400).json({ message: 'Title and projectId are required' });
    }

    // Verify project belongs to user
    const project = await Project.findOne({ _id: projectId, user: decoded.userId });
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Create new scene
    const scene = new Scene({
      title,
      project: projectId,
      notes: '',
      floorplan: { shapes: [], paths: [] }
    });

    await scene.save();

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

// Get storyboard for a scene
router.get('/scenes/:sceneId/storyboard', async (req, res) => {
  try {
    const { sceneId } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('No token provided for storyboard fetch');
      return res.status(401).json({ message: 'No token provided' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, 'your-secret-key');
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Find the scene and its project
    const scene = await Scene.findById(sceneId).populate('project');
    if (!scene) {
      return res.status(404).json({ message: 'Scene not found' });
    }

    // Check if user has access to the project
    const project = scene.project;
    const isOwner = project.user.toString() === decoded.userId;
    const isSharedUser = project.sharedUsers.includes(decoded.userId);
    
    if (!isOwner && !isSharedUser) {
      return res.status(403).json({ message: 'Not authorized to access this project' });
    }

    console.log('Found storyboard for scene:', sceneId);
    res.json({ frames: scene.storyboard || [] });
  } catch (error) {
    console.error('Error fetching storyboard:', error);
    res.status(500).json({ message: 'Error fetching storyboard', error: error.message });
  }
});

router.post('/scenes/:sceneId/storyboard', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, 'your-secret-key');
    const { sceneId } = req.params;
    const { title, description, shotType, cameraMovement, frameNumber } = req.body;

    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    // Find scene and verify it belongs to user's project
    const scene = await Scene.findById(sceneId).populate('project');
    if (!scene) {
      return res.status(404).json({ message: 'Scene not found' });
    }

    if (scene.project.user.toString() !== decoded.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Create new storyboard frame
    const newFrame = {
      title,
      description: description || '',
      shotType: shotType || 'WIDE',
      cameraMovement: cameraMovement || 'STATIC',
      frameNumber: frameNumber || 1,
      createdAt: new Date()
    };

    // Initialize storyboard array if it doesn't exist
    if (!scene.storyboard) {
      scene.storyboard = [];
    }

    // Add frame to storyboard
    scene.storyboard.push(newFrame);
    await scene.save();

    // Return the newly created frame with its ID
    const createdFrame = scene.storyboard[scene.storyboard.length - 1];
    res.status(201).json(createdFrame);
  } catch (error) {
    console.error('Error creating storyboard frame:', error);
    res.status(500).json({ message: 'Error creating storyboard frame', error: error.message });
  }
});

router.delete('/scenes/:sceneId/storyboard/:frameId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, 'your-secret-key');
    const { sceneId, frameId } = req.params;

    // Find scene and verify it belongs to user's project
    const scene = await Scene.findById(sceneId).populate('project');
    if (!scene) {
      return res.status(404).json({ message: 'Scene not found' });
    }

    if (scene.project.user.toString() !== decoded.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Remove frame from storyboard using findOneAndUpdate to avoid version conflicts
    const result = await Scene.findOneAndUpdate(
      { _id: sceneId },
      { $pull: { storyboard: { _id: frameId } } },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ message: 'Scene not found' });
    }

    res.json({ message: 'Frame deleted successfully' });
  } catch (error) {
    console.error('Error deleting storyboard frame:', error);
    res.status(500).json({ message: 'Error deleting storyboard frame', error: error.message });
  }
});

// Batch create storyboard frames
router.post('/scenes/:sceneId/storyboard/batch', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, 'your-secret-key');
    const { sceneId } = req.params;
    const { frames } = req.body;

    if (!frames || !Array.isArray(frames)) {
      return res.status(400).json({ message: 'Frames array is required' });
    }

    // Find scene and verify it belongs to user's project
    const scene = await Scene.findById(sceneId).populate('project');
    if (!scene) {
      return res.status(404).json({ message: 'Scene not found' });
    }

    if (scene.project.user.toString() !== decoded.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Initialize storyboard array if it doesn't exist
    if (!scene.storyboard) {
      scene.storyboard = [];
    }

    // Add all frames to storyboard
    const createdFrames = [];
    for (const frameData of frames) {
      const newFrame = {
        title: frameData.title,
        description: frameData.description || '',
        shotType: frameData.shotType || 'WIDE',
        cameraMovement: frameData.cameraMovement || 'STATIC',
        frameNumber: frameData.frameNumber,
        createdAt: new Date()
      };
      scene.storyboard.push(newFrame);
      createdFrames.push(scene.storyboard[scene.storyboard.length - 1]);
    }

    await scene.save();
    res.status(201).json(createdFrames);
  } catch (error) {
    console.error('Error creating storyboard frames batch:', error);
    res.status(500).json({ message: 'Error creating storyboard frames', error: error.message });
  }
});

// Update storyboard frames
router.put('/scenes/:sceneId/storyboard', async (req, res) => {
  try {
    const { sceneId } = req.params;
    const { frames } = req.body;
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      console.log('No token provided for storyboard update');
      return res.status(401).json({ message: 'No token provided' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, 'your-secret-key');
    } catch (error) {
      console.error('Token verification failed:', error);
      return res.status(401).json({ message: 'Invalid token' });
    }

    // Find the scene and its project
    const scene = await Scene.findById(sceneId).populate('project');
    if (!scene) {
      return res.status(404).json({ message: 'Scene not found' });
    }

    // Check if user has access to the project
    const project = scene.project;
    const isOwner = project.user.toString() === decoded.userId;
    const isSharedUser = project.sharedUsers.includes(decoded.userId);
    
    if (!isOwner && !isSharedUser) {
      return res.status(403).json({ message: 'Not authorized to modify this project' });
    }

    // Update storyboard frames
    scene.storyboard = frames;
    await scene.save();

    console.log('Storyboard updated for scene:', sceneId);
    res.json({ message: 'Storyboard updated successfully', frames: scene.storyboard });
  } catch (error) {
    console.error('Error updating storyboard:', error);
    res.status(500).json({ message: 'Error updating storyboard', error: error.message });
  }
});

// Upload image for storyboard frame
router.post('/scenes/:sceneId/storyboard/:frameId/image', 
  verifyToken, 
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        console.error('Upload error:', err);
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Maximum size is 50MB.' });
          }
          return res.status(400).json({ message: 'File upload error: ' + err.message });
        }
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      console.log('=== IMAGE UPLOAD REQUEST ===');
      console.log('Image upload request received');
      console.log('Scene ID:', req.params.sceneId);
      console.log('Frame ID:', req.params.frameId);
      console.log('User ID:', req.userId);
      console.log('Headers:', req.headers);
      console.log('Body:', req.body);
      console.log('File:', req.file);
      console.log('Upload directory exists:', fs.existsSync('uploads/storyboard'));
      
      const { sceneId, frameId } = req.params;

      if (!req.file) {
        console.log('No file uploaded');
        return res.status(400).json({ message: 'No image uploaded' });
      }

      console.log('File uploaded successfully:', req.file);

      // Find scene and verify it belongs to user's project
      const scene = await Scene.findById(sceneId).populate('project');
      if (!scene) {
        console.log('Scene not found');
        return res.status(404).json({ message: 'Scene not found' });
      }

      console.log('Scene found:', scene.title);

      if (scene.project.user.toString() !== req.userId) {
        console.log('Unauthorized access');
        return res.status(403).json({ message: 'Unauthorized' });
      }

      console.log('User authorized');

      // Find the specific frame
      const frameIndex = scene.storyboard.findIndex(frame => frame._id.toString() === frameId);
      if (frameIndex === -1) {
        console.log('Frame not found');
        return res.status(404).json({ message: 'Frame not found' });
      }

      console.log('Frame found at index:', frameIndex);

      // Update frame with image URL
      const imageUrl = `/uploads/storyboard/${req.file.filename}`;
      scene.storyboard[frameIndex].imageUrl = imageUrl;
      
      console.log('About to save scene with image URL:', imageUrl);
      await scene.save();

      console.log('Scene saved successfully');
      console.log('Image uploaded successfully:', imageUrl);
      res.json({ imageUrl });
    } catch (error) {
      console.error('=== IMAGE UPLOAD ERROR ===');
      console.error('Error uploading storyboard image:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ message: 'Error uploading image', error: error.message });
    }
  }
);

// Upload image for storyboard frame by index (for camera component)
router.post('/scenes/:sceneId/storyboard/frames/:frameIndex/image', 
  (req, res, next) => {
    upload.single('image')(req, res, (err) => {
      if (err) {
        console.error('Upload error:', err);
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Maximum size is 50MB.' });
          }
          return res.status(400).json({ message: 'File upload error: ' + err.message });
        }
        return res.status(400).json({ message: err.message });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      console.log('=== CAMERA IMAGE UPLOAD REQUEST ===');
      console.log('Camera image upload request received');
      console.log('Scene ID:', req.params.sceneId);
      console.log('Frame Index:', req.params.frameIndex);
      console.log('Body:', req.body);
      console.log('File:', req.file);
      
      const { sceneId, frameIndex } = req.params;
      const focalLength = req.body.focalLength ? parseInt(req.body.focalLength) : null;

      if (!req.file) {
        console.log('No file uploaded');
        return res.status(400).json({ message: 'No image uploaded' });
      }

      console.log('File uploaded successfully:', req.file);
      console.log('Focal length:', focalLength);

      // Find scene and its project
      const scene = await Scene.findById(sceneId).populate('project');
      if (!scene) {
        console.log('Scene not found');
        return res.status(404).json({ message: 'Scene not found' });
      }

      console.log('Scene found:', scene.title);

      // Check if user has access to the project
      const project = scene.project;
      const token = req.headers.authorization?.split(' ')[1];
      let decoded;
      
      if (token) {
        try {
          decoded = jwt.verify(token, 'your-secret-key');
          const isOwner = project.user.toString() === decoded.userId;
          const isSharedUser = project.sharedUsers.includes(decoded.userId);
          
          if (!isOwner && !isSharedUser) {
            console.log('User not authorized to access this project');
            return res.status(403).json({ message: 'Not authorized to modify this project' });
          }
        } catch (error) {
          console.log('Token verification failed, proceeding without auth check');
        }
      }

      // Check if frame index is valid
      const frameIdx = parseInt(frameIndex);
      if (frameIdx < 0 || frameIdx >= scene.storyboard.length) {
        console.log('Invalid frame index:', frameIdx);
        return res.status(404).json({ message: 'Frame not found' });
      }

      console.log('Frame found at index:', frameIdx);

      // Update frame with image URL and focal length
      const imageUrl = `/uploads/storyboard/${req.file.filename}`;
      scene.storyboard[frameIdx].imageUrl = imageUrl;
      if (focalLength) {
        scene.storyboard[frameIdx].focalLength = focalLength;
      }
      
      console.log('About to save scene with image URL:', imageUrl, 'and focal length:', focalLength);
      await scene.save();

      console.log('Scene saved successfully');
      console.log('Image uploaded successfully:', imageUrl);
      res.json({ imageUrl, focalLength });
    } catch (error) {
      console.error('=== CAMERA IMAGE UPLOAD ERROR ===');
      console.error('Error uploading camera image:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ message: 'Error uploading image', error: error.message });
    }
  }
);

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

router.put('/scenes/:sceneId', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = jwt.verify(token, 'your-secret-key');
    const { sceneId } = req.params;
    const updates = req.body;

    // Find scene and verify it belongs to user's project
    const scene = await Scene.findById(sceneId).populate('project');
    if (!scene) {
      return res.status(404).json({ message: 'Scene not found' });
    }

    if (scene.project.user.toString() !== decoded.userId) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Update the scene with the provided updates
    const updatedScene = await Scene.findByIdAndUpdate(
      sceneId,
      updates,
      { new: true, runValidators: true }
    );

    res.json(updatedScene);
  } catch (error) {
    console.error('Error updating scene:', error);
    res.status(500).json({ message: 'Error updating scene', error: error.message });
  }
});

// Project sharing routes
router.post('/projects/:projectId/share', verifyToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    // Find the project and verify ownership
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    if (project.user.toString() !== req.userId) {
      return res.status(403).json({ message: 'Not authorized to share this project' });
    }

    // Check if user exists
    const invitedUser = await User.findOne({ email });
    if (!invitedUser) {
      return res.status(404).json({ message: 'User with this email not found' });
    }

    // Check if already shared
    if (project.sharedUsers.includes(invitedUser._id)) {
      return res.status(400).json({ message: 'Project is already shared with this user' });
    }

    // Check if invitation already exists
    const existingInvitation = project.pendingInvitations.find(
      inv => inv.email === email
    );
    if (existingInvitation) {
      return res.status(400).json({ message: 'Invitation already sent to this user' });
    }

    // Add invitation
    project.pendingInvitations.push({
      email,
      invitedBy: req.userId,
      invitedAt: new Date()
    });

    await project.save();

    res.json({ message: 'Project shared successfully' });
  } catch (error) {
    console.error('Error sharing project:', error);
    res.status(500).json({ message: 'Error sharing project', error: error.message });
  }
});

// Get pending invitations for a user
router.get('/invitations', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Find projects with pending invitations for this user's email
    const projectsWithInvitations = await Project.find({
      'pendingInvitations.email': user.email
    }).populate('user', 'email');

    const invitations = projectsWithInvitations.map(project => {
      const invitation = project.pendingInvitations.find(inv => inv.email === user.email);
      return {
        projectId: project._id,
        projectTitle: project.title,
        invitedBy: invitation.invitedBy,
        invitedAt: invitation.invitedAt
      };
    });

    res.json(invitations);
  } catch (error) {
    console.error('Error fetching invitations:', error);
    res.status(500).json({ message: 'Error fetching invitations', error: error.message });
  }
});

// Accept project invitation
router.post('/invitations/:projectId/accept', verifyToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Find and remove the invitation
    const invitationIndex = project.pendingInvitations.findIndex(
      inv => inv.email === user.email
    );

    if (invitationIndex === -1) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    // Remove invitation and add user to shared users
    project.pendingInvitations.splice(invitationIndex, 1);
    project.sharedUsers.push(user._id);

    await project.save();

    // Add project to user's projects
    user.projects.push(project._id);
    await user.save();

    res.json({ message: 'Project invitation accepted' });
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ message: 'Error accepting invitation', error: error.message });
  }
});

// Decline project invitation
router.post('/invitations/:projectId/decline', verifyToken, async (req, res) => {
  try {
    const { projectId } = req.params;
    const user = await User.findById(req.userId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Find and remove the invitation
    const invitationIndex = project.pendingInvitations.findIndex(
      inv => inv.email === user.email
    );

    if (invitationIndex === -1) {
      return res.status(404).json({ message: 'Invitation not found' });
    }

    // Remove invitation
    project.pendingInvitations.splice(invitationIndex, 1);
    await project.save();

    res.json({ message: 'Project invitation declined' });
  } catch (error) {
    console.error('Error declining invitation:', error);
    res.status(500).json({ message: 'Error declining invitation', error: error.message });
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