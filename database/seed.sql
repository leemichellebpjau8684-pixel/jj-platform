-- =====================================================
-- 家教中介平台 - 测试数据
-- =====================================================

-- 注意：管理员账号不在seed.sql中创建
-- 请使用后端 create-admin 脚本创建管理员
-- 例如：npm run create-admin -- --username admin --password tutoring123

-- =====================================================
-- 测试订单数据
-- =====================================================

-- 测试订单1：高中数学（active状态）
INSERT INTO orders (
    order_no, title, subject, education_stage, grade_detail,
    salary_min, salary_max, contact_fee, district, address,
    latitude, longitude, geo_status,
    teaching_type, requirements, source, raw_content, status, contact_status
) VALUES (
    'ORD20250612001',
    '浦东张江 - 高二数学家教',
    '数学',
    '高中',
    '高二',
    250,
    350,
    500,
    '浦东新区',
    '张江镇科苑路88号',
    31.2157,
    121.5439,
    'success',
    '上门',
    '要求男生，有高三带班经验，一周两次课',
    '微信群-浦东家教1群',
    '【浦东家教】
高二数学
250-350元/小时
每周两次
要求男老师，有高三带班经验',
    'active',
    'new'
);

-- 测试订单2：初中英语（active状态）
INSERT INTO orders (
    order_no, title, subject, education_stage, grade_detail,
    salary_min, salary_max, contact_fee, district, address,
    latitude, longitude, geo_status,
    teaching_type, requirements, source, raw_content, status, contact_status
) VALUES (
    'ORD20250612002',
    '徐汇交大附近 - 初二英语',
    '英语',
    '初中',
    '初二',
    180,
    220,
    300,
    '徐汇区',
    '交通大学华山路校门附近',
    31.1981,
    121.4386,
    'success',
    '上门',
    '女大学生优先，口语好，周末上课',
    '小红书',
    '【徐汇家教】
初二英语
180-220元/小时
周末上课
女大学生优先，口语好',
    'active',
    'contacted'
);

-- 测试订单3：高中物理（draft状态）
INSERT INTO orders (
    order_no, title, subject, education_stage, grade_detail,
    salary_min, salary_max, contact_fee, district, address,
    teaching_type, requirements, source, raw_content, status, contact_status, geo_status
) VALUES (
    'ORD20250612003',
    '静安寺 - 高一物理',
    '物理',
    '高中',
    '高一',
    200,
    300,
    400,
    '静安区',
    '静安寺南京西路',
    '均可',
    '有教师资格证优先，周中晚上或周末',
    '微信群-家教兼职群',
    '【静安家教】
高一物理
200-300元/小时
周中晚上或周末
有教师资格证优先',
    'draft',
    'new',
    'pending'
);

-- 测试订单4：幼儿启蒙（active状态）
INSERT INTO orders (
    order_no, title, subject, education_stage, grade_detail,
    salary_min, salary_max, contact_fee, district, address,
    latitude, longitude, geo_status,
    teaching_type, requirements, source, raw_content, status, contact_status
) VALUES (
    'ORD20250612004',
    '闵行七宝 - 幼儿启蒙教育',
    '启蒙',
    '幼儿',
    NULL,
    150,
    200,
    300,
    '闵行区',
    '七宝镇七莘路',
    31.1565,
    121.3587,
    'success',
    '上门',
    '女老师，有幼教经验，性格温和，周一至周五下午',
    '微信群-宝妈群',
    '【闵行家教】
幼儿启蒙
150-200元/小时
周一至周五下午
女老师，有幼教经验',
    'active',
    'new'
);

-- 测试订单5：小学语文（closed状态）
INSERT INTO orders (
    order_no, title, subject, education_stage, grade_detail,
    salary_min, salary_max, contact_fee, district, address,
    latitude, longitude, geo_status,
    teaching_type, requirements, source, raw_content, status, contact_status,
    archived_at
) VALUES (
    'ORD20250612005',
    '长宁中山公园 - 小三语文',
    '语文',
    '小学',
    '小三',
    150,
    180,
    200,
    '长宁区',
    '中山公园长宁路',
    31.2215,
    121.4205,
    'success',
    '上门',
    '有小学语文教学经验，帮助孩子提高阅读写作',
    '微信群-长宁家教',
    '【长宁家教】
小三语文
150-180元/小时
周末
有小学语文教学经验',
    'closed',
    'completed',
    NOW() - INTERVAL '7 days'
);