import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

const email = 'user@gmail.com';
const password = 'password123';
const hashedPassword = bcrypt.hashSync(password, 10);

// Create users table if not exists
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name TEXT,
    status TEXT DEFAULT 'pending',
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Insert or update user
  db.run(`INSERT OR REPLACE INTO users (email, password_hash, full_name, status, role) 
          VALUES (?, ?, ?, ?, ?)`,
    [email, hashedPassword, 'Test User', 'approved', 'admin'],
    function(err) {
      if (err) {
        console.error('Error:', err);
      } else {
        console.log('✓ Test user created/updated successfully!');
        console.log('\nLogin credentials:');
        console.log('Email: user@gmail.com');
        console.log('Password: password123');
      }
      db.close();
    }
  );
});
