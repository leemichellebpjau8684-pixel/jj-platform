import { Coordinate, TravelMode, NavigationResult, RouteStep } from './types';

// Haversine formula to compute great-circle distance between two points on sphere
export function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return Number(d.toFixed(1));
}

// Generate highly realistic, customized Shanghai transit/commuting step routes
export function generateCommuteRoute(
  startName: string,
  start: Coordinate,
  endAddress: string,
  end: Coordinate,
  mode: TravelMode
): NavigationResult {
  const straightDist = getDistance(start.lat, start.lng, end.lat, end.lng);
  
  // Apply multipliers depending on mode of travel due to road network winding
  let multiplier = 1.35;
  let speedKmh = 40; // average driving speed
  
  if (mode === 'transit') {
    multiplier = 1.45;
    speedKmh = 25; // metro+walk includes transfers
  } else if (mode === 'riding') {
    multiplier = 1.25;
    speedKmh = 14;
  } else if (mode === 'walking') {
    multiplier = 1.15;
    speedKmh = 4.5;
  }
  
  const routeDist = Number((straightDist * multiplier).toFixed(1));
  let durationMin = Math.round((routeDist / speedKmh) * 60);
  
  // Apply a minimum delay for overhead (wait for train, traffic lights, etc.)
  if (mode === 'transit') durationMin += 8;
  if (mode === 'driving') durationMin += 5;
  if (mode === 'riding') durationMin += 3;
  if (durationMin < 3) durationMin = 3;

  const steps: RouteStep[] = [];

  if (mode === 'transit') {
    // Check school origins for detailed regional subway steps
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
    // Walking
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

  // Ensure last step always summarizes
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
