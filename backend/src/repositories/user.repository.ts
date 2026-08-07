import User from '../models/User';
import { IUser } from '../interfaces';
import { parsePagination, buildPaginationMeta, PaginationOptions } from '../utils/pagination';
import { FilterQuery, Types } from 'mongoose';

export class UserRepository {
  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  }

  async findByIdWithPassword(id: string): Promise<IUser | null> {
    return User.findById(id).select('+password');
  }

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() });
  }

  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() }).select('+password +refreshToken');
  }

  async findByRefreshToken(refreshToken: string): Promise<IUser | null> {
    return User.findOne({ refreshToken }).select('+refreshToken');
  }

  async findByPasswordResetToken(hashedToken: string): Promise<IUser | null> {
    return User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+passwordResetToken +passwordResetExpires');
  }

  async findByGoogleId(googleId: string): Promise<IUser | null> {
    return User.findOne({ googleId });
  }

  async findByReferralCode(referralCode: string): Promise<IUser | null> {
    return User.findOne({ referralCode: referralCode.toUpperCase() });
  }

  async create(data: Partial<IUser>): Promise<IUser> {
    return User.create(data);
  }

  async updateById(id: string, update: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, update, { new: true, runValidators: true });
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await User.findByIdAndDelete(id);
    return !!result;
  }

  async addToWishlist(userId: string, productId: string): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      userId,
      { $addToSet: { wishlist: new Types.ObjectId(productId) } },
      { new: true }
    );
  }

  async removeFromWishlist(userId: string, productId: string): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      userId,
      { $pull: { wishlist: new Types.ObjectId(productId) } },
      { new: true }
    );
  }

  async addAddress(userId: string, address: object): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      userId,
      { $push: { addresses: address } },
      { new: true, runValidators: true }
    );
  }

  async updateAddress(userId: string, addressId: string, address: object): Promise<IUser | null> {
    return User.findOneAndUpdate(
      { _id: userId, 'addresses._id': addressId },
      { $set: { 'addresses.$': { ...address, _id: addressId } } },
      { new: true, runValidators: true }
    );
  }

  async deleteAddress(userId: string, addressId: string): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      userId,
      { $pull: { addresses: { _id: addressId } } },
      { new: true }
    );
  }

  async setDefaultAddress(userId: string, addressId: string): Promise<IUser | null> {
    await User.updateOne({ _id: userId }, { $set: { 'addresses.$[].isDefault': false } });
    return User.findOneAndUpdate(
      { _id: userId, 'addresses._id': addressId },
      { $set: { 'addresses.$.isDefault': true } },
      { new: true }
    );
  }

  async updateLoyaltyPoints(userId: string, points: number): Promise<IUser | null> {
    return User.findByIdAndUpdate(
      userId,
      { $inc: { loyaltyPoints: points } },
      { new: true }
    );
  }

  async findAll(
    filter: FilterQuery<IUser> = {},
    options: PaginationOptions = {}
  ) {
    const { skip, limit, page, sort } = parsePagination(options);
    const [data, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);
    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  async countDocuments(filter: FilterQuery<IUser> = {}): Promise<number> {
    return User.countDocuments(filter);
  }
}

export const userRepository = new UserRepository();
