const { Schema, model } = require('mongoose');

const userSchema = new Schema({
  email: { type: String, required: true, unique: true, match: [/.+@.+\..+/, 'Please enter a valid email address'] },
  password: { type: String, required: true },
  projects: [{ type: Schema.Types.ObjectId, ref: 'Projects' }],
  createdAt: { type: Date, default: Date.now }
});

// userSchema.pre('save', async function (next) {
//   if (this.isNew || this.isModified('password')) {
//     const saltRounds = 10;
//     this.password = await bcrypt.hash(this.password, saltRounds);
//   }

//   next();
// });

userSchema.methods.isCorrectPassword = async function (password) {
  return password == this.password;
};

const User = model('User', userSchema);

module.exports = User;