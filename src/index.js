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
import { error } from 'console';

// تحديد __filename و __dirname في بداية الملف
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// تهيئة i18next مع Backend
i18next
  .use(Backend)
  .use(middleware.LanguageDetector) // اكتشاف اللغة
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar'],
    backend: {
      loadPath: path.join(__dirname, './locales/{{lng}}/translation.json'), // تحديد مسار ملفات الترجمة
    },
    detection: {
      order: ['header', 'querystring', 'cookie'], // اكتشاف اللغة من الـ headers أو الـ cookies
      caches: ['cookie'],  // تخزين اللغة في الكوكيز
    },
  });

// تفعيل i18next مع Express
app.use(middleware.handle(i18next));

dotenv.config();

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: "https://aliabdulghani.github.io/Chat-App",
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);

// إذا كان في وضع الإنتاج، يمكنك فك التعليق عن الكود التالي لتقديم الـ frontend
// if (process.env.NODE_ENV === 'production') {
//   app.use(express.static(path.join(__dirname, '../frontend/dist')));
//   app.get('*', (req, res) => {
//     res.sendFile(path.join(__dirname, '../frontend', 'dist', 'index.html'));
//   });
// }

const port = process.env.PORT || 5000;

server.listen(port, async () => {
  console.log(`Server running on port: ${port}...`);
  try {
    await connectDB();
    console.log('Database connected successfully');
  } catch (dbError) {
    console.error('Error connecting to database:', error);
    process.exit(1);
  }
});
