import { useEffect, useRef, useState, useMemo } from 'react';
import { Compass, RotateCcw, MapPin, Navigation, Search, X, Phone, Clock, DollarSign, Map, ChevronRight, CheckCircle2 } from 'lucide-react';
import { Landmark, Order, Coordinate } from '../types';
import { loadAMapScript, resetAMapLoad, AMAP_CONFIG, forwardGeocode, reverseGeocode } from '../services/amap';
import { getDistance } from '../utils';

interface ShanghaiRadarMapProps {
  currentLandmark: Landmark | null;
  filteredOrders: Order[];
  selectedOrderId: string | null;
  setSelectedOrderId: (id: string | null) => void;
  maxDistance: number;
  onModifyLandmark: () => void;
  activeTab: 'list' | 'map';
  onUpdateLandmark: (landmark: Landmark) => void;
  onViewOrderDetail: (order: Order) => void;
}

export default function ShanghaiRadarMap({
  currentLandmark,
  filteredOrders,
  selectedOrderId,
  setSelectedOrderId,
  maxDistance,
  onModifyLandmark,
  activeTab,
  onUpdateLandmark,
  onViewOrderDetail,
}: ShanghaiRadarMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const [userAddressInput, setUserAddressInput] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [showManualLocation, setShowManualLocation] = useState(false);

  // Cache to map student text addresses to true geocoded Lat/Lng to prevent shifting/wrong locations
  const [geocodedCache, setGeocodedCache] = useState<Record<string, { lat: number; lng: number }>>({});
  const geocodedCacheRef = useRef<Record<string, { lat: number; lng: number }>>({});

  // Elements Tracking Refs
  const markersRef = useRef<any[]>([]);
  const landmarkMarkerRef = useRef<any>(null);
  const radiusCircleRef = useRef<any>(null);
  const districtPolygonsRef = useRef<any[]>([]);
  const infoWindowRef = useRef<any>(null);

  // Selected & Hovered trackers
  const [selectedMapOrder, setSelectedMapOrder] = useState<Order | null>(null);

  const handleSearchAddress = async () => {
    if (!userAddressInput.trim()) {
      setSearchError('请输入地址');
      return;
    }
    
    setIsSearching(true);
    setSearchError(null);
    
    try {
      const result = await forwardGeocode(userAddressInput.trim(), { district: '上海市' });
      const newLandmark: Landmark = {
        id: 'custom_' + Date.now(),
        name: result.name || userAddressInput.trim(),
        address: result.address,
        coordinate: result.coordinate,
        type: 'custom',
      };
      
      onUpdateLandmark(newLandmark);
      setUserAddressInput('');
      setShowManualLocation(false);
      
      if (mapRef.current) {
        mapRef.current.panTo([result.coordinate.lng, result.coordinate.lat]);
        mapRef.current.setZoom(14);
      }
    } catch (error) {
      setSearchError('无法找到该地址，请尝试更详细的地址');
      console.error('Geocode error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleGpsLocate = async () => {
    setIsSearching(true);
    setSearchError(null);
    
    if (!navigator.geolocation) {
      setSearchError('您的浏览器不支持定位功能');
      setIsSearching(false);
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        try {
          const result = await reverseGeocode({ lat: latitude, lng: longitude });
          const newLandmark: Landmark = {
            id: 'gps_' + Date.now(),
            name: result.name || '当前定位位置',
            address: result.address,
            coordinate: { lat: latitude, lng: longitude },
            type: 'gps',
          };
          
          onUpdateLandmark(newLandmark);
          setShowManualLocation(false);
          
          if (mapRef.current) {
            mapRef.current.panTo([longitude, latitude]);
            mapRef.current.setZoom(15);
          }
        } catch (error) {
          setSearchError('无法解析当前位置');
          console.error('Reverse geocode error:', error);
        } finally {
          setIsSearching(false);
        }
      },
      (error) => {
        setSearchError('定位失败，请检查定位权限设置');
        console.error('GPS error:', error);
        setIsSearching(false);
      },
      { timeout: 10000 }
    );
  };

  // Geocode any addresses that are not currently cached in the local state
  useEffect(() => {
    if (!isLoaded) return;

    const pendingOrders = filteredOrders.filter((order) => !geocodedCacheRef.current[order.id]);

    if (pendingOrders.length === 0) return;

    pendingOrders.forEach((order) => {
      forwardGeocode(order.address, { 
        district: order.district, 
        anchor: order.coordinate,
        maxDeviationKm: 10
      }).then((result) => {
        const coords = result.coordinate;
        geocodedCacheRef.current[order.id] = coords;
        setGeocodedCache({ ...geocodedCacheRef.current });
        
        if (mapRef.current) {
          updateMarkersAndCoordinates();
        }
      }).catch((err) => {
        console.warn(`Failed to geocode order ${order.id}:`, err);
      });
    });
  }, [isLoaded, filteredOrders]);

  // Load AMap API Script on mount
  useEffect(() => {
    loadAMapScript()
      .then(() => {
        setIsLoaded(true);
      })
      .catch((err) => {
        console.error('AMap startup failed:', err);
        setLoadError('高德地图底图加载失败，请检查您的网络连接或稍后重试。');
      });
  }, []);

  // Initialize Map Instance
  useEffect(() => {
    if (!isLoaded || !containerRef.current || mapRef.current) return;

    const AMap = (window as any).AMap;

    try {
      const mapInstance = new AMap.Map(containerRef.current, {
        center: currentLandmark 
          ? [currentLandmark.coordinate.lng, currentLandmark.coordinate.lat] 
          : [121.4737, 31.2304],
        zoom: 12,
        viewMode: '3D',
        pitch: 15,
        theme: 'dark',
        layers: [
          new AMap.TileLayer.Satellite(),
          new AMap.TileLayer.RoadNet()
        ]
      });

      mapRef.current = mapInstance;

      // Create a unified InfoWindow reuse instance
      infoWindowRef.current = new AMap.InfoWindow({
        isCustom: true,
        offset: new AMap.Pixel(0, -25),
      });

      // 2. Load Shanghai District boundary micro-glowing contour
      loadShanghaiDistrictOutlines(mapInstance);

      // Force render markers once map is loaded completely
      setTimeout(() => {
        updateMarkersAndCoordinates();
      }, 500);

    } catch (e) {
      console.error('AMap instantiation failed:', e);
      setLoadError('高德地图组件渲染失败，请检查浏览器配置。');
    }

    return () => {
      // Map cleanup
      if (mapRef.current) {
        mapRef.current.destroy();
        mapRef.current = null;
      }
    };
  }, [isLoaded]);

  // Load Shanghai 16 administrative district outline glowing shadows
  const loadShanghaiDistrictOutlines = (map: any) => {
    const AMap = (window as any).AMap;
    const SHANGHAI_DISTRICTS = [
      '黄浦区', '徐汇区', '长宁区', '静安区', '普陀区', '虹口区', 
      '杨浦区', '闵行区', '宝山区', '嘉定区', '浦东新区', '金山区', 
      '松江区', '青浦区', '奉贤区', '崇明区'
    ];

    SHANGHAI_DISTRICTS.forEach((districtName) => {
      const searcher = new AMap.DistrictSearch({
        subdistrict: 0,
        extensions: 'all',
        level: 'district'
      });

      searcher.search(districtName, (status: string, result: any) => {
        if (status === 'complete' && result.districtList && result.districtList[0]) {
          const boundaries = result.districtList[0].boundaries;
          if (boundaries && map) {
            boundaries.forEach((boundary: any) => {
              const polygon = new AMap.Polygon({
                path: boundary,
                strokeColor: '#38bdf8', // Light glowing blue
                strokeOpacity: 0.45,
                strokeWeight: 1.2,
                fillColor: '#38bdf8',
                fillOpacity: 0.015,
                bubble: true,
              });
              polygon.setMap(map);
              districtPolygonsRef.current.push(polygon);
            });
          }
        }
      });
    });
  };

  // Synchronize Markers & Radius Circle Whenever dependencies render
  const updateMarkersAndCoordinates = () => {
    const map = mapRef.current;
    if (!map) return;

    const AMap = (window as any).AMap;

    // 1. Erase stale markers
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    // 2. Draw Tutor Anchor Point (青蓝色定位/地标)
    if (landmarkMarkerRef.current) {
      landmarkMarkerRef.current.setMap(null);
      landmarkMarkerRef.current = null;
    }

    if (currentLandmark) {
      const centerPos = [currentLandmark.coordinate.lng, currentLandmark.coordinate.lat];
      
      const landmarkContent = document.createElement('div');
      landmarkContent.className = 'relative flex items-center justify-center';
      landmarkContent.innerHTML = `
        <div class="absolute w-12 h-12 bg-cyan-400/20 rounded-full animate-ping" style="animation-duration: 3s;"></div>
        <div class="absolute w-6 h-6 bg-cyan-500/40 rounded-full"></div>
        <div class="w-4 h-4 bg-cyan-400 rounded-full border-2 border-white flex items-center justify-center shadow-md shadow-cyan-500/50">
          <div class="w-1.5 h-1.5 bg-white rounded-full"></div>
        </div>
        <div class="absolute -top-7 bg-cyan-600 border border-cyan-400 text-white font-bold text-[9px] px-1.5 py-0.5 rounded shadow whitespace-nowrap leading-none select-none">
          中心: ${currentLandmark.name.split(' ')[0]}
        </div>
      `;

      landmarkMarkerRef.current = new AMap.Marker({
        position: centerPos,
        content: landmarkContent,
        offset: new AMap.Pixel(-10, -10),
        zIndex: 150,
      });
      landmarkMarkerRef.current.setMap(map);

      // 3. Draw Commute Radiance Circle Limit
      if (radiusCircleRef.current) {
        radiusCircleRef.current.setMap(null);
        radiusCircleRef.current = null;
      }

      radiusCircleRef.current = new AMap.Circle({
        center: centerPos,
        radius: maxDistance * 1000, // standard conversion to meters
        strokeColor: '#00e5ff',
        strokeOpacity: 0.45,
        strokeWeight: 1.5,
        fillColor: '#00e5ff',
        fillOpacity: 0.05,
        strokeStyle: 'dashed',
        strokeDasharray: [6, 6],
        pointerEvents: 'none',
      });
      radiusCircleRef.current.setMap(map);
    }

    // 4. Place Student Tutor Order Icons (卫星精准落位)
    filteredOrders.forEach((order) => {
      const coords = geocodedCacheRef.current[order.id] || order.coordinate;
      const isSelected = selectedOrderId === order.id;

      const orderContent = document.createElement('div');
      orderContent.className = 'relative flex flex-col items-center justify-center';

      const gradeText = order.grade.length > 2 ? order.grade.substring(0, 2) : order.grade;
      const subjectText = order.subject.length > 3 ? order.subject.substring(0, 3) : order.subject;

      if (order.isHighPrice) {
        orderContent.innerHTML = `
          <div class="relative flex flex-col items-center cursor-pointer transition-all hover:scale-115">
            ${isSelected ? '<div class="absolute w-12 h-12 bg-red-500/20 rounded-full animate-ping" style="animation-duration: 1.5s;"></div>' : ''}
            <div class="w-7 h-7 bg-gradient-to-br from-red-500 to-orange-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg shadow-red-500/30">
              <span class="text-[10px]">🔥</span>
            </div>
            <div class="absolute -bottom-5 left-1/2 transform -translate-x-1/2 bg-green-600/95 text-white text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap shadow-md">
              ${gradeText}${subjectText}
            </div>
            ${isSelected ? '<div class="absolute -bottom-1 -right-1 bg-orange-500 w-2.5 h-2.5 rounded-full border-2 border-white shadow"></div>' : ''}
          </div>
        `;
      } else {
        orderContent.innerHTML = `
          <div class="relative flex flex-col items-center cursor-pointer transition-all hover:scale-115">
            ${isSelected ? '<div class="absolute w-10 h-10 bg-green-500/20 rounded-full animate-ping" style="animation-duration: 1.8s;"></div>' : ''}
            <div class="w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center shadow-md shadow-green-500/30">
              <div class="w-2 h-2 bg-white rounded-full"></div>
            </div>
            <div class="absolute -bottom-5 left-1/2 transform -translate-x-1/2 bg-green-700/95 text-white text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap shadow-md">
              ${gradeText}${subjectText}
            </div>
            ${isSelected ? '<div class="absolute -bottom-0.5 -right-0.5 bg-green-600 w-2 h-2 rounded-full border-2 border-white shadow"></div>' : ''}
          </div>
        `;
      }

      const markerInstance = new AMap.Marker({
        position: [coords.lng, coords.lat],
        content: orderContent,
        offset: new AMap.Pixel(-14, -14),
        zIndex: isSelected ? 120 : 100,
        extData: order,
      });

      markerInstance.on('mouseover', (e: any) => {
        const infoWindow = infoWindowRef.current;
        if (!infoWindow) return;

        infoWindow.setContent(`
          <div class="bg-neutral-950/95 border border-neutral-700/80 p-3 rounded-xl shadow-2xl text-white font-sans text-xs min-w-[150px] select-none backdrop-blur">
            <div class="flex items-center justify-between gap-2.5 border-b border-neutral-800 pb-2 mb-2">
              <span class="bg-orange-500 text-white font-black text-[10px] px-2 py-0.5 rounded leading-none shrink-0">${order.subject}</span>
              <span class="font-extrabold text-[11px] font-mono ${order.isHighPrice ? 'text-red-400' : 'text-emerald-400'}">
                ${order.isNegotiable ? '面议' : `¥${order.price}/h`}
              </span>
            </div>
            <div class="text-[10px] text-neutral-400 flex items-center justify-between gap-1 mb-1">
              <span>年级: ${order.grade}</span>
              <span class="text-neutral-500">${order.district}</span>
            </div>
            <div class="text-[9px] text-neutral-510 leading-snug truncate border-t border-neutral-900 pt-1">
              ${order.address}
            </div>
          </div>
        `);
        infoWindow.open(map, markerInstance.getPosition());
      });

      markerInstance.on('mouseout', () => {
        const infoWindow = infoWindowRef.current;
        if (infoWindow) {
          infoWindow.close();
        }
      });

      markerInstance.on('click', () => {
        setSelectedOrderId(order.id);
        setSelectedMapOrder(order);
      });

      markerInstance.setMap(map);
      markersRef.current.push(markerInstance);
    });

    // Auto fit/pan to fit landmark and orders if available
    if (currentLandmark && markersRef.current.length > 0) {
      // Pan to the tutor landmark as center smoothly
      map.panTo([currentLandmark.coordinate.lng, currentLandmark.coordinate.lat]);
    }
  };

  // Re-run syncing whenever parameters shift
  useEffect(() => {
    if (isLoaded) {
      updateMarkersAndCoordinates();
    }
  }, [isLoaded, currentLandmark, filteredOrders, selectedOrderId, maxDistance]);

  // Adjust center or zoom level through map instance
  const zoomIn = () => {
    if (mapRef.current) {
      mapRef.current.zoomUp();
    }
  };

  const zoomOut = () => {
    if (mapRef.current) {
      mapRef.current.zoomDown();
    }
  };

  const resetView = () => {
    if (mapRef.current) {
      if (currentLandmark) {
        mapRef.current.setZoomAndCenter(12.5, [currentLandmark.coordinate.lng, currentLandmark.coordinate.lat]);
      } else {
        mapRef.current.setZoomAndCenter(11.5, [121.4737, 31.2304]);
      }
    }
  };

  return (
    <div className="flex-1 w-full h-full flex flex-col relative bg-neutral-950 font-sans overflow-hidden">
      {/* Absolute Header Overlay panel */}
      <div className="absolute top-3 left-3 bg-neutral-950/90 backdrop-blur border border-neutral-800 p-3 rounded-xl z-30 max-w-xs space-y-2 shadow-2xl select-none">
        <h4 className="text-xs font-extrabold text-orange-500 tracking-wide flex items-center gap-1.5">
          <Compass className="w-4 h-4" />
          <span>请先在列表视图设置好筛选条件和搜索范围（高级筛选）</span>
        </h4>

        {showManualLocation ? (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2 top-1.5 w-3.5 h-3.5 text-neutral-500" />
              <input
                type="text"
                value={userAddressInput}
                onChange={(e) => setUserAddressInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearchAddress()}
                placeholder="输入地址搜索..."
                className="w-full pl-7 pr-3 py-1.5 bg-neutral-800 border border-neutral-700 rounded-lg text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            {searchError && (
              <p className="text-[9px] text-red-400">{searchError}</p>
            )}
            <div className="flex gap-1.5">
              <button
                onClick={handleSearchAddress}
                disabled={isSearching}
                className="flex-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:bg-green-800 text-white text-[10px] font-bold rounded-lg transition flex items-center justify-center gap-1"
              >
                {isSearching ? '搜索中...' : '搜索地址'}
              </button>
              <button
                onClick={handleGpsLocate}
                disabled={isSearching}
                className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white text-[10px] font-bold rounded-lg transition flex items-center justify-center gap-1"
              >
                <Navigation className="w-3 h-3" />
                定位
              </button>
            </div>
            <button
              onClick={() => {
                setShowManualLocation(false);
                setUserAddressInput('');
                setSearchError(null);
              }}
              className="w-full py-1 text-[9px] text-neutral-400 hover:text-neutral-300 transition flex items-center justify-center gap-1"
            >
              <X className="w-3 h-3" />
              取消
            </button>
          </div>
        ) : (
          <>
            {currentLandmark ? (
              <div className="text-[10px] bg-neutral-900 border border-neutral-800/80 p-2 rounded-lg text-neutral-300 font-sans space-y-1">
                <div className="text-[9px] text-neutral-500 font-semibold tracking-wider uppercase">我的位置:</div>
                <div className="text-neutral-100 font-bold truncate">{currentLandmark.name}</div>
                <div className="text-cyan-400 font-bold text-[9.5px] border-t border-neutral-800 pt-1 mt-0.5">
                  搜索范围: {maxDistance}公里
                </div>
              </div>
            ) : (
              <div className="text-[10px] bg-red-900/30 border border-red-800/30 p-2 rounded-lg text-red-400 font-sans">
                <div className="font-semibold">未设置位置</div>
                <div className="text-[9px] mt-1">请添加您的位置以便查看附近订单</div>
              </div>
            )}
            
            <button
              onClick={() => setShowManualLocation(true)}
              className="w-full py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white text-[10px] font-bold rounded-lg transition flex items-center justify-center gap-1"
            >
              <MapPin className="w-3.5 h-3.5" />
              添加我的位置
            </button>
          </>
        )}

        <div className="pt-1.5 border-t border-neutral-900 text-[9.5px] text-neutral-500 flex justify-between font-medium">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>可接单 ({filteredOrders.length})
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>高价单🔥
          </span>
        </div>
      </div>

      {/* Floating Speed Radar Zoom controllers */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-30 select-none">
        <button 
          onClick={zoomIn} 
          className="w-8 h-8 bg-neutral-950/90 hover:bg-neutral-800 border border-neutral-800 font-sans text-base font-extrabold rounded-lg flex items-center justify-center text-white cursor-pointer active:scale-95 shadow-lg active:border-neutral-700/50"
          title="放大"
        >
          ＋
        </button>
        <button 
          onClick={zoomOut} 
          className="w-8 h-8 bg-neutral-950/90 hover:bg-neutral-800 border border-neutral-800 font-sans text-base font-extrabold rounded-lg flex items-center justify-center text-white cursor-pointer active:scale-95 shadow-lg active:border-neutral-700/50"
          title="缩小"
        >
          －
        </button>
        <button 
          onClick={resetView} 
          className="w-8 h-8 bg-neutral-950/90 hover:bg-neutral-800 border border-neutral-800 rounded-lg flex items-center justify-center text-neutral-300 cursor-pointer active:scale-95 shadow-lg"
          title="重置视角及聚焦"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Loading & Error Boundary */}
      {loadError ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center select-none bg-neutral-900 border border-neutral-800">
          <div className="text-4xl mb-4">🗺️</div>
          <h4 className="font-bold text-red-500 text-sm mb-2">地图加载失败</h4>
          <p className="text-xs text-neutral-400 max-w-xs leading-relaxed mb-4">{loadError}</p>
          <div className="bg-neutral-800/50 rounded-lg p-4 text-left max-w-xs">
            <p className="text-[10px] text-neutral-500 mb-2">📝 解决方案：</p>
            <ul className="text-[10px] text-neutral-400 space-y-1.5">
              <li className="flex items-start gap-1.5">
                <span className="text-orange-400">•</span>
                <span>请检查网络连接是否正常</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-orange-400">•</span>
                <span>确保已正确配置高德地图API密钥</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-orange-400">•</span>
                <span>在 .env 文件中设置 VITE_AMAP_JS_KEY</span>
              </li>
            </ul>
          </div>
          <button
            onClick={() => {
              setIsLoaded(false);
              setLoadError(null);
              resetAMapLoad();
              loadAMapScript()
                .then(() => {
                  setIsLoaded(true);
                })
                .catch((err) => {
                  setLoadError(err.message);
                });
            }}
            className="mt-4 px-4 py-2 bg-orange-500 text-white text-xs font-bold rounded-lg hover:bg-orange-600 transition-colors"
          >
            重新加载地图
          </button>
        </div>
      ) : !isLoaded ? (
        <div className="flex-1 flex flex-col items-center justify-center bg-[#111216] text-center select-none">
          <div className="relative mb-3 flex items-center justify-center">
            <div className="absolute animate-ping w-12 h-12 rounded-full bg-orange-500/10" style={{ animationDuration: '2s' }} />
            <div className="p-3.5 bg-orange-500 text-white rounded-2xl relative shadow-xl shadow-orange-500/10">
              <Compass className="w-6 h-6 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
          </div>
          <h4 className="font-bold text-neutral-300 text-xs">正在接入高德衛星实景圖层...</h4>
          <p className="text-[10px] text-neutral-500 mt-1 max-w-sm">
            底图加载时需要完成上海16行政区微光GIS数据装载，请稍候。
          </p>
        </div>
      ) : null}

      {/* AMap Container Anchor */}
      <div 
        id="amap-radar-map-container"
        ref={containerRef} 
        className="flex-1 w-full h-full"
        style={{ display: loadError ? 'none' : 'block' }}
      />

      {/* Static Map Legend Guide */}
      <div className="absolute bottom-3 right-3 bg-neutral-950/90 backdrop-blur-sm border border-neutral-800/80 px-3 py-2 rounded-lg z-30 text-[9.5px] text-neutral-400 flex items-center gap-3.5 select-none font-sans font-medium shadow-2xl">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-[#EF4444] rounded-full inline-block shadow shadow-red-500/50" />
          <span>高价家教订单</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-[#10B981] rounded-full inline-block shadow shadow-emerald-500/50" />
          <span>普通备战单</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 bg-[#06b6d4] rounded-full inline-block shadow shadow-cyan-500/50" />
          <span>教员驻点中心</span>
        </div>
      </div>

      {/* Click details tooltip popup block */}
      {selectedMapOrder && (
        <div 
          id="amap-selected-order-tooltip"
          className="absolute bottom-4 left-4 right-4 md:left-4 md:right-auto md:w-80 bg-neutral-950/95 backdrop-blur-sm border border-neutral-800 rounded-xl p-4 shadow-2xl z-30 select-none animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-3">
            <div className="min-w-0">
              <span className="text-[9px] text-neutral-500 font-mono block">{selectedMapOrder.id}</span>
              <h3 className="text-xs font-black text-white flex items-center gap-1.5 mt-0.5">
                <span className="bg-orange-600 text-white text-[9.5px] px-1.5 py-0.5 rounded leading-none shrink-0">{selectedMapOrder.district}</span>
                <span className="truncate">{selectedMapOrder.grade} | {selectedMapOrder.subject}</span>
              </h3>
            </div>
            <button 
              onClick={() => {
                setSelectedMapOrder(null);
                setSelectedOrderId(null);
              }} 
              className="text-neutral-500 hover:text-white p-1 rounded-full hover:bg-neutral-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 mb-3">
            <p className="text-[10px] text-neutral-400 leading-relaxed line-clamp-2">
              {selectedMapOrder.studentDesc}
            </p>
            
            <div className="grid grid-cols-2 gap-2 text-[9px]">
              <div className="flex items-center gap-1.5 text-neutral-500">
                <Map className="w-3 h-3" />
                <span className="truncate">{selectedMapOrder.address}</span>
              </div>
              <div className="flex items-center gap-1.5 text-neutral-500">
                <Clock className="w-3 h-3" />
                <span className="truncate">{selectedMapOrder.frequency}</span>
              </div>
            </div>

            {currentLandmark && !selectedMapOrder.isOnline && (
              <div className="flex items-center gap-1.5 text-[9px] text-cyan-400">
                <MapPin className="w-3 h-3" />
                <span>距离约 {getDistance(currentLandmark.coordinate.lat, currentLandmark.coordinate.lng, selectedMapOrder.coordinate.lat, selectedMapOrder.coordinate.lng)}km</span>
              </div>
            )}
            
            {selectedMapOrder.isOnline && (
              <div className="flex items-center gap-1.5 text-[9px] text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>线上授课免通勤</span>
              </div>
            )}
          </div>

          <div className="border-t border-neutral-900 pt-3 space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-1">
                <DollarSign className="w-3 h-3 text-orange-500" />
                <span className={`font-extrabold text-xs ${selectedMapOrder.isHighPrice ? 'text-red-400' : 'text-emerald-400'}`}>
                  {selectedMapOrder.isNegotiable ? '时薪面议' : `¥${selectedMapOrder.price}/小时`}
                </span>
              </div>
              {selectedMapOrder.isHighPrice && (
                <span className="text-[9px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">高价单 🔥</span>
              )}
            </div>

            <div className="flex gap-2">
              <button
                  onClick={() => {
                    onViewOrderDetail(selectedMapOrder);
                  }}
                  className="flex-1 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-white text-[10px] rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer"
                >
                  <span>查看需求书</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              
              <button
                onClick={() => {
                  const event = new CustomEvent('open-wechat-modal', { detail: { orderId: selectedMapOrder.id } });
                  window.dispatchEvent(event);
                }}
                className="flex-1 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white text-[10px] rounded-lg font-bold transition flex items-center justify-center gap-1 cursor-pointer shadow shadow-orange-500/10"
              >
                <Phone className="w-3 h-3" />
                <span>联系领单</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
