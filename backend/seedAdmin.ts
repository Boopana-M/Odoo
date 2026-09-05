import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './src/modules/users/user.model';

dotenv.config();

const seed = async () => {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/peoplepay360';
    await mongoose.connect(uri);
    
    console.log('Connected to DB...');
    
    const adminEmail = 'admin@peoplepay360.com';
    const adminPassword = 'AdminPassword123!';
    
    const existingAdmin = await User.findOne({ email: adminEmail });
    if (existingAdmin) {
       console.log('Admin already exists. Credentials:');
       console.log('Email:', adminEmail);
       console.log('Password:', adminPassword);
       process.exit(0);
    }
    
    const admin = new User({
      name: 'System Admin',
      email: adminEmail,
      passwordHash: adminPassword,
      role: 'Admin',
      isActive: true
    });
    
    await admin.save();
    console.log('Admin seeded successfully! Credentials:');
    console.log('Email:', adminEmail);
    console.log('Password:', adminPassword);
    
  } catch (err) {
    console.error('Error seeding admin:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();
