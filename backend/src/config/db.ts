import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const connUri = process.env.MONGODB_URI;
    if (!connUri) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }
    await mongoose.connect(connUri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
};
