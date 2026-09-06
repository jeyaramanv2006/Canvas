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

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize SQLite schema and seeds
initDB();

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

// ── Strict Role-Based User Management & Approval Workflow ────────────────────
app.get('/api/users', authenticateToken, userManagementController.getUsers);
app.post('/api/users', authenticateToken, requireAdmin, userManagementController.createUser);
app.put('/api/users/:id/role', authenticateToken, requireAdmin, userManagementController.updateUserRole);
app.delete('/api/users/:id', authenticateToken, requireAdmin, userManagementController.deleteUser);

// CEO Pending Approval Queue
app.get('/api/approvals', authenticateToken, requireCEO, userManagementController.getPendingApprovals);
app.post('/api/approvals/:id/decide', authenticateToken, requireCEO, userManagementController.decideApproval);

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

// ── Error Handling Middleware ────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error', details: err.message });
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Murugan Canvass Backend Server running on http://localhost:${PORT}`);
  });
}

export default app;
