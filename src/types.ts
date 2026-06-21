export interface Coordinate {
  lat: number;
  lng: number;
}

/**
 * 唯一订单标准 Schema V3
 * 所有页面统一使用此数据结构
 */
export interface Order {
  // 订单编号（唯一）
  orderNo: string;
  
  // 标题
  title: string;
  
  // 学段
  educationStage: '幼儿启蒙' | '小学' | '初中' | '高中' | '成人' | '其他';
  
  // 年级
  grade: string;
  
  // 科目（数组）
  subject: string[];
  
  // 学员描述
  studentDesc: string;
  
  // 教员要求
  requirements: string;
  
  // 地址
  address: string;
  
  // 行政区
  district: string;
  
  // 上课方式
  teachingType: '上门' | '线上' | '均可';
  
  // 上课频次
  frequency: string;
  
  // 薪资原文
  salaryText: string;
  
  // 最低薪资
  salaryMin: number | null;
  
  // 最高薪资
  salaryMax: number | null;
  
  // 标准时薪（用于排序）
  hourlyRate: number | null;
  
  // 高薪标签
  isHighPrice: boolean;
  
  // 原始文本（完整微信原文，禁止截断）
  rawContent: string;
  
  // ===== 以下为系统内部字段，不在规范中但需要保留 =====
  
  // 数据库主键（系统内部）
  id?: string;
  
  // 坐标（地图显示需要）
  coordinate?: Coordinate;
  
  // 地理编码状态
  geoStatus?: string;
  
  // 订单状态（draft/active/closed）
  status?: string;
  
  // 发布时间
  publishedAt?: string;
  
  // 归档时间
  archivedAt?: string;
  
  // 创建时间
  createdAt?: string;
  
  // 更新时间
  updatedAt?: string;
  
  // 浏览次数
  viewCount?: number;
  
  // 联系状态
  contactStatus?: string;
  
  // 订单来源
  source?: string;
}

export interface Landmark {
  id: string;
  name: string;
  address: string;
  coordinate: Coordinate;
  type: 'university' | 'gps' | 'custom';
  distance?: number;
}

export interface FilterState {
  districts: string[];
  educationStages: string[];
  subjects: string[];
  searchKeyword: string;
  teachingType: '上门' | '线上' | '均可' | '';
  isHighPrice: boolean;
}

export interface AdvancedFilterState {
  maxDistance: number;
  minHourlyRate: number;
  includeUnpriced: boolean;
}

export type TravelMode = 'transit' | 'driving' | 'riding' | 'walking';

export interface RouteStep {
  instruction: string;
  distanceText: string;
}

export interface NavigationResult {
  mode: TravelMode;
  distanceKm: number;
  durationMin: number;
  steps: RouteStep[];
}

export interface Feedback {
  id: string;
  content: string;
  submitTime: string;
  isRead: boolean;
}

// ===== 草稿订单类型（智能解析后的临时数据） =====
export interface DraftOrder extends Order {
  // 解析警告标记
  warnings: {
    grade?: boolean;      // 年级未识别
    subject?: boolean;    // 科目未识别
    address?: boolean;    // 地址未识别
    salary?: boolean;     // 薪资未识别
    frequency?: boolean;  // 频次未识别
  };
  
  // 原始编号