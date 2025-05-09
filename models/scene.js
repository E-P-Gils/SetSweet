const mongoose = require('mongoose');

const sceneSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  notes: {
    type: String,
    default: ''
  },
  floorplan: {
    shapes: [{
      id: Number,
      type: String,
      x: Number,
      y: Number,
      width: Number,
      height: Number,
      rotation: Number,
      color: String,
      name: String
    }],
    paths: [String]
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update the updatedAt timestamp before saving
sceneSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Scene', sceneSchema); 