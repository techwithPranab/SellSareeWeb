import mongoose, { Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUser } from '../interfaces';
import { UserRole } from '../constants';
import { generateAccessToken, generateRefreshToken, generateReferralCode, generateRandomToken, generateHashedToken } from '../utils/generateToken';

const AddressSchema = new Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    addressLine1: { type: String, required: true },
    addressLine2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true, match: /^[1-9][0-9]{5}$/ },
    country: { type: String, required: true, default: 'India' },
    isDefault: { type: Boolean, default: false },
    type: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
  },
  { _id: true }
);

const ImportantDateSchema = new Schema(
  {
    label: {
      type: String,
      required: [true, 'Important date label is required'],
      trim: true,
      maxlength: [50, 'Important date label cannot exceed 50 characters'],
    },
    date: { type: Date, required: [true, 'Important date is required'] },
    notes: { type: String, trim: true, maxlength: [250, 'Notes cannot exceed 250 characters'] },
  },
  { _id: true }
);

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      trim: true,
      match: [/^[6-9]\d{9}$/, 'Please enter a valid Indian phone number'],
    },
    password: {
      type: String,
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    avatar: { type: String },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.CUSTOMER,
    },
    addresses: [AddressSchema],
    isEmailVerified: { type: Boolean, default: false },
    isPhoneVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    googleId: { type: String, sparse: true },
    refreshToken: { type: String, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    emailVerificationToken: { type: String, select: false },
    emailVerificationExpires: { type: Date, select: false },
    loyaltyPoints: { type: Number, default: 0, min: 0 },
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: Schema.Types.ObjectId, ref: 'User' },
    wishlist: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
    preferredLanguage: { type: String, default: 'en' },
    preferredCurrency: { type: String, default: 'INR' },
    lastLogin: { type: Date },
    importantDates: { type: [ImportantDateSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      transform(_doc, ret) {
        delete ret.password;
        delete ret.refreshToken;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.emailVerificationToken;
        delete ret.emailVerificationExpires;
        return ret;
      },
    },
    toObject: { virtuals: true },
  }
);

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ phone: 1 });
UserSchema.index({ googleId: 1 }, { sparse: true });
UserSchema.index({ referralCode: 1 }, { sparse: true });
UserSchema.index({ createdAt: -1 });

// Pre-save: Hash password
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
  this.password = await bcrypt.hash(this.password, saltRounds);
  next();
});

// Pre-save: Generate referral code
UserSchema.pre('save', function (next) {
  if (this.isNew && !this.referralCode) {
    this.referralCode = generateReferralCode(this.name);
  }
  next();
});

// Instance Methods
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

UserSchema.methods.generateAccessToken = function (): string {
  return generateAccessToken({ id: this._id.toString(), email: this.email, role: this.role });
};

UserSchema.methods.generateRefreshToken = function (): string {
  return generateRefreshToken({ id: this._id.toString(), email: this.email, role: this.role });
};

UserSchema.methods.generatePasswordResetToken = function (): string {
  const resetToken = generateRandomToken();
  this.passwordResetToken = generateHashedToken(resetToken);
  this.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return resetToken;
};

const User = mongoose.model<IUser>('User', UserSchema);
export default User;
