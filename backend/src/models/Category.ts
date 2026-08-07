import mongoose, { Schema } from 'mongoose';
import slugify from 'slugify';
import { ICategory } from '../interfaces';

const CategorySchema = new Schema<ICategory>(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [100, 'Category name cannot exceed 100 characters'],
    },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String },
    image: { type: String },
    imagePublicId: { type: String },
    parent: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      default: null,
    },
    level: { type: Number, default: 0 },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    productCount: { type: Number, default: 0 },
    metaTitle: { type: String },
    metaDescription: { type: String },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
CategorySchema.index({ slug: 1 });
CategorySchema.index({ parent: 1, isActive: 1 });
CategorySchema.index({ sortOrder: 1 });

// Virtual: children
CategorySchema.virtual('children', {
  ref: 'Category',
  localField: '_id',
  foreignField: 'parent',
  justOne: false,
});

// Pre-save: Auto-generate slug
CategorySchema.pre('save', async function (next) {
  if (this.isModified('name') || this.isNew) {
    let baseSlug = slugify(this.name as string, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    while (await mongoose.model('Category').findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    this.slug = slug;
  }
  next();
});

const Category = mongoose.model<ICategory>('Category', CategorySchema);
export default Category;
