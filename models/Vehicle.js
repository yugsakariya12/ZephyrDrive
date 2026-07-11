import mongoose from 'mongoose';

const VehicleSchema = new mongoose.Schema(
  {
    make: {
      type: String,
      required: [true, 'Please provide the vehicle make.'],
      trim: true,
    },
    model: {
      type: String,
      required: [true, 'Please provide the vehicle model.'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please provide the vehicle category (e.g. SUV, Sedan, Coupe).'],
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Please provide the vehicle price.'],
      min: [0, 'Price cannot be negative.'],
    },
    quantity: {
      type: Number,
      required: [true, 'Please provide the vehicle quantity.'],
      min: [0, 'Quantity cannot be negative.'],
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be an integer.',
      },
    },
    imageUrl: {
      type: String,
      default: '',
    },
    createdBy: {
      type: String,
      default: 'system',
    },
    createdByEmail: {
      type: String,
      default: 'admin@zephyrdrive.com',
    },
  },
  {
    timestamps: true, // Useful for sorting by newly added vehicles
  }
);

// Mongoose models are cached to prevent re-compilation errors during hot reloading.
export default mongoose.models.Vehicle || mongoose.model('Vehicle', VehicleSchema);
