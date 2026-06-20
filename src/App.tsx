import { useState, useMemo, useEffect, useRef } from 'react';
import { 
  MapPin, Search, School, Navigation, X, Check, ArrowLeft, Loader,
  ChevronDown, SlidersHorizontal, Sparkles, DollarSign, Clock, Compass, 
  User, Map, ListFilter, Copy, RotateCcw, Info, ExternalLink, Eye, 
  Volume2, CheckCircle2, ChevronRight, Phone, BookOpen, HelpCircle,
  Heart, Star, Trash2, Filter, ArrowUpDown, MessageSquare, AlertTriangle
} from 'lucide-react';

import { Order, Landmark, FilterState, AdvancedFilterState, TravelMode, NavigationResult, Feedback } from './types';
import { SHANGHAI_DISTRICTS, GRADES, SUBJECTS, SHANGHAI_UNIVERSITIES, SEED_ORDERS } from './data';
import { getDistance } from './utils';
import { loadAMapScript, planRoute } from './services/amap';
import LandmarkModal from './components/LandmarkModal';
import ShanghaiRadarMap from './components/ShanghaiRadarMap';
import AdminDashboard from './components/AdminDashboard';
import { api } from './services/api';

// 从raw_content中提取订单编号
function extractOrderNo(rawContent: string | undefined): string {
  if (!rawContent) return '';
  // 匹配 JJ + 8位数字 或 纯数字编号
  const match = rawContent.match(/(?:家教编号[：:]\s*)?([A-Z]{2}\d{8}|\d{8,})/i);
  if (match) {
    return match[1].toUpperCase();
  }
  return '';
}

export default function App() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiOrders = await api.getOrders();
        
        // 上海各区中心坐标
        const DISTRICT_CENTERS: Record<string, { lat: number; lng: number }> = {
          '黄浦区': { lat: 31.2284, lng: 121.4821 },
          '徐汇区': { lat: 31.1895, lng: 121.4325 },
          '长宁区': { lat: 31.2155, lng: 121.4245 },
          '静安区': { lat: 31.2484, lng: 121.4421 },
          '普陀区': { lat: 31.2572, lng: 121.3972 },
          '虹口区': { lat: 31.2721, lng: 121.4912 },
          '杨浦区': { lat: 31.2942, lng: 121.5236 },
          '闵行区': { lat: 31.0858, lng: 121.4007 },
          '宝山区': { lat: 31.3655, lng: 121.4112 },
          '嘉定区': { lat: 31.3825, lng: 121.2655 },
          '浦东新区': { lat: 31.2215, lng: 121.5735 },
          '金山区': { lat: 30.7422, lng: 121.3415 },
          '松江区': { lat: 31.0375, lng: 121.2155 },
          '青浦区': { lat: 31.1505, lng: 121.1245 },
          '奉贤区': { lat: 30.9185, lng: 121.4745 },
          '崇明区': { lat: 31.6225, lng: 121.3975 },
          '线上': { lat: 31.2304, lng: 121.4737 }
        };
        
        const transformedOrders: Order[] = apiOrders.map((order: any) => {
          // 根据行政区设置坐标，如果数据库有坐标则使用数据库的，否则使用行政区中心坐标
          const districtCoord = DISTRICT_CENTERS[order.district] || { lat: 31.2304, lng: 121.4737 };
          const finalLat = order.latitude || districtCoord.lat;
          const finalLng = order.longitude || districtCoord.lng;
          
          return {
            id: order.id,
            district: order.district,
            grade: order.education_stage + (order.grade_detail ? ` ${order.grade_detail}` : ''),
            subject: order.subject,
            coordinate: {
              lat: finalLat,
              lng: finalLng
            },
            studentDesc: order.requirements || order.title || '学员信息待完善',
            studentDetail: order.raw_content || order.requirements || '暂无详细信息',
            frequency: '每周2次，每次2小时',
            address: order.address,
            requirements: order.requirements || '男女教员均可',
            price: order.salary_max || order.salary_min || 0,
            priceText: order.salary_min && order.salary_max 
              ? (order.salary_min === order.salary_max 
                  ? `${order.salary_min}/h` 
                  : `${order.salary_min}-${order.salary_max}/h`) 
              : (order.salary_min ? `${order.salary_min}/h` : '面议'),
            isHighPrice: (order.salary_max || order.salary_min || 0) >= 120,
            isOnline: order.teaching_type === '网课',
            isCollegeStudent: true,
            isNegotiable: !order.salary_min && !order.salary_max,
            contactTeacher: 'Ken06103',
            publishTime: order.published_at || order.created_at || new Date().toISOString(),
            rawContent: order.raw_content || '',
            idLine: `家教编号：${order.order_no || extractOrderNo(order.raw_content)}`
          };
        });
        setOrders(transformedOrders);
      } catch (err: any) {
        console.error('加载订单失败:', err);
        setError(err.message || '加载订单失败，请刷新页面重试');
        setOrders(SEED_ORDERS);
      } finally {
        setLoading(false);
      }
    };
    loadOrders();
  }, []);

  const [drafts, setDrafts] = useState<Order[]>(() => {
    try {
      const cached = localStorage.getItem('jiajiao_draft_json');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {}
    return [
      {
        id: 'DRAFT-2026-001',
        district: '静安区',
        grade: '初中',
        subject: '英语',
        coordinate: { lat: 31.2484, lng: 121.4421 },
        address: '江宁路418弄小区',
        studentDesc: '初二男生，英语词汇匮乏，语法薄弱，期中考试成绩不及格。急需耐心老师辅导。',
        studentDetail: '上门辅导，主要辅导寒假作业及基础阅读理解。每周2次，每次2小时。',
        frequency: '每周2次，每次2小时间',
        requirements: '男女教员均可，要求英语CET-6通过，有静安周边家教经验优先。',
        price: 130,
        isHighPrice: true,
        isOnline: false,
        isCollegeStudent: true,
        isNegotiable: false,
        contactTeacher: 'Ken06103',
        publishTime: '2026-06-04 10:00:23',
        rawContent: '学员地址：静安区江宁路418弄小区\n学员情况：初二男生，英语词汇匮乏，语法薄弱，期中考试成绩不及格。急需耐心老师辅导。\n时间安排：每周2次，每次2小时\n教员要求：男女教员均可，要求英语CET-6通过，有静安周边家教经验优先。\n老师薪水：130元/小时',
        idLine: '家教编号：DRAFT-2026-001'
      },
      {
        id: 'DRAFT-2026-002',
        district: '浦东新区',
        grade: '小学',
        subject: '数学',
        coordinate: { lat: 31.2215, lng: 121.5735 },
        address: '张江碧波路635号',
        studentDesc: '三年级小男生，数学口算略慢，学校教学之外期望进行一定的思维拓展（奥数启蒙）。',
        studentDetail: '要求大学生教员亲和力好，擅长互动式教学，激发学习积极性。',
        frequency: '每周1-2次，周六下午或周日上午',
        requirements: '仅限重点大学学生（复旦/交大/同济优先），沟通表达能力强。',
        price: 100,
        isHighPrice: false,
        isOnline: false,
        isCollegeStudent: true,
        isNegotiable: false,
        contactTeacher: 'Ken06103',
        publishTime: '2026-06-04 10:15:45',
        rawContent: '学员地址：浦东新区张江碧波路635号\n学员情况：三年级小男生，数学口算略慢，学校教学之外期望进行一定的思维拓展（奥数启蒙）。\n时间安排：每周1-2次，周六下午或周日上午\n教员要求：仅限重点大学学生（复旦/交大/同济优先），沟通表达能力强。\n老师薪水：100元/小时',
        idLine: '家教编号：DRAFT-2026-002'
      }
    ];
  });

  const [archives, setArchives] = useState<Order[]>(() => {
    try {
      const cached = localStorage.getItem('jiajiao_archive_json');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {}
    return [
      {
        id: 'ARCHIVE-2026-001',
        district: '普陀区',
        grade: '高中',
        subject: '物理',
        coordinate: { lat: 31.2572, lng: 121.3972 },
        address: '长寿路常德路口临近小区',
        studentDesc: '高三物理，力学、电磁学重难点复习。高考冲刺复习。',
        studentDetail: '已于5月底由交大物理专业老师成功接单，反馈极为良好，成绩提升显著，顺利完成阶段性授课。',
        frequency: '每周2次',
        requirements: '物理学专业师范生或重点院校强基计划学生。',
        price: 150,
        isHighPrice: true,
        isOnline: false,
        isCollegeStudent: false,
        isNegotiable: false,
        contactTeacher: 'Ken06103',
        publishTime: '2026-05-15 14:00:00',
        rawContent: '学员地址：普陀区长寿路常德路口临近小区\n学员情况：高三物理，力学、电磁学重难点复习。高考冲刺复习。\n时间安排：每周2次\n教员要求：物理学专业师范生或重点院校强基计划学生。\n老师薪水：150元/小时',
        idLine: '家教编号：ARCHIVE-2026-001'
      }
    ];
  });

  const [stats, setStats] = useState(() => {
    try {
      const cached = localStorage.getItem('jiajiao_stat_json');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {}
    return {
      todayAdded: 15,
      totalOrders: SEED_ORDERS.length,
      lastUpdated: '2026-06-04 11:00:53'
    };
  });

  // Routing State Managers supporting nested paths & hash redirects
  const [currentPath, setCurrentPath] = useState(() => {
    const initPath = window.location.pathname || '/';
    const initHash = window.location.hash || '';
    if (initHash === '#/admin' || initHash === '#admin') {
      return '/admin';
    }
    return initPath;
  });

  useEffect(() => {
    const handleLocationChange = () => {
      const initPath = window.location.pathname || '/';
      const initHash = window.location.hash || '';
      if (initHash === '#/admin' || initHash === '#admin') {
        setCurrentPath('/admin');
      } else {
        setCurrentPath(initPath);
      }
    };
    
    const handleOpenOrderDetail = (e: any) => {
      const { orderId } = e.detail;
      setSelectedOrderId(orderId);
      setActiveTab('list');
      setTimeout(() => {
        const orderCard = document.getElementById(`order-card-${orderId}`);
        if (orderCard) {
          orderCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 100);
    };
    
    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('open-order-detail', handleOpenOrderDetail);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('open-order-detail', handleOpenOrderDetail);
    };
  }, []);

  useEffect(() => {
    const handleOpenWeChatModal = (e: any) => {
      const orderId = e.detail?.orderId;
      if (orderId) {
        setSelectedOrderId(orderId);
        setIsWeChatModalOpen(true);
      }
    };
    window.addEventListener('open-wechat-modal', handleOpenWeChatModal);
    return () => {
      window.removeEventListener('open-wechat-modal', handleOpenWeChatModal);
    };
  }, []);

  const navigateTo = (path: string) => {
    if (path === '/admin') {
      window.location.hash = '#/admin';
    } else {
      window.location.hash = '';
      window.history.pushState(null, '', path);
    }
    setCurrentPath(path);
  };

  useEffect(() => {
    if (orders.length > 0) {
      const latestOrder = orders.reduce((latest, current) => {
        const latestTime = new Date(latest.publishTime).getTime();
        const currentTime = new Date(current.publishTime).getTime();
        return currentTime > latestTime ? current : latest;
      });
      setStats((prev: any) => ({
        ...prev,
        totalOrders: orders.length,
        lastUpdated: new Date(latestOrder.publishTime).toLocaleString('zh-CN')
      }));
    } else {
      setStats((prev: any) => ({
        ...prev,
        totalOrders: 0,
        lastUpdated: '暂无数据'
      }));
    }
  }, [orders]);

  useEffect(() => {
    localStorage.setItem('jiajiao_draft_json', JSON.stringify(drafts));
  }, [drafts]);

  useEffect(() => {
    localStorage.setItem('jiajiao_archive_json', JSON.stringify(archives));
  }, [archives]);

  const [feedbacks, setFeedbacks] = useState<Feedback[]>(() => {
    try {
      const cached = localStorage.getItem('jiajiao_feedback_json');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    localStorage.setItem('jiajiao_feedback_json', JSON.stringify(feedbacks));
  }, [feedbacks]);

  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [feedbackLimitAlert, setFeedbackLimitAlert] = useState(false);
  const [feedbackSuccessAlert, setFeedbackSuccessAlert] = useState(false);

  const MAX_FEEDBACK_COUNT = 3;

  const submitFeedback = () => {
    if (!feedbackContent.trim()) return;
    
    // 检查是否超过反馈限制
    if (feedbacks.length >= MAX_FEEDBACK_COUNT) {
      setFeedbackLimitAlert(true);
      setTimeout(() => setFeedbackLimitAlert(false), 3000);
      return;
    }
    
    const newFeedback: Feedback = {
      id: `FEEDBACK-${Date.now()}`,
      content: feedbackContent.trim(),
      submitTime: new Date().toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }),
      isRead: false
    };
    
    setFeedbacks(prev => [...prev, newFeedback]);
    setFeedbackContent('');
    setIsFeedbackModalOpen(false);
    setFeedbackSuccessAlert(true);
    setTimeout(() => setFeedbackSuccessAlert(false), 3000);
  };

  const markFeedbackAsRead = (feedbackId: string) => {
    setFeedbacks(prev => prev.map(f => f.id === feedbackId ? { ...f, isRead: true } : f));
  };

  const deleteFeedback = (feedbackId: string) => {
    setFeedbacks(prev => prev.filter(f => f.id !== feedbackId));
  };

  const [currentLandmark, setCurrentLandmark] = useState<Landmark | null>(() => {
    try {
      const cached = localStorage.getItem('jiajiao_current_landmark');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.error('Failed to parse cached landmark:', e);
    }
    // 不再预设默认地标，让用户首次使用时自行设置
    return null;
  });

  // Keep persistent state of bound landmark
  useEffect(() => {
    if (currentLandmark) {
      localStorage.setItem('jiajiao_current_landmark', JSON.stringify(currentLandmark));
    }
  }, [currentLandmark]);

  const [activeTab, setActiveTab] = useState<'list' | 'map' | 'favorites'>('list'); // 'list' = "找家教", 'map' = "附近家教", 'favorites' = "我的"
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const prevActiveTabRef = useRef<string>(activeTab);

  // Pagination state
  const [listPage, setListPage] = useState(1);
  const [favoritesPage, setFavoritesPage] = useState(1);
  const ORDERS_PER_PAGE = 10;
  const FAVORITES_PER_PAGE = 10;

  // Favorites management - store complete order data
  const [favoriteOrdersData, setFavoriteOrdersData] = useState<Order[]>(() => {
    try {
      const cached = localStorage.getItem('jiajiao_favorites_data');
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (e) {}
    return [];
  });

  // Persist favorites to localStorage
  useEffect(() => {
    localStorage.setItem('jiajiao_favorites_data', JSON.stringify(favoriteOrdersData));
  }, [favoriteOrdersData]);

  // Reset pagination when tab changes
  useEffect(() => {
    if (activeTab === 'list') {
      setListPage(1);
    } else if (activeTab === 'favorites') {
      setFavoritesPage(1);
    }
  }, [activeTab]);

  // Toggle favorite status - store complete order data
  const toggleFavorite = (order: Order) => {
    setFavoriteOrdersData(prev => {
      const exists = prev.find(o => o.id === order.id);
      if (exists) {
        return prev.filter(o => o.id !== order.id);
      } else {
        return [...prev, order];
      }
    });
  };

  // Check if order is favorited
  const isFavorited = (orderId: string) => favoriteOrdersData.some(o => o.id === orderId);

  // Get favorited orders - use stored data directly
  const favoriteOrders = useMemo(() => {
    return favoriteOrdersData;
  }, [favoriteOrdersData]);

  // Get favorite IDs for display
  const favoriteIds = useMemo(() => {
    return favoriteOrdersData.map(o => o.id);
  }, [favoriteOrdersData]);

  // Clear selected order when switching to favorites tab to prevent auto-opening modal
  useEffect(() => {
    if (prevActiveTabRef.current !== 'favorites' && activeTab === 'favorites') {
      setSelectedOrderId(null);
    }
    prevActiveTabRef.current = activeTab;
  }, [activeTab]);

  // Geocode all order addresses upon startup to match Shanghai's precise coordinates
  useEffect(() => {
    loadAMapScript()
      .then(() => {
        const AMap = (window as any).AMap;
        if (AMap) {
          AMap.plugin('AMap.Geocoder', () => {
            const geocoder = new AMap.Geocoder({ city: '上海市' });
            orders.forEach((order) => {
              const fullAddress = order.address.startsWith('上海') 
                ? order.address 
                : `上海市${order.district}${order.address}`;
                
              geocoder.getLocation(fullAddress, (status: string, result: any) => {
                if (status === 'complete' && result.geocodes && result.geocodes.length > 0) {
                  const matchedLoc = result.geocodes[0].location;
                  setOrders((prev) => 
                    prev.map((o) => 
                      o.id === order.id 
                        ? { ...o, coordinate: { lat: matchedLoc.getLat(), lng: matchedLoc.getLng() } }
                        : o
                    )
                  );
                }
              });
            });
          });
        }
      })
      .catch((err) => {
        console.error('AMap load during app setup failed:', err);
      });
  }, []);

  // Filter States
  const [tempDistricts, setTempDistricts] = useState<string[]>([]);
  const [selectedDistricts, setSelectedDistricts] = useState<string[]>([]);
  const [isDistrictDropdownOpen, setIsDistrictDropdownOpen] = useState(false);

  const [tempGrades, setTempGrades] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [isGradeDropdownOpen, setIsGradeDropdownOpen] = useState(false);

  const [tempSubjects, setTempSubjects] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [isSubjectDropdownOpen, setIsSubjectDropdownOpen] = useState(false);

  // Keyword query
  const [searchQuery, setSearchQuery] = useState('');
  const [appliedSearchQuery, setAppliedSearchQuery] = useState('');
  
  // Quick Switch Tags
  const [tagOnline, setTagOnline] = useState(false);
  const [tagCollege, setTagCollege] = useState(false);
  const [tagHighPrice, setTagHighPrice] = useState(false);

  // Advanced Filter state modal toggler
  const [isAdvancedModalOpen, setIsAdvancedModalOpen] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<AdvancedFilterState>({
    maxDistance: 20, // defaults to 20 km search radius as per user story
    minHourlyRate: 10, // default min rate (show all orders by default)
    includeUnpriced: false // hide unpriced (price=0) default
  });

  // Temporary container for advanced filter modifications
  const [tempAdvancedFilters, setTempAdvancedFilters] = useState<AdvancedFilterState>({ ...advancedFilters });
  const [advancedInputErrors, setAdvancedInputErrors] = useState<{ maxDistance?: string; minHourlyRate?: string }>({});

  // Sort mode state
  const [sortMode, setSortMode] = useState<'distance' | 'price'>('distance');

  // Landmark Selection Modal toggler
  const [isLandmarkModalOpen, setIsLandmarkModalOpen] = useState(false);

  // Navigation panel state
  const [isNavigating, setIsNavigating] = useState(false);
  const [navTravelMode, setNavTravelMode] = useState<TravelMode>('transit');
  const [navigationPath, setNavigationPath] = useState<NavigationResult | null>(null);

  // WeChat contact modal states
  const [isWeChatModalOpen, setIsWeChatModalOpen] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);
  const [isQRCodeLoaded, setIsQRCodeLoaded] = useState(false);
  
  // Mobile order detail modal state
  const [isMobileDetailModalOpen, setIsMobileDetailModalOpen] = useState(false);

  // Map settings state (panning/zooming offsets on our rich visual vector map)
  const [mapScale, setMapScale] = useState(1.1);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [hoveredMapOrder, setHoveredMapOrder] = useState<Order | null>(null);
  const [selectedMapOrder, setSelectedMapOrder] = useState<Order | null>(null);

  // Notification Banner
  const [announcement, setAnnouncement] = useState('【置顶通知】上海教员暑期招聘季正式拉开帷幕，请尽快绑定常用高校地标，就近匹配时薪120+的高端家教订单。客服WX: Ken06103');

  // Multi-term space-splitted smart search
  const queryTerms = useMemo(() => {
    return appliedSearchQuery.trim().toLowerCase().split(/\s+/).filter(Boolean);
  }, [appliedSearchQuery]);

  // Compute final orders pool combining baseline filters + advanced criteria
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. District multi-select logic
      if (selectedDistricts.length > 0 && !selectedDistricts.includes(order.district)) {
        return false;
      }

      // 2. Grade multi-select logic
      if (selectedGrades.length > 0 && !selectedGrades.includes(order.grade)) {
        return false;
      }

      // 3. Subject multi-select logic - using contains match for combined subjects
      if (selectedSubjects.length > 0) {
        const matchesAnySubject = selectedSubjects.some(
          selected => order.subject.includes(selected)
        );
        if (!matchesAnySubject) {
          return false;
        }
      }

      // 4. Quick tags checks
      if (tagOnline && !order.isOnline) return false;
      if (tagCollege && !order.isCollegeStudent) return false;
      if (tagHighPrice && order.price < 120 && !order.isNegotiable) return false;

      // 5. Keyword combination fuzz matching (fuzzy matches against address, district, grade, subject, descriptions, requirements)
      if (queryTerms.length > 0) {
        const targetString = `${order.district} ${order.grade} ${order.subject} ${order.address} ${order.requirements} ${order.studentDesc} ${order.studentDetail} ${order.contactTeacher}`.toLowerCase();
        const matchesAll = queryTerms.every(term => targetString.includes(term));
        if (!matchesAll) return false;
      }

      // 6. Advanced filters integration
      // Price Threshold rules
      if (order.isNegotiable) {
        if (!advancedFilters.includeUnpriced) {
          return false; // hide unpriced orders if toggle is off
        }
      } else {
        // checks minimum rate
        if (order.price < advancedFilters.minHourlyRate) {
          return false;
        }
      }

      // Radial Commute check (if landmark is bound and order is offline)
      if (currentLandmark && !order.isOnline) {
        const km = getDistance(
          currentLandmark.coordinate.lat,
          currentLandmark.coordinate.lng,
          order.coordinate.lat,
          order.coordinate.lng
        );
        if (km > advancedFilters.maxDistance) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (sortMode === 'price') {
        // Sort by hourly rate high to low
        const priceA = a.isNegotiable ? 0 : a.price;
        const priceB = b.isNegotiable ? 0 : b.price;
        return priceB - priceA;
      }
      // Sort by distance (default) - nearest first if landmark is defined
      if (currentLandmark) {
        const distA = a.isOnline ? 0 : getDistance(currentLandmark.coordinate.lat, currentLandmark.coordinate.lng, a.coordinate.lat, a.coordinate.lng);
        const distB = b.isOnline ? 0 : getDistance(currentLandmark.coordinate.lat, currentLandmark.coordinate.lng, b.coordinate.lat, b.coordinate.lng);
        return distA - distB;
      }
      return 0; // retain database natural seed ordering
    });
  }, [orders, selectedDistricts, selectedGrades, selectedSubjects, tagOnline, tagCollege, tagHighPrice, queryTerms, advancedFilters, currentLandmark, sortMode]);

  // Paginated orders for list tab
  const paginatedOrders = useMemo(() => {
    const start = (listPage - 1) * ORDERS_PER_PAGE;
    return filteredOrders.slice(start, start + ORDERS_PER_PAGE);
  }, [filteredOrders, listPage]);

  // Paginated favorites for favorites tab
  const paginatedFavorites = useMemo(() => {
    const start = (favoritesPage - 1) * FAVORITES_PER_PAGE;
    return favoriteOrdersData.slice(start, start + FAVORITES_PER_PAGE);
  }, [favoriteOrdersData, favoritesPage]);

  const totalListPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE);
  const totalFavoritesPages = Math.ceil(favoriteOrdersData.length / FAVORITES_PER_PAGE);

  // Selected Order object reference - search from both orders and favorites
  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    // First try to find in current orders list
    const orderFromList = orders.find(o => o.id === selectedOrderId);
    if (orderFromList) return orderFromList;
    // If not found in orders, try to find in favorites
    return favoriteOrdersData.find(o => o.id === selectedOrderId) || null;
  }, [selectedOrderId, orders, favoriteOrdersData]);

  // Keep selected order active ID fresh when list changes
  useEffect(() => {
    // Only auto-clear when list becomes empty, don't auto-select first order
    if (filteredOrders.length === 0) {
      setSelectedOrderId(null);
    } else if (selectedOrderId) {
      // If user had selected an order but it's no longer in the list, clear selection
      const containsSelected = filteredOrders.some(o => o.id === selectedOrderId);
      if (!containsSelected) {
        setSelectedOrderId(null);
      }
    }
  }, [filteredOrders, selectedOrderId]);

  // Handle route recalculations dynamically based on transport mode & context selection
  useEffect(() => {
    if (!selectedOrder || !currentLandmark) {
      setNavigationPath(null);
      return;
    }

    planRoute(
      currentLandmark.name,
      currentLandmark.coordinate,
      selectedOrder.address,
      selectedOrder.coordinate,
      navTravelMode
    ).then((result) => {
      setNavigationPath(result);
    }).catch((err) => {
      console.error('Route planning failed:', err);
    });
  }, [selectedOrder, currentLandmark, navTravelMode]);

  // Reset all filters safely back to system defaults
  const handleResetAllFilters = () => {
    setSelectedDistricts([]);
    setSelectedGrades([]);
    setSelectedSubjects([]);
    setTempDistricts([]);
    setTempGrades([]);
    setTempSubjects([]);
    setSearchQuery('');
    setAppliedSearchQuery('');
    setTagOnline(false);
    setTagCollege(false);
    setTagHighPrice(false);
    setAdvancedFilters({
      maxDistance: 100,
      minHourlyRate: 10,
      includeUnpriced: false
    });
    setTempAdvancedFilters({
      maxDistance: 100,
      minHourlyRate: 10,
      includeUnpriced: false
    });
    setAdvancedInputErrors({});
  };

  // District Popover confirms and resets
  const handleDistrictConfirm = () => {
    setSelectedDistricts(tempDistricts);
    setIsDistrictDropdownOpen(false);
  };
  const handleDistrictReset = () => {
    setTempDistricts([]);
    setSelectedDistricts([]);
    setIsDistrictDropdownOpen(false);
  };

  // Grade Popover confirms and resets
  const handleGradeConfirm = () => {
    setSelectedGrades(tempGrades);
    setIsGradeDropdownOpen(false);
  };
  const handleGradeReset = () => {
    setTempGrades([]);
    setSelectedGrades([]);
    setIsGradeDropdownOpen(false);
  };

  // Subject Popover confirms and resets
  const handleSubjectConfirm = () => {
    setSelectedSubjects(tempSubjects);
    setIsSubjectDropdownOpen(false);
  };
  const handleSubjectReset = () => {
    setTempSubjects([]);
    setSelectedSubjects([]);
    setIsSubjectDropdownOpen(false);
  };

  // Trigger Advanced settings popup & copy parameters
  const handleOpenAdvancedModal = () => {
    setTempAdvancedFilters({ ...advancedFilters });
    setAdvancedInputErrors({});
    setIsAdvancedModalOpen(true);
  };

  // Handle validating inputs in advanced configurations
  const handleAdvancedApply = () => {
    const errors: { maxDistance?: string; minHourlyRate?: string } = {};

    // Validate integer distance
    const distStr = String(tempAdvancedFilters.maxDistance).trim();
    if (!/^\d+$/.test(distStr)) {
      errors.maxDistance = '搜索半径必须为正整数';
    } else {
      const parsedDist = parseInt(distStr, 10);
      if (parsedDist <= 0) {
        errors.maxDistance = '距离半径必须大于0';
      }
    }

    // Validate minimum price >= 1
    const priceStr = String(tempAdvancedFilters.minHourlyRate).trim();
    const parsedPrice = parseFloat(priceStr);
    if (isNaN(parsedPrice) || parsedPrice < 1) {
      errors.minHourlyRate = '薪资起步单价必须大于等于1元/小时';
    }

    if (Object.keys(errors).length > 0) {
      setAdvancedInputErrors(errors);
      return;
    }

    // Assign back valid numbers
    setAdvancedFilters({
      ...tempAdvancedFilters,
      maxDistance: parseInt(distStr, 10),
      minHourlyRate: Math.round(parsedPrice)
    });
    setIsAdvancedModalOpen(false);
  };

  // Toggle singular district
  const toggleTempDistrict = (d: string) => {
    if (tempDistricts.includes(d)) {
      setTempDistricts(tempDistricts.filter(item => item !== d));
    } else {
      setTempDistricts([...tempDistricts, d]);
    }
  };

  // Toggle singular grade
  const toggleTempGrade = (g: string) => {
    if (tempGrades.includes(g)) {
      setTempGrades(tempGrades.filter(item => item !== g));
    } else {
      setTempGrades([...tempGrades, g]);
    }
  };

  // Toggle singular subject
  const toggleTempSubject = (s: string) => {
    if (tempSubjects.includes(s)) {
      setTempSubjects(tempSubjects.filter(item => item !== s));
    } else {
      setTempSubjects([...tempSubjects, s]);
    }
  };

  // Quick WeChat copiers
  const handleCopyWeChatID = () => {
    navigator.clipboard.writeText('Ken06103');
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  // Custom administrative projection for Interactive Vector SVG Shanghai Map
  // Range of seed data boundaries (approx min/max)
  const mapConfig = {
    minLat: 30.98,
    maxLat: 31.38,
    minLng: 121.15,
    maxLng: 121.65,
    width: 620,
    height: 520
  };

  const getXY = (lat: number, lng: number) => {
    const x = ((lng - mapConfig.minLng) / (mapConfig.maxLng - mapConfig.minLng)) * mapConfig.width;
    // Invert Y axis for screen space
    const y = mapConfig.height - ((lat - mapConfig.minLat) / (mapConfig.maxLat - mapConfig.minLat)) * mapConfig.height;
    return { x, y };
  };

  // Shanghai administrative vector centers
  const SHANGHAI_DISTRICTS_COORDS = [
    { name: '黄浦区', lat: 31.2284, lng: 121.4821, size: 28 },
    { name: '徐汇区', lat: 31.1895, lng: 121.4325, size: 36 },
    { name: '杨浦区', lat: 31.2942, lng: 121.5236, size: 40 },
    { name: '静安区', lat: 31.2484, lng: 121.4421, size: 30 },
    { name: '普陀区', lat: 31.2572, lng: 121.3972, size: 34 },
    { name: '虹口区', lat: 31.2721, lng: 121.4912, size: 28 },
    { name: '闵行区', lat: 31.0858, lng: 121.4007, size: 75 },
    { name: '宝山区', lat: 31.3655, lng: 121.4112, size: 68 },
    { name: '松江区', lat: 31.0375, lng: 121.2155, size: 85 },
    { name: '浦东新区', lat: 31.2215, lng: 121.5735, size: 98 }
  ];

  // Path generator for standard winding coordinates of mock Huangpu River visually cutting Pudong/Puxi!
  const riverPoints = [
    { lat: 30.98, lng: 121.38 },
    { lat: 31.02, lng: 121.42 },
    { lat: 31.06, lng: 121.45 },
    { lat: 31.12, lng: 121.46 },
    { lat: 31.17, lng: 121.44 },
    { lat: 31.20, lng: 121.47 },
    { lat: 31.23, lng: 121.492 }, // Bund curve
    { lat: 31.24, lng: 121.51 },
    { lat: 31.27, lng: 121.54 },
    { lat: 31.33, lng: 121.57 },
    { lat: 31.38, lng: 121.60 }
  ];

  const riverSvgPath = useMemo(() => {
    if (riverPoints.length === 0) return '';
    const start = getXY(riverPoints[0].lat, riverPoints[0].lng);
    let d = `M ${start.x} ${start.y}`;
    for (let i = 1; i < riverPoints.length; i++) {
      const pt = getXY(riverPoints[i].lat, riverPoints[i].lng);
      d += ` L ${pt.x} ${pt.y}`;
    }
    return d;
  }, []);

  if (currentPath === '/admin') {
    return (
      <AdminDashboard
        orders={orders}
        setOrders={setOrders}
        drafts={drafts}
        setDrafts={setDrafts}
        archives={archives}
        setArchives={setArchives}
        stats={stats}
        setStats={setStats}
        onBackToUser={() => navigateTo('/')}
        feedbacks={feedbacks}
        markFeedbackAsRead={markFeedbackAsRead}
        deleteFeedback={deleteFeedback}
      />
    );
  }

  return (
    <div className="w-full h-screen md:w-[1024px] md:h-[768px] bg-[#F8F9FA] flex flex-col font-sans overflow-hidden text-[#1A1A1A] relative select-none mx-auto">
      


      {/* PC Header */}
      <header className="hidden md:block h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 md:px-6 shrink-0 z-20 shadow-sm">
        <div id="company-logo-group" className="flex items-center gap-2 shrink-0">
          <div className="w-8 h-8 bg-orange-500 rounded-md flex items-center justify-center text-white font-bold text-base tracking-wider shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
        </div>

        {/* Announcement sliding wire - PC only */}
        <div className="flex-1 max-w-[280px] mx-4 overflow-hidden bg-orange-50/50 border border-orange-100/40 px-2 py-0.5 rounded flex items-center gap-1">
          <Volume2 className="w-3 h-3 text-orange-600 shrink-0" />
          <div className="text-[10px] text-orange-850 font-medium truncate">
            {announcement}
          </div>
        </div>

      </header>

      {/* 3. Welcome Banner - PC only */}
      <div className="hidden md:block bg-gradient-to-r from-orange-100 via-orange-50 to-amber-50 px-6 py-4 relative overflow-hidden rounded-2xl shadow-sm m-4 border border-orange-200/30">
        {/* Location button - Top Left */}
        <button className="absolute top-3 left-3 w-12 h-12 bg-orange-500 rounded-full shadow-md flex items-center justify-center ring-2 ring-white hover:bg-orange-600 transition-colors" onClick={() => setIsLandmarkModalOpen(true)}>
          <MapPin className="w-6 h-6 text-white" />
        </button>
        {/* Feedback button - Top Right (symmetric with location button) */}
        <div className="absolute top-3 right-3 flex flex-col items-center">
          <button className="w-12 h-12 bg-blue-500 rounded-full shadow-md flex items-center justify-center ring-2 ring-white hover:bg-blue-600 transition-colors" onClick={() => setIsFeedbackModalOpen(true)}>
            <MessageSquare className="w-6 h-6 text-white" />
          </button>
          {/* Speech bubble tooltip */}
          <div className="relative mt-1">
            <div className="bg-orange-500 text-white text-[10px] font-bold px-2.5 py-1.5 rounded-full shadow-lg text-center max-w-[70px]">
              点我反馈宝贵建议~
            </div>
            <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-orange-500"></div>
          </div>
        </div>
        {/* Text content - centered */}
        <div className="relative text-center">
          <p className="text-red-600 text-sm font-bold leading-relaxed mb-1">
            欢迎使用家教订单查询系统（点击小红心，体验收藏心仪家教新功能~）
          </p>
          <p className="text-gray-700 text-xs leading-relaxed mb-2">
            来到本平台，您将能够：
          </p>
          <div className="flex justify-center gap-2 mb-2">
            <span className="bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-semibold">按薪资、距离选单</span>
            <span className="bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-semibold">地标选定</span>
            <span className="bg-orange-500 text-white text-xs px-3 py-1 rounded-full font-semibold">5秒速推</span>
          </div>
          <p className="text-gray-500 text-xs">
            点击"左上角" <span className="inline-flex w-5 h-5 bg-orange-500 rounded-full items-center justify-center ring-1 ring-white"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle></svg></span> 确认老师位置开始体验5秒找到心仪单的感觉！
          </p>
        </div>
      </div>

      {/* 3.1 PC Tab Navigation */}
      <div className="hidden md:flex gap-2 px-6 mb-4">
        <button
          onClick={() => {
            setActiveTab('list');
            setSelectedMapOrder(null);
          }}
          className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'list'
              ? 'bg-orange-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <ListFilter className="w-4 h-4" />
          找家教
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'map'
              ? 'bg-orange-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Map className="w-4 h-4" />
          附近家教
        </button>
        <button
          onClick={() => {
            setActiveTab('favorites');
            setSelectedOrderId(null);
          }}
          className={`px-5 py-2.5 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${
            activeTab === 'favorites'
              ? 'bg-orange-500 text-white shadow-md'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Heart className="w-4 h-4" />
          我的收藏
          {favoriteIds.length > 0 && (
            <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{favoriteIds.length}</span>
          )}
        </button>
      </div>

      {/* 4. Stats Cards - PC only */}
      <div className="hidden md:flex gap-4 px-6 mb-4">
        <div className="flex-1 bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="text-xs text-gray-400 mb-1">本次查询 / 订单总数</div>
          <div className="text-2xl font-bold text-gray-800 font-mono">{filteredOrders.length} / {stats.totalOrders}</div>
        </div>
        <div className="flex-1 bg-white rounded-xl shadow-sm p-4 border border-gray-100">
          <div className="text-xs text-gray-400 mb-1">最后更新</div>
          <div className="text-lg font-bold text-gray-800 font-mono">{stats.lastUpdated}</div>
        </div>
      </div>

      {/* 5. Main Multi-conditions Filter section */}
      <nav className="hidden md:block bg-white px-6 py-3 border-b border-gray-200 flex flex-col gap-2 shrink-0 z-10 shadow-sm">
        {/* PC Layout: Horizontal */}
        <div className="flex items-center justify-between gap-3">
          
          {/* Dropdown Filters Block */}
          <div className="flex gap-1.5 shrink-0 relative">
            
            {/* DISTRICT DROPDOWN */}
            <div className="relative">
              <button
                id="district-dropdown-trigger"
                onClick={() => {
                  setIsDistrictDropdownOpen(!isDistrictDropdownOpen);
                  setIsGradeDropdownOpen(false);
                  setIsSubjectDropdownOpen(false);
                  setTempDistricts(selectedDistricts);
                }}
                className={`px-4 py-2.5 border rounded text-base flex items-center justify-between gap-1.5 hover:bg-gray-50 font-medium transition-all ${
                  selectedDistricts.length > 0 
                  ? 'border-orange-500 bg-orange-50/30 text-orange-700' 
                  : 'bg-gray-50 border-gray-200 text-gray-700'
                }`}
              >
                <span>{selectedDistricts.length === 0 ? '地区/行政区' : `已选地区(${selectedDistricts.length})`}</span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </button>

              {isDistrictDropdownOpen && (
                <div id="district-dropdown-panel" className="absolute top-8 left-0 w-64 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-40">
                  <div className="flex justify-between items-center mb-2.5 border-b border-gray-100 pb-2">
                    <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tempDistricts.length === SHANGHAI_DISTRICTS.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTempDistricts([...SHANGHAI_DISTRICTS]);
                          } else {
                            setTempDistricts([]);
                          }
                        }}
                        className="rounded text-orange-500 focus:ring-orange-400 border-gray-300 w-3.5 h-3.5"
                      />
                      <span>全选</span>
                    </label>
                    <span className="text-[10px] text-gray-400">上海市行政区划分</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-1.5 max-h-44 overflow-y-auto mb-3">
                    {SHANGHAI_DISTRICTS.map((item) => {
                      const isChecked = tempDistricts.includes(item);
                      return (
                        <button
                          key={item}
                          onClick={() => toggleTempDistrict(item)}
                          className={`py-1.5 text-center rounded text-sm font-sans border transition-all truncate px-1 ${
                            isChecked
                              ? 'bg-orange-500 text-white border-orange-500 font-semibold'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {item.replace('区', '').replace('新区', '')}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-end gap-2 border-t border-gray-100 pt-2.5">
                    <button
                      id="reset-district-btn"
                      onClick={handleDistrictReset}
                      className="px-2.5 py-1 text-[11px] font-semibold text-gray-500 border border-gray-200 hover:bg-gray-50 rounded"
                    >
                      重置
                    </button>
                    <button
                      id="save-district-btn"
                      onClick={handleDistrictConfirm}
                      className="px-3.5 py-1 text-[11px] font-semibold bg-orange-500 text-white rounded hover:bg-orange-600 shadow-sm"
                    >
                      确定
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* GRADE DROPDOWN */}
            <div className="relative">
              <button
                id="grade-dropdown-trigger"
                onClick={() => {
                  setIsGradeDropdownOpen(!isGradeDropdownOpen);
                  setIsDistrictDropdownOpen(false);
                  setIsSubjectDropdownOpen(false);
                  setTempGrades(selectedGrades);
                }}
                className={`px-4 py-2.5 border rounded text-base flex items-center justify-between gap-1.5 hover:bg-gray-50 font-medium transition-all ${
                  selectedGrades.length > 0
                  ? 'border-orange-500 bg-orange-50/30 text-orange-700'
                  : 'bg-gray-50 border-gray-200 text-gray-700'
                }`}
              >
                <span>{selectedGrades.length === 0 ? '授课年级' : `年级(${selectedGrades.length})`}</span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </button>

              {isGradeDropdownOpen && (
                <div id="grade-dropdown-panel" className="absolute top-8 left-0 w-52 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-40">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100">
                    <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tempGrades.length === GRADES.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTempGrades([...GRADES]);
                          } else {
                            setTempGrades([]);
                          }
                        }}
                        className="rounded text-orange-500 focus:ring-orange-400 border-gray-300 w-3.5 h-3.5"
                      />
                      <span>全选</span>
                    </label>
                    <span className="text-[10px] text-gray-400">学段</span>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 mb-3">
                    {GRADES.map((item) => {
                      const isChecked = tempGrades.includes(item);
                      return (
                        <button
                          key={item}
                          onClick={() => toggleTempGrade(item)}
                          className={`py-1 rounded text-[11px] text-center border transition-all ${
                            isChecked
                              ? 'bg-orange-500 text-white border-orange-500 font-semibold'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-end gap-2 border-t border-gray-100 pt-2 text-right">
                    <button
                      onClick={handleGradeReset}
                      className="px-2.5 py-1 text-[11px] text-gray-500 border border-gray-200 hover:bg-gray-50 rounded"
                    >
                      重置
                    </button>
                    <button
                      onClick={handleGradeConfirm}
                      className="px-3.5 py-1 text-[11px] bg-orange-500 text-white rounded hover:bg-orange-600 shadow-sm font-semibold"
                    >
                      确定
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* SUBJECT DROPDOWN */}
            <div className="relative">
              <button
                id="subject-dropdown-trigger"
                onClick={() => {
                  setIsSubjectDropdownOpen(!isSubjectDropdownOpen);
                  setIsDistrictDropdownOpen(false);
                  setIsGradeDropdownOpen(false);
                  setTempSubjects(selectedSubjects);
                }}
                className={`px-4 py-2.5 border rounded text-base flex items-center justify-between gap-1.5 hover:bg-gray-50 font-medium transition-all ${
                  selectedSubjects.length > 0
                  ? 'border-orange-500 bg-orange-50/30 text-orange-700'
                  : 'bg-gray-50 border-gray-200 text-gray-700'
                }`}
              >
                <span>{selectedSubjects.length === 0 ? '科目/类别' : `科目(${selectedSubjects.length})`}</span>
                <ChevronDown className="w-5 h-5 text-gray-400" />
              </button>

              {isSubjectDropdownOpen && (
                <div id="subject-dropdown-panel" className="absolute top-8 left-0 w-64 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-40">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-gray-100">
                    <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tempSubjects.length === SUBJECTS.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTempSubjects([...SUBJECTS]);
                          } else {
                            setTempSubjects([]);
                          }
                        }}
                        className="rounded text-orange-500 focus:ring-orange-400 border-gray-300 w-3.5 h-3.5"
                      />
                      <span>全选</span>
                    </label>
                    <span className="text-[10px] text-gray-400">辅导类别</span>
                  </div>

                  <div className="grid grid-cols-3 gap-1.5 max-h-44 overflow-y-auto mb-3">
                    {SUBJECTS.map((item) => {
                      const isChecked = tempSubjects.includes(item);
                      return (
                        <button
                          key={item}
                          onClick={() => toggleTempSubject(item)}
                          className={`py-1 text-center rounded text-[11px] border transition-all ${
                            isChecked
                              ? 'bg-orange-500 text-white border-orange-500 font-semibold'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-end gap-2 border-t border-gray-100 pt-2">
                    <button
                      onClick={handleSubjectReset}
                      className="px-2.5 py-1 text-[11px] text-gray-500 border border-gray-200 hover:bg-gray-50 rounded"
                    >
                      重置
                    </button>
                    <button
                      onClick={handleSubjectConfirm}
                      className="px-3.5 py-1 text-[11px] bg-orange-500 text-white rounded hover:bg-orange-600 shadow-sm font-semibold"
                    >
                      确定
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Search Box */}
          <div className="flex-1 relative">
            <input
              id="baseline-keyword-search"
              type="text"
              placeholder="可输入地区、年级、科目关键词组合检索 (如: 杨浦 高三 数学)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-gray-100 border-none rounded text-base focus:ring-1.5 focus:ring-orange-500 focus:bg-white text-gray-800 placeholder-gray-400 focus:outline-none transition-all"
            />
            <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 p-0.5 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filter Tags (Rounded Pills) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setTagOnline(!tagOnline)}
              className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all ${
                tagOnline 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              线上
            </button>
            <button
              onClick={() => setTagCollege(!tagCollege)}
              className={`px-4 py-2.5 rounded-full text-sm font-semibold transition-all ${
                tagCollege 
                ? 'bg-orange-500 text-white' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              大学生
            </button>
            <button
              onClick={() => setTagHighPrice(!tagHighPrice)}
              className={`px-4 py-2.5 border rounded-full text-sm font-semibold transition-all flex items-center gap-0.5 whitespace-nowrap ${
                tagHighPrice 
                ? 'bg-orange-500 text-white border-orange-500' 
                : 'bg-orange-50/60 text-orange-600 border border-orange-200 hover:bg-orange-100/60'
              }`}
            >
              <span className="inline-flex items-center gap-0.5">高价单 🔥</span>
            </button>

            {/* Sort Mode Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-500 font-medium">排序方式:</span>
              <select
                value={sortMode}
                onChange={(e) => setSortMode(e.target.value as 'distance' | 'price')}
                className="px-4 py-2.5 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-medium cursor-pointer hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/50 min-w-[120px] max-w-[160px]"
              >
                <option value="distance" className="text-xs">距离近→远</option>
                <option value="price" className="text-xs">时薪高→低</option>
              </select>
            </div>
            
            <button
              id="advanced-filters-trigger"
              onClick={handleOpenAdvancedModal}
              className="px-4.5 py-2.5 bg-gray-800 text-white rounded-full text-sm font-semibold hover:bg-gray-900 transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-sm"
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>高级</span>
            </button>

            {/* General Filter Reset (only shows up when any parameters are dirtied) */}
            {(selectedDistricts.length > 0 || selectedGrades.length > 0 || selectedSubjects.length > 0 || searchQuery || tagOnline || tagCollege || tagHighPrice || advancedFilters.minHourlyRate > 10 || advancedFilters.maxDistance < 100) && (
              <button
                onClick={handleResetAllFilters}
                className="p-1 text-gray-405 hover:text-red-500 transition-colors rounded hover:bg-gray-100"
                title="清空重置全部过滤条件"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

        </div>

        {/* 6. Active Location Binding - PC only */}
        <div className="hidden md:flex items-center justify-between border-t border-gray-100 pt-1.5 mt-0.5 text-[10px] text-gray-500 font-sans">
          <div className="flex items-center gap-2">
            <span className="bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded text-[9px] font-semibold shrink-0 uppercase tracking-wider">首选授课起点</span>
            {currentLandmark ? (
              <div className="flex items-center gap-1 min-w-0">
                <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                <span className="font-semibold text-gray-700 truncate max-w-[280px]">
                  {currentLandmark.name}
                </span>
                <span className="text-gray-400 font-mono truncate max-w-[140px] ml-1">({currentLandmark.address})</span>
              </div>
            ) : (
              <span className="text-red-500 font-semibold">未绑定授课起点，无法测量通勤距离!</span>
            )}
            <button
              id="modify-landmark-anchor-btn"
              onClick={() => setIsLandmarkModalOpen(true)}
              className="text-blue-600 hover:text-blue-800 hover:underline font-bold transition-colors ml-1"
            >
              修改地标
            </button>
          </div>

          <div className="flex items-center gap-3 shrink-0 font-mono text-[9px]">
            <span>搜索半径 (最大直线): <b className="text-gray-800 bg-gray-100 px-1 rounded">{advancedFilters.maxDistance}KM</b></span>
            <span>薪资门槛: <b className="text-gray-800 bg-gray-100 px-1 rounded">&gt;{advancedFilters.minHourlyRate}元/h</b></span>
            {advancedFilters.includeUnpriced ? (
              <span className="bg-green-50 text-green-700 px-1 rounded font-semibold border border-green-150">含未报价</span>
            ) : (
              <span className="text-gray-400">不含未报价</span>
            )}
          </div>
        </div>

        {/* Mobile Layout: Vertical */}
        <div className="md:hidden flex flex-col gap-2">
          {/* Dropdown filters row */}
          <div className="flex gap-1.5 relative flex-wrap">
            {/* DISTRICT DROPDOWN */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsDistrictDropdownOpen(!isDistrictDropdownOpen);
                  setIsGradeDropdownOpen(false);
                  setIsSubjectDropdownOpen(false);
                  setTempDistricts(selectedDistricts);
                }}
                className={`px-3 py-2.5 border rounded text-base flex items-center justify-between gap-1 font-medium ${
                  selectedDistricts.length > 0 
                    ? 'border-orange-500 bg-orange-50/30 text-orange-700' 
                    : 'bg-gray-50 border-gray-200 text-gray-700'
                }`}
              >
                <span>{selectedDistricts.length === 0 ? '地区' : `地区(${selectedDistricts.length})`}</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {isDistrictDropdownOpen && (
                <div className="absolute top-8 left-0 w-64 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-50">
                  <div className="flex justify-between items-center mb-2 border-b border-gray-100 pb-2">
                    <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tempDistricts.length === SHANGHAI_DISTRICTS.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTempDistricts([...SHANGHAI_DISTRICTS]);
                          } else {
                            setTempDistricts([]);
                          }
                        }}
                        className="rounded text-orange-500 focus:ring-orange-400 border-gray-300 w-3.5 h-3.5"
                      />
                      <span>全选</span>
                    </label>
                    <span className="text-sm text-gray-400">上海市行政区</span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-1.5 max-h-44 overflow-y-auto mb-3">
                    {SHANGHAI_DISTRICTS.map((item) => {
                      const isChecked = tempDistricts.includes(item);
                      return (
                        <button
                          key={item}
                          onClick={() => toggleTempDistrict(item)}
                          className={`py-1.5 text-center rounded text-sm font-sans border transition-all truncate px-1 ${
                            isChecked
                              ? 'bg-orange-500 text-white border-orange-500 font-semibold'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {item.replace('区', '').replace('新区', '')}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-end gap-2 border-t border-gray-100 pt-2">
                    <button onClick={handleDistrictReset} className="px-3 py-1.5 text-sm font-semibold text-gray-500 border border-gray-200 rounded">重置</button>
                    <button onClick={handleDistrictConfirm} className="px-4 py-1.5 text-sm font-semibold bg-orange-500 text-white rounded">确定</button>
                  </div>
                </div>
              )}
            </div>

            {/* GRADE DROPDOWN */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsGradeDropdownOpen(!isGradeDropdownOpen);
                  setIsDistrictDropdownOpen(false);
                  setIsSubjectDropdownOpen(false);
                  setTempGrades(selectedGrades);
                }}
                className={`px-3 py-2.5 border rounded text-base flex items-center justify-between gap-1 font-medium ${
                  selectedGrades.length > 0
                    ? 'border-orange-500 bg-orange-50/30 text-orange-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700'
                }`}
              >
                <span>{selectedGrades.length === 0 ? '年级' : `年级(${selectedGrades.length})`}</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {isGradeDropdownOpen && (
                <div className="absolute top-8 left-0 w-52 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-50">
                  <div className="grid grid-cols-2 gap-1.5 mb-3">
                    {GRADES.map((item) => {
                      const isChecked = tempGrades.includes(item);
                      return (
                        <button
                          key={item}
                          onClick={() => toggleTempGrade(item)}
                          className={`py-1 rounded text-[11px] text-center border transition-all ${
                            isChecked
                              ? 'bg-orange-500 text-white border-orange-500 font-semibold'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-end gap-2 border-t border-gray-100 pt-2">
                    <button onClick={handleGradeReset} className="px-2 py-1 text-[11px] text-gray-500 border border-gray-200 rounded">重置</button>
                    <button onClick={handleGradeConfirm} className="px-3 py-1 text-[11px] bg-orange-500 text-white rounded font-semibold">确定</button>
                  </div>
                </div>
              )}
            </div>

            {/* SUBJECT DROPDOWN */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsSubjectDropdownOpen(!isSubjectDropdownOpen);
                  setIsDistrictDropdownOpen(false);
                  setIsGradeDropdownOpen(false);
                  setTempSubjects(selectedSubjects);
                }}
                className={`px-3 py-2.5 border rounded text-base flex items-center justify-between gap-1 font-medium ${
                  selectedSubjects.length > 0
                    ? 'border-orange-500 bg-orange-50/30 text-orange-700'
                    : 'bg-gray-50 border-gray-200 text-gray-700'
                }`}
              >
                <span>{selectedSubjects.length === 0 ? '科目' : `科目(${selectedSubjects.length})`}</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {isSubjectDropdownOpen && (
                <div className="absolute top-8 left-0 w-64 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-50">
                  <div className="grid grid-cols-3 gap-1.5 max-h-44 overflow-y-auto mb-3">
                    {SUBJECTS.map((item) => {
                      const isChecked = tempSubjects.includes(item);
                      return (
                        <button
                          key={item}
                          onClick={() => toggleTempSubject(item)}
                          className={`py-1 text-center rounded text-[11px] border transition-all ${
                            isChecked
                              ? 'bg-orange-500 text-white border-orange-500 font-semibold'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-end gap-2 border-t border-gray-100 pt-2">
                    <button onClick={handleSubjectReset} className="px-2 py-1 text-[11px] text-gray-500 border border-gray-200 rounded">重置</button>
                    <button onClick={handleSubjectConfirm} className="px-3 py-1 text-[11px] bg-orange-500 text-white rounded font-semibold">确定</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

      </nav>

      {/* 7. Main Canvas Split Workspace */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* VIEW 1: REGULAR LIST SPLIT ("找家教") */}
        {activeTab === 'list' ? (
          <div className="flex-1 flex overflow-hidden">
            
            {/* LEFT SIDE: ORDER LISTS - PC 60% width, Mobile full width */}
            <section className="md:w-[60%] md:border-r md:border-gray-200 w-full overflow-y-auto bg-gray-50 flex flex-col gap-2.5 p-3 md:shrink-0 scroll-smooth md:pt-3 pt-3">
              
              {/* Mobile Welcome Banner - scrolls with content */}
              <div className="md:hidden bg-gradient-to-r from-orange-100 via-orange-50 to-amber-50 px-3 py-4 relative overflow-hidden rounded-2xl shadow-sm mb-3 border border-orange-200/30 min-h-[120px] flex items-center justify-center">
                {/* Location button - Top Left */}
                <button className="absolute top-2 left-2 w-10 h-10 bg-orange-500 rounded-full shadow-md flex items-center justify-center ring-2 ring-white hover:bg-orange-600 transition-colors" onClick={() => setIsLandmarkModalOpen(true)}>
                  <MapPin className="w-5 h-5 text-white" />
                </button>
                {/* Feedback button - Top Right (symmetric with location button) */}
                <div className="absolute top-2 right-2 flex flex-col items-center">
                  <button className="w-10 h-10 bg-blue-500 rounded-full shadow-md flex items-center justify-center ring-2 ring-white hover:bg-blue-600 transition-colors" onClick={() => setIsFeedbackModalOpen(true)}>
                    <MessageSquare className="w-5 h-5 text-white" />
                  </button>
                  {/* Speech bubble tooltip */}
                  <div className="relative mt-1">
                    <div className="bg-orange-500 text-white text-[8px] font-bold px-2 py-1 rounded-full shadow-lg text-center max-w-[60px]">
                      点我反馈宝贵建议~
                    </div>
                    <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-3 border-r-3 border-b-3 border-transparent border-b-orange-500"></div>
                  </div>
                </div>
                {/* Text content - centered */}
                <div className="relative text-center">
                  <p className="text-gray-800 text-xs leading-relaxed mb-1.5 font-medium">
                    欢迎使用家教订单查询系统
                  </p>
                  <p className="text-gray-700 text-[10px] leading-relaxed mb-1.5">
                    (点击小红心，体验收藏心仪家教新功能~)
                  </p>
                  <p className="text-gray-700 text-[10px] leading-relaxed mb-1.5">
                    来到本平台，您将能够：
                  </p>
                  <div className="flex justify-center gap-1.5 mb-1.5">
                    <span className="bg-orange-500 text-white text-[9px] px-2.5 py-0.5 rounded-full font-semibold">按薪资、距离选单</span>
                    <span className="bg-orange-500 text-white text-[9px] px-2.5 py-0.5 rounded-full font-semibold">地标选定</span>
                    <span className="bg-orange-500 text-white text-[9px] px-2.5 py-0.5 rounded-full font-semibold">5秒速推</span>
                  </div>
                  <p className="text-gray-600 text-[9px]">
                    点击"左上角" <span className="inline-flex w-4 h-4 bg-orange-500 rounded-full items-center justify-center ring-1 ring-white"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"></path><circle cx="12" cy="10" r="3"></circle></svg></span> 确认老师位置开始体验5秒找到心仪单的感觉！
                  </p>
                </div>
              </div>

              {/* Mobile Stats Cards - scrolls with content */}
              <div className="md:hidden bg-white px-4 py-3 rounded-xl shadow-sm mb-2">
                <div className="flex gap-3">
                  <div className="flex-1 bg-gray-50 rounded-lg p-3">
                    <div className="text-[10px] text-gray-400 mb-1">本次查询 / 订单总数</div>
                    <div className="text-lg font-bold text-gray-800 font-mono">{filteredOrders.length} / {stats.totalOrders}</div>
                  </div>
                  <div className="flex-1 bg-gray-50 rounded-lg p-3">
                    <div className="text-[10px] text-gray-400 mb-1">最后更新</div>
                    <div className="text-sm font-bold text-gray-800 font-mono">{stats.lastUpdated}</div>
                  </div>
                </div>
              </div>

              {/* Mobile Filter Bar - scrolls with content */}
              <div className="md:hidden bg-white px-4 py-3 rounded-xl shadow-sm mb-2 space-y-3">
                {/* Dropdowns */}
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setIsDistrictDropdownOpen(!isDistrictDropdownOpen);
                      setIsGradeDropdownOpen(false);
                      setIsSubjectDropdownOpen(false);
                      setTempDistricts(selectedDistricts);
                    }}
                    className={`flex-1 px-3 py-2.5 border rounded text-sm flex items-center justify-center gap-1 font-medium ${
                      selectedDistricts.length > 0 
                        ? 'border-orange-500 bg-orange-50/30 text-orange-700' 
                        : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                  >
                    <span>{selectedDistricts.length === 0 ? '选择地区' : `地区(${selectedDistricts.length})`}</span>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </button>
                  <button
                    onClick={() => {
                      setIsGradeDropdownOpen(!isGradeDropdownOpen);
                      setIsDistrictDropdownOpen(false);
                      setIsSubjectDropdownOpen(false);
                      setTempGrades(selectedGrades);
                    }}
                    className={`flex-1 px-3 py-2.5 border rounded text-sm flex items-center justify-center gap-1 font-medium ${
                      selectedGrades.length > 0
                        ? 'border-orange-500 bg-orange-50/30 text-orange-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                  >
                    <span>{selectedGrades.length === 0 ? '选择年级' : `年级(${selectedGrades.length})`}</span>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </button>
                  <button
                    onClick={() => {
                      setIsSubjectDropdownOpen(!isSubjectDropdownOpen);
                      setIsDistrictDropdownOpen(false);
                      setIsGradeDropdownOpen(false);
                      setTempSubjects(selectedSubjects);
                    }}
                    className={`flex-1 px-3 py-2.5 border rounded text-sm flex items-center justify-center gap-1 font-medium ${
                      selectedSubjects.length > 0
                        ? 'border-orange-500 bg-orange-50/30 text-orange-700'
                        : 'bg-gray-50 border-gray-200 text-gray-600'
                    }`}
                  >
                    <span>{selectedSubjects.length === 0 ? '选择科目' : `科目(${selectedSubjects.length})`}</span>
                    <ChevronDown className="w-3 h-3 text-gray-400" />
                  </button>
                </div>
                {/* Search Box */}
                <div className="flex gap-2">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      placeholder="多词搜索(如浦东 周中 英语)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-4 py-2.5 bg-gray-100 border-none rounded text-sm focus:ring-1.5 focus:ring-green-500 focus:bg-white text-gray-800 placeholder-gray-400 focus:outline-none"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          setAppliedSearchQuery(searchQuery);
                        }
                      }}
                    />
                    <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-gray-400" />
                    {searchQuery && (
                      <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 p-0.5 rounded-full">
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <button 
                    onClick={() => setAppliedSearchQuery(searchQuery)}
                    className="px-5 py-2.5 bg-green-500 text-white rounded text-sm font-bold hover:bg-green-600 transition-colors shrink-0 flex items-center gap-1"
                  >
                    <Search className="w-4 h-4" />
                    搜索
                  </button>
                </div>
                {/* Quick Filter Tags */}
                <div className="flex items-center gap-2">
                  <button onClick={() => setTagOnline(!tagOnline)} className={`flex-1 px-3 py-2 rounded-full text-sm font-semibold transition-all ${tagOnline ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>线上</button>
                  <button onClick={() => setTagCollege(!tagCollege)} className={`flex-1 px-3 py-2 rounded-full text-sm font-semibold transition-all ${tagCollege ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>大学生</button>
                  <button onClick={() => setTagHighPrice(!tagHighPrice)} className={`flex-1 px-3 py-2 border rounded-full text-sm font-semibold transition-all flex items-center justify-center gap-0.5 whitespace-nowrap ${tagHighPrice ? 'bg-orange-500 text-white border-orange-500' : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'}`}>
                    <span className="inline-flex items-center gap-0.5">高价单 🔥</span>
                  </button>
                  <button onClick={handleOpenAdvancedModal} className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-full text-sm font-semibold hover:bg-blue-600 transition-colors flex items-center justify-center gap-1 shadow-sm">
                    <SlidersHorizontal className="w-4 h-4" />
                    <span>高级</span>
                  </button>
                </div>
                {/* Sort Mode Selector for Mobile */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-medium">排序方式:</span>
                  <select
                    value={sortMode}
                    onChange={(e) => setSortMode(e.target.value as 'distance' | 'price')}
                    className="px-4 py-2 bg-gray-50 text-gray-700 border border-gray-200 rounded-lg text-xs font-medium cursor-pointer focus:outline-none focus:ring-2 focus:ring-orange-500/50 min-w-[140px] max-w-[160px]"
                  >
                    <option value="distance" className="text-xs">距离近→远</option>
                    <option value="price" className="text-xs">时薪高→低</option>
                  </select>
                </div>
                {/* Location Info */}
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-400">老师地址</span>
                  <span className="text-gray-700 font-medium">{currentLandmark ? currentLandmark.name : '未绑定地址'}</span>
                  <button onClick={() => setIsLandmarkModalOpen(true)} className="text-blue-500 hover:text-blue-600 text-xs">修改</button>
                </div>
              </div>

              {/* Dropdown panels for mobile */}
              {isDistrictDropdownOpen && (
                <div className="md:hidden absolute top-16 left-4 right-4 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-50">
                  <div className="flex justify-between items-center mb-2 border-b border-gray-100 pb-2">
                    <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tempDistricts.length === SHANGHAI_DISTRICTS.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTempDistricts([...SHANGHAI_DISTRICTS]);
                          } else {
                            setTempDistricts([]);
                          }
                        }}
                        className="rounded text-orange-500 focus:ring-orange-400 border-gray-300 w-3.5 h-3.5"
                      />
                      <span>全选</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 max-h-44 overflow-y-auto mb-3">
                    {SHANGHAI_DISTRICTS.map((item) => {
                      const isChecked = tempDistricts.includes(item);
                      return (
                        <button
                          key={item}
                          onClick={() => toggleTempDistrict(item)}
                          className={`py-1.5 text-center rounded text-sm font-sans border transition-all truncate px-1 ${
                            isChecked
                              ? 'bg-orange-500 text-white border-orange-500 font-semibold'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {item.replace('区', '').replace('新区', '')}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-end gap-2 border-t border-gray-100 pt-2">
                    <button onClick={handleDistrictReset} className="px-3 py-1.5 text-sm text-gray-500 border border-gray-200 hover:bg-gray-50 rounded">重置</button>
                    <button onClick={handleDistrictConfirm} className="px-4 py-1.5 text-sm bg-orange-500 text-white rounded hover:bg-orange-600 shadow-sm font-semibold">确定</button>
                  </div>
                </div>
              )}
              {isGradeDropdownOpen && (
                <div className="md:hidden absolute top-16 left-4 right-4 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-50">
                  <div className="flex justify-between items-center mb-2 border-b border-gray-100 pb-2">
                    <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tempGrades.length === GRADES.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTempGrades([...GRADES]);
                          } else {
                            setTempGrades([]);
                          }
                        }}
                        className="rounded text-orange-500 focus:ring-orange-400 border-gray-300 w-3.5 h-3.5"
                      />
                      <span>全选</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 max-h-44 overflow-y-auto mb-3">
                    {GRADES.map((item) => {
                      const isChecked = tempGrades.includes(item);
                      return (
                        <button
                          key={item}
                          onClick={() => toggleTempGrade(item)}
                          className={`py-1 rounded text-[11px] text-center border transition-all ${
                            isChecked
                              ? 'bg-orange-500 text-white border-orange-500 font-semibold'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-end gap-2 border-t border-gray-100 pt-2">
                    <button onClick={handleGradeReset} className="px-2.5 py-1 text-[11px] text-gray-500 border border-gray-200 hover:bg-gray-50 rounded">重置</button>
                    <button onClick={handleGradeConfirm} className="px-3.5 py-1 text-[11px] bg-orange-500 text-white rounded hover:bg-orange-600 shadow-sm font-semibold">确定</button>
                  </div>
                </div>
              )}
              {isSubjectDropdownOpen && (
                <div className="md:hidden absolute top-16 left-4 right-4 bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-50">
                  <div className="flex justify-between items-center mb-2 border-b border-gray-100 pb-2">
                    <label className="flex items-center gap-1.5 text-sm text-gray-500 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tempSubjects.length === SUBJECTS.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setTempSubjects([...SUBJECTS]);
                          } else {
                            setTempSubjects([]);
                          }
                        }}
                        className="rounded text-orange-500 focus:ring-orange-400 border-gray-300 w-3.5 h-3.5"
                      />
                      <span>全选</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-3 gap-1.5 max-h-44 overflow-y-auto mb-3">
                    {SUBJECTS.map((item) => {
                      const isChecked = tempSubjects.includes(item);
                      return (
                        <button
                          key={item}
                          onClick={() => toggleTempSubject(item)}
                          className={`py-1 text-center rounded text-[11px] border transition-all ${
                            isChecked
                              ? 'bg-orange-500 text-white border-orange-500 font-semibold'
                              : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                          }`}
                        >
                          {item}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-end gap-2 border-t border-gray-100 pt-2">
                    <button onClick={handleSubjectReset} className="px-2.5 py-1 text-[11px] text-gray-500 border border-gray-200 hover:bg-gray-50 rounded">重置</button>
                    <button onClick={handleSubjectConfirm} className="px-3.5 py-1 text-[11px] bg-orange-500 text-white rounded hover:bg-orange-600 shadow-sm font-semibold">确定</button>
                  </div>
                </div>
              )}

              <div className="flex justify-between items-center px-1 mb-0.5 select-none shrink-0">
                <div className="text-sm text-gray-400 font-mono">
                  为您匹配到相关符合条件的家教需求: <b className="text-gray-700 font-bold">{filteredOrders.length}</b> 个
                </div>
                <div className="text-sm text-gray-400">已自动按距离由近至远进行排序</div>
              </div>

              {loading ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20">
                  <Loader className="w-8 h-8 text-orange-500 animate-spin" />
                  <p className="text-sm text-gray-500 mt-2">正在加载订单数据...</p>
                </div>
              ) : error ? (
                <div className="flex-1 flex flex-col items-center justify-center py-20 text-center px-6">
                  <div className="p-4 bg-red-50 rounded-full text-red-500 mb-3">
                    <AlertTriangle className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-red-600 text-base">数据加载失败</h4>
                  <p className="text-sm text-gray-400 max-w-xs mt-1.5">{error}</p>
                  <button
                    onClick={() => {
                      setLoading(true);
                      setError(null);
                      api.getOrders().then(apiOrders => {
                        const transformedOrders: Order[] = apiOrders.map((order: any) => ({
                          id: order.id,
                          district: order.district,
                          grade: order.education_stage,
                          subject: order.subject,
                          coordinate: {
                            lat: order.latitude || 31.2304,
                            lng: order.longitude || 121.4737
                          },
                          studentDesc: order.requirements || order.title || '学员信息待完善',
                          studentDetail: order.raw_content || order.requirements || '暂无详细信息',
                          frequency: '每周2次，每次2小时',
                          address: order.address,
                          requirements: order.requirements || '男女教员均可',
                          price: order.salary_max || order.salary_min || 0,
                          priceText: order.salary_min && order.salary_max 
                            ? `${order.salary_min}-${order.salary_max}/h` 
                            : (order.salary_min ? `${order.salary_min}/h` : '面议'),
                          isHighPrice: (order.salary_max || order.salary_min || 0) >= 120,
                          isOnline: order.teaching_type === '网课',
                          isCollegeStudent: true,
                          isNegotiable: !order.salary_min && !order.salary_max,
                          contactTeacher: 'Ken06103',
                          publishTime: order.published_at || order.created_at || new Date().toISOString(),
                          rawContent: order.raw_content || '',
                          idLine: `家教编号：${order.order_no}`
                        }));
                        setOrders(transformedOrders);
                      }).catch((err: any) => {
                        setError(err.message || '加载失败，请稍后重试');
                      }).finally(() => {
                        setLoading(false);
                      });
                    }}
                    className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded text-base font-bold transition-all shadow-sm"
                  >
                    重新加载
                  </button>
                </div>
              ) : filteredOrders.length === 0 ? (
                <div id="empty-list-indicator" className="flex-1 flex flex-col items-center justify-center py-20 text-center px-6">
                  <div className="p-4 bg-gray-100 rounded-full text-gray-400 mb-3 animate-bounce">
                    <ListFilter className="w-8 h-8" />
                  </div>
                  <h4 className="font-bold text-gray-700 text-base">暂无符合筛选条件的家教订单</h4>
                  <p className="text-sm text-gray-400 max-w-xs mt-1.5 leading-relaxed">
                    您可以尝试减少行政区划勾选、调低高级筛选中的“最低时薪门槛”，或者扩大“搜索公里半径”范围，甚至一键重置筛选!
                  </p>
                  <button
                    onClick={handleResetAllFilters}
                    className="mt-4 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded text-base font-bold transition-all shadow-sm shadow-orange-500/10"
                  >
                    重置所有筛选参数
                  </button>
                </div>
              ) : (
                paginatedOrders.map((order) => {
                  const isActive = selectedOrderId === order.id;
                  
                  // Distance math
                  let distanceStr = '';
                  let hasDistance = false;
                  if (currentLandmark && !order.isOnline) {
                    const distVal = getDistance(
                      currentLandmark.coordinate.lat,
                      currentLandmark.coordinate.lng,
                      order.coordinate.lat,
                      order.coordinate.lng
                    );
                    distanceStr = `距离约 ${distVal}km`;
                    hasDistance = true;
                  } else if (order.isOnline) {
                    distanceStr = '线上授课免通勤';
                    hasDistance = true;
                  }

                  return (
                    <div
                      key={order.id}
                      id={`order-card-${order.id}`}
                      onClick={() => {
                        setSelectedOrderId(order.id);
                        // Mobile: open detail modal
                        if (window.innerWidth < 768) {
                          setIsMobileDetailModalOpen(true);
                        }
                      }}
                      className={`bg-white p-3.5 rounded-lg border transition-all cursor-pointer select-none group relative ${
                        isActive
                          ? 'border-2 border-orange-500 shadow-md transform md:scale-[1.005]'
                          : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                      }`}
                    >
                      {/* Active tag ribbon or Flame symbol */}
                      {order.isHighPrice && (
                        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-tr-md rounded-bl-md z-10 flex items-center gap-0.5">
                          <span>高价 🔥</span>
                        </span>
                      )}

                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-xs"> </span>
                            <span className="text-gray-600 font-bold font-mono text-sm">{order.idLine || order.id}</span>
                          </div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              navigator.clipboard.writeText(order.id);
                            }}
                            className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-500 hover:bg-gray-200 transition-colors"
                          >
                            <Copy className="w-3 h-3" />
                            复制
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
                        <span className="text-gray-600">{order.district}</span>
                        <span className="text-gray-300">|</span>
                        <span className="text-gray-600">{order.grade}</span>
                        <span className="text-gray-300">|</span>
                        <span className="text-gray-600">{order.subject}</span>
                        {hasDistance && (
                          <>
                            <span className="text-gray-300">|</span>
                            <span className="flex items-center gap-1 text-gray-500">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              {distanceStr}
                            </span>
                          </>
                        )}
                        <span className="text-green-600 font-medium">{order.contactTeacher}</span>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrderId(order.id);
                            setIsWeChatModalOpen(true);
                          }}
                          className="text-green-600 cursor-pointer hover:text-green-700 transition-colors"
                          title="点击获取家长微信"
                        >
                          💬
                        </button>
                      </div>
                      
                      {/* Raw content display */}
                      <div className="mb-3 px-3 py-3 bg-gray-50 rounded-lg text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {order.rawContent || order.studentDetail}
                      </div>
                      
                      {/* Price and action */}
                      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="text-orange-600 font-bold text-2xl">
                            {order.isNegotiable ? (
                              <span className="text-lg font-semibold text-emerald-600">教员报价</span>
                            ) : order.priceText ? (
                              <span className="text-xl">{order.priceText}</span>
                            ) : (
                              <>
                                <span className="text-lg font-normal">¥</span>
                                <span className="text-3xl">{order.price}</span>
                                <span className="text-base text-gray-500">/h</span>
                              </>
                            )}
                          </div>
                          {/* Favorite Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(order);
                            }}
                            className={`p-2 rounded-full transition-all ${
                              isFavorited(order.id)
                                ? 'text-red-500 bg-red-50 hover:bg-red-100'
                                : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                            }`}
                            title={isFavorited(order.id) ? '取消收藏' : '收藏'}
                          >
                            <Heart className={`w-5 h-5 ${isFavorited(order.id) ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedOrderId(order.id);
                            if (window.innerWidth < 768) {
                              setIsMobileDetailModalOpen(true);
                            }
                          }}
                          className={`px-4 py-2 rounded text-sm font-bold transition-all ${
                            isActive 
                              ? 'bg-orange-500 text-white' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {isActive ? '查看中' : '详情'}
                        </button>
                      </div>

                    </div>
                  );
                })
              )}

            </section>

            {/* RIGHT SIDE: ORDER DETAIL PANEL - PC only, 40% width */}
            <section className="hidden md:flex md:w-[40%] bg-white flex-col overflow-hidden relative">
              
              {selectedOrder ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  
                  {/* Scrollable specs wrapper */}
                  <div className="p-5 flex-1 overflow-y-auto space-y-4">
                    
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3 select-none">
                      <div>
                        <span className="text-[10px] text-gray-400 font-mono tracking-wider">ORDER SPECIFICATION</span>
                        <h2 className="text-base font-bold text-gray-900 tracking-tight mt-0.5">
                          家教订单：{selectedOrder.order_no || selectedOrder.orderId || selectedOrder.id}
                        </h2>
                      </div>
                      <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-full animate-pulse shrink-0">
                        正在招生 ⚡
                      </span>
                    </div>

                    {/* Standard Iconized visual parameters matching Requirements */}
                    <div className="flex items-start gap-3.5 bg-neutral-50 p-3 rounded-xl border border-gray-100/50">
                      <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center text-lg shadow-inner shrink-0">
                        📚
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-[10px] text-gray-400 font-semibold tracking-wider">辅导科目 / 学段年级分类</div>
                        <div className="text-sm font-bold text-neutral-800 mt-0.5 flex items-center gap-1.5">
                          <span>{selectedOrder.district} {selectedOrder.grade} {selectedOrder.subject}</span>
                          {selectedOrder.isOnline && (
                            <span className="bg-blue-50 text-blue-600 text-[9px] px-1 rounded border border-blue-200 font-sans shrink-0 font-medium select-none">全线上</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Highly polished Pricing / Commute estimation block */}
                    <div className="grid grid-cols-2 gap-3.5 border-y border-gray-100 py-3.5">
                      <div>
                        <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">课时费用报酬 / 老师时薪</div>
                        <div className="text-lg font-black text-orange-600 mt-1 tracking-tight flex items-baseline">
                          {selectedOrder.isNegotiable ? (
                            <span className="text-sm font-bold text-teal-600">教员协商报价</span>
                          ) : selectedOrder.priceText ? (
                            <span className="text-lg">{selectedOrder.priceText}</span>
                          ) : (
                            <>
                              <span className="text-xs font-semibold mr-0.5 font-mono">¥</span>
                              <span className="text-xl leading-none">{selectedOrder.price}</span>
                              <span className="text-xs font-semibold text-gray-450 ml-1">/ 小时</span>
                            </>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider border-l border-gray-200 pl-3">预估通勤及距离</div>
                        <div className="text-xs font-semibold text-neutral-800 mt-1.5 flex flex-col justify-center border-l border-gray-205 pl-3 min-w-0">
                          {currentLandmark ? (
                            <>
                              {selectedOrder.isOnline ? (
                                <span className="text-emerald-600 font-bold">免除通勤耗时</span>
                              ) : (
                                <span className="text-gray-800 font-bold">
                                  约 {getDistance(currentLandmark.coordinate.lat, currentLandmark.coordinate.lng, selectedOrder.coordinate.lat, selectedOrder.coordinate.lng)}km (直线距离)
                                </span>
                              )}
                              <span className="text-[10px] text-gray-400 truncate mt-0.5">起点: {currentLandmark.name}</span>
                            </>
                          ) : (
                            <span className="text-red-500 font-semibold cursor-pointer text-[10px] leading-tight" onClick={() => setIsLandmarkModalOpen(true)}>
                              请先设置/绑定您的老师地标 &gt;
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Detailed info containers */}
                    <div className="space-y-3.5 text-xs text-gray-700">
                      
                      <div className="space-y-1">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">学生学习基础与辅导细节</h4>
                        <div className="bg-neutral-50 px-3 py-2.5 rounded-lg text-[11px] leading-relaxed text-gray-700 border border-neutral-100">
                          <p className="font-semibold text-neutral-805 mb-1 bg-white border border-gray-100 rounded px-1.5 py-0.5 inline-block text-[10px]">学生简况: {selectedOrder.studentDesc}</p>
                          <p className="text-gray-600 leading-relaxed">{selectedOrder.studentDetail}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-1">
                        <div>
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">上课频次说明</h4>
                          <div className="bg-neutral-50 px-2.5 py-2 rounded text-[11px] font-medium text-gray-750 border border-neutral-100 gap-1 flex items-center">
                            <Clock className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                            <span className="truncate">{selectedOrder.frequency}</span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">授课地点/学生常住地址</h4>
                          <div className="bg-neutral-55 px-2.5 py-2 rounded text-[11px] font-medium text-gray-750 border border-neutral-100 gap-1 flex items-center">
                            <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                            <span className="truncate" title={selectedOrder.address}>{selectedOrder.address}</span>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-1">
                        <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">接单教员基本资格及性别要求</h4>
                        <ul className="space-y-1.5 bg-blue-50/50 border border-blue-100/50 p-3 rounded-lg text-[11px] text-blue-900 font-sans leading-relaxed">
                          <li className="flex items-start gap-1.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <span>{selectedOrder.requirements}</span>
                          </li>

                        </ul>
                      </div>

                    </div>

                  </div>

                  {/* Operational Footer panel anchoring routes navigator and WeChat QR code popups */}
                  <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-2.5 shrink-0 select-none">
                    
                    <button
                      id="view-commute-route-btn"
                      onClick={() => {
                        if (!currentLandmark) {
                          setIsLandmarkModalOpen(true);
                          return;
                        }
                        setIsNavigating(true);
                      }}
                      className="flex-1 py-2.5 bg-white border border-gray-300 rounded font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-gray-150 transition-colors uppercase text-gray-700 cursor-pointer shadow-sm hover:border-gray-400"
                    >
                      <Navigation className="w-3.5 h-3.5 text-blue-500" />
                      <span>查看路线导航</span>
                    </button>

                    <button
                      id="view-contact-wechat-btn"
                      onClick={() => setIsWeChatModalOpen(true)}
                      className="flex-1 py-2.5 bg-orange-500 text-white rounded font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-orange-600 transition-all cursor-pointer shadow-md shadow-orange-500/10"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>点击获取家长微信</span>
                    </button>

                    <button
                      id="view-favorite-btn"
                      onClick={() => toggleFavorite(selectedOrder)}
                      className={`py-2.5 px-3 rounded font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        isFavorited(selectedOrder.id)
                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isFavorited(selectedOrder.id) ? 'fill-current' : ''}`} />
                    </button>

                  </div>

                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-gray-400">
                  <SlidersHorizontal className="w-8 h-8 text-neutral-300 animate-pulse mb-2" />
                  <span className="text-xs">请从左侧订单列表中选中一个订单以查看其完整详细需求书</span>
                </div>
              )}

              {/* Pagination Controls */}
              {activeTab === 'list' && (
                <div className="flex items-center justify-center gap-2 py-3 border-t border-gray-200 bg-white shrink-0">
                  <button
                    onClick={() => setListPage(p => Math.max(1, p - 1))}
                    disabled={listPage === 1 || totalListPages <= 1}
                    className="px-3 py-1.5 text-sm font-bold text-gray-600 hover:text-orange-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    上一页
                  </button>
                  <span className="px-3 py-1.5 text-sm font-bold text-orange-500 bg-orange-50 rounded">
                    {listPage} / {totalListPages || 1}
                  </span>
                  <button
                    onClick={() => setListPage(p => Math.min(totalListPages || 1, p + 1))}
                    disabled={listPage >= (totalListPages || 1)}
                    className="px-3 py-1.5 text-sm font-bold text-gray-600 hover:text-orange-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    下一页
                  </button>
                </div>
              )}

            </section>

          </div>
        ) : activeTab === 'map' ? (
          <ShanghaiRadarMap
            currentLandmark={currentLandmark}
            filteredOrders={filteredOrders}
            selectedOrderId={selectedOrderId}
            setSelectedOrderId={setSelectedOrderId}
            maxDistance={advancedFilters.maxDistance}
            onModifyLandmark={() => setIsLandmarkModalOpen(true)}
            activeTab={activeTab}
            onUpdateLandmark={setCurrentLandmark}
          />
        ) : (
          /* VIEW 3: FAVORITES ("我的收藏") */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-gray-50">
            {/* Left: Favorites List */}
            <section className="md:w-[60%] md:border-r md:border-gray-200 w-full overflow-y-auto flex flex-col gap-2.5 p-3 md:shrink-0 scroll-smooth">
              
              {/* Mobile Header */}
              <div className="md:hidden bg-white px-4 py-3 rounded-xl shadow-sm mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-500" />
                  <span className="font-bold text-gray-800">我的收藏</span>
                  <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{favoriteOrders.length}个</span>
                </div>
              </div>

              {/* PC Header */}
              <div className="hidden md:flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Heart className="w-6 h-6 text-red-500" />
                  <h2 className="text-lg font-bold text-gray-800">我的收藏</h2>
                  <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded-full">{favoriteOrders.length}个家教单</span>
                </div>
                <button
                  onClick={() => {
                    if (window.confirm(`确定要清空所有收藏吗？`)) {
                      setFavoriteOrdersData([]);
                    }
                  }}
                  className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  清空全部
                </button>
              </div>

              {/* Empty State */}
              {favoriteOrders.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Heart className="w-10 h-10 text-gray-300" />
                  </div>
                  <h3 className="text-base font-bold text-gray-600 mb-2">暂无收藏家教单</h3>
                  <p className="text-sm text-gray-400 mb-4">点击订单卡片上的爱心图标，即可收藏心仪的家教单</p>
                  <button
                    onClick={() => {
                      setActiveTab('list');
                      setSelectedOrderId(null);
                    }}
                    className="px-5 py-2.5 bg-orange-500 text-white rounded-lg font-bold text-sm hover:bg-orange-600 transition-colors"
                  >
                    去浏览家教单
                  </button>
                </div>
              ) : (
                /* Favorites List */
                <div className="flex flex-col gap-2">
                  {paginatedFavorites.map((order) => {
                    const isActive = selectedOrderId === order.id;
                    const isFav = isFavorited(order.id);
                    
                    return (
                      <div
                        key={order.id}
                        onClick={() => setSelectedOrderId(order.id)}
                        className={`bg-white rounded-xl p-4 cursor-pointer transition-all border ${
                          isActive 
                            ? 'border-orange-400 shadow-lg ring-2 ring-orange-100' 
                            : 'border-gray-100 hover:border-gray-200 hover:shadow-md'
                        }`}
                      >
                        {/* Order Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded font-semibold">{order.district}</span>
                            <span className="bg-orange-100 text-orange-700 text-xs px-2 py-0.5 rounded font-semibold">{order.grade} · {order.subject}</span>
                            {order.isOnline && <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded font-semibold">线上</span>}
                            {order.isHighPrice && <span className="bg-red-100 text-red-600 text-xs px-2 py-0.5 rounded font-semibold">高薪</span>}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavorite(order);
                            }}
                            className={`p-1.5 rounded-full transition-colors ${
                              isFav ? 'text-red-500 bg-red-50' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                            }`}
                          >
                            <Heart className={`w-5 h-5 ${isFav ? 'fill-current' : ''}`} />
                          </button>
                        </div>
                        
                        {/* Student Description */}
                        <p className="text-sm text-gray-700 mb-2 line-clamp-2">{order.studentDesc}</p>
                        
                        {/* Order Meta */}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-3">
                            <span className="text-orange-600 font-bold">
                              {order.isNegotiable || order.price === 0 ? '教员报价' : (order.priceText || `${order.price}元/h`)}
                            </span>
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {order.address}
                            </span>
                          </div>
                          <span className="text-gray-400">{order.publishTime}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {/* Right: Detail Panel - PC only */}
            <section className="hidden md:flex w-[40%] bg-white overflow-y-auto">
              {selectedOrder && isFavorited(selectedOrder.id) ? (
                <div className="flex-1 p-6">
                  {/* Order Detail Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 mb-1">{selectedOrder.studentDesc}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] text-gray-400 font-mono tracking-tight bg-gray-50 px-2 py-0.5 rounded border border-gray-200">
                          {selectedOrder.order_no || selectedOrder.orderId || selectedOrder.id}
                        </span>
                        <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">{selectedOrder.district}</span>
                        <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded">{selectedOrder.grade}</span>
                        <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded">{selectedOrder.subject}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFavorite(selectedOrder)}
                      className="p-2 rounded-full text-red-500 bg-red-50 hover:bg-red-100 transition-colors"
                    >
                      <Heart className="w-5 h-5 fill-current" />
                    </button>
                  </div>

                  {/* Price & Distance */}
                  <div className="grid grid-cols-2 gap-3 border-y border-gray-100 py-3 mb-4">
                    <div>
                      <div className="text-[9px] text-gray-400 font-bold uppercase">课时费用</div>
                      <div className="text-lg font-black text-orange-600 mt-1">
                        {selectedOrder.priceText || `${selectedOrder.price}元/h`}
                      </div>
                    </div>
                    <div>
                      <div className="text-[9px] text-gray-400 font-bold uppercase">预估距离</div>
                      <div className="text-sm font-semibold text-gray-700 mt-1">
                        {currentLandmark ? (
                          `${getDistance(currentLandmark.coordinate.lat, currentLandmark.coordinate.lng, selectedOrder.coordinate.lat, selectedOrder.coordinate.lng).toFixed(1)}km`
                        ) : '未设置起点'}
                      </div>
                    </div>
                  </div>

                  {/* Student Detail */}
                  <div className="mb-4">
                    <div className="text-[9px] text-gray-400 font-bold uppercase mb-1">学员详细情况</div>
                    <p className="text-sm text-gray-700">{selectedOrder.studentDetail}</p>
                  </div>

                  {/* Frequency */}
                  <div className="mb-4">
                    <div className="text-[9px] text-gray-400 font-bold uppercase mb-1">上课频率</div>
                    <p className="text-sm text-gray-700">{selectedOrder.frequency}</p>
                  </div>

                  {/* Requirements */}
                  <div className="mb-4">
                    <div className="text-[9px] text-gray-400 font-bold uppercase mb-1">教员要求</div>
                    <p className="text-sm text-gray-700">{selectedOrder.requirements}</p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setIsNavigating(true)}
                      className="flex-1 py-3 bg-white border border-gray-300 rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 transition-colors"
                    >
                      <Navigation className="w-4 h-4" />
                      查看路线
                    </button>
                    <button
                      onClick={() => setIsWeChatModalOpen(true)}
                      className="flex-1 py-3 bg-orange-500 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 hover:bg-orange-600 transition-colors shadow-md"
                    >
                      <MessageSquare className="w-4 h-4" />
                      点击获取家长微信
                    </button>
                  </div>
                </div>
              ) : selectedOrder ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <Heart className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500 mb-4">请选择一个收藏的家教单查看详情</p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <Heart className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-sm text-gray-500">从左侧选择一个收藏的家教单查看详情</p>
                </div>
              )}
              
              {/* Favorites Pagination Controls */}
              {activeTab === 'favorites' && (
                <div className="flex items-center justify-center gap-2 py-3 border-t border-gray-200 bg-white shrink-0">
                  <button
                    onClick={() => setFavoritesPage(p => Math.max(1, p - 1))}
                    disabled={favoritesPage === 1 || totalFavoritesPages <= 1}
                    className="px-3 py-1.5 text-sm font-bold text-gray-600 hover:text-orange-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    上一页
                  </button>
                  <span className="px-3 py-1.5 text-sm font-bold text-orange-500 bg-orange-50 rounded">
                    {favoritesPage} / {totalFavoritesPages || 1}
                  </span>
                  <button
                    onClick={() => setFavoritesPage(p => Math.min(totalFavoritesPages || 1, p + 1))}
                    disabled={favoritesPage >= (totalFavoritesPages || 1)}
                    className="px-3 py-1.5 text-sm font-bold text-gray-600 hover:text-orange-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    下一页
                  </button>
                </div>
              )}

            </section>

            {/* Mobile Detail Modal */}
            {selectedOrder && isFavorited(selectedOrder.id) && (
              <div className="md:hidden fixed inset-0 z-50 bg-black/50" onClick={() => setSelectedOrderId(null)}>
                <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                  {/* Modal Header */}
                  <div className="sticky top-0 bg-white px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold text-gray-800">订单详情</h3>
                    <button onClick={() => setSelectedOrderId(null)} className="p-1">
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>
                  
                  {/* Modal Content */}
                  <div className="p-4">
                    <h4 className="font-bold text-gray-800 mb-2">{selectedOrder.studentDesc}</h4>
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">{selectedOrder.district}</span>
                      <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded">{selectedOrder.grade}</span>
                      <span className="bg-orange-100 text-orange-700 text-xs px-2 py-1 rounded">{selectedOrder.subject}</span>
                      <span className="text-orange-600 font-bold">{selectedOrder.priceText || `${selectedOrder.price}元/h`}</span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{selectedOrder.studentDetail}</p>
                    <p className="text-sm text-gray-600 mb-2"><strong>上课频率:</strong> {selectedOrder.frequency}</p>
                    <p className="text-sm text-gray-600 mb-4"><strong>教员要求:</strong> {selectedOrder.requirements}</p>
                    
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsWeChatModalOpen(true)}
                        className="flex-1 py-3 bg-orange-500 text-white rounded-lg font-bold text-sm"
                      >
                        点击获取家长微信
                      </button>
                      <button
                        onClick={() => toggleFavorite(selectedOrder)}
                        className="py-3 px-4 border border-gray-300 rounded-lg"
                      >
                        <Heart className="w-5 h-5 text-red-500 fill-current" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>

      {/* 6. PERSISTENT SYSTEM BOTTOM GLOBAL NAVIGATION TABS */}
      <footer className="h-14 bg-white border-t border-gray-200 flex shrink-0 z-20 shadow-inner">
        <button
          id="tab-switch-regular-list-btn"
          onClick={() => {
            setActiveTab('list');
            setSelectedMapOrder(null);
          }}
          className={`flex-1 flex flex-col items-center justify-center gap-1 cursor-pointer transition-all ${
            activeTab === 'list'
              ? 'text-orange-500 bg-orange-50/15 font-bold'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <ListFilter className="w-5 h-5 stroke-[2]" />
          <span className="text-sm font-bold uppercase tracking-wider">列表视图找家教</span>
        </button>

        <button
          id="tab-switch-interactive-map-btn"
          onClick={() => setActiveTab('map')}
          className={`flex-1 flex flex-col items-center justify-center gap-1 border-l border-gray-100 cursor-pointer transition-all ${
            activeTab === 'map'
              ? 'text-orange-500 bg-orange-50/15 font-bold'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Map className="w-5 h-5 stroke-[2]" />
          <span className="text-sm font-bold uppercase tracking-wider">地图视图找家教</span>
        </button>

        <button
          id="tab-switch-favorites-btn"
          onClick={() => {
            setActiveTab('favorites');
            setSelectedOrderId(null);
          }}
          className={`flex-1 flex flex-col items-center justify-center gap-1 border-l border-gray-100 cursor-pointer transition-all relative ${
            activeTab === 'favorites'
              ? 'text-orange-500 bg-orange-50/15 font-bold'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          <Heart className="w-5 h-5 stroke-[2]" />
          <span className="text-sm font-bold uppercase tracking-wider">我的收藏</span>
          {favoriteIds.length > 0 && (
            <span className="absolute top-1 right-3 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{favoriteIds.length}</span>
          )}
        </button>
      </footer>

      {/* ========================================================= */}
      {/* 7. POPUPS / DIALOG MODALS WITH FULL ACCORDANCE TRANSITIONS */}
      {/* ========================================================= */}

      {/* MODAL 1: ADVANCED FILTER SETUP POPUP (居中圆角设计) */}
      {isAdvancedModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsAdvancedModalOpen(false)} />
          
          <div 
            id="advanced-filters-panel"
            className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-sm w-full z-10 overflow-hidden flex flex-col relative animate-scale-up"
          >
            
            {/* Header */}
            <div className="px-5 py-3 border-b border-gray-150 flex items-center justify-between bg-gray-50">
              <span className="text-xs font-bold text-gray-800">进阶高级筛选设置</span>
              <button 
                onClick={() => setIsAdvancedModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-200 transition-colors"
                id="close-advanced-modal-btn"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* Inputs body */}
            <div className="p-5 space-y-4 max-h-[360px] overflow-y-auto">
              
              {/* 地标修改绑定提醒 */}
              <div className="p-2.5 bg-neutral-50 rounded-lg flex items-start gap-1.5 border border-neutral-150">
                <MapPin className="w-4 h-4 text-orange-500 mt-0.5 shrink-0" />
                <div className="text-[10px] text-gray-500">
                  当前已绑定附近地标：<strong className="text-gray-700">{currentLandmark?.name || '未设置'}</strong>
                  <br />如需更改起点坐标，请直接在首页点击“修改地标”。
                </div>
              </div>

              {/* 1. Distance radius constraint */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-600 block uppercase">授课最大半径 (直线距离):</label>
                <div className="relative">
                  <input
                    type="text"
                    id="advanced-input-maxdistance"
                    value={tempAdvancedFilters.maxDistance}
                    onChange={(e) => {
                      setTempAdvancedFilters({
                        ...tempAdvancedFilters,
                        maxDistance: e.target.value as any
                      });
                    }}
                    className={`w-full pl-3 pr-12 py-2 border rounded-md text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none ${advancedInputErrors.maxDistance ? 'border-red-500' : 'border-gray-200'}`}
                    placeholder="100"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] text-gray-400 font-semibold uppercase">KM 范围内</span>
                </div>
                {advancedInputErrors.maxDistance && (
                  <p className="text-[9.5px] text-red-500 font-semibold">{advancedInputErrors.maxDistance}</p>
                )}
              </div>

              {/* 2. Min Hourly Rate Price Greater */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-600 block uppercase font-sans">最低课时薪资门槛:</label>
                <div className="relative">
                  <input
                    type="text"
                    id="advanced-input-minrate"
                    value={tempAdvancedFilters.minHourlyRate}
                    onChange={(e) => {
                      setTempAdvancedFilters({
                        ...tempAdvancedFilters,
                        minHourlyRate: e.target.value as any
                      });
                    }}
                    className={`w-full pl-3 pr-14 py-2 border rounded-md text-xs focus:ring-1 focus:ring-orange-500 focus:outline-none ${advancedInputErrors.minHourlyRate ? 'border-red-500' : 'border-gray-200'}`}
                    placeholder="10"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] text-gray-400 font-semibold">元/小时 以上</span>
                </div>
                {advancedInputErrors.minHourlyRate && (
                  <p className="text-[10px] text-red-500 font-semibold">{advancedInputErrors.minHourlyRate}</p>
                )}
              </div>

              {/* 3. Include Unpriced Switch Toggle */}
              <div className="flex items-center justify-between bg-[#F8F9FA] p-2.5 rounded-lg border border-gray-100">
                <div>
                  <span className="text-[11px] font-bold text-gray-700 block">包含未报价协商订单</span>
                  <p className="text-[9.5px] text-gray-400 mt-0.5">允许展示时薪标明面议、待商讨的订单</p>
                </div>
                <button
                  id="advanced-toggle-unpriced"
                  onClick={() => setTempAdvancedFilters({
                    ...tempAdvancedFilters,
                    includeUnpriced: !tempAdvancedFilters.includeUnpriced
                  })}
                  className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-150 shrink-0 ${tempAdvancedFilters.includeUnpriced ? 'bg-green-500' : 'bg-gray-300'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform duration-150 ${tempAdvancedFilters.includeUnpriced ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-150 flex justify-end gap-2">
              <button
                id="cancel-advanced-modal-btn"
                onClick={() => setIsAdvancedModalOpen(false)}
                className="px-4.5 py-2 border border-gray-200 rounded text-xs text-gray-600 hover:bg-gray-100 font-semibold cursor-pointer"
              >
                取消
              </button>
              <button
                id="apply-advanced-filters-btn"
                onClick={handleAdvancedApply}
                className="px-5 py-2 bg-orange-500 text-white hover:bg-orange-600 rounded text-xs font-bold transition-all shadow-sm shadow-orange-500/10 cursor-pointer"
              >
                应用筛选
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: LANDMARK MODAL SELECTION PORTAL */}
      <LandmarkModal
        isOpen={isLandmarkModalOpen}
        onClose={() => setIsLandmarkModalOpen(false)}
        currentLandmark={currentLandmark}
        onSelect={(landmark) => {
          setCurrentLandmark(landmark);
        }}
      />

      {/* MODAL 3: NAVIGATION OUTLINE POPUP (以地标为起点、住址为终点，提供四种路线算路) */}
      {isNavigating && selectedOrder && currentLandmark && (
        <div id="navigation-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsNavigating(false)} />
          
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-lg w-full z-10 overflow-hidden flex flex-col relative animate-scale-up max-h-[85vh]">
            
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-150 bg-gray-50 flex justify-between items-center select-none">
              <div className="flex items-center gap-2">
                <Navigation className="w-5 h-5 text-blue-500 animate-pulse" />
                <span className="font-bold text-gray-800 text-sm">授课通勤最佳出行路线方案</span>
              </div>
              <button 
                onClick={() => setIsNavigating(false)}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-200 transition-colors"
                id="close-navigation-modal-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Nav Main contents */}
            <div className="p-5 flex-1 overflow-y-auto space-y-4">
              
              {/* Origin / Dest blocks */}
              <div className="space-y-2 border-b border-gray-100 pb-3">
                <div className="flex items-start gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-blue-105 text-blue-600 flex items-center justify-center text-[10px] font-bold uppercase mt-0.5 shrink-0">起</div>
                  <div className="min-w-0">
                    <span className="text-[9px] text-gray-400 block font-semibold uppercase">TUTOR START POINT</span>
                    <span className="text-xs font-bold text-gray-800 break-all">{currentLandmark.name}</span>
                    <span className="text-[10px] text-gray-405 block truncate font-mono">({currentLandmark.address})</span>
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-1.5">
                  <div className="w-5 h-5 rounded-full bg-orange-105 text-orange-600 flex items-center justify-center text-[10px] font-bold uppercase mt-0.5 shrink-0">终</div>
                  <div className="min-w-0">
                    <span className="text-[9px] text-gray-400 block font-semibold uppercase">STUDENT HOME ADDRESS</span>
                    <span className="text-xs font-bold text-gray-800 break-all">{selectedOrder.address}</span>
                    <span className="text-[10px] text-gray-405 block font-sans">({selectedOrder.district} | 授课科目 {selectedOrder.subject})</span>
                  </div>
                </div>
              </div>

              {/* Travel mode tab switchings */}
              <div className="space-y-1.5 select-none">
                <span className="text-[9px] text-gray-400 font-bold block uppercase">切换选择出行通行工具：</span>
                <div className="grid grid-cols-4 gap-1 border border-gray-200 rounded-lg p-1 bg-gray-50 shrink-0">
                  {[
                    { id: 'transit', label: '公交地铁' },
                    { id: 'driving', label: '私家车' },
                    { id: 'riding', label: '骑自行车' },
                    { id: 'walking', label: '步行上门' }
                  ].map(mode => (
                    <button
                      key={mode.id}
                      onClick={() => setNavTravelMode(mode.id as TravelMode)}
                      className={`py-1.5 rounded-md text-[11px] font-bold transition-all text-center ${
                        navTravelMode === mode.id
                          ? 'bg-blue-500 text-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 font-medium'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Travel outcome summary */}
              {navigationPath ? (
                <div className="space-y-4">
                  
                  {/* Stats highlights */}
                  <div className="grid grid-cols-2 gap-3 bg-blue-50/50 border border-blue-100 rounded-lg px-4 py-3 text-center">
                    <div>
                      <span className="text-[9.5px] text-blue-600 block uppercase font-mono">导航网络路径里程</span>
                      <span className="text-lg font-black text-blue-900 leading-none">{navigationPath.distanceKm} <span className="text-xs font-normal">公里</span></span>
                    </div>
                    <div className="border-l border-blue-200">
                      <span className="text-[9.5px] text-blue-600 block uppercase font-mono">预计耗时</span>
                      <span className="text-lg font-black text-blue-900 leading-none">{navigationPath.durationMin} <span className="text-xs font-normal">分钟</span></span>
                    </div>
                  </div>

                  {/* Navigation steps directions timeline */}
                  <div className="space-y-2">
                    <span className="text-[9.5px] text-gray-400 font-bold block uppercase">详细换乘及路线行动指引:</span>
                    
                    <div className="relative border-l border-gray-200 ml-2.5 pl-4 space-y-3 pb-1">
                      {navigationPath.steps.map((step, idx) => {
                        const isLast = idx === navigationPath.steps.length - 1;
                        return (
                          <div key={idx} className="relative">
                            {/* Circle pointer */}
                            <span className={`absolute -left-[21px] top-0.5 w-2.5 h-2.5 rounded-full border-2 ${
                              isLast ? 'bg-orange-500 border-orange-500' : 'bg-blue-500 border-white'
                            }`} />
                            
                            <div className="text-xs">
                              <p className={`font-semibold ${isLast ? 'text-orange-600 font-bold' : 'text-gray-800'}`}>
                                {step.instruction}
                              </p>
                              {step.distanceText && (
                                <span className="text-[9.5px] text-gray-400 font-mono mt-0.5 inline-block bg-gray-100 px-1 rounded">
                                  {step.distanceText}
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                  </div>

                </div>
              ) : (
                <div className="text-center py-6 text-red-500 text-xs font-bold">
                  ⚠️ 无法计算路径！请确任授课地标和学生住址有效。
                </div>
              )}

            </div>

            {/* Footer buttons */}
            <div className="px-5 py-4 bg-gray-50 border-t border-gray-150 flex justify-end gap-2 shrink-0">
              <button
                id="back-list-from-navigation-btn"
                onClick={() => setIsNavigating(false)}
                className="px-5 py-2 border border-gray-200 rounded text-xs text-gray-600 hover:bg-gray-100 font-semibold cursor-pointer"
              >
                关闭
              </button>
              <button
                onClick={() => {
                  alert(`已成功为您规划路线，整装出发！耗时约 ${navigationPath?.durationMin}分钟。对接人老师：${selectedOrder.contactTeacher}`);
                  setIsNavigating(false);
                }}
                className="px-5 py-2 bg-blue-500 text-white font-bold text-xs rounded hover:bg-blue-600 transition-all cursor-pointer"
              >
                开始导航出行
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 4: CONTACT WECHAT POPUP (一键唤起固定微信二维码，扫码添加) */}
      {isWeChatModalOpen && selectedOrder && (
        <div id="wechat-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => { setIsWeChatModalOpen(false); setIsQRCodeLoaded(false); }} />
          
          <div className="bg-white rounded-xl shadow-2xl border border-gray-100 max-w-sm w-full z-10 overflow-hidden flex flex-col relative animate-scale-up">
            
            {/* Header */}
            <div className="px-5 py-3 border-b border-gray-150 bg-gray-50 flex justify-between items-center text-xs font-bold leading-none select-none text-gray-700">
              <span>扫码添加小德专属微信</span>
              <button 
                onClick={() => { setIsWeChatModalOpen(false); setIsQRCodeLoaded(false); }}
                className="p-1 rounded-full text-gray-400 hover:bg-gray-200 transition-colors"
                id="close-wechat-modal-btn"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* QR Content */}
            <div className="p-6 text-center flex flex-col items-center">
              
              <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center border-2 border-orange-200 shadow-md">
                <span className="text-2xl">👩‍🏫</span>
              </div>

              <h4 className="font-bold text-gray-800 text-sm mt-3 leading-tight">
                小德专属直招通道
              </h4>
              <p className="text-[10px] text-gray-400 mt-1">
                请截屏或拿出手机直接扫描下方微信二维码添加
              </p>

              {/* WECHAT QR CODE */}
              <div className="w-48 h-48 border-2 border-orange-100 rounded-md my-4 p-2 bg-neutral-50 relative flex flex-col items-center justify-center select-none shadow-inner overflow-hidden">
                <img
                  src="/wechat-qr.png"
                  alt="小德微信二维码"
                  className="w-full h-full object-contain relative z-10"
                  onLoad={(e) => {
                    (e.target as HTMLImageElement).style.opacity = '1';
                    setIsQRCodeLoaded(true);
                  }}
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                    (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="flex items-center justify-center w-full h-full text-gray-400 text-xs">请添加 wechat-qr.png 图片</div>';
                  }}
                  style={{ opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
                />
                {!isQRCodeLoaded && (
                  <div className="absolute inset-0 bg-neutral-100 flex items-center justify-center z-0">
                    <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              {/* Text WeChat ID list for manual copy */}
              <div className="bg-gray-100 rounded-lg p-2.5 flex items-center justify-between gap-3 w-full border border-gray-200">
                <div className="text-left font-mono text-[11px] leading-snug">
                  <span className="text-gray-400 text-[9px] block uppercase font-sans">微信搜索联系:</span>
                  <span className="font-bold text-gray-800">Ken06103</span>
                </div>
                <button
                  onClick={handleCopyWeChatID}
                  className={`px-3 py-1.5 rounded text-[10px] font-bold transition-all shrink-0 ${
                    copyFeedback 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                  }`}
                >
                  {copyFeedback ? '已复制！' : '复制微信号'}
                </button>
              </div>

              {/* Important application note */}
              <p className="text-[10px] text-neutral-500 mt-3 leading-relaxed bg-orange-50/50 p-2 text-left rounded border border-orange-100">
                🔒 接单提示：添加小德，备注来意，然后直接发送您看上的家教单完整信息+个人简历+报价+可上课时间即可！
              </p>

            </div>

          </div>
        </div>
      )}

      {/* MODAL 5: MOBILE ORDER DETAIL FULLSCREEN POPUP */}
      {isMobileDetailModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col md:hidden">
          {/* Header */}
          <div className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0">
            <button
              onClick={() => setIsMobileDetailModalOpen(false)}
              className="p-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="text-sm font-bold text-gray-900">订单详情</h2>
            <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-full animate-pulse">
              正在招生 ⚡
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Subject info */}
            <div className="flex items-start gap-3 bg-neutral-50 p-3 rounded-xl border border-gray-100">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center text-lg shrink-0">
                📚
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[10px] text-gray-400 font-semibold">辅导科目 / 学段年级</div>
                <div className="text-sm font-bold text-neutral-800 mt-0.5 flex items-center gap-1.5">
                  <span>{selectedOrder.district} {selectedOrder.grade} {selectedOrder.subject}</span>
                  {selectedOrder.isOnline && (
                    <span className="bg-blue-50 text-blue-600 text-[9px] px-1 rounded border border-blue-200 font-medium">全线上</span>
                  )}
                </div>
              </div>
            </div>

            {/* Price & Distance */}
            <div className="grid grid-cols-2 gap-3 border-y border-gray-100 py-3">
              <div>
                <div className="text-[9px] text-gray-400 font-bold uppercase">课时费用</div>
                <div className="text-lg font-black text-orange-600 mt-1 flex items-baseline">
                  {selectedOrder.isNegotiable ? (
                    <span className="text-sm font-bold text-teal-600">教员协商报价</span>
                  ) : selectedOrder.priceText ? (
                    <span className="text-lg">{selectedOrder.priceText}</span>
                  ) : (
                    <>
                      <span className="text-xs font-semibold">¥</span>
                      <span className="text-xl">{selectedOrder.price}</span>
                      <span className="text-xs text-gray-450 ml-1">/小时</span>
                    </>
                  )}
                </div>
              </div>
              <div>
                <div className="text-[9px] text-gray-400 font-bold uppercase">预估距离</div>
                <div className="text-xs font-semibold text-neutral-800 mt-1.5">
                  {currentLandmark ? (
                    selectedOrder.isOnline ? (
                      <span className="text-emerald-600 font-bold">免通勤</span>
                    ) : (
                      <span>{getDistance(currentLandmark.coordinate.lat, currentLandmark.coordinate.lng, selectedOrder.coordinate.lat, selectedOrder.coordinate.lng)}km</span>
                    )
                  ) : (
                    <span className="text-red-500 font-semibold text-[10px]" onClick={() => { setIsMobileDetailModalOpen(false); setIsLandmarkModalOpen(true); }}>请先设置地标</span>
                  )}
                </div>
              </div>
            </div>

            {/* Student info */}
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase">学生学习基础</h4>
              <div className="bg-neutral-50 px-3 py-2.5 rounded-lg text-[11px] leading-relaxed text-gray-700 border border-neutral-100">
                <p className="font-semibold mb-1">{selectedOrder.studentDesc}</p>
                <p className="text-gray-600">{selectedOrder.studentDetail}</p>
              </div>
            </div>

            {/* Frequency & Address */}
            <div className="grid grid-cols-1 gap-3">
              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-1">上课频次</h4>
                <div className="bg-neutral-50 px-2.5 py-2 rounded text-[11px] font-medium text-gray-750 border border-neutral-100 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                  <span>{selectedOrder.frequency}</span>
                </div>
              </div>
              <div>
                <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-1">授课地点</h4>
                <div className="bg-neutral-50 px-2.5 py-2 rounded text-[11px] font-medium text-gray-750 border border-neutral-100 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  <span>{selectedOrder.address}</span>
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="space-y-1">
              <h4 className="text-[10px] font-bold text-gray-400 uppercase">教员要求</h4>
              <ul className="bg-blue-50/50 border border-blue-100/50 p-3 rounded-lg text-[11px] text-blue-900 leading-relaxed">
                <li className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                  <span>{selectedOrder.requirements}</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex gap-2.5 shrink-0">
            <button
              onClick={() => {
                if (!currentLandmark) {
                  setIsLandmarkModalOpen(true);
                  return;
                }
                setIsMobileDetailModalOpen(false);
                setIsNavigating(true);
              }}
              className="flex-1 py-2.5 bg-white border border-gray-300 rounded font-bold text-xs flex items-center justify-center gap-1.5 text-gray-700"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-500" />
              <span>查看路线</span>
            </button>
            <button
              onClick={() => {
                setIsMobileDetailModalOpen(false);
                setIsWeChatModalOpen(true);
              }}
              className="flex-1 py-2.5 bg-orange-500 text-white rounded font-bold text-xs flex items-center justify-center gap-1.5"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>添加微信领单</span>
            </button>
          </div>
        </div>
      )}

      {/* Feedback Limit Alert */}
      {feedbackLimitAlert && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2.5 rounded-xl bg-red-500 text-white shadow-xl z-[60] flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-bold">每个用户最多只能提交 {MAX_FEEDBACK_COUNT} 次反馈，感谢您的支持！</span>
        </div>
      )}

      {/* Feedback Success Alert */}
      {feedbackSuccessAlert && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2.5 rounded-xl bg-green-500 text-white shadow-xl z-[60] flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span className="text-sm font-bold">反馈提交成功，感谢您的宝贵建议！</span>
        </div>
      )}

      {/* Feedback Modal */}
      {isFeedbackModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-500" />
                <h3 className="font-bold text-gray-800">意见反馈</h3>
              </div>
              <button onClick={() => setIsFeedbackModalOpen(false)} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-500 mb-3">
                感谢您的反馈！请告诉我们您的意见或建议，帮助我们做得更好。
              </p>
              <p className="text-xs text-orange-500 mb-3 font-semibold">
                剩余反馈次数：{MAX_FEEDBACK_COUNT - feedbacks.length} / {MAX_FEEDBACK_COUNT}
              </p>
              <textarea
                value={feedbackContent}
                onChange={(e) => setFeedbackContent(e.target.value)}
                placeholder="请输入您的反馈内容..."
                className="w-full h-32 p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    submitFeedback();
                  }
                }}
              />
              <div className="flex justify-end gap-2 mt-4">
                <button
                  onClick={() => setIsFeedbackModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={submitFeedback}
                  disabled={!feedbackContent.trim() || feedbacks.length >= MAX_FEEDBACK_COUNT}
                  className="px-4 py-2 text-sm font-semibold bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                >
                  提交反馈
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
