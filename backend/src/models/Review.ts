import mongoose, { Schema } from 'mongoose';
import { IReview } from '../interfaces';

const ReviewSchema = new Schema<IReview>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    order: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
    },
    title: {
      type: String,
      required: [true, 'Review title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      minlength: [10, 'Comment must be at least 10 characters'],
      maxlength: [1000, 'Comment cannot exceed 1000 characters'],
    },
    images: [{ type: String }],
    isVerifiedPurchase: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    isFeaturedOnHomepage: { type: Boolean, default: false },
    helpfulCount: { type: Number, default: 0 },
    helpfulUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    adminReply: { type: String },
    adminReplyAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Unique: One review per user per product
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });
ReviewSchema.index({ product: 1, isApproved: 1 });
ReviewSchema.index({ isApproved: 1, isFeaturedOnHomepage: 1, createdAt: -1 });
ReviewSchema.index({ user: 1 });
ReviewSchema.index({ rating: 1 });
ReviewSchema.index({ createdAt: -1 });

// Static method: Calculate and update product's average rating
ReviewSchema.statics.calculateAverageRating = async function (productId: string) {
  const stats = await this.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(productId), isApproved: true } },
    {
      $group: {
        _id: '$product',
        averageRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 },
      },
    },
  ]);

  if (stats.length > 0) {
    await mongoose.model('Product').findByIdAndUpdate(productId, {
      averageRating: Math.round(stats[0].averageRating * 10) / 10,
      totalReviews: stats[0].totalReviews,
    });
  } else {
    await mongoose.model('Product').findByIdAndUpdate(productId, {
      averageRating: 0,
      totalReviews: 0,
    });
  }
};

// Post-save: Update product rating
ReviewSchema.post('save', async function () {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (this.constructor as any).calculateAverageRating(this.product);
});

// Post-delete: Update product rating
ReviewSchema.post('findOneAndDelete', async function (doc) {
  if (doc) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (doc.constructor as any).calculateAverageRating(doc.product);
  }
});

const Review = mongoose.model<IReview>('Review', ReviewSchema);
export default Review;
