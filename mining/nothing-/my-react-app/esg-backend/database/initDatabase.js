import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// NOTE: This is a database initialization script, not a web endpoint.
// CSRF protection is implemented in the web server (server.js) using csrf middleware.
// This script should only be run locally by administrators, never exposed as a web endpoint.

async function initializeDatabase() {
  console.log('Initializing enhanced ESG database...');
  
  try {
    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        await executeStatement(statement.trim());
      }
    }
    
    // Add sample users for testing
    await addSampleUsers();
    
    console.log('Database initialized successfully!');
    console.log('Sample users created with secure passwords');
    
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

function executeStatement(statement) {
  return new Promise((resolve, reject) => {
    db.run(statement, (err) => {
      if (err) {
        console.error('SQL Error:', err.message);
        console.error('Statement:', statement.substring(0, 100) + '...');
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

async function addSampleUsers() {
  // Generate secure password hashes
  const saltRounds = 12;
  const defaultPassword = process.env.DEFAULT_USER_PASSWORD || 'TempPass123!';
  
  const users = [
    {
      email: 'verifier@esgenius.com',
      password_hash: await bcrypt.hash(defaultPassword, saltRounds),
      full_name: 'ESG Verifier',
      role: 'verifier',
      status: 'approved'
    },
    {
      email: 'approver@esgenius.com', 
      password_hash: await bcrypt.hash(defaultPassword, saltRounds),
      full_name: 'ESG Approver',
      role: 'approver',
      status: 'approved'
    },
    {
      email: 'viewer@esgenius.com',
      password_hash: await bcrypt.hash(defaultPassword, saltRounds),
      full_name: 'ESG Viewer',
      role: 'viewer',
      status: 'approved'
    }
  ];
  
  // Use parameterized queries to prevent SQL injection
  for (const user of users) {
    await new Promise((resolve, reject) => {
      db.run(
        `INSERT OR IGNORE INTO users (email, password_hash, full_name, role, status, approved_at)
         VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
        [user.email, user.password_hash, user.full_name, user.role, user.status],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }
  
  console.log(`Default password: ${defaultPassword}`);
  console.log('IMPORTANT: Change default passwords in production!');
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  initializeDatabase()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export { initializeDatabase };