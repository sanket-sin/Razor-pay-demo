import { Sequelize } from 'sequelize';
import { config } from './index.js';

export const sequelize = new Sequelize(
  process.env.DB_NAME || 'creator_platform',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    dialect: 'mysql',
    logging: config.env === 'development' ? console.log : false,
    define: {
      underscored: true,
      timestamps: true,
    },
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
    dialectOptions: {
      dateStrings: true,
      typeCast: true,
    },
    timezone: '+00:00',
  }
);

function isAccessDenied(err) {
  const p = err?.parent || err?.original;
  return err?.name === 'SequelizeAccessDeniedError' || p?.code === 'ER_ACCESS_DENIED_ERROR';
}

export async function connectDatabase() {
  try {
    await sequelize.authenticate();
  } catch (err) {
    if (isAccessDenied(err)) {
      const user = process.env.DB_USER || 'root';
      const host = process.env.DB_HOST || '127.0.0.1';
      const db = process.env.DB_NAME || 'creator_platform';
      const pwdSet = Boolean(process.env.DB_PASSWORD && String(process.env.DB_PASSWORD).length > 0);
      console.error(`
MySQL access denied for "${user}"@${host} (password ${pwdSet ? 'was sent' : 'empty'}).

Update backend/.env so DB_USER / DB_PASSWORD match a real MySQL account with access to database "${db}".
If you copied .env.example, replace placeholder values — e.g. empty root password means DB_PASSWORD= with nothing after the equals.

Create database if needed:
  mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS ${db} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
`);
    }
    throw err;
  }
}
