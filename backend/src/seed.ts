/**
 * ============================================================
 * PP’S AURA — DATABASE SEED SCRIPT
 * ============================================================
 * Run: npx ts-node src/seed.ts
 * ============================================================
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

import User from './models/User';
import Category from './models/Category';
import Product from './models/Product';
import Order from './models/Order';
import Review from './models/Review';
import Coupon from './models/Coupon';
import Banner from './models/Banner';

import { UserRole, OrderStatus, PaymentStatus, PaymentMethod, CouponType, ProductStatus } from './constants';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/sareeselling';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const generateOrderNumber = () =>
  `RUP-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

// ─── Seed Data ────────────────────────────────────────────────────────────────

async function seedUsers() {
  console.log('👤 Seeding users...');

  const passwordHash = await bcrypt.hash('Admin@123', 12);
  const customerHash = await bcrypt.hash('Customer@123', 12);

  const users = await User.insertMany([
    {
      name: 'Pranab Paul',
      email: 'admin@rupkathasarees.com',
      password: passwordHash,
      phone: '9876543210',
      role: UserRole.ADMIN,
      isEmailVerified: true,
      isActive: true,
      loyaltyPoints: 500,
      referralCode: 'ADMIN001',
      addresses: [
        {
          fullName: 'Pranab Paul',
          phone: '9876543210',
          addressLine1: '12 Park Street',
          city: 'Kolkata',
          state: 'West Bengal',
          pincode: '700016',
          country: 'India',
          isDefault: true,
          type: 'home',
        },
      ],
    },
    {
      name: 'Riya Sharma',
      email: 'riya@example.com',
      password: customerHash,
      phone: '9812345678',
      role: UserRole.CUSTOMER,
      isEmailVerified: true,
      isActive: true,
      loyaltyPoints: 250,
      referralCode: 'RIYA2025',
      addresses: [
        {
          fullName: 'Riya Sharma',
          phone: '9812345678',
          addressLine1: '45 Bose Road',
          addressLine2: 'Near Lake Gardens',
          city: 'Kolkata',
          state: 'West Bengal',
          pincode: '700045',
          country: 'India',
          isDefault: true,
          type: 'home',
        },
        {
          fullName: 'Riya Sharma',
          phone: '9812345678',
          addressLine1: 'Tech Park, Tower B, Floor 5',
          city: 'Salt Lake',
          state: 'West Bengal',
          pincode: '700091',
          country: 'India',
          isDefault: false,
          type: 'work',
        },
      ],
    },
    {
      name: 'Ananya Bose',
      email: 'ananya@example.com',
      password: customerHash,
      phone: '9823456789',
      role: UserRole.CUSTOMER,
      isEmailVerified: true,
      isActive: true,
      loyaltyPoints: 100,
      referralCode: 'ANAN2025',
      addresses: [
        {
          fullName: 'Ananya Bose',
          phone: '9823456789',
          addressLine1: '78 Jodhpur Park',
          city: 'Kolkata',
          state: 'West Bengal',
          pincode: '700068',
          country: 'India',
          isDefault: true,
          type: 'home',
        },
      ],
    },
    {
      name: 'Priya Menon',
      email: 'priya@example.com',
      password: customerHash,
      phone: '9834567890',
      role: UserRole.CUSTOMER,
      isEmailVerified: true,
      isActive: true,
      loyaltyPoints: 75,
      referralCode: 'PRIY2025',
      addresses: [
        {
          fullName: 'Priya Menon',
          phone: '9834567890',
          addressLine1: '22 MG Road',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560001',
          country: 'India',
          isDefault: true,
          type: 'home',
        },
      ],
    },
    {
      name: 'Sunita Verma',
      email: 'sunita@example.com',
      password: customerHash,
      phone: '9845678901',
      role: UserRole.CUSTOMER,
      isEmailVerified: false,
      isActive: true,
      loyaltyPoints: 0,
      referralCode: 'SUNI2025',
      addresses: [],
    },
  ]);

  console.log(`   ✅ Created ${users.length} users`);
  return users;
}

async function seedCategories() {
  console.log('📁 Seeding categories...');

  const categoryDefs = [
    {
      name: 'Silk Sarees',
      description: 'Luxurious pure silk sarees from across India, perfect for weddings and festive occasions.',
      image: 'https://res.cloudinary.com/demo/image/upload/v1/samples/silk-saree.jpg',
      imagePublicId: 'categories/silk',
      sortOrder: 1,
      isActive: true,
      productCount: 0,
      metaTitle: 'Buy Silk Sarees Online | PP’s Aura',
      metaDescription: 'Shop the finest collection of pure silk sarees — Kanjivaram, Banarasi, Mysore Silk and more.',
    },
    {
      name: 'Cotton Sarees',
      description: 'Lightweight and breathable cotton sarees for everyday wear and casual occasions.',
      image: 'https://res.cloudinary.com/demo/image/upload/v1/samples/cotton-saree.jpg',
      imagePublicId: 'categories/cotton',
      sortOrder: 2,
      isActive: true,
      productCount: 0,
    },
    {
      name: 'Tant Sarees',
      description: 'Traditional Bengali tant sarees known for their fine weave and elegant patterns.',
      image: 'https://res.cloudinary.com/demo/image/upload/v1/samples/tant-saree.jpg',
      imagePublicId: 'categories/tant',
      sortOrder: 3,
      isActive: true,
      productCount: 0,
    },
    {
      name: 'Banarasi Sarees',
      description: 'Opulent Banarasi silk sarees with gold and silver zari work from Varanasi.',
      image: 'https://res.cloudinary.com/demo/image/upload/v1/samples/banarasi-saree.jpg',
      imagePublicId: 'categories/banarasi',
      sortOrder: 4,
      isActive: true,
      productCount: 0,
    },
    {
      name: 'Kanjivaram Sarees',
      description: 'Pure Kanjivaram silk sarees from Tamil Nadu with distinctive temple borders.',
      image: 'https://res.cloudinary.com/demo/image/upload/v1/samples/kanjivaram-saree.jpg',
      imagePublicId: 'categories/kanjivaram',
      sortOrder: 5,
      isActive: true,
      productCount: 0,
    },
    {
      name: 'Bridal Sarees',
      description: 'Exquisite bridal sarees for the most special day of your life.',
      image: 'https://res.cloudinary.com/demo/image/upload/v1/samples/bridal-saree.jpg',
      imagePublicId: 'categories/bridal',
      sortOrder: 6,
      isActive: true,
      productCount: 0,
    },
    {
      name: 'Georgette Sarees',
      description: 'Graceful georgette sarees perfect for parties, receptions and formal events.',
      image: 'https://res.cloudinary.com/demo/image/upload/v1/samples/georgette-saree.jpg',
      imagePublicId: 'categories/georgette',
      sortOrder: 7,
      isActive: true,
      productCount: 0,
    },
    {
      name: 'Handloom Sarees',
      description: 'Authentic handloom sarees crafted by skilled artisans using traditional techniques.',
      image: 'https://res.cloudinary.com/demo/image/upload/v1/samples/handloom-saree.jpg',
      imagePublicId: 'categories/handloom',
      sortOrder: 8,
      isActive: true,
      productCount: 0,
    },
  ];

  // Use create() to trigger pre-save hooks (slug generation)
  const categories = await Category.create(categoryDefs);

  console.log(`   ✅ Created ${categories.length} categories`);
  return categories;
}

async function seedProducts(categories: mongoose.Document[]) {
  console.log('🛍️  Seeding products...');

  const catMap: Record<string, string> = {};
  (categories as unknown as Array<{ name: string; _id: mongoose.Types.ObjectId }>).forEach((c) => {
    catMap[c.name] = String(c._id);
  });

  const PLACEHOLDER = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80';
  const SILK_IMG = 'https://images.unsplash.com/photo-1583391733975-5408a4e53e90?w=800&q=80';
  const COTTON_IMG = 'https://images.unsplash.com/photo-1585914924626-15adac1e6402?w=800&q=80';
  const BRIDAL_IMG = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&q=80';

  const productDocs = [
    // ── Silk ──────────────────────────────────────────────────────────────────
    {
      name: 'Royal Kanjivaram Pure Silk Saree',
      description: 'A magnificent pure Kanjivaram silk saree woven in the ancient city of Kanchipuram, Tamil Nadu. Features traditional temple border with intricate gold zari work. The rich jewel-tone colour and heavy pallu make it perfect for weddings and grand celebrations.',
      shortDescription: 'Pure Kanjivaram silk with gold zari temple border, ideal for weddings.',
      sku: 'SILK-KJV-001',
      category: catMap['Silk Sarees'],
      fabric: 'Kanjivaram Silk',
      occasion: ['Wedding', 'Festival', 'Reception'],
      style: 'Traditional',
      color: 'Deep Red',
      colorCode: '#8b1a1a',
      pattern: 'Temple Border',
      blouseLength: '80 cm',
      sareeLength: '5.5 meters',
      careInstructions: ['Dry clean only', 'Store in muslin cloth', 'Do not wring'],
      price: 18500,
      salePrice: 15999,
      stock: 8,
      isFeatured: true,
      isBestSeller: true,
      isNewArrival: false,
      isBridal: false,
      status: ProductStatus.ACTIVE,
      isActive: true,
      averageRating: 4.8,
      totalReviews: 23,
      soldCount: 47,
      tags: ['kanjivaram', 'silk', 'wedding', 'zari'],
      images: [
        { url: SILK_IMG, publicId: 'products/silk-kjv-001-1', isDefault: true, sortOrder: 0 },
        { url: PLACEHOLDER, publicId: 'products/silk-kjv-001-2', isDefault: false, sortOrder: 1 },
      ],
    },
    {
      name: 'Mysore Crepe Silk Saree — Lavender',
      description: 'Elegant Mysore crepe silk saree in a soothing lavender hue with a delicate silver border. Lightweight and comfortable, perfect for festive gatherings and formal office events alike.',
      shortDescription: 'Mysore crepe silk in lavender with silver border — lightweight & graceful.',
      sku: 'SILK-MYS-002',
      category: catMap['Silk Sarees'],
      fabric: 'Mysore Silk',
      occasion: ['Festival', 'Office', 'Party'],
      style: 'Contemporary',
      color: 'Lavender',
      colorCode: '#967bb6',
      pattern: 'Plain with Border',
      price: 7800,
      salePrice: 6499,
      stock: 15,
      isFeatured: true,
      isNewArrival: true,
      isBridal: false,
      status: ProductStatus.ACTIVE,
      isActive: true,
      averageRating: 4.5,
      totalReviews: 11,
      soldCount: 32,
      tags: ['mysore', 'silk', 'crepe', 'lavender'],
      images: [
        { url: SILK_IMG, publicId: 'products/silk-mys-002-1', isDefault: true, sortOrder: 0 },
      ],
    },
    // ── Banarasi ─────────────────────────────────────────────────────────────
    {
      name: 'Pure Banarasi Silk Saree — Ivory Gold',
      description: 'A timeless Banarasi silk saree woven in the ancient city of Varanasi. Features exquisite gold zari brocade work on an ivory base. This heritage piece has been crafted by master weavers using traditional handloom techniques passed down through generations.',
      shortDescription: 'Heritage Banarasi silk with gold brocade — a timeless masterpiece.',
      sku: 'BAN-SILK-001',
      category: catMap['Banarasi Sarees'],
      fabric: 'Banarasi Silk',
      occasion: ['Wedding', 'Reception', 'Puja', 'Sangeet'],
      style: 'Traditional',
      color: 'Ivory',
      colorCode: '#fffff0',
      pattern: 'Brocade',
      price: 22000,
      salePrice: 18500,
      stock: 5,
      isFeatured: true,
      isBestSeller: true,
      isBridal: true,
      isNewArrival: false,
      status: ProductStatus.ACTIVE,
      isActive: true,
      averageRating: 4.9,
      totalReviews: 34,
      soldCount: 63,
      tags: ['banarasi', 'silk', 'brocade', 'bridal', 'gold'],
      images: [
        { url: BRIDAL_IMG, publicId: 'products/ban-silk-001-1', isDefault: true, sortOrder: 0 },
        { url: PLACEHOLDER, publicId: 'products/ban-silk-001-2', isDefault: false, sortOrder: 1 },
      ],
    },
    {
      name: 'Banarasi Georgette Saree — Royal Blue',
      description: 'Gorgeous Banarasi georgette saree with intricate silver zari floral motifs. The royal blue colour exudes royalty and the georgette fabric drapes beautifully.',
      shortDescription: 'Banarasi georgette with silver zari — royal blue elegance.',
      sku: 'BAN-GEO-002',
      category: catMap['Banarasi Sarees'],
      fabric: 'Georgette',
      occasion: ['Party', 'Reception', 'Festival'],
      style: 'Semi-formal',
      color: 'Royal Blue',
      colorCode: '#4169e1',
      pattern: 'Floral Zari',
      price: 6500,
      stock: 20,
      isFeatured: false,
      isNewArrival: true,
      isBridal: false,
      status: ProductStatus.ACTIVE,
      isActive: true,
      averageRating: 4.3,
      totalReviews: 8,
      soldCount: 18,
      tags: ['banarasi', 'georgette', 'blue', 'zari'],
      images: [
        { url: PLACEHOLDER, publicId: 'products/ban-geo-002-1', isDefault: true, sortOrder: 0 },
      ],
    },
    // ── Cotton ────────────────────────────────────────────────────────────────
    {
      name: 'Handwoven Bengal Cotton Saree — Mustard',
      description: 'A beautifully handwoven pure cotton saree from the heartland of West Bengal. The vibrant mustard yellow colour is complemented by a bold red border and traditional woven motifs. Soft, breathable and perfect for daily wear.',
      shortDescription: 'Handwoven Bengal cotton in mustard with red border — perfect daily wear.',
      sku: 'COT-BEN-001',
      category: catMap['Cotton Sarees'],
      fabric: 'Cotton',
      occasion: ['Casual', 'Daily Wear', 'Puja'],
      style: 'Traditional',
      color: 'Mustard Yellow',
      colorCode: '#ffdb58',
      pattern: 'Woven Checks',
      price: 1200,
      stock: 35,
      isFeatured: false,
      isBestSeller: true,
      isNewArrival: false,
      isBridal: false,
      status: ProductStatus.ACTIVE,
      isActive: true,
      averageRating: 4.6,
      totalReviews: 45,
      soldCount: 120,
      tags: ['cotton', 'bengal', 'handwoven', 'daily wear'],
      images: [
        { url: COTTON_IMG, publicId: 'products/cot-ben-001-1', isDefault: true, sortOrder: 0 },
      ],
    },
    {
      name: 'Organic Khadi Cotton Saree — White',
      description: 'Pure organic khadi cotton saree in crisp white with a navy blue border. Ethically produced by artisan cooperatives. A sustainable fashion choice that celebrates India\'s khadi heritage.',
      shortDescription: 'Organic khadi cotton in white — sustainable, ethical, beautiful.',
      sku: 'COT-KHA-002',
      category: catMap['Cotton Sarees'],
      fabric: 'Khadi',
      occasion: ['Casual', 'Office', 'Daily Wear'],
      style: 'Minimalist',
      color: 'White',
      colorCode: '#ffffff',
      pattern: 'Plain with Border',
      price: 1800,
      salePrice: 1499,
      stock: 25,
      isFeatured: false,
      isNewArrival: true,
      isBridal: false,
      status: ProductStatus.ACTIVE,
      isActive: true,
      averageRating: 4.4,
      totalReviews: 19,
      soldCount: 55,
      tags: ['khadi', 'cotton', 'organic', 'white', 'sustainable'],
      images: [
        { url: COTTON_IMG, publicId: 'products/cot-kha-002-1', isDefault: true, sortOrder: 0 },
      ],
    },
    // ── Tant ──────────────────────────────────────────────────────────────────
    {
      name: 'Pure Tant Saree — Turquoise Jamdani',
      description: 'A stunning pure tant saree with intricate Jamdani weave in a refreshing turquoise colour. Tant sarees from West Bengal are renowned for their fine quality and traditional patterns. Light weight and ideal for summer and monsoon.',
      shortDescription: 'Pure tant with Jamdani weave in turquoise — the pride of Bengal.',
      sku: 'TAN-JAM-001',
      category: catMap['Tant Sarees'],
      fabric: 'Tant',
      occasion: ['Casual', 'Festival', 'Puja'],
      style: 'Traditional',
      color: 'Turquoise',
      colorCode: '#40e0d0',
      pattern: 'Jamdani',
      price: 2200,
      stock: 18,
      isFeatured: true,
      isNewArrival: true,
      isBridal: false,
      status: ProductStatus.ACTIVE,
      isActive: true,
      averageRating: 4.7,
      totalReviews: 28,
      soldCount: 67,
      tags: ['tant', 'jamdani', 'bengal', 'turquoise'],
      images: [
        { url: COTTON_IMG, publicId: 'products/tan-jam-001-1', isDefault: true, sortOrder: 0 },
      ],
    },
    // ── Bridal ────────────────────────────────────────────────────────────────
    {
      name: 'Grand Bridal Kanjivaram — Crimson & Gold',
      description: 'The ultimate bridal saree for the most precious day of your life. A grand pure Kanjivaram silk saree in rich crimson adorned with heavy gold zari throughout the body and a majestic pallu. Paired with a matching blouse piece. This will be an heirloom for generations.',
      shortDescription: 'Grand pure Kanjivaram bridal saree in crimson with heavy gold zari.',
      sku: 'BRI-KJV-001',
      category: catMap['Bridal Sarees'],
      fabric: 'Kanjivaram Silk',
      occasion: ['Wedding', 'Reception', 'Sangeet'],
      style: 'Bridal',
      color: 'Crimson',
      colorCode: '#dc143c',
      pattern: 'Heavy Zari All Over',
      price: 45000,
      salePrice: 39999,
      stock: 3,
      isFeatured: true,
      isBestSeller: false,
      isNewArrival: false,
      isBridal: true,
      status: ProductStatus.ACTIVE,
      isActive: true,
      averageRating: 5.0,
      totalReviews: 7,
      soldCount: 12,
      tags: ['bridal', 'kanjivaram', 'crimson', 'gold', 'wedding'],
      images: [
        { url: BRIDAL_IMG, publicId: 'products/bri-kjv-001-1', isDefault: true, sortOrder: 0 },
        { url: SILK_IMG, publicId: 'products/bri-kjv-001-2', isDefault: false, sortOrder: 1 },
      ],
    },
    {
      name: 'Bridal Lehenga Saree — Peach Rose',
      description: 'A contemporary bridal lehenga-style saree in a gorgeous peach rose colour, embellished with sequin and thread embroidery. Perfect for modern brides who want a traditional look with a contemporary twist.',
      shortDescription: 'Modern bridal lehenga saree in peach rose with sequin embroidery.',
      sku: 'BRI-LEH-002',
      category: catMap['Bridal Sarees'],
      fabric: 'Net',
      occasion: ['Wedding', 'Reception'],
      style: 'Fusion',
      color: 'Peach Rose',
      colorCode: '#ff9999',
      pattern: 'Sequin Embroidery',
      price: 12500,
      salePrice: 10999,
      stock: 7,
      isFeatured: true,
      isNewArrival: true,
      isBridal: true,
      status: ProductStatus.ACTIVE,
      isActive: true,
      averageRating: 4.6,
      totalReviews: 15,
      soldCount: 24,
      tags: ['bridal', 'lehenga saree', 'peach', 'embroidery', 'modern'],
      images: [
        { url: BRIDAL_IMG, publicId: 'products/bri-leh-002-1', isDefault: true, sortOrder: 0 },
      ],
    },
    // ── Georgette ─────────────────────────────────────────────────────────────
    {
      name: 'Designer Georgette Saree — Emerald Green',
      description: 'A stunning designer georgette saree in rich emerald green with intricate resham embroidery along the border and pallu. The flowy fabric drapes elegantly and the colour makes a bold statement at any party or event.',
      shortDescription: 'Designer georgette in emerald green with resham embroidery border.',
      sku: 'GEO-DES-001',
      category: catMap['Georgette Sarees'],
      fabric: 'Georgette',
      occasion: ['Party', 'Festival', 'Reception'],
      style: 'Designer',
      color: 'Emerald Green',
      colorCode: '#50c878',
      pattern: 'Embroidered Border',
      price: 4500,
      salePrice: 3799,
      stock: 22,
      isFeatured: true,
      isNewArrival: false,
      isBridal: false,
      status: ProductStatus.ACTIVE,
      isActive: true,
      averageRating: 4.4,
      totalReviews: 31,
      soldCount: 89,
      tags: ['georgette', 'designer', 'green', 'embroidery'],
      images: [
        { url: PLACEHOLDER, publicId: 'products/geo-des-001-1', isDefault: true, sortOrder: 0 },
      ],
    },
    // ── Handloom ──────────────────────────────────────────────────────────────
    {
      name: 'Sambalpuri Ikat Handloom Saree — Rust',
      description: 'Authentic Sambalpuri Ikat handloom saree from Odisha, crafted using the traditional resist-dyeing technique. The intricate ikat patterns on a warm rust base are a testament to the artisan\'s skill. GI-tagged heritage textile.',
      shortDescription: 'GI-tagged Sambalpuri Ikat from Odisha — authentic handloom artistry.',
      sku: 'HAN-SAM-001',
      category: catMap['Handloom Sarees'],
      fabric: 'Cotton Ikat',
      occasion: ['Casual', 'Festival', 'Office'],
      style: 'Traditional',
      color: 'Rust Orange',
      colorCode: '#b7410e',
      pattern: 'Ikat',
      price: 3200,
      stock: 12,
      isFeatured: true,
      isNewArrival: false,
      isBridal: false,
      status: ProductStatus.ACTIVE,
      isActive: true,
      averageRating: 4.8,
      totalReviews: 22,
      soldCount: 41,
      tags: ['sambalpuri', 'ikat', 'handloom', 'odisha', 'gi-tagged'],
      images: [
        { url: COTTON_IMG, publicId: 'products/han-sam-001-1', isDefault: true, sortOrder: 0 },
      ],
    },
    // ── Kanjivaram ────────────────────────────────────────────────────────────
    {
      name: 'Kanjivaram Silk — Peacock Blue',
      description: 'A breathtaking Kanjivaram silk saree in the iconic peacock blue colour with a contrasting green pallu edged in thick gold zari. The peacock motifs woven throughout the body are symbolic of South Indian culture.',
      shortDescription: 'Kanjivaram silk in peacock blue with green pallu and gold zari.',
      sku: 'SILK-KJV-003',
      category: catMap['Silk Sarees'],
      fabric: 'Kanjivaram Silk',
      occasion: ['Wedding', 'Festival', 'Puja'],
      style: 'Traditional',
      color: 'Peacock Blue',
      colorCode: '#005f6b',
      pattern: 'Peacock Motif',
      price: 13500,
      salePrice: 11999,
      stock: 6,
      isFeatured: true,
      isNewArrival: false,
      isBridal: false,
      status: ProductStatus.ACTIVE,
      isActive: true,
      averageRating: 4.7,
      totalReviews: 18,
      soldCount: 29,
      tags: ['kanjivaram', 'silk', 'peacock', 'blue', 'festival'],
      images: [
        { url: SILK_IMG, publicId: 'products/silk-kjv-003-1', isDefault: true, sortOrder: 0 },
      ],
    },
  ];

  // Use create() to trigger pre-save hooks (slug + SKU generation)
  const products = await Product.create(productDocs);

  // Update category product counts
  for (const cat of categories as unknown as Array<{ _id: mongoose.Types.ObjectId }>) {
    const count = await Product.countDocuments({ category: cat._id, isActive: true });
    await Category.findByIdAndUpdate(cat._id, { productCount: count });
  }

  console.log(`   ✅ Created ${products.length} products`);
  return products;
}

async function seedBanners() {
  console.log('🖼️  Seeding banners...');

  const HERO_IMG = 'https://images.unsplash.com/photo-1583391733975-5408a4e53e90?w=1600&q=85';
  const MID_IMG = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1200&q=85';

  const banners = await Banner.insertMany([
    {
      title: 'New Arrivals — Monsoon Collection 2026',
      subtitle: 'Discover the finest handloom sarees this season. Free shipping above ₹999.',
      image: HERO_IMG,
      imagePublicId: 'banners/hero-monsoon-2026',
      link: '/products?isNewArrival=true',
      position: 'hero',
      sortOrder: 1,
      isActive: true,
    },
    {
      title: 'Bridal Splendour — Grand Kanjivaram Collection',
      subtitle: 'The wedding of your dreams deserves the most exquisite saree.',
      image: HERO_IMG,
      imagePublicId: 'banners/hero-bridal-2026',
      link: '/products?isBridal=true',
      position: 'hero',
      sortOrder: 2,
      isActive: true,
    },
    {
      title: 'Silk Sale — Up to 20% Off',
      subtitle: 'Limited time offer on our premium silk collection.',
      image: MID_IMG,
      imagePublicId: 'banners/mid-silk-sale',
      link: '/products?fabric=silk&sale=true',
      position: 'middle',
      sortOrder: 1,
      isActive: true,
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    },
    {
      title: 'Free Shipping on Orders Above ₹999',
      subtitle: 'Across India. All saree styles.',
      image: MID_IMG,
      imagePublicId: 'banners/bottom-freeship',
      link: '/products',
      position: 'bottom',
      sortOrder: 1,
      isActive: true,
    },
  ]);

  console.log(`   ✅ Created ${banners.length} banners`);
  return banners;
}

async function seedCoupons() {
  console.log('🎟️  Seeding coupons...');

  const now = new Date();
  const future = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year

  const coupons = await Coupon.insertMany([
    {
      code: 'WELCOME10',
      description: '10% off on your first order',
      type: CouponType.PERCENTAGE,
      discountValue: 10,
      minOrderAmount: 500,
      maxDiscount: 500,
      usageLimit: -1,
      userUsageLimit: 1,
      isActive: true,
      startDate: now,
      endDate: future,
    },
    {
      code: 'FLAT500',
      description: '₹500 flat off on orders above ₹3000',
      type: CouponType.FIXED,
      discountValue: 500,
      minOrderAmount: 3000,
      usageLimit: 200,
      userUsageLimit: 2,
      isActive: true,
      startDate: now,
      endDate: future,
    },
    {
      code: 'FREESHIP',
      description: 'Free shipping on any order',
      type: CouponType.FREE_SHIPPING,
      discountValue: 0,
      minOrderAmount: 0,
      usageLimit: -1,
      userUsageLimit: 3,
      isActive: true,
      startDate: now,
      endDate: future,
    },
    {
      code: 'SILK15',
      description: '15% off on all silk sarees',
      type: CouponType.PERCENTAGE,
      discountValue: 15,
      minOrderAmount: 5000,
      maxDiscount: 2000,
      usageLimit: 100,
      userUsageLimit: 1,
      isActive: true,
      startDate: now,
      endDate: future,
    },
    {
      code: 'BRIDAL20',
      description: '20% off on bridal collection',
      type: CouponType.PERCENTAGE,
      discountValue: 20,
      minOrderAmount: 10000,
      maxDiscount: 5000,
      usageLimit: 50,
      userUsageLimit: 1,
      isActive: true,
      startDate: now,
      endDate: future,
    },
    {
      code: 'NEWUSER50',
      description: 'New user special — ₹50 off on first order',
      type: CouponType.FIXED,
      discountValue: 50,
      minOrderAmount: 299,
      usageLimit: -1,
      userUsageLimit: 1,
      isActive: true,
      startDate: now,
      endDate: future,
    },
    {
      code: 'SUMMER25',
      description: '25% off on cotton & tant sarees',
      type: CouponType.PERCENTAGE,
      discountValue: 25,
      minOrderAmount: 800,
      maxDiscount: 1000,
      usageLimit: 300,
      usedCount: 42,
      userUsageLimit: 2,
      isActive: false, // expired campaign
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-06-30'),
    },
  ]);

  console.log(`   ✅ Created ${coupons.length} coupons`);
  return coupons;
}

async function seedOrdersAndReviews(
  users: mongoose.Document[],
  products: mongoose.Document[]
) {
  console.log('📦 Seeding orders...');

  type UserDoc = { _id: mongoose.Types.ObjectId; name: string; email: string; addresses: Array<{ fullName: string; phone: string; addressLine1: string; addressLine2?: string; city: string; state: string; pincode: string; country: string }> };
  type ProductDoc = { _id: mongoose.Types.ObjectId; name: string; sku: string; price: number; salePrice?: number; images: Array<{ url: string }> };

  const [, riya, ananya, priya] = users as unknown as UserDoc[];
  const [kanjivaram, mysore, banarasi, , bengalCotton, , tant, bridalKjv, , georgette, handloom, kanjiBlue] = products as unknown as ProductDoc[];

  const getAddr = (u: UserDoc) => ({
    fullName: u.addresses[0].fullName,
    phone: u.addresses[0].phone,
    addressLine1: u.addresses[0].addressLine1,
    addressLine2: u.addresses[0].addressLine2,
    city: u.addresses[0].city,
    state: u.addresses[0].state,
    pincode: u.addresses[0].pincode,
    country: u.addresses[0].country,
  });

  const effectivePrice = (p: ProductDoc) => p.salePrice ?? p.price;

  const orderDocs = [
    // Order 1 — Riya, Delivered
    {
      orderNumber: 'RUP-20260601-1001',
      user: riya._id,
      items: [
        {
          product: kanjivaram._id,
          name: kanjivaram.name,
          image: kanjivaram.images[0].url,
          price: effectivePrice(kanjivaram),
          quantity: 1,
          sku: kanjivaram.sku,
          discount: 0,
          subtotal: effectivePrice(kanjivaram),
        },
        {
          product: tant._id,
          name: tant.name,
          image: tant.images[0].url,
          price: effectivePrice(tant),
          quantity: 2,
          sku: tant.sku,
          discount: 0,
          subtotal: effectivePrice(tant) * 2,
        },
      ],
      shippingAddress: getAddr(riya),
      paymentInfo: {
        method: PaymentMethod.RAZORPAY,
        razorpayOrderId: 'order_test001',
        razorpayPaymentId: 'pay_test001',
        status: PaymentStatus.COMPLETED,
        paidAt: new Date('2026-06-01T10:30:00Z'),
      },
      status: OrderStatus.DELIVERED,
      subtotal: effectivePrice(kanjivaram) + effectivePrice(tant) * 2,
      shippingCharge: 0,
      taxAmount: 0,
      discount: 0,
      couponDiscount: 0,
      codCharges: 0,
      totalAmount: effectivePrice(kanjivaram) + effectivePrice(tant) * 2,
      loyaltyPointsEarned: Math.floor((effectivePrice(kanjivaram) + effectivePrice(tant) * 2)),
      loyaltyPointsRedeemed: 0,
      deliveredAt: new Date('2026-06-06T14:00:00Z'),
      isReturnable: true,
      returnWindowDays: 7,
      createdAt: new Date('2026-06-01T10:00:00Z'),
    },
    // Order 2 — Riya, Shipped
    {
      orderNumber: 'RUP-20260720-1002',
      user: riya._id,
      items: [
        {
          product: banarasi._id,
          name: banarasi.name,
          image: banarasi.images[0].url,
          price: effectivePrice(banarasi),
          quantity: 1,
          sku: banarasi.sku,
          discount: 0,
          subtotal: effectivePrice(banarasi),
        },
      ],
      shippingAddress: getAddr(riya),
      paymentInfo: {
        method: PaymentMethod.COD,
        status: PaymentStatus.PENDING,
      },
      trackingInfo: {
        courier: 'Delhivery',
        trackingNumber: 'DLVY123456789IN',
        trackingUrl: 'https://www.delhivery.com/track/package/DLVY123456789IN',
        shippedAt: new Date('2026-07-22T08:00:00Z'),
        expectedDelivery: new Date('2026-07-27T18:00:00Z'),
      },
      status: OrderStatus.SHIPPED,
      subtotal: effectivePrice(banarasi),
      shippingCharge: 0,
      taxAmount: 0,
      discount: 0,
      couponDiscount: 0,
      codCharges: 49,
      totalAmount: effectivePrice(banarasi) + 49,
      loyaltyPointsEarned: 0,
      loyaltyPointsRedeemed: 0,
      isReturnable: false,
      returnWindowDays: 7,
      createdAt: new Date('2026-07-20T11:00:00Z'),
    },
    // Order 3 — Ananya, Processing
    {
      orderNumber: 'RUP-20260725-1003',
      user: ananya._id,
      items: [
        {
          product: mysore._id,
          name: mysore.name,
          image: mysore.images[0].url,
          price: effectivePrice(mysore),
          quantity: 1,
          sku: mysore.sku,
          discount: 0,
          subtotal: effectivePrice(mysore),
        },
        {
          product: georgette._id,
          name: georgette.name,
          image: georgette.images[0].url,
          price: effectivePrice(georgette),
          quantity: 1,
          sku: georgette.sku,
          discount: 0,
          subtotal: effectivePrice(georgette),
        },
      ],
      shippingAddress: getAddr(ananya),
      paymentInfo: {
        method: PaymentMethod.RAZORPAY,
        razorpayOrderId: 'order_test003',
        razorpayPaymentId: 'pay_test003',
        status: PaymentStatus.COMPLETED,
        paidAt: new Date('2026-07-25T09:00:00Z'),
      },
      status: OrderStatus.PROCESSING,
      subtotal: effectivePrice(mysore) + effectivePrice(georgette),
      shippingCharge: 0,
      taxAmount: 0,
      discount: 500,
      couponCode: 'FLAT500',
      couponDiscount: 500,
      codCharges: 0,
      totalAmount: effectivePrice(mysore) + effectivePrice(georgette) - 500,
      loyaltyPointsEarned: Math.floor(effectivePrice(mysore) + effectivePrice(georgette) - 500),
      loyaltyPointsRedeemed: 0,
      isReturnable: false,
      returnWindowDays: 7,
      createdAt: new Date('2026-07-25T08:45:00Z'),
    },
    // Order 4 — Priya, Pending (COD)
    {
      orderNumber: 'RUP-20260805-1004',
      user: priya._id,
      items: [
        {
          product: bridalKjv._id,
          name: bridalKjv.name,
          image: bridalKjv.images[0].url,
          price: effectivePrice(bridalKjv),
          quantity: 1,
          sku: bridalKjv.sku,
          discount: 0,
          subtotal: effectivePrice(bridalKjv),
        },
      ],
      shippingAddress: getAddr(priya),
      paymentInfo: {
        method: PaymentMethod.COD,
        status: PaymentStatus.PENDING,
      },
      status: OrderStatus.CONFIRMED,
      subtotal: effectivePrice(bridalKjv),
      shippingCharge: 0,
      taxAmount: 0,
      discount: 0,
      couponDiscount: 0,
      codCharges: 49,
      totalAmount: effectivePrice(bridalKjv) + 49,
      loyaltyPointsEarned: 0,
      loyaltyPointsRedeemed: 0,
      notes: 'Please pack carefully with extra bubble wrap.',
      isReturnable: false,
      returnWindowDays: 7,
      createdAt: new Date('2026-08-05T07:00:00Z'),
    },
    // Order 5 — Ananya, Delivered (for review)
    {
      orderNumber: 'RUP-20260601-1005',
      user: ananya._id,
      items: [
        {
          product: bengalCotton._id,
          name: bengalCotton.name,
          image: bengalCotton.images[0].url,
          price: effectivePrice(bengalCotton),
          quantity: 3,
          sku: bengalCotton.sku,
          discount: 0,
          subtotal: effectivePrice(bengalCotton) * 3,
        },
      ],
      shippingAddress: getAddr(ananya),
      paymentInfo: {
        method: PaymentMethod.UPI,
        status: PaymentStatus.COMPLETED,
        paidAt: new Date('2026-06-01T08:00:00Z'),
      },
      status: OrderStatus.DELIVERED,
      subtotal: effectivePrice(bengalCotton) * 3,
      shippingCharge: 0,
      taxAmount: 0,
      discount: 0,
      couponDiscount: 0,
      codCharges: 0,
      totalAmount: effectivePrice(bengalCotton) * 3,
      loyaltyPointsEarned: Math.floor(effectivePrice(bengalCotton) * 3),
      loyaltyPointsRedeemed: 0,
      deliveredAt: new Date('2026-06-05T12:00:00Z'),
      isReturnable: true,
      returnWindowDays: 7,
      createdAt: new Date('2026-06-01T07:30:00Z'),
    },
    // Order 6 — Riya, Cancelled
    {
      orderNumber: 'RUP-20260610-1006',
      user: riya._id,
      items: [
        {
          product: handloom._id,
          name: handloom.name,
          image: handloom.images[0].url,
          price: effectivePrice(handloom),
          quantity: 1,
          sku: handloom.sku,
          discount: 0,
          subtotal: effectivePrice(handloom),
        },
      ],
      shippingAddress: getAddr(riya),
      paymentInfo: {
        method: PaymentMethod.RAZORPAY,
        status: PaymentStatus.REFUNDED,
      },
      status: OrderStatus.CANCELLED,
      subtotal: effectivePrice(handloom),
      shippingCharge: 99,
      taxAmount: 0,
      discount: 0,
      couponDiscount: 0,
      codCharges: 0,
      totalAmount: effectivePrice(handloom) + 99,
      loyaltyPointsEarned: 0,
      loyaltyPointsRedeemed: 0,
      cancelReason: 'Ordered by mistake',
      isReturnable: false,
      returnWindowDays: 7,
      createdAt: new Date('2026-06-10T09:00:00Z'),
    },
    // Order 7 — Priya, Delivered (for review)
    {
      orderNumber: 'RUP-20260701-1007',
      user: priya._id,
      items: [
        {
          product: kanjiBlue._id,
          name: kanjiBlue.name,
          image: kanjiBlue.images[0].url,
          price: effectivePrice(kanjiBlue),
          quantity: 1,
          sku: kanjiBlue.sku,
          discount: 0,
          subtotal: effectivePrice(kanjiBlue),
        },
      ],
      shippingAddress: getAddr(priya),
      paymentInfo: {
        method: PaymentMethod.RAZORPAY,
        razorpayOrderId: 'order_test007',
        razorpayPaymentId: 'pay_test007',
        status: PaymentStatus.COMPLETED,
        paidAt: new Date('2026-07-01T11:00:00Z'),
      },
      status: OrderStatus.DELIVERED,
      subtotal: effectivePrice(kanjiBlue),
      shippingCharge: 0,
      taxAmount: 0,
      discount: 0,
      couponDiscount: 0,
      codCharges: 0,
      totalAmount: effectivePrice(kanjiBlue),
      loyaltyPointsEarned: Math.floor(effectivePrice(kanjiBlue)),
      loyaltyPointsRedeemed: 0,
      deliveredAt: new Date('2026-07-06T16:00:00Z'),
      isReturnable: true,
      returnWindowDays: 7,
      createdAt: new Date('2026-07-01T10:30:00Z'),
    },
  ];

  const orders = await Order.create(orderDocs);
  console.log(`   ✅ Created ${orders.length} orders`);

  // ── Seed Reviews ────────────────────────────────────────────────────────────
  console.log('⭐ Seeding reviews...');

  const reviewDocs = [
    {
      product: kanjivaram._id,
      user: riya._id,
      order: orders[0]._id,
      rating: 5,
      title: 'Absolutely stunning — worth every rupee!',
      comment: 'I wore this for my sister\'s wedding and received so many compliments. The zari work is incredibly detailed and the colour is exactly as shown. The quality of silk is premium. Packing was also very careful. Highly recommend PP’s Aura!',
      isVerifiedPurchase: true,
      isApproved: true,
      helpfulCount: 18,
      adminReply: 'Thank you so much, Riya! We\'re delighted the saree was perfect for your sister\'s wedding. 💛',
      adminReplyAt: new Date('2026-06-10T10:00:00Z'),
      createdAt: new Date('2026-06-08T14:00:00Z'),
    },
    {
      product: tant._id,
      user: riya._id,
      order: orders[0]._id,
      rating: 4,
      title: 'Beautiful tant with great weave quality',
      comment: 'Lovely tant saree. The Jamdani pattern is very well woven and the colour is vibrant. Comfortable to wear in summer. Only minor issue — the blouse piece border frayed slightly. But overall excellent value for money.',
      isVerifiedPurchase: true,
      isApproved: true,
      helpfulCount: 7,
      createdAt: new Date('2026-06-09T11:00:00Z'),
    },
    {
      product: bengalCotton._id,
      user: ananya._id,
      order: orders[4]._id,
      rating: 5,
      title: 'Best everyday cotton saree I\'ve bought',
      comment: 'Ordered 3 pieces as daily wear sarees and I couldn\'t be happier. The cotton is pure and breathable, perfect for Kolkata\'s humidity. After 3 washes the colour is still vibrant. Will definitely order more colours!',
      isVerifiedPurchase: true,
      isApproved: true,
      helpfulCount: 24,
      adminReply: 'So glad you loved them, Ananya! These are indeed our best sellers. 🌿',
      adminReplyAt: new Date('2026-06-10T09:00:00Z'),
      createdAt: new Date('2026-06-07T10:00:00Z'),
    },
    {
      product: kanjiBlue._id,
      user: priya._id,
      order: orders[6]._id,
      rating: 5,
      title: 'The peacock colour is even more beautiful in person',
      comment: 'This Kanjivaram saree exceeded all my expectations. The peacock blue is incredibly rich and the contrasting green pallu is stunning. The gold zari is heavy and of excellent quality. Wore it for my cousin\'s wedding in Bangalore — everyone asked where I got it from!',
      isVerifiedPurchase: true,
      isApproved: true,
      helpfulCount: 31,
      createdAt: new Date('2026-07-08T15:00:00Z'),
    },
    // Pending review (not yet approved)
    {
      product: banarasi._id,
      user: ananya._id,
      rating: 4,
      title: 'Gorgeous Banarasi — waiting for delivery of second one',
      comment: 'Bought this for my engagement. The ivory and gold combination is timeless. The brocade work feels authentic. Delivery was on time. I liked it so much I have already ordered another colour!',
      isVerifiedPurchase: false,
      isApproved: false,
      helpfulCount: 0,
      createdAt: new Date('2026-07-26T12:00:00Z'),
    },
  ];

  const reviews = await Review.create(reviewDocs);
  console.log(`   ✅ Created ${reviews.length} reviews`);

  return { orders, reviews };
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🌱 PP’s Aura — Database Seed');
  console.log('====================================\n');

  try {
    await mongoose.connect(MONGO_URI, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 10000,
    });
    console.log('✅ Connected to MongoDB\n');

    // ── Drop existing collections ────────────────────────────────────────────
    console.log('🗑️  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Category.deleteMany({}),
      Product.deleteMany({}),
      Order.deleteMany({}),
      Review.deleteMany({}),
      Coupon.deleteMany({}),
      Banner.deleteMany({}),
    ]);
    console.log('   ✅ Existing data cleared\n');

    // ── Seed ─────────────────────────────────────────────────────────────────
    const users = await seedUsers();
    console.log();
    const categories = await seedCategories();
    console.log();
    const products = await seedProducts(categories);
    console.log();
    await seedBanners();
    console.log();
    await seedCoupons();
    console.log();
    await seedOrdersAndReviews(users, products);

    // ── Summary ──────────────────────────────────────────────────────────────
    console.log('\n====================================');
    console.log('🎉 Seed complete!\n');
    console.log('📊 Summary:');
    console.log(`   👤 Users:      ${await User.countDocuments()}`);
    console.log(`   📁 Categories: ${await Category.countDocuments()}`);
    console.log(`   🛍️  Products:   ${await Product.countDocuments()}`);
    console.log(`   🖼️  Banners:    ${await Banner.countDocuments()}`);
    console.log(`   🎟️  Coupons:    ${await Coupon.countDocuments()}`);
    console.log(`   📦 Orders:     ${await Order.countDocuments()}`);
    console.log(`   ⭐ Reviews:    ${await Review.countDocuments()}`);
    console.log('\n🔑 Login credentials:');
    console.log('   Admin:    admin@rupkathasarees.com  / Admin@123');
    console.log('   Customer: riya@example.com         / Customer@123');
    console.log('   Customer: ananya@example.com       / Customer@123');
    console.log('   Customer: priya@example.com        / Customer@123');
    console.log('====================================\n');

  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

main();
