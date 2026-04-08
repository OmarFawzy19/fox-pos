// controllers/inventoryController.js
const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

// Map DB row → camelCase for frontend
function toItem(row) {
  return {
    id: row.id,
    name: row.name,
    quantity: row.quantity,
    purchasePrice: row.purchase_price,
    salePrice: row.sale_price,
  };
}

// GET /api/inventory
exports.list = (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM inventory ORDER BY name ASC').all();
    res.json(rows.map(toItem));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/inventory
// If item with same name exists → merge (add quantity, update prices)
exports.add = (req, res) => {
  try {
    const { name, quantity = 0, purchasePrice = 0, salePrice = 0 } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });

    const existing = db.prepare('SELECT * FROM inventory WHERE name = ?').get(name.trim());

    if (existing) {
      db.prepare(
        'UPDATE inventory SET quantity = quantity + ?, purchase_price = ?, sale_price = ? WHERE id = ?'
      ).run(quantity, purchasePrice, salePrice, existing.id);
      const updated = db.prepare('SELECT * FROM inventory WHERE id = ?').get(existing.id);
      return res.json(toItem(updated));
    }

    const id = uuidv4();
    db.prepare(
      'INSERT INTO inventory (id, name, quantity, purchase_price, sale_price) VALUES (?, ?, ?, ?, ?)'
    ).run(id, name.trim(), quantity, purchasePrice, salePrice);

    const item = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
    res.status(201).json(toItem(item));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/inventory/:id
exports.update = (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Item not found' });

    const name          = req.body.name          ?? existing.name;
    const quantity      = req.body.quantity      ?? existing.quantity;
    const purchasePrice = req.body.purchasePrice ?? existing.purchase_price;
    const salePrice     = req.body.salePrice     ?? existing.sale_price;

    db.prepare(
      'UPDATE inventory SET name = ?, quantity = ?, purchase_price = ?, sale_price = ? WHERE id = ?'
    ).run(name, quantity, purchasePrice, salePrice, id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/inventory/deduct
// Body: { items: [{ productId, quantity }] }
exports.deductStock = (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items array is required' });
    }

    const deduct = db.prepare(
      'UPDATE inventory SET quantity = MAX(0, quantity - ?) WHERE id = ?'
    );
    const deductTx = db.transaction(() => {
      for (const item of items) {
        deduct.run(item.quantity, item.productId);
      }
    });
    deductTx();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/inventory/:id
exports.remove = (req, res) => {
  try {
    const info = db.prepare('DELETE FROM inventory WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Item not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
