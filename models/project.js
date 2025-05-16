const mongoose = require('mongoose');

const slateSchema = new mongoose.Schema({
  roll: String,
  scene: String,
  take: String,
  prod: String,
  dir: String,
  cam: String,
  fps: String,
  date: String,
  toggles: {
    INT_EXT: String,
    DAY_NITE: String,
    SYNC_MOS: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const projectSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: String,
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  scriptUrl: {
    type: String,
    default: null
  },
  slates: [slateSchema],
  scenes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Scene'
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

projectSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Project', projectSchema);