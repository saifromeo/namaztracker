'use client';

import { useState, useEffect } from 'react';
import { FARZ_PRAYERS, PrayerRecord } from '@/types/namaz';
import { storage } from '@/lib/storage';

interface DailyTrackerProps {
  date?: string;
}

export default function DailyTracker({ date }: DailyTrackerProps) {
  const [selectedDate, setSelectedDate] = useState(
    date || new Date().toISOString().split('T')[0]
  );
  const [prayerRecords, setPrayerRecords] = useState<PrayerRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load prayer records for the selected date
  useEffect(() => {
    const records = storage.getPrayerRecordsForDate(selectedDate);
    setPrayerRecords(records);
  }, [selectedDate]);

  // Handle prayer toggle
  const handlePrayerToggle = async (prayerId: string, isOffered: boolean, prayerType: 'on-time' | 'qaza' = 'on-time') => {
    setIsLoading(true);
    
    const existingRecord = prayerRecords.find(
      record => record.prayerId === prayerId
    );
    
    const record: PrayerRecord = {
      id: existingRecord?.id || `${selectedDate}-${prayerId}`,
      date: selectedDate,
      prayerId,
      isOffered,
      prayerType: isOffered ? prayerType : 'missed',
      offeredAt: isOffered ? new Date().toISOString() : undefined,
    };
    
    // Update local state
    const updatedRecords = prayerRecords.filter(r => r.prayerId !== prayerId);
    if (isOffered) {
      updatedRecords.push(record);
    }
    setPrayerRecords(updatedRecords);
    
    // Save to storage
    storage.updatePrayerRecord(record);
    
    setIsLoading(false);
  };

  // Get prayer record for a specific prayer
  const getPrayerRecord = (prayerId: string): PrayerRecord | undefined => {
    return prayerRecords.find(record => record.prayerId === prayerId);
  };

  // Calculate daily stats
  const totalPrayers = FARZ_PRAYERS.length;
  const offeredPrayers = prayerRecords.filter(r => r.isOffered).length;
  const missedPrayers = totalPrayers - offeredPrayers;
  const onTimePrayers = prayerRecords.filter(r => r.isOffered && r.prayerType === 'on-time').length;
  const qazaPrayers = prayerRecords.filter(r => r.isOffered && r.prayerType === 'qaza').length;
  const completionPercentage = totalPrayers > 0 
    ? Math.round((offeredPrayers / totalPrayers) * 100) 
    : 0;

  const isToday = selectedDate === new Date().toISOString().split('T')[0];
  const isPastDate = selectedDate < new Date().toISOString().split('T')[0];

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Daily Namaz Tracker</h2>
        
        {/* Date Selector */}
        <div className="mb-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label htmlFor="date-select" className="block text-sm font-medium text-gray-700 mb-2">
                Select Date
              </label>
              <input
                id="date-select"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  const currentDate = new Date(selectedDate);
                  currentDate.setDate(currentDate.getDate() - 1);
                  setSelectedDate(currentDate.toISOString().split('T')[0]);
                }}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                ← Previous Day
              </button>
              <button
                onClick={() => {
                  const currentDate = new Date(selectedDate);
                  currentDate.setDate(currentDate.getDate() + 1);
                  setSelectedDate(currentDate.toISOString().split('T')[0]);
                }}
                className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
              >
                Next Day →
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
              >
                Today
              </button>
              <button
                onClick={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  setSelectedDate(yesterday.toISOString().split('T')[0]);
                }}
                className="px-3 py-2 text-sm bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
              >
                Yesterday
              </button>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            {isToday 
              ? "Today's prayers" 
              : isPastDate
                ? `Editing ${new Date(selectedDate).toLocaleDateString()} (past date)`
                : `Editing ${new Date(selectedDate).toLocaleDateString()} (future date)`
            }
          </div>
        </div>

        {/* Daily Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-green-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-600">{offeredPrayers}</div>
            <div className="text-sm text-green-700">Prayers Offered</div>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-blue-600">{onTimePrayers}</div>
            <div className="text-sm text-blue-700">On Time</div>
          </div>
          <div className="bg-orange-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-orange-600">{qazaPrayers}</div>
            <div className="text-sm text-orange-700">Qaza</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-red-600">{missedPrayers}</div>
            <div className="text-sm text-red-700">Missed</div>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-gray-600">{completionPercentage}%</div>
            <div className="text-sm text-gray-700">Completion</div>
          </div>
        </div>
      </div>

      {/* Prayer List */}
      <div className="space-y-4">
        {FARZ_PRAYERS.map((prayer) => {
          const record = getPrayerRecord(prayer.id);
          const isOffered = record?.isOffered || false;
          const prayerType = record?.prayerType || 'missed';
          
          return (
            <div
              key={prayer.id}
              className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                isOffered
                  ? prayerType === 'on-time'
                    ? 'border-blue-200 bg-blue-50'
                    : 'border-orange-200 bg-orange-50'
                  : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {prayer.name}
                    </h3>
                    <span className="text-sm text-gray-600">
                      ({prayer.arabicName})
                    </span>
                    <span className="text-sm text-gray-500">
                      - {prayer.time}
                    </span>
                    {isOffered && (
                      <span className={`px-2 py-1 text-xs rounded ${
                        prayerType === 'on-time'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}>
                        {prayerType === 'on-time' ? 'On Time' : 'Qaza'}
                      </span>
                    )}
                  </div>
                  {record?.offeredAt && (
                    <p className="text-xs text-green-600 mt-1">
                      Offered at: {new Date(record.offeredAt).toLocaleTimeString()}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {!isOffered ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePrayerToggle(prayer.id, true, 'on-time')}
                        disabled={isLoading}
                        className="px-3 py-2 rounded-md text-sm font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
                      >
                        On Time
                      </button>
                      <button
                        onClick={() => handlePrayerToggle(prayer.id, true, 'qaza')}
                        disabled={isLoading}
                        className="px-3 py-2 rounded-md text-sm font-medium bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
                      >
                        Qaza
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handlePrayerToggle(prayer.id, false)}
                      disabled={isLoading}
                      className="px-4 py-2 rounded-md font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                    >
                      Mark as Missed
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Daily Progress</span>
          <span>{completionPercentage}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-green-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Quick Navigation Tips */}
      {isPastDate && (
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Editing Past Data</h4>
          <p className="text-sm text-blue-700">
            You can edit any past date's prayer data. Use the Previous/Next Day buttons or date picker to navigate to any date. 
            All changes are automatically saved and will be reflected in your reports.
          </p>
        </div>
      )}
    </div>
  );
}
