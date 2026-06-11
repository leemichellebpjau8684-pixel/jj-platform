import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MapPin, Search, School, Navigation, X, Check, ArrowLeft, Loader } from 'lucide-react';
import { Landmark, Coordinate } from '../types';
import { SHANGHAI_UNIVERSITIES } from '../data';
import { reverseGeocode, searchPOIs, loadAMapScript } from '../services/amap';

interface LandmarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (landmark: Landmark) => void;
  currentLandmark: Landmark | null;
}

export default function LandmarkModal({
  isOpen,
  onClose,
  onSelect,
  currentLandmark
}: LandmarkModalProps) {
  // Modal states: 'main' (home 3 buttons), 'gps' (browser locate), 'search' (text bar search), 'university' (school picker)
  const [activeTab, setActiveTab] = useState<'main' | 'gps' | 'search' | 'university'>('main');
  const [selectedTempLandmark, setSelectedTempLandmark] = useState<Landmark | null>(currentLandmark);
  
  // GPS position fetching variables
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [nearbyLandmarks, setNearbyLandmarks] = useState<Landmark[]>([]);

  // Search keyword variables
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Landmark[]>([]);

  // Standard locations for quick pick in Search Sub-tab
  const SHANGHAI_QUICK_LANDMARKS: Landmark[] = [
    { id: 'rmgc', name: '人民广场地铁站', address: '黄浦区人民大道120号', coordinate: { lat: 31.2335, lng: 121.4726 }, type: 'custom' },
    { id: 'xhj', name: '徐家汇地铁站', address: '徐汇区肇嘉浜路1111号', coordinate: { lat: 31.1945, lng: 121.4367 }, type: 'custom' },
    { id: 'wjc', name: '五角场百联又一城', address: '杨浦区淞沪路8号', coordinate: { lat: 31.3005, lng: 121.5145 }, type: 'custom' },
    { id: 'zjk', name: '张江高科地铁站', address: '浦东新区祖冲之路科苑路交叉口', coordinate: { lat: 31.2023, lng: 121.5878 }, type: 'custom' },
    { id: 'lh', name: '龙华寺佛塔', address: '徐汇区龙华路2853号', coordinate: { lat: 31.1712, lng: 121.4512 }, type: 'custom' },
    { id: 'sjdxc', name: '松江大学城地铁站', address: '松江区嘉松南路与梅家路交叉口', coordinate: { lat: 31.0454, lng: 121.2285 }, type: 'custom' }
  ];

  const handleGpsLocate = async () => {
    setGpsLoading(true);
    setGpsError(null);
    setNearbyLandmarks([]);
    
    try {
      // 使用高德地图定位服务
      await loadAMapScript();
      
      const AMap = (window as any).AMap;
      if (!AMap) {
        throw new Error('高德地图加载失败');
      }
      
      // 确保Geolocation插件已加载
      await new Promise<void>((resolve, reject) => {
        AMap.plugin('AMap.Geolocation', () => {
          const geolocation = new AMap.Geolocation({
            enableHighAccuracy: true, // 使用高精度定位
            timeout: 10000,
            buttonOffset: new AMap.Pixel(10, 20),
            zoomToAccuracy: true,
            buttonPosition: 'RB'
          });
          
          geolocation.getCurrentPosition(async (status: string, result: any) => {
            if (status === 'complete') {
              try {
                const { position } = result;
                const lng = position.getLng();
                const lat = position.getLat();
                const coordinate: Coordinate = { lat, lng };
                
                // 使用反向地理编码获取真实地址
                const geoResolved = await reverseGeocode(coordinate);
                
                const resolvedGpsLandmark: Landmark = {
                  id: 'gps_' + Date.now(),
                  name: geoResolved.name || '当前位置',
                  address: geoResolved.address,
                  coordinate,
                  type: 'gps'
                };
                setSelectedTempLandmark(resolvedGpsLandmark);
                
                // 使用搜索附近的POI
                const nearbyPOIs = await searchPOIs(geoResolved.name || '当前位置');
                
                // 合并POI结果，最多显示6个附近地标
                const nearbyResults: Landmark[] = nearbyPOIs.slice(0, 6).map((poi, idx) => ({
                  ...poi,
                  distance: getDistanceFromCoords(coordinate, poi.coordinate)
                }));
                
                // 如果POI结果不足，添加默认附近地标
                if (nearbyResults.length < 6) {
                  const defaultNearby: Landmark[] = [
                    { id: 'near_default_1', name: '地面停车场', address: `${geoResolved.address}附近停车场`, coordinate: { lat: lat + 0.001, lng: lng - 0.001 }, type: 'custom', distance: getDistanceFromCoords(coordinate, { lat: lat + 0.001, lng: lng - 0.001 }) },
                    { id: 'near_default_2', name: '便利店/超市', address: `${geoResolved.address}附近便利店`, coordinate: { lat: lat + 0.0008, lng: lng + 0.0008 }, type: 'custom', distance: getDistanceFromCoords(coordinate, { lat: lat + 0.0008, lng: lng + 0.0008 }) },
                    { id: 'near_default_3', name: '公交站', address: `${geoResolved.address}附近公交站`, coordinate: { lat: lat - 0.0012, lng: lng + 0.0005 }, type: 'custom', distance: getDistanceFromCoords(coordinate, { lat: lat - 0.0012, lng: lng + 0.0005 }) }
                  ];
                  const filteredDefaults = defaultNearby.filter(d => !nearbyResults.find(r => r.id === d.id)).slice(0, 6 - nearbyResults.length);
                  nearbyResults.push(...filteredDefaults);
                }
                
                setNearbyLandmarks(nearbyResults.sort((a, b) => (a.distance || 0) - (b.distance || 0)));
                setGpsLoading(false);
              } catch (geoError) {
                console.error('地理编码失败:', geoError);
                // 即使地理编码失败，也使用原始坐标
                const coordinate: Coordinate = { lat: result.position.getLat(), lng: result.position.getLng() };
                const resolvedGpsLandmark: Landmark = {
                  id: 'gps_' + Date.now(),
                  name: '当前位置',
                  address: `经度:${coordinate.lng.toFixed(4)}, 纬度:${coordinate.lat.toFixed(4)}`,
                  coordinate,
                  type: 'gps'
                };
                setSelectedTempLandmark(resolvedGpsLandmark);
                setNearbyLandmarks([]);
                setGpsLoading(false);
              }
            } else {
              // 定位失败
              throw new Error('无法获取您的位置信息，请检查定位权限设置');
            }
          });
        });
      });
    } catch (error) {
      console.error('GPS定位失败:', error);
      setGpsError(error instanceof Error ? error.message : '定位服务不可用，请检查浏览器定位权限设置');
      setGpsLoading(false);
    }
  };
  
  // 计算两点之间的距离（公里）
  const getDistanceFromCoords = (from: Coordinate, to: Coordinate): number => {
    const R = 6371; // 地球半径（公里）
    const dLat = (to.lat - from.lat) * Math.PI / 180;
    const dLon = (to.lng - from.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(from.lat * Math.PI / 180) * Math.cos(to.lat * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return Number((R * c).toFixed(2));
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const query = searchQuery.toLowerCase().trim();
    
    const allCandidates = [...SHANGHAI_UNIVERSITIES, ...SHANGHAI_QUICK_LANDMARKS];
    const filtered = allCandidates.filter(item => 
      item.name.toLowerCase().includes(query) || 
      item.address.toLowerCase().includes(query)
    );

    try {
      const poiResults = await searchPOIs(query);
      if (poiResults.length > 0) {
        setSearchResults([...poiResults, ...filtered]);
      } else {
        setSearchResults(filtered.length > 0 ? filtered : []);
      }
    } catch (e) {
      console.error('POI search error:', e);
      setSearchResults(filtered.length > 0 ? filtered : []);
    }
  };

  const handleConfirm = () => {
    if (selectedTempLandmark) {
      onSelect(selectedTempLandmark);
    }
    onClose();
  };

  const resetModal = () => {
    setActiveTab('main');
    setSearchQuery('');
    setSearchResults([]);
    setGpsError(null);
    setGpsLoading(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay background */}
      <motion.div 
        className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      <motion.div
        id="landmark-modal-card"
        className="relative bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-neutral-100 flex flex-col max-h-[85vh]"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: 'spring', duration: 0.4 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
          <div className="flex items-center gap-2">
            {activeTab !== 'main' && (
              <button 
                id="back-landmark-sub-tab"
                className="p-1 rounded-full text-neutral-500 hover:bg-neutral-100 transition-colors"
                onClick={() => setActiveTab('main')}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h3 className="font-semibold text-lg text-neutral-800">
              {activeTab === 'main' && '选择附近地标'}
              {activeTab === 'gps' && '自动定位'}
              {activeTab === 'search' && '搜索上海地标'}
              {activeTab === 'university' && '直接选择常用地标 (上海高校)'}
            </h3>
          </div>
          <button 
            id="close-landmark-modal-btn"
            className="p-1.5 rounded-full text-neutral-400 hover:bg-neutral-100/80 hover:text-neutral-600 transition-colors"
            onClick={onClose}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal content body */}
        <div className="p-6 flex-1 overflow-y-auto min-h-[250px]">
          
          <AnimatePresence mode="wait">
            {/* Main Menu (3 Buttons) */}
            {activeTab === 'main' && (
              <motion.div
                key="main"
                className="space-y-4 py-2"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
              >
                <p className="text-sm text-neutral-500 mb-2">
                  设置授课起始位置，系统将实时计算每个家教单到您的通勤直线距离，辅佐导航及就近检索。
                </p>

                {currentLandmark && (
                  <div className="p-3 bg-teal-50 border border-teal-100 rounded-xl flex items-start gap-2.5 mb-4">
                    <MapPin className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs text-teal-700 font-medium font-sans">当前生效地标：</div>
                      <div className="text-sm text-teal-900 font-semibold">{currentLandmark.name}</div>
                      <div className="text-xs text-teal-600 font-mono mt-0.5">{currentLandmark.address}</div>
                    </div>
                  </div>
                )}

                {/* 1. GPS Button */}
                <button
                  id="tab-gps-trigger"
                  onClick={() => {
                    setActiveTab('gps');
                    handleGpsLocate();
                  }}
                  className="w-full p-4 flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/40 text-blue-700 hover:bg-blue-50 transition-all text-left group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-blue-500 text-white rounded-lg group-hover:scale-105 transition-transform">
                      <Navigation className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-800">使用当前位置</h4>
                      <p className="text-xs text-neutral-500 mt-1">自动通过浏览器GPS定位您的实时坐标并绑定</p>
                    </div>
                  </div>
                  <X className="w-5 h-5 text-neutral-300 group-hover:text-blue-500 rotate-45 transition-colors" />
                </button>

                {/* 2. Text Search Button */}
                <button
                  id="tab-search-trigger"
                  onClick={() => {
                    setActiveTab('search');
                    setSearchResults([]);
                    setSearchQuery('');
                  }}
                  className="w-full p-4 flex items-center justify-between rounded-xl border border-emerald-100 bg-emerald-50/40 text-emerald-700 hover:bg-emerald-50 transition-all text-left group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-emerald-500 text-white rounded-lg group-hover:scale-105 transition-transform">
                      <Search className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-800">搜索上海地标</h4>
                      <p className="text-xs text-neutral-500 mt-1">手动输入上海区划、街道小区、写字楼站台</p>
                    </div>
                  </div>
                  <X className="w-5 h-5 text-neutral-300 group-hover:text-emerald-500 rotate-45 transition-colors" />
                </button>

                {/* 3. College Button */}
                <button
                  id="tab-college-trigger"
                  onClick={() => setActiveTab('university')}
                  className="w-full p-4 flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/40 text-amber-700 hover:bg-amber-50 transition-all text-left group"
                >
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-amber-500 text-white rounded-lg group-hover:scale-105 transition-transform">
                      <School className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-neutral-800">直接选择常用地标（上海高校）</h4>
                      <p className="text-xs text-neutral-500 mt-1">上海各知名高校、本科专科校门，一键单选绑定</p>
                    </div>
                  </div>
                  <X className="w-5 h-5 text-neutral-300 group-hover:text-amber-500 rotate-45 transition-colors" />
                </button>
              </motion.div>
            )}

            {/* GPS Loader */}
            {activeTab === 'gps' && (
              <motion.div
                key="gps"
                className="flex flex-col h-full"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                {gpsLoading ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center flex-1">
                    <div className="relative mb-4 flex items-center justify-center">
                      <div className="absolute animate-ping w-12 h-12 rounded-full bg-blue-100/80" />
                      <div className="p-4 bg-blue-500 text-white rounded-full relative">
                        <Loader className="w-7 h-7 animate-spin" />
                      </div>
                    </div>
                    <h4 className="font-semibold text-neutral-700 text-base">正在请求位置权限...</h4>
                    <p className="text-xs text-neutral-400 max-w-sm mt-2 leading-relaxed">
                      请在浏览器弹出的安全请求中予以【允许/授信】。我们将仅读取您当前的经纬度用于计算上海家教单的 commute 直线距离。
                    </p>
                  </div>
                ) : gpsError ? (
                  <div className="flex flex-col items-center justify-center py-8 text-center flex-1">
                    <div className="p-3 bg-red-100 text-red-600 rounded-full mb-3">
                      <X className="w-7 h-7" />
                    </div>
                    <h4 className="font-semibold text-neutral-800 text-base">自动定位失败</h4>
                    <p className="text-xs text-red-500 max-w-sm mt-2 leading-relaxed bg-red-50 p-2.5 rounded-lg border border-red-100">
                      {gpsError}
                    </p>
                    <button
                      id="gps-retry-btn"
                      className="mt-5 px-4 py-2 border border-neutral-200 text-neutral-700 rounded-xl hover:bg-neutral-50 font-medium text-xs transition-colors"
                      onClick={handleGpsLocate}
                    >
                      重新尝试定位
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col h-full">
                    {/* Header */}
                    <div className="flex items-center gap-2 px-1 mb-3">
                      <div className="p-2 bg-emerald-100 text-emerald-600 rounded-full">
                        <Check className="w-5 h-5" />
                      </div>
                      <h4 className="font-semibold text-neutral-800 text-sm">选择附近地标</h4>
                    </div>
                    
                    {/* Nearby landmarks list */}
                    <div className="flex-1 overflow-y-auto space-y-2 mb-3">
                      {nearbyLandmarks.map((landmark, index) => (
                        <div
                          key={landmark.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedTempLandmark?.id === landmark.id
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-neutral-200 hover:bg-neutral-50'
                          }`}
                          onClick={() => setSelectedTempLandmark(landmark)}
                        >
                          <div className="flex items-start gap-2">
                            <input
                              type="radio"
                              name="landmark-select"
                              checked={selectedTempLandmark?.id === landmark.id}
                              onChange={() => setSelectedTempLandmark(landmark)}
                              className="mt-0.5 w-4 h-4 text-blue-600"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-neutral-800 text-sm">{landmark.name}</div>
                              <div className="text-xs text-neutral-500 font-mono truncate">{landmark.address}</div>
                              {landmark.address !== landmark.address && (
                                <div className="text-xs text-neutral-500 font-mono truncate mt-0.5">{landmark.address}</div>
                              )}
                            </div>
                          </div>
                          {landmark.distance !== undefined && (
                            <div className="text-xs text-purple-600 mt-1 ml-6">距离: {landmark.distance}公里</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Manual Keyword Search */}
            {activeTab === 'search' && (
              <motion.div
                key="search"
                className="space-y-4"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      id="landmark-search-input"
                      type="text"
                      className="w-full pl-10 pr-3 py-2.5 rounded-lg border border-neutral-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent font-sans"
                      placeholder="键盘输入地标名，如：人民广场、五角场"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Search className="absolute left-3.5 top-3 w-4.5 h-4.5 text-neutral-400" />
                  </div>
                  <button
                    id="landmark-search-submit"
                    onClick={handleSearch}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-sm transition-colors cursor-pointer shrink-0"
                  >
                    搜索地标
                  </button>
                </div>

                {/* Quick landmarks preset list */}
                {searchQuery === '' && searchResults.length === 0 && (
                  <div>
                    <h5 className="text-xs font-semibold text-neutral-400 tracking-wider mb-2.5 uppercase">常用上海地标快捷按点:</h5>
                    <div className="grid grid-cols-2 gap-2">
                      {SHANGHAI_QUICK_LANDMARKS.map((item) => (
                        <button
                          key={item.id}
                          className={`p-2.5 rounded-lg text-left border text-xs transition-all ${
                            selectedTempLandmark?.name === item.name
                              ? 'border-emerald-500 bg-emerald-50/55 text-emerald-800'
                              : 'border-neutral-200 hover:bg-neutral-50 text-neutral-700'
                          }`}
                          onClick={() => setSelectedTempLandmark(item)}
                        >
                          <div className="font-semibold truncate">{item.name}</div>
                          <div className="font-mono text-[10px] text-neutral-400 truncate mt-0.5">{item.address}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Outlining matched results */}
                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-xs font-semibold text-neutral-400 tracking-wider">搜索匹配结果:</h5>
                    <div className="max-h-[220px] overflow-y-auto space-y-1.5 border border-neutral-100 rounded-lg p-2 bg-neutral-50/50">
                      {searchResults.map((item) => (
                        <button
                          key={item.id}
                          className={`w-full p-2.5 rounded-lg text-left text-xs border flex items-start gap-2.5 transition-all ${
                            selectedTempLandmark?.name === item.name
                              ? 'border-emerald-500 bg-emerald-50 text-emerald-800'
                              : 'border-neutral-100 bg-white hover:bg-neutral-50 text-neutral-700'
                          }`}
                          onClick={() => setSelectedTempLandmark(item)}
                        >
                          <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <div className="font-semibold text-neutral-800 truncate">{item.name}</div>
                            <div className="text-neutral-400 truncate mt-0.5">{item.address}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* University List Grid Selection */}
            {activeTab === 'university' && (
              <motion.div
                key="university"
                className="space-y-3"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
              >
                <p className="text-xs text-neutral-500">
                  上海预设部分常驻教员高校，挑选您的在读校区一键快捷勾选绑定。
                </p>
                <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
                  {SHANGHAI_UNIVERSITIES.map((school) => {
                    const isSelected = selectedTempLandmark?.id === school.id;
                    return (
                      <button
                        key={school.id}
                        className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-colors ${
                          isSelected
                            ? 'border-amber-500 bg-amber-50/50'
                            : 'border-neutral-100 hover:bg-neutral-50/70 bg-white'
                        }`}
                        onClick={() => setSelectedTempLandmark(school)}
                      >
                        <School className={`w-5 h-5 shrink-0 mt-0.5 ${isSelected ? 'text-amber-600' : 'text-neutral-400'}`} />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-sm text-neutral-800 truncate">{school.name}</div>
                          <div className="text-xs text-neutral-400 font-mono mt-0.5 truncate">{school.address}</div>
                        </div>
                        {isSelected && (
                          <div className="p-1 bg-amber-500 text-white rounded-full shrink-0">
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>

        {/* Selected preview bar at footer top if anything selected */}
        {selectedTempLandmark && (
          <div className="px-6 py-2.5 bg-neutral-50/80 border-t border-neutral-100 text-xs flex items-center justify-between text-neutral-700">
            <span className="text-neutral-400 shrink-0">当前选定地标:</span>
            <span className="font-semibold text-neutral-800 truncate max-w-[280px] text-right font-sans">
              {selectedTempLandmark.name}
            </span>
          </div>
        )}

        {/* Buttons */}
        <div className="px-6 py-4.5 bg-neutral-50 border-t border-neutral-100 flex items-center justify-between gap-3">
          <button
            id="reset-landmark-state"
            onClick={resetModal}
            className="px-4 py-2 text-xs font-semibold text-neutral-500 hover:text-neutral-700 transition-colors"
          >
            重置更改
          </button>
          
          <div className="flex gap-2">
            <button
              id="cancel-landmark-btn"
              onClick={onClose}
              className="px-4.5 py-2 rounded-xl text-xs font-semibold border border-neutral-200 text-neutral-600 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              取消
            </button>
            <button
              id="confirm-landmark-btn"
              disabled={!selectedTempLandmark || gpsLoading}
              onClick={handleConfirm}
              className={`px-6 py-2 rounded-xl text-xs font-semibold text-white transition-all ${(selectedTempLandmark && !gpsLoading) ? 'bg-orange-600 hover:bg-orange-700 cursor-pointer shadow-sm shadow-orange-500/10' : 'bg-neutral-300 cursor-not-allowed'}`}
            >
              确定绑定
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
