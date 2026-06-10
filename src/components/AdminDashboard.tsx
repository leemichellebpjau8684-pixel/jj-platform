import React, { useState, useMemo, useEffect } from 'react';
import { 
  Check, X, FileText, AlertTriangle, Play, RefreshCw, Trash2, 
  Search, ShieldCheck, LogIn, ChevronRight, CornerDownRight, CheckSquare, 
  Square, Info, Activity, Database, Calendar, Clock, DollarSign, MapPin,
  HelpCircle
} from 'lucide-react';
import { Order, Coordinate } from '../types';
import { SHANGHAI_DISTRICTS, SUBJECTS, GRADES } from '../data';

// 管理员密码（从环境变量读取）
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || '';

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
    return sessionStorage.getItem('jiajiao_admin_verified') === 'true';
  });

  const handleLogin = () => {
    if (!ADMIN_PASSWORD) {
      setErrorPrompt('管理员密码未配置，请联系系统管理员');
      return;
    }
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      sessionStorage.setItem('jiajiao_admin_verified', 'true');
      setErrorPrompt('');
    } else {
      setErrorPrompt('密码错误，无法访问管理员后台');
    }
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

  // Feedback notifications
  const [alertInfo, setAlertInfo] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const triggerAlert = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setAlertInfo({ text, type });
    setTimeout(() => setAlertInfo(null), 3000);
  };

  // ----------------------------------------------------
  // INTELLIGENT REGEX TEXT PARSER (一键智能拆单解析)
  // ----------------------------------------------------
  const handleSmartParse = () => {
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
    const now = new Date();
    const timestampStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

    rawBlocks.forEach((block, index) => {
      const lines = block.split('\n').filter(line => line.trim().length > 0);
      
      // 1. Analyze Order ID - must extract from the order, do NOT auto-generate
      let orderId = '';
      let idLine = '';
      
      // First, check for bracket number patterns like 【762129】 or 🌙【818272】号信息
      const bracketIdMatch = block.match(/【(\d+)】/);
      if (bracketIdMatch) {
        orderId = bracketIdMatch[1];
        const idLineIndex = lines.findIndex(line => line.includes('【'));
        if (idLineIndex >= 0) {
          idLine = lines[idLineIndex].trim();
        }
      }
      
      // If not found, check for explicit ID patterns
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
      
      // If still not found, check first/last line for ID
      if (!orderId) {
        const idPattern = /([A-Za-z][A-Za-z0-9-#]*|\d{3,})/;
        
        if (lines.length > 0) {
          const firstLineMatch = lines[0].match(idPattern);
          if (firstLineMatch) {
            orderId = firstLineMatch[1];
            idLine = lines[0].trim();
          }
        }
        
        if (!orderId && lines.length > 0) {
          const lastLineMatch = lines[lines.length - 1].match(idPattern);
          if (lastLineMatch) {
            orderId = lastLineMatch[1];
            idLine = lines[lines.length - 1].trim();
          }
        }
      }
      
      // If still no ID found, skip this block with warning
      if (!orderId) {
        console.warn(`Skipping block ${index}: No valid ID found`);
        return;
      }

      // Eliminate overlapping id - append suffix if duplicate
      let finalOrderId = orderId;
      let suffix = 1;
      while (parsedList.some(o => o.id === finalOrderId) || drafts.some(o => o.id === finalOrderId) || orders.some(o => o.id === finalOrderId)) {
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
        if (!area) {
          for (const d of SHANGHAI_DISTRICTS) {
            const shortName = d.replace('区', '');
            if (shortName && block.includes(shortName)) {
              area = d;
              break;
            }
          }
        }
      }
      
      // If not clearly identified, default to empty to highlight the red visual error later!
      
      // 3. Subject & Grade
      let mathGrade = '其他';
      
      // Check for age patterns like "xx岁" where xx < 10
      const ageMatch = block.match(/(\d{1,2})岁/);
      if (ageMatch) {
        const age = parseInt(ageMatch[1], 10);
        if (age > 0 && age < 10) {
          mathGrade = '幼儿启蒙';
        }
      }
      
      // Check for kindergarten/early education keywords
      if (mathGrade === '其他' && (block.includes('幼') || block.includes('启蒙') || block.includes('幼儿园') || block.includes('学前'))) {
        mathGrade = '幼儿启蒙';
      }
      
      // Check for adult education
      if (mathGrade === '其他' && block.includes('成人')) {
        mathGrade = '成人';
      }
      
      // Check for grade level keywords
      if (mathGrade === '其他') {
        if (block.includes('小学') || 
            block.includes('一年级') || block.includes('二年级') || 
            block.includes('三年级') || block.includes('四年级') || 
            block.includes('五年级') || block.match(/\d年级/)?.[0]?.startsWith('1') ||
            block.match(/\d年级/)?.[0]?.startsWith('2') ||
            block.match(/\d年级/)?.[0]?.startsWith('3') ||
            block.match(/\d年级/)?.[0]?.startsWith('4') ||
            block.match(/\d年级/)?.[0]?.startsWith('5')) {
          mathGrade = '小学';
        } else if (block.includes('初中') || block.includes('初一') || 
                   block.includes('初二') || block.includes('初三') ||
                   block.includes('六年级') || block.includes('七年级') ||
                   block.includes('八年级') || block.includes('九年级')) {
          mathGrade = '初中';
        } else if (block.includes('高中') || block.includes('高一') || 
                   block.includes('高二') || block.includes('高三') ||
                   block.includes('高考')) {
          mathGrade = '高中';
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
      let priceTextDisplay = '';
      
      // Only extract price from lines containing price-related keywords to avoid matching order IDs
      const priceLines = block.split('\n').filter(line => 
        line.includes('元') || line.includes('薪资') || line.includes('时薪') || 
        line.includes('报酬') || line.includes('价格') || line.includes('薪水') ||
        line.includes('/h') || line.includes('小时') || line.includes('天') || line.includes('月')
      );
      const priceText = priceLines.join(' ');
      
      // Pattern to capture salary range with unit (e.g., "5000-7000/月", "100-130/h")
      const rangePattern = /(\d{2,5})-(\d{2,5})\s*\/\s*(h|月|天|小时)/i;
      const rangeMatch = priceText.match(rangePattern);
      
      if (rangeMatch) {
        // Extract range values
        const minVal = parseInt(rangeMatch[1], 10);
        const maxVal = parseInt(rangeMatch[2], 10);
        const unit = rangeMatch[3];
        priceTextDisplay = `${minVal}-${maxVal}/${unit}`;
        // Use max value for sorting
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
          /(?:薪资|时薪|薪水)[:：\s]*(\d{2,5})\s*(?:元|\/h|\/月|\/小时)?/i // 薪资/时薪/薪水: xx
        ];
        
        for (const pattern of singlePatterns) {
          const match = priceText.match(pattern);
          if (match) {
            priceRate = parseInt(match[1], 10);
            // Extract the full match for display
            const fullMatchStr = match[0];
            // Clean up and format the display text
            if (fullMatchStr.includes('/h') || fullMatchStr.includes('小时')) {
              priceTextDisplay = `${match[1]}/h`;
            } else if (fullMatchStr.includes('/月')) {
              priceTextDisplay = `${match[1]}/月`;
              priceRate = Math.round(priceRate / (22 * 8));
            } else if (fullMatchStr.includes('/天')) {
              priceTextDisplay = `${match[1]}/天`;
              priceRate = Math.round(priceRate / 8);
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
      const addrMatch = block.match(/(?:上课地点|地址|上课地址)[:：\s]*(.+)/i);
      if (addrMatch) {
        addressDetail = addrMatch[1].trim();
      } else {
        // Look for keywords of street or estate
        const lines = block.split('\n');
        const addrLine = lines.find(l => l.includes('路') || l.includes('街') || l.includes('弄') || l.includes('小区') || l.includes('公寓'));
        addressDetail = addrLine ? addrLine.replace(/^(?:上课地点|地址|上课地址)[:：\s]*/, '').trim() : '根据上课地点待定';
      }

      // 7. Frequency/Schedule
      let scheduleText = '每周2次，每次2小时';
      const freqMatch = block.match(/(?:上课时间|频次|时间)[:：\s]*(.+)/i);
      if (freqMatch) {
        scheduleText = freqMatch[1].trim();
      }

      // 8. Teacher requirements
      let teachReq = '男女教员均可，要求相关辅导技能稳固，沟通表达亲近。';
      const reqMatch = block.match(/(?:教员要求|要求)[:：\s]*(.+)/i);
      if (reqMatch) {
        teachReq = reqMatch[1].trim();
      }

      // 9. Coordinate translation mapping
      const coord = area ? DISTRICT_CENTERS[area] : { lat: 31.2304, lng: 121.4737 }; // midpoint default

      const isHigh = priceRate >= 120;
      const isOnlineLoc = block.includes('线上') || addressDetail.includes('线上') || block.includes('网课');

      const itemModel: Order = {
        id: orderId,
        district: area, 
        grade: mathGrade,
        subject: subName,
        coordinate: coord,
        studentDesc: studentDesc || '学员学习细节待沟通',
        studentDetail: block.length > 150 ? block.substring(0, 150) + '...' : block,
        frequency: scheduleText,
        address: addressDetail,
        requirements: teachReq,
        price: priceRate,
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

    setDrafts(prev => [...parsedList, ...prev]);
    setRawText(''); // empty inputs on success
    setSelectedDraftId(parsedList[0]?.id || null);
    triggerAlert(`成功智能拆单解析 ${parsedList.length} 个草稿订单！`, 'success');
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
      setEditId(activeDraft.id);
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
    if (!editId) return;
    if (!editDistrict) {
      triggerAlert('行政区必填，请选中上海一个行政区', 'error');
      return;
    }

    setDrafts(prev => prev.map(d => {
      if (d.id === editId) {
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
  const handleBatchPublish = () => {
    if (selectedDraftIds.length === 0) {
      triggerAlert('请先在列表中勾选要上架的草稿订单！', 'error');
      return;
    }

    // Identify drafts
    const itemsToPublish = drafts.filter(d => selectedDraftIds.includes(d.id));
    
    // Check missing fields (e.g., district empty) before publishing
    const invalidItemsIndex = itemsToPublish.findIndex(item => !item.district);
    if (invalidItemsIndex !== -1) {
      triggerAlert(`订单 ${itemsToPublish[invalidItemsIndex].id} 的行政区和定位仍未分配，请先补充修改！`, 'error');
      return;
    }

    // Move to online listed orders state
    setOrders(prev => [...itemsToPublish, ...prev]);

    // Clear from drafts pool
    setDrafts(prev => prev.filter(d => !selectedDraftIds.includes(d.id)));

    // Increment stats todayAdded & lastUpdated timestamp
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

  // 2. Archive selected drafts (批量作废归档草稿)
  const handleBatchDeclineDrafts = () => {
    if (selectedDraftIds.length === 0) {
      triggerAlert('请先在左侧勾选需要作废的草稿！', 'error');
      return;
    }

    // Add archive timestamp
    const now = new Date();
    const nowTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const itemsToDecline = drafts
      .filter(d => selectedDraftIds.includes(d.id))
      .map(item => ({ ...item, publishTime: nowTime })); // timestamp

    setArchives(prev => [...itemsToDecline, ...prev]);
    setDrafts(prev => prev.filter(d => !selectedDraftIds.includes(d.id)));
    setSelectedDraftIds([]);
    setSelectedDraftId(null);
    triggerAlert(`已作废并归档 ${itemsToDecline.length} 条数据。`, 'info');
  };

  // 3. Take down active listings (在售订单批量下架&自省归档)
  const [showTakedownConfirm, setShowTakedownConfirm] = useState(false);
  const [takedownTargetId, setTakedownTargetId] = useState<string | null>(null);

  const handleTakedownConfirmAction = () => {
    const listToTakedown = takedownTargetId 
      ? [takedownTargetId] 
      : selectedOnlineIds;

    if (listToTakedown.length === 0) {
      setShowTakedownConfirm(false);
      return;
    }

    // Extract items
    const now = new Date();
    const nowTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
    const takedownItems = orders
      .filter(o => listToTakedown.includes(o.id))
      .map(item => ({ ...item, publishTime: nowTime })); // append archived record timestamp

    // Move to archives
    setArchives(prev => [...takedownItems, ...prev]);
    // Delete from online orders
    setOrders(prev => prev.filter(o => !listToTakedown.includes(o.id)));

    // Update stats: update lastUpdated timestamp
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

  // Filtering on-sale orders list
  const filteredOnline = useMemo(() => {
    return orders.filter(o => {
      if (onlineSearchId && !o.id.toLowerCase().includes(onlineSearchId.toLowerCase())) return false;
      if (onlineSearchDistrict !== '全部' && o.district !== onlineSearchDistrict) return false;
      if (onlineSearchSubject !== '全部' && o.subject !== onlineSearchSubject) return false;
      return true;
    });
  }, [orders, onlineSearchId, onlineSearchDistrict, onlineSearchSubject]);

  // Handle rendering of authentication block overlay before access
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

        {/* Ambient grid background */}
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

        <button
          onClick={onBackToUser}
          className="px-2 md:px-4 py-1.5 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-xs text-neutral-300 font-bold rounded-lg transition-colors flex items-center gap-1.5"
        >
          <X className="w-3.5 h-3.5 text-neutral-400" />
          <span className="hidden md:inline">返回教员前台</span>
          <span className="md:hidden text-[10px]">返回</span>
        </button>
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
            <div className="flex-1 flex flex-col md:flex-row min-w-0">
            {/* Left 60% Panel: WeChat Input & Draft Collection - Full width on mobile */}
            <div className="w-full md:w-[62%] border-r border-neutral-800 p-3 md:p-5 flex flex-col min-w-0 overflow-y-auto">
              
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
              <div className="flex-1 min-h-0 overflow-y-auto space-y-2.5 pr-1 font-sans">
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
                            <span className="text-[10px] text-neutral-400 font-mono tracking-tight font-bold">{item.id}</span>
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
                    if (selectedOnlineIds.length === filteredOnline.length) {
                      setSelectedOnlineIds([]);
                    } else {
                      setSelectedOnlineIds(filteredOnline.map(o => o.id));
                    }
                  }}
                  className="cursor-pointer"
                >
                  {selectedOnlineIds.length === filteredOnline.length && filteredOnline.length > 0 ? (
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
                  filteredOnline.map(item => {
                    const isChecked = selectedOnlineIds.includes(item.id);

                    return (
                      <div
                        key={item.id}
                        className={`p-3 md:px-5 md:py-3.5 hover:bg-neutral-850/30 flex flex-col md:flex-row items-start md:items-center gap-3 md:gap-4 text-xs ${
                          isChecked ? 'bg-[#ff7823]/5' : ''
                        }`}
                      >
                        {/* Mobile: Card content, PC: Row content */}
                        <div className="flex items-start gap-3 w-full md:w-auto">
                          {/* Checkbox item */}
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
                              <CheckSquare className="w-4 h-4 text-orange-500 fill-orange-500/10 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-neutral-600 shrink-0" />
                            )}
                          </div>

                          {/* ID - Mobile card style */}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-2">
                              <span className="font-mono font-bold text-neutral-400 tracking-tight select-all text-[10px] md:text-xs">{item.id}</span>
                              <span className="bg-neutral-800 text-neutral-300 font-extrabold px-1.5 py-0.5 rounded text-[9px] md:text-[10px]">{item.district}</span>
                              <span className="bg-orange-950/80 border border-orange-900/40 text-orange-300 font-extrabold px-1.5 py-0.5 rounded text-[9px] md:text-[9.5px]">{item.grade} {item.subject}</span>
                              <span className="font-mono font-bold text-orange-450 text-[11px] md:text-[12px]">¥{item.price}<span className="text-[9px] text-neutral-500 font-semibold uppercase md:hidden">/h</span></span>
                            </div>
                            <p className="text-neutral-300 truncate font-semibold text-[11px]">{item.studentDesc}</p>
                            <p className="text-[10px] text-neutral-500 truncate mt-0.5">地址：{item.address}</p>
                          </div>

                          {/* Mobile: Action button below, PC: Inline */}
                          <div className="md:hidden w-full">
                            <button
                              onClick={() => {
                                setTakedownTargetId(item.id);
                                setShowTakedownConfirm(true);
                              }}
                              className="w-full px-3 py-2 text-[11px] font-bold text-red-500 border border-red-500/20 hover:border-red-500/40 hover:bg-red-950/20 rounded transition-all cursor-pointer"
                            >
                              下架归档
                            </button>
                          </div>
                        </div>

                        {/* PC: Inline details */}
                        <div className="hidden md:flex items-center gap-4 w-auto">
                          <span className="w-20 text-center shrink-0">
                            <span className="bg-neutral-800 text-neutral-300 font-extrabold px-1.5 py-0.5 rounded text-[10px]">{item.district}</span>
                          </span>

                          <span className="w-24 text-center shrink-0">
                            <span className="bg-orange-950/80 border border-orange-900/40 text-orange-300 font-extrabold px-1.5 py-0.5 rounded text-[9.5px]">{item.grade} {item.subject}</span>
                          </span>

                          <span className="w-32 shrink-0 font-mono font-bold text-orange-450 text-[12px]">
                            ¥{item.price} <span className="text-[9px] text-neutral-500 font-semibold uppercase">/ 小时</span>
                          </span>

                          <div className="flex-1 min-w-0 pr-6 text-left">
                            <p className="text-neutral-300 truncate font-semibold">{item.studentDesc}</p>
                            <p className="text-[10px] text-neutral-500 truncate mt-0.5">地址：{item.address}</p>
                          </div>

                          <div className="w-24 text-center shrink-0">
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
                      </div>
                    );
                  })
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
                <span className="hidden md:inline">由于安全可追溯机制，归档记录属于审计台账数据库，<b>仅支持只读查阅，无法修改或重新发布。</b></span>
                <span className="md:hidden">归档为审计台账，仅支持只读查阅</span>
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
            </div>

            <div className="flex-1 min-h-0 bg-neutral-900/30 border border-neutral-800 rounded-xl overflow-hidden flex flex-col">
              {/* Header - PC only */}
              <div className="hidden md:flex bg-neutral-850/50 px-6 py-2.5 border-b border-neutral-800 text-[10px] text-neutral-400 font-bold uppercase items-center">
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
                    filteredArchives.map(item => (
                      <div
                        key={item.id}
                        className="p-3 md:px-6 md:py-3.5 hover:bg-neutral-850/15 flex flex-col md:flex-row items-start md:items-center text-xs opacity-75 gap-2"
                      >
                        {/* Mobile card style */}
                        <div className="w-full">
                          <div className="flex flex-wrap items-center gap-2 mb-1.5">
                            <span className="font-mono font-bold text-neutral-500 select-all text-[10px]">{item.id}</span>
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
                    ))
                  );
                })()}
              </div>
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
