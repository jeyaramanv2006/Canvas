import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initDB } from './database/db.js';
import { authenticateToken, requireAdmin, requireCEO } from './middleware/auth.js';
import * as authController from './controllers/authController.js';
import * as visitsController from './controllers/visitsController.js';
import * as auditController from './controllers/auditController.js';
import * as dashboardController from './controllers/dashboardController.js';
import * as financialsController from './controllers/financialsController.js';
import * as userManagementController from './controllers/userManagementController.js';
import * as masterSchoolsController from './controllers/masterSchoolsController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize database schema and seeds (SQLite or PostgreSQL / Supabase)
await initDB();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Murugan Canvass API Backend', timestamp: new Date().toISOString() });
});

// ── Authentication Endpoints ─────────────────────────────────────────────────
app.post('/api/login', authController.login);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/me', authenticateToken, authController.getCurrentUser);
app.post('/api/auth/reset-password', authenticateToken, authController.resetUserPassword);

// ── Strict Role-Based User Management & Approval Workflow ────────────────────
app.get('/api/users', authenticateToken, userManagementController.getUsers);
app.post('/api/users', authenticateToken, requireAdmin, userManagementController.createUser);
app.put('/api/users/:id/role', authenticateToken, requireAdmin, userManagementController.updateUserRole);
app.delete('/api/users/:id', authenticateToken, requireAdmin, userManagementController.deleteUser);
app.post('/api/users/:id/pause', authenticateToken, requireAdmin, userManagementController.pauseUser);
app.post('/api/users/:id/resume', authenticateToken, requireAdmin, userManagementController.resumeUser);
app.post('/api/users/:id/reset-password', authenticateToken, requireAdmin, userManagementController.triggerPasswordReset);

// CEO Pending Approval Queue
app.get('/api/approvals', authenticateToken, requireCEO, userManagementController.getPendingApprovals);
app.post('/api/approvals/:id/decide', authenticateToken, requireCEO, userManagementController.decideApproval);
app.post('/api/approvals/:id/decision', authenticateToken, requireCEO, userManagementController.decideApproval);

// ── Visits Endpoints (Canvasser & Admin with Audit Trail) ─────────────────────
app.get('/api/visits', authenticateToken, visitsController.getVisits);
app.get('/api/visits/:id', authenticateToken, visitsController.getVisitById);
app.post('/api/visits', authenticateToken, visitsController.createVisit);
app.put('/api/visits/:id', authenticateToken, visitsController.updateVisit);
app.patch('/api/visits/:id', authenticateToken, visitsController.updateVisit);
app.delete('/api/visits/:id', authenticateToken, visitsController.deleteVisit);

// Aliases for Admin specific visit routes
app.get('/api/admin/visits', authenticateToken, requireAdmin, visitsController.getVisits);
app.put('/api/admin/visits/:id', authenticateToken, requireAdmin, visitsController.updateVisit);
app.delete('/api/admin/visits/:id', authenticateToken, requireAdmin, visitsController.deleteVisit);

// ── Audit Logs Endpoints (Admin Access) ───────────────────────────────────────
app.get('/api/audit-logs', authenticateToken, auditController.getAuditLogs);

// ── Analytics & Leaderboard Endpoints ─────────────────────────────────────────
app.get('/api/admin/dashboard', authenticateToken, dashboardController.getDashboardStats);
app.get('/api/dashboard/stats', authenticateToken, dashboardController.getDashboardStats);
app.get('/api/admin/team', authenticateToken, dashboardController.getCanvasserLeaderboard);
app.get('/api/leaderboard', authenticateToken, dashboardController.getCanvasserLeaderboard);
app.get('/api/ceo/executive-mis', authenticateToken, dashboardController.getCEOExecutiveMIS);

// ── Master Schools Institutional Catalog (SQLite) ───────────────────────────
app.get('/api/master-schools', authenticateToken, masterSchoolsController.getMasterSchools);
app.get('/api/master-schools/export', authenticateToken, masterSchoolsController.exportMasterSchoolsCSV);
app.get('/api/master-schools/districts', authenticateToken, masterSchoolsController.getSchoolDistricts);
app.get('/api/master-schools/:id', authenticateToken, masterSchoolsController.getMasterSchoolById);
app.post('/api/master-schools', authenticateToken, requireAdmin, masterSchoolsController.createMasterSchool);
app.put('/api/master-schools/:id', authenticateToken, requireAdmin, masterSchoolsController.updateMasterSchool);
app.delete('/api/master-schools/:id', authenticateToken, requireAdmin, masterSchoolsController.deleteMasterSchool);

// ── Financials: Products, Quotations, Invoices, Payments ─────────────────────
app.get('/api/products', authenticateToken, financialsController.getProducts);
app.post('/api/products', authenticateToken, requireAdmin, financialsController.createProduct);
app.put('/api/products/:id', authenticateToken, requireAdmin, financialsController.updateProduct);
app.delete('/api/products/:id', authenticateToken, requireAdmin, financialsController.deleteProduct);

app.get('/api/quotations', authenticateToken, financialsController.getQuotations);
app.post('/api/quotations', authenticateToken, financialsController.createQuotation);

app.get('/api/invoices', authenticateToken, financialsController.getInvoices);
app.post('/api/invoices', authenticateToken, financialsController.createInvoice);
app.post('/api/invoices/:id/payment', authenticateToken, financialsController.recordPayment);
app.get('/api/payments', authenticateToken, financialsController.getPayments);
app.get('/api/cfo/analytics', authenticateToken, financialsController.getCFOAnalytics);

// ── Error Handling Middleware ────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

const isMainModule = process.argv[1] && (process.argv[1].endsWith('server.js') || process.argv[1].includes('server.js'));

if (isMainModule && process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Murugan Canvass Backend Server running on http://localhost:${PORT}`);
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`⚠️ Port ${PORT} is already in use by another process.`);
      console.error(`Please stop any running server instances or free port ${PORT}.`);
    } else {
      console.error('Server error:', err);
    }
  });

  const shutdown = () => {
    server.close(() => {
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

export default app;
