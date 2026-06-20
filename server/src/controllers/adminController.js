const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { getStore } = require('../db/adapter');

async function login(req, res) {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '用户名和密码不能为空'
      });
    }
    
    const store = getStore();
    const admin = await store.admins.getByUsername(username);
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      });
    }
    
    const isValid = await bcrypt.compare(password, admin.password_hash);
    
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: '用户名或密码错误'
      });
    }
    
    await store.admins.updateLastLogin(admin.id);
    
    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        nickname: admin.nickname
      }
    });
  } catch (err) {
    console.error('登录失败:', err.message);
    res.status(500).json({
      success: false,
      error: '登录失败'
    });
  }
}

async function verify(req, res) {
  try {
    res.json({
      success: true,
      admin: {
        id: req.admin.id,
        username: req.admin.username
      }
    });
  } catch (err) {
    console.error('验证失败:', err.message);
    res.status(500).json({
      success: false,
      error: '验证失败'
    });
  }
}

module.exports = {
  login,
  verify
};