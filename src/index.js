import express from 'express';
import dotenv from 'dotenv';
import { connectDB } from './lib/db.js';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import authRoutes from './routes/auth.route.js';
import messageRoutes from './routes/message.route.js';
import { app, server } from './lib/socket.js';
import path from 'path';
import i18next from 'i18next';
import Backend from 'i18next-fs-backend';
import middleware from 'i18next-http-middleware';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// تحديد __filename و __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// تهيئة i18next
i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar'],
    backend: {
      loadPath: path.join(__dirname, './locales/{{lng}}/translation.json'),
    },
    detection: {
      order: ['header', 'querystring', 'cookie'],
      caches: ['cookie'],
    },
  });

app.use(middleware.handle(i18next));

dotenv.config();

app.use(express.json());
app.use(cookieParser());


const corsOptions = {
  origin: (origin, callback) => {
    const allowedOrigins = [
      'http://localhost:8081',
      'http://localhost:19006',
      'exp://192.168.1.*:19000' // استبدل * برقم IP جهازك
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'], // أضف هنا
  methods: ['GET', 'POST', 'PUT', 'DELETE'] // أضف هذا
};

app.use(cors(corsOptions));;

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'dist', 'index.html'));
  });
}

const port = process.env.PORT || 5000;

server.listen(port, async () => {
  console.log(`Server running on port: ${port}...`);
  try {
    await connectDB();
    console.log('Database connected successfully');
  } catch (error) {
    console.error('Error connecting to database:', error);
    process.exit(1);
  }
});