const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username is required"],
    unique: true, // Prati user ki veru username undali
    trim: true,
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters"],
  },
});

// User ni save chese mundu ee function run avtundi
UserSchema.pre('save', async function (next) {
  // Kotta user create chesinappudu or password marchinappudu matrame run avvali
  if (!this.isModified('password')) {
    return next();
  }

  // Password ni hash cheyadam (encrypt)
  try {
    const salt = await bcrypt.genSalt(10); // Hashing kosam salt
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Password ni compare cheyadaniki oka function
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", UserSchema);
module.exports = User;