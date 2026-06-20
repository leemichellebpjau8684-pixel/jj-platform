-- =====================================================
-- 家教中介平台 - 数据库初始化脚本
-- PostgreSQL 15+
-- =====================================================

-- 1. 启用UUID扩展
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. 删除旧表（如果存在，用于重建）
DROP TABLE IF EXISTS geocode_logs CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS admins CASCADE;
DROP SEQUENCE IF EXISTS order_seq CASCADE;

-- =====================================================
-- 3. 订单编号序列（解决并发风险）
-- =====================================================
CREATE SEQUENCE order_seq START 1;

-- =====================================================
-- 4. 管理员表
-- =====================================================
CREATE TABLE admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nickname VARCHAR(100),
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_admins_username ON admins(username);

-- =====================================================
-- 5. 订单表
-- =====================================================
CREATE TABLE orders (
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
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- 约束
    CONSTRAINT chk_education_stage CHECK (education_stage IN ('幼儿', '小学', '初中', '高中', '大学', '成人')),
    CONSTRAINT chk_teaching_type CHECK (teaching_type IN ('上门', '网课', '均可')),
    CONSTRAINT chk_status CHECK (status IN ('draft', 'active', 'closed')),
    CONSTRAINT chk_contact_status CHECK (contact_status IN ('new', 'contacted', 'completed', 'expired')),
    CONSTRAINT chk_geo_status CHECK (geo_status IN ('pending', 'success', 'failed')),
    CONSTRAINT chk_salary CHECK (salary_min IS NULL OR salary_max IS NULL OR salary_min <= salary_max)
);

-- 订单表索引
CREATE INDEX idx_orders_order_no ON orders(order_no);
CREATE INDEX idx_orders_subject ON orders(subject);
CREATE INDEX idx_orders_education_stage ON orders(education_stage);
CREATE INDEX idx_orders_district ON orders(district);
CREATE INDEX idx_orders_teaching_type ON orders(teaching_type);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_contact_status ON orders(contact_status);
CREATE INDEX idx_orders_geo_status ON orders(geo_status);
CREATE INDEX idx_orders_source ON orders(source);
CREATE INDEX idx_orders_published_at ON orders(published_at);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- 复合索引
CREATE INDEX idx_orders_status_district ON orders(status, district);
CREATE INDEX idx_orders_status_subject ON orders(status, subject);
CREATE INDEX idx_orders_status_education ON orders(status, education_stage);
CREATE INDEX idx_orders_geo ON orders(latitude, longitude);

-- =====================================================
-- 6. 地理编码日志表
-- =====================================================
CREATE TABLE geocode_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    address VARCHAR(500) NOT NULL,
    latitude DECIMAL(11, 7),
    longitude DECIMAL(11, 7),
    status VARCHAR(20) NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    
    CONSTRAINT chk_geocode_status CHECK (status IN ('success', 'failed'))
);

CREATE INDEX idx_geocode_logs_order_id ON geocode_logs(order_id);
CREATE INDEX idx_geocode_logs_status ON geocode_logs(status);
CREATE INDEX idx_geocode_logs_created_at ON geocode_logs(created_at DESC);

-- =====================================================
-- 7. 自动更新触发器
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. 生成订单编号函数（使用序列，无并发风险）
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