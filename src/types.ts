export interface Coordinate {
  lat: number;
  lng: number;
}

export interface Order {
  id: string;
  district: string;
  grade: string;
  subject: string;
  coordinate: Coordinate;
  studentDesc: string;
  studentDetail: string; // Detailed student profile
  frequency: string;
  address: string;
  requirements: string;
  price: number; // hourly rate (for sorting/comparison)
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
