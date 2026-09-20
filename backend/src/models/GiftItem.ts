import mongoose, { Schema } from 'mongoose';

const GiftItemSchema = new Schema({
  name: { type: String, required: true, trim: true, maxlength: 150 },
  sku: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 80 },
  stock: { type: Number, required: true, min: 0, default: 0 },
  unitCost: { type: Number, required: true, min: 0 },
  isActive: { type: Boolean, default: true, index: true },
  notes: { type: String, trim: true, maxlength: 500 },
}, { timestamps: true });

GiftItemSchema.index({ name: 1 });
export default mongoose.model('GiftItem', GiftItemSchema);
