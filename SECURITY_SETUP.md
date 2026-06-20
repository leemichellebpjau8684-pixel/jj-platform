# 🔐 管理员密码安全配置指南

## ⚠️ 重要安全警告

**不要在 `.env` 文件中设置管理员密码！**

Vite 的 `VITE_` 环境变量会在构建时被打包到前端代码中，任何人都可以通过浏览器开发者工具看到密码。

## ✅ 正确的配置方法

### 方法一：在 Netlify 后台配置（推荐）

1. **登录 Netlify 后台**
   - 访问 https://app.netlify.com/
   - 登录你的账户

2. **选择你的站点**
   - 在 Sites 列表中找到你的项目
   - 点击进入站点设置

3. **配置环境变量**
   - 点击 **Site settings**
   - 选择 **Environment variables**
   - 点击 **Add a variable** 按钮
   - 添加以下环境变量：
     ```
     Key: VITE_ADMIN_PASSWORD
     Value: 你的管理员密码
     ```

4. **重新部署站点**
   - 配置完成后，点击 **Deploy** 标签
   - 点击 **Trigger deploy** → **Deploy site**
   - 等待部署完成

### 方法二：使用 Netlify CLI（开发者）

```bash
# 安装 Netlify CLI（如果还没安装）
npm install -g netlify-cli

# 登录 Netlify
netlify login

# 设置环境变量
netlify env:set VITE_ADMIN_PASSWORD "你的管理员密码"

# 重新部署
netlify deploy --prod
```

## 🔍 验证配置是否安全

### 检查密码是否暴露

1. **访问你的网站**
2. **打开浏览器开发者工具**（F12）
3. **查看源代码**或**网络请求**
4. **搜索你的密码**
   - 如果能搜索到密码，说明配置不安全
   - 如果搜索不到，说明配置正确

### 检查构建文件

```bash
# 构建项目
npm run build

# 检查构建文件中是否包含密码
grep -r "你的密码" dist/
```

如果搜索到密码，说明密码被打包到了前端代码中，需要重新配置。

## 🛠️ 本地开发配置

如果你需要在本地开发时测试管理员功能，可以：

1. **创建本地 `.env` 文件**
   ```bash
   # .env 文件（不会被提交到 Git）
   VITE_ADMIN_PASSWORD="local_test_password"
   ```

2. **确认 `.gitignore` 配置**
   确保 `.gitignore` 文件包含：
   ```
   .env*
   !.env.example
   ```

3. **本地测试**
   ```bash
   npm run dev
   ```

## 📋 环境变量配置清单

### Netlify 后台必须配置

- ✅ `VITE_ADMIN_PASSWORD` - 管理员登录密码

### 可选配置（高德地图）

- `VITE_AMAP_JS_KEY` - 高德地图 JS API 密钥
- `VITE_AMAP_JS_SECURITY_CODE` - 高德地图 JS API 安全密钥
- `VITE_AMAP_WEB_KEY` - 高德地图 Web 服务密钥
- `VITE_AMAP_WEB_SECURITY_CODE` - 高德地图 Web 服务安全密钥

## 🔒 安全最佳实践

1. **使用强密码**
   - 至少 12 位字符
   - 包含大小写字母、数字和特殊符号
   - 定期更换密码

2. **不要在代码中硬编码密码**
   - ❌ 不要在 `.env` 文件中设置密码
   - ❌ 不要在代码中直接写密码
   - ❌ 不要在 `netlify.toml` 中设置密码

3. **定期检查安全性**
   - 定期检查构建文件
   - 使用浏览器开发者工具验证
   - 关注安全漏洞报告

4. **使用环境特定的密码**
   - 开发环境：使用简单密码
   - 生产环境：使用强密码
   - 不同环境使用不同密码

## 🚨 如果密码已经暴露

如果发现密码已经暴露，请立即：

1. **更改管理员密码**
   - 在 Netlify 后台更新 `VITE_ADMIN_PASSWORD`
   - 重新部署站点

2. **检查访问日志**
   - 查看 Netlify 访问日志
   - 检查是否有异常访问

3. **通知相关人员**
   - 如果有多人使用管理员账户
   - 通知他们密码已更改

## 📞 需要帮助？

如果遇到配置问题：

1. 查看 Netlify 官方文档：https://docs.netlify.com/
2. 检查构建日志中的错误信息
3. 确认环境变量名称拼写正确（区分大小写）

---

**记住：安全第一，永远不要在前端代码中暴露敏感信息！**