export interface Coordinate {
  lat: number;
  lng: number;
}

export interface Order {
  id: string;
  orderId?: string;
  order_no?: string;
  district: string;
  grade: string;
  gradeDetail?: string;
  subject: string;
  coordinate: Coordinate;
  studentDesc: string;
  studentDetail: string;
  frequency: string;
  address: string;
  requirements: string;
  price: number;
  priceMin?: number;
  priceMax?: number;
  priceText: string;
  isHighPrice: boolean;
  isOnline: boolean;
  isCollegeStudent: boolean;
  isNegotiable: boolean;
  contactTeacher: string;
  publishTime: string;
  rawContent: string;
  originalBlock?: string;
  idLine: string;
  title?: string;
  education_stage?: string;
  educationStage?: string;
  teaching_type?: string;
  teachingType?: string;
  salary_min?: number;
  salary_max?: number;
  salaryText?: string;
  hourlyRate?: number;
  geoStatus?: string;
  status?: string;
  publishedAt?: string;
  archivedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  viewCount?: number;
  contactStatus?: string;
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
  grades: string[];
  subjects: string[];
  searchKeyword: string;
  isOnline: boolean;
  isCollegeStudent: boolean;
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

export interface DraftOrder extends Order {
  warnings: {
    grade?: boolean;
    subject?: boolean;
    address?: boolean;
    salary?: boolean;
    frequency?: boolean;
  };
}