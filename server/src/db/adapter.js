const memoryStore = require('./memoryStore');

let store = memoryStore;
let storeType = 'memory_store';

async function initStore() {
  try {
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
    
    await pool.query('SELECT 1');
    
    storeType = 'postgresql';
    store = {
      orders: {
        getAll: async () => {
          const result = await pool.query('SELECT * FROM orders ORDER BY created_at DESC');
          return result.rows;
        },
        getActive: async () => {
          const result = await pool.query('SELECT * FROM orders WHERE status = $1 ORDER BY created_at DESC', ['active']);
          return result.rows;
        },
        getById: async (id) => {
          const result = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
          return result.rows[0] || null;
        },
        create: async (data) => {
          const {
            title, subject, education_stage, grade_detail,
            salary_min, salary_max, contact_fee,
            district, address, latitude, longitude,
            teaching_type, requirements, source, raw_content
          } = data;
          const result = await pool.query(
            `INSERT INTO orders (
              order_no, title, subject, education_stage, grade_detail,
              salary_min, salary_max, contact_fee,
              district, address, latitude, longitude,
              teaching_type, requirements, source, raw_content,
              status, geo_status
            ) VALUES (
              generate_order_no(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'draft', 'pending'
            ) RETURNING *`,
            [title, subject, education_stage, grade_detail,
             salary_min ?? null, salary_max ?? null, contact_fee ?? null,
             district, address, latitude ?? null, longitude ?? null,
             teaching_type, requirements ?? null, source, raw_content ?? null]
          );
          return result.rows[0];
        },
        update: async (id, data) => {
          const fields = [];
          const values = [];
          let paramIndex = 1;
          
          const allowedFields = [
            'title', 'subject', 'education_stage', 'grade_detail',
            'salary_min', 'salary_max', 'contact_fee',
            'district', 'address', 'latitude', 'longitude',
            'teaching_type', 'requirements', 'source', 'raw_content',
            'contact_status'
          ];
          
          for (const field of allowedFields) {
            if (data[field] !== undefined) {
              fields.push(`${field} = $${paramIndex}`);
              values.push(data[field]);
              paramIndex++;
            }
          }
          
          values.push(id);
          
          const result = await pool.query(
            `UPDATE orders SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
            values
          );
          return result.rows[0] || null;
        },
        delete: async (id) => {
          const result = await pool.query(
            'UPDATE orders SET status = $1, archived_at = NOW() WHERE id = $2 RETURNING *',
            ['closed', id]
          );
          return result.rows[0] || null;
        },
        publish: async (id) => {
          const result = await pool.query(
            'UPDATE orders SET status = $1, published_at = NOW() WHERE id = $2 RETURNING *',
            ['active', id]
          );
          return result.rows[0] || null;
        },
        archive: async (id) => {
          const result = await pool.query(
            'UPDATE orders SET status = $1, archived_at = NOW() WHERE id = $2 RETURNING *',
            ['closed', id]
          );
          return result.rows[0] || null;
        },
        incrementView: async (id) => {
          await pool.query('UPDATE orders SET view_count = view_count + 1 WHERE id = $1', [id]);
        },
        count: async (status = null) => {
          if (status) {
            const result = await pool.query('SELECT COUNT(*) FROM orders WHERE status = $1', [status]);
            return parseInt(result.rows[0].count);
          }
          const result = await pool.query('SELECT COUNT(*) FROM orders');
          return parseInt(result.rows[0].count);
        }
      },
      admins: {
        getByUsername: async (username) => {
          const result = await pool.query('SELECT * FROM admins WHERE username = $1', [username]);
          return result.rows[0] || null;
        },
        updateLastLogin: async (id) => {
          await pool.query('UPDATE admins SET last_login_at = NOW() WHERE id = $1', [id]);
        }
      }
    };
    
    console.log('✅ PostgreSQL数据库连接成功');
  } catch (err) {
    console.log('⚠️ PostgreSQL连接失败，使用内存存储模式');
    store = memoryStore;
  }
}

module.exports = { getStore: () => store, getStoreType: () => storeType, initStore };