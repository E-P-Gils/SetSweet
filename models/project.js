const { Schema, model } = require('mongoose');

const projectSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // creator/owner
  slates: [{ type: Schema.Types.Mixed }],        // could be refined later to sub-schema
  foundViews: [{ type: Schema.Types.Mixed }],
  storyboards: [{ type: Schema.Types.Mixed }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

projectSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

const Project = model('Project', projectSchema);

module.exports = Project;