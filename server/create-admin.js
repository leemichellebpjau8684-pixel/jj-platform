const bcrypt = require('bcrypt');
const { pool } = require('./src/db/index');
const dotenv = require('dotenv');

dotenv.config();

async function createAdmin() {
  const username = process.argv[2] || 'admin';
  const password = process.argv[3] || 'tutoring123';
  const nickname = process.argv[4] || '平台管理员';
  
  try {
    const existing = await pool.query(
      `SELECT id FROM admins WHERE username = $1`,
      [username]
    );
    
    if (existing.rows.length > 0) {
      console.log(`管理员 "${username}" 已存在`);
      process.exit(0);
    }
    
    const password_hash = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      `INSERT INTO admins (username, password_hash, nickname) VALUES ($1, $2, $3) RETURNING id, username, nickname`,
      [username, password_hash, nickname]
    );
    
    console.log('管理员创建成功:');
    console.log(result.rows[0]);
    console.log(`用户名: ${username}`);
    console.log(`密码: ${password}`);
    
    process.exit(0);
  } catch (err) {
    console.error('创建管理员失败:', err.message);
    process.exit(1);
  }
}

createAdmin();