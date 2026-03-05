import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import passport from 'passport';

import { corsOptions } from './config/cors.js';
import { globalLimiter, authLimiter } from './middlewares/rateLimiter.js';
import { notFound, errorHandler } from './middlewares/error.middleware.js';
import authRoutes from './routes/auth.routes.js';
import './config/passport.js';

const app = express();

// Security
app.use(helmet());
app.use(cors(corsOptions));
app.use(globalLimiter);

// Parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Passport
app.use(passport.initialize());

// Routes
app.use('/api/auth', authLimiter, authRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'API running', status: 'ok' });
});

// Error handling — must be last
app.use(notFound);
app.use(errorHandler);

export default app;