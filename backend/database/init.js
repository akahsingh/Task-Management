const { initDatabase, dbWrapper, saveDatabase } = require('./db');

async function initializeTables() {
  await initDatabase();

  // Create users table
  dbWrapper.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create tasks table
  dbWrapper.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'completed')),
      due_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  console.log('Database initialized successfully');
}

module.exports = { initializeTables, dbWrapper };
