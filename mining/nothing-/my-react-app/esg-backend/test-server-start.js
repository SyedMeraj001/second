import config from './config/config.js';
import { initializeDatabase } from './models/index.js';

console.log('Testing server startup...');
console.log('Config loaded:', {
  env: config.env,
  port: config.port,
  dbDialect: config.db.dialect,
  useSqlite: config.db.useSqlite,
  jwtSecretExists: !!config.jwt.secret
});

initializeDatabase()
  .then(() => {
    console.log('✓ Database initialized successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('✗ Database initialization failed:', error);
    process.exit(1);
  });
