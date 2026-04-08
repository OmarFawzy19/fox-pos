// db/setup.js — Initialize all tables
const db = require('./database');

function setupDatabase() {
  db.exec(`
    -- Customers
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      address TEXT DEFAULT '',
      balance REAL DEFAULT 0
    );

    -- Suppliers
    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      phone TEXT DEFAULT '',
      address TEXT DEFAULT '',
      balance REAL DEFAULT 0
    );

    -- Supplier products (raw materials from each supplier)
    CREATE TABLE IF NOT EXISTS supplier_products (
      id TEXT PRIMARY KEY,
      supplier_id TEXT NOT NULL,
      name TEXT NOT NULL,
      purchase_price REAL DEFAULT 0,
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE CASCADE
    );

    -- Inventory (finished goods ready for sale)
    CREATE TABLE IF NOT EXISTS inventory (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      quantity REAL DEFAULT 0,
      purchase_price REAL DEFAULT 0,
      sale_price REAL DEFAULT 0
    );

    -- Invoices (both purchase and sale)
    CREATE TABLE IF NOT EXISTS invoices (
      id TEXT PRIMARY KEY,
      number INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('purchase', 'sale')),
      date TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      entity_name TEXT NOT NULL,
      total REAL DEFAULT 0,
      paid REAL DEFAULT 0,
      remaining REAL DEFAULT 0,
      status TEXT DEFAULT 'آجل'
    );

    -- Invoice line items
    CREATE TABLE IF NOT EXISTS invoice_items (
      id TEXT PRIMARY KEY,
      invoice_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit_price REAL NOT NULL,
      total REAL NOT NULL,
      FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE
    );

    -- Payments (collections from customers / payments to suppliers)
    CREATE TABLE IF NOT EXISTS payments (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      entity_type TEXT NOT NULL CHECK(entity_type IN ('customer', 'supplier')),
      entity_id TEXT NOT NULL,
      entity_name TEXT NOT NULL,
      amount REAL NOT NULL,
      invoice_id TEXT,
      note TEXT
    );

    -- Expenses (deducted from wallet)
    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      note TEXT
    );

    -- Wallet (single-row table, always id = 1)
    CREATE TABLE IF NOT EXISTS wallet (
      id INTEGER PRIMARY KEY DEFAULT 1,
      balance REAL DEFAULT 0
    );

    -- Seed wallet row if missing
    INSERT OR IGNORE INTO wallet (id, balance) VALUES (1, 0);
  `);

  console.log('✅ Database tables initialized');
}

module.exports = setupDatabase;
