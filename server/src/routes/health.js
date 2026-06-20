const express = require('express');
const router = express.Router();
const { getStoreType } = require('../db/adapter');

router.get('/', async (req, res) => {
  try {
    const dbType = getStoreType();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      database: dbType,
      message: dbType === 'postgresql' ? '服务运行正常（PostgreSQL模式）' : '服务运行正常（内存存储模式）'
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: err.message
    });
  }
});

module.exports = router;