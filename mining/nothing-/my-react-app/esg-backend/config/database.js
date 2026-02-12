import { Sequelize } from 'sequelize';
import config from './config.js';

let sequelize;

const createSequelize = async () => {
  if (sequelize) return sequelize;

  const isSqlite = config.db.useSqlite;

  if (isSqlite) {
    console.log('Initializing Sequelize with SQLite');
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: config.db.storage,
      logging: false
    });
  } else {
    console.log(`Initializing Sequelize with ${config.db.dialect}`);
    sequelize = new Sequelize(
      config.db.name,
      config.db.user,
      config.db.password,
      {
        host: config.db.host,
        port: config.db.port,
        dialect: config.db.dialect,
        logging: false,
        pool: {
          max: 5,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      }
    );
  }

  try {
    await sequelize.authenticate();
    console.log('Sequelize connection established successfully.');
  } catch (error) {
    console.error('Unable to connect to the database via Sequelize:', error);
    // Don't kill process, let it retry or fail gracefully
  }

  return sequelize;
};

export default createSequelize;