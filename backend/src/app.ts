import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { requestLogger } from './middlewares/logger.middleware';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { API_PREFIX } from './constants';
import { configureCloudinary } from './config/cloudinary';

// Routes
import authRoutes from './routes/auth.routes';
import productRoutes from './routes/product.routes';
import orderRoutes from './routes/order.routes';
import categoryRoutes from './routes/category.routes';
import userRoutes from './routes/user.routes';
import bannerRoutes from './routes/banner.routes';
import launchRoutes from './routes/launch.routes';
import settingRoutes from './routes/setting.routes';
import expenseRoutes from './routes/expense.routes';

// Load environment variables
dotenv.config();

// Configure external services
configureCloudinary();

const app: Application = express();

// ============================================================
// SECURITY MIDDLEWARE
// ============================================================

// Helmet — security HTTP headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https://res.cloudinary.com'],
      },
    },
  })
);

// CORS
const toOrigin = (url: string): string => {
  try {
    return new URL(url).origin;
  } catch {
    return url.replace(/\/$/, '');
  }
};

const allowedOrigins = new Set(
  [
    process.env.CLIENT_URL || 'http://localhost:3000',
    process.env.ADMIN_URL || 'http://localhost:3000',
  ].map(toOrigin)
);

const isAllowedOrigin = (origin?: string): boolean => {
  if (!origin || allowedOrigins.has(origin)) return true;

  if (process.env.NODE_ENV !== 'production') {
    try {
      const { protocol, hostname } = new URL(origin);
      return (
        (protocol === 'http:' || protocol === 'https:') &&
        (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1')
      );
    } catch {
      return false;
    }
  }

  return false;
};

app.use(
  cors({
    origin: (origin, callback) => {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Not allowed by CORS: ${origin}`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-razorpay-signature'],
  })
);

// Rate Limiting
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 min
  max: Number(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.',
  },
});
app.use(`${API_PREFIX}/`, limiter);

// Auth rate limiting (stricter)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { success: false, message: 'Too many authentication attempts, please try again later.' },
});
app.use(`${API_PREFIX}/auth/`, authLimiter);

// ============================================================
// BODY PARSING
// ============================================================

// Razorpay webhook needs raw body
app.use(
  `${API_PREFIX}/orders/webhook/razorpay`,
  express.raw({ type: 'application/json' })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(compression());

// ============================================================
// DATA SANITIZATION
// ============================================================

// MongoDB Sanitize — prevent NoSQL injection
app.use(mongoSanitize({ replaceWith: '_' }));

// ============================================================
// LOGGING
// ============================================================

app.use(requestLogger);

// ============================================================
// HEALTH CHECK
// ============================================================

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: '🥻 PP’s Aura API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

app.get(`${API_PREFIX}/health`, (_req, res) => {
  res.status(200).json({
    success: true,
    message: '✅ API v1 is healthy',
    version: '1.0.0',
  });
});

// ============================================================
// API ROUTES
// ============================================================

app.use(`${API_PREFIX}/auth`, authRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/categories`, categoryRoutes);
app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/banners`, bannerRoutes);
app.use(`${API_PREFIX}/launch`, launchRoutes);
app.use(`${API_PREFIX}/settings`, settingRoutes);
app.use(`${API_PREFIX}/expenses`, expenseRoutes);

// ============================================================
// ERROR HANDLING
// ============================================================

// 404 Handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

export default app;
