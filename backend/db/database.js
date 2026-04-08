// db/database.js — SQLite connection singleton
const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, 'fox_pos.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

module.exports = db;
