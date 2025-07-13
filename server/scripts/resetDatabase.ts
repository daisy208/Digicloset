import { pool } from '../config/database.js';

const resetDatabase = async () => {
  const client = await pool.connect();
  
  try {
    console.log('🔄 Resetting database...');

    // Drop all tables in correct order (reverse of creation due to foreign keys)
    const tables = [
      'analytics_events',
      'try_on_sessions', 
      'clothing_items',
      'users',
      'brands'
    ];

    for (const table of tables) {
      await client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
      console.log(`✅ Dropped table: ${table}`);
    }

    console.log('✅ Database reset complete');
    
  } catch (error) {
    console.error('❌ Database reset failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  resetDatabase()
    .then(() => {
      console.log('🎉 Database reset completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database reset failed:', error);
      process.exit(1);
    });
}

export { resetDatabase };