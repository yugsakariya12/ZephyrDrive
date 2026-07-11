import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Please provide an email.'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Please provide a password.'],
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
  },
  {
    timestamps: true, // Useful for tracking user creation
    collection: 'regestrations',
  }
);

// Mongoose models are cached to prevent re-compilation errors during hot reloading.
export default mongoose.models.User || mongoose.model('User', UserSchema);
