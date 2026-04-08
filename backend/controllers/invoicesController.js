// controllers/invoicesController.js
const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

// Helper: attach items[] to an invoice row
function withItems(invoice) {
  const items = db
    .prepare('SELECT * FROM invoice_items WHERE invoice_id = ?')
    .all(invoice.id)
    .map(r => ({
      productId:   r.product_id,
      productName: r.product_name,
      quantity:    r.quantity,
      unitPrice:   r.unit_price,
      total:       r.total,
    }));
  return {
    id:         invoice.id,
    number:     invoice.number,
    type:       invoice.type,
    date:       invoice.date,
    entityId:   invoice.entity_id,
    entityName: invoice.entity_name,
    total:      invoice.total,
    paid:       invoice.paid,
    remaining:  invoice.remaining,
    status:     invoice.status,
    items,
  };
}

// GET /api/invoices
exports.list = (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM invoices ORDER BY date DESC').all();
    res.json(rows.map(withItems));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/invoices/next-number/:type
exports.getNextNumber = (req, res) => {
  try {
    const { type } = req.params;
    if (!['purchase', 'sale'].includes(type)) {
      return res.status(400).json({ error: 'type must be purchase or sale' });
    }
    const row = db
      .prepare('SELECT COUNT(*) AS count FROM invoices WHERE type = ?')
      .get(type);
    res.json({ number: (row.count || 0) + 1 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/invoices
exports.add = (req, res) => {
  try {
    const {
      number, type, date, entityId, entityName,
      items = [], total, paid, remaining, status,
    } = req.body;

    if (!type || !entityId || !items.length) {
      return res.status(400).json({ error: 'type, entityId and items are required' });
    }

    const id = uuidv4();

    const insertInvoice = db.prepare(`
      INSERT INTO invoices (id, number, type, date, entity_id, entity_name, total, paid, remaining, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertItem = db.prepare(`
      INSERT INTO invoice_items (id, invoice_id, product_id, product_name, quantity, unit_price, total)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const addInvoiceTx = db.transaction(() => {
      insertInvoice.run(id, number, type, date, entityId, entityName, total, paid, remaining, status);
      for (const item of items) {
        insertItem.run(
          uuidv4(), id,
          item.productId, item.productName,
          item.quantity, item.unitPrice, item.total
        );
      }
    });
    addInvoiceTx();

    const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(id);
    res.status(201).json(withItems(invoice));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/invoices/:id
exports.remove = (req, res) => {
  try {
    const info = db.prepare('DELETE FROM invoices WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Invoice not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
