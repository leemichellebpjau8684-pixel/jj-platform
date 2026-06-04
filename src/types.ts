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
  price: number; // hourly rate
  isHighPrice: boolean;
  isOnline: boolean;
  isCollegeStudent: boolean;
  isNegotiable: boolean; // unpriced orders "包含未报价"
  contactTeacher: string;
  publishTime: string;
}

export interface Landmark {
  id: string;
  name: string;
  address: string;
  coordinate: Coordinate;
  type: 'university' | 'gps' | 'custom';
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
  genderRequirement: 'all' | 'male' | 'female';
  gradeLevel: 'all' | 'primary' | 'middle' | 'high';
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
