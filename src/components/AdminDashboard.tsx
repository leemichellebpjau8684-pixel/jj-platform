import React, { useState, useMemo, useEffect } from 'react';
import { 
  Check, X, FileText, AlertTriangle, Play, RefreshCw, Trash2, 
  Search, ShieldCheck, LogIn, ChevronRight, CornerDownRight, CheckSquare, 
  Square, Info, Activity, Database, Calendar, Clock, DollarSign, MapPin,
  HelpCircle, Loader, RotateCcw
} from 'lucide-react';
import { Order, Coordinate } from '../types';
import { SHANGHAI_DISTRICTS, SUBJECTS, GRADES } from '../data';
import { api } from '../services/api';

// 从raw_content中提取订单编号
function extractOrderNo(rawContent: string | undefined): string {
  if (!rawContent) return '';
  const match = rawContent.match(/(?:家教编号[：:]\s*)?([A-Z]{2}\d{6,}|\d{6,}|[A-Za-z]?\d{3,}[A-Za-z0-9-#]*|[A-Za-z][A-Za-z0-9-#]*\d{3,})/i);
  if (match) {
    return match[1].toUpperCase();
  }
  return '';
}

//上海各区中心坐标字典用于新解析订单自动定位映射
export const DISTRICT_CENTERS: Record<string, Coordinate> = {
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
  '崇明区': { lat: 31.6225, lng: 121.3975 }
};

import { Feedback } from '../types';

interface AdminDashboardProps {
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
  drafts: Order[];
  setDrafts: React.Dispatch<React.SetStateAction<Order[]>>;
  archives: Order[];
  setArchives: React.Dispatch<React.SetStateAction<Order[]>>;
  stats: any;
  setStats: React.Dispatch<React.SetStateAction<any>>;
  onBackToUser: () => void;
  feedbacks: Feedback[];
  markFeedbackAsRead: (feedbackId: string) => void;
  deleteFeedback: (feedbackId: string) => void;
}

export default function AdminDashboard({
  orders,
  setOrders,
  drafts,
  setDrafts,
  archives,
  setArchives,
  stats,
  setStats,
  onBackToUser,
  feedbacks,
  markFeedbackAsRead,
  deleteFeedback
}: AdminDashboardProps) {
  // 1. Authentication passcode system
  const [password, setPassword] = useState('');
  const [errorPrompt, setErrorPrompt] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return api.isAuthenticated();
  });
  const [isVerifying, setIsVerifying] = useState(true);

  const verifyAdmin = async () => {
    if (!api.isAuthenticated()) {
      setIsVerifying(false);
      return;
    }
    try {
      const isValid = await api.verifyToken();
      setIsAuthenticated(isValid);
      if (!isValid) {
        setErrorPrompt('登录已过期，请重新登录');
      }
    } catch {
      setIsAuthenticated(false);
      setErrorPrompt('验证失败，请重新登录');
    } finally {
      setIsVerifying(false);
    }
  };

  useEffect(() => {
    verifyAdmin();
  }, []);

  const handleLogin = async () => {
    setErrorPrompt('');
    try {
      const response = await api.login('admin', password);
      if (response.success && response.token) {
        setIsAuthenticated(true);
        triggerAlert('登录成功！', 'success');
      } else {
        setErrorPrompt(response.error || '登录失败');
      }
    } catch (err: any) {
      setErrorPrompt(err.message || '登录失败');
    }
  };

  const handleLogout = () => {
    api.logout();
    setIsAuthenticated(false);
    setPassword('');
    triggerAlert('已退出登录', 'info');
  };

  const handlePasswordKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleLogin();
    }
  };

  // 2. Tab Navigation
  const [adminTab, setAdminTab] = useState<'draft' | 'online' | 'archive'>('draft');

  // Input raw WeChat paste zone
  const [rawText, setRawText] = useState('');

  // Editing state for selected item details
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [selectedOnlineId, setSelectedOnlineId] = useState<string | null>(null);
  
  // Checking states for batch operations
  const [selectedDraftIds, setSelectedDraftIds] = useState<string[]>([]);
  const [selectedOnlineIds, setSelectedOnlineIds] = useState<string[]>([]);

  // Local Search Filters inside Admin Panel
  const [onlineSearchId, setOnlineSearchId] = useState('');
  const [onlineSearchDistrict, setOnlineSearchDistrict] = useState('全部');
  const [onlineSearchSubject, setOnlineSearchSubject] = useState('全部');

  // Archive Search Filters
  const [archiveSearchKeyword, setArchiveSearchKeyword] = useState('');
  const [archiveSearchDistrict, setArchiveSearchDistrict] = useState('全部');
  const [archiveSearchSubject, setArchiveSearchSubject] = useState('全部');

  // Pagination state
  const [onlinePage, setOnlinePage] = useState(1);
  const [archivePage, setArchivePage] = useState(1);
  const ONLINE_PER_PAGE = 20;
  const ARCHIVE_PER_PAGE = 20;
  
  // Archive batch delete states
  const [selectedArchiveIds, setSelectedArchiveIds] = useState<string[]>([]);
  const [showArchiveDeleteConfirm, setShowArchiveDeleteConfirm] = useState(false);

  // Feedback notifications
  const [alertInfo, setAlertInfo] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const triggerAlert = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setAlertInfo({ text, type });
    setTimeout(() => setAlertInfo(null), 3000);
  };

  // ----------------------------------------------------
  // INTELLIGENT REGEX TEXT PARSER (一键智能拆单解析)
  // ----------------------------------------------------
  const handleSmartParse = async () => {
    if (!rawText.trim()) {
      triggerAlert('请输入需要解析的微信段落文本！', 'error');
      return;
    }

    // Split raw text into individual blocks by looking for order number patterns first
    // Primary patterns: 【数字】号信息, 🌙【数字】, 【订单编号】, SH-2026, etc.
    const rawBlocks = rawText
      .split(/\n\s*\n|(?=🌙【\d+】)|(?=【\d+】号信息)|(?=【\d+】)|(?=家教编号[:：])|(?=订单编号[:：])|(?=编号[:：])|(?=【订单)|(?=SH-2026)/gi)
      .map(b => b.trim())
      .filter(b => b.length > 8);

    if (rawBlocks.length === 0) {
      triggerAlert('未拆分出有效段落，请检查文本格式', 'error');
      return;
    }

    const parsedList: Order[] = [];
    const failedBlocks: { block: string; reason: string }[] = [];
    const now = new Date();
    const timestampStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    rawBlocks.forEach((block, index) => {
      const lines = block.split('\n').filter(line => line.trim().length > 0);
      
      // 1. Analyze Order ID - 使用新的识别规则
      // 条件：①含字母 ②有至少3位连续数字 ③带"号"字
      // 编号：满足至少2个条件的行的全部内容
      let orderId = '';
      let idLine = '';
      
      // 检查每一行是否满足条件
      const checkLineConditions = (line: string): { hasLetter: boolean; hasDigits: boolean; hasHao: boolean; score: number } => {
        const hasLetter = /[a-zA-Z]/.test(line);
        const hasDigits = /\d{3,}/.test(line); // 至少3位连续数字
        const hasHao = /号/.test(line);
        const score = (hasLetter ? 1 : 0) + (hasDigits ? 1 : 0) + (hasHao ? 1 : 0);
        return { hasLetter, hasDigits, hasHao, score };
      };
      
      // 找到满足至少2个条件的行
      for (const line of lines) {
        const conditions = checkLineConditions(line);
        if (conditions.score >= 2) {
          idLine = line.trim();
          // 从该行提取编号部分（去掉"号"字后面的内容）
          const haoMatch = line.match(/([A-Za-z0-9-#]+)号/);
          if (haoMatch) {
            orderId = haoMatch[1];
          } else {
            // 如果没有"号"字，提取字母+数字组合
            const idMatch = line.match(/[A-Za-z]?\d{3,}[A-Za-z0-9-#]*|[A-Za-z][A-Za-z0-9-#]*\d{3,}/);
            if (idMatch) {
              orderId = idMatch[0];
            } else {
              // 提取所有字母和数字组合
              const allMatch = line.match(/[A-Za-z0-9-#]+/);
              if (allMatch) {
                orderId = allMatch[0];
              }
            }
          }
          break;
        }
      }
      
      // 如果仍然没有找到订单ID，尝试从标题行中提取（如"暑假单261101" → 261101）
      if (!orderId) {
        // 查找可能包含订单编号的标题行（如"暑假单261101"）
        const titlePatterns = [
          /([A-Za-z\u4e00-\u9fa5]+)[^\d]*(\d{5,})/,  // 匹配"暑假单261101"
          /(\d{5,})/,  // 直接匹配5位以上数字
        ];
        
        for (const line of lines) {
          for (const pattern of titlePatterns) {
            const match = line.match(pattern);
            if (match) {
              // 取最后匹配的数字作为订单ID
              const numMatch = line.match(/\d{5,}/);
              if (numMatch) {
                orderId = numMatch[0];
                idLine = line.trim();
                break;
              }
            }
          }
          if (orderId) break;
        }
      }
      
      // 如果还没有，尝试传统方式匹配
      if (!orderId) {
        // First, check for bracket number patterns like 【762129】 or 🌙【818272】号信息
        const bracketIdMatch = block.match(/【(\d+)】/);
        if (bracketIdMatch) {
          orderId = bracketIdMatch[1];
          const idLineIndex = lines.findIndex(line => line.includes('【'));
          if (idLineIndex >= 0) {
            idLine = lines[idLineIndex].trim();
          }
        }
      }
      
      // If not found, check for explicit ID patterns (家教编号：xxx#yyy 格式)
      if (!orderId) {
        const explicitIdMatch = block.match(/(?:家教编号|订单编号|编号)[:：\s]*([A-Za-z0-9-#]+)/i);
        if (explicitIdMatch) {
          orderId = explicitIdMatch[1];
          const idLineIndex = lines.findIndex(line => line.match(/(家教编号|订单编号|编号)/));
          if (idLineIndex >= 0) {
            idLine = lines[idLineIndex].trim();
          }
        }
      }
      
      // If no valid ID found, add to failed list
      if (!orderId) {
        failedBlocks.push({ block, reason: '未找到可识别的订单编号' });
        return;
      }

      // Check for duplicate with existing orders (by order_no first, then by id)
      const existingOrderByNo = orders.find(o => o.order_no === orderId || o.order_no === orderId.replace(/-/g, ''));
      const existingDraftByNo = drafts.find(o => o.orderId === orderId || o.orderId === orderId.replace(/-/g, ''));
      const existingOrderById = orders.find(o => o.id === orderId);
      const existingDraftById = drafts.find(o => o.id === orderId);

      if (existingOrderByNo) {
        // Found existing active order with same order number - add to failed list
        const duplicateId = existingOrderByNo.order_no || orderId;
        failedBlocks.push({ block, reason: `家教编号 ${duplicateId} 的订单已在售，请检查修改后重试` });
        return;
      } else if (existingDraftByNo) {
        // Found existing draft with same order number - add to failed list
        const duplicateId = existingDraftByNo.orderId || orderId;
        failedBlocks.push({ block, reason: `家教编号 ${duplicateId} 的订单已在草稿中` });
        return;
      } else if (existingOrderById) {
        // Found existing active order with same ID - add to failed list
        failedBlocks.push({ block, reason: `订单 ${orderId} 已存在于在售列表` });
        return;
      } else if (existingDraftById) {
        // Found existing draft with same ID - add to failed list
        failedBlocks.push({ block, reason: `订单 ${orderId} 已存在于草稿列表` });
        return;
      }

      // Eliminate overlapping id - append suffix if duplicate
      let finalOrderId = orderId;
      let suffix = 1;
      while (parsedList.some(o => o.id === finalOrderId)) {
        finalOrderId = `${orderId}-${suffix}`;
        suffix++;
      }
      orderId = finalOrderId;

      // Extract raw content (content without the id line)
      let rawContent = '';
      if (idLine) {
        rawContent = block.replace(idLine, '').trim();
      } else {
        rawContent = block.trim();
      }
      if (!rawContent) {
        rawContent = block.trim();
      }

      // 2. Area/District
      let area = '';
      
      // Check for online tutoring first
      if (block.includes('线上') || block.includes('网课') || block.includes('远程') || block.includes('视频')) {
        area = '线上';
      } else {
        // Try to match full district name (with "区" suffix)
        for (const d of SHANGHAI_DISTRICTS) {
          if (block.includes(d)) {
            area = d;
            break;
          }
        }
        
        // If not found, try to match without "区" suffix (e.g., "长宁" -> "长宁区")
        // Priority: longer matches first (e.g., "浦东新区" before "浦东")
        if (!area) {
          const sortedDistricts = [...SHANGHAI_DISTRICTS].filter(d => d !== '线上').sort((a, b) => b.length - a.length);
          for (const d of sortedDistricts) {
            const shortName = d.replace('区', '');
            if (shortName && block.includes(shortName)) {
              area = d;
              break;
            }
          }
        }
        
        // Special handling for "浦东" -> "浦东新区"
        if (!area && (block.includes('浦东') || block.includes('陆家嘴') || block.includes('张江') || block.includes('金桥') || block.includes('外高桥') || block.includes('南汇'))) {
          area = '浦东新区';
        }
      }
      
      // If not clearly identified, default to empty to highlight the red visual error later!
      
      // 3. Subject & Grade
      let mathGrade = '其他';
      let gradeDetail = '';
      
      // Check for age patterns like "xx岁" where xx < 10
      const ageMatch = block.match(/(\d{1,2})岁/);
      if (ageMatch) {
        const age = parseInt(ageMatch[1], 10);
        if (age > 0 && age < 10) {
          mathGrade = '幼儿';
          gradeDetail = `${age}岁`;
        }
      }
      
      // Check for kindergarten/early education keywords
      if (mathGrade === '其他' && (block.includes('幼') || block.includes('启蒙') || block.includes('幼儿园') || block.includes('学前'))) {
        mathGrade = '幼儿';
        const kindergartenMatch = block.match(/(小班|中班|大班|学前班)/);
        if (kindergartenMatch) {
          gradeDetail = kindergartenMatch[1];
        }
      }
      
      // Check for adult education
      if (mathGrade === '其他' && block.includes('成人')) {
        mathGrade = '成人';
      }
      
      // Check for grade level keywords with detailed extraction
      if (mathGrade === '其他') {
        // 小学判断：包含小学关键词或小学年级升级关键词
        if (block.includes('小学') || 
            block.includes('一年级') || block.includes('二年级') || 
            block.includes('三年级') || block.includes('四年级') || 
            block.includes('五年级') || block.includes('六年级') ||
            block.match(/\d年级/)?.[0]?.startsWith('1') ||
            block.match(/\d年级/)?.[0]?.startsWith('2') ||
            block.match(/\d年级/)?.[0]?.startsWith('3') ||
            block.match(/\d年级/)?.[0]?.startsWith('4') ||
            block.match(/\d年级/)?.[0]?.startsWith('5') ||
            block.includes('二升三') || block.includes('三升四') || 
            block.includes('四升五') || block.includes('五升六')) {
          mathGrade = '小学';
          const gradeMatch = block.match(/(一|二|三|四|五|六)年级/) || 
                            block.match(/(\d)年级/) ||
                            block.match(/(二升三|三升四|四升五|五升六)/);
          if (gradeMatch) {
            gradeDetail = gradeMatch[0];
          }
        // 初中判断：包含初中关键词或初中年级升级关键词
        } else if (block.includes('初中') || block.includes('初一') || 
                   block.includes('初二') || block.includes('初三') ||
                   block.includes('七年级') || block.includes('八年级') || 
                   block.includes('九年级') ||
                   block.includes('预初一') || block.includes('预备初一') ||
                   block.includes('六升七') || block.includes('七升八') || 
                   block.includes('八升九')) {
          mathGrade = '初中';
          const gradeMatch = block.match(/(初一|初二|初三|七|八|九)年级/) ||
                            block.match(/(六升七|七升八|八升九)/) ||
                            block.match(/(预初一|预备初一)/);
          if (gradeMatch) {
            gradeDetail = gradeMatch[0];
          }
        } else if (block.includes('高中') || block.includes('高一') || 
                   block.includes('高二') || block.includes('高三') ||
                   block.includes('高考')) {
          mathGrade = '高中';
          const gradeMatch = block.match(/(高一|高二|高三)/) ||
                            block.match(/(高一升高二|高二升高三)/);
          if (gradeMatch) {
            gradeDetail = gradeMatch[0];
          }
        }
      }

      let subName = '';
      
      // Extract subject from 辅导科目 field if present
      const subjectMatch = block.match(/(?:辅导科目|科目|学科)[:：\s]*(.+?)(?:[，,。\n]|$)/);
      let subjectContent = '';
      if (subjectMatch) {
        subjectContent = subjectMatch[1].trim();
      }
      
      // Parse subject content to extract standard subjects
      if (subjectContent) {
        const matchedSubjects: string[] = [];
        
        // Check for 全科 first
        if (subjectContent.includes('全科')) {
          matchedSubjects.push('全科');
        }
        
        // Check for subjects from SUBJECTS list
        for (const s of SUBJECTS) {
          if (s !== '未识别' && s !== '全科' && s !== '作业辅导' && s !== '外语' && subjectContent.includes(s)) {
            if (!matchedSubjects.includes(s)) {
              matchedSubjects.push(s);
            }
          }
        }
        
        // Check for character-based matches
        if (subjectContent.includes('数') && !matchedSubjects.includes('数学')) matchedSubjects.push('数学');
        if (subjectContent.includes('英') && !matchedSubjects.includes('英语')) matchedSubjects.push('英语');
        if (subjectContent.includes('语') && !matchedSubjects.includes('语文') && !subjectContent.includes('英语')) matchedSubjects.push('语文');
        if (subjectContent.includes('理') && !matchedSubjects.includes('物理')) matchedSubjects.push('物理');
        if (subjectContent.includes('化') && !matchedSubjects.includes('化学')) matchedSubjects.push('化学');
        if (subjectContent.includes('陪') && !matchedSubjects.includes('陪读')) matchedSubjects.push('陪读');
        
        // If matched subjects found, join them; otherwise use original content
        subName = matchedSubjects.length > 0 ? matchedSubjects.join('') : subjectContent;
      } else {
        // Only use matching logic when no explicit subject field is found
        const matchedSubjects: string[] = [];
        
        // Check 作业辅导 first (special case)
        if (block.includes('作业')) {
          matchedSubjects.push('作业辅导');
        }
        
        // Check for foreign languages (other than English)
        const foreignLanguages = ['德语', '法语', '日语', '韩语', '西班牙语', '俄语', '阿拉伯语', '葡萄牙语', '意大利语', '泰语', '越南语'];
        const hasForeignLanguage = foreignLanguages.some(lang => block.includes(lang));
        if (hasForeignLanguage) {
          matchedSubjects.push('外语');
        }
        
        // Match other subjects from SUBJECTS list
        for (const s of SUBJECTS) {
          if (s !== '未识别' && s !== '作业辅导' && s !== '外语' && block.includes(s)) {
            if (!matchedSubjects.includes(s)) {
              matchedSubjects.push(s);
            }
          }
        }
        
        // If matched subjects found, join them
        if (matchedSubjects.length > 0) {
          subName = matchedSubjects.join('');
        } else {
          // Fallback: single character matches (avoid easily confused characters)
          const charMatches: string[] = [];
          if (block.includes('数')) charMatches.push('数学');
          if (block.includes('英')) charMatches.push('英语');
          if (block.includes('理')) charMatches.push('物理');
          if (block.includes('化')) charMatches.push('化学');
          if (block.includes('语')) charMatches.push('语文');
          if (block.includes('史')) charMatches.push('历史');
          if (block.includes('生')) charMatches.push('生物');
          if (block.includes('政')) charMatches.push('政治');
          if (block.includes('艺')) charMatches.push('艺术');
          if (block.includes('体')) charMatches.push('体育');
          if (block.includes('奥')) charMatches.push('奥数');
          if (block.includes('陪')) charMatches.push('陪读');
          if (block.includes('全科')) charMatches.push('全科');
          
          if (charMatches.length > 0) {
            subName = charMatches.join('');
          } else {
            subName = '未识别'; // Default fallback: 未识别
          }
        }
      }

      // 4. Price / Hour Rate (Salary)
      let priceRate = 0;
      let priceMin = 0;
      let priceMax = 0;
      let priceTextDisplay = '';
      
      // Only extract price from lines containing price-related keywords to avoid matching order IDs
      const priceLines = block.split('\n').filter(line => 
        line.includes('元') || line.includes('薪资') || line.includes('时薪') || 
        line.includes('报酬') || line.includes('价格') || line.includes('薪水') ||
        line.includes('/h') || line.includes('小时') || line.includes('天') || line.includes('月') ||
        line.includes('课')
      );
      const priceText = priceLines.join(' ');
      
      // Pattern to capture salary range with unit (e.g., "5000-7000/月", "100-130/h", "100-120元/小时")
      const rangePattern = /(\d{2,5})-(\d{2,5})\s*元?\s*\/?\s*(h|月|天|小时)?/i;
      const rangeMatch = priceText.match(rangePattern);
      
      if (rangeMatch) {
        // Extract range values
        const minVal = parseInt(rangeMatch[1], 10);
        const maxVal = parseInt(rangeMatch[2], 10);
        const unit = rangeMatch[3] || '小时';
        priceMin = minVal;
        priceMax = maxVal;
        priceTextDisplay = `${minVal}-${maxVal}/h`;
        priceRate = maxVal;
        // Convert to hourly equivalent for sorting
        if (unit === '月') {
          priceRate = Math.round(maxVal / (22 * 8));
        } else if (unit === '天') {
          priceRate = Math.round(maxVal / 8);
        }
      } else {
        // Try single value patterns
        const singlePatterns = [
          /(\d{2,5})\s*元\s*\/\s*h/i,           // xx元/h
          /(\d{2,5})\s*元\s*\/\s*小时/i,        // xx元/小时
          /(\d{2,5})\s*\/\s*小时/i,             // xx/小时 (without 元)
          /(\d{2,5})\s*元\s*\/\s*月/i,          // xx元/月
          /(\d{2,5})\s*元\s*\/\s*天/i,          // xx元/天
          /(\d{2,5})\s*\/\s*h/i,                // xx/h
          /(\d{2,5})\s*\/\s*月/i,               // xx/月
          /(\d{2,5})\s*\/\s*天/i,               // xx/天
          /(\d{2,5})\s*\/\s*2h/i,               // xx/2h
          /(\d{2,5})\s*元\s*\/\s*2h/i,          // xx元/2h
          /(\d{2,5})\s*元\s*2\s*小时/i,         // xx元2小时
          /(\d{2,5})\s*元\s*两\s*小时/i,        // xx元两小时
          /(\d{2,5})\s*两\s*小时/i,             // xx两小时
          /(\d{2,5})\s*2\s*小时/i,              // xx2小时
          /(\d{2,5})\s*\/\s*1\.5h/i,            // xx/1.5h
          /(\d{2,5})\s*元\s*\/\s*1\.5h/i,       // xx元/1.5h
          /(\d{2,5})\s*元\s*1\.5\s*小时/i,      // xx元1.5小时
          /(\d{2,5})\s*元\s*一点五\s*小时/i,    // xx元一点五小时
          /(\d{2,5})\s*1\.5\s*小时/i,           // xx1.5小时
          /(\d{2,5})\s*元\s*\/\s*次/i,          // xx元/次
          /(\d{2,5})\s*\/\s*次/i,               // xx/次
          /(\d{2,5})\s*元\s*一?次/i,            // xx元一次 / xx元次
          /(\d{2,5})\s*一?次/i,                 // xx一次 / xx次
          /(\d{2,5})\s*元\s*一?次课/i,          // xx元一次课 / xx元次课
          /(\d{2,5})\s*\/\s*课/i,               // xx/课
          /(\d{2,5})\s*元\s*\/\s*课/i,          // xx元/课
          /(\d{2,5})\s*元\s*一?节课/i,          // xx元一节课 / xx元节课
          /(?:薪资|时薪|薪水)[:：\s]*(\d{2,5})\s*(?:元|\/h|\/月|\/小时)?/i // 薪资/时薪/薪水: xx
        ];
        
        for (const pattern of singlePatterns) {
          const match = priceText.match(pattern);
          if (match) {
            const rawPrice = parseInt(match[1], 10);
            priceRate = rawPrice;
            priceMin = rawPrice;
            priceMax = rawPrice;
            // Extract the full match for display
            const fullMatchStr = match[0];
            // Clean up and format the display text
            if (fullMatchStr.includes('/h') && !fullMatchStr.includes('/2h') && !fullMatchStr.includes('/1.5h')) {
              priceTextDisplay = `${match[1]}/h`;
            } else if (fullMatchStr.includes('/2h')) {
              // xx/2h or xx元/2h - convert to hourly rate
              priceTextDisplay = `${match[1]}/2h`;
              priceRate = Math.round(priceRate / 2);
            } else if (fullMatchStr.includes('/1.5h') || fullMatchStr.includes('1.5小时') || fullMatchStr.includes('一点五小时')) {
              // xx/1.5h, xx元/1.5h, xx元1.5小时, xx元一点五小时 - convert to hourly rate
              priceTextDisplay = `${match[1]}/1.5h`;
              priceRate = Math.round(priceRate / 1.5);
            } else if (fullMatchStr.includes('2小时') || fullMatchStr.includes('两小时')) {
              // xx元2小时 or xx元两小时 - convert to hourly rate
              priceTextDisplay = `${match[1]}元/2h`;
              priceRate = Math.round(priceRate / 2);
            } else if (fullMatchStr.includes('/月')) {
              priceTextDisplay = `${match[1]}/月`;
              priceRate = Math.round(priceRate / (22 * 8));
            } else if (fullMatchStr.includes('/天')) {
              priceTextDisplay = `${match[1]}/天`;
              priceRate = Math.round(priceRate / 8);
            } else if (fullMatchStr.includes('/次') || fullMatchStr.includes('一次') || fullMatchStr.includes('次课')) {
              // xx/次, xx元/次, xx元一次, xx一次, xx元一次课
              priceTextDisplay = `${match[1]}元/次`;
            } else if (fullMatchStr.includes('/课') || fullMatchStr.includes('节课')) {
              // xx/课, xx元/课, xx元一节课
              priceTextDisplay = `${match[1]}元/课`;
            } else if (fullMatchStr.includes('元')) {
              // Default to hourly if only "元" is present
              priceTextDisplay = `${match[1]}元/h`;
            } else {
              priceTextDisplay = `${match[1]}/h`;
            }
            break;
          }
        }
      }

      // 5. Short description of student
      let studentDesc = '';
      const descMatch = block.match(/(?:学生简况|学生情况|学员情况)[:：\s]*(.+)/i);
      if (descMatch) {
        studentDesc = descMatch[1].trim();
      } else {
        // Extract first 45 chars
        studentDesc = block.split('\n')[0].replace(/#/g, '').replace(/订单编号[:：\s]*[A-Za-z0-9-]+/gi, '').trim();
        if (studentDesc.length > 55) {
          studentDesc = studentDesc.substring(0, 52) + '...';
        }
      }

      // 6. Address detail
      let addressDetail = '';
      const addrMatch = block.match(/(?:上课地点|地址|上课地址|辅导地点)[:：\s]*(.+?)(?=\s*[】\|\n]|$)/i);
      if (addrMatch) {
        addressDetail = addrMatch[1].trim().replace(/[】\|\s]+$/, '');
      } else {
        // Look for keywords of street or estate
        const lines = block.split('\n');
        // 增强地址识别，添加更多关键词
        const addrLine = lines.find(l => 
          l.includes('路') || l.includes('街') || l.includes('弄') || 
          l.includes('小区') || l.includes('公寓') || l.includes('号') ||
          l.includes('大厦') || l.includes('楼') || l.includes('广场') ||
          l.includes('镇') || l.includes('村') || l.includes('路')
        );
        if (addrLine) {
          addressDetail = addrLine.replace(/^(?:上课地点|地址|上课地址|辅导地点)[:：\s]*/, '').trim().replace(/[】\|\s]+$/, '');
          // 如果地址以"】"开头，去掉开头的符号
          if (addressDetail.startsWith('】')) {
            addressDetail = addressDetail.substring(1).trim();
          }
        } else {
          // 如果没有找到具体地址，但有行政区信息，显示行政区
          if (area && area !== '线上') {
            addressDetail = `${area}范围内`;
          } else {
            addressDetail = '根据上课地点待定';
          }
        }
      }

      // 7. Frequency/Schedule
      let scheduleText = '每周2次，每次2小时';
      const freqMatch = block.match(/(?:上课时间|频次|时间)[:：\s]*(.+?)(?=\s*[】\|\n]|$)/i);
      if (freqMatch) {
        scheduleText = freqMatch[1].trim().replace(/[】\|\s]+$/, '');
      }

      // 8. Teacher requirements
      let teachReq = '男女教员均可，要求相关辅导技能稳固，沟通表达亲近。';
      const reqMatch = block.match(/(?:教员要求|要求)[:：\s]*(.+?)(?=\s*[】\|\n]|$)/i);
      if (reqMatch) {
        teachReq = reqMatch[1].trim().replace(/[】\|\s]+$/, '');
      }

      // 9. Coordinate translation mapping
      const coord = area ? DISTRICT_CENTERS[area] : { lat: 31.2304, lng: 121.4737 }; // midpoint default

      const isHigh = priceRate >= 120;
      const isOnlineLoc = block.includes('线上') || addressDetail.includes('线上') || block.includes('网课');

      const itemModel: Order = {
        id: '',
        orderId: orderId,
        district: area, 
        grade: mathGrade,
        gradeDetail: gradeDetail,
        subject: subName,
        coordinate: coord,
        studentDesc: studentDesc || '学员学习细节待沟通',
        studentDetail: block.length > 150 ? block.substring(0, 150) + '...' : block,
        frequency: scheduleText,
        address: addressDetail,
        requirements: teachReq,
        price: priceRate,
        priceMin: priceMin,
        priceMax: priceMax,
        priceText: priceTextDisplay,
        isHighPrice: isHigh,
        isOnline: isOnlineLoc,
        isCollegeStudent: block.includes('大学生') || block.includes('女生') || block.includes('男生'),
        isNegotiable: block.includes('面议') || block.includes('协商') || (priceRate === 0 && !priceTextDisplay),
        contactTeacher: 'Ken06103',
        publishTime: timestampStr,
        rawContent: rawContent,
        idLine: idLine
      };

      parsedList.push(itemModel);
    });

    const successfullyCreated: Order[] = [];
    
    for (const draft of parsedList) {
      try {
        let customOrderNo = null;
        
        // First try to extract from idLine
        const orderNoMatch = draft.idLine?.match(/(家教编号|订单编号|编号)[:：\s]*([A-Za-z0-9-#]+)/i);
        if (orderNoMatch) {
          customOrderNo = orderNoMatch[2].split('#')[0];
        }
        
        // If not found, try from orderId in draft (already extracted during parsing)
        if (!customOrderNo && draft.orderId) {
          customOrderNo = draft.orderId.split('#')[0];
        }
        
        // If still not found, try from rawContent
        if (!customOrderNo && draft.rawContent) {
          const rawMatch = draft.rawContent.match(/(家教编号|订单编号|编号)[:：\s]*(\d{8,}[#\-]?\d*)/);
          if (rawMatch) {
            customOrderNo = rawMatch[2].split('#')[0];
          }
        }
        
        const createdOrder = await api.createOrder({
          title: draft.studentDesc,
          subject: draft.subject,
          education_stage: draft.grade,
          grade_detail: draft.gradeDetail,
          district: draft.district,
          address: draft.address,
          salary_min: draft.priceMin || draft.price,
          salary_max: draft.priceMax || draft.price,
          teaching_type: draft.isOnline ? '网课' : '上门',
          requirements: draft.requirements,
          source: '微信解析',
          raw_content: draft.rawContent,
          status: 'draft',
          order_no: customOrderNo
        });
        draft.id = createdOrder.id;
        draft.order_no = customOrderNo;
        successfullyCreated.push(draft);
      } catch (err: any) {
        console.error('创建订单失败:', err);
        console.error('发送的数据:', {
          title: draft.studentDesc,
          subject: draft.subject,
          education_stage: draft.grade,
          grade_detail: draft.gradeDetail,
          district: draft.district,
          address: draft.address,
          salary_min: draft.priceMin || draft.price,
          salary_max: draft.priceMax || draft.price,
          teaching_type: draft.isOnline ? '网课' : '上门',
          requirements: draft.requirements,
          source: '微信解析',
          raw_content: draft.rawContent,
          status: 'draft',
          order_no: draft.order_no || draft.orderId
        });
        console.error('后端响应:', err.response?.data);
        // 添加到失败列表
        const errorMsg = err.response?.data?.error || (err.response?.data?.errors?.join ? err.response?.data.errors.join(', ') : err.response?.data?.errors) || err.message || '创建订单失败';
        failedBlocks.push({ block: draft.rawContent, reason: `创建失败：${errorMsg}` });
      }
    }

    // 构建提示信息
    let alertMessage = '';
    let alertType: 'success' | 'error' | 'info' = 'success';

    if (successfullyCreated.length > 0) {
      setDrafts(prev => [...successfullyCreated, ...prev]);
      setSelectedDraftId(successfullyCreated[0]?.id || null);
      
      if (failedBlocks.length > 0) {
        alertMessage = `成功解析 ${successfullyCreated.length} 个订单！${failedBlocks.length} 个订单解析失败（内容已保留在下方框中）`;
        alertType = 'info';
      } else {
        alertMessage = `成功智能拆单解析 ${successfullyCreated.length} 个草稿订单！`;
        alertType = 'success';
      }
    } else {
      alertMessage = '所有订单创建失败，请检查数据格式';
      alertType = 'error';
    }
    
    triggerAlert(alertMessage, alertType);

    // 如果全部成功，清空粘贴框；失败时不清空，保留原始输入供用户修改
    if (failedBlocks.length === 0) {
      setRawText('');
    }
  };

  // Draft editing form state hooks
  const [editId, setEditId] = useState('');
  const [editDistrict, setEditDistrict] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editGrade, setEditGrade] = useState('高中');
  const [editSubject, setEditSubject] = useState('数学');
  const [editPrice, setEditPrice] = useState(100);
  const [editPriceText, setEditPriceText] = useState('');
  const [editStudentDesc, setEditStudentDesc] = useState('');
  const [editStudentDetail, setEditStudentDetail] = useState('');
  const [editFrequency, setEditFrequency] = useState('');
  const [editRequirements, setEditRequirements] = useState('');
  const [editOrderTag, setEditOrderTag] = useState('');
  const [showMobileEditor, setShowMobileEditor] = useState(false);

  // Hydrate fields when selected draft shifts
  const activeDraft = useMemo(() => {
    return drafts.find(d => d.id === selectedDraftId) || null;
  }, [selectedDraftId, drafts]);

  useEffect(() => {
    if (activeDraft) {
      const displayId = activeDraft.order_no || activeDraft.orderId || activeDraft.id;
      setEditId(displayId);
      setEditDistrict(activeDraft.district);
      setEditAddress(activeDraft.address);
      setEditGrade(activeDraft.grade);
      setEditSubject(activeDraft.subject);
      setEditPrice(activeDraft.price);
      setEditPriceText(activeDraft.priceText || '');
      setEditStudentDesc(activeDraft.studentDesc);
      setEditStudentDetail(activeDraft.studentDetail);
      setEditFrequency(activeDraft.frequency);
      setEditRequirements(activeDraft.requirements);
      // Generate some tag placeholder for custom tags
      setEditOrderTag(activeDraft.price >= 120 ? '高价火焰' : '普通辅导');
    } else {
      setEditId('');
      setEditDistrict('');
      setEditAddress('');
      setEditStudentDesc('');
      setEditStudentDetail('');
      setEditFrequency('');
      setEditRequirements('');
      setEditOrderTag('');
    }
  }, [activeDraft]);

  // Handle saving draft edit manually
  const handleSaveDraft = () => {
    if (!selectedDraftId) return;
    if (!editDistrict) {
      triggerAlert('行政区必填，请选中上海一个行政区', 'error');
      return;
    }

    setDrafts(prev => prev.map(d => {
      if (d.id === selectedDraftId) {
        const coord = DISTRICT_CENTERS[editDistrict] || d.coordinate;
        return {
          ...d,
          district: editDistrict,
          address: editAddress,
          grade: editGrade,
          subject: editSubject,
          price: Number(editPrice),
          priceText: editPriceText,
          isHighPrice: editPrice >= 120,
          studentDesc: editStudentDesc,
          studentDetail: editStudentDetail,
          frequency: editFrequency,
          requirements: editRequirements,
          coordinate: coord
        };
      }
      return d;
    }));
    triggerAlert('草稿修改保存成功！', 'info');
  };

  // ----------------------------------------------------
  // BATCH ACTIONS
  // ----------------------------------------------------

  // 1. Publish selected drafts (待审核草稿 -> online在售)
  const handleBatchPublish = async () => {
    if (selectedDraftIds.length === 0) {
      triggerAlert('请先在列表中勾选要上架的草稿订单！', 'error');
      return;
    }

    const itemsToPublish = drafts.filter(d => selectedDraftIds.includes(d.id));
    
    // 分类：已创建到后端的草稿 vs 未创建的草稿
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    const itemsNeedCreateFirst = itemsToPublish.filter(item => !uuidRegex.test(item.id));
    const itemsReadyToPublish = itemsToPublish.filter(item => uuidRegex.test(item.id));

    // 验证行政区
    const invalidItemsIndex = itemsToPublish.findIndex(item => !item.district);
    if (invalidItemsIndex !== -1) {
      triggerAlert(`订单 ${itemsToPublish[invalidItemsIndex].id} 的行政区和定位仍未分配，请先补充修改！`, 'error');
      return;
    }

    // 先创建未创建的草稿到后端，然后上架
    let totalSuccess = 0;
    const allItemIdsToPublish: string[] = [];

    // 已有的直接上架
    for (const item of itemsReadyToPublish) {
      allItemIdsToPublish.push(item.id);
    }

    // 新建的创建后上架
    for (const item of itemsNeedCreateFirst) {
      try {
        const created = await api.createOrder({
          title: item.studentDesc,
          subject: item.subject,
          education_stage: item.grade,
          grade_detail: item.gradeDetail,
          district: item.district,
          address: item.address,
          salary_min: item.priceMin || item.price,
          salary_max: item.priceMax || item.price,
          teaching_type: item.isOnline ? '网课' : '上门',
          requirements: item.requirements,
          source: '管理员手动创建',
          raw_content: item.rawContent,
          status: 'draft',
          order_no: item.order_no || item.orderId
        });
        
        // 更新本地草稿的id为后端返回的uuid
        setDrafts(prev => prev.map(d => d.id === item.id ? { ...d, id: created.id } : d));
        
        // 立即上架新建的订单
        await api.publishOrder(created.id);
        totalSuccess++;
      } catch (err) {
        console.error('创建/上架订单失败:', err);
      }
    }

    // 上架已有的订单
    for (const item of itemsReadyToPublish) {
      try {
        await api.publishOrder(item.id);
        totalSuccess++;
      } catch (err) {
        console.error('发布订单失败:', err);
      }
    }

    if (totalSuccess < itemsToPublish.length) {
      triggerAlert(`部分订单上架失败 (${totalSuccess}/${itemsToPublish.length})，请刷新页面后重试！`, 'error');
    } else {
      triggerAlert(`成功上架 ${totalSuccess} 个订单！`, 'success');
    }

    try {
      const serverOrders = await api.getOrders();
      const transformedOrders = serverOrders.map((order: any) => ({
        id: order.id,
        order_no: order.order_no,
        district: order.district,
        grade: order.education_stage + (order.grade_detail ? ` ${order.grade_detail}` : ''),
        gradeDetail: order.grade_detail,
        subject: order.subject,
        coordinate: {
          lat: order.latitude || 31.2304,
          lng: order.longitude || 121.4737
        },
        studentDesc: order.title || '学员信息待完善',
        studentDetail: order.raw_content || order.requirements || '暂无详细信息',
        frequency: '每周2次，每次2小时',
        address: order.address,
        requirements: order.requirements || '男女教员均可',
        price: order.salary_max || order.salary_min || 0,
        priceMin: order.salary_min,
        priceMax: order.salary_max,
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
        idLine: `家教编号：${order.order_no}`
      }));
      setOrders(transformedOrders);
    } catch (err) {
      console.error('重新加载订单失败:', err);
      setOrders(prev => [...itemsToPublish, ...prev]);
    }

    setDrafts(prev => prev.filter(d => !selectedDraftIds.includes(d.id)));

    const now = new Date();
    const nowTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    setStats((prev: any) => ({
      ...prev,
      todayAdded: prev.todayAdded + itemsToPublish.length,
      lastUpdated: nowTime
    }));

    setSelectedDraftIds([]);
    setSelectedDraftId(null);
    triggerAlert(`一键极速上架成功：${itemsToPublish.length} 个订单已在前台及地图实时生效！`, 'success');
  };

  // 2. Delete selected drafts (批量删除草稿)
  const handleBatchDeclineDrafts = () => {
    if (selectedDraftIds.length === 0) {
      triggerAlert('请先在左侧勾选需要删除的草稿！', 'error');
      return;
    }

    const itemsToDelete = drafts.filter(d => selectedDraftIds.includes(d.id));
    
    for (const item of itemsToDelete) {
      if (item.id) {
        api.deleteOrder(item.id).catch(() => {});
      }
    }

    setDrafts(prev => prev.filter(d => !selectedDraftIds.includes(d.id)));
    setSelectedDraftIds([]);
    setSelectedDraftId(null);
    triggerAlert(`已删除 ${itemsToDelete.length} 条草稿数据。`, 'info');
  };

  // 3. Take down active listings (在售订单批量下架&自省归档)
  const [showTakedownConfirm, setShowTakedownConfirm] = useState(false);
  const [takedownTargetId, setTakedownTargetId] = useState<string | null>(null);

  const handleTakedownConfirmAction = async () => {
    const listToTakedown = takedownTargetId 
      ? [takedownTargetId] 
      : selectedOnlineIds;

    if (listToTakedown.length === 0) {
      setShowTakedownConfirm(false);
      return;
    }

    for (const id of listToTakedown) {
      try {
        await api.archiveOrder(id);
      } catch (err) {
        console.error('归档订单失败:', err);
      }
    }

    const now = new Date();
    const nowTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const takedownItems = orders
      .filter(o => listToTakedown.includes(o.id))
      .map(item => ({ ...item, publishTime: nowTime }));

    setArchives(prev => [...takedownItems, ...prev]);
    setOrders(prev => prev.filter(o => !listToTakedown.includes(o.id)));

    setStats((prev: any) => ({
      ...prev,
      lastUpdated: nowTime
    }));

    if (takedownTargetId) {
      setSelectedOnlineIds(prev => prev.filter(id => id !== takedownTargetId));
      setTakedownTargetId(null);
    } else {
      setSelectedOnlineIds([]);
    }

    setShowTakedownConfirm(false);
    triggerAlert(`成功下架并归档 ${listToTakedown.length} 个在售订单！前台及地图已实时同步移除。`, 'success');
  };

  // Archive batch delete handler
  const handleArchiveBatchDelete = () => {
    if (selectedArchiveIds.length === 0) {
      triggerAlert('请先勾选要删除的归档记录！', 'error');
      return;
    }
    setShowArchiveDeleteConfirm(true);
  };

  const handleArchiveDeleteConfirmAction = () => {
    const deletedCount = selectedArchiveIds.length;
    setArchives(prev => prev.filter(a => !selectedArchiveIds.includes(a.id)));
    setSelectedArchiveIds([]);
    setShowArchiveDeleteConfirm(false);
    triggerAlert(`已永久删除 ${deletedCount} 条归档记录！`, 'success');
  };

  // Archive batch reactivate handler
  const [showArchiveReactivateConfirm, setShowArchiveReactivateConfirm] = useState(false);

  const handleArchiveBatchReactivate = () => {
    if (selectedArchiveIds.length === 0) {
      triggerAlert('请先勾选要重新上架的归档记录！', 'error');
      return;
    }
    setShowArchiveReactivateConfirm(true);
  };

  const handleArchiveReactivateConfirmAction = async () => {
    const itemsToReactivate = archives.filter(a => selectedArchiveIds.includes(a.id));
    let successCount = 0;
    const successIds: string[] = [];
    
    for (const item of itemsToReactivate) {
      try {
        const reactivatedOrder = await api.reactivateOrder(item.id);
        if (reactivatedOrder) {
          successCount++;
          successIds.push(item.id);
        }
      } catch (err) {
        console.error(`重新上架订单 ${item.id} 失败:`, err);
      }
    }
    
    // 只移除成功重新上架的订单
    if (successIds.length > 0) {
      setArchives(prev => prev.filter(a => !successIds.includes(a.id)));
    }
    setSelectedArchiveIds([]);
    setShowArchiveReactivateConfirm(false);
    
    if (successCount > 0) {
      try {
        const serverOrders = await api.getOrders();
        const transformedOrders = serverOrders.map((order: any) => ({
          id: order.id,
          order_no: order.order_no,
          district: order.district,
          grade: order.education_stage + (order.grade_detail ? ` ${order.grade_detail}` : ''),
          gradeDetail: order.grade_detail,
          subject: order.subject,
          coordinate: {
            lat: order.latitude || 31.2304,
            lng: order.longitude || 121.4737
          },
          studentDesc: order.title || '学员信息待完善',
          studentDetail: order.raw_content || order.requirements || '暂无详细信息',
          frequency: '每周2次，每次2小时',
          address: order.address,
          requirements: order.requirements || '男女教员均可',
          price: order.salary_max || order.salary_min || 0,
          priceMin: order.salary_min,
          priceMax: order.salary_max,
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
          idLine: `家教编号：${order.order_no}`
        }));
        setOrders(transformedOrders);
      } catch (err) {
        console.error('重新加载订单失败:', err);
      }
      triggerAlert(`成功重新上架 ${successCount} 个订单！已恢复到在售列表。`, 'success');
    } else {
      triggerAlert('重新上架失败，请稍后重试！', 'error');
    }
  };

  // Filtering on-sale orders list
  const filteredOnline = useMemo(() => {
    return orders.filter(o => {
      if (onlineSearchId && !o.id.toLowerCase().includes(onlineSearchId.toLowerCase())) return false;
      if (onlineSearchDistrict !== '全部' && o.district !== onlineSearchDistrict) return false;
      if (onlineSearchSubject !== '全部' && o.subject !== onlineSearchSubject) return false;
      return true;
    });
  }, [orders, onlineSearchId, onlineSearchDistrict, onlineSearchSubject]);

  // Paginated online orders
  const paginatedOnline = useMemo(() => {
    const start = (onlinePage - 1) * ONLINE_PER_PAGE;
    return filteredOnline.slice(start, start + ONLINE_PER_PAGE);
  }, [filteredOnline, onlinePage]);

  const totalOnlinePages = Math.ceil(filteredOnline.length / ONLINE_PER_PAGE);

  // Filtering and paginating archive orders
  const filteredArchives = useMemo(() => {
    return archives.filter(item => {
      const matchKeyword = !archiveSearchKeyword ||
        (extractOrderNo(item.rawContent) || item.order_no || item.orderId || item.id).toLowerCase().includes(archiveSearchKeyword.toLowerCase()) ||
        item.studentDesc.toLowerCase().includes(archiveSearchKeyword.toLowerCase()) ||
        item.address.toLowerCase().includes(archiveSearchKeyword.toLowerCase());
      const matchDistrict = archiveSearchDistrict === '全部' || item.district === archiveSearchDistrict;
      const matchSubject = archiveSearchSubject === '全部' || item.subject === archiveSearchSubject;
      return matchKeyword && matchDistrict && matchSubject;
    });
  }, [archives, archiveSearchKeyword, archiveSearchDistrict, archiveSearchSubject]);

  const paginatedArchives = useMemo(() => {
    const start = (archivePage - 1) * ARCHIVE_PER_PAGE;
    return filteredArchives.slice(start, start + ARCHIVE_PER_PAGE);
  }, [filteredArchives, archivePage]);

  const totalArchivePages = Math.ceil(filteredArchives.length / ARCHIVE_PER_PAGE);

  if (isVerifying) {
    return (
      <div className="w-full min-h-screen md:w-[1024px] md:min-h-[768px] bg-[#111] flex items-center justify-center font-sans tracking-tight select-none">
        <div className="flex flex-col items-center gap-4">
          <Loader className="w-10 h-10 text-orange-500 animate-spin" />
          <p className="text-neutral-400 text-sm">正在验证登录状态...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="w-full min-h-screen md:w-[1024px] md:min-h-[768px] bg-[#111] flex items-center justify-center font-sans tracking-tight select-none relative p-4">
        <div className="w-full max-w-md bg-[#1f1f1f] border border-neutral-800 rounded-2xl p-6 md:p-8 shadow-2xl flex flex-col relative z-20">
          
          <div className="flex items-center gap-3.5 mb-6">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center text-white font-extrabold text-xl shadow-lg shadow-orange-500/10">J2</div>
            <div className="flex flex-col">
              <h1 className="text-base font-bold text-neutral-100 flex items-center gap-1.5">
                管理员后台验证 
                <span className="text-[10px] bg-neutral-800 text-orange-400 px-1.5 rounded-md font-mono border border-neutral-700">LOCK</span>
              </h1>
              <span className="text-[10px] text-neutral-500 font-medium">请提供固定后台管理密钥进入</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-neutral-400 uppercase tracking-widest block">后台访问安全验证密码：</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="请输入预设管理密码..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handlePasswordKeyDown}
                  className="w-full bg-neutral-900 border border-neutral-800 text-neutral-100 placeholder-neutral-600 rounded-lg py-2.5 px-4 text-xs font-mono focus:ring-1.5 focus:ring-orange-500 focus:outline-none transition-all"
                />
              </div>
            </div>

            {errorPrompt && (
              <p className="text-[11px] text-red-500 px-1 font-semibold flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorPrompt}</span>
              </p>
            )}

            <button
              onClick={handleLogin}
              className="w-full py-2.5 bg-orange-500 text-white font-bold text-xs rounded-lg hover:bg-orange-600 shadow-md shadow-orange-500/15 cursor-pointer hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>验证并登入系统</span>
            </button>
          </div>

          <div className="border-t border-neutral-900/60 mt-6 pt-4 text-center">
            <button 
              onClick={onBackToUser}
              className="text-[10px] text-neutral-500 hover:text-orange-400 font-semibold transition-colors"
            >
              &lt; 离开此页，返回教员普通列表端
            </button>
          </div>
        </div>

        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[radial-gradient(#ff7823_1px,transparent_1px)] [background-size:16px_16px]" />
      </div>
    );
  }

  return (
    <div className="w-full h-screen md:w-[1024px] md:h-[768px] bg-[#141517] flex flex-col font-sans overflow-hidden text-neutral-200 relative select-none mx-auto">
      
      {/* GLOBAL SYSTEM LEVEL FEEDBACK ALERTS */}
      {alertInfo && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2.5 rounded-xl border z-50 flex items-center gap-2 shadow-2xl text-xs font-bold transition-all animate-bounce ${
          alertInfo.type === 'success' 
            ? 'bg-neutral-900 border-green-500 text-white'
            : alertInfo.type === 'error'
              ? 'bg-neutral-900 border-red-500 text-white'
              : 'bg-neutral-900 border-cyan-500 text-white'
        }`}>
          <span>{alertInfo.type === 'success' ? '✅' : alertInfo.type === 'error' ? '❌' : 'ℹ️'}</span>
          <span>{alertInfo.text}</span>
        </div>
      )}

      {/* DOUBLE CONFIRMATION TAKEDOWN DIALOG CARD */}
      {showTakedownConfirm && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-[420px] bg-neutral-900 border border-neutral-800 rounded-2xl p-4 md:p-6 shadow-2xl space-y-4">
            <div className="flex gap-3 text-orange-500">
              <AlertTriangle className="w-8 md:w-10 h-8 md:h-10 shrink-0" />
              <div>
                <h3 className="font-bold text-sm text-neutral-100">确认批量/单次下架选中在售订单吗？</h3>
                <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                  下架后：数据将从在售有效数据库 <b>online.json</b> 中删除，自动迁移并备份至历史归档 <b>archive.json</b> 中作为历史案底永远保留。
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2.5 pt-2 border-t border-neutral-800">
              <button
                onClick={() => {
                  setShowTakedownConfirm(false);
                  setTakedownTargetId(null);
                }}
                className="px-4 py-1.5 border border-neutral-800 hover:bg-neutral-800 text-xs text-neutral-400 font-semibold rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleTakedownConfirmAction}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-xs text-white font-bold rounded-lg"
              >
                确认下架并归档
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ARCHIVE BATCH DELETE CONFIRMATION DIALOG */}
      {showArchiveDeleteConfirm && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-[420px] bg-neutral-900 border border-red-800/50 rounded-2xl p-4 md:p-6 shadow-2xl space-y-4">
            <div className="flex gap-3 text-red-500">
              <Trash2 className="w-8 md:w-10 h-8 md:h-10 shrink-0" />
              <div>
                <h3 className="font-bold text-sm text-neutral-100">确认永久删除选中的归档记录吗？</h3>
                <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                  <b>⚠️ 此操作不可撤销！</b> 删除后：数据将从归档数据库 <b>archive.json</b> 中永久移除，无法恢复。请确保这些记录确实不再需要。
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2.5 pt-2 border-t border-neutral-800">
              <button
                onClick={() => setShowArchiveDeleteConfirm(false)}
                className="px-4 py-1.5 border border-neutral-800 hover:bg-neutral-800 text-xs text-neutral-400 font-semibold rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleArchiveDeleteConfirmAction}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-xs text-white font-bold rounded-lg"
              >
                确认永久删除
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ARCHIVE BATCH REACTIVATE CONFIRMATION DIALOG */}
      {showArchiveReactivateConfirm && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-[420px] bg-neutral-900 border border-green-800/50 rounded-2xl p-4 md:p-6 shadow-2xl space-y-4">
            <div className="flex gap-3 text-green-500">
              <RotateCcw className="w-8 md:w-10 h-8 md:h-10 shrink-0" />
              <div>
                <h3 className="font-bold text-sm text-neutral-100">确认重新上架选中的归档订单吗？</h3>
                <p className="text-[11px] text-neutral-400 mt-1 leading-relaxed">
                  重新上架后：订单将从归档状态恢复为在售状态，在前台及地图上重新显示。
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-2.5 pt-2 border-t border-neutral-800">
              <button
                onClick={() => setShowArchiveReactivateConfirm(false)}
                className="px-4 py-1.5 border border-neutral-800 hover:bg-neutral-800 text-xs text-neutral-400 font-semibold rounded-lg"
              >
                取消
              </button>
              <button
                onClick={handleArchiveReactivateConfirmAction}
                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-xs text-white font-bold rounded-lg"
              >
                确认重新上架
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. Header & Stats Board */}
      <header className="h-14 bg-[#1a1b1e] border-b border-neutral-800 flex items-center justify-between px-4 md:px-6 shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center text-white font-black text-sm shadow-md">
            <span className="hidden md:inline">J2</span>
            <span className="md:hidden text-lg">J</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
              <span className="hidden md:inline">家教教员接单平台</span>
              <span className="md:hidden text-[10px]">管理后台</span>
              <span className="text-[9px] bg-neutral-800 text-orange-400 border border-neutral-700 px-1 rounded font-mono font-semibold">管理员</span>
            </h1>
            <span className="hidden md:block text-[9px] text-neutral-500 font-semibold">纯 JSON 文件持久化数据池 &amp; 微信智能导入拆单后台</span>
          </div>
        </div>

        {/* Global Statistics Indicators (Unified stat.json syncing) - hidden on mobile */}
        <div className="hidden md:flex gap-6 text-xs bg-neutral-950 px-4 py-1.5 rounded-lg border border-neutral-850">
          <div className="flex flex-col items-center">
            <span className="text-neutral-500 text-[9px] font-semibold">今日新增</span>
            <span className="text-[#ff7823] font-black text-xs leading-none mt-1">+{stats.todayAdded}</span>
          </div>
          <div className="flex flex-col items-center border-l border-neutral-800 pl-4">
            <span className="text-neutral-500 text-[9px] font-semibold">在售订单数</span>
            <span className="text-neutral-200 font-black text-xs leading-none mt-1">{stats.totalOrders}</span>
          </div>
          <div className="flex flex-col items-center border-l border-neutral-800 pl-4">
            <span className="text-neutral-500 text-[9px] font-semibold">最后更新</span>
            <span className="text-[#06b6d4] font-mono text-[10px] leading-none mt-1">{stats.lastUpdated}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLogout}
            className="px-2 md:px-4 py-1.5 bg-red-900/30 border border-red-800/50 hover:bg-red-900/50 text-xs text-red-400 font-bold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span className="hidden md:inline">退出登录</span>
            <span className="md:hidden text-[10px]">退出</span>
          </button>
          <button
            onClick={onBackToUser}
            className="px-2 md:px-4 py-1.5 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-xs text-neutral-300 font-bold rounded-lg transition-colors flex items-center gap-1.5"
          >
            <X className="w-3.5 h-3.5 text-neutral-400" />
            <span className="hidden md:inline">返回用户端</span>
            <span className="md:hidden text-[10px]">返回用户端</span>
          </button>
        </div>
      </header>

      {/* 2. Top-level Admin Menu Tabs */}
      <div className="bg-[#1a1b1e] px-2 md:px-6 py-1.5 border-b border-neutral-800 flex items-center gap-1.5 shrink-0 overflow-x-auto">
        <button
          onClick={() => { setAdminTab('draft'); setSelectedOnlineId(null); }}
          className={`px-2 md:px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap ${
            adminTab === 'draft' 
              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30' 
              : 'border border-transparent hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Database className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden md:inline">待审核草稿订单 ({drafts.length})</span>
          <span className="md:hidden">草稿 ({drafts.length})</span>
          <span className="hidden lg:inline text-[9px] font-mono px-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-550">draft.json</span>
        </button>

        <button
          onClick={() => { setAdminTab('online'); setSelectedDraftId(null); }}
          className={`px-2 md:px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap ${
            adminTab === 'online' 
              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30' 
              : 'border border-transparent hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden md:inline">线上在售中心 ({orders.length})</span>
          <span className="md:hidden">在售 ({orders.length})</span>
          <span className="hidden lg:inline text-[9px] font-mono px-1 rounded bg-neutral-900 border border-neutral-800 text-teal-500">online.json</span>
        </button>

        <button
          onClick={() => { setAdminTab('archive'); setSelectedDraftId(null); setSelectedOnlineId(null); }}
          className={`px-2 md:px-4 py-1.5 rounded-lg text-[10px] md:text-xs font-bold transition-all flex items-center gap-1 whitespace-nowrap ${
            adminTab === 'archive' 
              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30' 
              : 'border border-transparent hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span className="hidden md:inline">归档历史台账 ({archives.length})</span>
          <span className="md:hidden">归档 ({archives.length})</span>
          <span className="hidden lg:inline text-[9px] font-mono px-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-500">archive.json</span>
        </button>
      </div>

      {/* 3. Main Dashboard Body Panel */}
      <main className="flex-1 min-h-0 flex bg-[#141517] overflow-hidden">
        
        {/* TAB 1: DRAFTS AND CHAT RAW WRITER INTAKE */}
        {adminTab === 'draft' && (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Mobile Editor Modal */}
            {showMobileEditor && (
              <div className="md:hidden absolute inset-0 bg-[#17181c] z-40 overflow-y-auto">
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-neutral-800">
                    <button
                      onClick={() => setShowMobileEditor(false)}
                      className="flex items-center gap-2 text-neutral-300 hover:text-white"
                    >
                      <X className="w-5 h-5" />
                      <span className="text-sm font-bold">关闭编辑</span>
                    </button>
                    <span className="text-sm font-bold text-orange-400">编辑草稿</span>
                    <div className="w-20"></div>
                  </div>

                  {/* Form */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">订单编号</label>
                      <input type="text" value={editId} disabled className="w-full bg-neutral-900 border border-neutral-800 text-neutral-500 p-3 rounded-lg text-sm" />
                    </div>

                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">上海市行政区 *</label>
                      <select value={editDistrict} onChange={(e) => setEditDistrict(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 text-white p-3 rounded-lg text-sm">
                        <option value="">--选择行政区--</option>
                        {SHANGHAI_DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-neutral-400 mb-1">科目</label>
                        <input type="text" value={editSubject} onChange={(e) => setEditSubject(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 text-white p-3 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-400 mb-1">学段</label>
                        <select value={editGrade} onChange={(e) => setEditGrade(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 text-white p-3 rounded-lg text-sm">
                          {GRADES.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-neutral-400 mb-1">薪资</label>
                        <input type="number" value={editPrice} onChange={(e) => setEditPrice(Math.max(0, parseInt(e.target.value, 10)) || 0)} className="w-full bg-neutral-900 border border-neutral-800 text-white p-3 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-400 mb-1">薪资文本</label>
                        <input type="text" value={editPriceText} onChange={(e) => setEditPriceText(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 text-white p-3 rounded-lg text-sm" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">学员描述</label>
                      <input type="text" value={editStudentDesc} onChange={(e) => setEditStudentDesc(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 text-white p-3 rounded-lg text-sm" />
                    </div>

                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">详细内容</label>
                      <textarea value={editStudentDetail} onChange={(e) => setEditStudentDetail(e.target.value)} rows={4} className="w-full bg-neutral-900 border border-neutral-800 text-white p-3 rounded-lg text-sm" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-neutral-400 mb-1">上课频次</label>
                        <input type="text" value={editFrequency} onChange={(e) => setEditFrequency(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 text-white p-3 rounded-lg text-sm" />
                      </div>
                      <div>
                        <label className="block text-xs text-neutral-400 mb-1">地址</label>
                        <input type="text" value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 text-white p-3 rounded-lg text-sm" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-neutral-400 mb-1">教员要求</label>
                      <input type="text" value={editRequirements} onChange={(e) => setEditRequirements(e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 text-white p-3 rounded-lg text-sm" />
                    </div>

                    <button onClick={handleSaveDraft} className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg">
                      保存修改
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop Layout */}
            <div className="flex-1 flex flex-col md:flex-row min-w-0 overflow-hidden">
            {/* Left 60% Panel: WeChat Input & Draft Collection - Full width on mobile */}
            <div className="w-full md:w-[62%] border-r border-neutral-800 p-3 md:p-5 flex flex-col min-w-0 overflow-y-auto max-h-full">
              
              {/* Raw微信杂乱复制框 */}
              <div className="bg-neutral-900/60 p-4 rounded-xl border border-neutral-850 space-y-3 shrink-0">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-orange-400" />
                    <span className="text-xs font-bold text-neural-100 uppercase">微信群多需求文案批量粘贴框</span>
                  </div>
                  <span className="text-[10px] text-neutral-500 font-semibold">支持多笔订单一并粘入自动分割</span>
                </div>

                <textarea
                  placeholder="👉 粘贴微信群多需求文案自动分割..."
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  className="w-full h-24 bg-neutral-950 border border-neutral-800 text-neutral-200 text-[10.5px] font-mono p-3 rounded-lg focus:ring-1 focus:ring-orange-500 focus:outline-none placeholder-neutral-600 leading-snug"
                />

                <div className="flex items-center justify-between gap-3">
                  <span className="text-[9.5px] text-neutral-500 font-semibold leading-none">
                    * 解析规则：以空行或包含SH订单等标识流智能拆单
                  </span>
                  
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setRawText('')}
                      className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10.5px] font-bold rounded-md"
                    >
                      重置清空
                    </button>
                    <button
                      onClick={handleSmartParse}
                      className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[10.5px] font-black rounded-md shadow-md flex items-center gap-1"
                    >
                      <Play className="w-3.5 h-3.5 shrink-0 fill-current" />
                      <span>一键智能解析</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Draft List header with mass selects */}
              <div className="flex items-center justify-between mt-5 mb-2 shrink-0">
                <div className="text-xs font-bold text-neutral-400 flex items-center gap-2">
                  <span>待编辑审核草稿箱</span>
                  <span className="bg-neutral-800 text-orange-400 px-1.5 py-0.5 rounded-full font-mono text-[9px]">{drafts.length} 件</span>
                </div>

                {drafts.length > 0 && (
                  <div className="flex items-center gap-2.5">
                    {/* Batch selects */}
                    <div className="flex gap-1 bg-neutral-950 p-0.5 rounded-md border border-neutral-850">
                      <button
                        onClick={() => {
                          if (selectedDraftIds.length === drafts.length) {
                            setSelectedDraftIds([]);
                          } else {
                            setSelectedDraftIds(drafts.map(d => d.id));
                          }
                        }}
                        className="p-1 px-2.5 text-[9.5px] text-neutral-400 hover:text-white rounded hover:bg-neutral-850 font-bold"
                      >
                        {selectedDraftIds.length === drafts.length ? '取消全选' : '全选'}
                      </button>
                    </div>

                    <button
                      onClick={handleBatchDeclineDrafts}
                      disabled={selectedDraftIds.length === 0}
                      className="px-2.5 py-1 text-[10px] hover:bg-red-950/40 text-red-500 rounded border border-transparent disabled:opacity-40 select-none font-semibold"
                    >
                      作废作撤 ({selectedDraftIds.length})
                    </button>

                    <button
                      onClick={handleBatchPublish}
                      disabled={selectedDraftIds.length === 0}
                      className="px-3.5 py-1 bg-orange-500 hover:bg-orange-600 text-white rounded text-[10.5px] font-bold shadow-md flex items-center gap-1 disabled:opacity-45"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>批量上架发布 ({selectedDraftIds.length})</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Draft Cards List */}
              <div className="flex-1 min-h-[200px] overflow-y-auto space-y-2.5 pr-1 font-sans">
                {drafts.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 bg-neutral-900/10 rounded-xl border-2 border-dashed border-neutral-800 text-center">
                    <Database className="w-8 h-8 text-neutral-700 stroke-1 mb-2" />
                    <p className="text-[11px] text-neutral-500 font-bold select-none leading-relaxed">
                      草稿箱暂空
                    </p>
                    <p className="text-[10px] text-neutral-600 mt-1">
                      请先在上方粘贴群段落文字，或者从微信对话框快捷键粘贴导入。
                    </p>
                  </div>
                ) : (
                  drafts.map(item => {
                    const isSelected = selectedDraftIds.includes(item.id);
                    const isActive = selectedDraftId === item.id;
                    const isDistrictMissing = !item.district;

                    return (
                      <div
                        key={item.id}
                        onClick={() => {
                          setSelectedDraftId(item.id);
                          setShowMobileEditor(true);
                        }}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer relative transition-all flex items-start gap-4 ${
                          isActive 
                            ? 'bg-neutral-850 border-orange-500/60 shadow-lg' 
                            : 'bg-neutral-900/40 border-neutral-800 hover:bg-neutral-850 hover:border-neutral-750'
                        }`}>
                        {/* Custom checkbox */}
                        <div 
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isSelected) {
                              setSelectedDraftIds(prev => prev.filter(id => id !== item.id));
                            } else {
                              setSelectedDraftIds(prev => [...prev, item.id]);
                            }
                          }}
                          className="pt-0.5"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-orange-500 fill-orange-500/10 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-neutral-600 shrink-0" />
                          )}
                        </div>

                        {/* Order core indicators */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-neutral-400 font-mono tracking-tight font-bold">{extractOrderNo(item.rawContent) || item.order_no || item.orderId || item.id}</span>
                            {isDistrictMissing ? (
                              <span className="text-[8.5px] bg-red-950/80 text-red-400 border border-red-900 font-bold px-1 rounded animate-pulse">
                                ⚠️ 行政区未识别
                              </span>
                            ) : (
                              <span className="text-[8.5px] bg-neutral-800 text-neutral-300 font-extrabold px-1.5 py-0.5 rounded font-sans leading-none">
                                {item.district}
                              </span>
                            )}
                            <span className="text-[8.5px] bg-orange-950/80 border border-orange-900 text-orange-300 font-extrabold px-1 rounded leading-none">{item.grade} {item.subject}</span>
                            {item.isOnline && (
                              <span className="text-[8.5px] bg-blue-950 border border-blue-900 text-blue-300 font-bold px-1 rounded leading-none">线上</span>
                            )}
                          </div>

                          <p className="text-[11px] text-neutral-300 mt-2 truncate font-semibold leading-relaxed">
                            {item.studentDesc}
                          </p>

                          <div className="mt-2.5 flex items-center gap-4 text-[10px] text-neutral-500 font-semibold font-mono">
                            <span className="flex items-center gap-1 text-orange-450">
                              <DollarSign className="w-3 h-3 text-orange-450 shrink-0" /> {item.priceText || `¥${item.price}/h`}
                            </span>
                            <span className="flex items-center gap-1 truncate max-w-[150px]">
                              <MapPin className="w-3 h-3 text-neutral-400 shrink-0" /> 地址: {item.address}
                            </span>
                          </div>
                        </div>

                        {/* Edit indicator */}
                        <div className="flex flex-col items-end gap-1.5 self-center shrink-0">
                          {isActive && (
                            <span className="text-[9px] bg-orange-500 text-white font-black px-1.5 py-0.5 rounded uppercase">编辑中</span>
                          )}
                          <ChevronRight className="w-4 h-4 text-neutral-600" />
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right 38% Panel: 40% Interactive Advanced Editor Fields - Hidden on mobile unless selected */}
            <div className="hidden md:block w-[38%] p-5 bg-[#17181c] border-l border-neutral-800 flex flex-col min-w-0">
              <h2 className="text-xs font-bold text-white mb-4 uppercase flex items-center gap-1.5 pb-2 border-b border-neutral-800">
                <ShieldCheck className="w-4 h-4 text-orange-400" />
                <span>草稿需求人工二次核验 &amp; 修正面板</span>
              </h2>

              {!selectedDraftId ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-neutral-500">
                  <Database className="w-8 h-8 text-neutral-700 mb-2 stroke-1" />
                  <p className="text-[10px] leading-relaxed">
                    请在左侧点击任意需要精细修改的草稿
                  </p>
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0 min-w-0 space-y-3.5 overflow-y-auto pr-1 text-xs">
                  
                  {/* Order Id display */}
                  <div className="grid grid-cols-2 gap-3 shrink-0">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-neutral-400 block uppercase">订单唯一编号</span>
                      <input
                        type="text"
                        value={editId}
                        disabled
                        className="w-full bg-neutral-900 border border-neutral-800 text-neutral-500 py-1.5 px-3 rounded text-[11.5px] font-mono cursor-not-allowed"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-neutral-400 block uppercase">上海市行政区</span>
                      <select
                        value={editDistrict}
                        onChange={(e) => setEditDistrict(e.target.value)}
                        className={`w-full bg-neutral-900 border text-neutral-250 py-1.5 px-2 rounded text-[11.5px] focus:ring-1 focus:ring-orange-500 focus:outline-none ${!editDistrict ? 'border-red-500' : 'border-neutral-850'}`}
                      >
                        <option value="">--未选/待选行政区--</option>
                        {SHANGHAI_DISTRICTS.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Pricing and Grade, Subject */}
                  <div className="grid grid-cols-3 gap-2.5 shrink-0">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-neutral-400 block uppercase">科目细类</span>
                      <input
                        type="text"
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        placeholder="如: 数学英语、物理化学、全科"
                        className="w-full bg-neutral-900 border border-neutral-850 text-neutral-250 py-1.5 px-2 rounded text-[11px] focus:ring-1 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-neutral-400 block uppercase">学段分类</span>
                      <select
                        value={editGrade}
                        onChange={(e) => setEditGrade(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-850 text-neutral-250 py-1.5 px-1.5 rounded text-[11px]"
                      >
                        {GRADES.map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-neutral-400 block uppercase">教员薪资数字</span>
                      <div className="relative">
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(Math.max(0, parseInt(e.target.value, 10)) || 0)}
                          className="w-full bg-neutral-900 border border-neutral-850 text-neutral-200 py-1.5 pl-2.5 pr-16 rounded text-[11.5px] font-mono focus:ring-1 focus:ring-orange-500 focus:outline-none"
                        />
                        <span className="absolute right-1 px-1.5 top-1.5 text-[8px] text-neutral-500 font-bold">用于排序</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-neutral-400 block uppercase">薪资显示文本</span>
                      <input
                        type="text"
                        value={editPriceText}
                        onChange={(e) => setEditPriceText(e.target.value)}
                        placeholder="如: 150元/h, 3000元/月"
                        className="w-full bg-neutral-900 border border-neutral-850 text-neutral-200 py-1.5 px-2.5 rounded text-[11px] focus:ring-1 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Student profile brief description */}
                  <div className="space-y-1 shrink-0">
                    <span className="text-[10px] font-bold text-neutral-400 block uppercase">学员情况简描 (前台卡片优先展示)</span>
                    <input
                      type="text"
                      value={editStudentDesc}
                      onChange={(e) => setEditStudentDesc(e.target.value)}
                      placeholder="例：高二女学生，基础中等偏下"
                      className="w-full bg-neutral-900 border border-neutral-850 text-neutral-200 py-2 px-3 rounded-lg text-[11px] focus:ring-1 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  {/* Student detail text area */}
                  <div className="space-y-1 flex-1 min-h-[75px] flex flex-col">
                    <span className="text-[10px] font-bold text-neutral-400 block uppercase">学习基础与辅导大纲全文</span>
                    <textarea
                      value={editStudentDetail}
                      onChange={(e) => setEditStudentDetail(e.target.value)}
                      placeholder="录入详细学生基础，期待上门辅导频次及弱项点拨内容"
                      className="w-full flex-1 bg-neutral-900 border border-neutral-850 text-neutral-250 py-2 px-3 rounded-lg text-[10.5px] leading-snug font-mono focus:ring-1 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  {/* Class schedule raw string */}
                  <div className="grid grid-cols-2 gap-3 shrink-0">
                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-neutral-400 block uppercase">上课频次频度</span>
                      <input
                        type="text"
                        value={editFrequency}
                        onChange={(e) => setEditFrequency(e.target.value)}
                        placeholder="如: 每周两次，周六及周日"
                        className="w-full bg-neutral-900 border border-neutral-850 text-neutral-250 py-1.5 px-3 rounded text-[11px] focus:ring-1 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[10px] font-bold text-neutral-400 block uppercase">辅导详细地址/常住路段</span>
                      <input
                        type="text"
                        value={editAddress}
                        onChange={(e) => setEditAddress(e.target.value)}
                        placeholder="例: 五角场国定路252号弄"
                        className="w-full bg-neutral-900 border border-neutral-850 text-neutral-250 py-1.5 px-3 rounded text-[11px] focus:ring-1 focus:ring-orange-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Teacher require text */}
                  <div className="space-y-1 shrink-0">
                    <span className="text-[10px] font-bold text-neutral-400 block uppercase">拟招教员资格条件 (例如：通过六级、女老师等)</span>
                    <input
                      type="text"
                      value={editRequirements}
                      onChange={(e) => setEditRequirements(e.target.value)}
                      placeholder="例: 精英院校师范女生，耐心责任感佳"
                      className="w-full bg-neutral-900 border border-neutral-850 text-neutral-220 py-1.5 px-3 rounded text-[11px] focus:ring-1 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  {/* Custom Order Tag */}
                  <div className="space-y-1 shrink-0 pb-1.5">
                    <span className="text-[10px] font-bold text-neutral-400 block uppercase">自定义前台高亮标签 (order_tag)</span>
                    <input
                      type="text"
                      value={editOrderTag}
                      onChange={(e) => setEditOrderTag(e.target.value)}
                      placeholder="如: 高价火焰 / 春季特招"
                      className="w-full bg-neutral-900 border border-neutral-850 text-neutral-300 py-1.5 px-3 rounded text-[11px] font-mono focus:ring-1 focus:ring-orange-500 focus:outline-none"
                    />
                  </div>

                  {/* Save single draft action */}
                  <button
                    onClick={handleSaveDraft}
                    className="w-full py-2 bg-orange-500 hover:bg-orange-600 border border-orange-400/20 text-white font-bold text-xs rounded-lg shadow-sm transition-transform hover:-translate-y-0.5"
                  >
                    保存该条草稿修改 📋
                  </button>

                </div>
              )}
            </div>
          </div>
        </div>
      )}

        {/* TAB 2: ACTIVE LISTINGS REMOVAL & SEARCH (online.json) */}
        {adminTab === 'online' && (
          <div className="flex-1 p-3 md:p-6 flex flex-col min-w-0 overflow-y-auto">
            {/* Filter and Takedown action items at top */}
            <div className="bg-[#1a1b1e] p-3 md:p-4 rounded-xl border border-neutral-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shrink-0 mb-4 text-xs font-semibold">
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 text-neutral-400 py-1">
                  <Search className="w-4 h-4 text-neutral-400" />
                  <span className="hidden md:inline">在售订单精筛选:</span>
                  <span className="md:hidden">筛选:</span>
                </div>

                <input
                  type="text"
                  placeholder="编号..."
                  value={onlineSearchId}
                  onChange={(e) => setOnlineSearchId(e.target.value)}
                  className="bg-neutral-950 border border-neutral-850 p-1.5 px-2 md:px-3 rounded font-mono text-[10.5px] tracking-tight placeholder-neutral-600 focus:outline-none focus:border-neutral-700 w-28 md:w-44"
                />

                <select
                  value={onlineSearchDistrict}
                  onChange={(e) => setOnlineSearchDistrict(e.target.value)}
                  className="bg-neutral-950 border border-neutral-850 p-1.5 rounded text-[10.5px] text-neutral-300 focus:outline-none focus:border-neutral-700"
                >
                  <option value="全部">全区</option>
                  {SHANGHAI_DISTRICTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  value={onlineSearchSubject}
                  onChange={(e) => setOnlineSearchSubject(e.target.value)}
                  className="bg-neutral-950 border border-neutral-850 p-1.5 rounded text-[10.5px] text-neutral-300 focus:outline-none focus:border-neutral-700"
                >
                  <option value="全部">全科</option>
                  {SUBJECTS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Massive action */}
              {selectedOnlineIds.length > 0 && (
                <button
                  onClick={() => {
                    setTakedownTargetId(null);
                    setShowTakedownConfirm(true);
                  }}
                  className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span>批量下架 ({selectedOnlineIds.length})</span>
                </button>
              )}
            </div>

            {/* List with table header - hidden on mobile, cards on mobile */}
            <div className="flex-1 min-h-0 bg-neutral-900/30 border border-neutral-800 rounded-xl overflow-hidden flex flex-col">
              
              {/* Batch Action checkboxes row header - PC only */}
              <div className="hidden md:flex bg-neutral-850/50 px-5 py-2.5 border-b border-neutral-800 text-[10px] text-neutral-400 font-bold uppercase tracking-wider items-center gap-4">
                <div 
                  onClick={() => {
                    if (selectedOnlineIds.length === paginatedOnline.length) {
                      setSelectedOnlineIds([]);
                    } else {
                      setSelectedOnlineIds(paginatedOnline.map(o => o.id));
                    }
                  }}
                  className="cursor-pointer"
                >
                  {selectedOnlineIds.length === paginatedOnline.length && paginatedOnline.length > 0 ? (
                    <CheckSquare className="w-4 h-4 text-orange-500 shrink-0" />
                  ) : (
                    <Square className="w-4 h-4 text-neutral-600 shrink-0" />
                  )}
                </div>
                
                <span className="w-24 shrink-0">唯一编号</span>
                <span className="w-20 shrink-0 text-center">行政区</span>
                <span className="w-24 shrink-0 text-center">学段/科目</span>
                <span className="w-32 shrink-0">时薪费用</span>
                <span className="flex-1 min-w-0 pr-6">学生辅导要求快览</span>
                <span className="w-24 text-center shrink-0">上单管理操作</span>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-neutral-850 font-sans">
                {filteredOnline.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 text-neutral-500 select-none">
                    <Info className="w-8 h-8 text-neutral-700 mb-1.5" />
                    <p className="text-[11px] font-bold">没有匹配的线上在售订单</p>
                    <p className="text-[10px] text-neutral-650 mt-0.5">请修改或重置过滤字典关键词后再试。</p>
                  </div>
                ) : (
                  paginatedOnline.map(item => {
                    const isChecked = selectedOnlineIds.includes(item.id);

                    return (
                      <React.Fragment key={item.id}>
                        {/* Mobile: Card Layout */}
                        <div
                          className={`md:hidden bg-[#1a1b1e] border border-neutral-800 rounded-xl p-4 mb-3 ${
                            isChecked ? 'ring-2 ring-orange-500/30' : ''
                          }`}
                        >
                          {/* Mobile: Card Header with checkbox and ID */}
                          <div className="flex items-start gap-3 mb-3">
                            <div 
                              onClick={() => {
                                if (isChecked) {
                                  setSelectedOnlineIds(prev => prev.filter(id => id !== item.id));
                                } else {
                                  setSelectedOnlineIds(prev => [...prev, item.id]);
                                }
                              }}
                              className="cursor-pointer mt-0.5"
                            >
                              {isChecked ? (
                                <CheckSquare className="w-5 h-5 text-orange-500 fill-orange-500/20" />
                              ) : (
                                <Square className="w-5 h-5 text-neutral-600" />
                              )}
                            </div>
                            <div className="flex-1">
                              <span className="font-mono font-bold text-neutral-400 text-xs">{extractOrderNo(item.rawContent) || item.order_no || item.orderId || item.id}</span>
                            </div>
                          </div>

                          {/* Mobile: Tags Row */}
                          <div className="flex flex-wrap items-center gap-1.5 mb-3">
                            <span className="bg-neutral-800 text-neutral-350 font-bold px-2 py-0.5 rounded-lg text-[10px]">{item.district}</span>
                            <span className="bg-orange-950/80 border border-orange-900/40 text-orange-300 font-bold px-2 py-0.5 rounded-lg text-[10px]">{item.grade} {item.subject}</span>
                            {item.isOnline && <span className="bg-blue-950/80 border border-blue-900/40 text-blue-300 font-bold px-2 py-0.5 rounded-lg text-[10px]">线上</span>}
                            {item.isHighPrice && <span className="bg-red-950/80 border border-red-900/40 text-red-300 font-bold px-2 py-0.5 rounded-lg text-[10px]">高薪</span>}
                          </div>

                          {/* Mobile: Price Display */}
                          <div className="flex items-center justify-between mb-3 pb-3 border-b border-neutral-800">
                            <div>
                              {item.price === 0 ? (
                                <span className="text-orange-400 font-black text-lg">教员报价</span>
                              ) : (
                                <span className="text-orange-400 font-black text-lg">¥{item.price}<span className="text-sm text-neutral-500">/h</span></span>
                              )}
                            </div>
                            {item.priceText && item.price !== 0 && (
                              <span className="text-neutral-500 text-[10px]">{item.priceText}</span>
                            )}
                          </div>

                          {/* Mobile: Description */}
                          <div className="mb-3">
                            <p className="text-neutral-300 font-semibold text-sm mb-1.5">{item.studentDesc}</p>
                            <p className="text-neutral-500 text-xs truncate">📍 {item.address}</p>
                          </div>

                          {/* Mobile: Action Button */}
                          <button
                            onClick={() => {
                              setTakedownTargetId(item.id);
                              setShowTakedownConfirm(true);
                            }}
                            className="w-full py-2.5 bg-red-600/10 border border-red-500/30 text-red-400 font-bold text-sm rounded-lg hover:bg-red-600/20 hover:border-red-500/50 transition-all cursor-pointer"
                          >
                            下架归档
                          </button>
                        </div>

                        {/* PC: Row Layout */}
                        <div
                          className={`hidden md:flex items-center gap-4 px-5 py-3.5 hover:bg-neutral-850/30 text-xs ${
                            isChecked ? 'bg-[#ff7823]/5' : ''
                          }`}
                        >
                          {/* Checkbox */}
                          <div 
                            onClick={() => {
                              if (isChecked) {
                                setSelectedOnlineIds(prev => prev.filter(id => id !== item.id));
                              } else {
                                setSelectedOnlineIds(prev => [...prev, item.id]);
                              }
                            }}
                            className="cursor-pointer"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-orange-500 fill-orange-500/10" />
                            ) : (
                              <Square className="w-4 h-4 text-neutral-600" />
                            )}
                          </div>

                          {/* ID */}
                          <span className="w-24 font-mono font-bold text-neutral-400 text-xs">{extractOrderNo(item.rawContent) || item.order_no || item.orderId || item.id}</span>

                          {/* District */}
                          <span className="w-20 text-center">
                            <span className="bg-neutral-800 text-neutral-300 font-extrabold px-1.5 py-0.5 rounded text-[10px]">{item.district}</span>
                          </span>

                          {/* Grade & Subject */}
                          <span className="w-24 text-center">
                            <span className="bg-orange-950/80 border border-orange-900/40 text-orange-300 font-extrabold px-1.5 py-0.5 rounded text-[9.5px]">{item.grade} {item.subject}</span>
                          </span>

                          {/* Price */}
                          <span className="w-32 font-mono font-bold text-[12px]">
                            {item.isNegotiable ? (
                              <span className="text-emerald-450">教员报价</span>
                            ) : item.price === 0 ? (
                              <span className="text-neutral-450">教员报价</span>
                            ) : (
                              <span className="text-orange-450">¥{item.price} <span className="text-[9px] text-neutral-500 font-normal">/小时</span></span>
                            )}
                          </span>

                          {/* Description */}
                          <div className="flex-1 min-w-0 pr-6">
                            <p className="text-neutral-300 truncate font-semibold">{item.studentDesc}</p>
                            <p className="text-[10px] text-neutral-500 truncate mt-0.5">地址：{item.address}</p>
                          </div>

                          {/* Action */}
                          <div className="w-24 text-center">
                            <button
                              onClick={() => {
                                setTakedownTargetId(item.id);
                                setShowTakedownConfirm(true);
                              }}
                              className="px-2.5 py-1 text-[10px] font-bold text-red-500 border border-red-500/10 hover:border-red-500/40 hover:bg-red-950/20 rounded transition-all cursor-pointer"
                            >
                              下架归档
                            </button>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })
                )}

                {/* Online Orders Pagination */}
                {totalOnlinePages > 1 && (
                  <div className="flex items-center justify-center gap-2 py-3 border-t border-neutral-800 shrink-0">
                    <button
                      onClick={() => setOnlinePage(p => Math.max(1, p - 1))}
                      disabled={onlinePage === 1}
                      className="px-3 py-1.5 text-xs font-bold text-neutral-400 hover:text-orange-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      上一页
                    </button>
                    <span className="px-3 py-1.5 text-xs font-bold text-orange-500 bg-orange-950/30 rounded">
                      {onlinePage} / {totalOnlinePages}
                    </span>
                    <button
                      onClick={() => setOnlinePage(p => Math.min(totalOnlinePages, p + 1))}
                      disabled={onlinePage === totalOnlinePages}
                      className="px-3 py-1.5 text-xs font-bold text-neutral-400 hover:text-orange-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      下一页
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: READ-ONLY AUDIT TRACE LOGS (archive.json) */}
        {adminTab === 'archive' && (
          <div className="flex-1 p-3 md:p-6 flex flex-col min-w-0 overflow-y-auto">
            <div className="bg-[#1a1b1e] border border-neutral-800 rounded-xl p-3 md:p-4 mb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-2 shrink-0 text-xs">
              <span className="text-neutral-400 font-semibold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-[#06b6d4]" />
                <span className="hidden md:inline">由于安全可追溯机制，归档记录属于审计台账数据库，<b>仅支持只读查阅和批量删除，无法修改或重新发布。</b></span>
                <span className="md:hidden">归档为审计台账，支持只读和删除</span>
              </span>
              <span className="font-bold text-neutral-500">归档池数: {archives.length} 条</span>
            </div>

            {/* Archive Search Filters */}
            <div className="bg-[#1a1b1e] p-3 md:p-4 rounded-xl border border-neutral-800 flex flex-wrap items-center gap-2 shrink-0 mb-4 text-xs font-semibold">
              <div className="flex items-center gap-1 text-neutral-400 py-1">
                <Search className="w-4 h-4 text-neutral-400" />
                <span className="hidden md:inline">归档台账搜索:</span>
                <span className="md:hidden">搜索:</span>
              </div>

              <input
                type="text"
                placeholder="关键词..."
                value={archiveSearchKeyword}
                onChange={(e) => setArchiveSearchKeyword(e.target.value)}
                className="bg-neutral-950 border border-neutral-850 p-1.5 px-2 md:px-3 rounded font-mono text-[10.5px] tracking-tight placeholder-neutral-600 focus:outline-none focus:border-neutral-700 w-28 md:w-44"
              />

              <select
                value={archiveSearchDistrict}
                onChange={(e) => setArchiveSearchDistrict(e.target.value)}
                className="bg-neutral-950 border border-neutral-850 p-1.5 rounded text-[10.5px] text-neutral-300 focus:outline-none focus:border-neutral-700"
              >
                <option value="全部">全区</option>
                {SHANGHAI_DISTRICTS.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <select
                value={archiveSearchSubject}
                onChange={(e) => setArchiveSearchSubject(e.target.value)}
                className="bg-neutral-950 border border-neutral-850 p-1.5 rounded text-[10.5px] text-neutral-300 focus:outline-none focus:border-neutral-700"
              >
                <option value="全部">全科</option>
                {SUBJECTS.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>

              {/* Batch Reactivate Button */}
              <button
                onClick={handleArchiveBatchReactivate}
                disabled={selectedArchiveIds.length === 0}
                className="px-3 md:px-4 py-1.5 bg-green-600/20 border border-green-500/30 text-green-400 font-bold text-[10px] md:text-xs rounded-lg hover:bg-green-600/30 hover:border-green-500/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>重新上架 ({selectedArchiveIds.length})</span>
              </button>

              {/* Batch Delete Button */}
              <button
                onClick={handleArchiveBatchDelete}
                disabled={selectedArchiveIds.length === 0}
                className="ml-auto px-3 md:px-4 py-1.5 bg-red-600/20 border border-red-500/30 text-red-400 font-bold text-[10px] md:text-xs rounded-lg hover:bg-red-600/30 hover:border-red-500/50 transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>批量删除 ({selectedArchiveIds.length})</span>
              </button>
            </div>

            <div className="flex-1 min-h-0 bg-neutral-900/30 border border-neutral-800 rounded-xl overflow-hidden flex flex-col">
              {/* Header - PC only */}
              <div className="hidden md:flex bg-neutral-850/50 px-6 py-2.5 border-b border-neutral-800 text-[10px] text-neutral-400 font-bold uppercase items-center">
                <div 
                  className="w-10 cursor-pointer"
                  onClick={() => {
                    const allSelected = filteredArchives.every(item => selectedArchiveIds.includes(item.id));
                    if (allSelected) {
                      setSelectedArchiveIds(prev => prev.filter(id => !filteredArchives.some(item => item.id === id)));
                    } else {
                      setSelectedArchiveIds(prev => [...new Set([...prev, ...filteredArchives.map(item => item.id)])]);
                    }
                  }}
                >
                  {(() => {
                    const allSelected = filteredArchives.length > 0 && filteredArchives.every(item => selectedArchiveIds.includes(item.id));
                    const someSelected = filteredArchives.some(item => selectedArchiveIds.includes(item.id));
                    return allSelected ? (
                      <CheckSquare className="w-5 h-5 text-orange-500 fill-orange-500/20" />
                    ) : someSelected ? (
                      <div className="w-5 h-5 rounded border-2 border-orange-400 bg-orange-400/30" />
                    ) : (
                      <Square className="w-5 h-5 text-neutral-600" />
                    );
                  })()}
                </div>
                <span className="w-24 shrink-0">编号</span>
                <span className="w-24 shrink-0 text-center">行政区</span>
                <span className="w-28 shrink-0 text-center">类别科目</span>
                <span className="w-28 shrink-0">费用时薪</span>
                <span className="flex-1 min-w-0 px-4">留档事由与备注</span>
                <span className="w-36 text-right shrink-0">归档入账时间</span>
              </div>

              {/* Rows scrollbar */}
              <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-neutral-850 font-sans">
                {(() => {
                  const filteredArchives = archives.filter(item => {
                    const matchKeyword = !archiveSearchKeyword || 
                      item.id.toLowerCase().includes(archiveSearchKeyword.toLowerCase()) ||
                      item.studentDesc.toLowerCase().includes(archiveSearchKeyword.toLowerCase()) ||
                      item.address.toLowerCase().includes(archiveSearchKeyword.toLowerCase());
                    const matchDistrict = archiveSearchDistrict === '全部' || item.district === archiveSearchDistrict;
                    const matchSubject = archiveSearchSubject === '全部' || item.subject === archiveSearchSubject;
                    return matchKeyword && matchDistrict && matchSubject;
                  });

                  return filteredArchives.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center p-8 text-neutral-500 text-center">
                      <Database className="w-8 h-8 text-neutral-700 stroke-1 mb-1.5" />
                      <p className="text-[11px] font-bold">未找到匹配的归档记录</p>
                      <p className="text-[10px] text-neutral-600 mt-0.5">请修改搜索条件后再试。</p>
                    </div>
                  ) : (
                    paginatedArchives.map(item => {
                      const isChecked = selectedArchiveIds.includes(item.id);
                      const displayId = extractOrderNo(item.rawContent) || item.order_no || item.orderId || item.id;
                      return (
                        <div
                          key={item.id}
                          className={`p-3 md:px-6 md:py-3.5 hover:bg-neutral-850/15 flex flex-col md:flex-row items-start md:items-center text-xs gap-2 ${isChecked ? 'bg-[#ff7823]/5' : ''}`}
                        >
                          {/* Checkbox for batch delete */}
                          <div 
                            onClick={() => {
                              if (isChecked) {
                                setSelectedArchiveIds(prev => prev.filter(id => id !== item.id));
                              } else {
                                setSelectedArchiveIds(prev => [...prev, item.id]);
                              }
                            }}
                            className="w-6 h-6 shrink-0 cursor-pointer mt-0.5 md:mt-0"
                          >
                            {isChecked ? (
                              <CheckSquare className="w-5 h-5 text-orange-500 fill-orange-500/20" />
                            ) : (
                              <Square className="w-5 h-5 text-neutral-600" />
                            )}
                          </div>
                          {/* PC only: Order ID */}
                          <span className="hidden md:block w-24 shrink-0 text-[10px] text-neutral-400 font-mono tracking-tight font-bold truncate">{displayId}</span>
                          {/* PC only: District */}
                          <span className="hidden md:block w-24 shrink-0 text-center text-[10px] text-neutral-400 truncate">{item.district || '未识别'}</span>
                          {/* PC only: Subject */}
                          <span className="hidden md:block w-28 shrink-0 text-center text-[10px] text-neutral-400 truncate">{item.grade} {item.subject}</span>
                          {/* PC only: Price */}
                          <span className="hidden md:block w-28 shrink-0 text-[10px] text-neutral-400 font-mono truncate">¥{item.price}/h</span>
                          {/* PC only: Description */}
                          <span className="hidden md:flex flex-1 min-w-0 px-4 text-[10px] text-neutral-400 truncate">{item.studentDesc}</span>
                          {/* PC only: Time */}
                          <span className="hidden md:block w-36 text-right shrink-0 text-[9px] text-neutral-500 font-mono">{item.publishTime || '2026-06-04 11:00'}</span>
                          {/* Mobile card style */}
                          <div className="w-full">
                            <div className="flex flex-wrap items-center gap-2 mb-1.5">
                              <span className="font-mono font-bold text-neutral-400 select-all text-[10px] tracking-tight font-bold">{extractOrderNo(item.rawContent) || item.order_no || item.orderId || item.id}</span>
                              <span className="bg-neutral-800 text-neutral-450 border border-neutral-750 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                {item.district || '未识别'}
                              </span>
                              <span className="bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded text-[9px] font-bold">
                                {item.grade} {item.subject}
                              </span>
                              <span className="font-mono font-bold text-neutral-400 text-[11px]">
                                ¥{item.price}<span className="text-[9px] text-neutral-600">/时</span>
                              </span>
                            </div>
                            <p className="text-neutral-400 font-medium truncate text-[11px]">{item.studentDesc}</p>
                            <p className="text-[10px] text-neutral-600 truncate leading-none mt-1">地址: {item.address}</p>
                            <p className="text-[9px] text-neutral-600 font-mono mt-1">{item.publishTime || '2026-06-04 11:00'}</p>
                          </div>
                        </div>
                      );
                    })
                  );
                })()}
              </div>

              {/* Archive Pagination */}
              {totalArchivePages > 1 && (
                <div className="flex items-center justify-center gap-2 py-3 border-t border-neutral-800 shrink-0">
                  <button
                    onClick={() => setArchivePage(p => Math.max(1, p - 1))}
                    disabled={archivePage === 1}
                    className="px-3 py-1.5 text-xs font-bold text-neutral-400 hover:text-orange-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    上一页
                  </button>
                  <span className="px-3 py-1.5 text-xs font-bold text-orange-500 bg-orange-950/30 rounded">
                    {archivePage} / {totalArchivePages}
                  </span>
                  <button
                    onClick={() => setArchivePage(p => Math.min(totalArchivePages, p + 1))}
                    disabled={archivePage === totalArchivePages}
                    className="px-3 py-1.5 text-xs font-bold text-neutral-400 hover:text-orange-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    下一页
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* User Feedback Notifications Panel */}
      {feedbacks.length > 0 && (
        <div className="p-3 md:p-4 bg-[#0f1013] border-t border-neutral-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              <span className="text-xs font-bold text-neutral-300">用户反馈 ({feedbacks.length})</span>
              {feedbacks.some(f => !f.isRead) && (
                <span className="bg-red-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                  {feedbacks.filter(f => !f.isRead).length} 未读
                </span>
              )}
            </div>
          </div>
          
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {feedbacks.slice().reverse().map(feedback => (
              <div 
                key={feedback.id} 
                className={`p-2 rounded-lg text-xs ${feedback.isRead ? 'bg-neutral-900/50' : 'bg-blue-950/30 border border-blue-800/50'}`}
                onClick={() => markFeedbackAsRead(feedback.id)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-neutral-300 break-words">{feedback.content}</p>
                    <p className="text-[9px] text-neutral-500 mt-1 font-mono">{feedback.submitTime}</p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteFeedback(feedback.id);
                    }}
                    className="p-1 hover:bg-neutral-800 rounded transition-colors shrink-0"
                  >
                    <X className="w-3 h-3 text-neutral-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Background decoration dots constraint - PC only */}
      <div className="hidden md:block absolute bottom-1 right-2 pointer-events-none text-[8.5px] font-mono text-neutral-750 select-none uppercase tracking-widest z-10">
        Database Stack: JSON Files Layer Simulation
      </div>
    </div>
  );
}
