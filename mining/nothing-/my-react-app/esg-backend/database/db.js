import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const sqlite3Verbose = sqlite3.verbose();

const dbPath = path.join(__dirname, 'esg.db');

let db;

function initializeDatabase() {
  return new Promise((resolve, reject) => {
    // Initialize database
    db = new sqlite3Verbose.Database(dbPath, (err) => {
      if (err) {
        console.error('Error opening database:', err);
        return reject(err);
      }
      console.log('Connected to SQLite database');

      const schemaPath = path.join(__dirname, 'schema.sql');
      const enhancedSchemaPath = path.join(__dirname, 'enhanced-schema.sql');

      try {
        const schema = fs.readFileSync(schemaPath, 'utf8');

        db.exec(schema, (err) => {
          if (err) {
            console.error('Error initializing database:', err);
            return reject(err);
          }
          console.log('Schema initialized successfully');

          // Apply enhanced schema if exists
          if (fs.existsSync(enhancedSchemaPath)) {
            const enhancedSchema = fs.readFileSync(enhancedSchemaPath, 'utf8');
            db.exec(enhancedSchema, (err) => {
              if (err) {
                console.error('Error applying enhanced schema:', err);
                // Don't reject, just warn
              } else {
                console.log('Enhanced schema applied successfully');
              }
              resolve(db);
            });
          } else {
            resolve(db);
          }
        });
      } catch (error) {
        // schema.sql might not exist, but maybe DB is already there
        console.warn('Warning: Could not load schema.sql', error.message);
        resolve(db);
      }
    });
  });
}

// Initialize on import
if (!db) {
  db = new sqlite3Verbose.Database(dbPath, (err) => {
    if (err) {
      console.error('Error opening database:', err);
    } else {
      console.log('SQLite database connection established');
    }
  });
}

export default db;
export { initializeDatabase };