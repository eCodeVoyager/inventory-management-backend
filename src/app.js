// src/app.js
require('dotenv').config();
const hpp = require('hpp');
const cors = require('cors');
const path = require('path');
const morgan = require('morgan');
const helmet = require('helmet');
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const passport = require('./config/passport');

const routeIndex = require('./index');
const { errorHandler, notFoundHandler } = require('./utils/errorHandler');
const { swaggerSetup } = require('./config/swagger');

const app = express();

// Trust proxy configuration
app.set('trust proxy', 1);

// Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 1000 : 20000,
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests from this IP, please try again after 15 minutes',
});

// CORS Middleware Setup
const allowedOrigins = process.env.FRONTEND_URL_CORS?.split(',').map(origin => origin.trim());

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      // Allow any Chrome extension origin
      if (origin.startsWith('chrome-extension://')) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        return callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

// Middlewares
const allMiddlewares = [
  morgan(process.env.LOGGER_LEVEL === 'development' ? 'dev' : 'combined'),
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', '*.cloudinary.com'],
        connectSrc: ["'self'"],
      },
    },
    xssFilter: true,
    noSniff: true,
    referrerPolicy: { policy: 'same-origin' },
  }),
  limiter,
  hpp({
    whitelist: [],
  }),
  session({
    secret: process.env.SESSION_SECRET || 'your-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    },
  }),
  passport.initialize(),
  passport.session(),
  cookieParser({
    secret: process.env.COOKIE_SECRET || process.env.ACCESS_TOKEN_SECRET,
  }),
  express.json({ limit: '1mb' }),
  express.urlencoded({ extended: true, limit: '1mb' }),
];

// Use middlewares for all other routes
app.use(allMiddlewares);

// Disable X-Powered-By header
app.disable('x-powered-by');

app.use(express.static(path.join(__dirname, '../public')));

// Base route
app.get('/', (_, res) => {
  res.json({
    message: 'Welcome to the Inventory Management API',
    status: 'Success',
    server_status: 'Working',
    server_time: new Date().toLocaleString(),
  });
});

// API Routes
app.use('/api/v1/user', routeIndex.user.userRoutes);


// Setup Swagger Documentation
swaggerSetup(app);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
