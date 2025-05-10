const mongoose = require('mongoose');

const shapeSchema = new mongoose.Schema({
  id: { type: Number, required: true },
  type: { type: String, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
  rotation: { type: Number, required: true },
  color: { type: String, required: true },
  name: { type: String, default: '' }
}, { _id: false });

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
    shapes: { type: [shapeSchema], default: [] },
    paths: { type: [String], default: [] }
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