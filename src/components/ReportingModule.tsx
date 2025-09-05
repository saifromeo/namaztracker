'use client';

import { useState, useEffect } from 'react';
import { ReportData, ReportFilters, FARZ_PRAYERS } from '@/types/namaz';
import { storage } from '@/lib/storage';

interface ReportingModuleProps {
  onClose?: () => void;
}

export default function ReportingModule({ onClose }: ReportingModuleProps) {
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
    endDate: new Date().toISOString().split('T')[0], // today
    includeNotes: false,
    sortBy: 'date',
    sortOrder: 'desc',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPeriod] = useState<'weekly' | 'monthly' | 'yearly'>('monthly');

  // Generate report data based on filters
  const generateReport = async () => {
    setIsLoading(true);
    
    try {
      const dailyRecords = storage.getDailyRecords(filters.startDate, filters.endDate);
      
      // Calculate totals
      const totalDays = dailyRecords.length;
      const totalPrayers = totalDays * FARZ_PRAYERS.length;
      const totalOffered = dailyRecords.reduce((sum, day) => sum + day.totalOffered, 0);
      const totalMissed = totalPrayers - totalOffered;
      const totalOnTime = dailyRecords.reduce((sum, day) => sum + day.totalOnTime, 0);
      const totalQaza = dailyRecords.reduce((sum, day) => sum + day.totalQaza, 0);
      const totalHome = dailyRecords.reduce((sum, day) => sum + day.totalHome, 0);
      const totalMasjid = dailyRecords.reduce((sum, day) => sum + day.totalMasjid, 0);
      const totalJumma = dailyRecords.reduce((sum, day) => sum + (day.totalJumma || 0), 0);
      const completionPercentage = totalPrayers > 0 
        ? Math.round((totalOffered / totalPrayers) * 100) 
        : 0;

      // Calculate prayer breakdown
      const prayerBreakdown: ReportData['prayerBreakdown'] = {};
      FARZ_PRAYERS.forEach(prayer => {
        const offered = dailyRecords.reduce((sum, day) => {
          const prayerRecord = day.prayers.find(p => p.prayerId === prayer.id);
          return sum + (prayerRecord?.isOffered ? 1 : 0);
        }, 0);
        const missed = totalDays - offered;
        const onTime = dailyRecords.reduce((sum, day) => {
          const prayerRecord = day.prayers.find(p => p.prayerId === prayer.id);
          return sum + (prayerRecord?.isOffered && prayerRecord.prayerType === 'on-time' ? 1 : 0);
        }, 0);
        const qaza = dailyRecords.reduce((sum, day) => {
          const prayerRecord = day.prayers.find(p => p.prayerId === prayer.id);
          return sum + (prayerRecord?.isOffered && prayerRecord.prayerType === 'qaza' ? 1 : 0);
        }, 0);
        const home = dailyRecords.reduce((sum, day) => {
          const prayerRecord = day.prayers.find(p => p.prayerId === prayer.id);
          return sum + (prayerRecord?.isOffered && prayerRecord.location === 'home' ? 1 : 0);
        }, 0);
        const masjid = dailyRecords.reduce((sum, day) => {
          const prayerRecord = day.prayers.find(p => p.prayerId === prayer.id);
          return sum + (prayerRecord?.isOffered && prayerRecord.location === 'masjid' ? 1 : 0);
        }, 0);
        const percentage = totalDays > 0 ? Math.round((offered / totalDays) * 100) : 0;
        
        prayerBreakdown[prayer.id] = {
          name: prayer.name,
          offered,
          missed,
          onTime,
          qaza,
          home,
          masjid,
          percentage,
        };
      });

      const report: ReportData = {
        period: selectedPeriod,
        startDate: filters.startDate,
        endDate: filters.endDate,
        totalDays,
        totalPrayers,
        totalOffered,
        totalMissed,
        totalOnTime,
        totalQaza,
        totalHome,
        totalMasjid,
        totalJumma,
        completionPercentage,
        dailyRecords,
        prayerBreakdown,
      };

      setReportData(report);
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Generate report on component mount and when filters change
  useEffect(() => {
    generateReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, selectedPeriod]);

  // Quick date range presets
  const setDateRange = (days: number) => {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000);
    
    setFilters(prev => ({
      ...prev,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
    }));
  };

  if (!reportData) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Generating report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Namaz Reporting & Analytics</h2>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        )}
      </div>

      {/* Filters Section */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="text-lg font-semibold mb-4">Report Filters</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as 'date' | 'completion' | 'prayer' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Date</option>
              <option value="completion">Completion %</option>
              <option value="prayer">Prayer Type</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order</label>
            <select
              value={filters.sortOrder}
              onChange={(e) => setFilters(prev => ({ ...prev, sortOrder: e.target.value as 'asc' | 'desc' }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
          </div>
        </div>

        {/* Quick Date Range Buttons */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-700 mr-2">Quick ranges:</span>
          <button
            onClick={() => setDateRange(7)}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Last 7 days
          </button>
          <button
            onClick={() => setDateRange(30)}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Last 30 days
          </button>
          <button
            onClick={() => setDateRange(90)}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Last 90 days
          </button>
          <button
            onClick={() => setDateRange(365)}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Last year
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3 sm:gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{reportData.totalDays}</div>
          <div className="text-sm text-blue-700">Total Days</div>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-green-600">{reportData.totalOffered}</div>
          <div className="text-sm text-green-700">Prayers Offered</div>
        </div>
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-blue-600">{reportData.totalOnTime}</div>
          <div className="text-sm text-blue-700">On Time</div>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-orange-600">{reportData.totalQaza}</div>
          <div className="text-sm text-orange-700">Qaza</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-700">{reportData.totalHome}</div>
          <div className="text-sm text-gray-700">Home</div>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-gray-700">{reportData.totalMasjid}</div>
          <div className="text-sm text-gray-700">Masjid</div>
        </div>
        <div className="bg-yellow-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-yellow-700">{reportData.totalJumma || 0}</div>
          <div className="text-sm text-yellow-700">Jumma (Fridays)</div>
        </div>
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-red-600">{reportData.totalMissed}</div>
          <div className="text-sm text-red-700">Prayers Missed</div>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <div className="text-2xl font-bold text-purple-600">{reportData.completionPercentage}%</div>
          <div className="text-sm text-purple-700">Overall Completion</div>
        </div>
      </div>

      {/* Prayer Breakdown */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Prayer Breakdown</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          {FARZ_PRAYERS.map((prayer) => {
            const breakdown = reportData.prayerBreakdown[prayer.id];
            const title = prayer.id === 'dhuhr' ? 'Dhuhr/Jumma' : prayer.name;
            return (
              <div key={prayer.id} className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-semibold text-gray-800 mb-2">{title}</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-green-600">Offered:</span>
                    <span className="font-medium">{breakdown.offered}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-blue-600">On Time:</span>
                    <span className="font-medium">{breakdown.onTime}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-orange-600">Qaza:</span>
                    <span className="font-medium">{breakdown.qaza}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Home:</span>
                    <span className="font-medium">{breakdown.home}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-700">Masjid:</span>
                    <span className="font-medium">{breakdown.masjid}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-600">Rate:</span>
                    <span className="font-medium">{breakdown.percentage}%</span>
                  </div>
                </div>
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full"
                      style={{ width: `${breakdown.percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Records Table */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Daily Records</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Offered
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  On Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Qaza
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Home
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Masjid
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Jumma
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Missed
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completion
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm">
              {reportData.dailyRecords.map((day) => (
                <tr key={day.date} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {new Date(day.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm text-green-600 font-medium">
                    {day.totalOffered}
                  </td>
                  <td className="px-4 py-3 text-sm text-blue-600 font-medium">
                    {day.totalOnTime}
                  </td>
                  <td className="px-4 py-3 text-sm text-orange-600 font-medium">
                    {day.totalQaza}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                    {day.totalHome}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                    {day.totalMasjid}
                  </td>
                  <td className="px-4 py-3 text-sm text-yellow-700 font-medium">
                    {day.totalJumma || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-red-600 font-medium">
                    {day.totalMissed}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${day.completionPercentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">{day.completionPercentage}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex flex-wrap gap-1">
                      {FARZ_PRAYERS.map((prayer) => {
                        const prayerRecord = day.prayers.find(p => p.prayerId === prayer.id);
                        const isFriday = new Date(day.date).getDay() === 5;
                        const displayName = isFriday && prayer.id === 'dhuhr' ? 'Jumma' : prayer.name;
                        if (!prayerRecord?.isOffered) {
                          return (
                            <span
                              key={prayer.id}
                              className="px-2 py-1 text-xs rounded bg-red-100 text-red-800"
                            >
                              {displayName}
                            </span>
                          );
                        }
                        return (
                          <span
                            key={prayer.id}
                            className={`px-2 py-1 text-xs rounded ${
                              prayerRecord.prayerType === 'on-time'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-orange-100 text-orange-800'
                            }`}
                          >
                            {displayName}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Options */}
      <div className="flex justify-end gap-2">
        <button
          onClick={() => {
            const dataStr = JSON.stringify(reportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `namaz-report-${filters.startDate}-to-${filters.endDate}.json`;
            link.click();
          }}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Export JSON
        </button>
        <button
          onClick={() => {
            const csvContent = generateCSV(reportData);
            const dataBlob = new Blob([csvContent], { type: 'text/csv' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `namaz-report-${filters.startDate}-to-${filters.endDate}.csv`;
            link.click();
          }}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Export CSV
        </button>
      </div>
    </div>
  );
}

// Helper function to generate CSV content
function generateCSV(reportData: ReportData): string {
  const headers = ['Date', 'Fajr', 'Dhuhr/Jumma', 'Asr', 'Maghrib', 'Isha', 'Total Offered', 'On Time', 'Qaza', 'Home', 'Masjid', 'Jumma', 'Total Missed', 'Completion %'];
  const rows = reportData.dailyRecords.map(day => {
    const prayerStatus = FARZ_PRAYERS.map(prayer => {
      const prayerRecord = day.prayers.find(p => p.prayerId === prayer.id);
      if (!prayerRecord?.isOffered) return 'Missed';
      return prayerRecord.prayerType === 'on-time' ? 'On Time' : 'Qaza';
    });
    
    return [
      day.date,
      ...prayerStatus,
      day.totalOffered,
      day.totalOnTime,
      day.totalQaza,
      day.totalHome,
      day.totalMasjid,
      day.totalJumma || 0,
      day.totalMissed,
      day.completionPercentage
    ].join(',');
  });
  
  return [headers.join(','), ...rows].join('\n');
}
