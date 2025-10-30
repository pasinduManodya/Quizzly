import React, { useState, useEffect } from 'react';
import axios from 'axios';

interface AnalyticsData {
  overview: {
    users: {
      total: number;
      admins: number;
      guests: number;
      regular: number;
      newThisWeek: number;
    };
    documents: {
      total: number;
      newThisWeek: number;
    };
    quizzes: {
      total: number;
      newThisWeek: number;
    };
  };
  tokenAnalytics: {
    totalTokensUsed: number;
    averageDailyTokens: number;
    averageMonthlyTokens: number;
    maxTokensUsed: number;
    topUsers: Array<{
      email: string;
      totalTokens: number;
      subscriptionType: string;
      lastActivity: string;
    }>;
  };
  userActivity: {
    activeToday: number;
    activeThisWeek: number;
    activeThisMonth: number;
    dailyActivity: Array<{
      date: string;
      activeUsers: number;
    }>;
  };
  subscriptionAnalytics: Array<{
    type: string;
    count: number;
    totalTokens: number;
    averageTokens: number;
  }>;
  quizAnalytics: {
    averageScore: number;
    totalQuizzes: number;
    highScores: number;
    lowScores: number;
    successRate: number;
  };
  documentAnalytics: {
    averageQuestionsPerDoc: number;
    totalQuestions: number;
    averageDocSize: number;
  };
}

const AnalyticsOverview: React.FC = () => {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await axios.get('/api/admin/analytics');
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center text-red-600">
          <p>{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Analytics Overview</h2>
            <p className="text-gray-600 mt-1">Comprehensive system analytics and performance metrics</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-500">Last updated</p>
            <p className="text-sm font-medium text-gray-900">{new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Users */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">{formatNumber(analytics.overview.users.total)}</p>
              <p className="text-xs text-green-600">+{analytics.overview.users.newThisWeek} this week</p>
            </div>
          </div>
        </div>

        {/* Total Documents */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Documents</p>
              <p className="text-2xl font-semibold text-gray-900">{formatNumber(analytics.overview.documents.total)}</p>
              <p className="text-xs text-green-600">+{analytics.overview.documents.newThisWeek} this week</p>
            </div>
          </div>
        </div>

        {/* Total Quizzes */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Quizzes</p>
              <p className="text-2xl font-semibold text-gray-900">{formatNumber(analytics.overview.quizzes.total)}</p>
              <p className="text-xs text-green-600">+{analytics.overview.quizzes.newThisWeek} this week</p>
            </div>
          </div>
        </div>

        {/* Token Usage */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Tokens Used</p>
              <p className="text-2xl font-semibold text-gray-900">{formatNumber(analytics.tokenAnalytics.totalTokensUsed)}</p>
              <p className="text-xs text-gray-500">Avg: {formatNumber(analytics.tokenAnalytics.averageDailyTokens)}/day</p>
            </div>
          </div>
        </div>
      </div>

      {/* User Activity Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">User Activity (Last 30 Days)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{analytics.userActivity.activeToday}</p>
            <p className="text-sm text-blue-800">Active Today</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{analytics.userActivity.activeThisWeek}</p>
            <p className="text-sm text-green-800">Active This Week</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{analytics.userActivity.activeThisMonth}</p>
            <p className="text-sm text-purple-800">Active This Month</p>
          </div>
        </div>
        
        {/* Beautiful Line Chart */}
        <div className="h-64 relative">
          <svg className="w-full h-full" viewBox="0 0 800 200">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f3f4f6" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
            
            {/* Chart area */}
            {(() => {
              const data = analytics.userActivity.dailyActivity.slice(-30);
              const maxValue = Math.max(...data.map(d => d.activeUsers));
              const minValue = Math.min(...data.map(d => d.activeUsers));
              const range = maxValue - minValue || 1;
              
              // Calculate points for the line
              const points = data.map((day, index) => {
                const x = (index / (data.length - 1)) * 700 + 50;
                const y = 180 - ((day.activeUsers - minValue) / range) * 160;
                return `${x},${y}`;
              }).join(' ');
              
              // Create smooth curve using quadratic bezier curves
              const smoothPoints = data.map((day, index) => {
                const x = (index / (data.length - 1)) * 700 + 50;
                const y = 180 - ((day.activeUsers - minValue) / range) * 160;
                return { x, y, value: day.activeUsers, date: day.date };
              });
              
              let pathData = '';
              smoothPoints.forEach((point, index) => {
                if (index === 0) {
                  pathData += `M ${point.x} ${point.y}`;
                } else {
                  const prevPoint = smoothPoints[index - 1];
                  const cp1x = prevPoint.x + (point.x - prevPoint.x) / 3;
                  const cp1y = prevPoint.y;
                  const cp2x = point.x - (point.x - prevPoint.x) / 3;
                  const cp2y = point.y;
                  pathData += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${point.x} ${point.y}`;
                }
              });
              
              return (
                <>
                  {/* Area under the curve */}
                  <path
                    d={`${pathData} L 750 180 L 50 180 Z`}
                    fill="url(#gradient)"
                    opacity="0.3"
                  />
                  
                  {/* Line */}
                  <path
                    d={pathData}
                    fill="none"
                    stroke="#3b82f6"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  
                  {/* Data points */}
                  {smoothPoints.map((point, index) => (
                    <g key={index}>
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="4"
                        fill="#3b82f6"
                        stroke="white"
                        strokeWidth="2"
                      />
                      <circle
                        cx={point.x}
                        cy={point.y}
                        r="8"
                        fill="transparent"
                        className="hover:fill-blue-100 cursor-pointer"
                      />
                    </g>
                  ))}
                  
                  {/* Y-axis labels */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
                    const value = Math.round(minValue + (range * ratio));
                    const y = 180 - (ratio * 160);
                    return (
                      <g key={index}>
                        <line x1="45" y1={y} x2="50" y2={y} stroke="#6b7280" strokeWidth="1"/>
                        <text x="40" y={y + 4} textAnchor="end" className="text-xs fill-gray-600">
                          {value}
                        </text>
                      </g>
                    );
                  })}
                  
                  {/* X-axis labels */}
                  {smoothPoints.filter((_, index) => index % 5 === 0).map((point, index) => (
                    <g key={index}>
                      <line x1={point.x} y1="180" x2={point.x} y2="185" stroke="#6b7280" strokeWidth="1"/>
                      <text x={point.x} y="200" textAnchor="middle" className="text-xs fill-gray-600">
                        {new Date(point.date).getDate()}
                      </text>
                    </g>
                  ))}
                </>
              );
            })()}
            
            {/* Gradient definition */}
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.05"/>
              </linearGradient>
            </defs>
          </svg>
          
          {/* Chart title and legend */}
          <div className="absolute top-2 left-2">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-gray-700">Daily Active Users</span>
            </div>
          </div>
          
          {/* Hover tooltip */}
          <div className="absolute top-2 right-2 text-sm text-gray-500">
            Last 30 days
          </div>
        </div>
      </div>

      {/* Token Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Token Usage Stats with Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Token Usage Statistics</h3>
          
          {/* Token Usage Chart */}
          <div className="mb-6">
            <div className="h-32 relative">
              <svg className="w-full h-full" viewBox="0 0 400 120">
                {/* Background */}
                <rect width="100%" height="100%" fill="#f8fafc" rx="4"/>
                
                {/* Token usage bars */}
                {(() => {
                  const stats = [
                    { label: 'Daily Avg', value: analytics.tokenAnalytics.averageDailyTokens, color: '#3b82f6' },
                    { label: 'Monthly Avg', value: analytics.tokenAnalytics.averageMonthlyTokens, color: '#10b981' },
                    { label: 'Max User', value: analytics.tokenAnalytics.maxTokensUsed, color: '#f59e0b' }
                  ];
                  
                  const maxValue = Math.max(...stats.map(s => s.value));
                  
                  return stats.map((stat, index) => {
                    const barHeight = (stat.value / maxValue) * 80;
                    const x = 50 + (index * 100);
                    const y = 100 - barHeight;
                    
                    return (
                      <g key={index}>
                        {/* Bar */}
                        <rect
                          x={x - 15}
                          y={y}
                          width="30"
                          height={barHeight}
                          fill={stat.color}
                          rx="4"
                          opacity="0.8"
                        />
                        
                        {/* Value label */}
                        <text
                          x={x}
                          y={y - 5}
                          textAnchor="middle"
                          className="text-xs fill-gray-700 font-medium"
                        >
                          {formatNumber(stat.value)}
                        </text>
                        
                        {/* Category label */}
                        <text
                          x={x}
                          y="115"
                          textAnchor="middle"
                          className="text-xs fill-gray-600"
                        >
                          {stat.label}
                        </text>
                      </g>
                    );
                  });
                })()}
              </svg>
            </div>
          </div>
          
          {/* Detailed stats */}
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Average Daily Usage</span>
              </div>
              <span className="text-lg font-semibold text-blue-600">{formatNumber(analytics.tokenAnalytics.averageDailyTokens)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Average Monthly Usage</span>
              </div>
              <span className="text-lg font-semibold text-green-600">{formatNumber(analytics.tokenAnalytics.averageMonthlyTokens)}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">Highest Single User</span>
              </div>
              <span className="text-lg font-semibold text-yellow-600">{formatNumber(analytics.tokenAnalytics.maxTokensUsed)}</span>
            </div>
          </div>
        </div>

        {/* Subscription Analytics */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Subscription Distribution</h3>
          <div className="space-y-3">
            {analytics.subscriptionAnalytics.map((sub, index) => (
              <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="text-sm font-medium text-gray-700 capitalize">{sub.type}</span>
                  <p className="text-xs text-gray-500">{sub.count} users</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-gray-900">{formatNumber(sub.totalTokens)}</span>
                  <p className="text-xs text-gray-500">tokens</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quiz Performance */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quiz Performance Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{analytics.quizAnalytics.averageScore}%</p>
            <p className="text-sm text-blue-800">Average Score</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{analytics.quizAnalytics.successRate}%</p>
            <p className="text-sm text-green-800">Success Rate</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{analytics.quizAnalytics.highScores}</p>
            <p className="text-sm text-purple-800">High Scores (80%+)</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{analytics.quizAnalytics.lowScores}</p>
            <p className="text-sm text-red-800">Low Scores (&lt;50%)</p>
          </div>
        </div>
      </div>

      {/* Top Token Users */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Token Users</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subscription</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Tokens</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Activity</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics.tokenAnalytics.topUsers.map((user, index) => (
                <tr key={index}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.subscriptionType === 'premium' ? 'bg-purple-100 text-purple-800' :
                      user.subscriptionType === 'pro' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {user.subscriptionType || 'free'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatNumber(user.totalTokens)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(user.lastActivity)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Document Analytics */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{analytics.documentAnalytics.averageQuestionsPerDoc}</p>
            <p className="text-sm text-blue-800">Avg Questions per Doc</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">{formatNumber(analytics.documentAnalytics.totalQuestions)}</p>
            <p className="text-sm text-green-800">Total Questions Generated</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{formatNumber(analytics.documentAnalytics.averageDocSize)}</p>
            <p className="text-sm text-purple-800">Avg Document Size (chars)</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsOverview;
