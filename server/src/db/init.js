const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

async function initDatabase() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔄 开始初始化数据库...');

    // 读取 schema.sql（尝试多个可能的路径）
    const possiblePaths = [
      path.join(__dirname, '../../../database/schema.sql'), // Railway: /app/database/schema.sql
      path.join(__dirname, '../../database/schema.sql'),    // 本地开发
      path.join(process.cwd(), 'database/schema.sql'),      // 从工作目录
      path.join(process.cwd(), '../database/schema.sql'),   // server 目录内运行
    ];

    let schema = null;
    let usedPath = '';
    for (const schemaPath of possiblePaths) {
      try {
        schema = fs.readFileSync(schemaPath, 'utf8');
        usedPath = schemaPath;
        console.log(`✅ 从 ${schemaPath} 读取 schema`);
        break;
      } catch (err) {
        // 继续尝试下一个路径
      }
    }

    if (!schema) {
      console.error('❌ 无法找到 schema.sql 文件，尝试过的路径:');
      possiblePaths.forEach(p => console.error(`   - ${p}`));
      throw new Error('schema.sql not found');
    }

    // 执行 schema
    await pool.query(schema);
    console.log('✅ 表结构创建成功');

    // 创建默认管理员账户
    const passwordHash = await bcrypt.hash('admin123', 10);
    await pool.query(
      `INSERT INTO admins (username, password_hash, nickname)
       VALUES ($1, $2, $3)
       ON CONFLICT (username) DO NOTHING`,
      ['admin', passwordHash, '平台管理员']
    );
    console.log('✅ 管理员账户创建成功 (admin / admin123)');

    console.log('🎉 数据库初始化完成！');
    process.exit(0);
  } catch (err) {
    console.error('❌ 数据库初始化失败:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDatabase();
