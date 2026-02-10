import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || 'localhost',
  user: process.env.DATABASE_URL?.split('://')[1]?.split(':')[0] || 'root',
  password: process.env.DATABASE_URL?.split(':')[2]?.split('@')[0] || '',
  database: process.env.DATABASE_URL?.split('/').pop() || 'equilibra',
});

try {
  const [rows] = await connection.execute('SELECT * FROM userProfiles LIMIT 10');
  console.log('User Profiles in DB:');
  console.log(JSON.stringify(rows, null, 2));
} catch (error) {
  console.error('Error:', error.message);
} finally {
  await connection.end();
}
