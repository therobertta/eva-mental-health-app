const fs = require('fs');
const path = require('path');
const db = require('../config/database');

async function runMigrations() {
  try {
    console.log('Running database migrations...');
    
    // Read all SQL files from migrations directory
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    for (const file of files) {
      console.log(`Running migration: ${file}`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      try {
        await db.query(sql);
        console.log(`✓ Migration ${file} completed successfully`);
      } catch (error) {
        console.error(`✗ Error running migration ${file}:`, error.message);
        throw error;
      }
    }
    
    console.log('All migrations completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

runMigrations();