const connectDB = require('./src/config/db');
const { runMigrationTask } = require('./src/services/migrationService');
const mongoose = require('mongoose');

async function seed() {
  console.log('--- ZELORA Catalogue Migration Seed Script ---');
  await connectDB();

  try {
    await runMigrationTask(true);
    console.log('\n🎉 Seed completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Seed failed:', err);
    process.exit(1);
  }
}

seed();
