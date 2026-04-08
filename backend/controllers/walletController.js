// controllers/walletController.js
const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

// GET /api/wallet
exports.get = (req, res) => {
  try {
    const row = db.prepare('SELECT balance FROM wallet WHERE id = 1').get();
    res.json({ balance: row ? row.balance : 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/wallet/add
exports.add = (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'amount must be positive' });
    db.prepare('UPDATE wallet SET balance = balance + ? WHERE id = 1').run(amount);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PATCH /api/wallet/deduct
exports.deduct = (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) return res.status(400).json({ error: 'amount must be positive' });
    db.prepare('UPDATE wallet SET balance = MAX(0, balance - ?) WHERE id = 1').run(amount);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/wallet/expenses
exports.listExpenses = (req, res) => {
  try {
    const rows = db.prepare('SELECT * FROM expenses ORDER BY date DESC').all();
    res.json(
      rows.map(r => ({
        id:       r.id,
        date:     r.date,
        category: r.category,
        amount:   r.amount,
        note:     r.note || undefined,
      }))
    );
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/wallet/expenses
exports.addExpense = (req, res) => {
  try {
    const { date, category, amount, note } = req.body;
    if (!category || !amount || amount <= 0) {
      return res.status(400).json({ error: 'category and amount are required' });
    }

    const id = uuidv4();
    db.prepare(
      'INSERT INTO expenses (id, date, category, amount, note) VALUES (?, ?, ?, ?, ?)'
    ).run(id, date, category, amount, note || null);

    const expense = db.prepare('SELECT * FROM expenses WHERE id = ?').get(id);
    res.status(201).json({
      id:       expense.id,
      date:     expense.date,
      category: expense.category,
      amount:   expense.amount,
      note:     expense.note || undefined,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
