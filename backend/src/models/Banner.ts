import mongoose, { Schema } from 'mongoose';
import { IBanner } from '../interfaces';

const BannerSchema = new Schema<IBanner>(
  {
    title: {
      type: String,
      required: [true, 'Banner title is required'],
      trim: true,
    },
    subtitle: { type: String, trim: true },
    image: {
      type: String,
      required: [true, 'Banner image is required'],
    },
    imagePublicId: {
      type: String,
      required: true,
    },
    mobileImage: { type: String },
    link: { type: String },
    position: {
      type: String,
      enum: ['hero', 'middle', 'bottom', 'popup', 'sidebar'],
      default: 'hero',
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    isActive: { type: Boolean, default: true },
    startDate: { type: Date },
    endDate: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// Indexes
BannerSchema.index({ position: 1, isActive: 1, sortOrder: 1 });

// Virtual: isCurrentlyActive
BannerSchema.virtual('isCurrentlyActive').get(function () {
  const now = new Date();
  if (!this.isActive) return false;
  if (this.startDate && now < this.startDate) return false;
  if (this.endDate && now > this.endDate) return false;
  return true;
});

const Banner = mongoose.model<IBanner>('Banner', BannerSchema);
export default Banner;
