import mongoose, { Schema } from 'mongoose';

export interface IStoreSetting {
  key: string;
  storeName: string;
  supportEmail: string;
  supportPhone: string;
  storeAddress: string;
  freeShippingThreshold: number;
  standardShippingRate: number;
  loyaltyPointsRate: number;
  socialLinks: Record<string, string>;
}

const StoreSettingSchema = new Schema<IStoreSetting>(
  {
    key: { type: String, unique: true, default: 'store' },
    storeName: { type: String, required: true, trim: true, maxlength: 100 },
    supportEmail: { type: String, required: true, trim: true, lowercase: true },
    supportPhone: { type: String, trim: true, maxlength: 20, default: '' },
    storeAddress: { type: String, trim: true, maxlength: 300 },
    freeShippingThreshold: { type: Number, required: true, min: 0 },
    standardShippingRate: { type: Number, required: true, min: 0 },
    loyaltyPointsRate: { type: Number, required: true, min: 0 },
    socialLinks: { type: Map, of: String, default: {} },
  },
  { timestamps: true }
);

export default mongoose.model<IStoreSetting>('StoreSetting', StoreSettingSchema);
