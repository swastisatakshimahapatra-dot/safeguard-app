import { useMemo } from "react";
import {
  FiShield,
  FiAlertCircle,
  FiTrendingUp,
  FiTrendingDown,
  FiMinus,
  FiUsers,
  FiCheck,
} from "react-icons/fi";
import { MdSecurity, MdTimer } from "react-icons/md";
import { BsShieldFillCheck } from "react-icons/bs";
import {
  calculateAnalytics,
  getSafetyScore,
  getTrendConfig,
} from "../services/analyticsService";

const AnalyticsWidget = ({ alerts = [] }) => {
  // ✅ Calculate analytics from alerts
  const analytics = useMemo(() => calculateAnalytics(alerts), [alerts]);
  const safetyScore = useMemo(() => getSafetyScore(analytics), [analytics]);
  const trendConfig = getTrendConfig(analytics.recentTrend);

  // ✅ Safety score color
  const getScoreColor = (score) => {
    if (score >= 80)
      return {
        text: "text-green-500",
        bg: "bg-green-50",
        border: "border-green-200",
      };
    if (score >= 60)
      return {
        text: "text-yellow-500",
        bg: "bg-yellow-50",
        border: "border-yellow-200",
      };
    return { text: "text-red-500", bg: "bg-red-50", border: "border-red-200" };
  };

  const scoreColor = getScoreColor(safetyScore);

  // ✅ Day bar chart max value
  const maxDayCount = Math.max(...Object.values(analytics.alertsByDay), 1);

  return (
    <div className="space-y-4">
      {/* Header */}
      <h3 className="text-base sm:text-lg font-bold text-[#1A1A2E]">
        📊 Safety Analytics
      </h3>

      {/* Top Row - Safety Score + Trend */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Safety Score */}
        <div
          className={`bg-white rounded-2xl p-5 border-2 ${scoreColor.border} text-center`}
        >
          <div
            className={`w-20 h-20 ${scoreColor.bg} rounded-full flex flex-col items-center justify-center mx-auto mb-3 border-4 ${scoreColor.border}`}
          >
            <span className={`text-2xl font-bold ${scoreColor.text}`}>
              {safetyScore}
            </span>
            <span className={`text-xs ${scoreColor.text}`}>/ 100</span>
          </div>
          <p className="font-bold text-[#1A1A2E] text-sm">Safety Score</p>
          <p className={`text-xs mt-1 font-semibold ${scoreColor.text}`}>
            {safetyScore >= 80
              ? "🟢 Excellent"
              : safetyScore >= 60
                ? "🟡 Fair"
                : "🔴 Needs Attention"}
          </p>
        </div>

        {/* Safe Days Streak */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 text-center">
          <div className="w-20 h-20 bg-green-50 rounded-full flex flex-col items-center justify-center mx-auto mb-3 border-4 border-green-200">
            <span className="text-2xl font-bold text-green-500">
              {analytics.safeDaysStreak}
            </span>
            <span className="text-xs text-green-500">days</span>
          </div>
          <p className="font-bold text-[#1A1A2E] text-sm">Safe Days Streak</p>
          <p className="text-gray-400 text-xs mt-1">
            {analytics.safeDaysStreak === 0
              ? "Alert triggered today"
              : analytics.safeDaysStreak === 1
                ? "Since yesterday"
                : `No alerts for ${analytics.safeDaysStreak} days`}
          </p>
        </div>

        {/* Trend */}
        <div
          className={`bg-white rounded-2xl p-5 border border-gray-100 text-center`}
        >
          <div
            className={`w-20 h-20 ${trendConfig.bg} rounded-full flex items-center justify-center mx-auto mb-3 border-4 border-gray-200 text-4xl`}
          >
            {trendConfig.icon}
          </div>
          <p className="font-bold text-[#1A1A2E] text-sm">Weekly Trend</p>
          <p className={`text-xs mt-1 font-semibold ${trendConfig.color}`}>
            {trendConfig.label}
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "This Week",
            value: analytics.thisWeekAlerts,
            icon: <FiAlertCircle />,
            color: "text-red-500",
            bg: "bg-red-50",
            suffix: analytics.thisWeekAlerts === 1 ? "alert" : "alerts",
          },
          {
            label: "This Month",
            value: analytics.thisMonthAlerts,
            icon: <MdSecurity />,
            color: "text-orange-500",
            bg: "bg-orange-50",
            suffix: analytics.thisMonthAlerts === 1 ? "alert" : "alerts",
          },
          {
            label: "Success Rate",
            value: `${analytics.successRate}%`,
            icon: <FiCheck />,
            color: "text-green-500",
            bg: "bg-green-50",
            suffix: "delivered",
          },
          {
            label: "Avg Contacts",
            value: analytics.avgResponseContacts,
            icon: <FiUsers />,
            color: "text-blue-500",
            bg: "bg-blue-50",
            suffix: "notified",
          },
        ].map((stat, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-4 border border-gray-100"
          >
            <div
              className={`w-9 h-9 ${stat.bg} rounded-xl flex items-center justify-center mb-3`}
            >
              <span className={`${stat.color} text-lg`}>{stat.icon}</span>
            </div>
            <p className="text-xl font-bold text-[#1A1A2E]">{stat.value}</p>
            <p className="text-gray-500 text-xs">{stat.label}</p>
            <p className="text-gray-400 text-xs">{stat.suffix}</p>
          </div>
        ))}
      </div>

      {/* Day of Week Chart */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <p className="font-bold text-[#1A1A2E] text-sm">
            📅 Alerts by Day of Week
          </p>
          {analytics.mostActiveDay !== "No alerts" && (
            <span className="text-xs text-gray-500">
              Most active:{" "}
              <strong className="text-[#E91E8C]">
                {analytics.mostActiveDay}
              </strong>
            </span>
          )}
        </div>

        {/* Bar Chart */}
        <div className="flex items-end justify-between gap-1 h-24">
          {Object.entries(analytics.alertsByDay).map(([day, count]) => {
            const height = maxDayCount > 0 ? (count / maxDayCount) * 100 : 0;
            const isMax = count === maxDayCount && count > 0;

            return (
              <div
                key={day}
                className="flex-1 flex flex-col items-center gap-1"
              >
                <span className="text-xs font-bold text-gray-500">
                  {count > 0 ? count : ""}
                </span>
                <div className="w-full flex items-end justify-center">
                  <div
                    className={`w-full rounded-t-lg transition-all duration-500 ${
                      isMax
                        ? "bg-gradient-to-t from-[#E91E8C] to-pink-400"
                        : count > 0
                          ? "bg-gradient-to-t from-blue-400 to-blue-300"
                          : "bg-gray-100"
                    }`}
                    style={{
                      height: count === 0 ? "4px" : `${Math.max(height, 15)}%`,
                      minHeight: "4px",
                    }}
                  ></div>
                </div>
                <span className="text-xs text-gray-400 font-medium">{day}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alert Types */}
      {Object.keys(analytics.alertsByType).length > 0 && (
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <p className="font-bold text-[#1A1A2E] text-sm mb-4">
            🔔 Alert Types Breakdown
          </p>
          <div className="space-y-3">
            {Object.entries(analytics.alertsByType).map(([type, count]) => {
              const percentage = Math.round(
                (count / analytics.totalAlerts) * 100,
              );
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-gray-600 text-xs font-medium">
                      {type}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-[#E91E8C] to-pink-400 transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Most Active Time */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100">
        <p className="font-bold text-[#1A1A2E] text-sm mb-4">
          🕐 Alert Timing Insights
        </p>
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-pink-50 border border-pink-100 rounded-xl p-4">
            <p className="text-gray-500 text-xs mb-1">Most Active Day</p>
            <p className="font-bold text-[#1A1A2E]">
              {analytics.mostActiveDay}
            </p>
            <p className="text-[#E91E8C] text-xs mt-1">
              Highest alert frequency
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <p className="text-gray-500 text-xs mb-1">Most Active Time</p>
            <p className="font-bold text-[#1A1A2E]">
              {analytics.mostActiveHour}
            </p>
            <p className="text-blue-500 text-xs mt-1">Peak alert hour</p>
          </div>
        </div>
      </div>

      {/* Last Alert Info */}
      {analytics.lastAlertDaysAgo !== null && (
        <div
          className={`rounded-2xl p-4 border flex items-center gap-3 ${
            analytics.lastAlertDaysAgo === 0
              ? "bg-red-50 border-red-200"
              : analytics.lastAlertDaysAgo < 7
                ? "bg-yellow-50 border-yellow-200"
                : "bg-green-50 border-green-200"
          }`}
        >
          <div className="text-2xl">
            {analytics.lastAlertDaysAgo === 0
              ? "🔴"
              : analytics.lastAlertDaysAgo < 7
                ? "🟡"
                : "🟢"}
          </div>
          <div>
            <p className="font-bold text-[#1A1A2E] text-sm">
              {analytics.lastAlertDaysAgo === 0
                ? "Alert triggered today"
                : analytics.lastAlertDaysAgo === 1
                  ? "Last alert was yesterday"
                  : `Last alert was ${analytics.lastAlertDaysAgo} days ago`}
            </p>
            <p className="text-gray-500 text-xs">
              {analytics.lastAlertDaysAgo >= 7
                ? "✅ Great! You have been safe for over a week!"
                : analytics.lastAlertDaysAgo >= 3
                  ? "⚠️ Stay alert and keep contacts updated"
                  : "🔴 Recent emergency - make sure you are safe"}
            </p>
          </div>
        </div>
      )}

      {/* Empty State */}
      {alerts.length === 0 && (
        <div className="bg-white rounded-2xl p-8 border border-gray-100 text-center">
          <BsShieldFillCheck className="text-5xl text-green-400 mx-auto mb-3" />
          <p className="font-bold text-[#1A1A2E]">No Alerts Yet!</p>
          <p className="text-gray-400 text-sm mt-1">
            Your analytics will appear here after your first alert
          </p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsWidget;
