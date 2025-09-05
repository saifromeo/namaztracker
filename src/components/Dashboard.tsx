'use client';

import { useState, useEffect } from 'react';
import { DailyRecord, FARZ_PRAYERS } from '@/types/namaz';
import { storage } from '@/lib/storage';
import DailyTracker from './DailyTracker';
import ReportingModule from './ReportingModule';
// Auth temporarily disabled

type View = 'tracker' | 'reports' | 'dashboard';

export default function Dashboard() {
  // const { data: session, status } = useSession();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [todayStats, setTodayStats] = useState<DailyRecord | null>(null);
  const [weeklyStats, setWeeklyStats] = useState<DailyRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load dashboard data
  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = () => {
    setIsLoading(true);
    
    try {
      const today = new Date().toISOString().split('T')[0];
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      
      // Get today's stats
      const todayRecords = storage.getPrayerRecordsForDate(today);
      const todayOffered = todayRecords.filter(r => r.isOffered).length;
      const todayMissed = FARZ_PRAYERS.length - todayOffered;
      const todayOnTime = todayRecords.filter(r => r.isOffered && r.prayerType === 'on-time').length;
      const todayQaza = todayRecords.filter(r => r.isOffered && r.prayerType === 'qaza').length;
      const todayHome = todayRecords.filter(r => r.isOffered && r.location === 'home').length;
      const todayMasjid = todayRecords.filter(r => r.isOffered && r.location === 'masjid').length;
      const todayCompletion = FARZ_PRAYERS.length > 0 
        ? Math.round((todayOffered / FARZ_PRAYERS.length) * 100) 
        : 0;
      
      setTodayStats({
        date: today,
        prayers: todayRecords,
        totalOffered: todayOffered,
        totalMissed: todayMissed,
        totalOnTime: todayOnTime,
        totalQaza: todayQaza,
        totalHome: todayHome,
        totalMasjid: todayMasjid,
        completionPercentage: todayCompletion,
      });
      
      // Get weekly stats
      const weeklyRecords = storage.getDailyRecords(weekAgo, today);
      setWeeklyStats(weeklyRecords);
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate weekly summary
  const weeklySummary = weeklyStats.reduce(
    (acc, day) => ({
      totalOffered: acc.totalOffered + day.totalOffered,
      totalMissed: acc.totalMissed + day.totalMissed,
      totalOnTime: acc.totalOnTime + day.totalOnTime,
      totalQaza: acc.totalQaza + day.totalQaza,
      totalDays: acc.totalDays + 1,
    }),
    { totalOffered: 0, totalMissed: 0, totalOnTime: 0, totalQaza: 0, totalDays: 0 }
  );

  const weeklyCompletion = weeklySummary.totalDays > 0 
    ? Math.round((weeklySummary.totalOffered / (weeklySummary.totalDays * FARZ_PRAYERS.length)) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  // Auth gating disabled

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-800">Namaz Tracker</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setCurrentView('dashboard')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'dashboard'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setCurrentView('tracker')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'tracker'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Daily Tracker
              </button>
              <button
                onClick={() => setCurrentView('reports')}
                className={`px-3 py-2 rounded-md text-sm font-medium ${
                  currentView === 'reports'
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Reports
              </button>
              {/* Auth buttons disabled */}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {currentView === 'dashboard' && (
          <div className="px-4 py-6 sm:px-0">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Namaz Tracker</h2>
              <p className="text-gray-600">Track your daily prayers and monitor your spiritual journey.</p>
            </div>

            {/* Today's Progress */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Today&#39;s Progress</h3>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600">{todayStats?.totalOffered || 0}</div>
                    <div className="text-sm text-gray-600">Prayers Offered</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600">{todayStats?.totalOnTime || 0}</div>
                    <div className="text-sm text-gray-600">On Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600">{todayStats?.totalQaza || 0}</div>
                    <div className="text-sm text-gray-600">Qaza</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-red-600">{todayStats?.totalMissed || 0}</div>
                    <div className="text-sm text-gray-600">Prayers Missed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600">{todayStats?.completionPercentage || 0}%</div>
                    <div className="text-sm text-gray-600">Completion</div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Today&#39;s Progress</span>
                    <span>{todayStats?.completionPercentage || 0}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className="bg-green-500 h-3 rounded-full transition-all duration-300"
                      style={{ width: `${todayStats?.completionPercentage || 0}%` }}
                    ></div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <button
                    onClick={() => setCurrentView('tracker')}
                    className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    Update Today&#39;s Prayers
                  </button>
                </div>
              </div>
            </div>

            {/* Weekly Summary */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">This Week&#39;s Summary</h3>
              <div className="bg-white rounded-lg shadow p-6">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{weeklySummary.totalDays}</div>
                    <div className="text-sm text-gray-600">Days Tracked</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{weeklySummary.totalOffered}</div>
                    <div className="text-sm text-gray-600">Prayers Offered</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{weeklySummary.totalOnTime}</div>
                    <div className="text-sm text-gray-600">On Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{weeklySummary.totalQaza}</div>
                    <div className="text-sm text-gray-600">Qaza</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">{weeklyCompletion}%</div>
                    <div className="text-sm text-gray-600">Weekly Completion</div>
                  </div>
                </div>
                
                <div className="flex justify-center">
                  <button
                    onClick={() => setCurrentView('reports')}
                    className="px-6 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                  >
                    View Detailed Reports
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Quick Actions</h4>
                <div className="space-y-3">
                  <button
                    onClick={() => setCurrentView('tracker')}
                    className="w-full text-left p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <div className="font-medium text-blue-800">Track Today&#39;s Prayers</div>
                    <div className="text-sm text-blue-600">Mark your prayers as offered</div>
                  </button>
                  <button
                    onClick={() => setCurrentView('reports')}
                    className="w-full text-left p-3 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <div className="font-medium text-green-800">View Reports</div>
                    <div className="text-sm text-green-600">Analyze your prayer patterns</div>
                  </button>
                  <button
                    onClick={() => {
                      const yesterday = new Date();
                      yesterday.setDate(yesterday.getDate() - 1);
                      setCurrentView('tracker');
                      // We'll need to pass the date to the tracker
                      setTimeout(() => {
                        const dateInput = document.getElementById('date-select') as HTMLInputElement;
                        if (dateInput) {
                          dateInput.value = yesterday.toISOString().split('T')[0];
                          dateInput.dispatchEvent(new Event('change'));
                        }
                      }, 100);
                    }}
                    className="w-full text-left p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                  >
                    <div className="font-medium text-orange-800">Edit Yesterday&#39;s Prayers</div>
                    <div className="text-sm text-orange-600">Update or correct yesterday&#39;s data</div>
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h4 className="text-lg font-semibold text-gray-800 mb-3">Prayer Times</h4>
                <div className="space-y-2">
                  {FARZ_PRAYERS.map((prayer) => {
                    const prayerRecord = todayStats?.prayers.find(p => p.prayerId === prayer.id);
                    const isOffered = prayerRecord?.isOffered || false;
                    const prayerType = prayerRecord?.prayerType || 'missed';
                    
                    return (
                      <div key={prayer.id} className="flex justify-between items-center">
                        <span className="text-gray-700">{prayer.name}</span>
                        <span className={`px-2 py-1 text-xs rounded ${
                          isOffered 
                            ? prayerType === 'on-time'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-orange-100 text-orange-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {isOffered 
                            ? (prayerType === 'on-time' ? 'On Time' : 'Qaza')
                            : 'Pending'
                          }
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {currentView === 'tracker' && (
          <DailyTracker />
        )}

        {currentView === 'reports' && (
          <ReportingModule onClose={() => setCurrentView('dashboard')} />
        )}
      </main>
    </div>
  );
}
