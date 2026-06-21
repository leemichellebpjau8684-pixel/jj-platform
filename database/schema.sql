-- =====================================================
-- 家教中介平台 - 数据库初始化脚本
-- PostgreSQL 15+
-- =====================================================
-- 注意：此脚本使用 IF NOT EXISTS，不会删除已有数据
-- =====================================================

-- 1. 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 2. 订单编号序列（解决并发风险）
-- =====================================================
CREATE SEQUENCE IF NOT EXISTS order_seq START 1;

-- =====================================================
-- 3. 管理员表
-- =====================================================
CREATE TABLE IF NOT EXISTS admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(100),
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 管理员表索引（使用 IF NOT EXISTS）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_admins_username') THEN
        CREATE INDEX idx_admins_username ON admins(username);
    END IF;
END $$;

-- =====================================================
-- 4. 订单表
-- =====================================================
CREATE TABLE IF NOT EXISTS orders (
    -- 主键和编号
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_no VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(200) NOT NULL,
    
    -- 基本属性
    subject VARCHAR(50) NOT NULL,
    education_stage VARCHAR(50) NOT NULL,
    grade_detail VARCHAR(50),
    salary_min INTEGER,
    salary_max INTEGER,
    contact_fee INTEGER,
    
    -- 地理位置
    district VARCHAR(50) NOT NULL,
    address VARCHAR(500) NOT NULL,
    latitude DECIMAL(11, 7),
    longitude DECIMAL(11, 7),
    geo_status VARCHAR(20) DEFAULT 'pending',
    
    -- 教学信息
    teaching_type VARCHAR(50) NOT NULL,
    requirements TEXT,
    
    -- 来源
    source VARCHAR(100) NOT NULL,
    raw_content TEXT,
    
    -- 状态
    status VARCHAR(20) DEFAULT 'draft',
    contact_status VARCHAR(20) DEFAULT 'new',
    
    -- 统计字段
    view_count INTEGER NOT NULL DEFAULT 0,
    
    -- 时间字段
    published_at TIMESTAMP,
    archived_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 订单表约束（使用 DO 块避免重复创建）
DO $$
BEGIN
    -- 学段约束
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_education_stage') THEN
        ALTER TABLE orders ADD CONSTRAINT chk_education_stage CHECK (education_stage IN ('幼儿', '小学', '初中', '高中', '大学', '成人'));
    END IF;
    -- 教学类型约束
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_teaching_type') THEN
        ALTER TABLE orders ADD CONSTRAINT chk_teaching_type CHECK (teaching_type IN ('上门', '网课', '均可'));
    END IF;
    -- 状态约束
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_status') THEN
        ALTER TABLE orders ADD CONSTRAINT chk_status CHECK (status IN ('draft', 'active', 'closed'));
    END IF;
    -- 联系状态约束
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_contact_status') THEN
        ALTER TABLE orders ADD CONSTRAINT chk_contact_status CHECK (contact_status IN ('new', 'contacted', 'completed', 'expired'));
    END IF;
    -- 地理状态约束
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_geo_status') THEN
        ALTER TABLE orders ADD CONSTRAINT chk_geo_status CHECK (geo_status IN ('pending', 'success', 'failed'));
    END IF;
    -- 薪资约束
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_salary') THEN
        ALTER TABLE orders ADD CONSTRAINT chk_salary CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max);
    END IF;
END $$;

-- 订单表索引（使用 IF NOT EXISTS）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_order_no') THEN
        CREATE INDEX idx_orders_order_no ON orders(order_no);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_subject') THEN
        CREATE INDEX idx_orders_subject ON orders(subject);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_education_stage') THEN
        CREATE INDEX idx_orders_education_stage ON orders(education_stage);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_district') THEN
        CREATE INDEX idx_orders_district ON orders(district);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_teaching_type') THEN
        CREATE INDEX idx_orders_teaching_type ON orders(teaching_type);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_status') THEN
        CREATE INDEX idx_orders_status ON orders(status);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_contact_status') THEN
        CREATE INDEX idx_orders_contact_status ON orders(contact_status);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_geo_status') THEN
        CREATE INDEX idx_orders_geo_status ON orders(geo_status);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_source') THEN
        CREATE INDEX idx_orders_source ON orders(source);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_published_at') THEN
        CREATE INDEX idx_orders_published_at ON orders(published_at);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_created_at') THEN
        CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
    END IF;
    -- 复合索引
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_status_district') THEN
        CREATE INDEX idx_orders_status_district ON orders(status, district);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_status_subject') THEN
        CREATE INDEX idx_orders_status_subject ON orders(status, subject);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_status_education') THEN
        CREATE INDEX idx_orders_status_education ON orders(status, education_stage);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_orders_geo') THEN
        CREATE INDEX idx_orders_geo ON orders(latitude, longitude);
    END IF;
END $$;

-- =====================================================
-- 5. 地理编码日志表
-- =====================================================
CREATE TABLE IF NOT EXISTS geocode_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    address VARCHAR(500) NOT NULL,
    latitude DECIMAL(11, 7),
    longitude DECIMAL(11, 7),
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 地理编码日志表约束
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'chk_geocode_status') THEN
        ALTER TABLE geocode_logs ADD CONSTRAINT chk_geocode_status CHECK (status IN ('success', 'failed'));
    END IF;
END $$;

-- 地理编码日志表索引
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_geocode_logs_order_id') THEN
        CREATE INDEX idx_geocode_logs_order_id ON geocode_logs(order_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_geocode_logs_status') THEN
        CREATE INDEX idx_geocode_logs_status ON geocode_logs(status);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_geocode_logs_created_at') THEN
        CREATE INDEX idx_geocode_logs_created_at ON geocode_logs(created_at DESC);
    END IF;
END $$;

-- =====================================================
-- 6. 自动更新触发器
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 触发器（使用 DO 块避免重复创建）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_orders_updated_at') THEN
        CREATE TRIGGER update_orders_updated_at
            BEFORE UPDATE ON orders
            FOR EACH ROW
            EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =====================================================
-- 7. 生成订单编号函数（使用序列，无并发风险）
-- =====================================================
CREATE OR REPLACE FUNCTION generate_order_no()
RETURNS VARCHAR(20) AS $$
DECLARE
    seq_val BIGINT;
    order_no VARCHAR(20);
BEGIN
    seq_val := nextval('order_seq');
    order_no := 'ORD' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(seq_val::TEXT, 6, '0');
    RETURN order_no;
END;
$$ LANGUAGE plpgsql;