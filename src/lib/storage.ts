import { PrayerRecord, DailyRecord } from '@/types/namaz';

const STORAGE_KEY = 'namaz-tracker-data';

export interface StoredData {
  prayerRecords: PrayerRecord[];
  lastUpdated: string;
}

export const storage = {
  // Get all prayer records from localStorage
  getPrayerRecords(): PrayerRecord[] {
    if (typeof window === 'undefined') return [];
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const data: StoredData = JSON.parse(stored);
      return data.prayerRecords || [];
    } catch (error) {
      console.error('Error loading prayer records:', error);
      return [];
    }
  },

  // Save prayer records to localStorage
  savePrayerRecords(records: PrayerRecord[]): void {
    if (typeof window === 'undefined') return;
    
    try {
      const data: StoredData = {
        prayerRecords: records,
        lastUpdated: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving prayer records:', error);
    }
  },

  // Add or update a prayer record
  updatePrayerRecord(record: PrayerRecord): void {
    const records = this.getPrayerRecords();
    const existingIndex = records.findIndex(
      r => r.date === record.date && r.prayerId === record.prayerId
    );
    
    if (existingIndex >= 0) {
      records[existingIndex] = record;
    } else {
      records.push(record);
    }
    
    this.savePrayerRecords(records);
  },

  // Get prayer records for a specific date
  getPrayerRecordsForDate(date: string): PrayerRecord[] {
    const records = this.getPrayerRecords();
    return records.filter(record => record.date === date);
  },

  // Get prayer records for a date range
  getPrayerRecordsForDateRange(startDate: string, endDate: string): PrayerRecord[] {
    const records = this.getPrayerRecords();
    return records.filter(record => 
      record.date >= startDate && record.date <= endDate
    );
  },

  // Get daily records for a date range
  getDailyRecords(startDate: string, endDate: string): DailyRecord[] {
    const records = this.getPrayerRecordsForDateRange(startDate, endDate);
    const dailyMap = new Map<string, PrayerRecord[]>();
    
    // Group records by date
    records.forEach(record => {
      if (!dailyMap.has(record.date)) {
        dailyMap.set(record.date, []);
      }
      dailyMap.get(record.date)!.push(record);
    });
    
    // Convert to DailyRecord format
    const dailyRecords: DailyRecord[] = [];
    const currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);
    
    while (currentDate <= endDateObj) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayRecords = dailyMap.get(dateStr) || [];
      
      const totalOffered = dayRecords.filter(r => r.isOffered).length;
      const totalMissed = dayRecords.filter(r => !r.isOffered).length;
      const totalOnTime = dayRecords.filter(r => r.isOffered && r.prayerType === 'on-time').length;
      const totalQaza = dayRecords.filter(r => r.isOffered && r.prayerType === 'qaza').length;
      const totalHome = dayRecords.filter(r => r.isOffered && r.location === 'home').length;
      const totalMasjid = dayRecords.filter(r => r.isOffered && r.location === 'masjid').length;
      const isFriday = new Date(dateStr).getDay() === 5;
      const totalJumma = isFriday ? (dayRecords.find(r => r.prayerId === 'dhuhr' && r.isOffered) ? 1 : 0) : 0;
      const completionPercentage = dayRecords.length > 0 
        ? Math.round((totalOffered / dayRecords.length) * 100) 
        : 0;
      
      dailyRecords.push({
        date: dateStr,
        prayers: dayRecords,
        totalOffered,
        totalMissed,
        totalOnTime,
        totalQaza,
        totalHome,
        totalMasjid,
        totalJumma,
        completionPercentage,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return dailyRecords;
  },

  // Clear all data
  clearAllData(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
  },
};
