import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import movieRoutes from './routes/movieRoutes';
import externalRoutes from './routes/externalRoutes';
import personRoutes from './routes/personRoutes';
import genreRoutes from './routes/genreRoutes';
import csvRoutes from './routes/csvRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'UMDB API is running' });
});

app.use('/api/movies', movieRoutes);
app.use('/api/external', externalRoutes);
app.use('/api/people', personRoutes);
app.use('/api/genres', genreRoutes);
app.use('/api/csv', csvRoutes);

// Error handling
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🎬 UMDB Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
