import bcrypt from 'bcryptjs';
import { models, initializeDatabase } from './models/index.js';

async function createTestUser() {
  try {
    await initializeDatabase();
    
    const email = 'user@gmail.com';
    const password = 'password123';
    
    // Check if user exists
    const existing = await models.User.findOne({ where: { email } });
    if (existing) {
      console.log('User already exists, updating password...');
      const hashedPassword = bcrypt.hashSync(password, 10);
      existing.password_hash = hashedPassword;
      existing.status = 'approved';
      await existing.save();
      console.log('User updated successfully!');
    } else {
      const hashedPassword = bcrypt.hashSync(password, 10);
      await models.User.create({
        email,
        password_hash: hashedPassword,
        full_name: 'Test User',
        status: 'approved',
        role: 'admin'
      });
      console.log('Test user created successfully!');
    }
    
    console.log('\nLogin credentials:');
    console.log('Email: user@gmail.com');
    console.log('Password: password123');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createTestUser();
