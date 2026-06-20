export interface Coordinate {
  lat: number;
  lng: number;
}

export interface Order {
  id: string;
  orderId?: string; // Original order ID from input (e.g., "2026061609")
  order_no?: string; // Order number stored in database
  district: string;
  grade: string;
  gradeDetail?: string; // Detailed grade info (e.g., "二升三")
  subject: string;
  coordinate: Coordinate;
  studentDesc: string;
  studentDetail: string; // Detailed student profile
  frequency: string;
  address: string;
  requirements: string;
  price: number; // hourly rate (for sorting/comparison)
  priceMin?: number; // Minimum hourly rate
  priceMax?: number; // Maximum hourly rate
  priceText: string; // Original price display text (e.g., "150元/h", "3000元/月")
  isHighPrice: boolean;
  isOnline: boolean;
  isCollegeStudent: boolean;
  isNegotiable: boolean; // unpriced orders "包含未报价"
  contactTeacher: string;
  publishTime: string;
  rawContent: string; // Raw order content without the id line
  idLine: string; // The id line content (e.g., "家教编号：2026060902#暑假7月份开始")
}

export interface Landmark {
  id: string;
  name: string;
  address: string;
  coordinate: Coordinate;
  type: 'university' | 'gps' | 'custom';
  distance?: number; // Distance from current location in kilometers
}

export interface FilterState {
  districts: string[];
  grades: string[];
  subjects: string[];
  searchKeyword: string;
  isOnline: boolean;
  isCollegeStudent: boolean;
  isHighPrice: boolean;
}

export interface AdvancedFilterState {
  maxDistance: number; // in km, default 100
  minHourlyRate: number; // in 元/小时, default 10
  includeUnpriced: boolean; // default false
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
