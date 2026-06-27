const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

// 加载 server/.env 文件（优先）和根目录 .env 文件
dotenv.config({ path: path.join(__dirname, '..', '.env') });
dotenv.config();

const app = express();

app.use(helmet({
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  contentSecurityPolicy: false
}));
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Visitor-ID']
}));
app.use(morgan('dev'));
app.use(express.json());

// Simple rate limiting middleware (100 requests per minute per IP)
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 100; // max requests per window

app.use('/api/', (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || 'unknown';
  const now = Date.now();
  
  if (!rateLimitMap.has(ip)) {
    rateLimitMap.set(ip, []);
  }
  
  const requests = rateLimitMap.get(ip).filter(time => time > now - RATE_LIMIT_WINDOW);
  
  if (requests.length >= RATE_LIMIT_MAX) {
    return res.status(429).json({
      success: false,
      error: '请求过于频繁，请稍后重试'
    });
  }
  
  requests.push(now);
  rateLimitMap.set(ip, requests);
  
  // Clean up old entries periodically
  if (rateLimitMap.size > 1000) {
    for (const [key, times] of rateLimitMap.entries()) {
      if (times.every(t => t < now - RATE_LIMIT_WINDOW)) {
        rateLimitMap.delete(key);
      }
    }
  }
  
  next();
});

const ordersRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');
const healthRoutes = require('./routes/health');
const analyticsRoutes = require('./routes/analytics');

app.use('/api/orders', ordersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/analytics', analyticsRoutes);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: '服务器内部错误' });
});

module.exports = app;