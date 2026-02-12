import bcrypt from 'bcryptjs';
import { initializeDatabase } from '../models/index.js';

const USERS = [
  { email: 'superadmin1@esgenius.com', password: 'Admin@2025', fullName: 'Super Admin 1', role: 'super_admin' },
  { email: 'supervisor1@esgenius.com', password: 'Super@2025', fullName: 'Supervisor 1', role: 'supervisor' },
  { email: 'dataentry1@esgenius.com', password: 'Data@2025', fullName: 'Data Entry User 1', role: 'data_entry' }
];

async function seedUsers() {
  try {
    const { models } = await initializeDatabase();
    
    for (const userData of USERS) {
      const existing = await models.User.findOne({ where: { email: userData.email } });
      
      if (!existing) {
        const hashedPassword = bcrypt.hashSync(userData.password, 10);
        await models.User.create({
          email: userData.email,
          password_hash: hashedPassword,
          full_name: userData.fullName,
          role: userData.role,
          status: 'approved',
          approved_at: new Date()
        });
        console.log(`✅ Created user: ${userData.email}`);
      } else {
        console.log(`⚠️  User already exists: ${userData.email}`);
      }
    }
    console.log('✅ User seeding completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    process.exit(1);
  }
}

seedUsers();
