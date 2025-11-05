import express from 'express';
import session from 'express-session';
import SQLiteStoreFactory from 'connect-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRouter from './routes/auth.js';
import dashboardRouter from './routes/dashboard.js';
import attendanceRouter from './routes/attendance.js';
import { migrate, ensureDefaultTeacher } from './db.js';
import reportsRouter from './routes/reports.js';
import importRouter from './routes/import.js';
import periodsRouter from './routes/periods.js';
import manageRouter from './routes/manage.js';
import apiRouter from './routes/api.js';
import insightsRouter from './routes/insights.js';
import dailyAttendanceRouter from './routes/daily-attendance.js';
import emailReportsRouter from './routes/email-reports.js';
import bulkImportRouter from './routes/bulk-import.js';
import analyticsRouter from './routes/analytics.js';
import profileRouter from './routes/profile.js';
import realtimeDashboardRouter from './routes/realtime-dashboard.js';
import testRealtimeRouter from './routes/test-realtime.js';
import notificationsRouter from './routes/notifications.js';
import teacherDashboardRouter from './routes/teacher-dashboard.js';
import teacherApiRouter from './routes/teacher-api.js';
import helpRouter from './routes/help.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const io = new Server(server);

const SQLiteStore = SQLiteStoreFactory(session);

app.set('trust proxy', 1);

// GitHub Codespace compatibility
if (process.env.CODESPACE_NAME) {
  console.log('Running in GitHub Codespace');
  console.log(`Access your app at: https://${process.env.CODESPACE_NAME}-3000.${process.env.GITHUB_CODESPACES_PORT_FORWARDING_DOMAIN}`);
}

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Request logging (only in development)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} ${ms}ms`);
    });
    next();
  });
}

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, '..', 'public', 'uploads')));

app.use(
  session({
    store: new SQLiteStore({ db: 'sessions.db', dir: path.join(__dirname, '..', 'data') }),
    secret: process.env.SESSION_SECRET || 'dev_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 1000 * 60 * 60 * 6 }
  })
);

app.use((req, res, next) => {
  res.locals.brand = 'Government College Of Engineering Aurangabad Chhatrapati Sambhajinagar';
  res.locals.currentUser = req.session.user || null;
  res.locals.flash = req.session.flash || null;
  delete req.session.flash;
  next();
});

app.use('/', authRouter);
app.use('/', dashboardRouter);
app.use('/', attendanceRouter);
app.use('/', reportsRouter);
app.use('/', importRouter);
app.use('/', periodsRouter);
app.use('/', manageRouter);
app.use('/', apiRouter);
app.use('/', insightsRouter);
app.use('/', dailyAttendanceRouter);
app.use('/', emailReportsRouter);
app.use('/', bulkImportRouter);
app.use('/', analyticsRouter);
app.use('/', profileRouter);
app.use('/', realtimeDashboardRouter);
app.use('/', testRealtimeRouter);
app.use('/', notificationsRouter);
app.use('/', teacherDashboardRouter);
app.use('/', teacherApiRouter);
app.use('/', helpRouter);

// Make io available to routes
app.set('io', io);

// Real-time attendance WebSocket handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  socket.on('join-class', (classId) => {
    socket.join(`class-${classId}`);
    console.log(`User ${socket.id} joined class ${classId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({ ok: true });
});

app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  return res.redirect('/home');
});

app.get('/home', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.render('home');
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).send('Internal Server Error');
});

// Initialize database once on startup
migrate()
  .then(async () => {
    await ensureDefaultTeacher('mjsfutane21@gmail.com', 'abc@1234');
    
    // Initialize audit table (optional)
    try {
      const { initializeAuditTable } = await import('./middleware/audit.js');
      await initializeAuditTable();
    } catch (e) {
      console.log('Audit table initialization skipped (optional feature)');
    }
    
    // Initialize notification tables (optional)
    try {
      const { createNotificationTables } = await import('./db-notifications.js');
      await createNotificationTables();
      
      const notificationScheduler = await import('./services/notification-scheduler.js');
      await notificationScheduler.default.initialize();
      console.log('Notification system initialized successfully');
    } catch (e) {
      console.log('Notification system initialization skipped (optional feature)');
    }
    
    console.log('Database initialized successfully');
  })
  .catch((e) => {
    console.error('Failed to initialize database:', e);
    process.exit(1);
  });

const port = process.env.PORT || process.env.CODESPACE_NAME ? 8080 : 3000;

// Only start server if not in Vercel
if (process.env.VERCEL !== '1') {
  server.listen(port, () => {
    console.log(`Attendance portal listening on port ${port}`);
  });
}

// Export both app and server for different environments
export default app;
export { server };
