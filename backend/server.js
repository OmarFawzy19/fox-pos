// server.js — Fox POS Backend Entry Point
const express = require('express');
const cors    = require('cors');
const setupDatabase = require('./db/setup');
const path = require('path');
const fs = require('fs');
const db = require('./db/database');

// ── Initialize DB ────────────────────────────────────────────────────────────
setupDatabase();

// ── Express App ──────────────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/customers',  require('./routes/customers'));
app.use('/api/suppliers',  require('./routes/suppliers'));
app.use('/api/inventory',  require('./routes/inventory'));
app.use('/api/invoices',   require('./routes/invoices'));
app.use('/api/payments',   require('./routes/payments'));
app.use('/api/wallet',     require('./routes/wallet'));
app.use('/api/settings',   require('./routes/settings'));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
});

// ── Global error handler ─────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🦊 Fox POS Backend running on http://localhost:${PORT}`);
  console.log(`   API base: http://localhost:${PORT}/api`);
  
  // ── Auto Backup (Run every 24 hours) ────────────────────────
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  setInterval(async () => {
    try {
      const backupDir = path.join(__dirname, '../backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      const date = new Date();
      const formattedDate = date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const backupPath = path.join(backupDir, `fox_pos_auto_${formattedDate}.db`);
      
      console.log(`[Auto-Backup] Starting daily backup to ${backupPath}`);
      await db.backup(backupPath);
      console.log(`[Auto-Backup] Completed successfully.`);
    } catch (err) {
      console.error(`[Auto-Backup] Failed:`, err);
    }
  }, ONE_DAY_MS);
});
