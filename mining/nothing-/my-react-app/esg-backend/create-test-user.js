import bcrypt from 'bcryptjs';
import { initializeDatabase, models } from './models/index.js';

async function createTestUser() {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    
    const hashedPassword = bcrypt.hashSync('password123', 10);
    
    const user = await models.User.create({
      email: 'admin@test.com',
      password_hash: hashedPassword,
      full_name: 'Test Admin',
      status: 'approved',
      role: 'admin'
    });
    
    console.log('✅ Test user created successfully!');
    console.log('Email: admin@test.com');
    console.log('Password: password123');
    console.log('Role: admin');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating user:', error.message);
    process.exit(1);
  }
}

createTestUser();
