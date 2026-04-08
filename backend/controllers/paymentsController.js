// controllers/paymentsController.js
const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

function toPayment(row) {
  return {
    id:         row.id,
    date:       row.date,
    entityType: row.entity_type,
    entityId:   row.entity_id,
    entityName: row.entity_name,
    amount:     row.amount,
    invoiceId:  row.invoice_id || undefined,
    note:       row.note || undefined,
  };
}

// GET /api/payments
exports.list = (req, res) => {
  try {
    const { sort, clientId, supplierId } = req.query;
    let query = 'SELECT * FROM payments WHERE 1=1';
    const params = [];

    if (clientId) {
      query += ' AND entity_id = ? AND entity_type = "customer"';
      params.push(clientId);
    } else if (supplierId) {
      query += ' AND entity_id = ? AND entity_type = "supplier"';
      params.push(supplierId);
    }

    if (sort === 'asc') {
      query += ' ORDER BY date ASC';
    } else {
      query += ' ORDER BY date DESC';
    }

    const rows = db.prepare(query).all(...params);
    res.json(rows.map(toPayment));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/payments
exports.add = (req, res) => {
  try {
    const { date, entityType, entityId, entityName, amount, invoiceId, note } = req.body;
    if (!entityType || !entityId || !amount) {
      return res.status(400).json({ error: 'entityType, entityId and amount are required' });
    }

    const id = uuidv4();
    db.prepare(`
      INSERT INTO payments (id, date, entity_type, entity_id, entity_name, amount, invoice_id, note)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, date, entityType, entityId, entityName, amount, invoiceId || null, note || null);

    const payment = db.prepare('SELECT * FROM payments WHERE id = ?').get(id);
    res.status(201).json(toPayment(payment));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
