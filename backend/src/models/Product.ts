import mongoose, { Schema } from 'mongoose';
import slugify from 'slugify';
import { IProduct } from '../interfaces';
import { ProductStatus } from '../constants';

const ProductImageSchema = new Schema(
  {
    url: { type: String, required: true },
    publicId: { type: String, required: true },
    alt: { type: String },
    isDefault: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
  },
  { _id: false }
);

const ProductVariantSchema = new Schema(
  {
    color: { type: String, required: true },
    colorCode: { type: String, required: true },
    stock: { type: Number, required: true, min: 0, default: 0 },
    sku: { type: String, required: true },
    price: { type: Number, min: 0 },
    images: [ProductImageSchema],
  },
  { _id: false }
);

const DimensionsSchema = new Schema(
  {
    length: { type: Number, default: 5.5 },
    width: { type: Number, default: 1.2 },
    weight: { type: Number, default: 500 },
    unit: { type: String, default: 'meters' },
  },
  { _id: false }
);

const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    slug: { type: String, unique: true, lowercase: true },
    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 500 },
    sku: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    subCategory: { type: String },
    tags: [{ type: String, lowercase: true, trim: true }],
    fabric: { type: String, required: true },
    occasion: [{ type: String }],
    style: { type: String },
    color: { type: String, required: true },
    colorCode: { type: String, default: '#000000' },
    pattern: { type: String },
    blouseLength: { type: String, default: '80 cm' },
    sareeLength: { type: String, default: '5.5 meters' },
    careInstructions: [{ type: String }],
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    discountedPrice: {
      type: Number,
      min: [0, 'Discounted price cannot be negative'],
    },
    salePrice: {
      type: Number,
      min: [0, 'Sale price cannot be negative'],
    },
    isSale: { type: Boolean, default: false },
    discountPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    soldCount: { type: Number, default: 0 },
    images: [ProductImageSchema],
    video: { type: String },
    variants: [ProductVariantSchema],
    dimensions: { type: DimensionsSchema, default: () => ({}) },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    isNewArrival: { type: Boolean, default: false },
    isBestSeller: { type: Boolean, default: false },
    isBridal: { type: Boolean, default: false },
    launchDate: { type: Date },
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0 },
    metaTitle: { type: String },
    metaDescription: { type: String },
    schemaMarkup: { type: String },
    relatedProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
ProductSchema.index({ slug: 1 });
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ averageRating: -1 });
ProductSchema.index({ soldCount: -1 });
ProductSchema.index({ createdAt: -1 });
ProductSchema.index({ isNewArrival: 1, isActive: 1 });
ProductSchema.index({ isBestSeller: 1, isActive: 1 });
ProductSchema.index({ isFeatured: 1, isActive: 1 });
ProductSchema.index({ isBridal: 1, isActive: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index(
  { name: 'text', description: 'text', tags: 'text', fabric: 'text' },
  { weights: { name: 10, tags: 5, fabric: 3, description: 1 } }
);

// Virtual: isOnSale
ProductSchema.virtual('isOnSale').get(function () {
  return this.isSale && this.salePrice !== undefined && this.salePrice < this.price;
});

// Virtual: effectivePrice
ProductSchema.virtual('effectivePrice').get(function () {
  if (this.isSale && this.salePrice !== undefined) return this.salePrice;
  return this.discountedPrice ?? this.price;
});

// Virtual: status
ProductSchema.virtual('status').get(function () {
  if (!this.isActive) return ProductStatus.INACTIVE;
  if (this.launchDate && this.launchDate.getTime() > Date.now()) return ProductStatus.COMING_SOON;
  if (this.stock === 0) return ProductStatus.OUT_OF_STOCK;
  return ProductStatus.ACTIVE;
});

// Pre-save: Auto-generate slug
ProductSchema.pre('save', async function (next) {
  if (this.isModified('name') || this.isNew) {
    let baseSlug = slugify(this.name, { lower: true, strict: true });
    let slug = baseSlug;
    let counter = 1;

    while (await mongoose.model('Product').findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    this.slug = slug;
  }

  // Calculate discount percent
  const effectivePrice = this.isSale && this.salePrice !== undefined
    ? this.salePrice
    : this.discountedPrice ?? this.price;
  if (this.discountedPrice !== undefined && this.discountedPrice > this.price) {
    return next(new Error('Discounted price cannot exceed MRP'));
  }
  if (this.isSale && this.salePrice === undefined) {
    return next(new Error('Sale price is required when product is marked as Sale'));
  }
  if (this.isSale && this.salePrice !== undefined && this.salePrice > (this.discountedPrice ?? this.price)) {
    return next(new Error('Sale price cannot exceed the discounted price'));
  }
  this.discountPercent = effectivePrice < this.price
    ? Math.round(((this.price - effectivePrice) / this.price) * 100)
    : 0;

  next();
});

const Product = mongoose.model<IProduct>('Product', ProductSchema);
export default Product;
