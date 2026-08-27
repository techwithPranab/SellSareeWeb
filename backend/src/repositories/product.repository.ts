import Product from '../models/Product';
import { IProduct } from '../interfaces';
import { parsePagination, buildPaginationMeta, PaginationOptions } from '../utils/pagination';
import { FilterQuery } from 'mongoose';

export interface ProductFilter {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  fabric?: string;
  occasion?: string;
  color?: string;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
  isFeatured?: boolean;
  isBridal?: boolean;
  search?: string;
  tags?: string[];
  isActive?: boolean;
  includeInactive?: boolean;
}

export class ProductRepository {
  async findById(id: string): Promise<IProduct | null> {
    return Product.findById(id).populate('category', 'name slug').populate('relatedProducts', 'name slug price discountedPrice salePrice isSale images');
  }

  async findBySlug(slug: string): Promise<IProduct | null> {
    return Product.findOne({ slug, isActive: true })
      .populate('category', 'name slug')
      .populate('relatedProducts', 'name slug price discountedPrice salePrice isSale images averageRating');
  }

  async findBySku(sku: string): Promise<IProduct | null> {
    return Product.findOne({ sku: sku.toUpperCase() });
  }

  async create(data: Partial<IProduct>): Promise<IProduct> {
    return Product.create(data);
  }

  async updateById(id: string, update: Partial<IProduct>): Promise<IProduct | null> {
    return Product.findByIdAndUpdate(id, update, { new: true, runValidators: true })
      .populate('category', 'name slug isActive');
  }

  async deleteById(id: string): Promise<boolean> {
    const result = await Product.findByIdAndDelete(id);
    return !!result;
  }

  async findAll(
    filter: ProductFilter = {},
    options: PaginationOptions = {}
  ) {
    const { skip, limit, page, sort } = parsePagination(options);
    const query = this.buildFilter(filter);

    const [data, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name slug')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .select('-schemaMarkup'),
      Product.countDocuments(query),
    ]);

    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  async search(
    searchTerm: string,
    filter: ProductFilter = {},
    options: PaginationOptions = {}
  ) {
    const { skip, limit, page, sort } = parsePagination(options);
    const query: FilterQuery<IProduct> = {
      ...this.buildFilter(filter),
      $text: { $search: searchTerm },
    };

    const [data, total] = await Promise.all([
      Product.find(query, { score: { $meta: 'textScore' } })
        .populate('category', 'name slug')
        .sort({ score: { $meta: 'textScore' }, ...sort })
        .skip(skip)
        .limit(limit),
      Product.countDocuments(query),
    ]);

    return { data, meta: buildPaginationMeta(total, page, limit) };
  }

  async findFeatured(limit = 8): Promise<IProduct[]> {
    return Product.find({ isFeatured: true, isActive: true })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async findNewArrivals(limit = 12): Promise<IProduct[]> {
    return Product.find({ isNewArrival: true, isActive: true })
      .populate('category', 'name slug')
      .sort({ createdAt: -1 })
      .limit(limit);
  }

  async findBestSellers(limit = 12): Promise<IProduct[]> {
    return Product.find({ isBestSeller: true, isActive: true })
      .populate('category', 'name slug')
      .sort({ soldCount: -1 })
      .limit(limit);
  }

  async findByCategory(categoryId: string, options: PaginationOptions = {}) {
    return this.findAll({ category: categoryId, isActive: true }, options);
  }

  async findRelatedProducts(productId: string, categoryId: string, limit = 6): Promise<IProduct[]> {
    return Product.find({
      category: categoryId,
      _id: { $ne: productId },
      isActive: true,
    })
      .sort({ averageRating: -1, soldCount: -1 })
      .limit(limit)
      .select('name slug price discountedPrice salePrice isSale images averageRating totalReviews');
  }

  async updateStock(productId: string, quantity: number): Promise<IProduct | null> {
    return Product.findByIdAndUpdate(
      productId,
      { $inc: { stock: -quantity, soldCount: quantity } },
      { new: true }
    );
  }

  async reserveStock(productId: string, quantity: number): Promise<IProduct | null> {
    return Product.findOneAndUpdate(
      { _id: productId, isActive: true, stock: { $gte: quantity } },
      { $inc: { stock: -quantity, soldCount: quantity } },
      { new: true, runValidators: true }
    );
  }

  async releaseStock(productId: string, quantity: number): Promise<IProduct | null> {
    return Product.findByIdAndUpdate(
      productId,
      { $inc: { stock: quantity, soldCount: -quantity } },
      { new: true, runValidators: true }
    );
  }

  async countDocuments(filter: FilterQuery<IProduct> = {}): Promise<number> {
    return Product.countDocuments(filter);
  }

  async findLowStockProducts(threshold = 5): Promise<IProduct[]> {
    return Product.find({ stock: { $lte: threshold, $gt: 0 }, isActive: true })
      .select('name sku stock')
      .sort({ stock: 1 });
  }

  private buildFilter(filter: ProductFilter): FilterQuery<IProduct> {
    const query: FilterQuery<IProduct> = {};

    if (filter.isActive !== undefined) query.isActive = filter.isActive;
    else if (!filter.includeInactive) query.isActive = true;

    if (filter.search?.trim()) {
      const escapedSearch = filter.search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchPattern = new RegExp(escapedSearch, 'i');
      query.$or = [
        { name: searchPattern },
        { sku: searchPattern },
        { fabric: searchPattern },
        { color: searchPattern },
      ];
    }

    if (filter.category) query.category = filter.category;
    if (filter.fabric) query.fabric = new RegExp(filter.fabric, 'i');
    if (filter.color) query.color = new RegExp(filter.color, 'i');
    if (filter.occasion) query.occasion = { $in: [filter.occasion] };
    if (filter.tags) query.tags = { $in: filter.tags };
    if (filter.isNewArrival) query.isNewArrival = true;
    if (filter.isBestSeller) query.isBestSeller = true;
    if (filter.isFeatured) query.isFeatured = true;
    if (filter.isBridal) query.isBridal = true;

    if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
      query.price = {};
      if (filter.minPrice !== undefined) query.price.$gte = filter.minPrice;
      if (filter.maxPrice !== undefined) query.price.$lte = filter.maxPrice;
    }

    return query;
  }
}

export const productRepository = new ProductRepository();
