import mysql from 'mysql2/promise';

async function migrate() {
  try {
    console.log('Starting database migration...');
    
    // Parse DATABASE_URL
    const dbUrl = process.env.DATABASE_URL || 'mysql://root:root@localhost:3306/equilibra_ai';
    const url = new URL(dbUrl);
    
    const connection = await mysql.createConnection({
      host: url.hostname,
      user: url.username,
      password: url.password,
      database: url.pathname.slice(1),
    });
    
    console.log('✓ Connected to database');
    
    // Add missing columns to users table
    const alterStatements = [
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS openId VARCHAR(64) UNIQUE`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(64)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS loginMethod VARCHAR(64) DEFAULT 'local'`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS role ENUM('user', 'admin') DEFAULT 'user'`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS isEmailVerified INT DEFAULT 0`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS onboardingCompleted INT DEFAULT 0`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS passwordResetToken VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS passwordResetExpires TIMESTAMP`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS emailVerificationToken VARCHAR(255)`,
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS emailVerificationExpires TIMESTAMP`,
    ];
    
    for (const statement of alterStatements) {
      try {
        await connection.execute(statement);
        console.log(`✓ ${statement.substring(0, 50)}...`);
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME') {
          console.log(`- ${statement.substring(0, 50)}... (already exists)`);
        } else {
          console.log(`- ${statement.substring(0, 50)}... (skipped)`);
        }
      }
    }
    
    await connection.end();
    console.log('✓ Database migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exit(1);
  }
}

migrate();
