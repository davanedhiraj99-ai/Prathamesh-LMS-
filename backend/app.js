import 'dotenv/config';
import express from 'express';
import cors from './middleware/cors.js';

// Import Routes
import healthRouter from './routes/health.js';
import testimonialsRouter from './routes/testimonials.js';
import loginRouter from './routes/auth/login.js';
import logoutRouter from './routes/auth/logout.js';
import batchesRouter from './routes/admin/batches.js';
import batchContentRouter from './routes/admin/batch-content.js';
import bunnyUploadRouter from './routes/admin/bunny-upload.js';
import enrollStudentRouter from './routes/admin/enroll-student.js';
import resetIpRouter from './routes/admin/reset-ip.js';
import statsRouter from './routes/admin/stats.js';
import studentsRouter from './routes/admin/students.js';
import studentBatchesRouter from './routes/admin/student-batches.js';
import bunnyUploadFileRouter from './routes/admin/bunny-upload-file.js';
import uploadContentRouter from './routes/admin/upload-content.js';
import uploadNoteRouter from './routes/admin/upload-note.js';
import studentBatchContentRouter from './routes/student/batch-content.js';
import myBatchesRouter from './routes/student/my-batches.js';
import profileRouter from './routes/student/profile.js';
import signVideoRouter from './routes/student/sign-video.js';
import publicBatchesRouter from './routes/public/batches.js';

const app = express();

app.set('trust proxy', 1);
app.use(express.json());
app.use(cors);

// All routes under /api prefix
app.use('/api/health', healthRouter);
app.use('/api/testimonials', testimonialsRouter);
app.use('/api/login', loginRouter);
app.use('/api/logout', logoutRouter);

// Admin Routes
app.use('/api/admin/batches', batchesRouter);
app.use('/api/admin/batch-content', batchContentRouter);
app.use('/api/admin/bunny-upload', bunnyUploadRouter);
app.use('/api/admin/bunny-upload-file', bunnyUploadFileRouter);
app.use('/api/admin/enroll-student', enrollStudentRouter);
app.use('/api/admin/student-batches', studentBatchesRouter);
app.use('/api/admin/reset-ip', resetIpRouter);
app.use('/api/admin/stats', statsRouter);
app.use('/api/admin/students', studentsRouter);
app.use('/api/admin/upload-content', uploadContentRouter);
app.use('/api/admin/upload-note', uploadNoteRouter);

// Student Routes
app.use('/api/student/batch-content', studentBatchContentRouter);
app.use('/api/student/my-batches', myBatchesRouter);
app.use('/api/student/profile', profileRouter);
app.use('/api/student/sign-video', signVideoRouter);

// Public Routes
app.use('/api/public/batches', publicBatchesRouter);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

export default app;

