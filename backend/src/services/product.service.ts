import { productRepository, ProductFilter } from '../repositories/product.repository';
import { cloudinary } from '../config/cloudinary';
import { CustomError } from '../middlewares/error.middleware';
import { HTTP_STATUS } from '../constants';
import { IProduct } from '../interfaces';
import { PaginationOptions } from '../utils/pagination';

export class ProductService {
  async getAllProducts(filter: ProductFilter = {}, options: PaginationOptions = {}) {
    return productRepository.findAll(filter, options);
  }

  async getProductBySlug(slug: string): Promise<IProduct> {
    const product = await productRepository.findBySlug(slug);
    if (!product) {
      throw new CustomError('Product not found', HTTP_STATUS.NOT_FOUND);
    }
    return product;
  }

  async getProductById(id: string): Promise<IProduct> {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new CustomError('Product not found', HTTP_STATUS.NOT_FOUND);
    }
    return product;
  }

  async createProduct(
    data: Partial<IProduct>,
    imageFiles: Express.Multer.File[]
  ): Promise<IProduct> {
    // Check SKU uniqueness
    if (data.sku) {
      const existingSku = await productRepository.findBySku(data.sku);
      if (existingSku) {
        throw new CustomError(`Product with SKU ${data.sku} already exists`, HTTP_STATUS.CONFLICT);
      }
    }

    // Upload images to Cloudinary
    const uploadedImages = await Promise.all(
      imageFiles.map(async (file, index) => {
        const b64 = Buffer.from(file.buffer).toString('base64');
        const dataURI = `data:${file.mimetype};base64,${b64}`;
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: 'rupkatha-sarees/products',
          transformation: [
            { quality: 'auto:best', fetch_format: 'auto' },
            { width: 1200, height: 1200, crop: 'limit' },
          ],
        });
        return {
          url: result.secure_url,
          publicId: result.public_id,
          alt: data.name || '',
          isDefault: index === 0,
          sortOrder: index,
        };
      })
    );

    const product = await productRepository.create({
      ...data,
      images: uploadedImages,
    });

    return product;
  }

  async updateProduct(
    id: string,
    data: Partial<IProduct>,
    newImageFiles?: Express.Multer.File[]
  ): Promise<IProduct> {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new CustomError('Product not found', HTTP_STATUS.NOT_FOUND);
    }

    const mrp = data.price ?? product.price;
    const discountedPrice = data.discountedPrice ?? product.discountedPrice;
    const isSale = data.isSale ?? product.isSale;
    const salePrice = data.salePrice ?? product.salePrice;
    if (discountedPrice !== undefined && discountedPrice > mrp) {
      throw new CustomError('Discounted price cannot exceed MRP', HTTP_STATUS.BAD_REQUEST);
    }
    if (isSale && salePrice === undefined) {
      throw new CustomError('Sale price is required when product is marked as Sale', HTTP_STATUS.BAD_REQUEST);
    }
    if (isSale && salePrice !== undefined && salePrice > (discountedPrice ?? mrp)) {
      throw new CustomError('Sale price cannot exceed the discounted price', HTTP_STATUS.BAD_REQUEST);
    }
    const effectivePrice = isSale && salePrice !== undefined ? salePrice : discountedPrice ?? mrp;
    data.discountPercent = effectivePrice < mrp
      ? Math.round(((mrp - effectivePrice) / mrp) * 100)
      : 0;

    let images = [...product.images];

    // Upload new images if provided
    if (newImageFiles && newImageFiles.length > 0) {
      const uploadedImages = await Promise.all(
        newImageFiles.map(async (file, index) => {
          const b64 = Buffer.from(file.buffer).toString('base64');
          const dataURI = `data:${file.mimetype};base64,${b64}`;
          const result = await cloudinary.uploader.upload(dataURI, {
            folder: 'rupkatha-sarees/products',
            transformation: [
              { quality: 'auto:best', fetch_format: 'auto' },
            ],
          });
          return {
            url: result.secure_url,
            publicId: result.public_id,
            alt: data.name || product.name,
            isDefault: false,
            sortOrder: images.length + index,
          };
        })
      );
      images = [...images, ...uploadedImages];
    }

    const updated = await productRepository.updateById(id, { ...data, images });
    if (!updated) {
      throw new CustomError('Failed to update product', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return updated;
  }

  async deleteProduct(id: string): Promise<void> {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new CustomError('Product not found', HTTP_STATUS.NOT_FOUND);
    }

    // Delete images from Cloudinary
    await Promise.all(
      product.images.map((img) =>
        cloudinary.uploader.destroy(img.publicId).catch(console.error)
      )
    );

    await productRepository.deleteById(id);
  }

  async deleteProductImage(productId: string, publicId: string): Promise<IProduct> {
    const product = await productRepository.findById(productId);
    if (!product) {
      throw new CustomError('Product not found', HTTP_STATUS.NOT_FOUND);
    }

    const targetImage = product.images.find((img) => img.publicId === publicId);
    if (!targetImage) {
      throw new CustomError('Product image not found', HTTP_STATUS.NOT_FOUND);
    }

    await cloudinary.uploader.destroy(targetImage.publicId);

    const images = product.images
      .filter((img) => img.publicId !== publicId)
      .map((img, index) => ({
        url: img.url,
        publicId: img.publicId,
        alt: img.alt,
        isDefault: index === 0,
        sortOrder: index,
      }));
    const updated = await productRepository.updateById(productId, { images });
    if (!updated) {
      throw new CustomError('Failed to update product', HTTP_STATUS.INTERNAL_SERVER_ERROR);
    }

    return updated;
  }

  async searchProducts(searchTerm: string, filter: ProductFilter = {}, options: PaginationOptions = {}) {
    return productRepository.search(searchTerm, filter, options);
  }

  async getFeaturedProducts(limit = 8): Promise<IProduct[]> {
    return productRepository.findFeatured(limit);
  }

  async getNewArrivals(limit = 12): Promise<IProduct[]> {
    return productRepository.findNewArrivals(limit);
  }

  async getBestSellers(limit = 12): Promise<IProduct[]> {
    return productRepository.findBestSellers(limit);
  }

  async getRelatedProducts(productId: string, categoryId: string, limit = 6): Promise<IProduct[]> {
    return productRepository.findRelatedProducts(productId, categoryId, limit);
  }

  async getDashboardStats() {
    const [totalProducts, activeProducts, outOfStock, lowStock] = await Promise.all([
      productRepository.countDocuments(),
      productRepository.countDocuments({ isActive: true }),
      productRepository.countDocuments({ stock: 0 }),
      productRepository.findLowStockProducts(5),
    ]);

    return {
      totalProducts,
      activeProducts,
      outOfStock,
      lowStockCount: lowStock.length,
      lowStockProducts: lowStock,
    };
  }
}

export const productService = new ProductService();
