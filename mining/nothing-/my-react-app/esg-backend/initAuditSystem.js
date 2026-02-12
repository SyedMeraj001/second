import db from './database/db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// NOTE: This is a CLI initialization script, not a web endpoint.
// CSRF protection is implemented in the web server (server.js) using csurf middleware.
// This script should only be run locally by administrators via command line.
// It is never exposed as an HTTP endpoint and therefore does not require CSRF protection.

// Initialize audit system tables
const schemaPath = path.join(__dirname, 'database', 'audit-schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

// SECURITY: This db.exec() call is safe from CSRF attacks because:
// 1. This is a CLI script, not an HTTP endpoint
// 2. It requires direct file system access (admin-only)
// 3. It's never exposed to web requests
// 4. CSRF protection applies to HTTP endpoints, which are protected in server.js
db.exec(schema, (err) => {
  if (err) {
    console.error('Error initializing audit system:', err);
    process.exit(1);
  } else {
    console.log('✓ Audit system initialized successfully');
    console.log('✓ Tables created: audit_log, evidence_files, approval_workflows, approval_steps');
    console.log('✓ Tables created: notification_queue, compliance_reports, sync_log');
    process.exit(0);
  }
});
