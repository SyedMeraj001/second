import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, 'database', 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    console.log('Tables:', tables.map(t => t.name));
  });
  
  db.all("SELECT * FROM users WHERE email = 'user@gmail.com'", (err, rows) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log('\nUser data:', rows);
    }
    db.close();
  });
});
