// controllers/suppliersController.js
const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

// Helper: attach products array to each supplier
function withProducts(supplier) {
  const products = db
    .prepare('SELECT * FROM supplier_products WHERE supplier_id = ? ORDER BY name ASC')
    .all(supplier.id)
    .map(p => ({
      id: p.id,
      name: p.name,
      purchasePrice: p.purchase_price,
    }));
  return { ...supplier, products };
}

// GET /api/suppliers
exports.list = (req, res) => {
  try {
    const suppliers = db.prepare('SELECT * FROM suppliers ORDER BY name ASC').all();
    res.json(suppliers.map(withProducts));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/suppliers/:id
exports.getById = (req, res) => {
  try {
    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(req.params.id);
    if (!supplier) return res.status(404).json({ error: 'Supplier not found' });
    res.json(withProducts(supplier));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/suppliers
exports.add = (req, res) => {
  try {
    const { name, phone = '', address = '', products = [] } = req.body;
    if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });

    const id = uuidv4();

    const insertSupplier = db.prepare(
      'INSERT INTO suppliers (id, name, phone, address, balance) VALUES (?, ?, ?, ?, 0)'
    );
    const insertProduct = db.prepare(
      'INSERT INTO supplier_products (id, supplier_id, name, purchase_price) VALUES (?, ?, ?, ?)'
    );

    const addSupplierTx = db.transaction(() => {
      insertSupplier.run(id, name.trim(), phone, address);
      for (const p of products) {
        insertProduct.run(p.id || uuidv4(), id, p.name, p.purchasePrice ?? p.purchase_price ?? 0);
      }
    });
    addSupplierTx();

    const supplier = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
    res.status(201).json(withProducts(supplier));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/suppliers/:id
exports.update = (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM suppliers WHERE id = ?').get(id);
    if (!existing) return res.status(404).json({ error: 'Supplier not found' });

    const name    = req.body.name    ?? existing.name;
    const phone   = req.body.phone   ?? existing.phone;
    const address = req.body.address ?? existing.address;
    const balance = req.body.balance ?? existing.balance;

    const updateSupplier = db.prepare(
      'UPDATE suppliers SET name = ?, phone = ?, address = ?, balance = ? WHERE id = ?'
    );
    const deleteProducts = db.prepare('DELETE FROM supplier_products WHERE supplier_id = ?');
    const insertProduct  = db.prepare(
      'INSERT INTO supplier_products (id, supplier_id, name, purchase_price) VALUES (?, ?, ?, ?)'
    );

    const updateTx = db.transaction(() => {
      updateSupplier.run(name, phone, address, balance, id);
      // If products array sent, replace them; otherwise leave them alone
      if (Array.isArray(req.body.products)) {
        deleteProducts.run(id);
        for (const p of req.body.products) {
          insertProduct.run(p.id || uuidv4(), id, p.name, p.purchasePrice ?? p.purchase_price ?? 0);
        }
      }
    });
    updateTx();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/suppliers/:id
exports.remove = (req, res) => {
  try {
    const info = db.prepare('DELETE FROM suppliers WHERE id = ?').run(req.params.id);
    if (info.changes === 0) return res.status(404).json({ error: 'Supplier not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
