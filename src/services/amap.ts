import { Coordinate, TravelMode, NavigationResult, RouteStep, Landmark } from '../types';
import { getDistance } from '../utils';

const ENV = (import.meta as any).env || {};

console.log('AMAP ENV:', JSON.stringify({
  VITE_AMAP_JS_KEY: ENV.VITE_AMAP_JS_KEY,
  VITE_AMAP_JS_SECURITY_CODE: ENV.VITE_AMAP_JS_SECURITY_CODE,
}));

export const AMAP_CONFIG = {
  key: (ENV.VITE_AMAP_JS_KEY as string) || '',
  securityJsCode: (ENV.VITE_AMAP_JS_SECURITY_CODE as string) || '',
  city: '上海市',
};

const SHANGHAI_BBOX = { latMin: 30.5, latMax: 31.9, lngMin: 120.8, lngMax: 122.2 };
export const SHANGHAI_CENTER: Coordinate = { lat: 31.2304, lng: 121.4737 };

export interface GeoResolved {
  coordinate: Coordinate;
  address: string;
  name: string;
}

const forwardCache = new Map<string, GeoResolved>();
const reverseCache = new Map<string, GeoResolved>();

const coordKey = (c: Coordinate): string => `${c.lat.toFixed(5)},${c.lng.toFixed(5)}`;

function isInShanghai(c: Coordinate): boolean {
  return (
    c.lat > SHANGHAI_BBOX.latMin &&
    c.lat < SHANGHAI_BBOX.latMax &&
    c.lng > SHANGHAI_BBOX.lngMin &&
    c.lng < SHANGHAI_BBOX.lngMax
  );
}

let amapLoadPromise: Promise<void> | null = null;

function withTimeout<T>(promise: Promise<T>, ms: number, errorMsg: string): Promise<T> {
  const timeout = new Promise<T>((_, reject) =>
    setTimeout(() => reject(new Error(errorMsg)), ms)
  );
  return Promise.race([promise, timeout]);
}

export function loadAMapScript(): Promise<void> {
  if (amapLoadPromise) return amapLoadPromise;

  amapLoadPromise = new Promise<void>((resolve, reject) => {
    if ((window as any).AMap) {
      resolve();
      return;
    }

    if (!AMAP_CONFIG.key) {
      reject(new Error('AMAP_KEY_NOT_CONFIGURED'));
      return;
    }

    if (!AMAP_CONFIG.securityJsCode) {
      console.warn('高德地图安全密钥未配置，可能影响部分功能');
    }

    (window as any)._AMapSecurityConfig = {
      securityJsCode: AMAP_CONFIG.securityJsCode,
    };

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src =
      `https://webapi.amap.com/maps?v=2.0&key=${AMAP_CONFIG.key}` +
      `&plugin=AMap.Geocoder,AMap.DistrictSearch,AMap.PlaceSearch,AMap.Geolocation`;
    script.async = true;
    script.onerror = () => reject(new Error('高德地图脚本加载失败，请检查网络连接'));
    script.onload = () => {
      if ((window as any).AMap) {
        resolve();
      } else {
        reject(new Error('高德地图API初始化失败'));
      }
    };
    document.head.appendChild(script);
  });

  return withTimeout(amapLoadPromise, 5000, '高德地图脚本加载超时');
}

export interface GeolocationResult {
  coordinate: Coordinate;
  address: string;
  name: string;
}

export async function getCurrentPosition(): Promise<GeolocationResult> {
  await loadAMapScript();
  await ensurePlugins(['AMap.Geolocation']);
  const AMap = getAMap();
  if (!AMap) {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('您的浏览器不支持定位功能'));
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude: lat, longitude: lng } = position.coords;
          try {
            const reverseResult = await reverseGeocode({ lat, lng });
            resolve({
              coordinate: { lat, lng },
              address: reverseResult.address,
              name: reverseResult.name
            });
          } catch {
            resolve({
              coordinate: { lat, lng },
              address: `经度:${lng.toFixed(4)}, 纬度:${lat.toFixed(4)}`,
              name: '当前位置'
            });
          }
        },
        (err) => {
          let message = '无法获取您的位置信息';
          if (err.code === 1) message = '定位权限被拒绝';
          else if (err.code === 2) message = '无法获取位置信息';
          else if (err.code === 3) message = '定位超时';
          reject(new Error(message));
        },
        {
          enableHighAccuracy: false,
          timeout: 8000,
          maximumAge: 60000
        }
      );
    });
  }

  // 双路并行定位策略：同时发起GPS定位和IP定位，优先使用GPS结果
  return await withTimeout<GeolocationResult>(
    new Promise((resolve) => {
      let resolved = false;

      // 1. GPS定位（更准确，可能较慢）
      const gpsGeolocation = new AMap.Geolocation({
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 60000,
        convert: true,
        noIpLocate: true,  // 纯GPS定位，禁用IP定位
        noGeoLocation: false,
      });

      gpsGeolocation.getCurrentPosition((status: string, result: any) => {
        if (!resolved && status === 'complete' && result.position) {
          resolved = true;
          const lat = result.position.getLat();
          const lng = result.position.getLng();
          const address = result.formattedAddress || `经度:${lng.toFixed(4)}, 纬度:${lat.toFixed(4)}`;
          const name = result.addressComponent && (result.addressComponent.neighborhood || result.addressComponent.building) 
            ? (result.addressComponent.neighborhood || result.addressComponent.building)
            : address.replace('上海市', '') || '当前位置';
          
          console.log('GPS定位成功:', { lat, lng, name });
          resolve({
            coordinate: { lat, lng },
            address,
            name
          });
        }
      });

      // 2. IP定位作为快速备选（约1-2秒，精度较低）
      // 设置2秒延迟后启动IP定位，给GPS一个优先响应的机会
      setTimeout(() => {
        if (!resolved) {
          const ipGeolocation = new AMap.Geolocation({
            enableHighAccuracy: false,
            timeout: 3000,
            maximumAge: 60000,
            convert: true,
            noIpLocate: false,  // 启用IP定位
            noGeoLocation: true,  // 禁用GPS，只使用IP定位
            useDatabase: true,
          });

          ipGeolocation.getCurrentPosition((status: string, result: any) => {
            if (!resolved && status === 'complete' && result.position) {
              resolved = true;
              const lat = result.position.getLat();
              const lng = result.position.getLng();
              const address = result.formattedAddress || `经度:${lng.toFixed(4)}, 纬度:${lat.toFixed(4)}`;
              const name = result.addressComponent && (result.addressComponent.neighborhood || result.addressComponent.building) 
                ? (result.addressComponent.neighborhood || result.addressComponent.building)
                : address.replace('上海市', '') || '当前位置';
              
              console.log('IP定位成功（GPS未返回）:', { lat, lng, name });
              resolve({
                coordinate: { lat, lng },
                address,
                name
              });
            }
          });
        }
      }, 2000);

      // 3. 最终兜底：10秒后如果还没定位成功，返回默认位置
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.log('定位超时，使用默认位置（人民广场）');
          resolve({
            coordinate: { lat: 31.2335, lng: 121.4726 },
            address: '黄浦区人民大道120号',
            name: '人民广场（默认位置）'
          });
        }
      }, 10000);
    }),
    12000,
    '高德地图定位超时'
  );
}

function getAMap(): any | null {
  return (window as any).AMap || null;
}

function ensurePlugins(names: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const AMap = getAMap();
    if (!AMap) {
      reject(new Error('AMap not loaded'));
      return;
    }
    try {
      AMap.plugin(names, () => resolve());
    } catch (e) {
      reject(e as Error);
    }
  });
}

export async function reverseGeocode(coordinate: Coordinate): Promise<GeoResolved> {
  const key = coordKey(coordinate);
  const cached = reverseCache.get(key);
  if (cached) return cached;

  if (!AMAP_CONFIG.key) {
    const defaultResult: GeoResolved = {
      coordinate,
      address: `经度:${coordinate.lng.toFixed(4)}, 纬度:${coordinate.lat.toFixed(4)}`,
      name: '当前位置'
    };
    reverseCache.set(key, defaultResult);
    return defaultResult;
  }

  try {
    const url = `/api/amap/geocode/regeo?key=${AMAP_CONFIG.key}&location=${coordinate.lng},${coordinate.lat}&city=${encodeURIComponent(AMAP_CONFIG.city)}`;
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.status === '1' && result.regeocode) {
      const re = result.regeocode;
      const formatted: string = re.formatted_address || '上海市';
      const ac = re.address_component || {};
      let name = '';
      if (ac.neighborhood) name = ac.neighborhood;
      else if (ac.building) name = ac.building;
      else if (ac.street && ac.street_number) name = `${ac.street}${ac.street_number}`;
      else name = formatted.replace('上海市', '') || '当前定位点';

      const resolved: GeoResolved = { coordinate, address: formatted, name };
      reverseCache.set(key, resolved);
      return resolved;
    }
    
    throw new Error('reverse geocode failed');
  } catch {
    const fallback: GeoResolved = {
      coordinate,
      address: `经度:${coordinate.lng.toFixed(4)}, 纬度:${coordinate.lat.toFixed(4)}`,
      name: '当前位置'
    };
    reverseCache.set(key, fallback);
    return fallback;
  }
}

export interface ForwardOptions {
  district?: string;
  anchor?: Coordinate;
  maxDeviationKm?: number;
}

export async function forwardGeocode(
  rawAddress: string,
  options: ForwardOptions = {}
): Promise<GeoResolved> {
  const { district, anchor, maxDeviationKm = 8 } = options;
  
  const cleanAddress = (address: string): string => {
    let result = address;
    result = result.replace(/#|＃/g, '');
    result = result.replace(/【[^】]*】/g, '');
    result = result.replace(/\[【[^】]*】\]/g, '');
    result = result.replace(/【[^】]*$/g, '');
    result = result.replace(/「[^」]*」/g, '');
    result = result.replace(/(大概要求|老师要求|学生情况|备注|备注要求|备注：|备注:|要求:?)/g, '');
    result = result.replace(/(男老师|女老师|大学生|研究生|985|211|经验丰富|有耐心|认真负责|性格好|有意思|好学校)/g, '');
    result = result.replace(/(一周.*?次|一次.*?小时|课时费|课酬|报酬|时薪|价格|可付时薪|课费)/g, '');
    result = result.replace(/(年级|科目|性别|男生|女生|学生情况|小朋友)/g, '');
    result = result.replace(/(希望|需要|最好|优先|适合|擅长|能|想|要|可以|还可以|往后学|提高|理科思路清晰)/g, '');
    result = result.replace(/(冲985|自招|竞赛|高考|中考|KET|雅思|托福|英语专业|数学系)/g, '');
    result = result.replace(/(暑假|暑期|寒假|周六|周日|周一|周二|周三|周四|周五|通勤|分钟|附近|范围内)/g, '');
    result = result.replace(/[\u{1F300}-\u{1F5FF}\u{1F900}-\u{1F9FF}]/gu, '');
    result = result.replace(/[:：]/g, '');
    result = result.replace(/\s+/g, '');
    result = result.replace(/[,，。、]/g, '');
    result = result.replace(/^[.．]/g, '');
    result = result.trim();
    return result;
  };
  
  const cleaned = cleanAddress(rawAddress);
  let keyword = cleaned;
  if (district && !cleaned.startsWith(district) && !cleaned.startsWith('上海市')) {
    keyword = `${district}${cleaned}`;
  }
  console.log(`地理编码输入: 原地址="${rawAddress}", 清理后="${cleaned}", 关键词="${keyword}"`);
  const cacheKey = `${keyword}`;
  const cached = forwardCache.get(cacheKey);
  if (cached) return cached;

  const accept = (c: Coordinate, address: string, name: string): GeoResolved | null => {
    if (!isInShanghai(c)) return null;
    if (anchor && getDistance(c.lat, c.lng, anchor.lat, anchor.lng) > maxDeviationKm) return null;
    const resolved: GeoResolved = { coordinate: c, address: address || keyword, name: name || rawAddress };
    forwardCache.set(cacheKey, resolved);
    return resolved;
  };

  try {
    await loadAMapScript();
    const AMap = (window as any).AMap;
    
    const placeSearch = new AMap.PlaceSearch({
      city: AMAP_CONFIG.city,
      citylimit: true,
      pageSize: 10,
    });

    const placeResult = await new Promise<any>((resolve) => {
      placeSearch.search(keyword, (status: string, result: any) => {
        resolve({ status, result });
      });
    });

    if (placeResult.status === 'complete' && placeResult.result && placeResult.result.poiList && placeResult.result.poiList.pois && placeResult.result.poiList.pois.length > 0) {
      for (const poi of placeResult.result.poiList.pois) {
        const loc = poi.location;
        if (!loc) continue;
        let lat: number, lng: number;
        if (typeof loc === 'string') {
          [lng, lat] = loc.split(',').map(Number);
        } else if (loc.lng !== undefined && loc.lat !== undefined) {
          lng = loc.lng;
          lat = loc.lat;
        } else {
          continue;
        }
        const c: Coordinate = { lat, lng };
        const ok = accept(c, poi.address || poi.name || keyword, poi.name || rawAddress);
        if (ok) return ok;
      }
    }

    const geocoder = new AMap.Geocoder({
      city: AMAP_CONFIG.city,
    });

    const fullAddress = keyword.startsWith('上海') ? keyword : `上海市${keyword}`;
    const geocodeResult = await new Promise<any>((resolve) => {
      geocoder.getLocation(fullAddress, (status: string, result: any) => {
        resolve({ status, result });
      });
    });

    if (geocodeResult.status === 'complete' && geocodeResult.geocodes && geocodeResult.geocodes.length > 0) {
      const g = geocodeResult.geocodes[0];
      const [lng, lat] = g.location.split(',').map(Number);
      const c: Coordinate = { lat, lng };
      const ok = accept(c, g.formatted_address || fullAddress, (g.formatted_address || keyword).replace('上海市', ''));
      if (ok) return ok;
    }

    if (anchor) {
      const resolved: GeoResolved = { coordinate: anchor, address: keyword, name: rawAddress };
      forwardCache.set(cacheKey, resolved);
      return resolved;
    }
    
    throw new Error('forward geocode failed');
  } catch (err) {
    console.log('地理编码失败:', err);
    if (anchor) {
      const resolved: GeoResolved = { coordinate: anchor, address: keyword, name: rawAddress };
      forwardCache.set(cacheKey, resolved);
      return resolved;
    }
    throw err;
  }
}

export async function searchNearbyPOIs(coordinate: Coordinate, keyword: string = ''): Promise<Landmark[]> {
  if (!AMAP_CONFIG.key) {
    return [];
  }

  try {
    await loadAMapScript();
    const AMap = (window as any).AMap;

    const placeSearch = new AMap.PlaceSearch({
      city: AMAP_CONFIG.city,
      citylimit: true,
      pageSize: 15,
    });

    const categories = keyword ? [keyword] : ['小区', '住宅楼', '地铁站', '大厦', '广场', '学校'];
    const uniqueNames = new Set<string>();
    const results: Landmark[] = [];

    for (const category of categories) {
      const placeResult = await new Promise<any>((resolve) => {
        placeSearch.searchNearBy(category, [coordinate.lng, coordinate.lat], 1500, (status: string, result: any) => {
          resolve({ status, result });
        });
      });

      console.log('附近POI搜索:', { category, status: placeResult.status, resultCount: placeResult.result?.poiList?.pois?.length || 0 });

      if (placeResult.status === 'complete' && placeResult.result && placeResult.result.poiList && placeResult.result.poiList.pois && placeResult.result.poiList.pois.length > 0) {
        const pois: Landmark[] = placeResult.result.poiList.pois
          .filter((poi: any) => poi.location)
          .map((poi: any, idx: number) => {
            let lat: number, lng: number;
            if (typeof poi.location === 'string') {
              [lng, lat] = poi.location.split(',').map(Number);
            } else if (poi.location.lng !== undefined && poi.location.lat !== undefined) {
              lng = poi.location.lng;
              lat = poi.location.lat;
            } else {
              return null;
            }
            return {
              id: `nearby_${poi.id || Date.now()}_${idx}`,
              name: poi.name || '附近地标',
              address: poi.address || poi.name || '上海市',
              coordinate: { lat, lng },
              type: 'custom' as const,
            };
          })
          .filter((p: any) => p !== null);

        for (const poi of pois) {
          if (!uniqueNames.has(poi.name)) {
            uniqueNames.add(poi.name);
            results.push(poi);
          }
        }
      }

      if (results.length >= 10) break;
    }

    return results.slice(0, 10);
  } catch (e) {
    console.error('searchNearbyPOIs error:', e);
    return [];
  }
}

export async function searchPOIs(keyword: string): Promise<Landmark[]> {
  const trimmed = keyword.trim();
  if (!trimmed) return [];

  if (!AMAP_CONFIG.key) {
    return [];
  }

  try {
    await loadAMapScript();
    const AMap = (window as any).AMap;

    const placeSearch = new AMap.PlaceSearch({
      city: AMAP_CONFIG.city,
      citylimit: true,
      pageSize: 20,
    });

    const searchTerms = [
      trimmed,
      `${trimmed}路`,
      `${trimmed}小区`,
      `${trimmed}地铁站`,
      `${trimmed}大厦`,
      `${trimmed}广场`,
      `上海市${trimmed}`
    ];

    const uniqueNames = new Set<string>();
    const results: Landmark[] = [];

    for (const term of searchTerms) {
      const placeResult = await new Promise<any>((resolve) => {
        placeSearch.search(term, (status: string, result: any) => {
          resolve({ status, result });
        });
      });

      console.log('POI搜索:', { keyword: term, status: placeResult.status, resultCount: placeResult.result?.poiList?.pois?.length || 0 });

      if (placeResult.status === 'complete' && placeResult.result && placeResult.result.poiList && placeResult.result.poiList.pois && placeResult.result.poiList.pois.length > 0) {
        const pois: Landmark[] = placeResult.result.poiList.pois
          .filter((poi: any) => poi.location)
          .map((poi: any, idx: number) => {
            let lat: number, lng: number;
            if (typeof poi.location === 'string') {
              [lng, lat] = poi.location.split(',').map(Number);
            } else if (poi.location.lng !== undefined && poi.location.lat !== undefined) {
              lng = poi.location.lng;
              lat = poi.location.lat;
            } else {
              return null;
            }
            return {
              id: `poi_${poi.id || Date.now()}_${idx}`,
              name: poi.name || trimmed,
              address: poi.address || poi.name || '上海市',
              coordinate: { lat, lng },
              type: 'custom' as const,
            };
          })
          .filter((p: any) => p !== null);

        for (const poi of pois) {
          if (!uniqueNames.has(poi.name)) {
            uniqueNames.add(poi.name);
            results.push(poi);
          }
        }
      }

      if (results.length >= 10) break;
    }

    return results.slice(0, 10);
  } catch (e) {
    console.error('searchPOIs error:', e);
    return [];
  }
}

const ROUTE_PLUGIN: Record<TravelMode, string> = {
  transit: 'AMap.Transfer',
  driving: 'AMap.Driving',
  riding: 'AMap.Riding',
  walking: 'AMap.Walking',
};

function fmtDistance(meters: number): string {
  if (!meters) return '';
  return meters >= 1000 ? `${(meters / 1000).toFixed(1)}公里` : `${Math.round(meters)}米`;
}

export async function planRoute(
  startName: string,
  start: Coordinate,
  endAddress: string,
  end: Coordinate,
  mode: TravelMode
): Promise<NavigationResult> {
  try {
    await loadAMapScript();
    await ensurePlugins([ROUTE_PLUGIN[mode]]);
  } catch {
    return buildGeoFallbackRoute(startName, start, endAddress, end, mode);
  }

  const AMap = getAMap();
  if (!AMap) return buildGeoFallbackRoute(startName, start, endAddress, end, mode);

  return new Promise<NavigationResult>((resolve) => {
    let router: any;
    try {
      if (mode === 'transit') {
        router = new AMap.Transfer({ city: AMAP_CONFIG.city, policy: AMap.TransferPolicy.LEAST_TIME });
      } else if (mode === 'driving') {
        router = new AMap.Driving({ policy: AMap.DrivingPolicy.LEAST_TIME });
      } else if (mode === 'riding') {
        router = new AMap.Riding();
      } else {
        router = new AMap.Walking();
      }

      router.search(
        new AMap.LngLat(start.lng, start.lat),
        new AMap.LngLat(end.lng, end.lat),
        (status: string, result: any) => {
          if (status === 'complete') {
            try {
              let distanceMeters = 0;
              let durationSeconds = 0;
              const steps: RouteStep[] = [];

              if (mode === 'transit') {
                if (result.plans && result.plans.length > 0) {
                  const plan = result.plans[0];
                  distanceMeters = plan.distance;
                  durationSeconds = plan.time;
                  steps.push({
                    instruction: `从【${startName}】出发，步行前往最近的乘车站点。`,
                    distanceText: plan.walkingDistance ? fmtDistance(plan.walkingDistance) : '步行接驳',
                  });
                  plan.segments.forEach((seg: any) => {
                    if (seg.instruction) {
                      steps.push({ instruction: seg.instruction, distanceText: fmtDistance(seg.distance) });
                    }
                  });
                }
              } else {
                if (result.routes && result.routes.length > 0) {
                  const route = result.routes[0];
                  distanceMeters = route.distance;
                  durationSeconds = route.time;
                  route.steps.forEach((step: any) => {
                    if (step.instruction) {
                      steps.push({ instruction: step.instruction, distanceText: fmtDistance(step.distance) });
                    }
                  });
                }
              }

              if (steps.length > 0) {
                steps.push({
                  instruction: `抵达学生住址【${endAddress}】，请老师注意仪表、带齐教案与辅导材料。`,
                  distanceText: '到达终点',
                });
                resolve({
                  mode,
                  distanceKm: Number((distanceMeters / 1000).toFixed(1)),
                  durationMin: Math.max(1, Math.round(durationSeconds / 60)),
                  steps,
                });
                return;
              }
            } catch (err) {
              console.error('AMap route format error:', err);
            }
          }
          resolve(buildGeoFallbackRoute(startName, start, endAddress, end, mode));
        }
      );
    } catch (err) {
      console.error('AMap route search instantiate error:', err);
      resolve(buildGeoFallbackRoute(startName, start, endAddress, end, mode));
    }
  });
}

function buildGeoFallbackRoute(
  startName: string,
  start: Coordinate,
  endAddress: string,
  end: Coordinate,
  mode: TravelMode
): NavigationResult {
  const straightDist = getDistance(start.lat, start.lng, end.lat, end.lng);
  
  let multiplier = 1.35;
  let speedKmh = 40;
  
  if (mode === 'transit') {
    multiplier = 1.45;
    speedKmh = 25;
  } else if (mode === 'riding') {
    multiplier = 1.25;
    speedKmh = 14;
  } else if (mode === 'walking') {
    multiplier = 1.15;
    speedKmh = 4.5;
  }
  
  const routeDist = Number((straightDist * multiplier).toFixed(1));
  let durationMin = Math.round((routeDist / speedKmh) * 60);
  
  if (mode === 'transit') durationMin += 8;
  if (mode === 'driving') durationMin += 5;
  if (mode === 'riding') durationMin += 3;
  if (durationMin < 3) durationMin = 3;

  const steps: RouteStep[] = [];

  if (mode === 'transit') {
    const isMinhang = startName.includes('闵行') || startName.includes('交通大学 (闵行') || start.lat < 31.1;
    const isYangpu = startName.includes('复旦') || startName.includes('同济') || (start.lat > 31.28 && start.lng > 121.49);
    const isSongjiang = startName.includes('松江') || start.lng < 121.3;

    steps.push({
      instruction: `从【${startName}】步行约 450 米到达最近地铁站/公交站。`,
      distanceText: '步行 450米'
    });

    if (isMinhang) {
      steps.push({
        instruction: `进站乘坐【地铁15号线】(顾村公园方向) 或【地铁5号线】(莘庄方向)，乘车至中转站。`,
        distanceText: '地铁乘车'
      });
      if (routeDist > 15) {
        steps.push({
          instruction: `在【莘庄站】或【上海南站】换乘【地铁1号线】/【地铁3号线】往市区方向。`,
          distanceText: '站内换乘 4分钟'
        });
      }
    } else if (isYangpu) {
      steps.push({
        instruction: `进站乘坐【地铁10号线】(航中路/虹桥火车站方向) 或地铁18号线。`,
        distanceText: '地铁乘车'
      });
      if (routeDist > 10) {
        steps.push({
          instruction: `在【国权路站】或【海伦路站】站内换乘【地铁10/4/12号线】，前往目的地。`,
          distanceText: '站内换乘 5分钟'
        });
      }
    } else if (isSongjiang) {
      steps.push({
        instruction: `在【松江大学城站】乘坐【地铁9号线】(曹路方向) 至转乘点。`,
        distanceText: '地铁 9号线'
      });
      if (routeDist > 15) {
        steps.push({
          instruction: `在【宜山路站】换乘【地铁4号线】或【地铁3号线】。`,
          distanceText: '站内换乘 6分钟'
        });
      }
    } else {
      steps.push({
        instruction: `乘坐【地铁4/11/12号线】就近公交干线向目的地方向行驶。`,
        distanceText: '公共交通'
      });
    }

    steps.push({
      instruction: `至目的地就近站点出站，步行大约 650 米至学生住址【${endAddress}】。`,
      distanceText: '步行 650米'
    });
  } else if (mode === 'driving') {
    steps.push({
      instruction: `从【${startName}】出发，沿主干道路朝最近的高架入口行驶。`,
      distanceText: '驶入城市道路'
    });
    
    if (routeDist > 6) {
      steps.push({
        instruction: `进入【南北高架路】或【中环路高架】/【内环高架路】向目的地区域行驶。`,
        distanceText: '快速路高架行驶'
      });
      steps.push({
        instruction: `从就近出口驶离高架快速路，进入地面主干道。`,
        distanceText: '驶离高架'
      });
    } else {
      steps.push({
        instruction: `沿主要城市次干道、支路朝目的地直线行进，穿过十字路口。`,
        distanceText: '地面街道行驶'
      });
    }

    steps.push({
      instruction: `转弯进入小区支路，抵达学生住址【${endAddress}】，可在小区大门外临时停靠。`,
      distanceText: '抵达终点'
    });
  } else if (mode === 'riding') {
    steps.push({
      instruction: `从【${startName}】校门扫码开锁共享单车。`,
      distanceText: '骑行开始'
    });
    steps.push({
      instruction: `沿非机动车道向主方向骑行，注意避让上海高峰期行人和公交车。`,
      distanceText: '非机动车道骑行'
    });
    if (routeDist > 3) {
      steps.push({
        instruction: `穿过大型十字路口，沿自行车标志指引绿道行驶。`,
        distanceText: '直行通过路口'
      });
    }
    steps.push({
      instruction: `到达学生住址【${endAddress}】大门口，就近在白色划线共享单车停放区域关锁并付款。`,
      distanceText: '骑行终点'
    });
  } else {
    steps.push({
      instruction: `从【${startName}】步行出发，沿人行道前行。`,
      distanceText: '步行起步'
    });
    steps.push({
      instruction: `沿林荫道、人行过街天桥或走地下通道安全通过路口。`,
      distanceText: '步行穿过街区'
    });
    steps.push({
      instruction: `直行进入小区铁门，到达学生住址【${endAddress}】。`,
      distanceText: '步行抵达'
    });
  }

  steps.push({
    instruction: `顺利抵达教教上课地点【${endAddress}】，请老师注意仪表、带齐教案和必备辅导教材。`,
    distanceText: '最后一公里'
  });

  return {
    mode,
    distanceKm: routeDist,
    durationMin,
    steps
  };
}