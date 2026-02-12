import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const initAdvancedFeatures = async () => {
  console.log('🚀 Initializing Advanced ESG Features...\n');

  const dbPath = join(__dirname, 'database', 'esg.db');
  const schemaPath = join(__dirname, 'database', 'advanced-schema.sql');

  try {
    // Read the schema file
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Connect to database
    const db = new sqlite3.Database(dbPath);
    
    // Execute schema
    await new Promise((resolve, reject) => {
      db.exec(schema, (err) => {
        if (err) {
          console.error('❌ Schema execution failed:', err);
          reject(err);
        } else {
          console.log('✅ Advanced schema tables created successfully');
          resolve();
        }
      });
    });

    // Verify tables exist
    await new Promise((resolve, reject) => {
      db.all("SELECT name FROM sqlite_master WHERE type='table' AND name LIKE '%custom%' OR name LIKE '%risk%'", 
        (err, rows) => {
          if (err) {
            reject(err);
          } else {
            console.log('✅ Advanced tables found:', rows.map(r => r.name).join(', '));
            resolve();
          }
        });
    });

    db.close();
    console.log('\n🎉 Advanced features database initialization complete!');
    
  } catch (error) {
    console.error('❌ Initialization failed:', error);
  }
};

initAdvancedFeatures();