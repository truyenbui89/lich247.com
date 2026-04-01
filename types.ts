
export interface SolarDate {
  day: number;
  month: number;
  year: number;
}

export interface LunarDate {
  day: number;
  month: number;
  year: number;
  leap: boolean;
  jd: number; // Julian Day
}

export interface CanChi {
  can: string;
  chi: string;
  name: string; // e.g. "Giáp Thìn"
}

export interface DayAdvice {
  should: string[];
  shouldNot: string[];
}

export type DayType = 'HOANG_DAO' | 'HAC_DAO' | 'NORMAL';

export interface FullDateInfo {
  solar: SolarDate;
  lunar: LunarDate;
  canChiYear: CanChi;
  canChiMonth: CanChi;
  canChiDay: CanChi;
  dayOfWeek: string;
  tietKhi: string; // Solar term
  gioHoangDao: string[]; // List of good hours
  truc: string; // 12 Officers
  xungKhac: string; // Conflicting ages
  tuHanhXung: string; // Quadruple conflicts
  advice: DayAdvice;
  dayType: DayType; // New field for Good/Bad day status
  isSpecialDay: boolean; // True if Hoang Dao AND Good Truc (Wedding/Business)
}

export interface HolidayEvent {
  name: string;
  date: Date;
  daysLeft: number;
  type: 'LUNAR' | 'SOLAR';
  originalDate: string; // e.g., "01/01"
  // New display fields
  dayOfWeek: string;
  solarDateStr: string;
  lunarDateStr: string;
}

export enum TabView {
  CALENDAR = 'CALENDAR',
  CONVERTER = 'CONVERTER',
  COUNTDOWN = 'COUNTDOWN',
  API = 'API'
}
