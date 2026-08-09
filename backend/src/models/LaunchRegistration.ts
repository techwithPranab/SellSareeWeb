import mongoose, { Document, Schema } from 'mongoose';

export interface ILaunchRegistration extends Document {
  name: string;
  email: string;
  phone: string;
  createdAt: Date;
  updatedAt: Date;
}

const LaunchRegistrationSchema = new Schema<ILaunchRegistration>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
  },
  { timestamps: true }
);

const LaunchRegistration = mongoose.model<ILaunchRegistration>(
  'LaunchRegistration',
  LaunchRegistrationSchema
);

export default LaunchRegistration;
