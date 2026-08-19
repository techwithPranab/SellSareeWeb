# 🥻 PP's Aura — Enterprise E-Commerce Platform

A production-ready, full-stack saree e-commerce platform built with **Next.js 15**, **Node.js**, **TypeScript**, **MongoDB Atlas**, and **Razorpay**.

![PP's Aura](https://img.shields.io/badge/PP%27s-Aura-orange?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js)
![Node.js](https://img.shields.io/badge/Node.js-20-green?style=for-the-badge&logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?style=for-the-badge&logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=for-the-badge&logo=mongodb)

---

## 🚀 Features

### 🛍️ Public Website
- Hero Slider with CTA
- New Arrivals, Best Sellers, Bridal, Silk, Cotton, Tant, Banarasi, Kanjivaram Collections
- Festival Collections & Instagram Feed
- Newsletter Subscription
- Advanced Product Listing (Grid/List, Search, Filters, Sort, Infinite Scroll)
- Product Details with Zoom Gallery, Video, Reviews & Related Products
- Cart with Coupon, Save for Later, Estimated Delivery
- Checkout with Address, Shipping, Payment & Order Review

### 👤 Customer Features
- Registration / Login / Google OAuth
- Wishlist Management
- Order History & Tracking
- Returns & Refund Requests
- Reviews & Ratings
- Notification Center
- Profile Management

### 🔐 Admin Features
- Revenue, Orders, Customers, Inventory Dashboard
- Sales Analytics with Charts
- Product, Category, Order, Customer Management
- Banner & Coupon Management
- CMS, Review Moderation
- Reports & Exports

### ⭐ Premium Features
- AI Product Recommendations
- Recently Viewed Products
- Compare Sarees
- WhatsApp Integration
- Loyalty Points & Referral Program
- Abandoned Cart Recovery
- Multi-Language & Multi-Currency Support
- SEO Optimized Pages, Sitemap, Schema Markup

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, Redux Toolkit |
| Styling | Tailwind CSS, Framer Motion |
| Forms | React Hook Form + Zod |
| HTTP | Axios |
| Backend | Node.js, Express.js, TypeScript |
| Database | MongoDB Atlas + Mongoose |
| Auth | JWT + Refresh Tokens + bcrypt |
| Payments | Razorpay |
| Storage | Cloudinary |
| Email | Nodemailer (Gmail/SES) |
| Deployment | Vercel (Frontend) + Render/AWS (Backend) |

---

## 📁 Project Structure

```
SellSareeWeb/
├── frontend/          # Next.js 15 App Router
├── backend/           # Express.js REST API
├── docker-compose.yml # Local development
└── README.md
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js 20+
- MongoDB Atlas account
- Cloudinary account
- Razorpay account

### 1. Clone & Install

```bash
# Install backend dependencies
cd backend && npm install

# Install frontend dependencies
cd ../frontend && npm install
```

### 2. Configure Environment Variables

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# Frontend
cp frontend/.env.local.example frontend/.env.local
# Edit frontend/.env.local with your credentials
```

### 3. Run Development Servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

### 4. Using Docker Compose

```bash
docker-compose up -d
```

---

## 🌐 API Documentation

Base URL: `http://localhost:5000/api/v1`

### Auth Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register user |
| POST | `/auth/login` | Login user |
| POST | `/auth/logout` | Logout user |
| POST | `/auth/refresh-token` | Refresh JWT |
| POST | `/auth/forgot-password` | Forgot password |
| PUT | `/auth/reset-password/:token` | Reset password |
| GET | `/auth/me` | Get current user |

### Product Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/products` | Get all products (paginated, filtered) |
| GET | `/products/:slug` | Get product by slug |
| POST | `/products` | Create product (Admin) |
| PUT | `/products/:id` | Update product (Admin) |
| DELETE | `/products/:id` | Delete product (Admin) |
| GET | `/products/search` | Search products |
| GET | `/products/featured` | Featured products |

### Order Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/orders` | Create order |
| GET | `/orders` | Get user orders |
| GET | `/orders/:id` | Get order details |
| PUT | `/orders/:id/cancel` | Cancel order |
| POST | `/orders/payment/verify` | Verify Razorpay payment |

---

## 🔒 Security

- JWT Access + Refresh Token rotation
- bcrypt password hashing (salt rounds: 12)
- Role-Based Access Control (RBAC)
- Rate limiting (100 req/15min)
- Helmet.js security headers
- CORS protection
- XSS & NoSQL injection prevention
- HTTP Parameter Pollution (HPP) protection
- Secure httpOnly cookies
- Input validation with express-validator + Zod

---

## 🚀 Deployment

### Frontend → Vercel
```bash
cd frontend && vercel --prod
```

### Backend → Render / AWS EC2
```bash
cd backend && npm run build
# Deploy dist/ folder to your server
```

---

## 📧 Contact

**PP's Aura** — Where every thread tells a story.

Built with ❤️ using modern web technologies.
