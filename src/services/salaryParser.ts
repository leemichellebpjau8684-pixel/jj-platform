/**
 * 薪资解析与显示工具
 * 从 raw_content 中智能识别薪资格式，并换算成时薪显示
 *
 * 支持的格式：
 * - 8000/月、1w/月、4k-4.5k/月  → 月薪换算时薪（按每月22天×8h或每周工作天数换算）
 * - 260/2h、200-240/2h          → 每次/每2小时费用，÷小时数
 * - 500/天 6h、500/天            → 日薪÷小时数（默认8h）
 * - 100-120/h、150/h            → 标准时薪
 * - 面议                         → 面议
 */

export interface SalaryParseResult {
  /** 用于显示的文本，如 "130元/小时" / "100-120元/小时" / "8000元/月（约50元/小时）" */
  priceText: string;
  /** 换算后的时薪下限（用于高薪判断和筛选） */
  hourlyRateMin: number;
  /** 换算后的时薪上限 */
  hourlyRateMax: number;
  /** 是否面议 */
  isNegotiable: boolean;
}

/** 将 "1w" "4k" "4.5k" 等中文简写转成数字 */
function parseMoneyUnit(str: string): number {
  const s = str.trim().toLowerCase();
  const m = s.match(/^(\d+(?:\.\d+)?)\s*([kw])?$/i);
  if (!m) return parseFloat(s) || 0;
  const num = parseFloat(m[1]);
  if (isNaN(num)) return 0;
  if (m[2] === 'k') return num * 1000;
  if (m[2] === 'w') return num * 10000;
  return num;
}

/** 从文本中提取薪资行（包含 薪资/薪水/报酬/课时报报 等关键字） */
function extractSalaryLine(rawContent: string): string {
  if (!rawContent) return '';
  const lines = rawContent.split(/\r?\n/);
  for (const line of lines) {
    if (/薪[资水酬]|报酬|课时费|课时报酬/i.test(line)) {
      return line.trim();
    }
  }
  // 回退：找包含 /h /月 /天 的行
  for (const line of lines) {
    if (/\/\s*(h|小时|月|天|日)/i.test(line)) {
      return line.trim();
    }
  }
  return '';
}

/** 提取薪资数字（支持 "200-240" "100~120" "200～240" "1w" "4k-4.5k"） */
function parseRange(text: string): [number, number] | null {
  // 匹配 "200-240" "200~240" "200～240" "4k-4.5k" "1w-1.5w"
  const rangeMatch = text.match(/(\d+(?:\.\d+)?\s*[kKwW]?)\s*[-~～]\s*(\d+(?:\.\d+)?\s*[kKwW]?)/);
  if (rangeMatch) {
    const min = parseMoneyUnit(rangeMatch[1]);
    const max = parseMoneyUnit(rangeMatch[2]);
    if (!isNaN(min) && !isNaN(max) && min > 0 && max > 0) return [Math.min(min, max), Math.max(min, max)];
  }
  // 单个数字（带单位）
  const singleMatch = text.match(/(\d+(?:\.\d+)?\s*[kKwW]?)/);
  if (singleMatch) {
    const v = parseMoneyUnit(singleMatch[1]);
    if (!isNaN(v) && v > 0) return [v, v];
  }
  return null;
}

/**
 * 解析薪资文本
 * @param rawContent 订单原始内容
 * @param salaryMin 后端解析的 salary_min（作为 fallback）
 * @param salaryMax 后端解析的 salary_max（作为 fallback）
 */
export function parseSalary(
  rawContent: string,
  salaryMin?: number,
  salaryMax?: number
): SalaryParseResult {
  const salaryLine = extractSalaryLine(rawContent);

  // 1. 识别月薪：8000/月、1w/月、4k-4.5k/月、8000元/月
  if (/\/\s*月|元\s*\/\s*月|每月|包月/i.test(salaryLine)) {
    const range = parseRange(salaryLine);
    if (range) {
      // 月薪换算时薪：假设每月工作约 22 天 × 8h = 176h
      // 但家教单通常每周2-6次，每次2h，每月约 4-5 周
      // 月薪单多为住家或全职陪读，按每月 22 天 × 8h 估算偏合理
      const hourlyMin = Math.round((range[0] / 176) * 10) / 10;
      const hourlyMax = Math.round((range[1] / 176) * 10) / 10;
      const rangeText = range[0] === range[1]
        ? `${range[0]}元/月`
        : `${range[0]}-${range[1]}元/月`;
      return {
        priceText: `${rangeText}（约${hourlyMin}-${hourlyMax}元/小时）`,
        hourlyRateMin: hourlyMin,
        hourlyRateMax: hourlyMax,
        isNegotiable: false
      };
    }
  }

  // 2. 识别日薪：500/天 6h、500/天、500元/天
  if (/\/\s*天|\/\s*日|元\s*\/\s*天|每天/i.test(salaryLine)) {
    const range = parseRange(salaryLine);
    if (range) {
      // 尝试提取小时数：6h、8h、6小时
      const hourMatch = salaryLine.match(/(\d+(?:\.\d+)?)\s*(?:h|小时)/i);
      const hours = hourMatch ? parseFloat(hourMatch[1]) : 8;
      const hourlyMin = Math.round((range[0] / hours) * 10) / 10;
      const hourlyMax = Math.round((range[1] / hours) * 10) / 10;
      const rangeText = range[0] === range[1]
        ? `${range[0]}元/天`
        : `${range[0]}-${range[1]}元/天`;
      return {
        priceText: `${rangeText}（约${hourlyMin}-${hourlyMax}元/小时）`,
        hourlyRateMin: hourlyMin,
        hourlyRateMax: hourlyMax,
        isNegotiable: false
      };
    }
  }

  // 3. 识别时薪变体：260/2h、200-240/2h、240/2小时、200-220/2个小时
  // 匹配 数字/数字h 或 数字-数字/数字小时
  const perHourMatch = salaryLine.match(/(\d+(?:\.\d+)?\s*[kKwW]?)\s*[-~～]\s*(\d+(?:\.\d+)?\s*[kKwW]?)\s*\/\s*(\d+(?:\.\d+)?)\s*(?:h|个?小时)/i);
  if (perHourMatch) {
    const min = parseMoneyUnit(perHourMatch[1]);
    const max = parseMoneyUnit(perHourMatch[2]);
    const hours = parseFloat(perHourMatch[3]);
    if (min > 0 && max > 0 && hours > 0) {
      const hourlyMin = Math.round((min / hours) * 10) / 10;
      const hourlyMax = Math.round((max / hours) * 10) / 10;
      return {
        priceText: `${hourlyMin}-${hourlyMax}元/小时`,
        hourlyRateMin: hourlyMin,
        hourlyRateMax: hourlyMax,
        isNegotiable: false
      };
    }
  }
  const singlePerHourMatch = salaryLine.match(/(\d+(?:\.\d+)?\s*[kKwW]?)\s*\/\s*(\d+(?:\.\d+)?)\s*(?:h|个?小时)/i);
  if (singlePerHourMatch) {
    const value = parseMoneyUnit(singlePerHourMatch[1]);
    const hours = parseFloat(singlePerHourMatch[2]);
    if (value > 0 && hours > 0) {
      const hourly = Math.round((value / hours) * 10) / 10;
      return {
        priceText: `${hourly}元/小时`,
        hourlyRateMin: hourly,
        hourlyRateMax: hourly,
        isNegotiable: false
      };
    }
  }

  // 4. 标准时薪：100-120/h、150/h、100-120元/小时、100-120元/个小时
  const stdRangeMatch = salaryLine.match(/(\d+(?:\.\d+)?\s*[kKwW]?)\s*[-~～]\s*(\d+(?:\.\d+)?\s*[kKwW]?)\s*\/\s*(?:h|个?小时|元)/i);
  if (stdRangeMatch) {
    const min = parseMoneyUnit(stdRangeMatch[1]);
    const max = parseMoneyUnit(stdRangeMatch[2]);
    if (min > 0 && max > 0) {
      return {
        priceText: `${min}-${max}元/小时`,
        hourlyRateMin: min,
        hourlyRateMax: max,
        isNegotiable: false
      };
    }
  }
  const stdSingleMatch = salaryLine.match(/(\d+(?:\.\d+)?\s*[kKwW]?)\s*\/\s*(?:h|个?小时|元)/i);
  if (stdSingleMatch) {
    const value = parseMoneyUnit(stdSingleMatch[1]);
    if (value > 0) {
      return {
        priceText: `${value}元/小时`,
        hourlyRateMin: value,
        hourlyRateMax: value,
        isNegotiable: false
      };
    }
  }

  // 5. 5. Fallback：使用后端的 salary_min/max
  //    但要判断后端值是否合理（比如 salary=8000 却没匹配到月薪，可能是数据异常）
  if (salaryMin && salaryMax && salaryMin > 0 && salaryMax > 0) {
    // 启发式：如果 salary >= 2000 且 raw_content 中有"月"字，按月薪处理
    const hasMonth = /月|包月|每月/.test(rawContent || '');
    if (salaryMin >= 2000 && hasMonth) {
      const hourlyMin = Math.round((salaryMin / 176) * 10) / 10;
      const hourlyMax = Math.round((salaryMax / 176) * 10) / 10;
      const rangeText = salaryMin === salaryMax
        ? `${salaryMin}元/月`
        : `${salaryMin}-${salaryMax}元/月`;
      return {
        priceText: `${rangeText}（约${hourlyMin}-${hourlyMax}元/小时）`,
        hourlyRateMin: hourlyMin,
        hourlyRateMax: hourlyMax,
        isNegotiable: false
      };
    }
    // 启发式：如果 salary >= 300 且 raw_content 中有"天"字，按日薪处理
    const hasDay = /\/\s*天|\/\s*日|每天/.test(rawContent || '');
    if (salaryMin >= 300 && hasDay) {
      const hourMatch = (rawContent || '').match(/(\d+(?:\.\d+)?)\s*(?:h|小时)/i);
      const hours = hourMatch ? parseFloat(hourMatch[1]) : 8;
      const hourlyMin = Math.round((salaryMin / hours) * 10) / 10;
      const hourlyMax = Math.round((salaryMax / hours) * 10) / 10;
      const rangeText = salaryMin === salaryMax
        ? `${salaryMin}元/天`
        : `${salaryMin}-${salaryMax}元/天`;
      return {
        priceText: `${rangeText}（约${hourlyMin}-${hourlyMax}元/小时）`,
        hourlyRateMin: hourlyMin,
        hourlyRateMax: hourlyMax,
        isNegotiable: false
      };
    }
    // 普通时薪
    const rangeText = salaryMin === salaryMax
      ? `${salaryMin}元/小时`
      : `${salaryMin}-${salaryMax}元/小时`;
    return {
      priceText: rangeText,
      hourlyRateMin: salaryMin,
      hourlyRateMax: salaryMax,
      isNegotiable: false
    };
  }

  // 6. 面议
  return {
    priceText: '面议',
    hourlyRateMin: 0,
    hourlyRateMax: 0,
    isNegotiable: true
  };
}
