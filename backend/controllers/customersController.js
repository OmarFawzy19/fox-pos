// controllers/customersController.js
const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

// GET /api/customers
exports.list = (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM customers ORDER BY name ASC').all();
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/customers/:id
exports.getById = (req, res) => {
  try {
    const row = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Customer not found' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/customers
exports.add = (req, res) => {
  try {
    const { name, phone = '', address = '' } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });

    const id = uuidv4();
    db.prepare(
      'INSERT INTO customers (id, name, phone, address, balance) VALUES (?, ?, ?, ?, 0)'
    ).run(id, name.trim(), phone, address);

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    res.status(201).json(customer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/customers/:id
exports.update = (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Customer not found' });

    const name    = req.body.name    ?? existing.name;
    const phone   = req.body.phone   ?? existing.phone;
    const address = req.body.address ?? existing.address;
    const balance = req.body.balance ?? existing.balance;

    db.prepare(
      'UPDATE customers SET name = ?, phone = ?, address = ?, balance = ? WHERE id = ?'
    ).run(name, phone, address, balance, id);

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/customers/:id
exports.remove = (req, res) => {
  try {
    const info = db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Customer not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
