// controllers/settingsController.js
const db = require('../db/database');
const path = require('path');
const fs = require('fs');

/** Helper to convert rows to UTF-8 CSV with BOM for Excel */
function generateCSV(headers, rows) {
  // UTF-8 BOM helps Excel recognize the file correctly
  const BOM = '\uFEFF';
  const csvHeaders = headers.join(',') + '\n';
  const csvRows = rows.map(row => {
    return headers.map(header => {
      let val = row[header] === null || row[header] === undefined ? '' : row[header];
      val = String(val).replace(/"/g, '""');
      if (val.search(/("|,|\n)/g) >= 0) {
        val = `"${val}"`;
      }
      return val;
    }).join(',');
  }).join('\n');
  
  return BOM + csvHeaders + csvRows;
}

// POST /api/settings/backup
exports.backupDatabase = async (req, res) => {
  try {
    const backupDir = path.join(__dirname, '../../backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    const date = new Date();
    const formattedDate = date.toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupFileName = `fox_pos_${formattedDate}.db`;
    const backupPath = path.join(backupDir, backupFileName);

    // .backup is safe and locks correctly while reading
    await db.backup(backupPath);

    res.json({ success: true, message: 'Backup created successfully', filename: backupFileName });
  } catch (err) {
    console.error('Backup failed:', err);
    res.status(500).json({ error: 'Failed to create backup: ' + err.message });
  }
};

// GET /api/settings/export/customers
exports.exportCustomersCSV = (req, res) => {
  try {
    const rows = db.prepare('SELECT id, name, phone, address, balance FROM customers').all();
    if (rows.length === 0) {
      return res.status(404).send('No customers found');
    }
    const headers = Object.keys(rows[0]);
    const csvContent = generateCSV(headers, rows);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="customers.csv"');
    res.send(csvContent);
  } catch (err) {
    console.error('Customer export failed:', err);
    res.status(500).send('Export failed');
  }
};

// GET /api/settings/export/suppliers
exports.exportSuppliersCSV = (req, res) => {
  try {
    const rows = db.prepare('SELECT id, name, phone, address, balance FROM suppliers').all();
    if (rows.length === 0) {
      return res.status(404).send('No suppliers found');
    }
    const headers = Object.keys(rows[0]);
    const csvContent = generateCSV(headers, rows);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="suppliers.csv"');
    res.send(csvContent);
  } catch (err) {
    console.error('Supplier export failed:', err);
    res.status(500).send('Export failed');
  }
};

// POST /api/settings/reset-system
exports.resetSystem = (req, res) => {
  try {
    console.log('RESET ENDPOINT CALLED');
    const { password } = req.body;
    if (password !== '123456') {
      return res.status(401).json({ error: 'كلمة المرور غير صحيحة' });
    }

    const clearDB = db.transaction(() => {
      // Order matters to avoid foreign key constraints failing if any existed, though standard wipe
      db.prepare('DELETE FROM invoice_items').run();
      db.prepare('DELETE FROM invoices').run();
      db.prepare('DELETE FROM supplier_products').run();
      db.prepare('DELETE FROM expenses').run();
      db.prepare('DELETE FROM payments').run();
      db.prepare('DELETE FROM inventory').run(); // "products"
      db.prepare('DELETE FROM suppliers').run();
      db.prepare('DELETE FROM customers').run();
      
      // Reset wallet to initial state
      db.prepare('DELETE FROM wallet').run();
      db.prepare('INSERT INTO wallet (id, balance) VALUES (1, 0)').run();
    });

    clearDB();
    res.json({ success: true, message: 'تم إعادة ضبط النظام بنجاح' });
  } catch (err) {
    console.error('System reset failed:', err);
    res.status(500).json({ error: 'فشل في إعادة ضبط النظام: ' + err.message });
  }
};

