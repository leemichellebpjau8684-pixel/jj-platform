import { Coordinate, TravelMode, NavigationResult, RouteStep, Landmark } from '../types';
import { getDistance } from '../utils';

function getEnvValue(key: string): string {
  const value = (import.meta as any).env?.[key];
  if (typeof value === 'string') return value;
  return '';
}

export const AMAP_CONFIG = {
  key: getEnvValue('VITE_AMAP_JS_KEY'),
  securityJsCode: getEnvValue('VITE_AMAP_JS_SECURITY_CODE'),
  city: '上海市',
};

export const AMAP_WEB_CONFIG = {
  key: getEnvValue('VITE_AMAP_WEB_KEY'),
  securityCode: getEnvValue('VITE_AMAP_WEB_SECURITY_CODE'),
};

console.debug('AMAP_CONFIG loaded:', {
  hasKey: !!AMAP_CONFIG.key,
  hasSecurityCode: !!AMAP_CONFIG.securityJsCode,
  keyLength: AMAP_CONFIG.key ? AMAP_CONFIG.key.length : 0,
  envKeys: Object.keys((import.meta as any).env || {}).filter(k => k.includes('AMAP')),
});

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

export function resetAMapLoad(): void {
  amapLoadPromise = null;
  (window as any).AMap = null;
}

export function loadAMapScript(): Promise<void> {
  if (amapLoadPromise) return amapLoadPromise;

  amapLoadPromise = new Promise<void>((resolve, reject) => {
    if ((window as any).AMap) {
      resolve();
      return;
    }

    const apiKey = AMAP_CONFIG.key || (window as any).AMAP_KEY || '';
    const securityCode = AMAP_CONFIG.securityJsCode || (window as any).AMAP_SECURITY_CODE || '';

    if (!apiKey) {
      reject(new Error('高德地图API密钥未配置，请检查环境变量VITE_AMAP_JS_KEY是否正确设置'));
      return;
    }

    (window as any)._AMapSecurityConfig = {
      securityJsCode: securityCode,
    };

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.src =
      `https://webapi.amap.com/maps?v=2.0&key=${apiKey}` +
      `&plugin=AMap.Geocoder,AMap.DistrictSearch,AMap.PlaceSearch`;
    script.async = true;
    script.onerror = (event: Event | string) => {
      const errorMsg = typeof event === 'string' ? event : (event as ErrorEvent).message || '加载失败';
      reject(new Error(`高德地图脚本加载失败: ${errorMsg}，请检查网络连接或API密钥配置`));
    };
    script.onload = () => {
      if ((window as any).AMap) {
        resolve();
      } else {
        reject(new Error('高德地图脚本加载后AMAP对象未定义'));
      }
    };
    document.head.appendChild(script);
  });

  return amapLoadPromise;
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

  await loadAMapScript();
  await ensurePlugins(['AMap.Geocoder']);
  const AMap = getAMap();
  if (!AMap) throw new Error('AMap unavailable');

  return new Promise<GeoResolved>((resolve, reject) => {
    const geocoder = new AMap.Geocoder({ city: AMAP_CONFIG.city });
    geocoder.getAddress([coordinate.lng, coordinate.lat], (status: string, result: any) => {
      if (status === 'complete' && result.regeocode) {
        const re = result.regeocode;
        const formatted: string = re.formattedAddress || '上海市';
        const ac = re.addressComponent || {};
        let name = '';
        if (ac.neighborhood) name = ac.neighborhood;
        else if (ac.building) name = ac.building;
        else if (ac.street && ac.streetNumber) name = `${ac.street}${ac.streetNumber}`;
        else name = formatted.replace('上海市', '') || '当前定位点';

        const resolved: GeoResolved = { coordinate, address: formatted, name };
        reverseCache.set(key, resolved);
        resolve(resolved);
      } else {
        reject(new Error('reverse geocode failed'));
      }
    });
  });
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
  const keyword = district && !rawAddress.startsWith(district) ? `${district}${rawAddress}` : rawAddress;
  const cacheKey = `${keyword}`;
  const cached = forwardCache.get(cacheKey);
  if (cached) return cached;

  await loadAMapScript();
  await ensurePlugins(['AMap.PlaceSearch', 'AMap.Geocoder']);
  const AMap = getAMap();
  if (!AMap) throw new Error('AMap unavailable');

  const accept = (c: Coordinate, address: string, name: string): GeoResolved | null => {
    if (!isInShanghai(c)) return null;
    if (anchor && getDistance(c.lat, c.lng, anchor.lat, anchor.lng) > maxDeviationKm) return null;
    const resolved: GeoResolved = { coordinate: c, address: address || keyword, name: name || rawAddress };
    forwardCache.set(cacheKey, resolved);
    return resolved;
  };

  return new Promise<GeoResolved>((resolve, reject) => {
    const placeSearch = new AMap.PlaceSearch({ city: AMAP_CONFIG.city, citylimit: true, pageSize: 10 });

    placeSearch.search(keyword, (status: string, result: any) => {
      if (status === 'complete' && result.poiList && result.poiList.pois && result.poiList.pois.length > 0) {
        for (const poi of result.poiList.pois) {
          const loc = poi.location;
          if (!loc) continue;
          const c: Coordinate = { lat: loc.getLat(), lng: loc.getLng() };
          const ok = accept(c, poi.address || poi.name || keyword, poi.name || rawAddress);
          if (ok) {
            resolve(ok);
            return;
          }
        }
      }

      const geocoder = new AMap.Geocoder({ city: AMAP_CONFIG.city });
      const fullAddress = keyword.startsWith('上海') ? keyword : `上海市${keyword}`;
      geocoder.getLocation(fullAddress, (geoStatus: string, geoResult: any) => {
        if (geoStatus === 'complete' && geoResult.geocodes && geoResult.geocodes.length > 0) {
          const g = geoResult.geocodes[0];
          const c: Coordinate = { lat: g.location.getLat(), lng: g.location.getLng() };
          const ok = accept(c, g.formattedAddress || fullAddress, (g.formattedAddress || keyword).replace('上海市', ''));
          if (ok) {
            resolve(ok);
            return;
          }
        }

        if (anchor) {
          const resolved: GeoResolved = { coordinate: anchor, address: keyword, name: rawAddress };
          forwardCache.set(cacheKey, resolved);
          resolve(resolved);
        } else {
          reject(new Error('forward geocode failed'));
        }
      });
    });
  });
}

export async function searchPOIs(keyword: string): Promise<Landmark[]> {
  const trimmed = keyword.trim();
  if (!trimmed) return [];

  await loadAMapScript();
  await ensurePlugins(['AMap.PlaceSearch', 'AMap.Geocoder']);
  const AMap = getAMap();
  if (!AMap) throw new Error('AMap unavailable');

  return new Promise<Landmark[]>((resolve, reject) => {
    const placeSearch = new AMap.PlaceSearch({ city: AMAP_CONFIG.city, citylimit: true, pageSize: 10 });

    placeSearch.search(trimmed, (status: string, result: any) => {
      if (status === 'complete' && result.poiList && result.poiList.pois && result.poiList.pois.length > 0) {
        const matches: Landmark[] = result.poiList.pois
          .filter((poi: any) => poi.location)
          .map((poi: any, idx: number) => ({
            id: `poi_${poi.id || Date.now()}_${idx}`,
            name: poi.name || trimmed,
            address: poi.address || poi.name || '上海市',
            coordinate: { lat: poi.location.getLat(), lng: poi.location.getLng() },
            type: 'custom' as const,
          }));
        resolve(matches);
        return;
      }

      const geocoder = new AMap.Geocoder({ city: AMAP_CONFIG.city });
      const fullQuery = trimmed.startsWith('上海') ? trimmed : `上海市${trimmed}`;
      geocoder.getLocation(fullQuery, (geoStatus: string, geoResult: any) => {
        if (geoStatus === 'complete' && geoResult.geocodes && geoResult.geocodes.length > 0) {
          const list: Landmark[] = geoResult.geocodes.map((g: any, idx: number) => ({
            id: `geo_${Date.now()}_${idx}`,
            name: (g.formattedAddress || trimmed).replace('上海市', '') || trimmed,
            address: g.formattedAddress || fullQuery,
            coordinate: { lat: g.location.getLat(), lng: g.location.getLng() },
            type: 'custom' as const,
          }));
          resolve(list);
        } else {
          resolve([]);
        }
      });
    });
  });
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