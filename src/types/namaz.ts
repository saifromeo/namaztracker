export interface Prayer {
  id: string;
  name: string;
  arabicName: string;
  time: string;
  isFarz: boolean;
}

export interface PrayerRecord {
  id: string;
  date: string; // YYYY-MM-DD format
  prayerId: string;
  isOffered: boolean;
  prayerType: 'on-time' | 'qaza' | 'missed'; // on-time, qaza (offered later), or missed
  offeredAt?: string; // ISO timestamp
  notes?: string;
}

export interface DailyRecord {
  date: string;
  prayers: PrayerRecord[];
  totalOffered: number;
  totalMissed: number;
  totalOnTime: number;
  totalQaza: number;
  completionPercentage: number;
}

export interface ReportData {
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  totalDays: number;
  totalPrayers: number;
  totalOffered: number;
  totalMissed: number;
  totalOnTime: number;
  totalQaza: number;
  completionPercentage: number;
  dailyRecords: DailyRecord[];
  prayerBreakdown: {
    [prayerId: string]: {
      name: string;
      offered: number;
      missed: number;
      onTime: number;
      qaza: number;
      percentage: number;
    };
  };
}

export interface ReportFilters {
  startDate: string;
  endDate: string;
  prayerTypes?: string[];
  includeNotes?: boolean;
  sortBy?: 'date' | 'completion' | 'prayer';
  sortOrder?: 'asc' | 'desc';
}

export const FARZ_PRAYERS: Prayer[] = [
  {
    id: 'fajr',
    name: 'Fajr',
    arabicName: 'الفجر',
    time: 'Dawn',
    isFarz: true,
  },
  {
    id: 'dhuhr',
    name: 'Dhuhr',
    arabicName: 'الظهر',
    time: 'Midday',
    isFarz: true,
  },
  {
    id: 'asr',
    name: 'Asr',
    arabicName: 'العصر',
    time: 'Afternoon',
    isFarz: true,
  },
  {
    id: 'maghrib',
    name: 'Maghrib',
    arabicName: 'المغرب',
    time: 'Sunset',
    isFarz: true,
  },
  {
    id: 'isha',
    name: 'Isha',
    arabicName: 'العشاء',
    time: 'Night',
    isFarz: true,
  },
];
