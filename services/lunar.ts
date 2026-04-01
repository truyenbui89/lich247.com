
import { SolarDate, LunarDate, CanChi, FullDateInfo, DayAdvice, HolidayEvent, DayType } from '../types.ts';

// --- Constants & Data Tables ---

const CAN = ["Giáp", "Ất", "Bính", "Đinh", "Mậu", "Kỷ", "Canh", "Tân", "Nhâm", "Quý"];
const CHI = ["Tý", "Sửu", "Dần", "Mão", "Thìn", "Tỵ", "Ngọ", "Mùi", "Thân", "Dậu", "Tuất", "Hợi"];
const DAY_OF_WEEK = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
const TRUC = ["Kiến", "Trừ", "Mãn", "Bình", "Định", "Chấp", "Phá", "Nguy", "Thành", "Thâu", "Khai", "Bế"];

// Time ranges for Earthly Branches
const CHI_TIME = [
    "(23h-01h)", // Tý
    "(01h-03h)", // Sửu
    "(03h-05h)", // Dần
    "(05h-07h)", // Mão
    "(07h-09h)", // Thìn
    "(09h-11h)", // Tỵ
    "(11h-13h)", // Ngọ
    "(13h-15h)", // Mùi
    "(15h-17h)", // Thân
    "(17h-19h)", // Dậu
    "(19h-21h)", // Tuất
    "(21h-23h)"  // Hợi
];

// Tiết khí data (Solar Terms)
const TIET_KHI = [
  "Tiểu Hàn", "Đại Hàn", "Lập Xuân", "Vũ Thủy", "Kinh Trập", "Xuân Phân",
  "Thanh Minh", "Cốc Vũ", "Lập Hạ", "Tiểu Mãn", "Mang Chủng", "Hạ Chí",
  "Tiểu Thử", "Đại Thử", "Lập Thu", "Xử Thử", "Bạch Lộ", "Thu Phân",
  "Hàn Lộ", "Sương Giáng", "Lập Đông", "Tiểu Tuyết", "Đại Tuyết", "Đông Chí"
];

// Julian Day Calculation
function jdn(dd: number, mm: number, yy: number): number {
  const a = Math.floor((14 - mm) / 12);
  const y = yy + 4800 - a;
  const m = mm + 12 * a - 3;
  return dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
}

// Helper: Get max days in a solar month
export function getSolarDaysInMonth(month: number, year: number): number {
  return new Date(year, month, 0).getDate();
}

// --- Astronomical Helpers ---
const PI = Math.PI;

function getSunLongitude(jdn: number, timezone: number): number {
    const T = (jdn - 2451545.0 - timezone / 24.0) / 36525.0;
    const L0 = 280.46646 + 36000.76983 * T + 0.0003032 * T * T;
    const M = 357.52911 + 35999.05029 * T - 0.0001537 * T * T;
    const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(M * PI / 180) +
              (0.019993 - 0.000101 * T) * Math.sin(2 * M * PI / 180) +
              0.000289 * Math.sin(3 * M * PI / 180);
    let L = L0 + C; // True longitude
    L = L - 0.00569 - 0.00478 * Math.sin((125.04 - 1934.136 * T) * PI / 180);
    return L % 360; // Normalized to 0-360
}

// --- Robust Lunar Converter ---

function getLunarInfoSimple(dd: number, mm: number, yy: number): LunarDate {
    const date = new Date(yy, mm - 1, dd);
    
    // Switch to en-US for better compatibility with numeric stripping.
    const formatter = new Intl.DateTimeFormat('en-US-u-ca-chinese', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric',
    });
    
    const parts = formatter.formatToParts(date);
    
    // Initialize with Solar values as fallback
    let lDay = dd;
    let lMonth = mm;
    let lYear = yy; 
    
    parts.forEach(p => {
        // Remove non-digit characters to handle cases like "Year 2025" or "2025(Yi-Si)"
        const val = parseInt(p.value.replace(/\D/g, ''), 10);
        
        if (!isNaN(val)) {
            if (p.type === 'day') lDay = val;
            if (p.type === 'month') lMonth = val;
            // Handle both 'year' and 'relatedYear' property types
            if (p.type === 'year' || (p.type as string) === 'relatedYear') lYear = val;
        }
    });

    return {
        day: lDay,
        month: lMonth,
        year: lYear,
        leap: false, 
        jd: jdn(dd, mm, yy)
    };
}


// --- FEATURE CALCULATIONS ---

function getCanChiYear(year: number): CanChi {
  const can = CAN[(year + 6) % 10];
  const chi = CHI[(year + 8) % 12];
  return { can, chi, name: `${can} ${chi}` };
}

function getCanChiMonth(lMonth: number, lYear: number): CanChi {
  const yearCanIndex = (lYear + 6) % 10;
  const startCanIndex = (yearCanIndex % 5) * 2 + 2;
  const monthCan = CAN[(startCanIndex + (lMonth - 1)) % 10];
  const monthChi = CHI[(2 + (lMonth - 1)) % 12];
  return { can: monthCan, chi: monthChi, name: `${monthCan} ${monthChi}` };
}

function getCanChiDay(jd: number): CanChi {
  const can = CAN[(jd + 7) % 10];
  const chi = CHI[(jd + 1) % 12];
  return { can, chi, name: `${can} ${chi}` };
}

function getTietKhi(jd: number): string {
  const L = getSunLongitude(jd, 7);
  let index = Math.floor((L / 15) + 5) % 24;
  return TIET_KHI[index];
}

function getGioHoangDao(chiDayIndex: number): string[] {
    const map = [
        [0, 1, 3, 6, 8, 9], // Ty
        [2, 3, 5, 8, 10, 11], // Suu
        [0, 1, 4, 5, 7, 10], // Dan
        [0, 2, 3, 6, 7, 9], // Mao
        [2, 4, 5, 8, 9, 11], // Thin
        [1, 4, 6, 7, 10, 11], // Ty
        [0, 1, 3, 6, 8, 9], // Ngo (Same as Ty)
        [2, 3, 5, 8, 10, 11], // Mui (Same as Suu)
        [0, 1, 4, 5, 7, 10], // Than (Same as Dan)
        [0, 2, 3, 6, 7, 9], // Dau (Same as Mao)
        [2, 4, 5, 8, 9, 11], // Tuat (Same as Thin)
        [1, 4, 6, 7, 10, 11]  // Hoi (Same as Ty)
    ];
    
    // Return formatted string like "Tý (23h-01h)"
    const hours = map[chiDayIndex].map(h => `${CHI[h]} ${CHI_TIME[h]}`);
    return hours;
}

function getTruc(jd: number): string {
    return TRUC[Math.floor(jd) % 12];
}

function getXungKhac(chiDayIndex: number): string {
    const xung = CHI[(chiDayIndex + 6) % 12];
    return `Tuổi bị xung khắc: ${xung}`;
}

// Logic Tứ Hành Xung
function getTuHanhXung(chiDayIndex: number): string {
    // 0:Tý, 1:Sửu, 2:Dần, 3:Mão, 4:Thìn, 5:Tỵ, 6:Ngọ, 7:Mùi, 8:Thân, 9:Dậu, 10:Tuất, 11:Hợi
    const groups = [
        [2, 8, 5, 11], // Dần Thân Tỵ Hợi
        [0, 6, 3, 9],  // Tý Ngọ Mão Dậu
        [4, 10, 1, 7]  // Thìn Tuất Sửu Mùi
    ];
    
    const group = groups.find(g => g.includes(chiDayIndex));
    if (!group) return "";
    
    return group.map(i => CHI[i]).join(" • ");
}

function getDayAdvice(trucName: string): DayAdvice {
    const mapping: Record<string, DayAdvice> = {
        "Kiến": { should: ["Xuất hành", "Khai trương"], shouldNot: ["Đào đất", "An táng"] },
        "Trừ": { should: ["Giải trừ", "Chữa bệnh"], shouldNot: ["Cưới hỏi", "Đi xa"] },
        "Mãn": { should: ["Cúng tế", "Sửa kho", "Cưới hỏi"], shouldNot: ["Động thổ", "Tố tụng"] },
        "Bình": { should: ["Sửa nhà", "Đặt táng", "Cưới hỏi"], shouldNot: ["Khai trương", "Cầu tài"] },
        "Định": { should: ["Nhập học", "Mua bán", "Cưới hỏi"], shouldNot: ["Kiện tụng", "Chuyển nhà"] },
        "Chấp": { should: ["Lập khế ước", "Trồng trọt"], shouldNot: ["Xuất vốn", "Di dời"] },
        "Phá": { should: ["Phá dỡ", "Trừ hại"], shouldNot: ["Hội họp", "Khai trương", "Cưới hỏi"] },
        "Nguy": { should: ["Làm phước", "Lễ bái"], shouldNot: ["Đi thuyền", "Leo núi"] },
        "Thành": { should: ["Khai trương", "Cưới hỏi", "Nhập học"], shouldNot: ["Kiện tụng"] },
        "Thâu": { should: ["Thu tiền", "Cấy lúa"], shouldNot: ["An táng"] },
        "Khai": { should: ["Xuất hành", "Kết hôn", "Khai trương"], shouldNot: ["Động thổ"] },
        "Bế": { should: ["Đắp đập", "Xây tường"], shouldNot: ["Chữa mắt", "Khai trương"] },
    };
    return mapping[trucName] || { should: ["Làm việc thiện"], shouldNot: ["Làm việc ác"] };
}

// --- NEW FUNCTION: Calculate Hoang Dao (Good) / Hac Dao (Bad) Day ---
function getDayType(lunarMonth: number, dayChiIndex: number): DayType {
    // Mapping of Good Days (Chi Index) for each Lunar Month
    const goodDaysMap: Record<number, number[]> = {
        1: [0, 1, 5, 7],
        2: [2, 3, 7, 9],
        3: [4, 5, 9, 11],
        4: [6, 7, 1, 9],
        5: [8, 9, 1, 3],
        6: [10, 11, 3, 5],
        // Repeat for 7-12
        7: [0, 1, 5, 7],
        8: [2, 3, 7, 9],
        9: [4, 5, 9, 11],
        10: [6, 7, 1, 9],
        11: [8, 9, 1, 3],
        12: [10, 11, 3, 5]
    };

    const goodDays = goodDaysMap[lunarMonth] || [];
    
    if (goodDays.includes(dayChiIndex)) {
        return 'HOANG_DAO';
    } else {
        return 'HAC_DAO';
    }
}

// --- HOLIDAY LOGIC ---

const HOLIDAYS_CONFIG = [
  { name: "Tết Nguyên Đán", d: 1, m: 1, type: 'LUNAR' },
  { name: "Tết Dương Lịch", d: 1, m: 1, type: 'SOLAR' },
  { name: "Giỗ Tổ Hùng Vương", d: 10, m: 3, type: 'LUNAR' },
  { name: "Giải Phóng Miền Nam", d: 30, m: 4, type: 'SOLAR' },
  { name: "Quốc Tế Lao Động", d: 1, m: 5, type: 'SOLAR' },
  { name: "Tết Đoan Ngọ", d: 5, m: 5, type: 'LUNAR' },
  { name: "Lễ Vu Lan", d: 15, m: 7, type: 'LUNAR' },
  { name: "Quốc Khánh", d: 2, m: 9, type: 'SOLAR' },
  { name: "Tết Trung Thu", d: 15, m: 8, type: 'LUNAR' },
  { name: "Ông Công Ông Táo", d: 23, m: 12, type: 'LUNAR' }
];

export function getUpcomingHolidays(): HolidayEvent[] {
    const now = new Date();
    // Reset time to 0 to compare dates accurately
    now.setHours(0, 0, 0, 0);
    
    const currentYear = now.getFullYear();
    const currentLunar = getLunarInfoSimple(now.getDate(), now.getMonth() + 1, currentYear);
    
    const events: HolidayEvent[] = HOLIDAYS_CONFIG.map(h => {
        let targetDate: Date;
        
        if (h.type === 'SOLAR') {
            targetDate = new Date(currentYear, h.m - 1, h.d);
            // If passed, move to next year
            if (targetDate.getTime() < now.getTime()) {
                targetDate = new Date(currentYear + 1, h.m - 1, h.d);
            }
        } else {
            // LUNAR CALCULATION
            // 1. Convert Holiday Lunar Date (Current Lunar Year) -> Solar
            let s = convertLunarToSolar(h.d, h.m, currentLunar.year);
            targetDate = new Date(s.year, s.month - 1, s.day);
            
            // 2. If passed, use Next Lunar Year
            if (targetDate.getTime() < now.getTime()) {
                 s = convertLunarToSolar(h.d, h.m, currentLunar.year + 1);
                 targetDate = new Date(s.year, s.month - 1, s.day);
            }
        }
        
        const diffTime = Math.abs(targetDate.getTime() - now.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        // Calculate display details for the TARGET date
        const targetLunar = getLunarInfoSimple(targetDate.getDate(), targetDate.getMonth() + 1, targetDate.getFullYear());
        const dow = DAY_OF_WEEK[targetDate.getDay()];
        const solarDateStr = `${targetDate.getDate().toString().padStart(2, '0')}/${(targetDate.getMonth() + 1).toString().padStart(2, '0')}/${targetDate.getFullYear()}`;
        const lunarDateStr = `${targetLunar.day.toString().padStart(2, '0')}/${targetLunar.month.toString().padStart(2, '0')}`;

        return {
            name: h.name,
            date: targetDate,
            daysLeft: diffDays,
            type: h.type as 'LUNAR' | 'SOLAR',
            originalDate: `${h.d}/${h.m}`,
            // New display info
            dayOfWeek: dow,
            solarDateStr: solarDateStr,
            lunarDateStr: lunarDateStr
        };
    });
    
    // Sort by nearest date
    return events.sort((a, b) => a.daysLeft - b.daysLeft);
}

// --- MAIN EXPORT ---

export function getFullDateInfo(date: Date): FullDateInfo {
  const dd = date.getDate();
  const mm = date.getMonth() + 1;
  const yy = date.getFullYear();
  
  const jd = jdn(dd, mm, yy);
  const lunar = getLunarInfoSimple(dd, mm, yy);
  
  const canChiYear = getCanChiYear(lunar.year);
  const canChiMonth = getCanChiMonth(lunar.month, lunar.year);
  const canChiDay = getCanChiDay(jd);
  
  const tietKhi = getTietKhi(jd);
  const gioHoangDao = getGioHoangDao(CHI.indexOf(canChiDay.chi));
  const truc = getTruc(jd);
  const advice = getDayAdvice(truc);
  const xungKhac = getXungKhac(CHI.indexOf(canChiDay.chi));
  const tuHanhXung = getTuHanhXung(CHI.indexOf(canChiDay.chi));
  
  // Calculate Day Type
  const dayType = getDayType(lunar.month, CHI.indexOf(canChiDay.chi));

  // Determine if this is a "Very Good Day" (Special)
  // Logic: Must be Hoang Dao AND have a good Truc for Business/Wedding
  const goodTruc = ['Khai', 'Thành', 'Mãn', 'Bình', 'Định'];
  const isSpecialDay = dayType === 'HOANG_DAO' && goodTruc.includes(truc);

  return {
    solar: { day: dd, month: mm, year: yy },
    lunar: lunar,
    canChiYear,
    canChiMonth,
    canChiDay,
    dayOfWeek: DAY_OF_WEEK[date.getDay()],
    tietKhi,
    gioHoangDao,
    truc,
    xungKhac,
    tuHanhXung,
    advice,
    dayType,
    isSpecialDay
  };
}

export function convertLunarToSolar(lDay: number, lMonth: number, lYear: number): SolarDate {
  // Search range: From Jan 15 of Solar Year to Feb 20 of Next Solar Year
  // This covers the entire possible range of a Lunar Year
  const startSearch = new Date(lYear, 0, 15);
  const endSearch = new Date(lYear + 1, 1, 20);
  
  let current = new Date(startSearch);
  
  while (current < endSearch) {
      const l = getLunarInfoSimple(current.getDate(), current.getMonth() + 1, current.getFullYear());
      if (l.day === lDay && l.month === lMonth && l.year === lYear) {
          return {
              day: current.getDate(),
              month: current.getMonth() + 1,
              year: current.getFullYear()
          }
      }
      current.setDate(current.getDate() + 1);
  }

  // Fallback if not found (should rare)
  return { day: lDay, month: lMonth, year: lYear };
}

export function getMonthDays(month: number, year: number): FullDateInfo[] {
  const date = new Date(year, month - 1, 1);
  const days: FullDateInfo[] = [];
  
  while (date.getMonth() === month - 1) {
    days.push(getFullDateInfo(new Date(date)));
    date.setDate(date.getDate() + 1);
  }
  return days;
}
