import { createApp } from './app.js';
import { connectDatabase } from './config/database.js';
import { config, assertProductionSecrets } from './config/index.js';

async function main() {
  assertProductionSecrets();
  await connectDatabase();
  const app = createApp();
  app.listen(config.port, () => {
    console.log(`API listening on port ${config.port}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
