# 前后端联调检查清单

## 接口验证清单

### ✅ 用户端接口

| 接口 | 方法 | 状态 | 验证要点 |
|------|------|------|----------|
| `/api/orders` | GET | ⬜ | 返回在售订单列表，status='active' |
| `/api/orders/:id` | GET | ⬜ | 返回单个订单详情，自动增加浏览量 |

### ✅ 管理员接口

| 接口 | 方法 | 状态 | 验证要点 |
|------|------|------|----------|
| `/api/admin/login` | POST | ⬜ | 用户名密码登录，返回JWT token |
| `/api/admin/verify` | GET | ⬜ | 验证token有效性 |
| `/api/admin/orders` | GET | ⬜ | 返回所有状态订单（draft/active/closed） |
| `/api/orders` | POST | ⬜ | 创建新订单，默认状态draft |
| `/api/orders/:id` | PUT | ⬜ | 更新订单信息 |
| `/api/orders/:id/publish` | POST | ⬜ | 发布订单，状态从draft变为active |
| `/api/orders/:id/archive` | POST | ⬜ | 归档订单，状态从active变为closed |

## 联调步骤

### 步骤1: 启动后端服务
```bash
cd server
npm run dev
```
- [ ] 确认后端服务在 http://localhost:3001 正常运行
- [ ] 确认数据库连接正常

### 步骤2: 启动前端服务
```bash
npm run dev
```
- [ ] 确认前端服务正常运行
- [ ] 确认 API_BASE_URL 配置正确

### 步骤3: 用户端验证
- [ ] 页面加载时调用 `GET /api/orders`
- [ ] loading 状态显示正确
- [ ] error 状态显示正确
- [ ] API失败时显示错误提示并提供重新加载按钮
- [ ] 订单数据正确展示（映射后端字段到前端格式）

### 步骤4: 管理员端验证
- [ ] 页面初始化执行 `verifyAdmin()`
- [ ] token失效自动退出登录并显示提示
- [ ] 登录成功后存储token到localStorage
- [ ] 创建订单后调用 `POST /api/orders`
- [ ] 发布订单后调用 `POST /api/orders/:id/publish`
- [ ] 归档订单后调用 `POST /api/orders/:id/archive`

### 步骤5: 数据一致性验证
- [ ] 用户端只能看到 active 状态订单
- [ ] 管理员端可以看到所有状态订单
- [ ] 创建的草稿订单正确保存到数据库
- [ ] 发布订单后状态正确变更
- [ ] 归档订单后状态正确变更

## 环境配置

### Railway部署准备
- [ ] 配置 PostgreSQL 数据库
- [ ] 配置环境变量：DATABASE_URL, JWT_SECRET, PORT
- [ ] 确认 CORS 配置正确

### Netlify环境变量配置
- [ ] VITE_API_URL: 后端部署地址

### 生产环境CORS配置
- [ ] 配置允许前端域名访问
- [ ] 配置正确的 HTTP 方法
- [ ] 配置正确的请求头

## 错误处理检查

- [ ] API请求失败时显示友好错误提示
- [ ] token过期时自动退出登录
- [ ] 网络错误时提供重试机制
- [ ] 后端错误信息正确传递到前端