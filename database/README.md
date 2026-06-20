# 数据库初始化指南

## 环境要求

- PostgreSQL 15+
- psql 命令行工具

## 本地初始化

### 1. 创建数据库

```bash
psql -U postgres -c "CREATE DATABASE tutoring;"
```

### 2. 执行建表脚本

```bash
psql -U postgres -d tutoring -f schema.sql
```

### 3. 插入测试数据（可选）

```bash
psql -U postgres -d tutoring -f seed.sql
```

### 4. 验证表结构

```bash
psql -U postgres -d tutoring -c "\dt"
```

预期输出：
```
              List of relations
 Schema |     Name      | Type  | Owner 
--------+---------------+-------+-------
 public | admins        | table | postgres
 public | geocode_logs | table | postgres
 public | orders        | table | postgres
```

### 5. 验证索引

```bash
psql -U postgres -d tutoring -c "SELECT indexname FROM pg_indexes WHERE tablename = 'orders';"
```

### 6. 测试订单编号生成

```bash
psql -U postgres -d tutoring -c "SELECT generate_order_no();"
```

## Railway PostgreSQL 初始化

### 1. 创建 Railway 项目

访问 https://railway.app 创建项目，添加 PostgreSQL 数据库。

### 2. 获取连接信息

在 Railway 控制台 Variables 标签页添加：
- `DATABASE_URL` = Railway 生成的连接字符串

### 3. 使用 Railway CLI 初始化

```bash
# 安装 Railway CLI
npm install -g @railway/cli

# 登录
railway login

# 链接项目
railway link

# 执行建表
railway run psql -U postgres -d tutoring -f schema.sql

# 插入测试数据
railway run psql -U postgres -d tutoring -f seed.sql
```

### 4. 或使用外部工具

使用 pgAdmin、DBeaver 等工具连接 Railway PostgreSQL，执行 schema.sql。

## 默认账号

- 用户名: admin
- 密码: tutoring123
- 角色: 平台管理员

**请立即修改默认密码！**

## 字段说明

### orders 表

| 字段 | 说明 |
|------|------|
| order_no | 自动生成，格式: ORD20250612001 |
| education_stage | 小学/初中/高中/大学/成人 |
| grade_detail | 具体年级 |
| salary_min/max | 薪资范围（元/小时） |
| contact_fee | 中介费（元） |
| geo_status | pending/success/failed |
| status | draft/active/closed |
| raw_content | 微信原始文本 |

### admins 表

管理员账号表，密码使用 bcrypt 哈希存储。

### geocode_logs 表

地理编码日志，记录每次调用高德API的情况。

## 常用查询

### 查看所有订单

```sql
SELECT order_no, title, subject, district, status, created_at 
FROM orders 
ORDER BY created_at DESC;
```

### 查看待处理地理编码

```sql
SELECT id, title, address 
FROM orders 
WHERE geo_status = 'pending';
```

### 查看活跃订单

```sql
SELECT * FROM orders 
WHERE status = 'active' 
ORDER BY published_at DESC;
```
