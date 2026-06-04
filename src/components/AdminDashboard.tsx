import React, { useState, useMemo, useEffect } from 'react';
import { 
  Check, X, FileText, AlertTriangle, Play, RefreshCw, Trash2, 
  Search, ShieldCheck, LogIn, ChevronRight, CornerDownRight, CheckSquare, 
  Square, Info, Activity, Database, Calendar, Clock, DollarSign, MapPin
} from 'lucide-react';
import { Order, Coordinate } from '../types';
import { SHANGHAI_DISTRICTS, SUBJECTS, GRADES } from '../data';

// 从环境变量获取管理员密码（生产环境应在 Netlify 后台配置）
const ADMIN_PASSWORD = (import.meta as any).env?.VITE_ADMIN_PASSWORD || '';

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
  onBackToUser
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

    // Split raw text into individual blocks by looking for empty lines or specific headings
    const rawBlocks = rawText
      .split(/\n\s*\n|(?=订单编号)[:：]|(?=编号)[:：]|(?=【订单|SH-2026)/gi)
      .map(b => b.trim())
      .filter(b => b.length > 8);

    if (rawBlocks.length === 0) {
      triggerAlert('未拆分出有效段落，请检查文本格式', 'error');
      return;
    }

    const parsedList: Order[] = [];
    const timestampStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    rawBlocks.forEach((block, index) => {
      // 1. Analyze Order ID
      let orderId = '';
      const idMatch = block.match(/(?:SH-2\d{3}-\d+|订单编号[:：\s]*([A-Za-z0-9-]+)|编号[:：\s]*([A-Za-z0-9-]+))/i);
      if (idMatch) {
        orderId = idMatch[1] || idMatch[2] || idMatch[0];
      } else {
        orderId = `SH-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      }

      // Eliminate overlapping id
      if (parsedList.some(o => o.id === orderId) || drafts.some(o => o.id === orderId) || orders.some(o => o.id === orderId)) {
        orderId = `SH-2026-${Math.floor(10000 + Math.random() * 90000)}`;
      }

      // 2. Area/District
      let area = '';
      for (const d of SHANGHAI_DISTRICTS) {
        if (block.includes(d)) {
          area = d;
          break;
        }
      }
      // If not clearly identified, default to empty to highlight the red visual error later!
      
      // 3. Subject & Grade
      let mathGrade = '高中';
      if (block.includes('小学') || block.includes('初一') || block.includes('初二') || block.includes('三年级') || block.includes('五年级')) {
        mathGrade = block.includes('小学') || block.includes('年级') ? '小学' : '初中';
      } else if (block.includes('高') || block.includes('高一') || block.includes('高二') || block.includes('高三') || block.includes('高考')) {
        mathGrade = '高中';
      } else if (block.includes('幼儿') || block.includes('启蒙')) {
        mathGrade = '幼儿启蒙';
      }

      let subName = '';
      for (const s of SUBJECTS) {
        if (block.includes(s)) {
          subName = s;
          break;
        }
      }
      if (!subName) {
        // Fallback checks
        if (block.includes('数')) subName = '数学';
        else if (block.includes('英')) subName = '英语';
        else if (block.includes('理')) subName = '物理';
        else if (block.includes('化')) subName = '化学';
        else subName = '数学'; // Default fallback
      }

      // 4. Price / Hour Rate (Salary)
      let priceRate = 100;
      const priceMatch = block.match(/(\d{2,3})\s*(?:元|¥|\/小时)/);
      if (priceMatch) {
         priceRate = parseInt(priceMatch[1], 10);
      } else {
        // Search pure digits of length 3 e.g. 120, 150
        const priceAlt = block.match(/(?:时薪|报酬|价格)[:：\s]*(\d{2,3})/);
        if (priceAlt) {
          priceRate = parseInt(priceAlt[1], 10);
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
        isHighPrice: isHigh,
        isOnline: isOnlineLoc,
        isCollegeStudent: block.includes('大学生') || block.includes('女生') || block.includes('男生'),
        isNegotiable: block.includes('面议') || block.includes('协商') || priceRate === 0,
        contactTeacher: 'Ken06103',
        publishTime: timestampStr
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
  const [editStudentDesc, setEditStudentDesc] = useState('');
  const [editStudentDetail, setEditStudentDetail] = useState('');
  const [editFrequency, setEditFrequency] = useState('');
  const [editRequirements, setEditRequirements] = useState('');
  const [editOrderTag, setEditOrderTag] = useState('');

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
    const nowTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
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
    const nowTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
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
    const nowTime = new Date().toISOString().replace('T', ' ').substring(0, 19);
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
      <div className="w-[1024px] h-[768px] bg-[#111] flex items-center justify-center font-sans tracking-tight select-none relative">
        <div className="w-96 bg-[#1f1f1f] border border-neutral-800 rounded-2xl p-8 shadow-2xl flex flex-col relative z-20">
          
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
    <div className="w-[1024px] h-[768px] bg-[#141517] flex flex-col font-sans overflow-hidden text-neutral-200 relative select-none">
      
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
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="w-[420px] bg-neutral-900 border border-neutral-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex gap-3 text-orange-500">
              <AlertTriangle className="w-10 h-10 shrink-0" />
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
      <header className="h-14 bg-[#1a1b1e] border-b border-neutral-800 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-orange-500 rounded flex items-center justify-center text-white font-black text-sm shadow-md">J2</div>
          <div className="flex flex-col">
            <h1 className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
              家教教员接单平台 
              <span className="text-[9px] bg-neutral-800 text-orange-400 border border-neutral-700 px-1 rounded font-mono font-semibold">管理员端 V1.0</span>
            </h1>
            <span className="text-[9px] text-neutral-500 font-semibold">纯 JSON 文件持久化数据池 &amp; 微信智能导入拆单后台</span>
          </div>
        </div>

        {/* Global Statistics Indicators (Unified stat.json syncing) */}
        <div className="flex gap-6 text-xs bg-neutral-950 px-4 py-1.5 rounded-lg border border-neutral-850">
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
          className="px-4 py-1.5 bg-neutral-800 border border-neutral-700 hover:bg-neutral-700 text-xs text-neutral-300 font-bold rounded-lg transition-colors flex items-center gap-1.5"
        >
          <X className="w-3.5 h-3.5 text-neutral-400" />
          <span>返回教员前台</span>
        </button>
      </header>

      {/* 2. Top-level Admin Menu Tabs */}
      <div className="bg-[#1a1b1e] px-6 py-1.5 border-b border-neutral-800 flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => { setAdminTab('draft'); setSelectedOnlineId(null); }}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            adminTab === 'draft' 
              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30' 
              : 'border border-transparent hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Database className="w-3.5 h-3.5 shrink-0" />
          <span>待审核草稿订单 ({drafts.length})</span>
          <span className="text-[9px] font-mono px-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-550">draft.json</span>
        </button>

        <button
          onClick={() => { setAdminTab('online'); setSelectedDraftId(null); }}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            adminTab === 'online' 
              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30' 
              : 'border border-transparent hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Activity className="w-3.5 h-3.5 shrink-0" />
          <span>线上在售中心 ({orders.length})</span>
          <span className="text-[9px] font-mono px-1 rounded bg-neutral-900 border border-neutral-800 text-teal-500">online.json</span>
        </button>

        <button
          onClick={() => { setAdminTab('archive'); setSelectedDraftId(null); setSelectedOnlineId(null); }}
          className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
            adminTab === 'archive' 
              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30' 
              : 'border border-transparent hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200'
          }`}
        >
          <Calendar className="w-3.5 h-3.5 shrink-0" />
          <span>归档历史台账 ({archives.length})</span>
          <span className="text-[9px] font-mono px-1 rounded bg-neutral-900 border border-neutral-800 text-neutral-500">archive.json</span>
        </button>
      </div>

      {/* 3. Main Dashboard Body Panel */}
      <main className="flex-1 min-h-0 flex bg-[#141517]">
        
        {/* TAB 1: DRAFTS AND CHAT RAW WRITER INTAKE */}
        {adminTab === 'draft' && (
          <div className="flex-1 flex min-w-0">
            {/* Left 60% Panel: WeChat Input & Draft Collection */}
            <div className="w-[62%] border-r border-neutral-800 p-5 flex flex-col min-w-0">
              
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
                  placeholder="👉 粘贴微信群带表情、#标签、物理/数学等复杂乱行的原始要求文本。例如：
#SH-2026-9051
【课时时薪】150元/每小时！要求交大或同济大学老师，每周上2次
【学生基础】杨浦区高三理科女学生，函数非常薄弱。上课地点靠近五角场。"
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
                        onClick={() => setSelectedDraftId(item.id)}
                        className={`p-3.5 rounded-xl border text-left cursor-pointer relative transition-all flex items-start gap-4 ${
                          isActive 
                            ? 'bg-neutral-850 border-orange-500/60 shadow-lg' 
                            : 'bg-neutral-900/40 border-neutral-800 hover:bg-neutral-850 hover:border-neutral-750'
                        }`}
                      >
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
                              <DollarSign className="w-3 h-3 text-orange-450 shrink-0" /> 时薪: ¥{item.price}
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

            {/* Right 38% Panel: 40% Interactive Advanced Editor Fields */}
            <div className="w-[38%] p-5 bg-[#17181c] border-l border-neutral-800 flex flex-col min-w-0">
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
                      <select
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-850 text-neutral-250 py-1.5 px-1.5 rounded text-[11px]"
                      >
                        {SUBJECTS.map(s => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
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
                      <span className="text-[10px] font-bold text-neutral-400 block uppercase">教员时薪时数</span>
                      <div className="relative">
                        <input
                          type="number"
                          value={editPrice}
                          onChange={(e) => setEditPrice(Math.max(0, parseInt(e.target.value, 10)) || 0)}
                          className="w-full bg-neutral-900 border border-neutral-850 text-neutral-200 py-1.5 pl-2.5 pr-5 rounded text-[11.5px] font-mono focus:ring-1 focus:ring-orange-500 focus:outline-none"
                        />
                        <span className="absolute right-1 px-1.5 top-1.5 text-[8px] text-neutral-500 font-bold">元/H</span>
                      </div>
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
        )}

        {/* TAB 2: ACTIVE LISTINGS REMOVAL & SEARCH (online.json) */}
        {adminTab === 'online' && (
          <div className="flex-1 p-6 flex flex-col min-w-0">
            {/* Filter and Takedown action items at top */}
            <div className="bg-[#1a1b1e] p-4 rounded-xl border border-neutral-800 flex flex-wrap items-center justify-between gap-4 shrink-0 mb-4 text-xs font-semibold">
              <div className="flex items-center gap-3.5">
                <div className="flex items-center gap-1 text-neutral-400 py-1 ml-1.5">
                  <Search className="w-4 h-4 text-neutral-400" />
                  <span>在售订单精筛选:</span>
                </div>

                <input
                  type="text"
                  placeholder="搜索订单编号..."
                  value={onlineSearchId}
                  onChange={(e) => setOnlineSearchId(e.target.value)}
                  className="bg-neutral-950 border border-neutral-850 p-1.5 px-3 rounded font-mono text-[10.5px] tracking-tight placeholder-neutral-600 focus:outline-none focus:border-neutral-700 w-44"
                />

                <select
                  value={onlineSearchDistrict}
                  onChange={(e) => setOnlineSearchDistrict(e.target.value)}
                  className="bg-neutral-950 border border-neutral-850 p-1.5 rounded text-[10.5px] text-neutral-300 focus:outline-none focus:border-neutral-700"
                >
                  <option value="全部">全部区域</option>
                  {SHANGHAI_DISTRICTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>

                <select
                  value={onlineSearchSubject}
                  onChange={(e) => setOnlineSearchSubject(e.target.value)}
                  className="bg-neutral-950 border border-neutral-850 p-1.5 rounded text-[10.5px] text-neutral-300 focus:outline-none focus:border-neutral-700"
                >
                  <option value="全部">全部辅导科目</option>
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
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5 shrink-0" />
                  <span>批量下架并备份归档 ({selectedOnlineIds.length})</span>
                </button>
              )}
            </div>

            {/* List with table header */}
            <div className="flex-1 min-h-0 bg-neutral-900/30 border border-neutral-800 rounded-xl overflow-hidden flex flex-col">
              
              {/* Batch Action checkboxes row header */}
              <div className="bg-neutral-850/50 px-5 py-2.5 border-b border-neutral-800 text-[10px] text-neutral-400 font-bold uppercase tracking-wider flex items-center gap-4">
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
                        className={`px-5 py-3.5 hover:bg-neutral-850/30 flex items-center gap-4 text-xs ${
                          isChecked ? 'bg-[#ff7823]/5' : ''
                        }`}
                      >
                        {/* Checkbox item */}
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
                            <CheckSquare className="w-4 h-4 text-orange-500 fill-orange-500/10 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-neutral-600 shrink-0" />
                          )}
                        </div>

                        {/* ID */}
                        <span className="w-24 shrink-0 font-mono font-bold text-neutral-400 tracking-tight select-all">{item.id}</span>

                        {/* District */}
                        <span className="w-20 text-center shrink-0">
                          <span className="bg-neutral-800 text-neutral-300 font-extrabold px-1.5 py-0.5 rounded text-[10px]">{item.district}</span>
                        </span>

                        {/* Subject */}
                        <span className="w-24 text-center shrink-0">
                          <span className="bg-orange-950/80 border border-orange-900/40 text-orange-300 font-extrabold px-1.5 py-0.5 rounded text-[9.5px]">{item.grade} {item.subject}</span>
                        </span>

                        {/* Price */}
                        <span className="w-32 shrink-0 font-mono font-bold text-orange-450 text-[12px]">
                          ¥{item.price} <span className="text-[9px] text-neutral-500 font-semibold uppercase">/ 小时</span>
                        </span>

                        {/* Details */}
                        <div className="flex-1 min-w-0 pr-6 text-left">
                          <p className="text-neutral-300 truncate font-semibold">{item.studentDesc}</p>
                          <p className="text-[10px] text-neutral-500 truncate mt-0.5">地址：{item.address}</p>
                        </div>

                        {/* Drop lists single control */}
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
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: READ-ONLY AUDIT TRACE LOGS (archive.json) */}
        {adminTab === 'archive' && (
          <div className="flex-1 p-6 flex flex-col min-w-0">
            <div className="bg-[#1a1b1e] border border-neutral-800 rounded-xl p-4 mb-4 flex items-center justify-between shrink-0 text-xs">
              <span className="text-neutral-400 font-semibold flex items-center gap-1.5">
                <Info className="w-4 h-4 text-[#06b6d4]" />
                由于安全可追溯机制，归档记录属于审计台账数据库，<b>仅支持只读查阅，无法修改或重新发布。</b>
              </span>
              <span className="font-bold text-neutral-500">归档池数: {archives.length} 条</span>
            </div>

            <div className="flex-1 min-h-0 bg-neutral-900/30 border border-neutral-800 rounded-xl overflow-hidden flex flex-col">
              {/* Header */}
              <div className="bg-neutral-850/50 px-6 py-2.5 border-b border-neutral-800 text-[10px] text-neutral-400 font-bold uppercase flex items-center">
                <span className="w-24 shrink-0">编号</span>
                <span className="w-24 shrink-0 text-center">行政区</span>
                <span className="w-28 shrink-0 text-center">类别科目</span>
                <span className="w-28 shrink-0">费用时薪</span>
                <span className="flex-1 min-w-0 px-4">留档事由与备注</span>
                <span className="w-36 text-right shrink-0">归档入账时间</span>
              </div>

              {/* Rows scrollbar */}
              <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-neutral-850 font-sans">
                {archives.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-neutral-500 text-center">
                    <Database className="w-8 h-8 text-neutral-700 stroke-1 mb-1.5" />
                    <p className="text-[11px] font-bold">归档历史台账暂空</p>
                    <p className="text-[10px] text-neutral-600 mt-0.5">当您执行在售订单下架，或者作废草稿时，记录在此累加生效。</p>
                  </div>
                ) : (
                  archives.map(item => (
                    <div
                      key={item.id}
                      className="px-6 py-3.5 hover:bg-neutral-850/15 flex items-center text-xs opacity-75"
                    >
                      <span className="w-24 shrink-0 font-mono font-bold text-neutral-500 select-all">{item.id}</span>
                      
                      <span className="w-24 shrink-0 text-center">
                        <span className="bg-neutral-800 text-neutral-450 border border-neutral-750 px-1.5 py-0.5 rounded text-[9.5px] font-bold">
                          {item.district || '未识别'}
                        </span>
                      </span>

                      <span className="w-28 text-center shrink-0">
                        <span className="bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded text-[9px] font-bold">
                          {item.grade} {item.subject}
                        </span>
                      </span>

                      <span className="w-28 font-mono font-bold text-neutral-400 text-xs shrink-0">
                        ¥{item.price} <span className="text-[9px] text-neutral-600">/ 时</span>
                      </span>

                      <div className="flex-1 min-w-0 px-4 text-left">
                        <p className="text-neutral-400 font-medium truncate">{item.studentDesc}</p>
                        <p className="text-[10px] text-neutral-600 truncate mt-0.5 leading-none">地址: {item.address}</p>
                      </div>

                      <span className="w-36 text-right text-[10px] text-neutral-500 font-mono shrink-0 select-none">
                        {item.publishTime || '2026-06-04 11:00'}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Background decoration dots constraint */}
      <div className="absolute bottom-1 right-2 pointer-events-none text-[8.5px] font-mono text-neutral-750 select-none uppercase tracking-widest z-10">
        Database Stack: JSON Files Layer Simulation
      </div>
    </div>
  );
}
