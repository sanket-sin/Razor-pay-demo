import { sequelize } from '../config/database.js';
import '../models/index.js';

async function main() {
  await sequelize.authenticate();
  await sequelize.sync({ alter: process.env.DB_SYNC_ALTER === 'true' });
  console.log('Database synced');
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
