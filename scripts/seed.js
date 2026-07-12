const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());

// Load environment connection string
const connectionStr = process.env.MONGODB_URI;

if (!connectionStr) {
  console.error("Error: MONGODB_URI environment variable is missing.");
  process.exit(1);
}

// Define inline Schemas if files aren't transpiled, or require directly
// Since Next.js uses ES modules (import/export), importing them in a raw Node script can throw SyntaxErrors.
// Defining simple inline schemas to execute seeding directly avoids compile conflicts!

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
}, { 
  timestamps: true,
  collection: 'regestrations' // Enforce specific collection name selection requested by user
});

const VehicleSchema = new mongoose.Schema({
  make: { type: String, required: true },
  model: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  createdBy: { type: String, default: 'system' },
  createdByEmail: { type: String, default: 'admin@zephyrdrive.com' },
  imageUrl: { type: String, default: '' },
}, { 
  timestamps: true 
});

const SeedUser = mongoose.models.User || mongoose.model('User', UserSchema);
const SeedVehicle = mongoose.models.Vehicle || mongoose.model('Vehicle', VehicleSchema);

async function seed() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect(connectionStr);
  console.log('Connected! Purging current listings...');

  // Purge existing data
  await SeedUser.deleteMany({});
  await SeedVehicle.deleteMany({});
  console.log('Collections cleared.');

  // Create Users
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const userPassword = await bcrypt.hash('user123', salt);

  const admin = new SeedUser({
    email: 'admin@zephyrdrive.com',
    password: adminPassword,
    role: 'admin',
  });

  const customer = new SeedUser({
    email: 'user@zephyrdrive.com',
    password: userPassword,
    role: 'user',
  });

  await admin.save();
  await customer.save();
  console.log('Seeded User Profiles:');
  console.log(' - Admin: admin@zephyrdrive.com / admin123');
  console.log(' - User:  user@zephyrdrive.com / user123');

  // Create 20 Elite Vehicles
  const vehicles = [
    { make: 'Porsche', model: '911 GT3 RS', category: 'Coupe', price: 22380000, quantity: 3, imageUrl: '/images/coupe.jpg' },
    { make: 'Ferrari', model: 'F8 Tributo', category: 'Coupe', price: 27650000, quantity: 2, imageUrl: '/images/coupe.jpg' },
    { make: 'Tesla', model: 'Model S Plaid', category: 'Electric', price: 8999000, quantity: 5, imageUrl: '/images/electric.jpg' },
    { make: 'Audi', model: 'RS e-tron GT', category: 'Electric', price: 14750000, quantity: 3, imageUrl: '/images/electric.jpg' },
    { make: 'BMW', model: 'M4 Competition', category: 'Coupe', price: 7860000, quantity: 4, imageUrl: '/images/coupe.jpg' },
    { make: 'Mercedes-Benz', model: 'AMG GT Black Series', category: 'Coupe', price: 32500000, quantity: 1, imageUrl: '/images/coupe.jpg' },
    { make: 'Chevrolet', model: 'Corvette Z06', category: 'Coupe', price: 10530000, quantity: 4, imageUrl: '/images/coupe.jpg' },
    { make: 'Porsche', model: 'Taycan Turbo S', category: 'Electric', price: 19490000, quantity: 2, imageUrl: '/images/electric.jpg' },
    { make: 'Aston Martin', model: 'Vantage F1 Edition', category: 'Coupe', price: 16200000, quantity: 2, imageUrl: '/images/coupe.jpg' },
    { make: 'Lamborghini', model: 'Huracán Tecnica', category: 'Coupe', price: 23900000, quantity: 2, imageUrl: '/images/coupe.jpg' },
    { make: 'Ford', model: 'Mustang Mach-E GT', category: 'SUV', price: 5999000, quantity: 6, imageUrl: '/images/suv.jpg' },
    { make: 'Tesla', model: 'Model Y Performance', category: 'SUV', price: 5249000, quantity: 8, imageUrl: '/images/suv.jpg' },
    { make: 'Porsche', model: 'Cayenne Turbo GT', category: 'SUV', price: 18870000, quantity: 3, imageUrl: '/images/suv.jpg' },
    { make: 'Audi', model: 'RS6 Avant', category: 'Sedan', price: 12190000, quantity: 3, imageUrl: '/images/sedan.jpg' },
    { make: 'BMW', model: 'M5 CS', category: 'Sedan', price: 14200000, quantity: 2, imageUrl: '/images/sedan.jpg' },
    { make: 'Lucid', model: 'Air Sapphire', category: 'Electric', price: 24900000, quantity: 1, imageUrl: '/images/electric.jpg' },
    { make: 'Mazda', model: 'MX-5 Miata Club', category: 'Convertible', price: 3150000, quantity: 10, imageUrl: '/images/convertible.jpg' },
    { make: 'Porsche', model: '718 Spyder', category: 'Convertible', price: 9830000, quantity: 3, imageUrl: '/images/convertible.jpg' },
    { make: 'Lexus', model: 'LC 500 Convertible', category: 'Convertible', price: 10265000, quantity: 2, imageUrl: '/images/convertible.jpg' },
    { make: 'Ford', model: 'Mustang Dark Horse', category: 'Coupe', price: 5920000, quantity: 5, imageUrl: '/images/coupe.jpg' },
  ];

  const adminId = admin._id.toString();
  const adminEmail = admin.email;
  const vehiclesWithCreator = vehicles.map(v => ({
    ...v,
    createdBy: adminId,
    createdByEmail: adminEmail
  }));

  await SeedVehicle.insertMany(vehiclesWithCreator);
  console.log(`Successfully seeded ${vehicles.length} catalog vehicle items.`);

  await mongoose.disconnect();
  console.log('Database disconnected. Seeding completed.');
}

seed().catch(err => {
  console.error('Seeding process encountered an error:', err);
  process.exit(1);
});
