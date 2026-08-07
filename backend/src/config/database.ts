import mongoose from 'mongoose';
import { logger } from '../middlewares/logger.middleware';

let isConnected = false;

export const connectDatabase = async (): Promise<void> => {
  if (isConnected) {
    logger.info('📦 Using existing MongoDB connection');
    return;
  }

  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is not defined in environment variables');
  }

  try {
    mongoose.set('strictQuery', true);

    const conn = await mongoose.connect(mongoUri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });

    isConnected = true;
    logger.info(`✅ MongoDB Connected: ${conn.connection.host}`);
    logger.info(`📊 Database: ${conn.connection.name}`);
  } catch (error) {
    logger.error('❌ MongoDB Connection Error:', error);
    throw error;
  }

  mongoose.connection.on('disconnected', () => {
    isConnected = false;
    logger.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
  });

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB connection error:', err);
  });

  mongoose.connection.on('reconnected', () => {
    isConnected = true;
    logger.info('✅ MongoDB reconnected');
  });
};

export const disconnectDatabase = async (): Promise<void> => {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
    logger.info('🔌 MongoDB disconnected');
  }
};

export default connectDatabase;
